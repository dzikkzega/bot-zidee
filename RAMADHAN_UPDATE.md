# 📝 Update Log - Ramadhan Auto-Scheduler

**Date**: 19 February 2026  
**Version**: 3.0.6  
**Feature**: Auto Sahur & Iftar Reminder System

---

## 🎉 What's New

### ✨ Ramadhan Auto-Scheduler System
Fitur otomatis untuk mengirim reminder **Sahur** dan **Berbuka Puasa** ke semua member grup menggunakan hidetag.

---

## 📦 New Files Added

```
lib/
  └── scheduler.js               # Core Ramadhan Scheduler System

commands/
  └── ramadhan.js                # Command handler (.ramadhan)

data/
  └── ramadhan_groups.json       # Storage for enabled groups

logs/
  └── ramadhan.log               # Activity logs (auto-created)

RAMADHAN_GUIDE.md                # Complete user guide
```

---

## 🔧 Modified Files

### 1. **package.json**
- Added dependency: `node-cron@^3.0.3`

### 2. **index.js**
- Import `RamadhanScheduler`
- Initialize scheduler saat bot connect
- Global variable: `global.ramadhanScheduler`

### 3. **main.js**
- Import `ramadhanCommand`
- Add command handler untuk `.ramadhan`
- Add to command list

---

## 🎯 Features

### Auto-Scheduler
- **Sahur**: 03:30 WIB (fixed) - Daily
- **Berbuka**: Maghrib (dynamic dari API) - Daily
- **API**: Aladhan Prayer Times API
- **Timezone**: Asia/Jakarta (WIB)

### Admin Commands
```
.ramadhan on                     # Enable di grup
.ramadhan off                    # Disable di grup
.ramadhan status                 # Cek status
.ramadhan setsahur <message>     # Custom pesan sahur
.ramadhan setiftar <message>     # Custom pesan berbuka
.ramadhan test sahur             # Test reminder sahur
.ramadhan test iftar             # Test reminder berbuka
.ramadhan help                   # Show help menu
```

### Permissions
- ✅ Admin grup only
- ✅ Bot harus admin (untuk hidetag)
- ✅ Enable/disable per grup

---

## 🔄 How It Works

### Scheduler Flow
```
Bot Start
  ↓
Load ramadhan_groups.json
  ↓
Initialize Cron Jobs:
  1. Sahur: 03:30 WIB daily
  2. Maghrib Fetch: 00:01 WIB daily
  3. Iftar: Dynamic (maghrib time)
  ↓
Ready to send reminders!
```

### Reminder Flow
```
Scheduled Time Reached
  ↓
Get list of enabled groups
  ↓
For each group:
  - Get custom message or default
  - Fetch all group members
  - Send hidetag message (mention all)
  - Log activity
  - Delay 2s (rate limit prevention)
```

---

## 📊 Default Messages

### Sahur (03:30 WIB)
```
🌙 Selamat sahur semuanya.

Semoga Allah memberikan kekuatan dan kelancaran 
dalam menjalankan puasa hari ini. Jangan lupa niat ya 🤲
```

### Berbuka (Maghrib)
```
🌅 Waktu berbuka telah tiba.

Selamat berbuka puasa, semoga Allah menerima 
amal ibadah kita hari ini 🤲
```

Admin bisa custom pesan ini dengan command `.ramadhan setsahur` dan `.ramadhan setiftar`.

---

## 🐳 Docker Support

Scheduler fully compatible dengan Docker deployment:
- ✅ Timezone WIB sudah diset
- ✅ Volumes untuk data & logs
- ✅ Auto-start saat container start
- ✅ Cron jobs persistent

### Rebuild Docker
```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

---

## 📝 Logging System

All scheduler activities logged to: `logs/ramadhan.log`

### Log Format
```
[2026-02-19 03:30:00] Sending Sahur reminder to 3 groups...
[2026-02-19 03:30:02] ✅ Sahur reminder sent to group: 12036xxx@g.us
[2026-02-19 03:30:04] ✅ Sahur reminder sent to group: 12036yyy@g.us
[2026-02-19 00:01:00] Fetching new Maghrib time for today...
[2026-02-19 00:01:02] Maghrib time fetched: 18:15 WIB
[2026-02-19 00:01:02] Maghrib reminder scheduled at 18:15 WIB
```

---

## 🔧 Installation

### For Existing Bot Users

1. **Update code**:
   ```bash
   git pull origin main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Restart bot**:
   ```bash
   # Local/VPS
   pm2 restart zideebot
   
   # Docker
   docker compose restart
   ```

4. **Verify initialization**:
   Check console output for:
   ```
   🕌 Ramadhan Scheduler initialized!
   🕌 Maghrib time fetched: XX:XX WIB
   ```

---

## ⚙️ Configuration

### Timezone (Important!)
Ensure server timezone is set to **Asia/Jakarta (WIB)**:

```bash
# Check current timezone
timedatectl

# Set to Jakarta
sudo timedatectl set-timezone Asia/Jakarta
```

For Docker, already configured in `docker-compose.yml`:
```yaml
environment:
  - TZ=Asia/Jakarta
```

### API Configuration
Uses **Aladhan Prayer Times API**:
- Endpoint: `https://api.aladhan.com/v1/timingsByCity`
- City: Jakarta
- Country: Indonesia
- Method: ISNA (Islamic Society of North America)
- **Fallback**: 18:00 WIB if API fails

---

## 🐛 Known Issues & Solutions

### Issue: Scheduler tidak jalan
**Solution**:
- Restart bot
- Check logs: `logs/ramadhan.log`
- Verify timezone: `TZ=Asia/Jakarta`

### Issue: Maghrib time tidak update
**Solution**:
- Check internet connection
- API fetches every day at 00:01 WIB
- Falls back to 18:00 if API down

### Issue: Reminder tidak mention semua member
**Solution**:
- **Bot MUST be admin** in the group
- Promote bot to admin
- Test with `.ramadhan test sahur`

---

## 📚 Documentation

Complete guide available in: **[RAMADHAN_GUIDE.md](RAMADHAN_GUIDE.md)**

Topics covered:
- ✅ Features overview
- ✅ All commands with examples
- ✅ Schedule details
- ✅ Requirements
- ✅ Logging system
- ✅ Tips & best practices
- ✅ Troubleshooting
- ✅ Deployment guide

---

## 🚀 Future Enhancements (Planned)

- [ ] Support multiple timezones
- [ ] Custom schedule per group
- [ ] Ramadan countdown feature
- [ ] Statistics dashboard
- [ ] Notification before sahur (10 min reminder)
- [ ] Doa berbuka otomatis
- [ ] Integration with Quran API for daily ayat

---

## 🙏 Credits

- **Scheduler**: node-cron
- **Prayer Times API**: Aladhan.com
- **Developer**: Zidee
- **Framework**: Baileys (WhatsApp Multi-Device)

---

## 📞 Support

If you encounter issues:
1. Check `logs/ramadhan.log`
2. Use `.ramadhan test sahur` to test
3. Verify bot is admin in group
4. Check [RAMADHAN_GUIDE.md](RAMADHAN_GUIDE.md)
5. Open GitHub issue if problem persists

---

**Ramadan Mubarak! 🌙✨**  
*May this feature benefit all Muslims during the blessed month.*
