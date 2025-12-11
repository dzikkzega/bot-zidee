# 🚀 Cara Menjalankan ZideeBot

## Langkah 1: Install Dependencies

```powershell
cd C:\Users\Lenovo\Documents\Knightbot-MD
npm install
```

## Langkah 2: Dapatkan Session (Pairing Code)

Ada 2 cara:

### Cara A: Via Website (Mudah)
1. Buka: https://knight-bot-paircode.onrender.com
2. Masukkan nomor WhatsApp Anda (tanpa +)
3. Dapatkan pairing code
4. Buka WhatsApp > Linked Devices > Link Device
5. Masukkan pairing code
6. Download file `creds.json`
7. Upload ke folder `session/`

### Cara B: Via Terminal (Manual)
```powershell
npm start
```
- Bot akan tampilkan pairing code
- Buka WhatsApp > Linked Devices > Link Device
- Masukkan pairing code yang muncul di terminal

## Langkah 3: Konfigurasi (Opsional)

Edit file `settings.js`:
```javascript
ownerNumber: '628811613142', // Ganti dengan nomor Anda
botName: "ZideeBot",
commandMode: "public", // atau "private"
```

## Langkah 4: Jalankan Bot

```powershell
npm start
```

Atau untuk memory optimization:
```powershell
npm run start:optimized
```

---

## 🎯 Cara Menggunakan Command (TANPA PREFIX!)

**ZideeBot sekarang tidak memerlukan prefix "." untuk command!**

### Contoh Penggunaan:
```
✅ help          (bukan .help)
✅ ping          (bukan .ping)
✅ sticker       (bukan .sticker)
✅ mode public   (bukan .mode public)
✅ play lagu bagus (bukan .play lagu bagus)
```

### Command Masih Berfungsi:
- General: help, menu, bot, ping, alive, settings
- Admin: mute, unmute, ban, unban, kick, promote, demote
- Owner: mode, autostatus, antidelete, cleartmp
- Sticker: sticker, s, attp, take, steal
- Download: play, video, tiktok, instagram, facebook
- AI: gpt, gemini, imagine
- Fun: joke, meme, quote, ship, dare, truth
- Dan 200+ command lainnya!

**Catatan:** Bot masih dapat menerima command dengan prefix "." untuk backward compatibility.

## 🎮 Cara Pakai di WhatsApp

Kirim command dengan prefix `.` (titik):

### Group Management
- `.tagall` - Tag semua member
- `.kick @user` - Kick member (admin only)
- `.promote @user` - Jadikan admin
- `.demote @user` - Hapus admin
- `.mute` / `.unmute` - Mute/unmute grup

### Fun & Games
- `.tictactoe @user` - Main TicTacToe
- `.hangman` - Main Hangman
- `.trivia` - Kuis trivia
- `.meme` - Random meme
- `.joke` - Random joke

### Media
- `.sticker` - Buat sticker (reply gambar/video)
- `.attp teks` - Animated text to picture
- `.tts en Hello` - Text to speech

### Utility
- `.help` - List semua command
- `.ping` - Cek kecepatan bot
- `.weather Jakarta` - Cek cuaca

### Auto Features (Admin Only)
- `.antilink on/off` - Hapus link otomatis
- `.antibadword on/off` - Hapus kata kasar
- `.chatbot on/off` - AI chatbot
- `.autoread on/off` - Baca pesan otomatis
- `.autostatus on/off` - View status otomatis

## 🛠️ Troubleshooting

### Bot tidak connect?
```powershell
npm run start:fresh  # Reset session dan mulai ulang
```

### Memory error?
```powershell
npm run start:optimized  # Jalankan dengan memory optimization
```

### Clear session?
```powershell
npm run reset-session
```

## 📌 PENTING

1. **Owner Number**: Ganti `ownerNumber` di `settings.js` dengan nomor Anda
2. **Public vs Private Mode**: 
   - Public: Semua orang bisa pakai bot
   - Private: Hanya owner yang bisa pakai
3. **Admin Commands**: Command seperti kick, promote, demote hanya bisa dipakai admin grup
4. **Bot Admin Required**: Beberapa command (kick, etc) butuh bot dijadikan admin grup

## 🔗 Resources

- GitHub: https://github.com/mruniquehacker/Knightbot-MD
- YouTube Tutorial: https://youtu.be/-oz_u1iMgf8
- Telegram Support: https://t.me/+3QhFUZHx-nhhZmY1
