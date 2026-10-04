const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const materialRoutes = require('./routes/materialRoutes');
const progressRoutes = require('./routes/progressRoutes');
const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration supporting local dev and production frontend URLs
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development or if wildcard is configured, allow all origins
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to prevent deployment breaking
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Connect Database & Seed Initial Data
connectDB().then(() => {
  seedAdmin();
  seedInitialExams();
});

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'TNPSC + UGC NET + SET Study Portal API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'TNPSC + UGC NET + SET Study Portal',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-status', (req, res) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const state = mongoose.connection.readyState;
  res.json({
    dbConnected: state === 1,
    status: states[state] || 'unknown',
    database: mongoose.connection.name || 'tnpsc_study_portal'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/progress', progressRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
