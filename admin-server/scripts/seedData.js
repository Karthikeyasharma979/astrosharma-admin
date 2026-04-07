require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');

const MONGO_URI = process.env.MONGO_URI;

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing just in case
        await Booking.deleteMany({});
        await Contact.deleteMany({});

        // Mock Bookings
        const bookings = [
            {
                razorpay_payment_id: "pay_xyz123",
                razorpay_order_id: "order_abc456",
                razorpay_signature: "sig_def789",
                status: "Completed",
                consultationType: "General",
                fullName: "Ravi Kumar",
                phone: "+91 9876543210",
                email: "ravi.kumar@example.com",
                dob: "1990-05-15",
                birthTime: "14:30",
                birthPlace: "Mumbai",
                question: "Career guidance for the next year"
            },
            {
                razorpay_payment_id: "pay_uvw321",
                razorpay_order_id: "order_hij654",
                razorpay_signature: "sig_klm987",
                status: "Pending",
                consultationType: "Marriage Matching",
                fullName: "Priya Singh",
                phone: "+91 9123456789",
                email: "priya.singh@example.com",
                girlName: "Priya Singh",
                girlDob: "1994-08-20",
                boyName: "Rahul Sharma",
                boyDob: "1992-12-10"
            }
        ];

        // Mock Contacts
        const contacts = [
            {
                name: "Anjali Dubey",
                email: "anjali.d@example.com",
                message: "Hi, do you provide consultation via phone call or only Zoom?",
                status: "New"
            },
            {
                name: "Vikram Mehta",
                email: "vikram@example.com",
                message: "I paid for a consultation yesterday but haven't received a time slot yet.",
                status: "In Progress"
            }
        ];

        await Booking.insertMany(bookings);
        await Contact.insertMany(contacts);

        console.log('Successfully seeded mock bookings and contacts!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
