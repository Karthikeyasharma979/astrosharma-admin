require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Deployed behind one proxy, so req.ip is the visitor's real address and can't be faked with a header
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true
}));
app.use(express.json());

// Detailed Request Logging Middleware (Development)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => res.json({ status: 'Server is running', service: 'AstroAdmin API' }));
app.use('/api/admin', adminRoutes);

const { submitPublicReview, getPublicReviews } = require('./controllers/reviewController');
app.post('/api/reviews', submitPublicReview);
app.get('/api/reviews', getPublicReviews);

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
