import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import AboutSection from './components/AboutSection';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Exams from './pages/Exams';
import Subjects from './pages/Subjects';
import Topics from './pages/Topics';
import VideoPlayer from './pages/VideoPlayer';
import ExamManagement from './pages/admin/ExamManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import TopicManagement from './pages/admin/TopicManagement';
import VideoManagement from './pages/admin/VideoManagement';
import MaterialManagement from './pages/admin/MaterialManagement';

function HomeContent({ currentLang }) {
  const content = {
    en: {
      badge: "Bilingual Exam Learning Portal",
      title: "TNPSC, UGC NET & SET Exam Preparation",
      subtitle: "Video-based learning portal supporting English & Tamil medium aspirants.",
      exploreCatalog: "Explore Exam Catalog →",
      getStarted: "Get Started -  Student Register",
      studentLogin: "Student Login",
      tnpscTitle: "TNPSC Group 1, 2 & 4",
      tnpscDesc: "Comprehensive video lectures, syllabus coverage, and practice tests.",
      ugcTitle: "UGC NET Paper 1 & 2",
      ugcDesc: "Expert guidance for lectureship and JRF preparation in all subjects.",
      setTitle: "State Eligibility Test (SET)",
      setDesc: "Targeted video modules and previous year paper solutions."
    },
    ta: {
      badge: "இருமொழி தேர்வு கற்றல் மையம்",
      title: "டிஎன்பிஎஸ்சி, UGC NET & SET தேர்வு தயாரிப்பு",
      subtitle: "ஆங்கிலம் மற்றும் தமிழ் வழி மாணவர்களுக்கான காணொளி வழி கற்றல் வலைத்தளம்.",
      exploreCatalog: "தேர்வுகள் பட்டியலைக் காண்க →",
      getStarted: "தொடங்கவும் - புதிய மாணவர் பதிவு",
      studentLogin: "மாணவர் உள்நுழைவு",
      tnpscTitle: "டிஎன்பிஎஸ்சி தொகுதி 1, 2 & 4",
      tnpscDesc: "விரிவான காணொளி உரைகள், பாடத்திட்ட விளக்கம் மற்றும் மாதிரித் தேர்வுகள்.",
      ugcTitle: "UGC NET தாள் 1 & 2",
      ugcDesc: "பேராசிரியர் தகுதி மற்றும் JRF தேர்விற்கான சிறப்பு வழிகாட்டுதல்.",
      setTitle: "மாநிலத் தகுதித் தேர்வு (SET)",
      setDesc: "குறிப்பிட்ட பாடத் தொகுதிகள் மற்றும் முந்தைய ஆண்டு வினாத்தாள் தீர்வுகள்."
    }
  };

  const t = content[currentLang] || content.en;

  return (
    <>
      <main className="hero">
        <span className="badge">{t.badge}</span>
        <h1 className="hero-title">{t.title}</h1>
        <p className="hero-subtitle">{t.subtitle}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <Link to="/exams" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', textDecoration: 'none' }}>
            {t.exploreCatalog}
          </Link>
          <Link to="/register" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', textDecoration: 'none' }}>
            {t.getStarted}
          </Link>
        </div>

        <div className="card-grid">
          <div className="exam-card">
            <div className="exam-tag">EXAM CATEGORY</div>
            <h2 className="exam-title">{t.tnpscTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.tnpscDesc}</p>
          </div>

          <div className="exam-card">
            <div className="exam-tag">NATIONAL LEVEL</div>
            <h2 className="exam-title">{t.ugcTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.ugcDesc}</p>
          </div>

          <div className="exam-card">
            <div className="exam-tag">STATE LEVEL</div>
            <h2 className="exam-title">{t.setTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.setDesc}</p>
          </div>
        </div>
      </main>

      {/* About Ma'am + Contact Section at the Bottom */}
      <AboutSection currentLang={currentLang} />
    </>
  );
}

function App() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header currentLang={language} setLanguage={handleLanguageChange} />

          <Routes>
            <Route path="/" element={<HomeContent currentLang={language} />} />
            <Route path="/login" element={<Login currentLang={language} />} />
            <Route path="/register" element={<Register currentLang={language} />} />
            <Route path="/admin/login" element={<AdminLogin currentLang={language} />} />

            {/* Catalog & Video Player Routes */}
            <Route path="/exams" element={<Exams currentLang={language} />} />
            <Route path="/exams/:examId/subjects" element={<Subjects currentLang={language} />} />
            <Route path="/subjects/:subjectId/topics" element={<Topics currentLang={language} />} />
            <Route path="/videos/:videoId" element={<VideoPlayer currentLang={language} />} />

            {/* Student Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard currentLang={language} />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Management Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard currentLang={language} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ExamManagement currentLang={language} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SubjectManagement currentLang={language} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/topics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TopicManagement currentLang={language} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <ProtectedRoute requiredRole="admin">
                  <VideoManagement currentLang={language} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/materials"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MaterialManagement currentLang={language} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
