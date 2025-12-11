# Panduan Command Proses & Done

## Deskripsi
Command `proses` dan `done` digunakan untuk mengelola status pesanan pelanggan di grup WhatsApp.

## Cara Penggunaan

### 1. Command `.proses`
Digunakan untuk memberi tahu pelanggan bahwa pesanan mereka sedang diproses.

**Cara pakai:**
1. Reply pesan pelanggan yang berisi pesanan
2. Ketik `.proses`
3. Bot akan mengirim pesan konfirmasi ke pelanggan

**Contoh:**
```
Pelanggan: "Saya pesan produk A"
[Admin reply pesan tersebut dan ketik: .proses]

Bot akan reply:
✅ Order Status Update

@pelanggan, pesanan Anda sedang DIPROSES ⏳

Mohon tunggu, kami akan segera memproses pesanan Anda.
Terima kasih atas kesabaran Anda! 🙏
```

### 2. Command `.done`
Digunakan untuk memberi tahu pelanggan bahwa pesanan mereka sudah selesai.

**Cara pakai:**
1. Reply pesan pelanggan yang berisi pesanan
2. Ketik `.done`
3. Bot akan mengirim pesan konfirmasi penyelesaian

**Contoh:**
```
Pelanggan: "Saya pesan produk A"
[Admin reply pesan tersebut dan ketik: .done]

Bot akan reply:
✅ Order Status Update

@pelanggan, pesanan Anda telah SELESAI ✨

Terima kasih telah berbelanja! 🎉
Jangan ragu untuk order lagi kapan saja! 💫
```

## Izin Akses
- ✅ **Admin Group**: Bisa menggunakan command ini
- ✅ **Bot Owner**: Bisa menggunakan command ini
- ❌ **Member Biasa**: Tidak bisa menggunakan (akan dapat pesan error)

## Fitur
- ✅ Mention otomatis customer di pesan konfirmasi
- ✅ Admin-only restriction di grup
- ✅ Bisa digunakan di private chat tanpa restriction
- ✅ Error handling jika tidak reply pesan

## Notes
- Command ini **harus** digunakan dengan cara reply pesan pelanggan
- Jika tidak reply pesan, bot akan memberi peringatan:
  - Untuk `.proses`: "❌ Reply to a customer message to mark their order as being processed!"
  - Untuk `.done`: "❌ Reply to a customer message to mark their order as completed!"

## File Terkait
- `commands/proses.js` - Handler command proses
- `commands/done.js` - Handler command done
- `main.js` - Integration dengan admin checks
- `commands/help.js` - Menu bantuan yang sudah diupdate

## Changelog
- **2025-01-15**: Command proses & done berhasil ditambahkan dengan admin-only restriction
