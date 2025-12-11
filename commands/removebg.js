const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    // 1) Quoted image (highest priority)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

module.exports = {
    name: 'removebg',
    alias: ['rmbg', 'nobg'],
    category: 'general',
    desc: 'Remove background from images',
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            let imageUrl = null;
            
            // Check if args contain a URL
            if (args.length > 0) {
                const url = args.join(' ');
                if (isValidUrl(url)) {
                    imageUrl = url;
                } else {
                    return sock.sendMessage(chatId, { 
                        text: '❌ Invalid URL provided.\n\nUsage: `.removebg https://example.com/image.jpg`' 
                    }, { quoted: message });
                }
            } else {
                // Try to get image from message or quoted message
                imageUrl = await getQuotedOrOwnImageUrl(sock, message);
                
                if (!imageUrl) {
                    return sock.sendMessage(chatId, { 
                        text: '📸 *Remove Background Command*\n\nUsage:\n• `.removebg <image_url>`\n• Reply to an image with `.removebg`\n• Send image with `.removebg`\n\nExample: `.removebg https://example.com/image.jpg`' 
                    }, { quoted: message });
                }
            }

        
            // Call the remove background API with fallback
            let apiUrl = `https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(imageUrl)}`;
            
            let response;
            try {
                response = await axios.get(apiUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
            } catch (primaryError) {
                // Fallback ke API alternatif jika API utama gagal
                console.log('Primary API failed, trying alternative...');
                apiUrl = `https://api.remove.bg/v1.0/removebg`;
                
                // Try alternative API (need to convert to multipart if using remove.bg)
                // For now, let's try another free API
                apiUrl = `https://skizo.tech/api/removebg?apikey=nanogembul&url=${encodeURIComponent(imageUrl)}`;
                
                response = await axios.get(apiUrl, {
                    responseType: 'json',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                // Check if alternative API returns image URL
                if (response.data && response.data.url) {
                    const imageResponse = await axios.get(response.data.url, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    response = imageResponse;
                }
            }

            if (response.status === 200 && response.data) {
                // Send the processed image
                await sock.sendMessage(chatId, {
                    image: response.data,
                    caption: '✨ *Background Removed Successfully!*\n\n🤖 Powered by ZideeBot\n📢 Join: https://whatsapp.com/channel/0029VafuRDyCMY0HwKx9OW30',
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
            } else {
                throw new Error('Failed to process image');
            }

        } catch (error) {
            console.error('RemoveBG Error:', error.message);
            
            let errorMessage = '❌ Gagal menghapus background.';
            
            if (error.response?.status === 429) {
                errorMessage = '⏰ Terlalu banyak request. Coba lagi nanti.';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ URL gambar tidak valid atau format tidak didukung.';
            } else if (error.response?.status === 500 || error.response?.status === 530) {
                errorMessage = '🔧 Server API sedang bermasalah. Coba lagi dalam beberapa menit.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '⏰ Request timeout. Ukuran gambar mungkin terlalu besar.';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = '🌐 Koneksi internet bermasalah atau API tidak tersedia.';
            }
            
            await sock.sendMessage(chatId, { 
                text: `${errorMessage}\n\n💡 *Tips:*\n• Pastikan gambar berformat JPG/PNG\n• Ukuran gambar tidak terlalu besar (<5MB)\n• Coba lagi dalam beberapa saat`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363287485628066@newsletter',
                        newsletterName: 'ZideeBot MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message }).catch(console.error);
        }
    }
};

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
