const { addProduct, findProduct } = require("../lib/productManager");
const isAdmin = require("../lib/isAdmin");
const parseProductArgs = require("../lib/parseProductArgs");

async function addlistCommand(
  sock,
  chatId,
  message,
  args,
  imageBuffer = null,
  mimetype = null
) {
  try {
    // Check if group
    const isGroup = chatId.endsWith("@g.us");
    if (!isGroup) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Command ini hanya bisa digunakan di grup!",
        },
        { quoted: message }
      );
      return;
    }

    // Check if admin
    const senderId = message.key.participant || message.key.remoteJid;
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
      await sock.sendMessage(
        chatId,
        {
          text: `🚫 *Akses Ditolak*

❌ Perintah "addlist" tidak dapat diakses karena bukan admin.

💡 Hanya admin grup yang dapat mengelola product list.`,
        },
        { quoted: message }
      );
      return;
    }

    // Parse arguments
    const parsedArgs = parseProductArgs(args);
    if (!parsedArgs) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Format salah! Gunakan: addlist [nama]#[deskripsi]",
        },
        { quoted: message }
      );
      return;
    }

    const productName = parsedArgs.productName;
    const productDescription = parsedArgs.description;

    if (!productName || !productDescription) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Nama produk dan deskripsi tidak boleh kosong!",
        },
        { quoted: message }
      );
      return;
    }

    // Check if product already exists
    const existingProduct = findProduct(chatId, productName);
    if (existingProduct) {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ *Produk Sudah Ada*

🛍️ Produk "${productName}" sudah terdaftar dalam list.

💡 Gunakan \`updlist ${productName}#[deskripsi baru]\` untuk update
💡 Atau \`dellist ${productName}\` untuk hapus`,
        },
        { quoted: message }
      );
      return;
    }

    // Add product
    const newProduct = addProduct(
      chatId,
      productName,
      productDescription,
      imageBuffer,
      mimetype
    );

    const imageNote = imageBuffer
      ? "\n🖼️ Gambar produk berhasil ditambahkan"
      : "";

    await sock.sendMessage(
      chatId,
      {
        text: `✅ *Produk Berhasil Ditambahkan*

🛍️ *${newProduct.name}*

📝 *Deskripsi:* ${newProduct.description}${imageNote}

💡 *Cara menggunakan:*
• Ketik nama produk untuk melihat detail
• Gunakan "detail ${newProduct.name}" untuk melihat detail lengkap
• Gunakan "list" untuk melihat semua produk`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in addlist command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Gagal menambahkan produk!",
      },
      { quoted: message }
    );
  }
}

module.exports = addlistCommand;
