const { channelInfo } = require('../lib/messageConfig');

async function prosesCommand(sock, chatId, message) {
    try {
        // Check if this is a reply to another message
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (!quotedMessage) {
            await sock.sendMessage(chatId, { 
                text: '❌ Reply to a customer message to mark their order as being processed!',
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Get customer's name/number
        const customerJid = quotedParticipant;
        const customerName = customerJid ? `@${customerJid.split('@')[0]}` : 'Customer';
        
        // Send confirmation message
        const responseText = `✅ *Order Status Update*\n\n` +
            `${customerName}, pesanan Anda sedang *DIPROSES* ⏳\n\n` +
            `Mohon tunggu, kami akan segera memproses pesanan Anda.\n` +
            `Terima kasih atas kesabaran Anda! 🙏`;

        await sock.sendMessage(chatId, { 
            text: responseText,
            mentions: customerJid ? [customerJid] : [],
            ...channelInfo 
        }, { quoted: message });

    } catch (error) {
        console.error('Error in proses command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to process the command. Please try again.',
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = prosesCommand;
