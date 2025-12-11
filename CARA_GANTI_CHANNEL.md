# 🔄 Cara Mengganti Channel WhatsApp di ZideeBot

## 📍 File yang Perlu Diubah

Ada **3 lokasi** yang perlu diganti:

1. **`commands/help.js`** - Line 248 (dengan gambar)
2. **`commands/help.js`** - Line 258 (tanpa gambar / fallback)
3. **`main.js`** - Line 158 (global config untuk semua command)

---

## 🔍 Cara Mendapatkan JID Channel

### Method 1: Via Bot
1. Buat/buka channel WhatsApp Anda
2. Kirim command `.jid` di channel
3. Bot akan reply dengan JID channel format: `120363XXXXXXXXXX@newsletter`

### Method 2: Via Link
Jika Anda punya link channel:
```
https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A
```

Bagian `0029Va90zAnIHphOuO8Msp3A` perlu di-convert ke JID format.

### Method 3: Manual Detection
1. Forward pesan dari channel ke bot
2. Bot akan detect JID dari forwarded message

---

## ✏️ Cara Mengganti

### Di `main.js` (Line 153-163):

```javascript
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: 'GANTI_INI_DENGAN_JID_ANDA@newsletter', // ← GANTI
            newsletterName: 'ZideeBot MD', // ← GANTI nama channel
            serverMessageId: -1
        }
    }
};
```

### Di `commands/help.js` (Line 241-250):

```javascript
await sock.sendMessage(chatId, {
    image: imageBuffer,
    caption: helpMessage,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: 'GANTI_INI_DENGAN_JID_ANDA@newsletter', // ← GANTI
            newsletterName: 'ZideeBot MD', // ← GANTI nama channel
            serverMessageId: -1
        }
    }
});
```

### Di `commands/help.js` (Line 254-264):

```javascript
await sock.sendMessage(chatId, { 
    text: helpMessage,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: 'GANTI_INI_DENGAN_JID_ANDA@newsletter', // ← GANTI
            newsletterName: 'ZideeBot MD', // ← GANTI nama channel
            serverMessageId: -1
        } 
    }
});
```

---

## 🚫 Cara Nonaktifkan Tombol Channel

Jika Anda tidak ingin tombol "Lihat saluran", **hapus** bagian `forwardedNewsletterMessageInfo`:

### DARI:
```javascript
await sock.sendMessage(chatId, {
    image: imageBuffer,
    caption: helpMessage,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363287485628066@newsletter',
            newsletterName: 'ZideeBot MD',
            serverMessageId: -1
        }
    }
});
```

### MENJADI:
```javascript
await sock.sendMessage(chatId, {
    image: imageBuffer,
    caption: helpMessage
});
```

Atau biarkan contextInfo minimal:
```javascript
await sock.sendMessage(chatId, {
    image: imageBuffer,
    caption: helpMessage,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: false
    }
});
```

---

## 🔄 Restart Bot

Setelah mengganti, restart bot:
```powershell
Get-Process node | Stop-Process -Force
npm start
```

---

## ✅ Testing

Kirim command `.help` atau `.menu` di grup, pesan bot akan menampilkan tombol **"Lihat saluran"** dengan channel baru Anda!

---

**Generated:** ${new Date().toLocaleString()}
**Author:** GitHub Copilot
