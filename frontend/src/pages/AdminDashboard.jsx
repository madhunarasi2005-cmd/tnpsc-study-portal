import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { getLangText } from '../utils/langHelper';

const AdminDashboard = ({ currentLang }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/admin/analytics');
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    en: {
      title: 'Admin Control Center & Analytics',
      subtitle:
        'System management, video lectures, study materials publishing, and student learning statistics',
      publishingHeading: '🎥 Video Publishing Status',
      publishedVideos: 'Published & Live Lectures',
      unpublishedVideos: 'Drafts / Hidden Lectures',
      learningHeading: '📈 Overall Student Learning Progress',
      totalCompletedSessions: 'Total Completed Video Sessions',
      overallCompletionRate: 'Overall Student Completion Rate',
      examWiseHeading: '📚 Exam-wise Content Breakdown',
      examCode: 'Exam Code',
      examName: 'Exam Category Name',
      subjectsCount: 'Subjects',
      videosCount: 'Videos',
      materialsCount: 'Materials',
      completionsCount: 'Student Completions',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      mostCompletedHeading: '🏆 Top Completed Video Lectures',
      noCompletedYet: 'No student completed video sessions recorded yet.',
      completions: 'completions',
      managementSections: 'Content Management Hub',
      examMgmt: '1. Exam Category Management',
      examDesc:
        'Create, edit, activate, or delete competitive exam categories (TNPSC, UGC NET, SET)',
      manageExamsBtn: 'Manage Exams →',
      subjectMgmt: '2. Subject Hierarchy Management',
      subjectDesc: 'Organize subjects under specific exam categories with display ordering',
      manageSubjectsBtn: 'Manage Subjects →',
      topicMgmt: '3. Topic Content Management',
      topicDesc: 'Structure learning topics under subjects ready for video and material mapping',
      manageTopicsBtn: 'Manage Topics →',
      videoMgmt: '4. Video Lectures Management',
      videoDesc: 'Upload, edit, replace, publish/unpublish video lectures hosted on Cloudinary',
      manageVideosBtn: 'Manage Videos →',
      materialMgmt: '5. Study Materials & Notes Management',
      materialDesc:
        'Upload, organize, and publish PDF documents, handwritten notes, DOC files, and presentations',
      manageMaterialsBtn: 'Manage Study Materials →',
      loadingStats: 'Loading system analytics...'
    },
    ta: {
      title: 'நிர்வாகக் கட்டுப்பாட்டு மையம் & புள்ளிவிவரங்கள்',
      subtitle:
        'அமைப்பின் மேலாண்மை, காணொளிகள், பாடக் குறிப்புகள் வெளியீடு மற்றும் மாணவர் கற்றல் புள்ளிவிவரங்கள்',
      publishingHeading: '🎥 காணொளி வெளியீட்டு நிலை',
      publishedVideos: 'வெளியிடப்பட்டவை (Live)',
      unpublishedVideos: 'வரைவுகள் (Drafts)',
      learningHeading: '📈 மாணவர் கற்றல் முன்னேற்றப் பார்வை',
      totalCompletedSessions: 'முடிக்கப்பட்ட காணொளி அமர்வுகள்',
      overallCompletionRate: 'ஒட்டுமொத்த நிறைவு விகிதம்',
      examWiseHeading: '📚 தேர்வு வாரியான பாடப் பகுப்பாய்வு',
      examCode: 'தேர்வு',
      examName: 'தேர்வின் பெயர்',
      subjectsCount: 'பாடங்கள்',
      videosCount: 'காணொளிகள்',
      materialsCount: 'குறிப்புகள்',
      completionsCount: 'மாணவர் நிறைவுகள்',
      status: 'நிலை',
      active: 'செயலில்',
      inactive: 'செயலிழந்தது',
      mostCompletedHeading: '🏆 அதிகம் முடிக்கப்பட்ட காணொளிப் பாடங்கள்',
      noCompletedYet: 'இதுவரை முடிக்கப்பட்ட காணொளி அமர்வுகள் எதுவும் இல்லை.',
      completions: 'நிறைவுகள்',
      managementSections: 'பாடப் பொருள் மேலாண்மைப் பகுதி',
      examMgmt: '1. தேர்வுகள் மேலாண்மை',
      examDesc: 'தேர்வுப் பிரிவுகளை உருவாக்கவும், திருத்தவும், நிர்வகிக்கவும் (டிஎன்பிஎஸ்சி, UGC NET, SET)',
      manageExamsBtn: 'தேர்வுகளை நிர்வகி →',
      subjectMgmt: '2. பாடங்கள் மேலாண்மை',
      subjectDesc: 'தேர்வுகளின் கீழ் பாடங்களை உருவாக்கி காட்சி வரிசைப்படுத்தவும்',
      manageSubjectsBtn: 'பாடங்களை நிர்வகி →',
      topicMgmt: '3. தலைப்புகள் மேலாண்மை',
      topicDesc: 'பாடங்களின் கீழ் கற்றல் தலைப்புகளை உருவாக்கவும்',
      manageTopicsBtn: 'தலைப்புகளை நிர்வகி →',
      videoMgmt: '4. காணொளிப் பாடங்கள் மேலாண்மை',
      videoDesc: 'காணொளிகளைப் பதிவேற்றவும், மாற்றவும் மற்றும் வெளியிடவும்',
      manageVideosBtn: 'காணொளிகளை நிர்வகி →',
      materialMgmt: '5. பாடக் குறிப்புகள் & கையேடுகள் மேலாண்மை',
      materialDesc:
        'PDF ஆவணங்கள், கையெழுத்துக் குறிப்புகள், DOC மற்றும் PPT கோப்புகளைப் பதிவேற்றி நிர்வகிக்கவும்',
      manageMaterialsBtn: 'குறிப்புகளை நிர்வகி →',
      loadingStats: 'புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன...'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="admin-container-spacious">
      {/* Header Banner */}
      <div className="admin-header-spacious">
        <span
          className="badge badge-admin"
          style={{ padding: '6px 16px', fontSize: '0.9rem' }}
        >
          🛡️ PROTECTED ADMIN DASHBOARD
        </span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ANALYTICS SECTION */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <div className="status-badge" style={{ padding: '8px 18px', fontSize: '0.95rem' }}>
            <span className="status-dot"></span>
            {t.loadingStats}
          </div>
        </div>
      ) : (
        analytics && (
          <div style={{ marginBottom: '3.5rem' }}>
            {/* Publishing & Learning Progress Split Grid */}
            <div
              className="admin-analytics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
                gap: '1.75rem',
                marginBottom: '2.5rem'
              }}
            >
              {/* Video Publishing Card */}
              <div className="exam-card" style={{ padding: '2rem' }}>
                <h4
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    marginBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.75rem'
                  }}
                >
                  {t.publishingHeading}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '1.25rem 0'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#15803d' }}>
                      {analytics.publishedVideos}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: '#15803d',
                        marginTop: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      ✓ {t.publishedVideos}
                    </div>
                  </div>
                  <div
                    style={{ width: '1px', height: '60px', background: 'var(--border-color)' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#b91c1c' }}>
                      {analytics.unpublishedVideos}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: '#b91c1c',
                        marginTop: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      ⏳ {t.unpublishedVideos}
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Progress Card */}
              <div className="exam-card" style={{ padding: '2rem' }}>
                <h4
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    marginBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.75rem'
                  }}
                >
                  {t.learningHeading}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '1.25rem 0'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0284c7' }}>
                      {analytics.learningProgress?.totalCompletedProgress || 0}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      🏆 {t.totalCompletedSessions}
                    </div>
                  </div>
                  <div
                    style={{ width: '1px', height: '60px', background: 'var(--border-color)' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold)'
                      }}
                    >
                      {analytics.learningProgress?.overallCompletionRate || 0}%
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      📈 {t.overallCompletionRate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam-wise Content Breakdown Table */}
            <div style={{ marginBottom: '3rem' }}>
              <h4
                style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}
              >
                {t.examWiseHeading}
              </h4>
              <div
                style={{
                  overflowX: 'auto',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <table
                  className="admin-table-spacious"
                  style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
                >
                  <thead>
                    <tr>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.examCode}</th>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.examName}</th>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.subjectsCount}</th>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.videosCount}</th>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.materialsCount}</th>
                      <th style={{ padding: '1.2rem 1.1rem' }}>{t.completionsCount}</th>
                      <th style={{ padding: '1.2rem 1.1rem', textAlign: 'right' }}>
                        {t.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.examWiseStats && analytics.examWiseStats.length > 0 ? (
                      analytics.examWiseStats.map((ex) => (
                        <tr key={ex.examId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1.25rem 1.1rem' }}>
                            <span
                              className="badge"
                              style={{
                                marginBottom: 0,
                                padding: '4px 12px',
                                fontSize: '0.85rem'
                              }}
                            >
                              {ex.code}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '1.25rem 1.1rem',
                              fontWeight: 700,
                              fontSize: '1.05rem',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {getLangText(ex, 'name', currentLang)}
                          </td>
                          <td style={{ padding: '1.25rem 1.1rem' }}>
                            <span
                              className="status-badge"
                              style={{ fontSize: '0.9rem', padding: '5px 14px' }}
                            >
                              {ex.subjectCount}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.1rem' }}>
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '0.9rem',
                                padding: '5px 14px',
                                background: '#eef2ff',
                                color: '#4338ca',
                                borderColor: '#c7d2fe'
                              }}
                            >
                              {ex.videoCount}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.1rem' }}>
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '0.9rem',
                                padding: '5px 14px',
                                background: '#ecfdf5',
                                color: '#059669',
                                borderColor: '#a7f3d0'
                              }}
                            >
                              {ex.materialsCount || 0}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.1rem' }}>
                            <span
                              className="status-badge"
                              style={{
                                fontSize: '0.9rem',
                                padding: '5px 14px',
                                background: '#ecfdf5',
                                color: '#059669',
                                borderColor: '#a7f3d0'
                              }}
                            >
                              🏆 {ex.completedCount}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.1rem', textAlign: 'right' }}>
                            <span
                              className={`status-badge ${ex.isActive ? '' : 'alert-error'}`}
                              style={{ fontSize: '0.85rem', padding: '5px 12px' }}
                            >
                              <span
                                className="status-dot"
                                style={{
                                  backgroundColor: ex.isActive ? '#10b981' : '#ef4444'
                                }}
                              />
                              {ex.isActive ? t.active : t.inactive}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: '2.5rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          No exams recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Completed Videos Section */}
            <div style={{ marginBottom: '3rem' }}>
              <h4
                style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}
              >
                {t.mostCompletedHeading}
              </h4>
              {analytics.mostCompletedVideos && analytics.mostCompletedVideos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {analytics.mostCompletedVideos.map((mv, idx) => (
                    <div
                      key={mv.videoId}
                      className="exam-card"
                      style={{ padding: '1.5rem', borderColor: '#c7d2fe' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <span
                          className="badge"
                          style={{
                            marginBottom: 0,
                            padding: '4px 10px',
                            fontSize: '0.82rem'
                          }}
                        >
                          #{idx + 1} {mv.examCode}
                        </span>
                        <span
                          className="status-badge"
                          style={{
                            background: '#ecfdf5',
                            color: '#059669',
                            fontSize: '0.85rem',
                            borderColor: '#a7f3d0'
                          }}
                        >
                          🏆 {mv.completionCount} {t.completions}
                        </span>
                      </div>
                      <h5
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          margin: '0.4rem 0',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {getLangText(mv, 'title', currentLang)}
                      </h5>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {getLangText(mv, 'subjectName', currentLang)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '2rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {t.noCompletedYet}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* QUICK MANAGEMENT HUB LINKS */}
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
        {t.managementSections}
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1.75rem'
        }}
      >
        <div
          className="exam-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem'
          }}
        >
          <div>
            <span className="badge">MANAGEMENT</span>
            <h4
              style={{
                fontSize: '1.25rem',
                margin: '0.6rem 0',
                color: 'var(--text-primary)'
              }}
            >
              {t.examMgmt}
            </h4>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.examDesc}
            </p>
          </div>
          <Link
            to="/admin/exams"
            className="btn-primary admin-btn-large"
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            {t.manageExamsBtn}
          </Link>
        </div>

        <div
          className="exam-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem'
          }}
        >
          <div>
            <span className="badge">MANAGEMENT</span>
            <h4
              style={{
                fontSize: '1.25rem',
                margin: '0.6rem 0',
                color: 'var(--text-primary)'
              }}
            >
              {t.subjectMgmt}
            </h4>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.subjectDesc}
            </p>
          </div>
          <Link
            to="/admin/subjects"
            className="btn-primary admin-btn-large"
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            {t.manageSubjectsBtn}
          </Link>
        </div>

        <div
          className="exam-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem'
          }}
        >
          <div>
            <span className="badge">MANAGEMENT</span>
            <h4
              style={{
                fontSize: '1.25rem',
                margin: '0.6rem 0',
                color: 'var(--text-primary)'
              }}
            >
              {t.topicMgmt}
            </h4>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.topicDesc}
            </p>
          </div>
          <Link
            to="/admin/topics"
            className="btn-primary admin-btn-large"
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            {t.manageTopicsBtn}
          </Link>
        </div>

        <div
          className="exam-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem'
          }}
        >
          <div>
            <span className="badge">MANAGEMENT</span>
            <h4
              style={{
                fontSize: '1.25rem',
                margin: '0.6rem 0',
                color: 'var(--text-primary)'
              }}
            >
              {t.videoMgmt}
            </h4>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.videoDesc}
            </p>
          </div>
          <Link
            to="/admin/videos"
            className="btn-primary admin-btn-large"
            style={{
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            {t.manageVideosBtn}
          </Link>
        </div>

        <div
          className="exam-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem'
          }}
        >
          <div>
            <span className="badge">MANAGEMENT</span>
            <h4
              style={{
                fontSize: '1.25rem',
                margin: '0.6rem 0',
                color: 'var(--text-primary)'
              }}
            >
              {t.materialMgmt}
            </h4>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.materialDesc}
            </p>
          </div>
          <Link
            to="/admin/materials"
            className="btn-primary admin-btn-large"
            style={{
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            {t.manageMaterialsBtn}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
