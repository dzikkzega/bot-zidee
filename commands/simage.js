/**
 * Sticker to Image Converter
 * Menggunakan Jimp untuk konversi webp ke png
 * 
 * JIMP dipilih karena:
 * - Pure JavaScript (tidak perlu compile native)
 * - Bisa jalan di Android/Termux tanpa masalah
 * - Support format webp baca dan tulis
 */

const { Jimp } = require('jimp');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try {
            await fse.remove(filePath);
            console.log(`File deleted: ${filePath}`);
        } catch (error) {
            console.error(`Failed to delete file:`, error);
        }
    }, 10000); // 10 seconds
};

const convertStickerToImage = async (sock, quotedMessage, chatId) => {
    try {
        const stickerMessage = quotedMessage.stickerMessage;
        if (!stickerMessage) {
            await sock.sendMessage(chatId, { text: 'Reply to a sticker with .simage to convert it.' });
            return;
        }

        const outputImagePath = path.join(tempDir, `converted_image_${Date.now()}.png`);

        // Download sticker
        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        // Convert webp to png using Jimp
        const image = await Jimp.read(buffer);
        await image.write(outputImagePath);

        // Read and send
        const imageBuffer = await fsPromises.readFile(outputImagePath);
        await sock.sendMessage(chatId, { image: imageBuffer, caption: 'Here is the converted image!' });

        scheduleFileDeletion(outputImagePath);
    } catch (error) {
        console.error('Error converting sticker to image:', error);
        await sock.sendMessage(chatId, { text: 'An error occurred while converting the sticker.' });
    }
};

module.exports = convertStickerToImage;
