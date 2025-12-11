# 📦 Product List Management Guide

## Overview
ZideeBot sekarang mendukung sistem manajemen product list yang dapat digunakan di grup WhatsApp. Setiap grup memiliki product list sendiri yang tersimpan secara terpisah.

## Features
- ✅ Tambah, edit, hapus, dan lihat produk
- ✅ Support gambar untuk setiap produk (opsional)
- ✅ Penyimpanan per-grup (setiap grup punya list sendiri)
- ✅ Admin-only untuk manajemen produk
- ✅ Case-insensitive search

## Commands

### 1. **list** - Lihat Semua Produk
Perintah ini dapat digunakan oleh siapa saja untuk melihat semua produk di grup.

**Penggunaan:**
```
list
```

**Contoh Output:**
```
📦 Daftar Produk (2)

1. 🖼️ SEPATU NIKE
   Sepatu sport original size 40-44

2. 📝 TAS GUCCI
   Tas branded import premium
```

**Keterangan:**
- 🖼️ = Produk dengan gambar
- 📝 = Produk tanpa gambar

---

### 2. **addlist** - Tambah Produk Baru (Admin Only)
Menambahkan produk baru ke dalam list grup.

**Format:**
```
addlist NAMA#DESKRIPSI
```

**Contoh Tanpa Gambar:**
```
addlist Sepatu Nike#Sepatu sport original size 40-44
```

**Contoh Dengan Gambar:**
1. Kirim foto produk
2. Tambahkan caption: `addlist Sepatu Nike#Sepatu sport original size 40-44`

**Output:**
```
✅ Produk Berhasil Ditambahkan

🆕 SEPATU NIKE

📝 Deskripsi: Sepatu sport original size 40-44
🖼️ Gambar: ✅ Tersimpan

💡 Gunakan `list` untuk melihat semua produk
```

---

### 3. **updlist** - Update Produk (Admin Only)
Memperbarui deskripsi dan/atau gambar produk yang sudah ada.

**Format:**
```
updlist NAMA#DESKRIPSI_BARU
```

**Contoh Update Deskripsi:**
```
updlist Sepatu Nike#Sepatu sport original size 40-45 Ready Stock!
```

**Contoh Update dengan Gambar Baru:**
1. Kirim foto baru produk
2. Tambahkan caption: `updlist Sepatu Nike#Deskripsi baru produk`

**Output:**
```
✅ Produk Berhasil Diperbarui

📝 SEPATU NIKE

🔄 Deskripsi baru: Sepatu sport original size 40-45 Ready Stock!
🖼️ Gambar: Diperbarui

💡 Gunakan `list` untuk melihat perubahan
```

---

### 4. **dellist** - Hapus Produk (Admin Only)
Menghapus satu produk atau semua produk dari list grup.

**Format Hapus Satu Produk:**
```
dellist NAMA_PRODUK
```

**Format Hapus Semua Produk:**
```
dellist all
```

**Contoh:**
```
dellist Sepatu Nike
```

**Output:**
```
✅ Produk Berhasil Dihapus

🗑️ SEPATU NIKE

📝 Deskripsi yang dihapus: Sepatu sport original size 40-44

💡 Gunakan `list` untuk melihat produk yang tersisa
```

---

## Tips & Tricks

### Format Nama Produk
- Gunakan pemisah `#` antara nama dan deskripsi
- Nama produk bersifat **case-insensitive** (tidak membedakan huruf besar/kecil)
- Contoh: `sepatu nike`, `SEPATU NIKE`, atau `Sepatu Nike` akan dianggap sama

### Menambah Gambar
Ada 2 cara menambah gambar:
1. **Cara 1:** Kirim gambar dengan caption command
   - Kirim foto → caption: `addlist Produk#Deskripsi`

2. **Cara 2:** Tambah text dulu, update gambar kemudian
   - `addlist Produk#Deskripsi`
   - Kirim foto → caption: `updlist Produk#Deskripsi`

### Update Gambar
- Kirim foto baru dengan caption `updlist NAMA#DESKRIPSI`
- Gambar lama akan diganti dengan yang baru
- Jika update tanpa foto, gambar lama tetap tersimpan

