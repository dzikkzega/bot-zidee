/**
 * Ramadhan Command - Manage Auto Sahur & Iftar Reminders
 * Commands:
 * - .ramadhan on
 * - .ramadhan off
 * - .ramadhan status
 * - .ramadhan setsahur <pesan>
 * - .ramadhan setiftar <pesan>
 * - .ramadhan test sahur
 * - .ramadhan test iftar
 */

const isAdmin = require('../lib/isAdmin');
const moment = require('moment-timezone');

async function ramadhanCommand(sock, chatId, senderId, args, message, ramadhanScheduler) {
    try {
        // Check if it's a group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ Command ini hanya bisa digunakan di grup!' 
            }, { quoted: message });
            return;
        }

        // Check if sender is admin
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { 
                text: '❌ Hanya admin yang bisa menggunakan command ini!' 
            }, { quoted: message });
            return;
        }

        const subCommand = args[0]?.toLowerCase();

        switch (subCommand) {
            case 'on':
                await handleEnable(sock, chatId, message, ramadhanScheduler, isBotAdmin);
                break;

            case 'off':
                await handleDisable(sock, chatId, message, ramadhanScheduler);
                break;

            case 'status':
                await handleStatus(sock, chatId, message, ramadhanScheduler);
                break;

            case 'setsahur':
                await handleSetSahur(sock, chatId, message, args, ramadhanScheduler);
                break;

            case 'setiftar':
            case 'setberbuka':
                await handleSetIftar(sock, chatId, message, args, ramadhanScheduler);
                break;

            case 'test':
                await handleTest(sock, chatId, senderId, message, args, ramadhanScheduler, isBotAdmin);
                break;

            case 'help':
            case 'menu':
                await handleHelp(sock, chatId, message);
                break;

            default:
                await handleHelp(sock, chatId, message);
                break;
        }

    } catch (error) {
        console.error('Error in ramadhanCommand:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ Terjadi kesalahan: ${error.message}` 
        }, { quoted: message }).catch(() => {});
    }
}

