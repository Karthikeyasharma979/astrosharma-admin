const mongoose = require('mongoose');
const { encrypt, decrypt, maskEmail, maskPhone } = require('../utils/cryptoUtil');

const reviewSchema = new mongoose.Schema(
    {
        // Target Astrologer or Consultation Service
        astrologerId: {
            type: String,
            default: 'general-astrology',
            index: true,
        },
        serviceId: {
            type: String,
            default: 'general-consultation',
            index: true,
        },
        astrologerName: {
            type: String,
            default: 'AstroSharma',
        },
        serviceName: {
            type: String,
            default: 'Vedic Consultation',
        },

        // Client Details
        userId: {
            type: String,
            index: true,
        },
        authorName: {
            type: String,
            required: [true, 'Author name is required'],
            trim: true,
            // Older reviews from the main site only have `name`
            default: function () {
                return this.get('name');
            },
        },
        name: {
            type: String,
            trim: true,
        },
        // Stored encrypted for privacy
        userEmail: {
            type: String,
            trim: true,
            set: (val) => (val ? encrypt(val) : val),
            get: (val) => (val ? decrypt(val) : val),
        },
        userPhone: {
            type: String,
            trim: true,
            set: (val) => (val ? encrypt(val) : val),
            get: (val) => (val ? decrypt(val) : val),
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },

        // Rating & Feedback
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Minimum rating is 1'],
            max: [5, 'Maximum rating is 5'],
            index: true,
        },
        comment: {
            type: String,
            required: [true, 'Review comment cannot be empty'],
            trim: true,
        },

        // Moderation Status: 'pending' | 'approved' | 'flagged' | 'rejected'
        status: {
            type: String,
            enum: ['pending', 'approved', 'flagged', 'rejected'],
            default: 'pending',
            index: true,
        },

        // Anti-Fake & Verification Tracking
        isVerifiedBooking: {
            type: Boolean,
            default: false,
            index: true,
        },
        bookingId: {
            type: String,
        },
        transactionId: {
            type: String,
            index: true,
        },

        // Audit & Spam Metadata
        ipAddress: {
            type: String,
            default: '0.0.0.0',
        },
        userAgent: {
            type: String,
            default: 'Unknown User Agent',
        },
        flags: {
            type: [String],
            default: [],
        },
        adminNotes: {
            type: String,
            default: '',
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true, virtuals: true },
        toObject: { getters: true, virtuals: true },
    }
);

// Virtual for masked email
reviewSchema.virtual('maskedEmail').get(function () {
    return maskEmail(this.userEmail);
});

// Virtual for masked phone
reviewSchema.virtual('maskedPhone').get(function () {
    return maskPhone(this.userPhone);
});

// Virtual for id
reviewSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Compound index for fast filtering and sorting
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ astrologerId: 1, status: 1 });
reviewSchema.index({ bookingId: 1 }, { sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
