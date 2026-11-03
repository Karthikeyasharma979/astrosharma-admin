const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');

// Codes built into the main site (src/utils/festivalOffers.js). The site always uses its own rules
// for these, so a coupon with the same code here would never apply. Update when that list changes.
const RESERVED_CODES = new Set([
    'ADIVARAM', 'BHANUVAR', 'BRIHASPATI', 'BUDHA', 'BUDHA20', 'BUDHAVAR', 'BUDHAVARAM', 'DIWALI30', 'FESTIVAL20',
    'FIRST', 'FIRSTASTRO', 'GANESHA', 'GANESHA25', 'GURU', 'GURUKRIPA', 'GURUVAR', 'GURUVARAM', 'HANUMAN',
    'KARTIKA25', 'KUJA', 'LAKSHMI', 'LAKSHMI20', 'LOYALTY', 'LOYALTY25', 'MAHALAKSHMI', 'MANGAL', 'MANGALAVARAM',
    'MANGALVAR', 'NAVRATRI25', 'NEWUSER', 'PARAM25', 'PRATHAM101', 'RAKSHA20', 'RAVIVAR', 'RETURNING', 'SHANI',
    'SHANIVAR', 'SHANIVARAM', 'SHIVA', 'SHIVAY', 'SHIVOHAM', 'SHUBH20', 'SHUKRA20', 'SHUKRAVAR', 'SHUKRAVARAM',
    'SOMAVARAM', 'SOMVAR', 'SOUBHAGYA25', 'SRIRAMA20', 'SURYA', 'SURYA20', 'UGADI25', 'UTSAV20', 'VALUEDCLIENT',
    'VIDYA20', 'VIP', 'VIPLOYALTY', 'WELCOME', 'WELCOME50'
]);

const isWholeNumber = (value, min, max = Infinity) => Number.isInteger(value) && value >= min && value <= max;

const isDateKey = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

// Builds the fields to save from the request, so nothing else in the body can reach the database
const parseCouponInput = (body, { isNew }) => {
    const toNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

    const fields = {
        name: String(body.name ?? '').trim().slice(0, 80),
        discountType: body.discountType,
        discountValue: toNumber(body.discountValue),
        minAmount: toNumber(body.minAmount) ?? 0,
        startDate: String(body.startDate ?? ''),
        endDate: String(body.endDate ?? ''),
        usageLimit: toNumber(body.usageLimit),
        oneUsePerCustomer: Boolean(body.oneUsePerCustomer),
        newCustomersOnly: Boolean(body.newCustomersOnly),
        isActive: Boolean(body.isActive)
    };

    if (isNew) {
        fields.code = String(body.code ?? '').trim().toUpperCase();
        if (!/^[A-Z0-9_-]{3,20}$/.test(fields.code)) {
            return { error: 'Code must be 3-20 letters, numbers, hyphens or underscores.' };
        }
        if (RESERVED_CODES.has(fields.code)) {
            return { error: `${fields.code} is already built into the website. Please choose a different code.` };
        }
    }

    if (fields.discountType === 'percentage') {
        if (!isWholeNumber(fields.discountValue, 1, 100)) {
            return { error: 'Percentage discount must be a whole number from 1 to 100.' };
        }
    } else if (fields.discountType === 'flat') {
        if (!isWholeNumber(fields.discountValue, 1)) {
            return { error: 'Flat discount must be a whole number of rupees, at least ₹1.' };
        }
    } else {
        return { error: 'Please choose a discount type.' };
    }

    if (!isWholeNumber(fields.minAmount, 0)) {
        return { error: 'Minimum order must be a whole number of rupees.' };
    }
    if (fields.usageLimit !== null && !isWholeNumber(fields.usageLimit, 1)) {
        return { error: 'Usage limit must be a whole number, at least 1, or left empty.' };
    }
    if ((fields.startDate && !isDateKey(fields.startDate)) || (fields.endDate && !isDateKey(fields.endDate))) {
        return { error: 'Please enter valid start and end dates.' };
    }
    if (fields.startDate && fields.endDate && fields.startDate > fields.endDate) {
        return { error: 'End date cannot be before the start date.' };
    }

    return { fields };
};

// @desc    Get all coupons with how many bookings used each one
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const [coupons, usage] = await Promise.all([
            Coupon.find({}).sort({ createdAt: -1 }).lean(),
            Booking.aggregate([
                { $match: { status: { $ne: 'Failed' }, couponCode: { $nin: ['', null] } } },
                { $group: { _id: '$couponCode', count: { $sum: 1 } } }
            ])
        ]);
        const usageByCode = Object.fromEntries(usage.map(row => [row._id, row.count]));
        res.json(coupons.map(coupon => ({ ...coupon, usedCount: usageByCode[coupon.code] || 0 })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch coupons' });
    }
};

// @desc    Create a coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    const { error, fields } = parseCouponInput(req.body, { isNew: true });
    if (error) return res.status(400).json({ message: error });

    try {
        const coupon = await Coupon.create(fields);
        res.status(201).json({ ...coupon.toObject(), usedCount: 0 });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: `A coupon with the code ${fields.code} already exists.` });
        }
        console.error(err);
        res.status(500).json({ message: 'Failed to create coupon' });
    }
};

// @desc    Update a coupon. The code itself can't change, because past bookings refer to it.
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
    const { error, fields } = parseCouponInput(req.body, { isNew: false });
    if (error) return res.status(400).json({ message: error });

    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, fields, { returnDocument: 'after', runValidators: true }).lean();
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

        const usedCount = await Booking.countDocuments({ couponCode: coupon.code, status: { $ne: 'Failed' } });
        res.json({ ...coupon, usedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update coupon' });
    }
};

// @desc    Delete a coupon. Past bookings keep the code they were made with.
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete coupon' });
    }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon };
