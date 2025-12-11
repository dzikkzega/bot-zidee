const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const { Jimp } = require('jimp');

/**
 * PERBEDAAN SHARP vs JIMP:
 * 
 * SHARP:
 * - Library native (C++) menggunakan libvips
 * - Sangat cepat untuk image processing
 * - Membutuhkan kompilasi native (node-gyp)
 * - TIDAK BISA diinstall di Android/Termux (armv7)
 * - Cocok untuk server Linux/Windows dengan build tools
 * 
 * JIMP (JavaScript Image Manipulation Program):
 * - Pure JavaScript, tidak ada dependency native
 * - Lebih lambat dari Sharp, tapi cukup untuk bot
 * - Bisa diinstall di SEMUA platform termasuk Android/Termux
 * - Tidak perlu node-gyp atau build tools
 * - Cocok untuk portabilitas dan deployment mudah
 */

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        // Get the image to blur
        let imageBuffer;
        
        if (quotedMessage) {
            // If replying to a message
            if (!quotedMessage.imageMessage) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Please reply to an image message' 
                }, { quoted: message });
                return;
            }
            
            const quoted = {
                message: {
                    imageMessage: quotedMessage.imageMessage
                }
            };
            
            imageBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                { },
                { }
            );
        } else if (message.message?.imageMessage) {
            // If image is in current message
            imageBuffer = await downloadMediaMessage(
                message,
                'buffer',
                { },
                { }
            );
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Please reply to an image or send an image with caption .blur' 
            }, { quoted: message });
            return;
        }

        // Process image using Jimp
        const image = await Jimp.read(imageBuffer);
        
        // Resize to max 800x800 while maintaining aspect ratio
        const maxSize = 800;
        if (image.width > maxSize || image.height > maxSize) {
            if (image.width > image.height) {
                image.resize({ w: maxSize });
            } else {
                image.resize({ h: maxSize });
            }
        }
        
        // Apply blur effect (Jimp uses Gaussian blur, radius 10)
        image.blur(10);
        
        // Convert to buffer
        const blurredBuffer = await image.getBuffer('image/jpeg', { quality: 80 });

        // Send the blurred image
        await sock.sendMessage(chatId, {
            image: blurredBuffer,
            caption: '*[ ✔ ] Image Blurred Successfully*',
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363287485628066@newsletter',
                        newsletterName: 'ZideeBot MD',
                        serverMessageId: -1
                    }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in blur command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to blur image. Please try again later.' 
        }, { quoted: message });
    }
}

module.exports = blurCommand; 