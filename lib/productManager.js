const fs = require('fs');
const path = require('path');

/**
 * Format date to match template: "9/8/2025, 12.24.08"
 * @returns {string} Formatted date string
 */
function formatDate() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
}

/**
 * Get product file path for a specific group
 * @param {string} groupId - Group JID
 * @returns {string} File path
 */
function getProductFilePath(groupId) {
    return path.join(__dirname, '..', 'data', 'products', `${groupId.replace(/[@.]/g, '_')}.json`);
}

/**
 * Load products for a specific group
 * @param {string} groupId - Group JID
 * @returns {Array} Array of products
 */
function loadProducts(groupId) {
    try {
        const filePath = getProductFilePath(groupId);
        
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const parsedData = JSON.parse(fileContent);
            
            // Handle both old format (object) and new format (array)
            if (Array.isArray(parsedData)) {
                return parsedData;
            } else if (typeof parsedData === 'object' && parsedData !== null) {
                // Convert old object format to array format
                const products = [];
                for (const [key, value] of Object.entries(parsedData)) {
                    if (value && typeof value === 'object') {
                        products.push({
                            id: Date.now() + Math.random(),
                            name: (value.name || key).toLowerCase(),
                            description: value.description || '',
                            image: value.image || null,
                            createdAt: value.createdAt || formatDate(),
                            updatedAt: value.updatedAt || formatDate()
                        });
                    }
                }
                // Save in new format
                saveProducts(groupId, products);
                return products;
            }
        }
        return [];
    } catch (error) {
        console.error(`❌ Error loading products for ${groupId}:`, error);
        return [];
    }
}

/**
 * Save products for a specific group
 * @param {string} groupId - Group JID
 * @param {Array} products - Array of products
 * @returns {boolean} Success status
 */
function saveProducts(groupId, products) {
    try {
        const filePath = getProductFilePath(groupId);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Ensure products is always an array
        const dataToSave = Array.isArray(products) ? products : [];
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving products for', groupId, ':', error);
        return false;
    }
}

/**
 * Add a new product
 * @param {string} groupId - Group JID
 * @param {string} name - Product name
 * @param {string} description - Product description
 * @param {Buffer} imageBuffer - Optional image buffer
 * @param {string} mimetype - Optional image mimetype
 * @returns {Object} New product object
 */
function addProduct(groupId, name, description, imageBuffer = null, mimetype = null) {
    const products = loadProducts(groupId);
    const timestamp = Date.now() + Math.random();
    const dateStr = formatDate();
    
    const newProduct = {
        id: timestamp,
        name: name.toLowerCase(),
        description: description,
        image: null,
        createdAt: dateStr,
        updatedAt: dateStr
    };
    
    if (imageBuffer && mimetype) {
        newProduct.image = {
            data: imageBuffer.toString('base64'),
            mimetype: mimetype,
            timestamp: Date.now()
        };
    }
    
    products.push(newProduct);
    saveProducts(groupId, products);
    return newProduct;
}

/**
 * Find a product by name
 * @param {string} groupId - Group JID
 * @param {string} name - Product name
 * @returns {Object|null} Product object or null
 */
function findProduct(groupId, name) {
    try {
        const products = loadProducts(groupId);
        if (!Array.isArray(products)) return null;
        
        return products.find(p => {
            if (!p || !p.name) return false;
            return p.name.toLowerCase() === name.toLowerCase();
        });
    } catch (error) {
        console.error('Error finding product:', error);
        return null;
    }
}

/**
 * Delete a product by name
 * @param {string} groupId - Group JID
 * @param {string} name - Product name
 * @returns {Object|null} Deleted product or null
 */
function deleteProduct(groupId, name) {
    const products = loadProducts(groupId);
    const index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (index !== -1) {
        const deleted = products.splice(index, 1)[0];
        saveProducts(groupId, products);
        return deleted;
    }
    return null;
}

/**
 * Update a product
 * @param {string} groupId - Group JID
 * @param {string} name - Product name
 * @param {string} newDescription - New description
 * @param {Buffer} imageBuffer - Optional new image buffer
 * @param {string} mimetype - Optional new image mimetype
 * @returns {Object|null} Updated product or null
 */
function updateProduct(groupId, name, newDescription, imageBuffer = null, mimetype = null) {
    const products = loadProducts(groupId);
    const index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (index !== -1) {
        products[index].description = newDescription;
        products[index].updatedAt = formatDate();
        
        // Update image if provided
        if (imageBuffer && mimetype) {
            products[index].image = {
                data: imageBuffer.toString('base64'),
                mimetype: mimetype,
                timestamp: Date.now()
            };
        }
        
        saveProducts(groupId, products);
        return products[index];
    }
    return null;
}

/**
 * Get all products for a group
 * @param {string} groupId - Group JID
 * @returns {Array} Array of products
 */
function getAllProducts(groupId) {
    return loadProducts(groupId);
}

module.exports = {
    getProductFilePath,
    loadProducts,
    saveProducts,
    addProduct,
    findProduct,
    deleteProduct,
    updateProduct,
    getAllProducts
};
