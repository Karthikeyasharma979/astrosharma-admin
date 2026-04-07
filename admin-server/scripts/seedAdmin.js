require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/astro_sharma';

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email: 'admin@astrosharma.com' });
        
        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit();
        }

        const newAdmin = new Admin({
            email: 'admin@astrosharma.com',
            password: 'password123' // Will be hashed by pre-save middleware
        });

        await newAdmin.save();
        console.log('Successfully seeded admin user: admin@astrosharma.com / password123');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
