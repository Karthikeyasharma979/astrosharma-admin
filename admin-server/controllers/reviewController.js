const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { analyzeSpamAndProfanity, checkIpRateLimit } = require('../utils/spamFilter');
const { isValidObjectId, escapeRegex, asText } = require('../utils/requestUtils');

const SORTABLE_FIELDS = ['createdAt', 'rating', 'authorName', 'status'];
const REVIEW_STATUSES = ['pending', 'approved', 'flagged', 'rejected'];

const parseRating = (value) => {
    const rating = Number(value);
    return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
};

const toPositiveInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

/**
 * @desc    Get all reviews with filters, search, pagination, and summary stats
 * @route   GET /api/admin/reviews
 * @access  Private/Admin
 */
const getAdminReviews = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            rating = 'all',
            verifiedOnly,
            search = '',
            sortBy = 'createdAt',
            order = 'desc',
            includeDeleted = 'false',
        } = req.query;

        const pageNum = toPositiveInt(page, 1);
        const limitNum = Math.min(100, toPositiveInt(limit, 10));
        const skip = (pageNum - 1) * limitNum;

        // Base filter query
        const query = {};

        if (includeDeleted !== 'true') {
            query.isDeleted = { $ne: true };
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (rating && rating !== 'all') {
            query.rating = Number(rating);
        }

        if (verifiedOnly === 'true') {
            query.isVerifiedBooking = true;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
            query.$or = [
                { authorName: searchRegex },
                { name: searchRegex },
                { comment: searchRegex },
                { astrologerName: searchRegex },
                { serviceName: searchRegex },
                { bookingId: searchRegex },
                { transactionId: searchRegex },
            ];
        }

        // Sorting
        const sortOptions = {};
        const sortDirection = order === 'asc' ? 1 : -1;
        sortOptions[SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt'] = sortDirection;

        // Full documents, not lean ones: the model decrypts contact details and adds the masked versions
        const [reviews, totalMatching] = await Promise.all([
            Review.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Review.countDocuments(query),
        ]);

        // Aggregate high-level stats for tab badges and dashboard counters
        const statsAgg = await Review.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                    },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                    },
                    flagged: {
                        $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] },
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
                    },
                    verified: {
                        $sum: { $cond: [{ $eq: ['$isVerifiedBooking', true] }, 1, 0] },
                    },
                    // Only published reviews, the same as the dashboard's average
                    avgRating: { $avg: { $cond: [{ $eq: ['$status', 'approved'] }, '$rating', null] } },
                },
            },
        ]);

        const stats = statsAgg[0] || {
            total: 0,
            pending: 0,
            approved: 0,
            flagged: 0,
            rejected: 0,
            verified: 0,
            avgRating: 0,
        };

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalMatching,
                totalPages: Math.ceil(totalMatching / limitNum),
            },
            stats: {
                ...stats,
                avgRating: Number((stats.avgRating || 0).toFixed(1)),
            },
        });
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
    }
};

/**
 * @desc    Admin manually creates a verified review/testimonial
 * @route   POST /api/admin/reviews
 * @access  Private/Admin
 */
const createAdminReview = async (req, res) => {
    try {
        const {
            authorName,
            userEmail,
            userPhone,
            rating,
            comment,
            astrologerId,
            astrologerName,
            serviceId,
            serviceName,
            isVerifiedBooking = true,
            status = 'approved',
            bookingId,
            location,
            adminNotes = 'Created manually by Administrator',
        } = req.body;

        if (!authorName || !comment || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Author name, rating (1-5), and review comment are required.',
            });
        }

        const validRating = parseRating(rating);
        if (validRating === null) {
            return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
        }
        if (status !== undefined && !REVIEW_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid review status.' });
        }

        const newReview = await Review.create({
            authorName,
            userEmail,
            userPhone,
            rating: validRating,
            comment,
            astrologerId: astrologerId || 'general-astrology',
            astrologerName: astrologerName || 'Astrologer Sharma',
            serviceId: serviceId || 'kundli-consultation',
            serviceName: serviceName || 'Kundli & Vedic Consultation',
            location: location || '',
            isVerifiedBooking: Boolean(isVerifiedBooking),
            status: status || 'approved',
            bookingId: bookingId || `MANUAL-${Date.now()}`,
            adminNotes,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'Admin Console',
        });

        res.status(201).json({
            success: true,
            message: 'Review created successfully.',
            data: newReview,
        });
    } catch (error) {
        console.error('Error creating admin review:', error);
        res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
    }
};

/**
 * @desc    Edit typos, update star rating, status, or admin notes
 * @route   PUT /api/admin/reviews/:id
 * @access  Private/Admin
 */
