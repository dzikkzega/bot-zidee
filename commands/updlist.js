const { updateProduct, findProduct } = require('../lib/productManager');
const isAdmin = require('../lib/isAdmin');

async function updlistCommand(sock, chatId, message, args, imageBuffer = null, mimetype = null) {
    try {
        // Check if group
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Command ini hanya bisa digunakan di grup!'
            }, { quoted: message });
            return;
        }

        // Check if admin
        const senderId = message.key.participant || message.key.remoteJid;
        const adminStatus = await isAdmin(sock, chatId, senderId);
        if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: `🚫 *Akses Ditolak*

❌ Perintah "updlist" tidak dapat diakses karena bukan admin.

💡 Hanya admin grup yang dapat mengelola product list.`
            }, { quoted: message });
            return;
        }

        // Parse arguments
        const parts = args.split('#');
        
        if (parts.length !== 2) {
            await sock.sendMessage(chatId, {
                text: '❌ Format salah! Gunakan: updlist [nama produk]#[deskripsi baru]'
            }, { quoted: message });
            return;
        }

        const productName = parts[0].trim();
        const newDescription = parts[1].trim();
        
        if (!productName || !newDescription) {
            await sock.sendMessage(chatId, {
                text: '❌ Nama produk dan deskripsi baru tidak boleh kosong!'
            }, { quoted: message });
            return;
        }

        // Update product
        const updatedProduct = updateProduct(chatId, productName, newDescription, imageBuffer, mimetype);
        
        if (updatedProduct) {
            const hasImage = updatedProduct.image ? '🖼️' : '📝';
            const imageNote = imageBuffer ? 
                '\n\n🖼️ *Gambar:* Berhasil diupdate' :
                (updatedProduct.image ? 
                    '\n\n🖼️ *Gambar:* Masih menggunakan gambar lama\n💡 *Update gambar:* Kirim gambar baru + caption `updlist ' + productName + '#' + newDescription + '`' :
                    '\n\n📝 *Gambar:* Belum ada\n💡 *Tambah gambar:* Kirim gambar + caption `updlist ' + productName + '#' + newDescription + '`');
            
            await sock.sendMessage(chatId, {
                text: `✅ *Produk Berhasil Diupdate*

🛍️ *${updatedProduct.name.toUpperCase()}* ${hasImage}

📝 *Deskripsi Baru:* ${updatedProduct.description}${imageNote}

💡 Gunakan \`list\` untuk melihat semua produk`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ *Produk Tidak Ditemukan*

🔍 Produk "${productName}" tidak ditemukan dalam list.

💡 Gunakan \`list\` untuk melihat semua produk yang tersedia`
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in updlist command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Gagal mengupdate produk!'
        }, { quoted: message });
    }
}

module.exports = updlistCommand;
