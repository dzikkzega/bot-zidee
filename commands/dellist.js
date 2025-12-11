const { deleteProduct, getProductFilePath } = require('../lib/productManager');
const isAdmin = require('../lib/isAdmin');
const fs = require('fs');

async function dellistCommand(sock, chatId, message, productName) {
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

❌ Perintah "dellist" tidak dapat diakses karena bukan admin.

💡 Hanya admin grup yang dapat mengelola product list.`
            }, { quoted: message });
            return;
        }

        // Check if delete all
        if (productName.toLowerCase() === 'all') {
            const filePath = getProductFilePath(chatId);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    await sock.sendMessage(chatId, {
                        text: '✅ Semua produk berhasil dihapus dari daftar grup ini.'
                    }, { quoted: message });
                } catch (err) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Gagal menghapus semua produk.'
                    }, { quoted: message });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: 'ℹ️ Tidak ada produk yang tersimpan untuk grup ini.'
                }, { quoted: message });
            }
            return;
        }

        // Validate product name
        if (!productName || productName.trim() === '') {
            await sock.sendMessage(chatId, {
                text: '❌ Format salah! Gunakan: dellist [nama produk]'
            }, { quoted: message });
            return;
        }

        // Delete product
        const deletedProduct = deleteProduct(chatId, productName);
        
        if (deletedProduct) {
            await sock.sendMessage(chatId, {
                text: `✅ *Produk Berhasil Dihapus*

🗑️ *${deletedProduct.name.toUpperCase()}*

📝 Deskripsi yang dihapus: ${deletedProduct.description}

💡 Gunakan \`list\` untuk melihat produk yang tersisa`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ *Produk Tidak Ditemukan*

🔍 Produk "${productName}" tidak ditemukan dalam list.

💡 Gunakan \`list\` untuk melihat semua produk yang tersedia`
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in dellist command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Gagal menghapus produk!'
        }, { quoted: message });
    }
}

module.exports = dellistCommand;
