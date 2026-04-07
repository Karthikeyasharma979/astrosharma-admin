const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.comparePassword(password))) {
            res.json({
                _id: admin.id,
                email: admin.email,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
};

// @desc    Get all contact inquiries
// @route   GET /api/admin/contacts
// @access  Private/Admin
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({}).sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch contacts' });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const totalContacts = await Contact.countDocuments();
        
        const recentBookings = await Booking.find({}).sort({ createdAt: -1 }).limit(5);
        const recentContacts = await Contact.find({}).sort({ createdAt: -1 }).limit(5);

        res.json({
            totals: {
                bookings: totalBookings,
                contacts: totalContacts
            },
            recentActivities: {
                bookings: recentBookings,
                contacts: recentContacts
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

// @desc    Get single booking by ID
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch booking details' });
    }
};

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update status' });
    }
};

// @desc    Send confirmation email (Mock)
// @route   POST /api/admin/bookings/:id/confirm
// @access  Private/Admin
const sendConfirmationEmail = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Mocking email logic
        console.log(`Sending confirmation email to: ${booking.email}`);
        
        res.json({ message: `Confirmation email sent to ${booking.email}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};

module.exports = {
    loginAdmin,
    getBookings,
    getBookingById,
    updateBookingStatus,
    sendConfirmationEmail,
    getContacts,
    getDashboardStats
};
