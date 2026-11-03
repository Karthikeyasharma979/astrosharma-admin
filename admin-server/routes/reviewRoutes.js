const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('../utils/requestUtils');
const {
    getAdminReviews,
    createAdminReview,
    updateAdminReview,
    deleteAdminReview,
    bulkReviewAction,
    submitPublicReview,
    getPublicReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.param('id', (req, res, next, id) => {
    if (!isValidObjectId(id)) return res.status(404).json({ success: false, message: 'Review not found' });
    next();
});

// ==========================================
// Public Review Routes (AstroSharma Client App)
// ==========================================
router.post('/submit', submitPublicReview);
router.get('/public', getPublicReviews);

// ==========================================
// Admin Moderation Routes (Protected by JWT)
// ==========================================
router.get('/', protect, getAdminReviews);
router.post('/', protect, createAdminReview);
router.post('/bulk-action', protect, bulkReviewAction);
router.put('/:id', protect, updateAdminReview);
router.delete('/:id', protect, deleteAdminReview);

module.exports = router;
