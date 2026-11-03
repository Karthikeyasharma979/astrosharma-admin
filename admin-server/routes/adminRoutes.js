const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const {
    loginAdmin,
    getBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,
    sendConfirmationEmail,
    markNotificationsRead,
    getContacts,
    getDashboardStats,
    deleteContact,
    completeConsultationCall,
    updateCallStatus,
    updateCustomerProgressStep
} = require('../controllers/adminController');
const { getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect } = require('../middlewares/authMiddleware');
const { isValidObjectId } = require('../utils/requestUtils');

// A malformed id in a link is simply a record that doesn't exist
router.param('id', (req, res, next, id) => {
    if (!isValidObjectId(id)) return res.status(404).json({ message: 'Not found' });
    next();
});

// Slows down password guessing. Successful logins don't count towards the limit.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many failed login attempts. Please try again in 15 minutes.' }
});

// Public Route
router.post('/login', loginLimiter, loginAdmin);

// Protected Routes
router.get('/bookings', protect, getBookings);
router.get('/bookings/:id', protect, getBookingById);
router.put('/bookings/:id/status', protect, updateBookingStatus);
router.put('/bookings/:id/complete-call', protect, completeConsultationCall);
router.put('/bookings/:id/call-status', protect, updateCallStatus);
router.put('/bookings/:id/progress-step', protect, updateCustomerProgressStep);
router.delete('/bookings/:id', protect, deleteBooking);
router.post('/bookings/:id/confirm', protect, sendConfirmationEmail);
router.get('/contacts', protect, getContacts);
router.delete('/contacts/:id', protect, deleteContact);
router.get('/stats', protect, getDashboardStats);
router.put('/notifications/read', protect, markNotificationsRead);

// Coupon Routes
router.get('/coupons', protect, getCoupons);
router.post('/coupons', protect, createCoupon);
router.put('/coupons/:id', protect, updateCoupon);
router.delete('/coupons/:id', protect, deleteCoupon);

// Review Moderation Routes
const reviewRoutes = require('./reviewRoutes');
router.use('/reviews', reviewRoutes);

module.exports = router;


