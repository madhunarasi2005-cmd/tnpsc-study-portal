import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getLangText } from '../utils/langHelper';

const VideoPlayer = ({ currentLang }) => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState({ watchedSeconds: 0, completed: false });
  const [hasResumed, setHasResumed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideoAndProgress();
  }, [videoId]);

  // Sync progress every 5 seconds while playing
  useEffect(() => {
    let interval;
    if (videoRef.current && user && user.role === 'student') {
      interval = setInterval(() => {
        saveProgress();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
      saveProgress();
    };
  }, [videoId, user]);

  const fetchVideoAndProgress = async () => {
    setLoading(true);
    setError('');
    setHasResumed(false);

    try {
      const videoData = await apiRequest(`/videos/${videoId}`);
      setVideo(videoData);

      // Fetch progress if authenticated student
      if (user && user.role === 'student') {
        try {
          const progData = await apiRequest(`/progress/video/${videoId}`);
          setProgress(progData);
        } catch (pErr) {
          console.log('No existing progress record:', pErr.message);
        }
      }

      // Fetch related published videos in the same topic for playlist
      const topicId = videoData?.topic?._id || videoData?.topic;
      if (topicId) {
        const [topicVideos, topicMaterials] = await Promise.all([
          apiRequest(`/videos?topicId=${topicId}`),
          apiRequest(`/materials?topicId=${topicId}`)
        ]);
        setPlaylist(topicVideos.filter((v) => v._id !== videoData._id));
        setMaterials(topicMaterials);
      }
    } catch (err) {
      if (err.status === 404) {
        setError(
          currentLang === 'ta'
            ? 'காணொளி பெறப்படவில்லை அல்லது வெளியிடப்படவில்லை'
            : 'Video not found or is currently unpublished.'
        );
      } else {
        setError(err.message || 'Failed to load video player');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && progress.watchedSeconds > 0 && !hasResumed && !progress.completed) {
      videoRef.current.currentTime = progress.watchedSeconds;
      setHasResumed(true);
    }
  };

  const saveProgress = async () => {
    if (!videoRef.current || !user || user.role !== 'student') return;

    const currentTime = Math.floor(videoRef.current.currentTime || 0);
    const duration = Math.floor(videoRef.current.duration || video?.duration || 0);

    if (currentTime <= 0) return;

    try {
      const res = await apiRequest(`/progress/video/${videoId}`, {
        method: 'POST',
        body: JSON.stringify({ watchedSeconds: currentTime, duration })
      });
      setProgress(res);
    } catch (err) {
      console.error('Failed to sync watch progress:', err.message);
    }
  };

  const handleManualComplete = async () => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await apiRequest(`/progress/video/${videoId}/complete`, { method: 'POST' });
      setProgress(res);
    } catch (err) {
      console.error('Failed to mark complete:', err.message);
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
      nextVideos: 'More Lectures in this Topic',
      noNextVideos: 'No additional videos currently in this topic.',
      completedStatus: '✓ COMPLETED',
      inProgressStatus: '⏳ IN PROGRESS',
      markCompleteBtn: 'Mark as Completed',
      resumedNotice: 'Resumed playback from saved position',
      backToTopics: '← Back to Catalog',
      studyMaterialsTitle: '📚 Topic Study Materials & Notes',
      noMaterials: 'No study materials uploaded yet for this lecture topic.',
      viewMaterialBtn: 'Open Material ↗'
    },
    ta: {
      breadcrumbExams: 'தேர்வுகள்',
      nextVideos: 'இந்த தலைப்பின் பிற காணொளிகள்',
      noNextVideos: 'இந்த தலைப்பில் கூடுதல் காணொளிகள் எதுவும் இல்லை.',
      completedStatus: '✓ நிறைவுற்றது',
      inProgressStatus: '⏳ தொடர்கிறது',
      markCompleteBtn: 'முடித்ததாகக் குறிக்க',
      resumedNotice: 'சேமிக்கப்பட்ட இடத்திலிருந்து மீண்டும் தொடங்குகிறது',
      backToTopics: '← பாடங்கள் பட்டியலுக்குச் செல்க',
      studyMaterialsTitle: '📚 பாடக் குறிப்புகள் & கையேடுகள்',
      noMaterials: 'இந்த தலைப்பிற்கான குறிப்புகள் எதுவும் பதிவேற்றப்படவில்லை.',
      viewMaterialBtn: 'திறந்து பார்க்க ↗'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.92rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          fontWeight: 600
        }}
      >
        <Link to="/exams" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          {t.breadcrumbExams}
        </Link>
        <span>/</span>
        {video?.exam && (
          <>
            <Link
              to={`/exams/${video.exam._id}/subjects`}
              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
            >
              {video.exam.code}
            </Link>
            <span>/</span>
          </>
        )}
        {video?.subject && (
          <>
            <Link
              to={`/subjects/${video.subject._id}/topics`}
              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
            >
              {getLangText(video.subject, 'name', currentLang)}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--text-primary)' }}>
          {video ? getLangText(video, 'title', currentLang) : 'Video Player'}
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <div className="status-badge" style={{ marginBottom: '1rem' }}>
            <span className="status-dot"></span>
            Loading video stream...
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          style={{ maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center' }}
        >
          <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{error}</p>
          <Link
            to="/exams"
            className="btn-secondary"
            style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}
          >
            {t.backToTopics}
          </Link>
        </div>
      )}

      {!loading && !error && video && (
        <div className="video-player-grid">
          {/* Main Video Player Container */}
          <div>
            {/* Protected Video Frame: Context menu and downloading disabled */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              style={{
                background: '#000000',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                position: 'relative',
                userSelect: 'none'
              }}
            >
              <video
                ref={videoRef}
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                poster={video.thumbnailUrl || ''}
                onLoadedMetadata={handleLoadedMetadata}
                onPause={saveProgress}
                onEnded={saveProgress}
                style={{ width: '100%', maxHeight: '540px', display: 'block', outline: 'none' }}
                src={video.videoUrl}
              >
                Your browser does not support HTML5 video.
              </video>
            </div>

            {hasResumed && (
              <div
                style={{
                  marginTop: '0.6rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent-gold)',
                  fontWeight: 700
                }}
              >
                ℹ️ {t.resumedNotice} ({Math.floor(progress.watchedSeconds)}s)
              </div>
            )}

            {/* Video Details & Learning Status */}
            <div
              style={{
                marginTop: '1.5rem',
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span className="badge" style={{ marginBottom: 0 }}>
                  {video.exam?.code || 'EXAM'} • {getLangText(video.subject, 'name', currentLang)}
                </span>

                {/* Progress Completion Status */}
                {user && user.role === 'student' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {progress.completed ? (
                      <span
                        className="status-badge"
                        style={{
                          background: '#ecfdf5',
                          borderColor: '#a7f3d0',
                          color: '#059669'
                        }}
                      >
                        {t.completedStatus}
                      </span>
                    ) : (
                      <>
                        <span
                          className="status-badge"
                          style={{
                            background: '#fef3c7',
                            borderColor: '#fde68a',
                            color: '#b45309'
                          }}
                        >
                          {t.inProgressStatus}
                        </span>
                        <button
                          onClick={handleManualComplete}
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                        >
                          {t.markCompleteBtn}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  marginBottom: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              >
                {getLangText(video, 'title', currentLang)}
              </h1>

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.7
                }}
              >
                {getLangText(video, 'description', currentLang) ||
                  'No detailed description provided for this video lecture.'}
              </p>
            </div>

            {/* Study Materials & Notes Section for this Topic */}
            <div
              style={{
                marginTop: '1.5rem',
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '1.25rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {t.studyMaterialsTitle}
              </h3>

              {materials.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.92rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}
                >
                  ℹ️ {t.noMaterials}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
                    gap: '1rem'
                  }}
                >
                  {materials.map((mat) => (
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

                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            margin: '0.35rem 0',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {getLangText(mat, 'title', currentLang)}
                        </h4>
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
                        {t.viewMaterialBtn}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Playlist Column */}
          <div>
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.6rem',
                  color: 'var(--text-primary)'
                }}
              >
                {t.nextVideos}
              </h3>

              {playlist.length === 0 ? (
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    padding: '1.25rem 0',
                    textAlign: 'center'
                  }}
                >
                  {t.noNextVideos}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {playlist.map((item) => (
                    <Link
                      key={item._id}
                      to={`/videos/${item._id}`}
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div
                        style={{
                          width: '80px',
                          height: '52px',
                          background: '#0f172a',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative'
                        }}
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                              fontSize: '0.8rem'
                            }}
                          >
                            ▶
                          </div>
                        )}
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getLangText(item, 'title', currentLang)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.2rem'
                          }}
                        >
                          {item.duration > 0
                            ? `${Math.ceil(item.duration / 60)} mins`
                            : 'Video Lecture'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
