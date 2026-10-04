const mongoose = require('mongoose');
const VideoProgress = require('../models/VideoProgress');
const Video = require('../models/Video');
const Exam = require('../models/Exam');

// @desc    Get progress for a specific video
// @route   GET /api/progress/video/:videoId
// @access  Private (Authenticated User)
const getVideoProgress = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(404).json({ message: 'Invalid Video ID' });
    }

    const progress = await VideoProgress.findOne({ user: userId, video: videoId });

    if (!progress) {
      return res.json({
        watchedSeconds: 0,
        completed: false,
        lastWatchedAt: null
      });
    }

    return res.json({
      watchedSeconds: progress.watchedSeconds || 0,
      completed: progress.completed || false,
      lastWatchedAt: progress.lastWatchedAt
    });
  } catch (error) {
    console.error('getVideoProgress Error:', error);
    return res.status(500).json({ message: 'Server error fetching video progress', error: error.message });
  }
};

// @desc    Update watched position & auto mark completed at 90%
// @route   POST /api/progress/video/:videoId
// @access  Private (Authenticated User)
const updateVideoProgress = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;
    const { watchedSeconds, duration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(404).json({ message: 'Invalid Video ID' });
    }

    const seconds = Math.max(0, Number(watchedSeconds) || 0);
    const videoDuration = Number(duration) || 0;

    // Check existing progress to preserve completed status
    const existing = await VideoProgress.findOne({ user: userId, video: videoId });
    let isCompleted = existing ? existing.completed : false;

    // Automatic 90% completion rule
    if (!isCompleted && videoDuration > 0 && seconds >= (videoDuration * 0.9)) {
      isCompleted = true;
    }

    const progress = await VideoProgress.findOneAndUpdate(
      { user: userId, video: videoId },
      {
        watchedSeconds: seconds,
        completed: isCompleted,
        lastWatchedAt: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      watchedSeconds: progress.watchedSeconds,
      completed: progress.completed,
      lastWatchedAt: progress.lastWatchedAt
    });
  } catch (error) {
    console.error('updateVideoProgress Error:', error);
    return res.status(500).json({ message: 'Server error updating progress', error: error.message });
  }
};

// @desc    Explicitly mark video completed
// @route   POST /api/progress/video/:videoId/complete
// @access  Private (Authenticated User)
const markVideoCompleted = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(404).json({ message: 'Invalid Video ID' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const progress = await VideoProgress.findOneAndUpdate(
      { user: userId, video: videoId },
      {
        watchedSeconds: video.duration || 0,
        completed: true,
        lastWatchedAt: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      message: 'Video marked as completed',
      watchedSeconds: progress.watchedSeconds,
      completed: progress.completed,
      lastWatchedAt: progress.lastWatchedAt
    });
  } catch (error) {
    console.error('markVideoCompleted Error:', error);
    return res.status(500).json({ message: 'Server error marking video complete', error: error.message });
  }
};

// @desc    Get overall student learning progress summary
// @route   GET /api/progress/summary
// @access  Private (Authenticated User)
const getStudentSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const userExams = req.user.selectedExams || [];

    // Find active exams matching student's selected exams
    let examFilter = { isActive: true };
    if (userExams.length > 0) {
      const matchingExams = await Exam.find({ code: { $in: userExams }, isActive: true });
      if (matchingExams.length > 0) {
        examFilter._id = { $in: matchingExams.map(e => e._id) };
      }
    }

    // Find published videos under relevant exams
    const publishedVideos = await Video.find({ exam: examFilter._id || { $exists: true }, isPublished: true });
    const totalVideos = publishedVideos.length;
    const publishedVideoIds = publishedVideos.map(v => v._id.toString());

    // Get student progress records
    const allProgress = await VideoProgress.find({ user: userId });

    let completedCount = 0;
    let inProgressCount = 0;

    allProgress.forEach((p) => {
      if (publishedVideoIds.includes(p.video.toString())) {
        if (p.completed) {
          completedCount += 1;
        } else if (p.watchedSeconds > 0) {
          inProgressCount += 1;
        }
      }
    });

    const overallPercentage = totalVideos > 0 ? Math.min(100, Math.round((completedCount / totalVideos) * 100)) : 0;

    return res.json({
      totalVideos,
      completedVideos: completedCount,
      inProgressVideos: inProgressCount,
      overallPercentage
    });
  } catch (error) {
    console.error('getStudentSummary Error:', error);
    return res.status(500).json({ message: 'Server error fetching student summary', error: error.message });
  }
};

// @desc    Get Continue Watching videos list
// @route   GET /api/progress/continue-watching
// @access  Private (Authenticated User)
const getContinueWatching = async (req, res) => {
  try {
    const userId = req.user._id;

    const progressRecords = await VideoProgress.find({
      user: userId,
      completed: false,
      watchedSeconds: { $gt: 0 }
    })
      .sort({ lastWatchedAt: -1 })
      .populate({
        path: 'video',
        populate: [
          { path: 'exam', select: 'name nameTa code' },
          { path: 'subject', select: 'name nameTa' },
          { path: 'topic', select: 'name nameTa order' }
        ]
      });

    // Filter out null or unpublished videos
    const continueWatchingList = progressRecords
      .filter(p => p.video && p.video.isPublished)
      .map(p => ({
        progressId: p._id,
        watchedSeconds: p.watchedSeconds,
        lastWatchedAt: p.lastWatchedAt,
        video: p.video
      }));

    return res.json(continueWatchingList);
  } catch (error) {
    console.error('getContinueWatching Error:', error);
    return res.status(500).json({ message: 'Server error fetching continue watching', error: error.message });
  }
};

// @desc    Get Recently Completed videos list
// @route   GET /api/progress/recently-completed
// @access  Private (Authenticated User)
const getRecentlyCompleted = async (req, res) => {
  try {
    const userId = req.user._id;

    const progressRecords = await VideoProgress.find({
      user: userId,
      completed: true
    })
      .sort({ lastWatchedAt: -1 })
      .limit(6)
      .populate({
        path: 'video',
        populate: [
          { path: 'exam', select: 'name nameTa code' },
          { path: 'subject', select: 'name nameTa' },
          { path: 'topic', select: 'name nameTa order' }
        ]
      });

    const completedList = progressRecords
      .filter(p => p.video && p.video.isPublished)
      .map(p => ({
        progressId: p._id,
        completedAt: p.lastWatchedAt,
        video: p.video
      }));

    return res.json(completedList);
  } catch (error) {
    console.error('getRecentlyCompleted Error:', error);
    return res.status(500).json({ message: 'Server error fetching recently completed videos', error: error.message });
  }
};

module.exports = {
  getVideoProgress,
  updateVideoProgress,
  markVideoCompleted,
  getStudentSummary,
  getContinueWatching,
  getRecentlyCompleted
};
