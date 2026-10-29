import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { getLangText } from '../utils/langHelper';

const Topics = ({ currentLang }) => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [videosMap, setVideosMap] = useState({});
  const [materialsMap, setMaterialsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectData, topicsData, videosData, materialsData] = await Promise.all([
        apiRequest(`/subjects/${subjectId}`),
        apiRequest(`/topics?subjectId=${subjectId}`),
        apiRequest(`/videos?subjectId=${subjectId}`),
        apiRequest(`/materials?subjectId=${subjectId}`)
      ]);
      setSubject(subjectData);
      setTopics(topicsData);

      // Group published videos by topicId
      const vMap = {};
      videosData.forEach((v) => {
        const tId = v.topic?._id || v.topic;
        if (!vMap[tId]) vMap[tId] = [];
        vMap[tId].push(v);
      });
      setVideosMap(vMap);

      // Group published study materials by topicId
      const mMap = {};
      materialsData.forEach((m) => {
        const tId = m.topic?._id || m.topic;
        if (!mMap[tId]) mMap[tId] = [];
        mMap[tId].push(m);
      });
      setMaterialsMap(mMap);
    } catch (err) {
      setError(err.message || 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'handwritten_notes':
        return '✍️';
      case 'pdf':
        return '📄';
      case 'doc':
        return '📝';
      case 'ppt':
        return '📊';
      default:
        return '📑';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const labels = {
    en: {
      breadcrumbExams: 'Exams',
      breadcrumbSubjects: 'Subjects',
      topicsTitle: 'Learning Topics, Lectures & Materials',
      topicOrder: 'Topic',
      noTopics: 'No active topics found under this subject.',
      loading: 'Loading topics, videos & study materials...',
      videosHeading: '🎥 Video Lectures',
      materialsHeading: '📚 Study Materials & Notes',
      watchVideoBtn: 'Watch Lecture ▶',
      openMaterialBtn: 'Open Notes / PDF ↗',
      noVideosInTopic: 'Video lecture coming soon for this topic.',
      noMaterialsInTopic: 'No study materials uploaded yet for this topic.',
      backToSubjects: '← Back to Subjects'
    },
    ta: {
      breadcrumbExams: 'தேர்வுகள்',
      breadcrumbSubjects: 'பாடங்கள்',
      topicsTitle: 'கற்றல் தலைப்புகள், காணொளிகள் & கையேடுகள்',
      topicOrder: 'தலைப்பு',
      noTopics: 'இந்த பாடத்தின் கீழ் தலைப்புகள் எதுவும் இல்லை.',
      loading: 'தலைப்புகள் மற்றும் பாடப் பொருள்கள் ஏற்றப்படுகின்றன...',
      videosHeading: '🎥 காணொளிப் பாடங்கள்',
      materialsHeading: '📚 பாடக் குறிப்புகள் & கையேடுகள்',
      watchVideoBtn: 'காணொளி காண்க ▶',
      openMaterialBtn: 'குறிப்புகளைத் திற ↗',
      noVideosInTopic: 'இந்தத் தலைப்பிற்கான காணொளி விரைவில் பதிவேற்றப்படும்.',
      noMaterialsInTopic: 'இந்த தலைப்பிற்கான குறிப்புகள் எதுவும் பதிவேற்றப்படவில்லை.',
      backToSubjects: '← பாடங்கள் பக்கத்திற்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            fontWeight: 600
          }}
        >
          <Link to="/exams" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            {t.breadcrumbExams}
          </Link>
          <span>/</span>
          {subject?.exam && (
            <>
              <Link
                to={`/exams/${subject.exam._id}/subjects`}
                style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                {getLangText(subject.exam, 'name', currentLang)}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--text-primary)' }}>
            {subject ? getLangText(subject, 'name', currentLang) : 'Subject'}
          </span>
        </div>

        {subject && (
          <div>
            <span className="badge">SUBJECT MODULE</span>
            <h1
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '0.25rem',
                color: 'var(--text-primary)'
              }}
            >
              {getLangText(subject, 'name', currentLang)} - {t.topicsTitle}
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                marginTop: '0.35rem'
              }}
            >
              {getLangText(subject, 'description', currentLang)}
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div className="status-badge" style={{ marginBottom: '1rem' }}>
            <span className="status-dot"></span>
            {t.loading}
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          style={{ maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center' }}
        >
          <p>{error}</p>
          {subject?.exam?._id && (
            <Link
              to={`/exams/${subject.exam._id}/subjects`}
              className="btn-secondary"
              style={{ display: 'inline-block', marginTop: '0.75rem', textDecoration: 'none' }}
            >
              {t.backToSubjects}
            </Link>
          )}
        </div>
      )}

      {!loading && !error && topics.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t.noTopics}</p>
          {subject?.exam?._id && (
            <Link
              to={`/exams/${subject.exam._id}/subjects`}
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              {t.backToSubjects}
            </Link>
          )}
        </div>
      )}

      {!loading && !error && topics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {topics.map((topic, index) => {
            const topicVideos = videosMap[topic._id] || [];
            const topicMaterials = materialsMap[topic._id] || [];

            return (
              <div key={topic._id} className="exam-card" style={{ padding: '2.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.4rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    className="badge"
                    style={{ marginBottom: 0, padding: '3px 10px', fontSize: '0.78rem' }}
                  >
                    {t.topicOrder} #{topic.order || index + 1}
                  </span>
                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {getLangText(topic, 'name', currentLang)}
                  </h3>
                </div>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    marginBottom: '1.75rem',
                    lineHeight: 1.6
                  }}
                >
                  {getLangText(topic, 'description', currentLang)}
                </p>

                {/* 1. Video Lectures Section */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <h4
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      marginBottom: '1rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {t.videosHeading} ({topicVideos.length})
                  </h4>

                  {topicVideos.length === 0 ? (
                    <div
                      style={{
                        padding: '0.9rem 1.2rem',
                        background: '#f8fafc',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      ℹ️ {t.noVideosInTopic}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                        gap: '1.25rem'
                      }}
                    >
                      {topicVideos.map((vid) => (
                        <div
                          key={vid._id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div
                              style={{
                                height: '130px',
                                background: '#0f172a',
                                borderRadius: 'var(--radius-sm)',
                                overflow: 'hidden',
                                marginBottom: '0.85rem',
                                position: 'relative',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                              }}
                            >
                              {vid.thumbnailUrl ? (
                                <img
                                  src={vid.thumbnailUrl}
                                  alt={vid.title}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '1.1rem',
                                    fontWeight: 700
                                  }}
                                >
                                  ▶ LECTURE
                                </div>
                              )}
                            </div>
                            <h5
                              style={{
                                fontSize: '1.02rem',
                                fontWeight: 800,
                                marginBottom: '0.3rem',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {getLangText(vid, 'title', currentLang)}
                            </h5>
                            <p
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {getLangText(vid, 'description', currentLang)}
                            </p>
                          </div>

                          <Link
                            to={`/videos/${vid._id}`}
                            className="btn-primary"
                            style={{
                              textAlign: 'center',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              padding: '0.65rem'
                            }}
                          >
                            {t.watchVideoBtn}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Study Materials & Notes Section */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1.5rem'
                  }}
                >
                  <h4
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      marginBottom: '1rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {t.materialsHeading} ({topicMaterials.length})
                  </h4>

                  {topicMaterials.length === 0 ? (
                    <div
                      style={{
                        padding: '0.9rem 1.2rem',
                        background: '#f8fafc',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      ℹ️ {t.noMaterialsInTopic}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                        gap: '1rem'
                      }}
                    >
                      {topicMaterials.map((mat) => (
                        <div
                          key={mat._id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1.15rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0.4rem'
                              }}
                            >
                              <span
                                className="badge"
                                style={{
                                  marginBottom: 0,
                                  padding: '2px 8px',
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {getMaterialIcon(mat.materialType)}{' '}
                                {mat.materialType.replace('_', ' ')}
                              </span>
                              {mat.fileSize > 0 && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 600
                                  }}
                                >
                                  {formatFileSize(mat.fileSize)}
                                </span>
                              )}
                            </div>

                            <h5
                              style={{
                                fontSize: '1rem',
                                fontWeight: 800,
                                margin: '0.35rem 0',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {getLangText(mat, 'title', currentLang)}
                            </h5>
                            {mat.description && (
                              <p
                                style={{
                                  fontSize: '0.84rem',
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.5
                                }}
                              >
                                {getLangText(mat, 'description', currentLang)}
                              </p>
                            )}
                          </div>

                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{
                              textAlign: 'center',
                              textDecoration: 'none',
                              fontSize: '0.88rem',
                              padding: '0.55rem',
                              display: 'block',
                              color: 'var(--accent-primary)',
                              borderColor: 'var(--accent-primary)',
                              fontWeight: 700
                            }}
                          >
                            {t.openMaterialBtn}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Topics;
