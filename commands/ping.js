const os = require('os');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: 'Mengukur respons...' }, { quoted: message });
        const end = Date.now();
        const ping = (end - start).toFixed(2);

        // Bot uptime
        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        // System uptime
        const systemUptimeSeconds = os.uptime();
        const systemUptimeFormatted = formatTime(systemUptimeSeconds);

        // System info
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        const totalRAM = (os.totalmem() / (1024 * 1024)).toFixed(0);
        const freeRAM = (os.freemem() / (1024 * 1024)).toFixed(0);
        const cpuModel = os.cpus()[0].model;
        const cpuCores = os.cpus().length;
        const nodeVersion = process.version;

        const botInfo = `🏓 *PONG! - STATUS SERVER*

⏱ *Respon Bot*     : ${ping} ms
🔄 *Uptime Bot*     : ${uptimeFormatted}
🕒 *Uptime System*  : ${systemUptimeFormatted}

💻 *Hostname*       : ${hostname}
🌐 *Platform*       : ${platform} (${arch})
🧠 *RAM Total*      : ${totalRAM} MB
📉 *RAM Bebas*      : ${freeRAM} MB
🧮 *CPU*            : ${cpuModel} (${cpuCores} cores)
📂 *Node.js*        : ${nodeVersion}`;

        // Reply to the original message with the bot info
        await sock.sendMessage(chatId, { text: botInfo }, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get bot status.' });
    }
}

module.exports = pingCommand;
