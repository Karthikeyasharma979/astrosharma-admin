const crypto = require('crypto');

// Generate 32-byte key from JWT_SECRET or default secret
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'astro_secure_admin_key_32_bytes!')
    .digest();

/**
 * Encrypt sensitive user data (email or phone)
 */
const encrypt = (text) => {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
        console.error('Encryption error:', err);
        return text;
    }
};

/**
 * Decrypt sensitive user data
 */
const decrypt = (encryptedText) => {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    try {
        const [ivHex, dataHex] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        let decrypted = decipher.update(dataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err);
        return encryptedText;
    }
};

/**
 * Mask email for privacy (e.g. k***e@example.com)
 */
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const cleanEmail = email.includes(':') ? decrypt(email) : email;
    const parts = cleanEmail.split('@');
    if (parts.length !== 2) return cleanEmail;
    const [user, domain] = parts;
    if (user.length <= 2) {
        return `${user[0] || '*'}***@${domain}`;
    }
    const maskedUser = `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user[user.length - 1]}`;
    return `${maskedUser}@${domain}`;
};

/**
 * Mask phone number for privacy (e.g. +91 98****3210)
 */
const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    const cleanPhone = phone.includes(':') ? decrypt(phone) : phone;
    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length < 6) return '****';
    const start = cleanPhone.slice(0, 3);
    const end = cleanPhone.slice(-3);
    return `${start}****${end}`;
};

module.exports = {
    encrypt,
    decrypt,
    maskEmail,
    maskPhone,
};
