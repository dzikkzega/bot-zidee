/**
 * ZideeBot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require("./settings");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");
const FileType = require("file-type");
const path = require("path");
const axios = require("axios");
const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
} = require("./main");
const PhoneNumber = require("awesome-phonenumber");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require("./lib/exif");
const {
  smsg,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  fetch,
  sleep,
  reSize,
} = require("./lib/myfunc");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  jidDecode,
  proto,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay,
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const {
  PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys/lib/Utils/generics");
const { rmSync, existsSync } = require("fs");
const { join } = require("path");

// Import lightweight store
const store = require("./lib/lightweight_store");

// Initialize store
store.readFromFile();
const settings = require("./settings");
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

// Memory optimization - Force garbage collection if available
setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log("🧹 Garbage collection completed");
  }
}, 60_000); // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > 400) {
    console.log("⚠️ RAM too high (>400MB), restarting bot...");
    process.exit(1); // Panel will auto-restart
  }
}, 30_000); // check every 30 seconds

let phoneNumber = "";
let owner = JSON.parse(fs.readFileSync("./data/owner.json"));

global.botname = "ZideeBot";
global.themeemoji = "•";

// PAIRING CODE MODE:
// - Jika phoneNumber sudah diisi di atas, langsung pakai pairing code
// - Jika kosong, akan prompt di terminal untuk input nomor
// - Gunakan --qr flag untuk paksa mode QR
const useQR = process.argv.includes("--qr");
const pairingCode = !useQR; // Default selalu pairing code kecuali ada --qr flag
const useMobile = process.argv.includes("--mobile");

// Selalu buat readline interface untuk input manual
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startXeonBotInc() {
  try {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const msgRetryCounterCache = new NodeCache();

    const XeonBotInc = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: !pairingCode, // QR hanya muncul jika bukan pairing mode
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: "fatal" }).child({ level: "fatal" })
        ),
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });

    // Save credentials when they update
    XeonBotInc.ev.on("creds.update", saveCreds);

    // Handle pairing code - tanya nomor dulu, request code nanti setelah socket siap
    let inputPhoneNumber = null;
    if (pairingCode && !state.creds.registered) {
      if (useMobile) throw new Error("Cannot use pairing code with mobile api");

      inputPhoneNumber = phoneNumber;

      // Jika phoneNumber kosong, tanya user
      if (!inputPhoneNumber) {
        console.log(chalk.cyan("\n═══════════════════════════════════════"));
        console.log(chalk.green("         📱 PAIRING CODE MODE"));
        console.log(chalk.cyan("═══════════════════════════════════════\n"));

        inputPhoneNumber = await question(
          chalk.bgBlack(
            chalk.greenBright(
              `Masukkan nomor WhatsApp Anda\nFormat: 628123456789 (tanpa + atau spasi)\n\n📱 Nomor HP: `
            )
          )
        );
      }

      // Clean the phone number - remove any non-digit characters
      inputPhoneNumber = inputPhoneNumber.replace(/[^0-9]/g, "");

      if (!inputPhoneNumber) {
        console.log(chalk.red("\n❌ Nomor HP tidak boleh kosong!"));
        process.exit(1);
      }

      // Validate the phone number using awesome-phonenumber
      const pn = require("awesome-phonenumber");
      if (!pn("+" + inputPhoneNumber).isValid()) {
        console.log(chalk.red("\n❌ Nomor HP tidak valid!"));
        console.log(
          chalk.yellow("Format yang benar: nomor lengkap tanpa + atau spasi")
        );
        console.log(
          chalk.yellow("Contoh: 628123456789 (Indonesia), 15551234567 (US)")
        );
        process.exit(1);
      }

      console.log(
        chalk.yellow(
          "\n⏳ Menunggu koneksi... pairing code akan muncul dalam beberapa detik...\n"
        )
      );

      // Request pairing code dengan setTimeout untuk memastikan socket siap
      setTimeout(async () => {
        try {
          let code = await XeonBotInc.requestPairingCode(inputPhoneNumber);
          code = code?.match(/.{1,4}/g)?.join("-") || code;

          console.log(chalk.cyan("\n═══════════════════════════════════════"));
          console.log(chalk.bgGreen(chalk.black(` 🔐 PAIRING CODE: ${code} `)));
          console.log(chalk.cyan("═══════════════════════════════════════"));
          console.log(chalk.yellow("\n📋 Cara memasukkan kode:"));
          console.log(chalk.white("   1. Buka WhatsApp di HP"));
          console.log(chalk.white("   2. Pergi ke Settings > Linked Devices"));
          console.log(chalk.white('   3. Ketuk "Link a Device"'));
          console.log(
            chalk.white('   4. Ketuk "Link with phone number instead"')
          );
          console.log(chalk.white(`   5. Masukkan kode: ${code}\n`));
        } catch (error) {
          console.error("Error requesting pairing code:", error);
          console.log(chalk.red("\n❌ Gagal mendapatkan pairing code."));
          console.log(
            chalk.yellow("Coba: npm run dev -- --qr untuk mode QR code")
          );
        }
      }, 5000); // Tunggu 5 detik untuk socket siap
    }

    store.bind(XeonBotInc.ev);

    // Message handling
    XeonBotInc.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
        mek.message =
          Object.keys(mek.message)[0] === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;
        if (mek.key && mek.key.remoteJid === "status@broadcast") {
          await handleStatus(XeonBotInc, chatUpdate);
          return;
        }
        // In private mode, only block non-group messages (allow groups for moderation)
        // Note: XeonBotInc.public is not synced, so we check mode in main.js instead
        // This check is kept for backward compatibility but mainly blocks DMs
        if (
          !XeonBotInc.public &&
          !mek.key.fromMe &&
          chatUpdate.type === "notify"
        ) {
          const isGroup = mek.key?.remoteJid?.endsWith("@g.us");
          if (!isGroup) return; // Block DMs in private mode, but allow group messages
        }
        if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;

        // Clear message retry cache to prevent memory bloat
        if (XeonBotInc?.msgRetryCounterCache) {
          XeonBotInc.msgRetryCounterCache.clear();
        }

        try {
          await handleMessages(XeonBotInc, chatUpdate, true);
        } catch (err) {
          console.error("Error in handleMessages:", err);
          // Only try to send error message if we have a valid chatId
          if (mek.key && mek.key.remoteJid) {
            await XeonBotInc.sendMessage(mek.key.remoteJid, {
              text: "❌ An error occurred while processing your message.",
              contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: "120363287485628066@newsletter",
                  newsletterName: "ZideeBot MD",
                  serverMessageId: -1,
                },
              },
            }).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Error in messages.upsert:", err);
      }
    });

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user && decode.server && decode.user + "@" + decode.server) ||
          jid
        );
      } else return jid;
    };

    XeonBotInc.ev.on("contacts.update", (update) => {
      for (let contact of update) {
        let id = XeonBotInc.decodeJid(contact.id);
        if (store && store.contacts)
          store.contacts[id] = { id, name: contact.notify };
      }
    });

    XeonBotInc.getName = (jid, withoutContact = false) => {
      id = XeonBotInc.decodeJid(jid);
      withoutContact = XeonBotInc.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {};
          resolve(
            v.name ||
              v.subject ||
              PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber(
                "international"
              )
          );
        });
      else
        v =
          id === "0@s.whatsapp.net"
            ? {
                id,
                name: "WhatsApp",
              }
            : id === XeonBotInc.decodeJid(XeonBotInc.user.id)
            ? XeonBotInc.user
            : store.contacts[id] || {};
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
          "international"
        )
      );
    };

    XeonBotInc.public = true;

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store);

    // Connection handling
    XeonBotInc.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect, qr } = s;

      if (qr && !pairingCode) {
        console.log(
          chalk.yellow("📱 QR Code generated. Please scan with WhatsApp.")
        );
      }

      if (connection === "connecting") {
        console.log(chalk.yellow("🔄 Connecting to WhatsApp..."));
      }

      if (connection == "open") {
        // Close readline jika masih terbuka
        if (rl) rl.close();

        console.log(chalk.magenta(` `));
        console.log(
          chalk.yellow(
            `🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)
          )
        );

        try {
          const botNumber =
            XeonBotInc.user.id.split(":")[0] + "@s.whatsapp.net";
          await XeonBotInc.sendMessage(botNumber, {
            text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n✅Make sure to join below channel`,
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363287485628066@newsletter",
                newsletterName: "ZideeBot MD",
                serverMessageId: -1,
              },
            },
          });
        } catch (error) {
          console.error("Error sending connection message:", error.message);
        }

        await delay(1999);
        console.log(
          chalk.yellow(
            `\n\n                  ${chalk.bold.blue(
              `[ ${global.botname || "ZIDEEBOT"} ]`
            )}\n\n`
          )
        );
        console.log(
          chalk.cyan(`< ================================================== >`)
        );
        console.log(
          chalk.magenta(
            `\n${global.themeemoji || "•"} YT CHANNEL: MR UNIQUE HACKER`
          )
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} GITHUB: mrunqiuehacker`)
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} WA NUMBER: ${owner}`)
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} CREDIT: MR UNIQUE HACKER`)
        );
        console.log(
          chalk.green(
            `${global.themeemoji || "•"} 🤖 Bot Connected Successfully! ✅`
          )
        );
        console.log(chalk.blue(`Bot Version: ${settings.version}`));
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        console.log(
          chalk.red(
            `Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`
          )
        );

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          try {
            rmSync("./session", { recursive: true, force: true });
            console.log(
              chalk.yellow("Session folder deleted. Please re-authenticate.")
            );
          } catch (error) {
            console.error("Error deleting session:", error);
          }
          console.log(chalk.red("Session logged out. Please re-authenticate."));
        }

        if (shouldReconnect) {
          console.log(chalk.yellow("Reconnecting..."));
          await delay(5000);
          startXeonBotInc();
        }
      }
    });

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on("call", async (calls) => {
      try {
        const { readState: readAnticallState } = require("./commands/anticall");
        const state = readAnticallState();
        if (!state.enabled) return;
        for (const call of calls) {
          const callerJid = call.from || call.peerJid || call.chatId;
          if (!callerJid) continue;
          try {
            // First: attempt to reject the call if supported
            try {
              if (typeof XeonBotInc.rejectCall === "function" && call.id) {
                await XeonBotInc.rejectCall(call.id, callerJid);
              } else if (
                typeof XeonBotInc.sendCallOfferAck === "function" &&
                call.id
              ) {
                await XeonBotInc.sendCallOfferAck(call.id, callerJid, "reject");
              }
            } catch {}

            // Notify the caller only once within a short window
            if (!antiCallNotified.has(callerJid)) {
              antiCallNotified.add(callerJid);
              setTimeout(() => antiCallNotified.delete(callerJid), 60000);
              await XeonBotInc.sendMessage(callerJid, {
                text: "📵 Anticall is enabled. Your call was rejected and you will be blocked.",
              });
            }
          } catch {}
          // Then: block after a short delay to ensure rejection and message are processed
          setTimeout(async () => {
            try {
              await XeonBotInc.updateBlockStatus(callerJid, "block");
            } catch {}
          }, 800);
        }
      } catch (e) {
        // ignore
      }
    });

    XeonBotInc.ev.on("group-participants.update", async (update) => {
      await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on("messages.upsert", async (m) => {
      if (
        m.messages[0].key &&
        m.messages[0].key.remoteJid === "status@broadcast"
      ) {
        await handleStatus(XeonBotInc, m);
      }
    });

    XeonBotInc.ev.on("status.update", async (status) => {
      await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on("messages.reaction", async (status) => {
      await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc;
  } catch (error) {
    console.error("Error in startXeonBotInc:", error);
    await delay(5000);
    startXeonBotInc();
  }
}

// Start the bot with error handling
startXeonBotInc().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
