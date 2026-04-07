require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => res.json({ status: 'Server is running', service: 'AstroAdmin API' }));
app.use('/api/admin', adminRoutes);

// Detailed Request Logging Middleware (Development)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Start Server & Connect to DB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/astro_sharma';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Admin Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