// Enable Ramadhan scheduler
async function handleEnable(sock, chatId, message, scheduler, isBotAdmin) {
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: '❌ Bot harus menjadi admin untuk menggunakan fitur ini!\n\n💡 Bot perlu jadi admin agar bisa mention semua member.' 
        }, { quoted: message });
        return;
    }

    scheduler.enableGroup(chatId);
    
    const status = scheduler.getGroupStatus(chatId);
    const maghribTime = scheduler.maghribTime || 'Loading...';

    const text = `✅ *Ramadhan Scheduler Aktif!*

📅 Jadwal otomatis:
• 🌙 Sahur: *03:30 WIB*
• 🌅 Berbuka: *${maghribTime} WIB*

Bot akan otomatis kirim reminder dengan hidetag (mention semua member) pada waktu yang sudah ditentukan.

💡 Tips:
• Gunakan \`.ramadhan setsahur\` untuk custom pesan sahur
• Gunakan \`.ramadhan setiftar\` untuk custom pesan berbuka
• Gunakan \`.ramadhan status\` untuk cek status
• Gunakan \`.ramadhan off\` untuk nonaktifkan`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Disable Ramadhan scheduler
async function handleDisable(sock, chatId, message, scheduler) {
    scheduler.disableGroup(chatId);
    
    const text = `❌ *Ramadhan Scheduler Dinonaktifkan*

Auto-reminder sahur dan berbuka sudah dimatikan untuk grup ini.

Gunakan \`.ramadhan on\` untuk mengaktifkan kembali.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Show status
async function handleStatus(sock, chatId, message, scheduler) {
    const status = scheduler.getGroupStatus(chatId);
    const maghribTime = scheduler.maghribTime || 'Loading...';

    if (!status || !status.enabled) {
        const text = `📊 *Status Ramadhan Scheduler*

Status: ❌ *Nonaktif*

Gunakan \`.ramadhan on\` untuk mengaktifkan.`;
        
        await sock.sendMessage(chatId, { text }, { quoted: message });
        return;
    }

    const lastSahur = status.lastSahur 
        ? moment(status.lastSahur).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')
        : 'Belum pernah';
    
    const lastIftar = status.lastIftar 
        ? moment(status.lastIftar).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')
        : 'Belum pernah';

    const text = `📊 *Status Ramadhan Scheduler*

Status: ✅ *Aktif*

📅 Jadwal:
• 🌙 Sahur: *03:30 WIB*
• 🌅 Berbuka: *${maghribTime} WIB*

📜 Pesan Sahur:
${status.messages.sahur}

📜 Pesan Berbuka:
${status.messages.iftar}

📊 Statistik:
• Terakhir kirim sahur: ${lastSahur}
• Terakhir kirim berbuka: ${lastIftar}

💡 Gunakan \`.ramadhan help\` untuk melihat command lainnya.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Set custom sahur message
async function handleSetSahur(sock, chatId, message, args, scheduler) {
    const status = scheduler.getGroupStatus(chatId);
    
    if (!status || !status.enabled) {
        await sock.sendMessage(chatId, { 
            text: '❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`' 
        }, { quoted: message });
        return;
    }

    const customMessage = args.slice(1).join(' ');
    
    if (!customMessage) {
        await sock.sendMessage(chatId, { 
            text: '❌ Format salah!\n\nContoh:\n`.ramadhan setsahur Selamat sahur! Jangan lupa niat 🌙`' 
        }, { quoted: message });
        return;
    }

    scheduler.updateMessages(chatId, 'sahur', customMessage);

    const text = `✅ *Pesan Sahur Berhasil Diubah!*

Pesan baru:
${customMessage}

Pesan ini akan digunakan untuk reminder sahur pukul 03:30 WIB.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Set custom iftar message
async function handleSetIftar(sock, chatId, message, args, scheduler) {
    const status = scheduler.getGroupStatus(chatId);
    
    if (!status || !status.enabled) {
        await sock.sendMessage(chatId, { 
            text: '❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`' 
        }, { quoted: message });
        return;
    }

    const customMessage = args.slice(1).join(' ');
    
    if (!customMessage) {
        await sock.sendMessage(chatId, { 
            text: '❌ Format salah!\n\nContoh:\n`.ramadhan setiftar Selamat berbuka puasa! 🌅`' 
        }, { quoted: message });
        return;
    }

    scheduler.updateMessages(chatId, 'iftar', customMessage);

    const text = `✅ *Pesan Berbuka Berhasil Diubah!*

Pesan baru:
${customMessage}

Pesan ini akan digunakan untuk reminder berbuka saat waktu maghrib.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Test reminder (admin only)
async function handleTest(sock, chatId, senderId, message, args, scheduler, isBotAdmin) {
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: '❌ Bot harus menjadi admin untuk test reminder!' 
        }, { quoted: message });
        return;
    }

    const status = scheduler.getGroupStatus(chatId);
    
    if (!status || !status.enabled) {
        await sock.sendMessage(chatId, { 
            text: '❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`' 
        }, { quoted: message });
        return;
    }

    const testType = args[1]?.toLowerCase();
    
    if (!testType || (testType !== 'sahur' && testType !== 'iftar')) {
        await sock.sendMessage(chatId, { 
            text: '❌ Format salah!\n\nGunakan:\n• `.ramadhan test sahur`\n• `.ramadhan test iftar`' 
        }, { quoted: message });
        return;
    }

    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const allMembers = participants.map(p => p.id);

        const testMessage = testType === 'sahur' 
            ? `🧪 *TEST REMINDER SAHUR*\n\n${status.messages.sahur}\n\n_Ini adalah test message. Reminder asli akan dikirim otomatis jam 03:30 WIB._`
            : `🧪 *TEST REMINDER BERBUKA*\n\n${status.messages.iftar}\n\n_Ini adalah test message. Reminder asli akan dikirim otomatis saat waktu maghrib._`;

        await sock.sendMessage(chatId, {
            text: testMessage,
            mentions: allMembers
        });

        scheduler.log(`Test ${testType} reminder sent to ${chatId} by admin`);

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: `❌ Gagal mengirim test reminder: ${error.message}` 
        }, { quoted: message });
    }
}

// Show help
async function handleHelp(sock, chatId, message) {
    const text = `🕌 *Ramadhan Auto-Scheduler*

Fitur otomatis untuk reminder sahur & berbuka puasa dengan hidetag semua member.

📋 *Command Admin:*

• \`.ramadhan on\`
  → Aktifkan auto-reminder

• \`.ramadhan off\`
  → Nonaktifkan auto-reminder

• \`.ramadhan status\`
  → Cek status & jadwal

• \`.ramadhan setsahur <pesan>\`
  → Custom pesan sahur

• \`.ramadhan setiftar <pesan>\`
  → Custom pesan berbuka

• \`.ramadhan test sahur\`
  → Test kirim reminder sahur

• \`.ramadhan test iftar\`
  → Test kirim reminder berbuka

📅 *Jadwal Otomatis:*
• 🌙 Sahur: 03:30 WIB (fixed)
• 🌅 Berbuka: Maghrib (dynamic dari API)

💡 *Catatan:*
- Hanya admin yang bisa menggunakan
- Bot harus admin untuk hidetag
- Pesan default sudah ada, bisa custom
- Waktu maghrib update otomatis setiap hari`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = ramadhanCommand;
