/**
 * Ramadhan Auto-Scheduler System
 * Automatic Sahur & Iftar (Berbuka) Reminders
 */

const cron = require("node-cron");
const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

const RAMADHAN_DATA_FILE = path.join(__dirname, "../data/ramadhan_groups.json");
const RAMADHAN_LOG_FILE = path.join(__dirname, "../logs/ramadhan.log");

// Default messages - 3 variasi untuk rotasi harian
const DEFAULT_MESSAGES = {
  sahur: [
    "🌙 *Selamat Sahur Semuanya!*\n\nWaktunya bangun dan menyantap sahur. Semoga Allah memberikan kekuatan dan kelancaran dalam menjalankan ibadah puasa hari ini. Jangan lupa niat ya 🤲\n\n_Sahur penuh berkah, puasa penuh semangat!_ ✨",
    "🌙 *Sahur... Sahur... Sahur!*\n\nHai semuanya, waktunya sahur nih! Makan yang cukup biar kuat puasa sampai maghrib 💪\n\nBismillahirrahmanirrahim... Semoga puasa kita hari ini diterima dan dilipatgandakan pahalanya oleh Allah SWT 🤲",
    "🌙 *Assalamualaikum, Selamat Sahur!*\n\nJangan sampai terlewat sahurnya ya! Sahur adalah sunnah yang penuh berkah dan keberkahan 🌟\n\nYuk manfaatkan waktu sahur untuk berdoa dan berdzikir. Semoga ibadah kita hari ini diterima Allah SWT 🤲",
  ],
  iftar: [
    "🌅 *Waktu Berbuka Telah Tiba!*\n\nAlhamdulillah, kita telah melewati hari ini dengan berpuasa. Selamat berbuka puasa semuanya! 🥤🍽️\n\nSemoga amal ibadah dan puasa kita hari ini diterima oleh Allah SWT 🤲",
    "🌅 *Adzan Maghrib Telah Berkumandang!*\n\nSaatnya batalkan puasa kalian. Segera berbuka dengan yang manis-manis dulu ya 😊\n\n_Allahumma lakasumtu wabika amantu wa'ala rizqika aftartu_\n\nSelamat berbuka, semoga berkah! 🤲",
    "🌅 *Berbuka Puasa Yuk!*\n\nTak terasa seharian penuh kita berpuasa, kini saatnya berbuka! 🎉\n\nSelamat menikmati hidangan berbuka, semoga tubuh kita sehat selalu dan seluruh ibadah kita diterima oleh Allah SWT 🤲",
  ],
};

class RamadhanScheduler {
  constructor(sock) {
    this.sock = sock;
    this.groups = this.loadGroups();
    this.maghribTime = null;
    this.maghribJob = null;
    this.groupJobs = {}; // { groupId: { openJob, closeJob } }
    this.initSchedulers();
  }

