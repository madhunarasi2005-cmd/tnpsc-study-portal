const express = require('express');
const router = express.Router();
const {
  getVideoProgress,
  updateVideoProgress,
  markVideoCompleted,
  getStudentSummary,
  getContinueWatching,
  getRecentlyCompleted
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getStudentSummary);
router.get('/continue-watching', getContinueWatching);
router.get('/recently-completed', getRecentlyCompleted);

router.get('/video/:videoId', getVideoProgress);
router.post('/video/:videoId', updateVideoProgress);
router.post('/video/:videoId/complete', markVideoCompleted);

module.exports = router;
