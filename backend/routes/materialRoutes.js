const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const materialUpload = require('../middleware/materialUploadMiddleware');
const {
  getMaterials,
  getMaterialById,
  uploadMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materialController');

// Optional authentication middleware for GET routes to recognize admin vs student
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// @route   GET /api/materials
// @route   GET /api/materials/:id
router.get('/', optionalAuth, getMaterials);
router.get('/:id', optionalAuth, getMaterialById);

// Admin Only Routes
router.post('/upload', protect, adminOnly, materialUpload.single('file'), uploadMaterial);
router.put('/:id', protect, adminOnly, updateMaterial);
router.delete('/:id', protect, adminOnly, deleteMaterial);

module.exports = router;
