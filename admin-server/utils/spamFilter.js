/**
 * Anti-Fake & Spam Detection Engine for Astro Reviews
 */

// Profanity, toxic insults & commercial spam keyword catalog
const SPAM_AND_PROFANITY_KEYWORDS = [
    // Profanities and abusive words
    'abuse', 'bastard', 'bitch', 'asshole', 'fuck', 'shit', 'scam', 'fraud', 'cheat', 'liar',
    'idiot', 'moron', 'crap', 'scammer', 'fake astrologer', 'looter',
    // Commercial spam & bot triggers
    'free money', 'crypto', 'bitcoin', 'investment guarantee', 'whatsapp me', 'call me on',
    'contact me at', 'telegram', 'loan', 'forex', 'casino', 'viagra', 'earn money', 'work from home',
    'click here', 'visit site', 'buy cheap', 'discount code', 'free followers', 'seo service'
];

// URL / Web domain regex
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|xyz|biz|info|in|me|io|top|club|vip)\b)/i;

// Phone number pattern within comment text (e.g. 10+ digits with spaces, dashes, or country code)
const PHONE_CANDIDATE_REGEX = /(?:\+?\d[\d\s\-.()]{7,}\d)/g;

/**
 * Analyzes text for spam, links, profanity, and bot signatures
 * @param {string} text - Review text
 * @returns {Object} { isSpam: boolean, flags: string[], reasons: string }
 */
const analyzeSpamAndProfanity = (text = '') => {
    const flags = [];
    const lower = text.toLowerCase();

    // 1. Check for promotional links
    if (URL_REGEX.test(text)) {
        flags.push('PROMOTIONAL_LINK: Review contains external website link or domain');
    }

    // 2. Check for embedded phone numbers or WhatsApp contact spam
    const candidatePhones = text.match(PHONE_CANDIDATE_REGEX);
    if (candidatePhones) {
        for (const candidate of candidatePhones) {
            const digitCount = candidate.replace(/\D/g, '').length;
            if (digitCount >= 10 && digitCount <= 15) {
                flags.push('CONTACT_INFO_SOLICITATION: Review contains an embedded phone number');
                break;
            }
        }
    }


    // 3. Check for profanity and spam trigger keywords
    for (const keyword of SPAM_AND_PROFANITY_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lower)) {
            flags.push(`PROFANITY_OR_SPAM_KEYWORD: Found restricted keyword "${keyword}"`);
        }
    }

    // 4. Check for repetitive spam characters (e.g. "aaaaa!!!!!", "sooooooo goooood")
    if (/(.)\1{5,}/i.test(text)) {
        flags.push('REPETITIVE_CHARACTERS: Suspicious repetition pattern detected');
    }

    // 5. Bot gibberish checks: excessive uppercase letters
    const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
    if (text.length > 20 && uppercaseCount / text.length > 0.6) {
        flags.push('EXCESSIVE_CAPS: Potential bot/shouting review format');
    }

    return {
        isSpam: flags.length > 0,
        flags,
        summary: flags.join(' | ')
    };
};

/**
 * In-memory IP rate limiter for review submissions
 * Allows up to 5 submissions per IP per hour
 */
const ipSubmissionTracker = new Map();

const checkIpRateLimit = (ipAddress, limit = 5, windowMs = 60 * 60 * 1000) => {
    if (!ipAddress) return { allowed: true };
    const now = Date.now();
    const timestamps = ipSubmissionTracker.get(ipAddress) || [];
    
    // Clean old entries
    const recent = timestamps.filter(ts => now - ts < windowMs);
    
    if (recent.length >= limit) {
        return {
            allowed: false,
            retryAfterMs: windowMs - (now - recent[0])
        };
    }

    recent.push(now);
    ipSubmissionTracker.set(ipAddress, recent);
    return { allowed: true };
};

module.exports = {
    analyzeSpamAndProfanity,
    checkIpRateLimit
};