const updateAdminReview = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            authorName,
            comment,
            rating,
            status,
            adminNotes,
            isVerifiedBooking,
            astrologerName,
            serviceName,
            location,
        } = req.body;

        if (rating !== undefined && parseRating(rating) === null) {
            return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
        }
        if (status !== undefined && !REVIEW_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid review status.' });
        }
        if ((authorName !== undefined && !asText(authorName)) || (comment !== undefined && !asText(comment))) {
            return res.status(400).json({ success: false, message: 'Author name and review comment cannot be empty.' });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (authorName !== undefined) review.authorName = authorName;
        if (comment !== undefined) review.comment = comment;
        if (rating !== undefined) review.rating = parseRating(rating);
        if (status !== undefined) review.status = status;
        if (adminNotes !== undefined) review.adminNotes = adminNotes;
        if (isVerifiedBooking !== undefined) review.isVerifiedBooking = Boolean(isVerifiedBooking);
        if (astrologerName !== undefined) review.astrologerName = astrologerName;
        if (serviceName !== undefined) review.serviceName = serviceName;
        if (location !== undefined) review.location = location;

        const updatedReview = await review.save();

        res.json({
            success: true,
            message: 'Review updated successfully.',
            data: updatedReview,
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
    }
};

/**
 * @desc    Delete review (Soft delete by default, permanent removal on query ?permanent=true)
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private/Admin
 */
const deleteAdminReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent = 'false' } = req.query;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (permanent === 'true') {
            await Review.findByIdAndDelete(id);
            return res.json({
                success: true,
                message: 'Review permanently removed.',
            });
        }

        // Soft delete
        review.isDeleted = true;
        review.deletedAt = new Date();
        await review.save();

        res.json({
            success: true,
            message: 'Review moved to trash (soft-deleted).',
            data: review,
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
    }
};

/**
 * @desc    Bulk moderate reviews (approve, reject, flag, delete, permanent-delete)
 * @route   POST /api/admin/reviews/bulk-action
 * @access  Private/Admin
 */
const bulkReviewAction = async (req, res) => {
    try {
        const { ids, action, adminNotes } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No review IDs provided' });
        }
        if (!ids.every(isValidObjectId)) {
            return res.status(400).json({ success: false, message: 'One or more review IDs are invalid' });
        }

        let updateResult;

        switch (action) {
            case 'approve':
                updateResult = await Review.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            status: 'approved',
                            adminNotes: adminNotes || 'Approved via bulk action',
                        },
                    }
                );
                break;

            case 'reject':
                updateResult = await Review.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            status: 'rejected',
                            adminNotes: adminNotes || 'Rejected via bulk action',
                        },
                    }
                );
                break;

            case 'flag':
                updateResult = await Review.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            status: 'flagged',
                            adminNotes: adminNotes || 'Flagged via bulk action',
                        },
                    }
                );
                break;

            case 'delete':
                updateResult = await Review.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            isDeleted: true,
                            deletedAt: new Date(),
                            adminNotes: adminNotes || 'Soft-deleted via bulk action',
                        },
                    }
                );
                break;

            case 'permanent-delete':
                updateResult = await Review.deleteMany({ _id: { $in: ids } });
                break;

            default:
                return res.status(400).json({ success: false, message: `Invalid action: ${action}` });
        }

        res.json({
            success: true,
            message: `Successfully performed '${action}' on ${ids.length} reviews.`,
            modifiedCount: updateResult.modifiedCount || updateResult.deletedCount || 0,
        });
    } catch (error) {
        console.error('Error executing bulk action:', error);
        res.status(500).json({ success: false, message: 'Bulk action failed', error: error.message });
    }
};

/**
 * @desc    Public review submission with Anti-Fake & Spam Prevention Rules
 * @route   POST /api/reviews
 * @access  Public
 */
