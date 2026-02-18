/**
 * Ramadhan Auto-Scheduler System
 * Automatic Sahur & Iftar (Berbuka) Reminders
 */

const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const RAMADHAN_DATA_FILE = path.join(__dirname, '../data/ramadhan_groups.json');
const RAMADHAN_LOG_FILE = path.join(__dirname, '../logs/ramadhan.log');

// Default messages
const DEFAULT_MESSAGES = {
    sahur: "🌙 *Selamat sahur semuanya.*\n\nSemoga Allah memberikan kekuatan dan kelancaran dalam menjalankan puasa hari ini. Jangan lupa niat ya 🤲",
    iftar: "🌅 *Waktu berbuka telah tiba.*\n\nSelamat berbuka puasa, semoga Allah menerima amal ibadah kita hari ini 🤲"
};

class RamadhanScheduler {
    constructor(sock) {
        this.sock = sock;
        this.groups = this.loadGroups();
        this.maghribTime = null;
        this.maghribJob = null;
        this.initSchedulers();
    }

    // Load groups data from JSON
    loadGroups() {
        try {
            if (fs.existsSync(RAMADHAN_DATA_FILE)) {
                const data = fs.readFileSync(RAMADHAN_DATA_FILE, 'utf-8');
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
            fs.writeFileSync(RAMADHAN_DATA_FILE, JSON.stringify(this.groups, null, 2));
        } catch (error) {
            this.log(`Error saving groups: ${error.message}`);
        }
    }

    // Logger
    log(message) {
        const timestamp = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
        const logMessage = `[${timestamp}] ${message}\n`;
        
        console.log(`🕌 ${message}`);
        
        try {
            const dir = path.dirname(RAMADHAN_LOG_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.appendFileSync(RAMADHAN_LOG_FILE, logMessage);
        } catch (error) {
            console.error('Error writing log:', error);
        }
    }

    // Enable Ramadhan scheduler for a group
    enableGroup(groupId, customMessages = null) {
        this.groups[groupId] = {
            enabled: true,
            messages: customMessages || DEFAULT_MESSAGES,
            enabledAt: new Date().toISOString(),
            lastSahur: null,
            lastIftar: null
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
            if (type === 'sahur' || type === 'iftar') {
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
        return Object.keys(this.groups).filter(groupId => this.groups[groupId].enabled);
    }

    // Fetch Maghrib time from API
    async fetchMaghribTime() {
        try {
            const today = moment().tz('Asia/Jakarta').format('DD-MM-YYYY');
            
            // Aladhan API - Prayer Times for Jakarta
            const url = `https://api.aladhan.com/v1/timingsByCity/${today}`;
            const params = {
                city: 'Jakarta',
                country: 'Indonesia',
                method: 2 // Islamic Society of North America (ISNA)
            };

            const response = await axios.get(url, { params, timeout: 10000 });
            
            if (response.data && response.data.data && response.data.data.timings) {
                const maghrib = response.data.data.timings.Maghrib;
                this.log(`Maghrib time fetched: ${maghrib} WIB`);
                return maghrib; // Format: "18:05"
            }
        } catch (error) {
            this.log(`Error fetching Maghrib time: ${error.message}`);
            // Fallback to default time (18:00)
            return '18:00';
        }
        return '18:00';
    }

    // Schedule dynamic Maghrib reminder
    async scheduleMaghrib() {
        const maghribTime = await this.fetchMaghribTime();
        this.maghribTime = maghribTime;

        const [hour, minute] = maghribTime.split(':');
        const cronExpression = `${minute} ${hour} * * *`;

        // Cancel previous job if exists
        if (this.maghribJob) {
            this.maghribJob.stop();
        }

        // Create new cron job for maghrib
        this.maghribJob = cron.schedule(cronExpression, () => {
            this.sendIftarReminder();
        }, {
            timezone: 'Asia/Jakarta'
        });

        this.log(`Maghrib reminder scheduled at ${maghribTime} WIB (Cron: ${cronExpression})`);
    }

    // Initialize all schedulers
    initSchedulers() {
        this.log('Initializing Ramadhan Schedulers...');

        // 1. Sahur reminder - Fixed time 03:30 WIB
        cron.schedule('30 3 * * *', () => {
            this.sendSahurReminder();
        }, {
            timezone: 'Asia/Jakarta'
        });
        this.log('Sahur scheduler initialized (03:30 WIB)');

        // 2. Fetch Maghrib time daily at 00:01 WIB and schedule it
        cron.schedule('1 0 * * *', async () => {
            this.log('Fetching new Maghrib time for today...');
            await this.scheduleMaghrib();
        }, {
            timezone: 'Asia/Jakarta'
        });
        this.log('Daily Maghrib fetch scheduler initialized (00:01 WIB)');

        // 3. Initial Maghrib schedule for today
        this.scheduleMaghrib();

        this.log('All Ramadhan schedulers are active! ✅');
    }

    // Send Sahur reminder to all enabled groups
    async sendSahurReminder() {
        const enabledGroups = this.getEnabledGroups();
        this.log(`Sending Sahur reminder to ${enabledGroups.length} groups...`);

        for (const groupId of enabledGroups) {
            try {
                const groupData = this.groups[groupId];
                const message = groupData.messages.sahur;

                // Get all group members for mention
                const groupMetadata = await this.sock.groupMetadata(groupId);
                const participants = groupMetadata.participants || [];
                const allMembers = participants.map(p => p.id);

                // Send hidetag message
                await this.sock.sendMessage(groupId, {
                    text: message,
                    mentions: allMembers
                });

                // Update last sahur time
                this.groups[groupId].lastSahur = new Date().toISOString();
                this.saveGroups();

                this.log(`✅ Sahur reminder sent to group: ${groupId}`);
                
                // Delay to avoid rate limit
                await this.sleep(2000);
            } catch (error) {
                this.log(`❌ Failed to send Sahur reminder to ${groupId}: ${error.message}`);
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
                const message = groupData.messages.iftar;

                // Get all group members for mention
                const groupMetadata = await this.sock.groupMetadata(groupId);
                const participants = groupMetadata.participants || [];
                const allMembers = participants.map(p => p.id);

                // Send hidetag message
                await this.sock.sendMessage(groupId, {
                    text: message,
                    mentions: allMembers
                });

                // Update last iftar time
                this.groups[groupId].lastIftar = new Date().toISOString();
                this.saveGroups();

                this.log(`✅ Iftar reminder sent to group: ${groupId}`);
                
                // Delay to avoid rate limit
                await this.sleep(2000);
            } catch (error) {
                this.log(`❌ Failed to send Iftar reminder to ${groupId}: ${error.message}`);
            }
        }
    }

    // Helper: Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get statistics
    getStats() {
        const enabledGroups = this.getEnabledGroups();
        return {
            totalGroups: Object.keys(this.groups).length,
            enabledGroups: enabledGroups.length,
            maghribTime: this.maghribTime,
            groups: this.groups
        };
    }
}

module.exports = RamadhanScheduler;
