# 🐳 Docker Setup Guide - ZideeBot WhatsApp

Panduan lengkap untuk menjalankan ZideeBot menggunakan Docker. Docker memudahkan deployment dan mengisolasi aplikasi dari sistem host.

---

## 📋 Prerequisites

Sebelum memulai, pastikan sudah terinstall:

### Windows

```bash
# Download dan install Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Cek instalasi
docker --version
docker-compose --version
```

### Linux

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Cek instalasi
docker --version
docker compose version
```

---

## 🚀 Quick Start (Cara Cepat)

### 1. Build dan Run dengan Docker Compose

```bash
# Clone atau pastikan sudah di folder bot
cd Bot_zidee

# Build image dan run container
docker-compose up -d

# Lihat logs untuk QR Code atau Pairing Code
docker-compose logs -f
```

### 2. Stop Bot

```bash
# Stop container
docker-compose down

# Stop dan hapus volumes (HATI-HATI: Session akan hilang!)
docker-compose down -v
```

---

## 🔧 Cara Penggunaan Detail

### Step 1: Build Docker Image

```bash
# Build image dengan tag
docker build -t zideebot:latest .

# Atau dengan docker-compose
docker-compose build
```

### Step 2: Run Container (Pertama Kali)

**Untuk Pairing Code:**

```bash
# Run dengan interactive mode untuk input pairing code
docker run -it --name zideebot \
  -v $(pwd)/session:/app/session \
  -v $(pwd)/temp:/app/temp \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/products:/app/products \
  zideebot:latest
```

**Dengan Docker Compose:**

```bash
# Edit docker-compose.yml jika perlu
# Lalu jalankan:
docker-compose up -d

# Lihat logs untuk pairing code
docker-compose logs -f zideebot
```

### Step 3: Koneksi WhatsApp

Bot akan menampilkan:

- **QR Code** (jika tidak ada session) - Scan dengan WhatsApp
- **Pairing Code** (jika menggunakan mode pairing) - Input di WhatsApp

Setelah terkoneksi, session akan tersimpan di folder `session/` dan tidak perlu scan ulang.

---

## 📁 Volume Management

Folder yang di-mount (persistent data):

```
./session       → /app/session     (Session WhatsApp - JANGAN DIHAPUS!)
./temp          → /app/temp        (File temporary)
./tmp           → /app/tmp         (File temporary)
./logs          → /app/logs        (Log files)
./data          → /app/data        (Data bot)
./products      → /app/products    (Data produk)
./assets        → /app/assets      (Assets)
./config.js     → /app/config.js   (Config - opsional)
./settings.js   → /app/settings.js (Settings - opsional)
```

**⚠️ PENTING:** Jangan hapus folder `session/` atau data koneksi WhatsApp akan hilang!

---

## 🛠️ Docker Commands Berguna

### Monitoring

```bash
# Lihat logs real-time
docker-compose logs -f

# Lihat logs 100 baris terakhir
docker-compose logs --tail=100

# Lihat status container
docker-compose ps

# Lihat resource usage
docker stats zideebot-whatsapp
```

### Container Management

```bash
# Start bot
docker-compose start

# Stop bot
docker-compose stop

# Restart bot
docker-compose restart

# Rebuild setelah update code
docker-compose up -d --build

# Hapus container (session tetap aman di volume)
docker-compose down
```

### Masuk ke Container (Debug)

```bash
# Masuk ke shell container
docker exec -it zideebot-whatsapp /bin/sh

# Run command di container
docker exec zideebot-whatsapp node -v

# Lihat file di container
docker exec zideebot-whatsapp ls -la /app/session
```

### Cleanup

```bash
# Hapus container yang tidak terpakai
docker container prune

# Hapus image yang tidak terpakai
docker image prune

# Hapus semua yang tidak terpakai (HATI-HATI!)
docker system prune -a

# Backup session sebelum cleanup
cp -r session session_backup
```

---

## ⚙️ Environment Variables

Edit file `docker-compose.yml` untuk menambah environment variables:

```yaml
environment:
  - NODE_ENV=production
  - TZ=Asia/Jakarta
  - OWNER_NUMBER=628xxx
  - BOT_NAME=ZideeBot
  - PREFIX=!
  # Tambahkan sesuai kebutuhan
```

Atau buat file `.env`:

```bash
# .env file
NODE_ENV=production
TZ=Asia/Jakarta
OWNER_NUMBER=628xxx
BOT_NAME=ZideeBot
```

Lalu edit `docker-compose.yml`:

```yaml
env_file:
  - .env
```

---

## 🔄 Update Bot

### Update Code

```bash
# Pull update dari git
git pull origin main