### Admin Permissions
- Hanya **admin grup** yang dapat:
  - Menambah produk (addlist)
  - Mengupdate produk (updlist)
  - Menghapus produk (dellist)
- Semua member dapat:
  - Melihat list produk (list)

---

## File Storage

### Lokasi File
Product list disimpan di:
```
data/products/{GROUP_ID}.json
```

Setiap grup memiliki file terpisah berdasarkan Group ID.

### Format Data
```json
[
  {
    "name": "SEPATU NIKE",
    "description": "Sepatu sport original size 40-44",
    "image": "base64_encoded_image_string",
    "mimetype": "image/jpeg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Backup & Restore
File JSON dapat di-backup secara manual:
```powershell
# Backup
Copy-Item "data\products\*.json" "backup\products\" -Recurse

# Restore
Copy-Item "backup\products\*.json" "data\products\" -Recurse
```

---

## Error Messages

### ❌ Command ini hanya bisa digunakan di grup!
**Penyebab:** Command digunakan di private chat  
**Solusi:** Gunakan command di grup WhatsApp

### 🚫 Akses Ditolak - Perintah tidak dapat diakses karena bukan admin
**Penyebab:** Non-admin mencoba addlist/updlist/dellist  
**Solusi:** Hanya admin yang dapat mengelola produk

### ❌ Format salah! Gunakan: addlist [nama]#[deskripsi]
**Penyebab:** Format command salah (tidak ada tanda `#`)  
**Solusi:** Gunakan format: `addlist NAMA#DESKRIPSI`

### ❌ Produk dengan nama "XXX" sudah ada!
**Penyebab:** Nama produk sudah digunakan  
**Solusi:** Gunakan nama lain atau `updlist` untuk update

### ❌ Produk "XXX" tidak ditemukan dalam list
**Penyebab:** Produk tidak ada dalam database  
**Solusi:** Cek list produk dengan command `list`

---

## Technical Details

### Libraries Used
- `lib/productManager.js` - Core CRUD operations
- `fs` & `path` - File management
- Base64 encoding untuk gambar

### Functions Available
```javascript
// Import from productManager
const {
  getProductFilePath,  // Get file path for group
  loadProducts,        // Load products from JSON
  saveProducts,        // Save products to JSON
  addProduct,          // Add new product
  findProduct,         // Find product by name
  deleteProduct,       // Delete product
  updateProduct,       // Update product
  getAllProducts       // Get all products
} = require('./lib/productManager');
```

### Image Handling
- Gambar dikonversi ke Base64 sebelum disimpan
- Format: `{ image: "base64_string", mimetype: "image/jpeg" }`
- Max size: Tergantung WhatsApp limit (~16MB)

---

## Troubleshooting

### Bot tidak merespon command
**Solusi:**
1. Pastikan bot sudah running
2. Cek console untuk error messages
3. Restart bot dengan `npm run dev`

### Gambar tidak tersimpan
**Solusi:**
1. Cek size gambar (max ~16MB)
2. Pastikan format: JPG, PNG, atau WEBP
3. Cek permission folder `data/products/`

### Data hilang setelah restart
**Solusi:**
1. Cek file `data/products/{GROUP_ID}.json` masih ada
2. Pastikan tidak ada error saat save
3. Restore dari backup jika perlu

---

## Migration dari Bot Lama

Jika Anda memiliki data produk dari bot lama (format object), data akan otomatis dimigrasi ke format baru (array) saat pertama kali di-load.

**Format Lama:**
```json
{
  "produk1": { "name": "...", "desc": "..." }
}
```

**Format Baru:**
```json
[
  { "name": "PRODUK1", "description": "..." }
]
```

Migration terjadi otomatis di function `loadProducts()`.

---

## Future Enhancements

Fitur yang dapat ditambahkan:
- [ ] Kategori produk
- [ ] Harga produk
- [ ] Stock management
- [ ] Search/filter produk
- [ ] Export ke CSV/Excel
- [ ] Multiple images per product
- [ ] Product variants (size, color, etc)
- [ ] Order/transaction tracking

---

**Created by:** si Zidee  
**Bot:** ZideeBot / KnightBot-MD  
**Version:** 3.0.0+
