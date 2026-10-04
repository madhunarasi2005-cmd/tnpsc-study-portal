const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAnalytics } = require('../controllers/adminController');

// @desc    Admin system statistics and learning analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, adminOnly, getAnalytics);

module.exports = router;
