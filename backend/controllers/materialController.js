const mongoose = require('mongoose');
const Material = require('../models/Material');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const cloudinary = require('../config/cloudinary');
const path = require('path');

// Helper to stream upload material buffer to Cloudinary
const uploadMaterialToCloudinaryStream = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const isDocOrPpt = ['doc', 'docx', 'ppt', 'pptx'].includes(ext);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isDocOrPpt ? 'raw' : 'auto',
        folder: 'tnpsc_study_portal/materials',
        use_filename: true,
        unique_filename: true
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
  if (
    !mongoose.Types.ObjectId.isValid(examId) ||
    !mongoose.Types.ObjectId.isValid(subjectId) ||
    !mongoose.Types.ObjectId.isValid(topicId)
  ) {
    return { valid: false, message: 'Invalid ID format in exam, subject, or topic' };
  }

  const topic = await Topic.findById(topicId).populate('subject');
  if (!topic) {
    return { valid: false, message: 'Selected topic does not exist' };
  }

  if (topic.subject._id.toString() !== subjectId.toString()) {
    return {
      valid: false,
      message: 'Selected topic does not belong to the specified subject'
    };
  }

  const subject = await Subject.findById(subjectId);
  if (!subject || subject.exam.toString() !== examId.toString()) {
    return {
      valid: false,
      message: 'Selected subject does not belong to the specified exam'
    };
  }

  return { valid: true };
};

// @desc    Get study materials (Filtered by topicId, subjectId, examId, search, materialType)
// @route   GET /api/materials
// @access  Public / Private
const getMaterials = async (req, res) => {
  try {
    const { topicId, subjectId, examId, search, materialType, all } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';

    const filter = {};

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) filter.topic = topicId;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filter.subject = subjectId;
    if (examId && mongoose.Types.ObjectId.isValid(examId)) filter.exam = examId;
    if (materialType) filter.materialType = materialType;

    // Students receive published materials only
    if (!isAdmin && all !== 'true') {
      filter.isPublished = true;
    }

    // Case-insensitive search
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      filter.$or = [
        { title: searchRegex },
        { titleTa: searchRegex },
        { description: searchRegex },
        { descriptionTa: searchRegex }
      ];
    }

    const materials = await Material.find(filter)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa order')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    console.error('getMaterials Error:', error);
    res.status(500).json({ message: 'Server error fetching materials', error: error.message });
  }
};

// @desc    Get single study material by ID
// @route   GET /api/materials/:id
// @access  Public / Private
const getMaterialById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const material = await Material.findById(req.params.id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    if (!material.isPublished && !isAdmin) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('getMaterialById Error:', error);
    res.status(500).json({ message: 'Server error fetching material', error: error.message });
  }
};

// @desc    Upload new study material (PDF, Handwritten Notes, DOC, PPT)
// @route   POST /api/materials/upload
// @access  Private/Admin Only
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No material document file uploaded' });
    }

    const {
      title,
      titleTa,
      description,
      descriptionTa,
      materialType,
      examId,
      subjectId,
      topicId,
      isPublished
    } = req.body;

    if (!title || !examId || !subjectId || !topicId) {
      return res.status(400).json({
        message: 'Please provide all required fields: title, examId, subjectId, topicId'
      });
    }

    // Validate Exam -> Subject -> Topic Hierarchy
    const hierarchyCheck = await validateHierarchy(examId, subjectId, topicId);
    if (!hierarchyCheck.valid) {
      return res.status(400).json({ message: hierarchyCheck.message });
    }

    // Detect file format extension
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '') || 'pdf';

    // Stream buffer to Cloudinary
    const cloudinaryResult = await uploadMaterialToCloudinaryStream(
      req.file.buffer,
      req.file.originalname
    );

    const newMaterial = await Material.create({
      title,
      titleTa: titleTa || '',
      description: description || '',
      descriptionTa: descriptionTa || '',
      materialType: materialType || 'pdf',
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      fileFormat: ext,
      fileSize: req.file.size || cloudinaryResult.bytes || 0,
      exam: examId,
      subject: subjectId,
      topic: topicId,
      isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true
    });

    const populatedMaterial = await Material.findById(newMaterial._id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    res.status(201).json(populatedMaterial);
  } catch (error) {
    console.error('uploadMaterial Error:', error);
    res.status(500).json({ message: 'Study material upload failed', error: error.message });
  }
};

// @desc    Update study material metadata
// @route   PUT /api/materials/:id
// @access  Private/Admin Only
const updateMaterial = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const {
      title,
      titleTa,
      description,
      descriptionTa,
      materialType,
      isPublished,
      examId,
      subjectId,
      topicId
    } = req.body;

    if (examId && subjectId && topicId) {
      const hierarchyCheck = await validateHierarchy(examId, subjectId, topicId);
      if (!hierarchyCheck.valid) {
        return res.status(400).json({ message: hierarchyCheck.message });
      }
      material.exam = examId;
      material.subject = subjectId;
      material.topic = topicId;
    }

    if (title !== undefined) material.title = title;
    if (titleTa !== undefined) material.titleTa = titleTa;
    if (description !== undefined) material.description = description;
    if (descriptionTa !== undefined) material.descriptionTa = descriptionTa;
    if (materialType !== undefined) material.materialType = materialType;
    if (isPublished !== undefined) material.isPublished = isPublished;

    await material.save();

    const updatedMaterial = await Material.findById(material._id)
      .populate('exam', 'name nameTa code')
      .populate('subject', 'name nameTa')
      .populate('topic', 'name nameTa');

    res.json(updatedMaterial);
  } catch (error) {
    console.error('updateMaterial Error:', error);
    res.status(500).json({ message: 'Failed to update study material', error: error.message });
  }
};

// @desc    Delete study material from Cloudinary & Database
// @route   DELETE /api/materials/:id
// @access  Private/Admin Only
const deleteMaterial = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Try destroying Cloudinary asset
    try {
      if (material.cloudinaryPublicId) {
        // Attempt raw destroy first, then image/auto fallback
        await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
        await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'image' });
      }
    } catch (cErr) {
      console.warn('Cloudinary asset destroy warning:', cErr.message);
    }

    await Material.findByIdAndDelete(material._id);

    res.json({ message: 'Study material deleted successfully from database and Cloudinary storage' });
  } catch (error) {
    console.error('deleteMaterial Error:', error);
    res.status(500).json({ message: 'Failed to delete study material', error: error.message });
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  uploadMaterial,
  updateMaterial,
  deleteMaterial
};
