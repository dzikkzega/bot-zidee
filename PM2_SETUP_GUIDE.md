# ZideeBot PM2 Setup Guide

Bot WhatsApp ini sekarang menggunakan PM2 untuk process management yang lebih stabil dan mudah dikelola.

## 🚀 Quick Start

### 1. Setup PM2 (First Time)

```bash
# Jalankan setup script
setup-pm2.bat

# Atau manual:
npm install
npm install -g pm2
```

### 2. Start Bot

```bash
# Menggunakan batch file (Recommended)
run-bot.bat

# Atau menggunakan npm script
npm run pm2:start
```

### 3. Manage Bot

```bash
# Menggunakan PM2 Manager (Interactive)
pm2-manager.bat

# Atau menggunakan npm scripts
npm run pm2:status     # Cek status bot
npm run pm2:logs       # Lihat logs real-time
npm run pm2:restart    # Restart bot
npm run pm2:stop       # Stop bot
npm run pm2:reload     # Reload bot (zero downtime)
```

## 📋 Available Commands

### NPM Scripts

- `npm run pm2:start` - Start bot with PM2
- `npm run pm2:stop` - Stop bot
- `npm run pm2:restart` - Restart bot
- `npm run pm2:reload` - Reload bot (zero downtime)
- `npm run pm2:delete` - Delete bot process
- `npm run pm2:logs` - View logs real-time
- `npm run pm2:monit` - Open PM2 monitoring dashboard
- `npm run pm2:status` - Check bot status

### Batch Files

- `setup-pm2.bat` - Initial setup
- `run-bot.bat` - Start bot
- `pm2-manager.bat` - Interactive management interface

## 📊 Monitoring

### Real-time Monitoring

```bash
npm run pm2:monit
```

Atau

```bash
pm2 monit
```

### Logs

```bash
# Real-time logs
npm run pm2:logs

# View log files
# - logs/combined.log (semua logs)
# - logs/out.log (output logs)
# - logs/error.log (error logs)
```

### Status Check

```bash
npm run pm2:status
# atau
pm2 status
```

## ⚙️ Configuration

File konfigurasi: `ecosystem.config.js`

### Features yang aktif:

- ✅ Auto restart jika crash
- ✅ Memory limit 512MB
- ✅ Memory optimization
- ✅ Log rotation
- ✅ Process monitoring
- ✅ Graceful shutdown

### Memory Management

Bot akan otomatis restart jika memory usage > 512MB untuk mencegah memory leak.

## 🔧 Advanced Usage

### Production Mode

```bash
pm2 start ecosystem.config.js --env production
```

### Cluster Mode (Multi-instance)

Edit `ecosystem.config.js`:

```javascript
instances: 'max', // Use all CPU cores
exec_mode: 'cluster'
```

### Auto Start on System Boot

```bash
pm2 startup
pm2 save
```

## 🚨 Troubleshooting

### Bot tidak start

1. Cek status: `npm run pm2:status`
2. Lihat logs: `npm run pm2:logs`
3. Restart: `npm run pm2:restart`

### Memory issues

1. Cek memory usage: `pm2 monit`
2. Restart jika perlu: `npm run pm2:restart`

### Logs tidak muncul

1. Cek folder `logs/`
2. Pastikan permissions OK
3. Restart PM2: `pm2 kill && npm run pm2:start`

## 📁 File Structure

```
Bot_zidee/
├── ecosystem.config.js    # PM2 configuration
├── setup-pm2.bat         # Setup script
├── run-bot.bat           # Start script
├── pm2-manager.bat       # Management interface
├── logs/                 # Log files
│   ├── combined.log
│   ├── out.log
│   └── error.log
└── ...
```

## 💡 Tips

1. **Monitor Memory**: Selalu cek memory usage dengan `pm2 monit`
2. **Log Rotation**: Logs akan otomatis di-rotate untuk mencegah file besar
3. **Graceful Restart**: Gunakan `pm2:reload` untuk restart tanpa downtime
4. **Backup Session**: Session files tetap aman saat restart

## 🆚 PM2 vs NPM Run Dev

| Feature            | NPM Run Dev | PM2 |
| ------------------ | ----------- | --- |
| Auto Restart       | ❌          | ✅  |
| Memory Monitoring  | ❌          | ✅  |
| Log Management     | ❌          | ✅  |
| Process Monitoring | ❌          | ✅  |
| Production Ready   | ❌          | ✅  |
| Zero Downtime      | ❌          | ✅  |

## 📞 Support

Jika ada masalah dengan PM2 setup, cek:

1. PM2 documentation: https://pm2.keymetrics.io/
2. Bot logs di folder `logs/`
3. PM2 status: `pm2 status`
