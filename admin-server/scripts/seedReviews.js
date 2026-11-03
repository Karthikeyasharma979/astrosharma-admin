require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/astro_sharma';

const sampleReviews = [
    {
        authorName: 'Ravi Kumar',
        userEmail: 'ravi.kumar@example.com',
        userPhone: '+91 9876543210',
        rating: 5,
        comment: 'Guruji predicted my job switch timeline accurately to within two weeks! The gemstone recommendation has brought great peace of mind.',
        serviceName: 'Career & Financial Horoscope',
        astrologerName: 'Astrologer Sharma',
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'order_abc456',
        transactionId: 'pay_xyz123',
        adminNotes: 'Verified consultation completed on Razorpay.',
    },
    {
        authorName: 'Priya Verma',
        userEmail: 'priya.verma@example.com',
        userPhone: '+91 9811223344',
        rating: 5,
        comment: 'Kundli matching for my marriage was conducted with deep Vedic detail. Highly recommended for genuine astrological clarity.',
        serviceName: 'Kundli & Marriage Matching',
        astrologerName: 'Astrologer Sharma',
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'order_mrg789',
        transactionId: 'pay_mrg789',
        adminNotes: 'Verified consultation payment.',
    },
    {
        authorName: 'Sanjay Deshmukh',
        userEmail: 'sanjay.d@example.com',
        userPhone: '+91 9765432100',
        rating: 4,
        comment: 'Very helpful consultation. The remedy suggested was simple and practical. Session started 10 minutes late but content was top notch.',
        serviceName: 'Vedic Horoscope Analysis',
        astrologerName: 'Astrologer Sharma',
        status: 'pending',
        isVerifiedBooking: false,
        adminNotes: 'Unverified public submission: Held in pending queue for admin review.',
        flags: ['UNVERIFIED_PURCHASE: No verified completed booking match'],
    },
    {
        authorName: 'CryptoBot99',
        userEmail: 'bot@spamnetwork.xyz',
        userPhone: '+1 555 019 2831',
        rating: 1,
        comment: 'Earn 5000 USD daily with automated crypto signals! Visit https://crypto-trading-bot.xyz or whatsapp me at +91 9876543210 for free trial!',
        serviceName: 'General Consultation',
        status: 'flagged',
        isVerifiedBooking: false,
        adminNotes: 'Auto-flagged by anti-spam system: PROMOTIONAL_LINK | CONTACT_INFO_SOLICITATION | PROFANITY_OR_SPAM_KEYWORD',
        flags: [
            'PROMOTIONAL_LINK: Review contains external website link or domain',
            'CONTACT_INFO_SOLICITATION: Review contains an embedded phone number',
            'PROFANITY_OR_SPAM_KEYWORD: Found restricted keyword "crypto"',
        ],
    },
    {
        authorName: 'Anonymous Spammer',
        userEmail: 'spammer@tempmail.com',
        userPhone: '0000000000',
        rating: 1,
        comment: 'Fffffffffffffffffffffffffffake astrologer total scam and looter do not book anything',
        serviceName: 'General Consultation',
        status: 'flagged',
        isVerifiedBooking: false,
        adminNotes: 'Auto-flagged by anti-spam system: PROFANITY_OR_SPAM_KEYWORD | REPETITIVE_CHARACTERS',
        flags: [
            'PROFANITY_OR_SPAM_KEYWORD: Found restricted keyword "scam"',
            'REPETITIVE_CHARACTERS: Suspicious repetition pattern detected',
        ],
    },
    {
        authorName: 'Amit Trivedi',
        userEmail: 'amit.trivedi@example.com',
        userPhone: '+91 9988776655',
        rating: 5,
        comment: 'Booked muhurtham for house warming ceremony (Griha Pravesh). Everything went smoothly as per auspicious timings provided.',
        serviceName: 'Muhurtham Selection',
        astrologerName: 'Astrologer Sharma',
        status: 'approved',
        isVerifiedBooking: true,
        bookingId: 'order_muh101',
        transactionId: 'pay_muh101',
        adminNotes: 'Confirmed verified booking.',
    },
];

const seedReviews = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if reviews already exist
        const count = await Review.countDocuments();
        if (count > 0) {
            console.log(`Reviews collection already contains ${count} items. Skipping initial seed.`);
            process.exit(0);
        }

        await Review.insertMany(sampleReviews);
        console.log(`Successfully seeded ${sampleReviews.length} sample reviews!`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding reviews:', err);
        process.exit(1);
    }
};

seedReviews();