const submitPublicReview = async (req, res) => {
    try {
        const clientIp = req.ip || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // 1. IP Rate Limiting (Prevent bot bursts)
        const rateCheck = checkIpRateLimit(clientIp, 5, 60 * 60 * 1000);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: 'Too many reviews submitted from this IP. Please try again later.',
            });
        }

        // Everything from here is typed by the public, so only plain text reaches the database
        const bookingId = asText(req.body.bookingId, 100);
        const transactionId = asText(req.body.transactionId, 100);
        const authorName = asText(req.body.authorName, 100);
        const userEmail = asText(req.body.userEmail, 254);
        const userPhone = asText(req.body.userPhone, 20);
        const comment = asText(req.body.comment, 2000);
        const astrologerId = asText(req.body.astrologerId, 100);
        const astrologerName = asText(req.body.astrologerName, 100);
        const serviceName = asText(req.body.serviceName, 100);
        const location = asText(req.body.location, 100);
        const rating = parseRating(req.body.rating);

        if (!authorName || !comment || rating === null) {
            return res.status(400).json({
                success: false,
                message: 'Author name, star rating (1-5), and review text are required.',
            });
        }

        // 2. Anti-Fake Rule: Verified Purchase Verification against Booking Model
        let isVerifiedBooking = false;
        let validatedBooking = null;

        if (bookingId || transactionId) {
            // Find booking by ID, Razorpay order ID or Razorpay payment ID
            validatedBooking = await Booking.findOne({
                $or: [
                    ...(isValidObjectId(bookingId) ? [{ _id: bookingId }] : []),
                    ...(bookingId ? [{ razorpay_order_id: bookingId }] : []),
                    ...(transactionId ? [{ razorpay_payment_id: transactionId }] : []),
                ],
            });

            if (validatedBooking) {
                // Ensure the booking was actually completed and paid
                const isPaid =
                    validatedBooking.status === 'Completed' ||
                    Boolean(validatedBooking.razorpay_payment_id);

                if (isPaid) {
                    isVerifiedBooking = true;
                }
            }
        }

        // 3. Anti-Fake Rule: 1 review per booking, however the booking was identified
        const reviewedBookingKeys = [
            ...(bookingId ? [{ bookingId }] : []),
            ...(transactionId ? [{ transactionId }] : []),
            ...(validatedBooking ? [
                { bookingId: validatedBooking._id.toString() },
                { bookingId: validatedBooking.razorpay_order_id },
                { transactionId: validatedBooking.razorpay_payment_id },
            ] : []),
        ];
        if (reviewedBookingKeys.length > 0) {
            const existingReview = await Review.findOne({
                $or: reviewedBookingKeys,
                isDeleted: { $ne: true },
            });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'A review has already been submitted for this consultation booking.',
                });
            }
        }

        // 4. Spam, Profanity, URL, & Bot Keyword Detection
        const spamAnalysis = analyzeSpamAndProfanity(comment);
        const flags = [...spamAnalysis.flags];

        // 5. Default Approval Gate
        // Rule: If spam triggers detected, status = 'flagged'.
        // If unverified guest review, status = 'pending'.
        // If verified booking with clean text, it still stays 'pending' by default for moderation safety,
        // or admin approval gate.
        let status = 'pending';
        let adminNotes = '';

        if (spamAnalysis.isSpam) {
            status = 'flagged';
            adminNotes = `Auto-flagged by anti-spam system: ${spamAnalysis.summary}`;
        } else if (!isVerifiedBooking) {
            status = 'pending';
            adminNotes = 'Unverified public submission: Held in pending queue for admin review.';
            flags.push('UNVERIFIED_PURCHASE: No verified completed booking match');
        } else {
            status = 'pending'; // Default approval gate
            adminNotes = 'Verified consultation booking: Awaiting standard admin approval gate.';
        }

        const review = await Review.create({
            authorName,
            userEmail,
            userPhone,
            rating,
            comment,
            astrologerId: astrologerId || (validatedBooking ? validatedBooking.consultationType : 'general-astrology'),
            astrologerName: astrologerName || 'Astrologer Sharma',
            serviceName: serviceName || (validatedBooking ? validatedBooking.consultationType : 'Vedic Consultation'),
            location: location || '',
            isVerifiedBooking,
            bookingId: validatedBooking ? validatedBooking._id.toString() : (bookingId || undefined),
            transactionId: validatedBooking ? validatedBooking.razorpay_payment_id : (transactionId || undefined),
            ipAddress: clientIp,
            userAgent,
            flags,
            status,
            adminNotes,
        });

        res.status(201).json({
            success: true,
            message:
                status === 'approved'
                    ? 'Thank you! Your review has been published.'
                    : 'Thank you! Your review has been submitted and is awaiting admin approval.',
            status: review.status,
            isVerified: isVerifiedBooking,
            id: review._id,
        });
    } catch (error) {
        console.error('Error submitting public review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
    }
};

/**
 * @desc    Get approved public reviews for website display
 * @route   GET /api/reviews
 * @access  Public
 */
const getPublicReviews = async (req, res) => {
    try {
        const { limit = 20, page = 1, astrologerId } = req.query;
        const pageNum = toPositiveInt(page, 1);
        const limitNum = Math.min(50, toPositiveInt(limit, 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {
            status: 'approved',
            isDeleted: { $ne: true },
        };

        if (astrologerId) {
            query.astrologerId = astrologerId;
        }

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('authorName name rating comment isVerifiedBooking astrologerName serviceName location createdAt')
                .lean(),
            Review.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching public reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch public reviews' });
    }
};

module.exports = {
    getAdminReviews,
    createAdminReview,
    updateAdminReview,
    deleteAdminReview,
    bulkReviewAction,
    submitPublicReview,
    getPublicReviews,
};
