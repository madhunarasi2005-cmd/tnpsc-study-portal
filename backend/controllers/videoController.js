const mongoose = require('mongoose');
const Video = require('../models/Video');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const cloudinary = require('../config/cloudinary');

// Helper to stream upload buffer to Cloudinary
const uploadToCloudinaryStream = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'tnpsc_study_portal/videos'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper to validate Exam -> Subject -> Topic hierarchy
const validateHierarchy = async (examId, subjectId, topicId) => {
  if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(topicId)) {
    return { valid: false, message: 'Invalid ID format in exam, subject, or topic' };
  }

  const topic = await Topic.findById(topicId).populate('subject');
  if (!topic) {
    return { valid: false, message: 'Selected topic does not exist' };
  }

  if (topic.subject._id.toString() !== subjectId.toString()) {
    return { valid: false, message: 'Selected topic does not belong to the specified subject' };
  }

  const subject = await Subject.findById(subjectId);
  if (!subject || subject.exam.toString() !== examId.toString()) {
    return { valid: false, message: 'Selected subject does not belong to the specified exam' };
  }

  return { valid: true };
};

// @desc    Get videos (Filtered by search query, topicId, subjectId, or examId)
// @route   GET /api/videos
// @access  Public / Private
const getVideos = async (req, res) => {
  try {
    const { topicId, subjectId, examId, search, all } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';

    const filter = {};

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) filter.topic = topicId;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filter.subject = subjectId;
    if (examId && mongoose.Types.ObjectId.isValid(examId)) filter.exam = examId;

    // Students receive published videos only
    if (!isAdmin && all !== 'true') {
      filter.isPublished = true;
    }

    // Case-insensitive search across title, titleTa, description, descriptionTa
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: searchRegex },
        { titleTa: searchRegex },
        { description: searchRegex },
        { descriptionTa: searchRegex }
      ];
    }

    const videos = await Video.find(filter)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa order')
      .sort({ createdAt: -1 });

    return res.json(videos);
  } catch (error) {
    console.error('getVideos Error:', error);
    return res.status(500).json({ message: 'Server error fetching videos', error: error.message });
  }
};

// @desc    Get single video by ID
// @route   GET /api/videos/:id
// @access  Public / Private
const getVideoById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = await Video.findById(req.params.id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa order');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    // If student requests an unpublished video, return 404 Not Found
    if (!isAdmin && !video.isPublished) {
      return res.status(404).json({ message: 'Video not found' });
    }

    return res.json(video);
  } catch (error) {
    console.error('getVideoById Error:', error);
    return res.status(500).json({ message: 'Server error fetching video', error: error.message });
  }
};

// @desc    Upload video to Cloudinary & create MongoDB metadata record
// @route   POST /api/videos/upload
// @access  Private/Admin Only
const uploadVideo = async (req, res) => {
  try {
    const { title, titleTa, description, descriptionTa, examId, subjectId, topicId, isPublished } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a video file to upload' });
    }

    if (!title || !examId || !subjectId || !topicId) {
      return res.status(400).json({ message: 'Title, exam, subject, and topic are required' });
    }

    // Validate hierarchy
    const hierarchyCheck = await validateHierarchy(examId, subjectId, topicId);
    if (!hierarchyCheck.valid) {
      return res.status(400).json({ message: hierarchyCheck.message });
    }

    // Stream upload buffer to Cloudinary
    console.log(`Uploading video buffer (${req.file.size} bytes) to Cloudinary...`);
    const cloudinaryResult = await uploadToCloudinaryStream(req.file.buffer);

    // Derive auto-generated JPG thumbnail URL from Cloudinary
    const thumbnailUrl = cloudinary.url(cloudinaryResult.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 480, crop: 'scale' }]
    });

    const video = await Video.create({
      title,
      titleTa: titleTa || '',
      description: description || '',
      descriptionTa: descriptionTa || '',
      exam: examId,
      subject: subjectId,
      topic: topicId,
      videoUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      thumbnailUrl: thumbnailUrl || '',
      duration: Math.round(cloudinaryResult.duration || 0),
      isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true
    });

    const populated = await Video.findById(video._id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    return res.status(201).json(populated);
  } catch (error) {
    console.error('uploadVideo Error:', error);
    return res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
};

