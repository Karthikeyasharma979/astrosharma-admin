const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    // Status to track if the inquiry was addressed
    status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
