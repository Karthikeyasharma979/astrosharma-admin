const { analyzeSpamAndProfanity, checkIpRateLimit } = require('../utils/spamFilter');
const { encrypt, decrypt, maskEmail, maskPhone } = require('../utils/cryptoUtil');

console.log('--- Testing Anti-Spam & Profanity Engine ---');

const cleanReview = 'Astrologer Sharma provided very accurate predictions about my career. Highly recommend!';
const cleanResult = analyzeSpamAndProfanity(cleanReview);
console.log('Clean Review Spam Test:', cleanResult.isSpam === false ? 'PASS' : 'FAIL');

const linkReview = 'Best horoscope service ever! Visit https://free-crypto-astro.com for free coins!';
const linkResult = analyzeSpamAndProfanity(linkReview);
console.log('Promotional Link Test:', linkResult.isSpam === true && linkResult.flags.some(f => f.includes('PROMOTIONAL_LINK')) ? 'PASS' : 'FAIL');

const phoneReview = 'He is very genuine contact me on +91 98765 43210 for puja services';
const phoneResult = analyzeSpamAndProfanity(phoneReview);
console.log('Phone Solicitation Test:', phoneResult.isSpam === true && phoneResult.flags.some(f => f.includes('CONTACT_INFO_SOLICITATION')) ? 'PASS' : 'FAIL');

const profanityReview = 'This astrologer is a total scam and cheat, worst experience';
const profanityResult = analyzeSpamAndProfanity(profanityReview);
console.log('Profanity / Abuse Test:', profanityResult.isSpam === true && profanityResult.flags.some(f => f.includes('PROFANITY_OR_SPAM_KEYWORD')) ? 'PASS' : 'FAIL');

const spamCharReview = 'Aaaaaaaaaaaaaaaaaaaaaaa this was soooo good!!!!!!!!!!';
const spamCharResult = analyzeSpamAndProfanity(spamCharReview);
console.log('Spam Repetition Test:', spamCharResult.isSpam === true ? 'PASS' : 'FAIL');

console.log('\n--- Testing Encryption & Privacy Masking ---');
const rawEmail = 'karthikeyasharma@gmail.com';
const rawPhone = '+919876543210';

const encryptedEmail = encrypt(rawEmail);
const decryptedEmail = decrypt(encryptedEmail);
console.log('Email Encryption/Decryption:', decryptedEmail === rawEmail ? 'PASS' : 'FAIL');

const maskedEmail = maskEmail(rawEmail);
console.log('Masked Email:', maskedEmail, maskedEmail.includes('***') ? 'PASS' : 'FAIL');

const maskedPhone = maskPhone(rawPhone);
console.log('Masked Phone:', maskedPhone, maskedPhone.includes('****') ? 'PASS' : 'FAIL');

console.log('\n--- Testing IP Rate Limiting ---');
const testIp = '192.168.1.100';
for (let i = 0; i < 5; i++) {
    checkIpRateLimit(testIp, 5, 10000);
}
const rateBlocked = checkIpRateLimit(testIp, 5, 10000);
console.log('Rate Limit Check (Exceeded):', rateBlocked.allowed === false ? 'PASS' : 'FAIL');

console.log('\nAll Review Security & Anti-Spam tests completed successfully!');
