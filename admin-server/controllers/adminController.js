const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const Review = require('../models/Review');
const { sendBookingConfirmationEmail, sendConsultationSummaryEmail } = require('../utils/mailer');
const { asText, normalizeServiceName, getAmountPaid, getContactName } = require('../utils/requestUtils');

const BOOKING_STATUSES = ['Completed', 'Failed', 'Pending'];
const CALL_STATUSES = ['Pending', 'In Call', 'Completed', 'No Answer', 'Rescheduled'];

// The main site doesn't set isRead, so anything not explicitly read counts as unread
const UNREAD = { isRead: { $ne: true } };

const withContactName = (contact) => ({ ...contact, name: getContactName(contact) });

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

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Please enter your email and password' });
    }

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
        const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
        res.json(contacts.map(withContactName));
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
        const [
            totalBookings,
            unreadBookings,
            totalContacts,
            unreadContacts,
            totalReviews,
            pendingReviews,
            completedBookings,
            pendingBookings,
            failedBookings,
            recentBookings,
            recentContacts,
            recentReviews,
            ratingAgg,
            serviceBreakdown,
            completedList
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments(UNREAD),
            Contact.countDocuments(),
            Contact.countDocuments(UNREAD),
            Review.countDocuments({ isDeleted: { $ne: true } }),
            Review.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: 'Pending' }),
            Booking.countDocuments({ status: 'Failed' }),
            Booking.find({}).sort({ createdAt: -1 }).limit(6),
            Contact.find({}).sort({ createdAt: -1 }).limit(6).lean(),
            Review.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(6).select('authorName rating comment status serviceName createdAt isVerifiedBooking'),
            Review.aggregate([
                { $match: { isDeleted: { $ne: true }, status: 'approved' } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]),
            Booking.aggregate([
                { $group: { _id: '$consultationType', count: { $sum: 1 } } }
            ]),
            // Orders placed from a developer machine aren't real income
            Booking.find({ status: 'Completed', environment: { $ne: 'testing' } }).select('price finalPrice').lean()
        ]);

        const totalRevenue = completedList.reduce((acc, booking) => acc + getAmountPaid(booking), 0);

        const avgRating = ratingAgg.length > 0 && ratingAgg[0].avgRating
            ? Number(ratingAgg[0].avgRating.toFixed(1))
            : 0;

        // Telugu and English bookings of the same service count as one
        const serviceCounts = {};
        for (const service of serviceBreakdown) {
            const name = normalizeServiceName(service._id) || 'Standard Consultation';
            serviceCounts[name] = (serviceCounts[name] || 0) + service.count;
        }
        const popularServices = Object.entries(serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        res.json({
            totals: {
                bookings: totalBookings,
                contacts: totalContacts,
                reviews: totalReviews,
                pendingReviews,
                completedBookings,
                pendingBookings,
                failedBookings,
                totalRevenue,
                unreadTotal: unreadBookings + unreadContacts + pendingReviews,
                averageRating: avgRating,
                approvedReviews: ratingAgg.length > 0 ? ratingAgg[0].count : 0
            },
            statusBreakdown: {
                completed: completedBookings,
                pending: pendingBookings,
                failed: failedBookings
            },
            popularServices,
            recentActivities: {
                bookings: recentBookings,
                contacts: recentContacts.map(withContactName),
                reviews: recentReviews
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

// @desc    Get single booking by ID with client history
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Fetch client previous consultation history matching phone or email
        const orConditions = [];
        if (booking.phone) orConditions.push({ phone: booking.phone });
        if (booking.email) orConditions.push({ email: booking.email });

        let history = [];
        if (orConditions.length > 0) {
            history = await Booking.find({
                _id: { $ne: booking._id },
                $or: orConditions
            })
            .sort({ createdAt: -1 })
            .select('fullName consultationType status createdAt question remedies price finalPrice callDuration completedAt');
        }

        res.json({
            ...booking.toObject(),
            history,
            totalSessions: history.length + 1,
            isRepeatClient: history.length > 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch booking details' });
    }
};

// @desc    Complete consultation call & save remedies
// @route   PUT /api/admin/bookings/:id/complete-call
// @access  Private/Admin
const completeConsultationCall = async (req, res) => {
    try {
        const {
            callDuration,
            remedies = {},
            followUpDate,
            sendEmail = true,
            includeReviewLink = true,
        } = req.body;

        const updatePayload = {
            status: 'Completed',
            callStatus: 'Completed',
            progressStep: 4,
            completedAt: new Date(),
            callDuration: asText(callDuration, 100),
            remedies: {
                gemstones: asText(remedies?.gemstones, 5000),
                poojas: asText(remedies?.poojas, 5000),
                mantras: asText(remedies?.mantras, 5000),
                generalNotes: asText(remedies?.generalNotes, 5000),
                recordedAt: new Date()
            }
        };

        if (followUpDate) {
            const parsedDate = new Date(followUpDate);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Please enter a valid follow-up date' });
            }
            updatePayload.followUpDate = parsedDate;
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { returnDocument: 'after' }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        let emailResult = null;
        if (sendEmail && booking.email) {
            emailResult = await sendConsultationSummaryEmail(booking, updatePayload.remedies, {
                includeReviewLink
            });
        }

        res.json({
            message: 'Consultation marked completed and remedies saved',
            booking,
            emailSent: !!emailResult && !emailResult.error
        });
    } catch (error) {
        console.error('Error completing consultation call:', error);
        res.status(500).json({ message: 'Failed to complete consultation call' });
    }
};

// @desc    Update call status (e.g. In Call, Pending, No Answer)
// @route   PUT /api/admin/bookings/:id/call-status
// @access  Private/Admin
const updateCallStatus = async (req, res) => {
    try {
        const { callStatus } = req.body;
        if (!CALL_STATUSES.includes(callStatus)) {
            return res.status(400).json({ message: 'Invalid call status' });
        }

        const updatePayload = { callStatus };

        if (callStatus === 'In Call') {
            // Calling again means the consultation isn't finished after all
            updatePayload.progressStep = 3;
            updatePayload.status = 'Pending';
            updatePayload.completedAt = null;
        } else if (callStatus === 'Completed') {
            updatePayload.progressStep = 4;
            updatePayload.status = 'Completed';
            updatePayload.completedAt = new Date();
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { returnDocument: 'after' }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update call status' });
    }
};

// @desc    Update customer real-time tracking progress step & note (ప్రస్తుత పురోగతి)
// @route   PUT /api/admin/bookings/:id/progress-step
// @access  Private/Admin
const updateCustomerProgressStep = async (req, res) => {
    try {
        const { progressStep, astrologerUpdateNote } = req.body;
        const updatePayload = {};

        if (progressStep !== undefined) {
            const stepNum = Number(progressStep);
            if (![1, 2, 3, 4].includes(stepNum)) {
                return res.status(400).json({ message: 'Progress step must be from 1 to 4' });
            }
            updatePayload.progressStep = stepNum;
            if (stepNum === 4) {
                updatePayload.status = 'Completed';
                updatePayload.callStatus = 'Completed';
                updatePayload.completedAt = new Date();
            } else {
                // Any earlier step means the consultation isn't finished
                updatePayload.status = 'Pending';
                updatePayload.completedAt = null;
                updatePayload.callStatus = stepNum === 3 ? 'In Call' : 'Pending';
            }
        }

        if (astrologerUpdateNote !== undefined) {
            updatePayload.astrologerUpdateNote = asText(astrologerUpdateNote, 2000);
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { returnDocument: 'after' }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({
            message: 'Customer tracking progress updated',
            booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update customer progress step' });
    }
};

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!BOOKING_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid booking status' });
        }

        // Keep the customer's progress tracker in step with the status
        const updatePayload = status === 'Completed'
            ? { status, completedAt: new Date(), progressStep: 4, callStatus: 'Completed' }
            : { status, completedAt: null, progressStep: 2, callStatus: 'Pending' };

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { returnDocument: 'after' }
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

// @desc    Delete a booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete booking' });
    }
};

// @desc    Delete a contact inquiry
// @route   DELETE /api/admin/contacts/:id
// @access  Private/Admin
const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete contact' });
    }
};

// @desc    Send confirmation email
// @route   POST /api/admin/bookings/:id/confirm
// @access  Private/Admin
const sendConfirmationEmail = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        await sendBookingConfirmationEmail(booking);

        res.json({ message: `Confirmation email sent to ${booking.email}` });
    } catch (error) {
        console.error(error);
        if (error.code === 'MAIL_CONFIG_MISSING') {
            return res.status(500).json({
                message: 'Email service is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.',
            });
        }

        if (error.code === 'MAIL_TO_MISSING') {
            return res.status(400).json({ message: 'Booking does not have a valid email address.' });
        }

        res.status(500).json({ message: 'Failed to send email' });
    }
};

// @desc    Mark notifications as read
// @route   PUT /api/admin/notifications/read
// @access  Private/Admin
const markNotificationsRead = async (req, res) => {
    try {
        await Booking.updateMany(UNREAD, { isRead: true });
        await Contact.updateMany(UNREAD, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
};

module.exports = {
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
};
