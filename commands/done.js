const { channelInfo } = require('../lib/messageConfig');

async function doneCommand(sock, chatId, message) {
    try {
        // Check if this is a reply to another message
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (!quotedMessage) {
            await sock.sendMessage(chatId, { 
                text: '❌ Reply to a customer message to mark their order as completed!',
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Get customer's name/number
        const customerJid = quotedParticipant;
        const customerName = customerJid ? `@${customerJid.split('@')[0]}` : 'Customer';
        
        // Send completion message
        const responseText = `✅ *Order Status Update*\n\n` +
            `${customerName}, pesanan Anda telah *SELESAI* ✨\n\n` +
            `Terima kasih telah berbelanja! 🎉\n` +
            `Jangan ragu untuk order lagi kapan saja! 💫`;

        await sock.sendMessage(chatId, { 
            text: responseText,
            mentions: customerJid ? [customerJid] : [],
            ...channelInfo 
        }, { quoted: message });

    } catch (error) {
        console.error('Error in done command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to process the command. Please try again.',
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = doneCommand;
