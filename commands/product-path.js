const path = require('path');
const { getProductFilePath } = require('../lib/productManager');

async function productPathCommand(sock, chatId, message) {
    try {
        const filePath = getProductFilePath(chatId);
        const abs = path.resolve(filePath);
        await sock.sendMessage(chatId, {
            text: `📄 Product file for this group:\n\n${abs}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: '❌ Gagal mengambil lokasi file produk.' }, { quoted: message });
    }
}

module.exports = productPathCommand;
