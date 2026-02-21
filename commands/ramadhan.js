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

const isAdmin = require("../lib/isAdmin");
const moment = require("moment-timezone");

async function ramadhanCommand(
  sock,
  chatId,
  senderId,
  args,
  message,
  ramadhanScheduler,
) {
  try {
    // Check if it's a group
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Command ini hanya bisa digunakan di grup!",
        },
        { quoted: message },
      );
      return;
    }

    // Check if sender is admin
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isSenderAdmin) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Hanya admin yang bisa menggunakan command ini!",
        },
        { quoted: message },
      );
      return;
    }

    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case "on":
        await handleEnable(
          sock,
          chatId,
          message,
          ramadhanScheduler,
          isBotAdmin,
        );
        break;

      case "off":
        await handleDisable(sock, chatId, message, ramadhanScheduler);
        break;

      case "status":
        await handleStatus(sock, chatId, message, ramadhanScheduler);
        break;

      case "setsahur":
        await handleSetSahur(sock, chatId, message, args, ramadhanScheduler);
        break;

      case "setiftar":
      case "setberbuka":
        await handleSetIftar(sock, chatId, message, args, ramadhanScheduler);
        break;

      case "test":
        await handleTest(
          sock,
          chatId,
          senderId,
          message,
          args,
          ramadhanScheduler,
          isBotAdmin,
        );
        break;

      case "setopengc":
        await handleSetOpenGC(
          sock,
          chatId,
          message,
          args,
          ramadhanScheduler,
          isBotAdmin,
        );
        break;

      case "setclosegc":
        await handleSetCloseGC(
          sock,
          chatId,
          message,
          args,
          ramadhanScheduler,
          isBotAdmin,
        );
        break;

      case "help":
      case "menu":
        await handleHelp(sock, chatId, message);
        break;

      default:
        await handleHelp(sock, chatId, message);
        break;
    }
  } catch (error) {
    console.error("Error in ramadhanCommand:", error);
    await sock
      .sendMessage(
        chatId,
        {
          text: `❌ Terjadi kesalahan: ${error.message}`,
        },
        { quoted: message },
      )
      .catch(() => {});
  }
}

// Enable Ramadhan scheduler
async function handleEnable(sock, chatId, message, scheduler, isBotAdmin) {
  if (!isBotAdmin) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Bot harus menjadi admin untuk menggunakan fitur ini!\n\n💡 Bot perlu jadi admin agar bisa mention semua member.",
      },
      { quoted: message },
    );
    return;
  }

  scheduler.enableGroup(chatId);

  const status = scheduler.getGroupStatus(chatId);
  const maghribTime = scheduler.maghribTime || "Loading...";

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
  const maghribTime = scheduler.maghribTime || "Loading...";

  if (!status || !status.enabled) {
    const text = `📊 *Status Ramadhan Scheduler*

Status: ❌ *Nonaktif*

Gunakan \`.ramadhan on\` untuk mengaktifkan.`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
    return;
  }

  const lastSahur = status.lastSahur
    ? moment(status.lastSahur).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm")
    : "Belum pernah";

  const lastIftar = status.lastIftar
    ? moment(status.lastIftar).tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm")
    : "Belum pernah";

  const sahurDisplay = Array.isArray(status.messages.sahur)
    ? `🔄 *3 variasi (rotasi otomatis harian)*`
    : `📝 Custom:\n${status.messages.sahur}`;

  const iftarDisplay = Array.isArray(status.messages.iftar)
    ? `🔄 *3 variasi (rotasi otomatis harian)*`
    : `📝 Custom:\n${status.messages.iftar}`;

  const openTimeDisplay = status.openTime
    ? `🔓 Buka otomatis: *${status.openTime} WIB*`
    : "🔓 Buka otomatis: ❌ Tidak diatur";
  const closeTimeDisplay = status.closeTime
    ? `🔒 Tutup otomatis: *${status.closeTime} WIB*`
    : "🔒 Tutup otomatis: ❌ Tidak diatur";

  const text = `📊 *Status Ramadhan Scheduler*

Status: ✅ *Aktif*

📅 Jadwal Reminder:
• 🌙 Sahur: *03:30 WIB*
• 🌅 Berbuka: *${maghribTime} WIB*

🚪 Jadwal Buka/Tutup Grup:
• ${openTimeDisplay}
• ${closeTimeDisplay}

💬 Pesan Sahur:
${sahurDisplay}

💬 Pesan Berbuka:
${iftarDisplay}

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
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`",
      },
      { quoted: message },
    );
    return;
  }

  const customMessage = args.slice(1).join(" ");

  if (!customMessage) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Format salah!\n\nContoh:\n`.ramadhan setsahur Selamat sahur! Jangan lupa niat 🌙`",
      },
      { quoted: message },
    );
    return;
  }

  scheduler.updateMessages(chatId, "sahur", customMessage);

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
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`",
      },
      { quoted: message },
    );
    return;
  }

  const customMessage = args.slice(1).join(" ");

  if (!customMessage) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Format salah!\n\nContoh:\n`.ramadhan setiftar Selamat berbuka puasa! 🌅`",
      },
      { quoted: message },
    );
    return;
  }

  scheduler.updateMessages(chatId, "iftar", customMessage);

  const text = `✅ *Pesan Berbuka Berhasil Diubah!*

