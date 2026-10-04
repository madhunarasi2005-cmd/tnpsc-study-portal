const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');
const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');

async function runPhase2Tests() {
  try {
    console.log('--- STARTING PHASE 2 EXAM, SUBJECT & TOPIC VERIFICATION ---');
    await connectDB();
    await seedAdmin();
    await seedInitialExams();

    // Login Admin
    const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // Login/Register Student
    const studentRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase2 Aspirant',
        email: `p2_student_${Date.now()}@test.com`,
        password: 'Password@123',
        selectedExams: ['TNPSC']
      })
    });
    const studentData = await studentRes.json();
    const studentToken = studentData.token;

    // TEST 1: Admin Create Exam
    const examRes = await fetch('http://localhost:5000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Mock Test Exam',
        nameTa: 'மாதிரித் தேர்வு',
        code: `TEST_${Date.now()}`,
        description: 'Test Exam Description',
        descriptionTa: 'மாதிரித் தேர்வு விளக்கம்',
        isActive: true
      })
    });
    const createdExam = await examRes.json();
    if (examRes.status !== 201 || !createdExam._id) {
      throw new Error('Exam creation failed: ' + JSON.stringify(createdExam));
    }
    console.log('✓ TEST 1 PASSED: Admin created Exam:', createdExam.name, `[ID: ${createdExam._id}]`);

    // TEST 2: Admin Create Subject linked to Exam
    const subjectRes = await fetch('http://localhost:5000/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        examId: createdExam._id,
        name: 'General History',
        nameTa: 'பொது வரலாறு',
        description: 'Ancient and Modern History of India & Tamil Nadu',
        descriptionTa: '', // Empty to test fallback!
        order: 1,
        isActive: true
      })
    });
    const createdSubject = await subjectRes.json();
    if (subjectRes.status !== 201 || !createdSubject._id) {
      throw new Error('Subject creation failed: ' + JSON.stringify(createdSubject));
    }
    console.log('✓ TEST 2 PASSED: Admin created Subject linked to Exam:', createdSubject.name);

    // TEST 3: Admin Create Topic linked to Subject
    const topicRes = await fetch('http://localhost:5000/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subjectId: createdSubject._id,
        name: 'Indus Valley Civilization',
        nameTa: 'சிந்து சமவெளி நாகரிகம்',
        description: 'Key archaeological findings and trade networks',
        descriptionTa: '',
        order: 1,
        isActive: true
      })
    });
    const createdTopic = await topicRes.json();
    if (topicRes.status !== 201 || !createdTopic._id) {
      throw new Error('Topic creation failed: ' + JSON.stringify(createdTopic));
    }
    console.log('✓ TEST 3 PASSED: Admin created Topic linked to Subject:', createdTopic.name);

    // TEST 4: Student Authorization Denial (Attempt POST exam with Student JWT)
    const unauthorizedRes = await fetch('http://localhost:5000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: 'Hacker Exam',
        code: 'HACK',
        description: 'Should fail'
      })
    });
    if (unauthorizedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Student Exam Creation, got ${unauthorizedRes.status}`);
    }
    console.log('✓ TEST 4 PASSED: Student attempt to create exam rejected with 403 Forbidden.');

    // TEST 5: Student Browse Active Hierarchy
    const studentExamsRes = await fetch('http://localhost:5000/api/exams');
    const studentExams = await studentExamsRes.json();
    const foundExam = studentExams.find(e => e._id === createdExam._id);
    if (!foundExam || foundExam.subjectCount < 1) {
      throw new Error('Student failed to fetch active exam hierarchy counts');
    }
    console.log('✓ TEST 5 PASSED: Student successfully queried active exams with subject counts.');

    // TEST 6: Cascade Deletion Verification
    const deleteRes = await fetch(`http://localhost:5000/api/exams/${createdExam._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200) {
      throw new Error('Exam cascade deletion failed: ' + JSON.stringify(deleteJson));
    }

    // Verify Subject and Topic are deleted from DB
    const remainingSubject = await Subject.findById(createdSubject._id);
    const remainingTopic = await Topic.findById(createdTopic._id);
    if (remainingSubject || remainingTopic) {
      throw new Error('Cascade deletion check failed: Child subject/topic still present in DB');
    }
    console.log('✓ TEST 6 PASSED: Cascade deletion verified (Exam -> Subject -> Topic cleaned safely).');

    console.log('--- ALL PHASE 2 BACKEND TESTS PASSED PERFECTLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ PHASE 2 TEST FAILED:', err);
    process.exit(1);
  }
}

runPhase2Tests();
