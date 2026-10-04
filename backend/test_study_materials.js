const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const materialRoutes = require('./routes/materialRoutes');
const progressRoutes = require('./routes/progressRoutes');

const User = require('./models/User');
const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Material = require('./models/Material');

const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');

async function runMaterialsVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING STUDY MATERIALS & ADMIN REFACTOR');
  console.log('================================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tnpsc_study_portal');
    console.log('MongoDB Connected: localhost/tnpsc_study_portal');

    await seedAdmin();
    await seedInitialExams();

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/exams', examRoutes);
    app.use('/api/subjects', subjectRoutes);
    app.use('/api/topics', topicRoutes);
    app.use('/api/videos', videoRoutes);
    app.use('/api/materials', materialRoutes);
    app.use('/api/progress', progressRoutes);

    const TEST_PORT = process.env.TEST_PORT || 5066;
    const server = app.listen(TEST_PORT);

    // 1. Admin Login
    const adminLoginRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    console.log('  ✓ Admin logged in successfully.');

    // 2. Student Registration
    const studentEmail = `materials_test_${Date.now()}@test.com`;
    const studentRegRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Materials Student',
        email: studentEmail,
        password: 'Password@1234'
      })
    });
    const studentData = await studentRegRes.json();
    const studentToken = studentData.token;
    console.log('  ✓ Student registered.');

    // 3. Create test hierarchy
    const exam = await Exam.findOne({ isActive: true });
    const subject = await Subject.create({ exam: exam._id, name: 'Polity Subject Test', nameTa: 'ஆட்சியியல் பாடம்' });
    const topic = await Topic.create({ subject: subject._id, name: 'Constitution Topic Test', nameTa: 'அரசியலமைப்பு தலைப்பு' });

    // 4. Create Published Study Material & Draft Material directly in DB
    const pubMaterial = await Material.create({
      title: 'Indian Constitution Complete Handwritten Notes',
      titleTa: 'இந்திய அரசியலமைப்பு முழுமையான கையெழுத்துக் குறிப்புகள்',
      description: 'Handwritten notes covering Fundamental Rights, DPSP, and Preamble',
      descriptionTa: 'அடிப்படைக் கடமைகள் மற்றும் உரிமைகள் குறித்த குறிப்புகள்',
      materialType: 'handwritten_notes',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample_notes.pdf',
      cloudinaryPublicId: `mat_pub_${Date.now()}`,
      fileFormat: 'pdf',
      fileSize: 2048576, // 2 MB
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      isPublished: true
    });

    const draftMaterial = await Material.create({
      title: 'Draft Unit 2 Reference PDF',
      description: 'Unpublished draft reference',
      materialType: 'pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample_draft.pdf',
      cloudinaryPublicId: `mat_draft_${Date.now()}`,
      fileFormat: 'pdf',
      fileSize: 1024000,
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      isPublished: false
    });

    // 5. Test Student GET /api/materials (must receive only published materials)
    const studentMatRes = await fetch(`http://localhost:${TEST_PORT}/api/materials?topicId=${topic._id}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentMaterials = await studentMatRes.json();
    if (studentMaterials.length !== 1 || studentMaterials[0]._id !== pubMaterial._id.toString()) {
      throw new Error(`Student scoping failed! Received: ${studentMaterials.length} items`);
    }
    console.log('  ✓ Student visibility scoping verified (only published materials returned).');

    // 6. Test Admin GET /api/materials?all=true (must receive both published and draft)
    const adminMatRes = await fetch(`http://localhost:${TEST_PORT}/api/materials?topicId=${topic._id}&all=true`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminMaterials = await adminMatRes.json();
    if (adminMaterials.length !== 2) {
      throw new Error(`Admin failed to receive draft material! Received: ${adminMaterials.length}`);
    }
    console.log('  ✓ Admin can view all published and draft study materials.');

    // 7. Test Material Update
    const updateRes = await fetch(`http://localhost:${TEST_PORT}/api/materials/${pubMaterial._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Updated Constitution Notes v2' })
    });
    const updated = await updateRes.json();
    if (updated.title !== 'Updated Constitution Notes v2') throw new Error('Material update failed');
    console.log('  ✓ Admin update endpoint verified.');

    // 8. Test Admin Analytics includes totalMaterials
    const analyticsRes = await fetch(`http://localhost:${TEST_PORT}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    if (typeof analyticsData.totalMaterials !== 'number' || analyticsData.totalMaterials < 2) {
      throw new Error('Analytics missing totalMaterials count');
    }
    console.log(`  ✓ Admin analytics reflects totalMaterials (${analyticsData.totalMaterials}).`);

    // Cleanup
    await Material.deleteMany({ _id: { $in: [pubMaterial._id, draftMaterial._id] } });
    await Topic.findByIdAndDelete(topic._id);
    await Subject.findByIdAndDelete(subject._id);
    server.close();

    console.log('\n================================================================');
    console.log('🎉 ALL STUDY MATERIALS & REFACTOR TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runMaterialsVerification();
