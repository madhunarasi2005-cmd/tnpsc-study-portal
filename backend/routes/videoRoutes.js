const express = require('express');
const router = express.Router();
const {
  getVideos,
  getVideoById,
  uploadVideo,
  updateVideoDetails,
  replaceVideoFile,
  deleteVideo
} = require('../controllers/videoController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', optionalAuth, getVideos);
router.get('/:id', optionalAuth, getVideoById);

router.post('/upload', protect, adminOnly, upload.single('video'), uploadVideo);
router.put('/:id', protect, adminOnly, updateVideoDetails);
router.put('/:id/replace', protect, adminOnly, upload.single('video'), replaceVideoFile);
router.delete('/:id', protect, adminOnly, deleteVideo);

module.exports = router;
