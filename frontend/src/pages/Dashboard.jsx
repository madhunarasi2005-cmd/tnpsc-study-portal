import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { getLangText } from '../utils/langHelper';

const Dashboard = ({ currentLang }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalVideos: 0, completedVideos: 0, inProgressVideos: 0, overallPercentage: 0 });
  const [continueList, setContinueList] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, contData, compData] = await Promise.all([
        apiRequest('/progress/summary'),
        apiRequest('/progress/continue-watching'),
        apiRequest('/progress/recently-completed')
      ]);
      setSummary(sumData);
      setContinueList(contData);
      setCompletedList(compData);
    } catch (err) {
      setError(err.message || 'Failed to load progress dashboard');
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    en: {
      welcome: 'Welcome back',
      studentProfile: 'Aspirant Profile',
      email: 'Email',
      role: 'Account Role',
      selectedExams: 'Target Exams',
      noExams: 'All competitive exams active',
      progressTitle: 'Learning Progress Overview',
      overallProgress: 'Overall Video Completion Progress',
      totalVideosStat: 'Total Available Videos',
      completedStat: 'Completed Videos',
      inProgressStat: 'In-Progress Videos',
      continueWatchingTitle: 'Continue Watching',
      noContinue: 'No videos currently in progress. Select a subject to start watching!',
      resumeBtn: 'Resume ▶',
      recentlyCompletedTitle: 'Recently Completed Lectures',
      noCompleted: 'No completed video lectures yet.',
      browseExamsBtn: 'Browse Exam Catalog →'
    },
    ta: {
      welcome: 'மீண்டும் நல்வரவு',
      studentProfile: 'மாணவர் விவரங்கள்',
      email: 'மின்னஞ்சல்',
      role: 'கணக்கு வகை',
      selectedExams: 'தேர்ந்தெடுக்கப்பட்ட தேர்வுகள்',
      noExams: 'அனைத்து தேர்வுகளும் செயலில் உள்ளன',
      progressTitle: 'கற்றல் முன்னேற்றப் பார்வை',
      overallProgress: 'ஒட்டுமொத்த காணொளி கற்றல் முன்னேற்றம்',
      totalVideosStat: 'மொத்தக் காணொளிகள்',
      completedStat: 'நிறைவுற்ற காணொளிகள்',
      inProgressStat: 'தொடரும் காணொளிகள்',
      continueWatchingTitle: 'தொடர்ந்து காண்க (Continue Watching)',
      noContinue: 'தற்போது அரைகுறையாகப் பார்த்த காணொளிகள் எதுவும் இல்லை.',
      resumeBtn: 'மீண்டும் தொடங்கு ▶',
      recentlyCompletedTitle: 'சமீபத்தில் முடித்த பாடங்கள்',
      noCompleted: 'நிறைவுற்ற காணொளிகள் எதுவும் இல்லை.',
      browseExamsBtn: 'தேர்வுகள் பட்டியலைக் காண்க →'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge">STUDENT DASHBOARD</span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
          {t.welcome}, {user?.name}!
        </h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* User Info & Target Exams Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="exam-card">
          <div className="exam-tag">{t.studentProfile}</div>
          <h2 style={{ fontSize: '1.35rem', margin: '0.4rem 0 0.85rem', color: 'var(--text-primary)' }}>{user?.name}</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{t.email}:</strong> {user?.email}
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{t.role}:</strong> <span style={{ textTransform: 'capitalize', color: 'var(--accent-gold)', fontWeight: 700 }}>{user?.role}</span>
          </p>
        </div>

        <div className="exam-card">
          <div className="exam-tag">{t.selectedExams}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {user?.selectedExams && user.selectedExams.length > 0 ? (
              user.selectedExams.map((exam) => (
                <span key={exam} className="status-badge" style={{ fontSize: '0.88rem', padding: '5px 12px' }}>
                  <span className="status-dot"></span>
                  {exam}
                </span>
              ))
            ) : (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{t.noExams}</p>
            )}
          </div>
        </div>
      </div>

      {/* Learning Progress Summary Section */}
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{t.progressTitle}</h2>

        {/* Overall Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.98rem' }}>
            <span>{t.overallProgress}</span>
            <span style={{ color: 'var(--accent-gold)' }}>{summary.overallPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
            <div
              style={{
                width: `${summary.overallPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4f46e5, #10b981)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{summary.totalVideos}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 700 }}>{t.totalVideosStat}</div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#15803d' }}>{summary.completedVideos}</div>
            <div style={{ fontSize: '0.9rem', color: '#15803d', marginTop: '0.35rem', fontWeight: 700 }}>{t.completedStat}</div>
          </div>

          <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#b45309' }}>{summary.inProgressVideos}</div>
            <div style={{ fontSize: '0.9rem', color: '#b45309', marginTop: '0.35rem', fontWeight: 700 }}>{t.inProgressStat}</div>
          </div>
        </div>
      </div>

      {/* Continue Watching Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{t.continueWatchingTitle}</h2>

        {continueList.length === 0 ? (
          <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '1rem' }}>{t.noContinue}</p>
            <Link to="/exams" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              {t.browseExamsBtn}
            </Link>
          </div>
        ) : (
          <div className="card-grid" style={{ margin: '0' }}>
            {continueList.map((item) => {
              const vid = item.video;
              const duration = vid.duration || 1;
              const percent = Math.min(100, Math.round((item.watchedSeconds / duration) * 100));

              return (
                <div key={item.progressId} className="exam-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ height: '140px', background: '#0f172a', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700 }}>▶ VIDEO</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5px', background: 'rgba(255,255,255,0.3)' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-gold)' }} />
                      </div>
                    </div>

                    <span className="exam-tag">{vid.exam?.code} • {getLangText(vid.subject, 'name', currentLang)}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.35rem 0 0.5rem', color: 'var(--text-primary)' }}>
                      {getLangText(vid, 'title', currentLang)}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      → {getLangText(vid.topic, 'name', currentLang)} ({percent}% watched)
                    </p>
                  </div>

                  <Link to={`/videos/${vid._id}`} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.95rem', padding: '0.75rem' }}>
                    {t.resumeBtn}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Completed Videos Section */}
      {completedList.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{t.recentlyCompletedTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {completedList.map((item) => {
              const vid = item.video;
              return (
                <div key={item.progressId} className="exam-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '50px', background: '#0f172a', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    {vid.thumbnailUrl ? (
                      <img src={vid.thumbnailUrl} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.8rem' }}>✓</div>
                    )}
                  </div>
                  <div>
                    <span className="status-badge" style={{ fontSize: '0.75rem', padding: '2px 8px', marginBottom: '0.25rem' }}>✓ COMPLETED</span>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                      <Link to={`/videos/${vid._id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {getLangText(vid, 'title', currentLang)}
                      </Link>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getLangText(vid.subject, 'name', currentLang)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
