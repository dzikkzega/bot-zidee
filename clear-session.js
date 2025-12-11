/**
 * Clear Session Script
 * Menghapus SEMUA file session, keys, pre-keys, dan creds untuk logout total
 * TIDAK menghapus folder data/products (penting untuk bisnis)
 * 
 * Masalah: Bot masih terhubung ke WA sebelumnya karena:
 * 1. creds.json tidak terhapus dengan benar
 * 2. File session masih tersisa
 * 3. baileys_store.json menyimpan data koneksi
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Memulai pembersihan session TOTAL...\n');

/**
 * Fungsi untuk menghapus folder secara rekursif
 * @param {string} dirPath - Path folder yang akan dihapus
 */
function deleteFolderRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Rekursif hapus subfolder
                deleteFolderRecursive(curPath);
            } else {
                // Hapus file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
        return true;
    }
    return false;
}

/**
 * Fungsi untuk menghapus semua file dalam folder (tanpa hapus folder)
 * @param {string} dirPath - Path folder
 */
function clearFolder(dirPath) {
    if (fs.existsSync(dirPath)) {
        let deletedCount = 0;
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Hapus subfolder secara rekursif
                deleteFolderRecursive(curPath);
                deletedCount++;
            } else {
                // Hapus file
                fs.unlinkSync(curPath);
                deletedCount++;
            }
        });
        return deletedCount;
    }
    return 0;
}

// ========== LANGKAH 1: Hapus folder session ==========
const sessionDir = path.join(__dirname, 'session');
console.log('📁 Membersihkan folder session/...');

const sessionCount = clearFolder(sessionDir);
if (sessionCount > 0) {
    console.log(`   ✅ Dihapus ${sessionCount} file/folder dari session/`);
} else {
    console.log('   ⚠️  Folder session/ kosong atau tidak ditemukan');
}

// ========== LANGKAH 2: Hapus creds.json secara spesifik ==========
const credsFile = path.join(sessionDir, 'creds.json');
if (fs.existsSync(credsFile)) {
    fs.unlinkSync(credsFile);
    console.log('   ✅ creds.json dihapus (kredensial login)');
}

// ========== LANGKAH 3: Hapus baileys_store.json ==========
const storeFiles = [
    'baileys_store.json',
    'baileys_store.json.backup',
    'store.json'
];

console.log('\n📁 Membersihkan file store...');
storeFiles.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✅ ${fileName} dihapus`);
    }
});

// Hapus semua file baileys_store.json.backup.*
const rootFiles = fs.readdirSync(__dirname);
rootFiles.forEach(file => {
    if (file.startsWith('baileys_store.json')) {
        const filePath = path.join(__dirname, file);
        try {
            fs.unlinkSync(filePath);
            console.log(`   ✅ ${file} dihapus`);
        } catch (e) {
            console.log(`   ❌ Gagal hapus ${file}`);
        }
    }
});

// ========== LANGKAH 4: Hapus folder tmp ==========
const tmpDir = path.join(__dirname, 'tmp');
console.log('\n📁 Membersihkan folder tmp/...');
if (deleteFolderRecursive(tmpDir)) {
    console.log('   ✅ Folder tmp/ dihapus');
    // Buat ulang folder tmp kosong
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('   ✅ Folder tmp/ dibuat ulang (kosong)');
} else {
    console.log('   ℹ️  Folder tmp/ tidak ditemukan');
}

// ========== LANGKAH 5: Hapus folder temp ==========
const tempDir = path.join(__dirname, 'temp');
console.log('\n📁 Membersihkan folder temp/...');
if (deleteFolderRecursive(tempDir)) {
    console.log('   ✅ Folder temp/ dihapus');
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('   ✅ Folder temp/ dibuat ulang (kosong)');
} else {
    console.log('   ℹ️  Folder temp/ tidak ditemukan');
}

// ========== BUAT ULANG FOLDER SESSION KOSONG ==========
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log('\n📁 Folder session/ dibuat ulang (kosong)');
}

// ========== INFO ==========
console.log('\n' + '═'.repeat(50));
console.log('📦 Folder data/products/ TIDAK dihapus (data produk aman)');
console.log('═'.repeat(50));

console.log('\n✨ PEMBERSIHAN SELESAI!');
console.log('\n⚠️  PENTING:');
console.log('   1. Bot akan meminta scan QR Code baru saat dijalankan');
console.log('   2. Koneksi WA sebelumnya sudah TERPUTUS');
console.log('   3. Semua session dan kredensial sudah dihapus');

console.log('\n💡 Jalankan bot: npm run dev atau npm start');
console.log('📱 Scan QR Code dengan WhatsApp untuk login ulang\n');
