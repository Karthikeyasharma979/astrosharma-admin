const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // The main site's contact form saves firstName and lastName
    name: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    hasAttachment: { type: Boolean },
    email: { type: String, required: true },
    message: { type: String, required: true },
    // Status to track if the inquiry was addressed
    status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
