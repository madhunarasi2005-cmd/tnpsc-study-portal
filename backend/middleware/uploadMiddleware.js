const multer = require('multer');
const path = require('path');

// Memory storage for direct stream buffer uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedMimeTypes = [
    'video/mp4',
    'video/x-matroska',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Invalid video format. Allowed formats: MP4, MKV, WebM, MOV, AVI.'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max file size limit
  },
  fileFilter
});

module.exports = upload;