Pesan baru:
${customMessage}

Pesan ini akan digunakan untuk reminder berbuka saat waktu maghrib.`;

  await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Set auto-open group time
async function handleSetOpenGC(
  sock,
  chatId,
  message,
  args,
  scheduler,
  isBotAdmin,
) {
  if (!isBotAdmin) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Bot harus menjadi admin untuk menggunakan fitur ini!",
      },
      { quoted: message },
    );
    return;
  }

  const timeInput = args[1];

  if (!timeInput) {
    const status = scheduler.getGroupStatus(chatId);
    const current = status?.openTime
      ? `\n\n⏰ Setting saat ini: *${status.openTime} WIB*`
      : "";
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Format salah!\n\nContoh:\n\`.ramadhan setopengc 06:00\`\n\nUntuk menonaktifkan:\n\`.ramadhan setopengc off\`${current}`,
      },
      { quoted: message },
    );
    return;
  }

  if (timeInput.toLowerCase() === "off") {
    scheduler.removeGroupSchedule(chatId, "open");
    await sock.sendMessage(
      chatId,
      {
        text: "✅ *Auto-Buka Grup Dinonaktifkan!*\n\nGrup tidak akan dibuka otomatis lagi.",
      },
      { quoted: message },
    );
    return;
  }

  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeInput)) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Format jam tidak valid!\n\nGunakan format *HH:MM*\nContoh: `06:00`, `07:30`, `08:00`",
      },
      { quoted: message },
    );
    return;
  }

  scheduler.setGroupSchedule(chatId, "open", timeInput);

  await sock.sendMessage(
    chatId,
    {
      text: `✅ *Auto-Buka Grup Berhasil Disetting!*\n\n🔓 Grup akan *dibuka otomatis* setiap hari jam *${timeInput} WIB*.\n\nBot akan menjalankan perintah buka grup secara otomatis pada waktu tersebut.\n\n💡 Untuk menonaktifkan: \`.ramadhan setopengc off\``,
    },
    { quoted: message },
  );
}

// Set auto-close group time
async function handleSetCloseGC(
  sock,
  chatId,
  message,
  args,
  scheduler,
  isBotAdmin,
) {
  if (!isBotAdmin) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Bot harus menjadi admin untuk menggunakan fitur ini!",
      },
      { quoted: message },
    );
    return;
  }

  const timeInput = args[1];

  if (!timeInput) {
    const status = scheduler.getGroupStatus(chatId);
    const current = status?.closeTime
      ? `\n\n⏰ Setting saat ini: *${status.closeTime} WIB*`
      : "";
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Format salah!\n\nContoh:\n\`.ramadhan setclosegc 22:00\`\n\nUntuk menonaktifkan:\n\`.ramadhan setclosegc off\`${current}`,
      },
      { quoted: message },
    );
    return;
  }

  if (timeInput.toLowerCase() === "off") {
    scheduler.removeGroupSchedule(chatId, "close");
    await sock.sendMessage(
      chatId,
      {
        text: "✅ *Auto-Tutup Grup Dinonaktifkan!*\n\nGrup tidak akan ditutup otomatis lagi.",
      },
      { quoted: message },
    );
    return;
  }

  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeInput)) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Format jam tidak valid!\n\nGunakan format *HH:MM*\nContoh: `21:00`, `22:00`, `23:30`",
      },
      { quoted: message },
    );
    return;
  }

  scheduler.setGroupSchedule(chatId, "close", timeInput);

  await sock.sendMessage(
    chatId,
    {
      text: `✅ *Auto-Tutup Grup Berhasil Disetting!*\n\n🔒 Grup akan *ditutup otomatis* setiap hari jam *${timeInput} WIB*.\n\nBot akan menjalankan perintah tutup grup secara otomatis pada waktu tersebut.\n\n💡 Untuk menonaktifkan: \`.ramadhan setclosegc off\``,
    },
    { quoted: message },
  );
}

