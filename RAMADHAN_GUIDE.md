# 🕌 Ramadhan Auto-Scheduler

Fitur otomatis untuk mengirim reminder **Sahur** dan **Berbuka Puasa** dengan hidetag (mention semua member grup) pada waktu yang sudah ditentukan.

---

## 🎯 Fitur

- ✅ **Auto Reminder Sahur** - Jam **03:30 WIB** setiap hari
- ✅ **Auto Reminder Berbuka** - Waktu **Maghrib dinamis** (dari API real-time)
- ✅ **Enable/Disable per Grup** - Admin bisa aktifkan/nonaktifkan
- ✅ **Custom Pesan** - Admin bisa ubah pesan sahur & berbuka
- ✅ **Test Mode** - Test kirim reminder sebelum waktu sebenarnya
- ✅ **Logging System** - Semua aktivitas tercatat di log

---

## 📋 Command (Khusus Admin)

### Aktifkan Fitur
```
.ramadhan on
```
Aktifkan auto-reminder sahur & berbuka di grup ini.
**Catatan**: Bot harus admin untuk bisa mention semua member!

### Nonaktifkan Fitur
```
.ramadhan off
```
Nonaktifkan auto-reminder di grup ini.

### Cek Status
```
.ramadhan status
```
Lihat status scheduler, jadwal, pesan yang digunakan, dan statistik.

### Custom Pesan Sahur
```
.ramadhan setsahur <pesan custom>
```
**Contoh**:
```
.ramadhan setsahur 🌙 Selamat sahur! Semoga lancar puasanya hari ini 🤲
```

### Custom Pesan Berbuka
```
.ramadhan setiftar <pesan custom>
```
atau
```
.ramadhan setberbuka <pesan custom>
```
**Contoh**:
```
.ramadhan setiftar 🌅 Alhamdulillah, waktu berbuka tiba! Selamat berbuka puasa 🍽️
```

### Test Reminder
```
.ramadhan test sahur
.ramadhan test iftar
```
Kirim test reminder untuk memastikan pesan dan hidetag berfungsi dengan baik.

### Help/Menu
```
.ramadhan help
.ramadhan menu
```
Tampilkan daftar command dan cara penggunaan.

---

## ⏰ Jadwal Otomatis

### 🌙 Sahur
- **Waktu**: **03:30 WIB** (Fixed)
- **Frekuensi**: Setiap hari
- **Pesan Default**:
  ```
  🌙 Selamat sahur semuanya.
  
  Semoga Allah memberikan kekuatan dan kelancaran 
  dalam menjalankan puasa hari ini. Jangan lupa niat ya 🤲
  ```

### 🌅 Berbuka (Maghrib)
- **Waktu**: **Dinamis** - Diambil dari API waktu sholat
- **Update**: Setiap hari jam **00:01 WIB**
- **API**: Aladhan Prayer Times API (Jakarta, Indonesia)
- **Fallback**: Jika API error, gunakan **18:00 WIB**
- **Pesan Default**:
  ```
  🌅 Waktu berbuka telah tiba.
  
  Selamat berbuka puasa, semoga Allah menerima 
  amal ibadah kita hari ini 🤲
  ```

---

## 🔒 Persyaratan

1. **Bot harus admin** di grup (untuk hidetag/mention semua member)
2. **Sender harus admin** grup (untuk menggunakan command)
3. **Aktifkan dengan** `.ramadhan on` per grup

---

## 📊 Logging System

Semua aktivitas scheduler dicatat di:
```
logs/ramadhan.log
```

Log mencakup:
- ✅ Enable/disable per grup
- ✅ Waktu maghrib yang di-fetch
- ✅ Reminder yang terkirim (sukses/gagal)
- ✅ Update custom pesan
- ✅ Error handling

---

## 💡 Tips & Best Practices

### Untuk Admin Grup:
1. **Aktifkan sebelum Ramadhan dimulai** - Agar scheduler sudah siap
2. **Test dulu** - Gunakan `.ramadhan test sahur` dan `.ramadhan test iftar` untuk cek
3. **Custom pesan** - Sesuaikan dengan bahasa dan gaya grup
4. **Cek status berkala** - Gunakan `.ramadhan status` untuk monitoring

### Untuk Owner Bot:
1. **Pastikan timezone WIB** - Server harus set ke Asia/Jakarta
2. **Monitor logs** - Cek `logs/ramadhan.log` untuk debugging
3. **Backup data** - File `data/ramadhan_groups.json` jangan dihapus
4. **API Monitoring** - Cek apakah API Aladhan accessible

---

## 🐛 Troubleshooting

### Bot tidak kirim reminder
✅ **Solusi**:
1. Cek status: `.ramadhan status`
2. Pastikan bot admin di grup
3. Pastikan scheduler aktif (`.ramadhan on`)
4. Cek logs: `logs/ramadhan.log`

### Waktu maghrib tidak akurat
✅ **Solusi**:
- API update setiap hari jam 00:01 WIB
- Jika API error, gunakan waktu fallback 18:00
- Cek logs untuk error fetch API

### Pesan tidak mention semua member
✅ **Solusi**:
- Bot **HARUS** admin di grup
- Upgrade bot ke admin jika belum

### Command tidak berfungsi
✅ **Solusi**:
- Pastikan sender adalah admin grup
- Pastikan menggunakan prefix yang benar (`.`)
- Restart bot jika perlu

---

## 📁 File Structure

```
commands/
  └── ramadhan.js          # Command handler

lib/
  └── scheduler.js         # Core scheduler system

data/
  └── ramadhan_groups.json # Storage grup yang aktif

logs/
  └── ramadhan.log         # Activity logs
```

---

## 🔄 Cara Kerja System

### 1. Initialization (Bot Start)
```javascript
Bot Start → Load ramadhan_groups.json → Init Cron Jobs
```

### 2. Sahur Flow
```
Every Day 03:30 WIB
  ↓
Get enabled groups
  ↓
For each group:
  - Get custom message or default
  - Fetch group members
  - Send hidetag message
  - Log activity
```

### 3. Maghrib Flow
```
Every Day 00:01 WIB
  ↓
Fetch maghrib time from API
  ↓
Schedule cron job for today's maghrib
  ↓
At Maghrib time:
  - Get enabled groups
  - Send iftar reminder
  - Log activity
```

---

## 🚀 Deployment

### Local/VPS
Scheduler otomatis jalan saat bot start. Tidak perlu setup tambahan.

### Docker
Scheduler sudah include di Docker image. Pastikan:
1. Timezone container = Asia/Jakarta
2. Volume `data/` dan `logs/` mounted
3. Port internet accessible (untuk fetch API)

---

## 📞 Support

Jika ada masalah atau bug:
1. Cek logs: `logs/ramadhan.log`
2. Test command: `.ramadhan test sahur`
3. Restart bot
4. Hubungi developer jika masih bermasalah

---

**Ramadan Mubarak! 🌙✨**