  // Load groups data from JSON
  loadGroups() {
    try {
      if (fs.existsSync(RAMADHAN_DATA_FILE)) {
        const data = fs.readFileSync(RAMADHAN_DATA_FILE, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      this.log(`Error loading groups: ${error.message}`);
    }
    return {};
  }

  // Save groups data to JSON
  saveGroups() {
    try {
      const dir = path.dirname(RAMADHAN_DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        RAMADHAN_DATA_FILE,
        JSON.stringify(this.groups, null, 2),
      );
    } catch (error) {
      this.log(`Error saving groups: ${error.message}`);
    }
  }

  // Logger
  log(message) {
    const timestamp = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(`🕌 ${message}`);

    try {
      const dir = path.dirname(RAMADHAN_LOG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(RAMADHAN_LOG_FILE, logMessage);
    } catch (error) {
      console.error("Error writing log:", error);
    }
  }

  // Enable Ramadhan scheduler for a group
  enableGroup(groupId, customMessages = null) {
    const existing = this.groups[groupId] || {};
    this.groups[groupId] = {
      enabled: true,
      messages: customMessages || existing.messages || DEFAULT_MESSAGES,
      enabledAt: new Date().toISOString(),
      lastSahur: existing.lastSahur || null,
      lastIftar: existing.lastIftar || null,
      openTime: existing.openTime || null,
      closeTime: existing.closeTime || null,
    };
    this.saveGroups();
    this.log(`Ramadhan scheduler enabled for group: ${groupId}`);
  }

  // Disable Ramadhan scheduler for a group
  disableGroup(groupId) {
    if (this.groups[groupId]) {
      this.groups[groupId].enabled = false;
      this.saveGroups();
      this.log(`Ramadhan scheduler disabled for group: ${groupId}`);
    }
  }

  // Update custom messages for a group
  updateMessages(groupId, type, message) {
    if (this.groups[groupId]) {
      if (type === "sahur" || type === "iftar") {
        this.groups[groupId].messages[type] = message;
        this.saveGroups();
        this.log(`Updated ${type} message for group: ${groupId}`);
        return true;
      }
    }
    return false;
  }

  // Get group status
  getGroupStatus(groupId) {
    return this.groups[groupId] || null;
  }

  // Get all enabled groups
  getEnabledGroups() {
    return Object.keys(this.groups).filter(
      (groupId) => this.groups[groupId].enabled,
    );
  }

  // Fetch Maghrib time from API
  // Menggunakan 3 lapis fallback untuk memastikan berjalan di VPS maupun Local:
  //   1. api.aladhan.com  (dengan force IPv4 agar VPS Ubuntu tidak timeout)
  //   2. api.myquran.com  (API sholat Indonesia, backup jika aladhan gagal)
  //   3. Kalkulasi per-bulan Jakarta (hardcoded, tidak butuh internet)
  async fetchMaghribTime() {
    const https = require("https");
    const now = moment().tz("Asia/Jakarta");
    const today = now.format("DD-MM-YYYY");
    const year = now.format("YYYY");
    const month = now.format("M");
    const day = now.format("D");

    // ── Force IPv4 ──────────────────────────────────────────────────────────
    // VPS Ubuntu secara default prefer IPv6. Banyak API (termasuk aladhan.com)
    // bermasalah di IPv6 sehingga request hang/timeout → fallback 18:00.
    // Solusi: paksa pakai IPv4 lewat custom httpsAgent.
    // ────────────────────────────────────────────────────────────────────────
    const httpsAgent = new https.Agent({ family: 4 });
    const axiosConfig = {
      timeout: 15000,
      httpsAgent,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZideeBot/1.0; +https://github.com)",
      },
    };

    // ── API 1: aladhan.com ──────────────────────────────────────────────────
    try {
      const url = `https://api.aladhan.com/v1/timingsByCity/${today}`;
      const response = await axios.get(url, {
        ...axiosConfig,
        params: {
          city: "Jakarta",
          country: "Indonesia",
          method: 20, // Kementerian Agama Indonesia
        },
      });

      const maghrib = response.data?.data?.timings?.Maghrib;
      if (maghrib) {
        // Hilangkan suffix timezone jika ada, misal "18:05 (WIB)" → "18:05"
        const clean = maghrib.trim().split(" ")[0];
        this.log(`Maghrib time fetched (aladhan.com): ${clean} WIB`);
        return clean;
      }
    } catch (err) {
      // Tampilkan error code agar mudah debug (misal ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
      this.log(
        `⚠️ API 1 (aladhan.com) gagal [${err.code || err.message}] - mencoba API 2...`,
      );
    }

    // ── API 2: myquran.com (API sholat Indonesia) ───────────────────────────
    try {
      // Kode kota Jakarta (DKI Jakarta Pusat) = 1301
      const url = `https://api.myquran.com/v2/sholat/jadwal/1301/${year}/${month}/${day}`;
      const response = await axios.get(url, axiosConfig);

      const maghrib = response.data?.data?.jadwal?.maghrib;
      if (maghrib) {
        this.log(`Maghrib time fetched (myquran.com): ${maghrib} WIB`);
        return maghrib;
      }
    } catch (err) {
      this.log(
        `⚠️ API 2 (myquran.com) gagal [${err.code || err.message}] - pakai kalkulasi fallback...`,
      );
    }

    // ── Fallback 3: Kalkulasi per-bulan Jakarta ─────────────────────────────
    // Tidak butuh internet. Akurasi ±5 menit untuk wilayah Jakarta.
    const fallback = this._calcFallbackMaghrib(now);
    this.log(`⚠️ Semua API gagal. Menggunakan waktu fallback: ${fallback} WIB`);
    return fallback;
  }

  // Kalkulasi approx Maghrib Jakarta berdasarkan bulan (tidak butuh API)
  _calcFallbackMaghrib(momentObj) {
    const m = momentObj.month() + 1; // 1–12
    const table = {
      1: "18:10",
      2: "18:15",
      3: "18:10",
      4: "18:00",
      5: "17:52",
      6: "17:48",
      7: "17:50",
      8: "17:55",
      9: "17:55",
      10: "18:00",
      11: "18:05",
      12: "18:10",
    };
    return table[m] || "18:00";
  }

  // Schedule dynamic Maghrib reminder
  async scheduleMaghrib() {
    const maghribTime = await this.fetchMaghribTime();
    this.maghribTime = maghribTime;

    const [hour, minute] = maghribTime.split(":");
    const cronExpression = `${minute} ${hour} * * *`;

    // Cancel previous job if exists
    if (this.maghribJob) {
      this.maghribJob.stop();
    }

    // Create new cron job for maghrib
    this.maghribJob = cron.schedule(
      cronExpression,
      () => {
        this.sendIftarReminder();
      },
      {
        timezone: "Asia/Jakarta",
      },
    );

    this.log(
      `Maghrib reminder scheduled at ${maghribTime} WIB (Cron: ${cronExpression})`,
    );
  }

  // Initialize all schedulers
  initSchedulers() {
    this.log("Initializing Ramadhan Schedulers...");

    // 1. Sahur reminder - Fixed time 03:30 WIB
    cron.schedule(
      "30 3 * * *",
      () => {
        this.sendSahurReminder();
      },
      {
        timezone: "Asia/Jakarta",
      },
    );
    this.log("Sahur scheduler initialized (03:30 WIB)");

    // 2. Fetch Maghrib time daily at 00:01 WIB and schedule it
    cron.schedule(
      "1 0 * * *",
      async () => {
        this.log("Fetching new Maghrib time for today...");
        await this.scheduleMaghrib();
      },
      {
        timezone: "Asia/Jakarta",
      },
    );
    this.log("Daily Maghrib fetch scheduler initialized (00:01 WIB)");

    // 3. Initial Maghrib schedule for today
    this.scheduleMaghrib();

    // 4. Restore group open/close schedules
    this.restoreGroupSchedules();

    this.log("All Ramadhan schedulers are active! ✅");
  }

  // Set auto open/close schedule for a group
  setGroupSchedule(groupId, type, time) {
    if (!this.groups[groupId]) {
      this.groups[groupId] = {
        enabled: false,
        messages: { ...DEFAULT_MESSAGES },
        enabledAt: null,
        lastSahur: null,
        lastIftar: null,
        openTime: null,
        closeTime: null,
      };
    }
    if (type === "open") {
      this.groups[groupId].openTime = time;
    } else if (type === "close") {
      this.groups[groupId].closeTime = time;
    }
    this.saveGroups();
    this.scheduleGroupOpenClose(groupId, type, time);
  }

  // Remove auto open/close schedule for a group
  removeGroupSchedule(groupId, type) {
    if (!this.groups[groupId]) return;
    if (type === "open") {
      this.groups[groupId].openTime = null;
      if (this.groupJobs[groupId]?.openJob) {
        this.groupJobs[groupId].openJob.stop();
        delete this.groupJobs[groupId].openJob;
      }
    } else if (type === "close") {
      this.groups[groupId].closeTime = null;
      if (this.groupJobs[groupId]?.closeJob) {
        this.groupJobs[groupId].closeJob.stop();
        delete this.groupJobs[groupId].closeJob;
      }
    }
    this.saveGroups();
    this.log(`Group ${type} schedule removed for: ${groupId}`);
  }

  // Schedule a group open/close cron job
  scheduleGroupOpenClose(groupId, type, time) {
    const [hour, minute] = time.split(":");
    const cronExpression = `${parseInt(minute)} ${parseInt(hour)} * * *`;

    if (!this.groupJobs[groupId]) {
      this.groupJobs[groupId] = {};
    }

    // Stop existing job of same type
    if (type === "open" && this.groupJobs[groupId].openJob) {
      this.groupJobs[groupId].openJob.stop();
    } else if (type === "close" && this.groupJobs[groupId].closeJob) {
      this.groupJobs[groupId].closeJob.stop();
    }

    const setting = type === "open" ? "not_announcement" : "announcement";
    const label = type === "open" ? "🔓 Dibuka" : "🔒 Ditutup";

    const job = cron.schedule(
      cronExpression,
      async () => {
        try {
          await this.sock.groupSettingUpdate(groupId, setting);
          this.log(`✅ Grup ${label} otomatis: ${groupId} jam ${time} WIB`);
        } catch (error) {
          this.log(
            `❌ Gagal ${type === "open" ? "membuka" : "menutup"} grup ${groupId}: ${error.message}`,
          );
        }
      },
      { timezone: "Asia/Jakarta" },
    );

    if (type === "open") {
      this.groupJobs[groupId].openJob = job;
    } else {
      this.groupJobs[groupId].closeJob = job;
    }

    this.log(
      `Group ${type} schedule set at ${time} WIB (Cron: ${cronExpression}) for: ${groupId}`,
    );
  }

  // Restore all saved group open/close schedules on startup
  restoreGroupSchedules() {
    let restored = 0;
    for (const groupId of Object.keys(this.groups)) {
      const group = this.groups[groupId];
      if (group.openTime) {
        this.scheduleGroupOpenClose(groupId, "open", group.openTime);
        restored++;
      }
      if (group.closeTime) {
        this.scheduleGroupOpenClose(groupId, "close", group.closeTime);
        restored++;
      }
    }
    this.log(`Group open/close schedules restored: ${restored} job(s)`);
  }

  // Send Sahur reminder to all enabled groups
  async sendSahurReminder() {
    const enabledGroups = this.getEnabledGroups();
    this.log(`Sending Sahur reminder to ${enabledGroups.length} groups...`);

    for (const groupId of enabledGroups) {
      try {
        const groupData = this.groups[groupId];
        const sahurVariants = groupData.messages.sahur;
        const dayIndex = moment().tz("Asia/Jakarta").dayOfYear();
        const message = Array.isArray(sahurVariants)
          ? sahurVariants[dayIndex % sahurVariants.length]
          : sahurVariants;

        // Get all group members for mention
        const groupMetadata = await this.sock.groupMetadata(groupId);
        const participants = groupMetadata.participants || [];
        const allMembers = participants.map((p) => p.id);

        // Send hidetag message
        await this.sock.sendMessage(groupId, {
          text: message,
          mentions: allMembers,
        });

        // Update last sahur time
        this.groups[groupId].lastSahur = new Date().toISOString();
        this.saveGroups();

        this.log(`✅ Sahur reminder sent to group: ${groupId}`);

        // Delay to avoid rate limit
        await this.sleep(2000);
      } catch (error) {
        this.log(
          `❌ Failed to send Sahur reminder to ${groupId}: ${error.message}`,
        );
      }
    }
  }

  // Send Iftar (Berbuka) reminder to all enabled groups
  async sendIftarReminder() {
    const enabledGroups = this.getEnabledGroups();
    this.log(`Sending Iftar reminder to ${enabledGroups.length} groups...`);

    for (const groupId of enabledGroups) {
      try {
        const groupData = this.groups[groupId];
        const iftarVariants = groupData.messages.iftar;
        const dayIndex = moment().tz("Asia/Jakarta").dayOfYear();
        const message = Array.isArray(iftarVariants)
          ? iftarVariants[dayIndex % iftarVariants.length]
          : iftarVariants;

        // Get all group members for mention
        const groupMetadata = await this.sock.groupMetadata(groupId);
        const participants = groupMetadata.participants || [];
        const allMembers = participants.map((p) => p.id);

        // Send hidetag message
        await this.sock.sendMessage(groupId, {
          text: message,
          mentions: allMembers,
        });

        // Update last iftar time
        this.groups[groupId].lastIftar = new Date().toISOString();
        this.saveGroups();

        this.log(`✅ Iftar reminder sent to group: ${groupId}`);

        // Delay to avoid rate limit
        await this.sleep(2000);
      } catch (error) {
        this.log(
          `❌ Failed to send Iftar reminder to ${groupId}: ${error.message}`,
        );
      }
    }
  }

  // Helper: Sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get statistics
  getStats() {
    const enabledGroups = this.getEnabledGroups();
    return {
      totalGroups: Object.keys(this.groups).length,
      enabledGroups: enabledGroups.length,
      maghribTime: this.maghribTime,
      groups: this.groups,
    };
  }
}

module.exports = RamadhanScheduler;
