const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

// @desc    Seed initial Exams if collection is empty
const seedInitialExams = async () => {
  try {
    const count = await Exam.countDocuments();
    if (count === 0) {
      await Exam.insertMany([
        {
          name: 'TNPSC Group Exams',
          nameTa: 'டிஎன்பிஎஸ்சி தொகுதி தேர்வுகள்',
          code: 'TNPSC',
          description: 'Tamil Nadu Public Service Commission competitive examinations (Group 1, 2 & 4)',
          descriptionTa: 'தமிழ்நாடு அரசுப் பணியாளர் தேர்வாணையத் தேர்வுகள் (தொகுதி 1, 2 மற்றும் 4)',
          isActive: true
        },
        {
          name: 'UGC NET Examination',
          nameTa: 'UGC NET தேசியத் தகுதித் தேர்வு',
          code: 'UGC_NET',
          description: 'National Eligibility Test for Assistant Professor & Junior Research Fellowship',
          descriptionTa: 'உதவிப் பேராசிரியர் மற்றும் இளநிலை ஆராய்ச்சி உதவித்தொகைக்கான தேசியத் தகுதித் தேர்வு',
          isActive: true
        },
        {
          name: 'State Eligibility Test (SET)',
          nameTa: 'மாநிலத் தகுதித் தேர்வு (SET)',
          code: 'SET',
          description: 'State level eligibility test for lectureship in Tamil Nadu colleges & universities',
          descriptionTa: 'தமிழ்நாடு கல்லூரிகள் மற்றும் பல்கலைக்கழக விரிவுரையாளர் தகுதித் தேர்வு',
          isActive: true
        }
      ]);
      console.log('✓ Initial Exams seeded successfully.');
    }
  } catch (error) {
    console.error('Exam Seeding Error:', error.message);
  }
};

// @desc    Get all exams (Admin gets all, Student gets active only)
// @route   GET /api/exams
// @access  Public / Private
const getExams = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const filter = (isAdmin || req.query.all === 'true') ? {} : { isActive: true };

    const exams = await Exam.find(filter).sort({ createdAt: 1 });
    
    // Attach counts for subjects
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const subjectCount = await Subject.countDocuments({
          exam: exam._id,
          ...(isAdmin ? {} : { isActive: true })
        });
        return {
          ...exam.toObject(),
          subjectCount
        };
      })
    );

    return res.json(examsWithCounts);
  } catch (error) {
    console.error('getExams Error:', error);
    return res.status(500).json({ message: 'Server error fetching exams', error: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Public
const getExamById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching exam', error: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    const { name, nameTa, code, description, descriptionTa, isActive } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Exam name and code are required' });
    }

    const existingCode = await Exam.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: `Exam code '${code.toUpperCase()}' already exists` });
    }

    const exam = await Exam.create({
      name,
      nameTa: nameTa || '',
      code: code.toUpperCase(),
      description: description || '',
      descriptionTa: descriptionTa || '',
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json(exam);
  } catch (error) {
    console.error('createExam Error:', error);
    return res.status(500).json({ message: 'Server error creating exam', error: error.message });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { name, nameTa, code, description, descriptionTa, isActive } = req.body;

    if (code && code.toUpperCase() !== exam.code) {
      const codeExists = await Exam.findOne({ code: code.toUpperCase(), _id: { $ne: exam._id } });
      if (codeExists) {
        return res.status(400).json({ message: `Exam code '${code.toUpperCase()}' already exists` });
      }
      exam.code = code.toUpperCase();
    }

    if (name !== undefined) exam.name = name;
    if (nameTa !== undefined) exam.nameTa = nameTa;
    if (description !== undefined) exam.description = description;
    if (descriptionTa !== undefined) exam.descriptionTa = descriptionTa;
    if (isActive !== undefined) exam.isActive = isActive;

    const updatedExam = await exam.save();
    return res.json(updatedExam);
  } catch (error) {
    console.error('updateExam Error:', error);
    return res.status(500).json({ message: 'Server error updating exam', error: error.message });
  }
};

// @desc    Delete exam and cascade delete associated subjects & topics
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Find all subjects linked to this exam
    const subjects = await Subject.find({ exam: exam._id });
    const subjectIds = subjects.map(s => s._id);

    // Delete topics under these subjects
    if (subjectIds.length > 0) {
      await Topic.deleteMany({ subject: { $in: subjectIds } });
    }

    // Delete subjects
    await Subject.deleteMany({ exam: exam._id });

    // Delete exam
    await exam.deleteOne();

    return res.json({
      message: 'Exam and all associated subjects and topics deleted successfully',
      deletedExamId: req.params.id,
      deletedSubjectsCount: subjectIds.length
    });
  } catch (error) {
    console.error('deleteExam Error:', error);
    return res.status(500).json({ message: 'Server error deleting exam', error: error.message });
  }
};

module.exports = {
  seedInitialExams,
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
};
