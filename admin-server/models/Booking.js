const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Razorpay Fields
    razorpay_payment_id: { type: String, required: true },
    razorpay_order_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },

    // Status tracking
    status: { type: String, enum: ['Completed', 'Failed', 'Pending'], default: 'Pending' },
    callStatus: {
        type: String,
        enum: ['Pending', 'In Call', 'Completed', 'No Answer', 'Rescheduled'],
        default: 'Pending'
    },
    callDuration: { type: String, default: '' },
    completedAt: { type: Date },
    followUpDate: { type: Date },
    // Customer Real-Time Progress Tracker (ప్రస్తుత పురోగతి)
    // 1: దక్షిణ సమర్పణ (Payment Confirmed), 2: జాతక గణన (Horoscope Analysis), 3: ప్రత్యక్ష కాల్ (Live Call), 4: సంప్రదింపు పూర్తి (Completed)
    progressStep: { type: Number, default: 2, min: 1, max: 4 },
    astrologerUpdateNote: { type: String, default: '' },
    isRead: { type: Boolean, default: false },

    // Astrologer Remedies & Consultation Notes (పరిహారాలు)
    remedies: {
        gemstones: { type: String, default: '' },
        poojas: { type: String, default: '' },
        mantras: { type: String, default: '' },
        generalNotes: { type: String, default: '' },
        recordedAt: { type: Date }
    },

    // Core Consultation Info
    consultationType: { type: String, required: true },
    // List price as text, like "₹701". The amount paid is finalPrice.
    price: { type: String },
    originalPrice: { type: Number },
    finalPrice: { type: Number },
    discountAmount: { type: Number },
    couponCode: { type: String },
    isVipOrder: { type: Boolean },
    isRepeatCustomer: { type: Boolean },
    bookingNumber: { type: Number },
    // Set by the main site: bookings made from a developer machine are 'testing'
    environment: { type: String },

    // Primary Client Information
    fullName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    
    // Standard Consultation Fields
    dob: { type: String },
    birthTime: { type: String },
    birthPlace: { type: String },
    pincode: { type: String },
    question: { type: String },
    
    // Marriage Matching - Bride 1
    girlName: { type: String },
    girlDob: { type: String },
    girlTime: { type: String },
    girlPlace: { type: String },
    girlPincode: { type: String },
    
    // Marriage Matching - Groom 1
    boyName: { type: String },
    boyDob: { type: String },
    boyTime: { type: String },
    boyPlace: { type: String },
    boyPincode: { type: String },

    // Marriage Matching - Bride 2 (Optional)
    girl2Name: { type: String },
    girl2Dob: { type: String },
    girl2Time: { type: String },
    girl2Place: { type: String },
    girl2Pincode: { type: String },

    // Marriage Matching - Groom 2 (Optional)
    boy2Name: { type: String },
    boy2Dob: { type: String },
    boy2Time: { type: String },
    boy2Place: { type: String },
    boy2Pincode: { type: String },

    // Muhurtham Specific
    startDate: { type: String },
    endDate: { type: String },
    muhurthamLocation: { type: String },

}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
