const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true
    },
    titleTa: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    descriptionTa: {
      type: String,
      trim: true,
      default: ''
    },
    materialType: {
      type: String,
      enum: ['pdf', 'handwritten_notes', 'doc', 'ppt', 'other'],
      default: 'pdf'
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary Public ID is required']
    },
    fileFormat: {
      type: String,
      default: 'pdf'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Target exam is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Target subject is required']
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Target topic is required']
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

materialSchema.index({ topic: 1, isPublished: 1 });
materialSchema.index({ subject: 1, isPublished: 1 });
materialSchema.index({ exam: 1, isPublished: 1 });

module.exports = mongoose.model('Material', materialSchema);