# Rebuild dan restart
docker-compose up -d --build

# Atau manual:
docker-compose down
docker-compose build
docker-compose up -d
```

### Update Dependencies

```bash
# Edit package.json
# Lalu rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Bot Tidak Mau Start

```bash
# Lihat logs error
docker-compose logs

# Cek container status
docker-compose ps

# Restart paksa
docker-compose restart

# Rebuild dari awal
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Session Hilang / Tidak Tersimpan

```bash
# Cek volume mounting
docker inspect zideebot-whatsapp | grep -A 10 Mounts

# Pastikan folder session ada
ls -la session/

# Cek permissions
chmod -R 777 session/
```

### Error ENOSPC (No Space Left)

```bash
# Clear temp files
docker exec zideebot-whatsapp rm -rf /app/temp/*

# Clear Docker cache
docker system prune -a

# Clear volumes yang tidak terpakai
docker volume prune
```

### Container Mati Terus (Restart Loop)

```bash
# Lihat logs kenapa crash
docker-compose logs --tail=100

# Run dalam interactive mode untuk debug
docker-compose run --rm zideebot sh

# Cek resource limits
docker stats
```

### Tidak Bisa Akses WhatsApp (Connection Failed)

```bash
# Cek network
docker exec zideebot-whatsapp ping google.com

# Restart container
docker-compose restart

# Hapus session dan scan ulang (last resort)
rm -rf session/*
docker-compose restart
```

---

## 📊 Resource Optimization

### Batasi CPU dan Memory

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: "1.0" # Max 1 CPU core
      memory: 1G # Max 1GB RAM
    reservations:
      cpus: "0.5" # Min 0.5 CPU
      memory: 512M # Min 512MB RAM
```

### Auto-restart Policy

```yaml
restart: unless-stopped # Selalu restart kecuali manual stop
# restart: always         # Selalu restart
# restart: on-failure     # Restart hanya jika error
# restart: no             # Tidak auto-restart
```

---

## 🔒 Security Tips

1. **Jangan commit session/** ke Git
2. **Gunakan .env** untuk data sensitif
3. **Update base image** secara berkala:
   ```bash
   docker pull node:18-alpine
   docker-compose build --no-cache
   ```
4. **Backup session** secara rutin:
   ```bash
   tar -czf session_backup_$(date +%Y%m%d).tar.gz session/
   ```

---

## 🚢 Deploy ke Server/VPS

### Copy Files ke Server

```bash
# Via SCP
scp -r Bot_zidee user@server-ip:/home/user/

# Via Git
git clone https://github.com/your-repo/Bot_zidee.git
cd Bot_zidee
```

### Run di Server

```bash
# SSH ke server
ssh user@server-ip

# Masuk ke folder bot
cd Bot_zidee

# Build dan run
docker-compose up -d

# Lihat logs
docker-compose logs -f
```

### Run di Background Permanent

```bash
# Dengan docker-compose
docker-compose up -d

# Bot akan auto-start setelah server reboot
# (jika restart policy = unless-stopped/always)
```

---

## 📦 Alternatif: Deploy ke Cloud

### Render.com / Railway.app

1. Connect repository GitHub
2. Pilih Dockerfile deployment
3. Set environment variables
4. Deploy!

### VPS (DigitalOcean, Linode, dll)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone your-repo
cd Bot_zidee

# Run
docker-compose up -d
```

---

## 📝 Package.json Scripts Update

Tambahkan scripts Docker di `package.json`:

```json
"scripts": {
  "docker:build": "docker-compose build",
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down",
  "docker:logs": "docker-compose logs -f",
  "docker:restart": "docker-compose restart",
  "docker:rebuild": "docker-compose up -d --build"
}
```

Usage:

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

---

## ✅ Checklist Setup

- [ ] Docker Desktop/Engine terinstall
- [ ] File Dockerfile sudah ada
- [ ] File docker-compose.yml sudah ada
- [ ] File .dockerignore sudah ada
- [ ] Folder session/, temp/, logs/ sudah dibuat
- [ ] Build image: `docker-compose build`
- [ ] Run container: `docker-compose up -d`
- [ ] Scan QR/Input Pairing Code
- [ ] Cek logs: `docker-compose logs -f`
- [ ] Bot connected dan running! 🎉

---

## 🆘 Support

Jika ada masalah:

1. Cek logs: `docker-compose logs`
2. Cek troubleshooting section di atas
3. Restart: `docker-compose restart`
4. Rebuild: `docker-compose build --no-cache && docker-compose up -d`

---

**Happy Dockering! 🐳🚀**
