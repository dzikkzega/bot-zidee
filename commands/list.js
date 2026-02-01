const { getAllProducts } = require("../lib/productManager");
const moment = require("moment-timezone");

async function listCommand(sock, chatId, message) {
  try {
    const products = getAllProducts(chatId);

    // Get sender name for personalized greeting
    const senderId = message.key.participant || message.key.remoteJid;
    const senderName = message.pushName || "Kak";

    // Get current date and time in WIB
    moment.locale("id");
    const currentDate = moment().tz("Asia/Jakarta").format("DD MMMM YYYY");
    const currentTime = moment().tz("Asia/Jakarta").format("HH.mm.ss");

    // Determine greeting based on time
    const hour = parseInt(moment().tz("Asia/Jakarta").format("HH"));
    let greeting = "Selamat Malam";
    if (hour >= 3 && hour < 11) greeting = "Selamat Pagi";
    else if (hour >= 11 && hour < 15) greeting = "Selamat Siang";
    else if (hour >= 15 && hour < 18) greeting = "Selamat Sore";

    if (products.length === 0) {
      await sock.sendMessage(
        chatId,
        {
          text: `Halo kak @${senderId.split("@")[0]} ${greeting} 🐿🐿
𝑺𝒆𝒍𝒂𝒎𝒂𝒕 𝒅𝒂𝒕𝒂𝒏𝒈 𝒅𝒊 @Zideetech | Open Reseller harga diskon -1k

🗓 Tanggal : ${currentDate}
⏰ Waktu : ${currentTime} WIB

❌ Belum ada produk yang terdaftar.

💡 *Cara menambah produk:*
• Gunakan \`addlist [nama]#[deskripsi]\` untuk menambah produk
• Atau kirim foto + caption \`addlist [nama]#[deskripsi]\``,
          mentions: [senderId],
        },
        { quoted: message }
      );
      return;
    }

    // Sort products alphabetically
    const sortedProducts = products.sort((a, b) =>
      a.name.toUpperCase().localeCompare(b.name.toUpperCase())
    );

    // Build product list
    let productList = "";
    sortedProducts.forEach((product) => {
      const hasImage = product.image ? "🖼" : "📝";
      productList += `╎🎉 ${product.name} ${hasImage}\n`;
    });

    const listText = `Halo kak @${senderId.split("@")[0]} ${greeting} 🐿🐿
𝑺𝒆𝒍𝒂𝒎𝒂𝒕 𝒅𝒂𝒕𝒂𝒏𝒈 𝒅𝒊 @Zideetech | Open Reseller harga diskon -1k

🗓 Tanggal : ${currentDate}
⏰ Waktu : ${currentTime} WIB

Silahkan pilih layanan yang disediakan dibawah ini 🐤
╭✄┈⟬ LAYANAN TERSEDIA di @Zideetech | Open Reseller harga diskon -1k⟭ 
${productList}╰──────────◇

˖ ࣪⌗ Ketik Sesuai Yang Tersedia Pada List
> Selamat berbelanja dan enjoy ! ᡣ੭

📊 Total produk: ${products.length} (A-Z)`;

    await sock.sendMessage(
      chatId,
      {
        text: listText,
        mentions: [senderId],
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in list command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Gagal menampilkan daftar produk!",
      },
      { quoted: message }
    );
  }
}

module.exports = listCommand;