// Test reminder (admin only)
async function handleTest(
  sock,
  chatId,
  senderId,
  message,
  args,
  scheduler,
  isBotAdmin,
) {
  if (!isBotAdmin) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Bot harus menjadi admin untuk test reminder!",
      },
      { quoted: message },
    );
    return;
  }

  const status = scheduler.getGroupStatus(chatId);

  if (!status || !status.enabled) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Aktifkan Ramadhan scheduler terlebih dahulu dengan `.ramadhan on`",
      },
      { quoted: message },
    );
    return;
  }

  const testType = args[1]?.toLowerCase();

  if (!testType || (testType !== "sahur" && testType !== "iftar")) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Format salah!\n\nGunakan:\n• `.ramadhan test sahur`\n• `.ramadhan test iftar`",
      },
      { quoted: message },
    );
    return;
  }

  try {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants || [];
    const allMembers = participants.map((p) => p.id);

    const testMessage =
      testType === "sahur"
        ? `🧪 *TEST REMINDER SAHUR*\n\n${status.messages.sahur}\n\n_Ini adalah test message. Reminder asli akan dikirim otomatis jam 03:30 WIB._`
        : `🧪 *TEST REMINDER BERBUKA*\n\n${status.messages.iftar}\n\n_Ini adalah test message. Reminder asli akan dikirim otomatis saat waktu maghrib._`;

    await sock.sendMessage(chatId, {
      text: testMessage,
      mentions: allMembers,
    });

    scheduler.log(`Test ${testType} reminder sent to ${chatId} by admin`);
  } catch (error) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Gagal mengirim test reminder: ${error.message}`,
      },
      { quoted: message },
    );
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

� *Auto Buka/Tutup Grup:*

• \`.ramadhan setopengc <jam>\`
  → Set jam buka otomatis grup
  Contoh: \`.ramadhan setopengc 06:00\`

• \`.ramadhan setclosegc <jam>\`
  → Set jam tutup otomatis grup
  Contoh: \`.ramadhan setclosegc 22:00\`

• Gunakan \`off\` untuk menonaktifkan
  Contoh: \`.ramadhan setopengc off\`

📅 *Jadwal Otomatis:*
• 🌙 Sahur: 03:30 WIB (fixed)
• 🌅 Berbuka: Maghrib (dynamic dari API)

✨ *Fitur Pesan:*
- Pesan default punya 3 variasi, berganti otomatis setiap hari
- Bisa custom dengan setsahur/setiftar

💡 *Catatan:*
- Hanya admin yang bisa menggunakan
- Bot harus admin untuk hidetag & buka/tutup grup
- Setting buka/tutup tersimpan permanen`;

  await sock.sendMessage(chatId, { text }, { quoted: message });
}

// Standalone wrappers for .setopengc / .setclosegc commands
async function setOpenGCCommand(
  sock,
  chatId,
  senderId,
  args,
  message,
  ramadhanScheduler,
) {
  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Command ini hanya bisa digunakan di grup!" },
      { quoted: message },
    );
    return;
  }
  const isAdmin = require("../lib/isAdmin");
  const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
  if (!isSenderAdmin) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Hanya admin yang bisa menggunakan command ini!" },
      { quoted: message },
    );
    return;
  }
  await handleSetOpenGC(
    sock,
    chatId,
    message,
    ["setopengc", ...args],
    ramadhanScheduler,
    isBotAdmin,
  );
}

async function setCloseGCCommand(
  sock,
  chatId,
  senderId,
  args,
  message,
  ramadhanScheduler,
) {
  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Command ini hanya bisa digunakan di grup!" },
      { quoted: message },
    );
    return;
  }
  const isAdmin = require("../lib/isAdmin");
  const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
  if (!isSenderAdmin) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Hanya admin yang bisa menggunakan command ini!" },
      { quoted: message },
    );
    return;
  }
  await handleSetCloseGC(
    sock,
    chatId,
    message,
    ["setclosegc", ...args],
    ramadhanScheduler,
    isBotAdmin,
  );
}

module.exports = ramadhanCommand;
module.exports.setOpenGCCommand = setOpenGCCommand;
module.exports.setCloseGCCommand = setCloseGCCommand;
