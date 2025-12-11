const { findProduct } = require('../lib/productManager');

/**
 * Show product detail when user types product name
 * @param {Object} sock - WhatsApp socket
 * @param {string} chatId - Chat ID
 * @param {Object} message - Message object
 * @param {string} productName - Product name to search
 */
async function productDetailCommand(sock, chatId, message, productName) {
    try {
        const product = findProduct(chatId, productName);
        
        if (!product) {
            return false; // Product not found, let other handlers process
        }

        // If product has image, send with image
        if (product.image && product.image.data) {
            const imageBuffer = Buffer.from(product.image.data, 'base64');
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: product.description,
                mimetype: product.image.mimetype || 'image/jpeg'
            }, { quoted: message });
        } else {
            // Send text only
            await sock.sendMessage(chatId, {
                text: product.description
            }, { quoted: message });
        }
        
        return true; // Product found and sent
        
    } catch (error) {
        console.error('Error in product detail command:', error);
        return false;
    }
}

module.exports = productDetailCommand;
