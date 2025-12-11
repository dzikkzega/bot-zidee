const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const filePath = path.join(__dirname, '../temp/', `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot harus menjadi admin terlebih dahulu.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Hanya admin yang bisa menggunakan command .hidetag atau .h' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const allMembers = participants.map(p => p.id);

        if (replyMessage) {
            let content = {};
            if (replyMessage.imageMessage) {
                const filePath = await downloadMediaMessage(replyMessage.imageMessage, 'image');
                content = { image: { url: filePath }, caption: messageText || replyMessage.imageMessage.caption || '', mentions: allMembers };
            } else if (replyMessage.videoMessage) {
                const filePath = await downloadMediaMessage(replyMessage.videoMessage, 'video');
                content = { video: { url: filePath }, caption: messageText || replyMessage.videoMessage.caption || '', mentions: allMembers };
            } else if (replyMessage.conversation || replyMessage.extendedTextMessage) {
                content = { text: replyMessage.conversation || replyMessage.extendedTextMessage.text, mentions: allMembers };
            } else if (replyMessage.documentMessage) {
                const filePath = await downloadMediaMessage(replyMessage.documentMessage, 'document');
                content = { document: { url: filePath }, fileName: replyMessage.documentMessage.fileName, caption: messageText || '', mentions: allMembers };
            }

            if (Object.keys(content).length > 0) {
                await sock.sendMessage(chatId, content);
            }
        } else {
            await sock.sendMessage(chatId, { text: messageText || '🤖', mentions: allMembers });
        }
    } catch (error) {
        console.error('❌ Error in hideTagCommand:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ Terjadi kesalahan: ${error.message || 'Unknown error'}\n\n💡 Tips: Tunggu beberapa detik jika terlalu banyak command sekaligus.` 
        }, { quoted: message }).catch(() => {});
    }
}

module.exports = hideTagCommand;


