const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    getBookings,
    getBookingById,
    updateBookingStatus,
    sendConfirmationEmail,
    markNotificationsRead,
    getContacts,
    getDashboardStats
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

// Public Route
router.post('/login', loginAdmin);

// Protected Routes
router.get('/bookings', protect, getBookings);
router.get('/bookings/:id', protect, getBookingById);
router.put('/bookings/:id/status', protect, updateBookingStatus);
router.post('/bookings/:id/confirm', protect, sendConfirmationEmail);
router.get('/contacts', protect, getContacts);
router.get('/stats', protect, getDashboardStats);
router.put('/notifications/read', protect, markNotificationsRead);

module.exports = router;
