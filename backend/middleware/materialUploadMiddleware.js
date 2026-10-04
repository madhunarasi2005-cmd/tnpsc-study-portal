const multer = require('multer');
const path = require('path');

// Memory storage for direct stream buffer uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp'
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(
    new Error(
      'Invalid document format. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP.'
    )
  );
};

const materialUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max file size limit
  },
  fileFilter
});

module.exports = materialUpload;