// @desc    Update video metadata details
// @route   PUT /api/videos/:id
// @access  Private/Admin Only
const updateVideoDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const { title, titleTa, description, descriptionTa, examId, subjectId, topicId, isPublished } = req.body;

    const targetExam = examId || video.exam.toString();
    const targetSubject = subjectId || video.subject.toString();
    const targetTopic = topicId || video.topic.toString();

    // Validate hierarchy if any reference changes
    if (examId || subjectId || topicId) {
      const hierarchyCheck = await validateHierarchy(targetExam, targetSubject, targetTopic);
      if (!hierarchyCheck.valid) {
        return res.status(400).json({ message: hierarchyCheck.message });
      }
      video.exam = targetExam;
      video.subject = targetSubject;
      video.topic = targetTopic;
    }

    if (title !== undefined) video.title = title;
    if (titleTa !== undefined) video.titleTa = titleTa;
    if (description !== undefined) video.description = description;
    if (descriptionTa !== undefined) video.descriptionTa = descriptionTa;
    if (isPublished !== undefined) video.isPublished = Boolean(isPublished);

    const updated = await video.save();
    const populated = await Video.findById(updated._id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    return res.json(populated);
  } catch (error) {
    console.error('updateVideoDetails Error:', error);
    return res.status(500).json({ message: 'Server error updating video details', error: error.message });
  }
};

// @desc    Safe Cloudinary video replacement
// @route   PUT /api/videos/:id/replace
// @access  Private/Admin Only
const replaceVideoFile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a new video file' });
    }

    const oldPublicId = video.cloudinaryPublicId;

    // STEP 1: Upload new video to Cloudinary FIRST
    console.log(`Uploading replacement video (${req.file.size} bytes)...`);
    const newResult = await uploadToCloudinaryStream(req.file.buffer);

    // STEP 2: Derive new thumbnail
    const newThumbnailUrl = cloudinary.url(newResult.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 480, crop: 'scale' }]
    });

    // STEP 3: Update MongoDB document
    video.videoUrl = newResult.secure_url;
    video.cloudinaryPublicId = newResult.public_id;
    video.thumbnailUrl = newThumbnailUrl;
    video.duration = Math.round(newResult.duration || 0);

    const updatedVideo = await video.save();

    // STEP 4: Destroy old Cloudinary video ONLY AFTER DB update succeeds
    if (oldPublicId) {
      try {
        console.log(`Purging old Cloudinary video asset: ${oldPublicId}`);
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
      } catch (destroyErr) {
        console.error('Warning: Failed to destroy old Cloudinary asset:', destroyErr.message);
      }
    }

    const populated = await Video.findById(updatedVideo._id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    return res.json(populated);
  } catch (error) {
    console.error('replaceVideoFile Error:', error);
    return res.status(500).json({ message: 'Video replacement failed', error: error.message });
  }
};

// @desc    Delete video from Cloudinary & MongoDB
// @route   DELETE /api/videos/:id
// @access  Private/Admin Only
const deleteVideo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Destroy Cloudinary asset
    if (video.cloudinaryPublicId) {
      try {
        console.log(`Purging Cloudinary asset: ${video.cloudinaryPublicId}`);
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' });
      } catch (destroyErr) {
        console.error('Warning: Failed to destroy Cloudinary asset:', destroyErr.message);
      }
    }

    await video.deleteOne();
    return res.json({ message: 'Video deleted successfully', deletedVideoId: req.params.id });
  } catch (error) {
    console.error('deleteVideo Error:', error);
    return res.status(500).json({ message: 'Server error deleting video', error: error.message });
  }
};

module.exports = {
  getVideos,
  getVideoById,
  uploadVideo,
  updateVideoDetails,
  replaceVideoFile,
  deleteVideo
};
