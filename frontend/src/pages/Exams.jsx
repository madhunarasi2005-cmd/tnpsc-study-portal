import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getLangText } from '../utils/langHelper';

const Exams = ({ currentLang }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Exam Catalog State
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');

  const [allSubjects, setAllSubjects] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [materialResults, setMaterialResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchExamsAndFilters();
  }, []);

  useEffect(() => {
    // Perform search whenever search query or filters change
    if (searchQuery.trim() !== '' || filterExamId || filterSubjectId || filterTopicId) {
      handleSearchContent();
    } else {
      setSearchResults([]);
      setMaterialResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, filterExamId, filterSubjectId, filterTopicId]);

  const fetchExamsAndFilters = async () => {
    setLoadingExams(true);
    setExamError('');
    try {
      const [examsData, subjectsData, topicsData] = await Promise.all([
        apiRequest('/exams'),
        apiRequest('/subjects'),
        apiRequest('/topics')
      ]);
      setExams(examsData);
      setAllSubjects(subjectsData);
      setAllTopics(topicsData);
    } catch (err) {
      setExamError(err.message || 'Failed to load exam catalog');
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSearchContent = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      let query = '?';
      if (searchQuery.trim()) query += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (filterExamId) query += `examId=${filterExamId}&`;
      if (filterSubjectId) query += `subjectId=${filterSubjectId}&`;
      if (filterTopicId) query += `topicId=${filterTopicId}&`;

      const [videosData, materialsData] = await Promise.all([
        apiRequest(`/videos${query}`),
        apiRequest(`/materials${query}`)
      ]);
      setSearchResults(videosData);
      setMaterialResults(materialsData);
    } catch (err) {
      console.error('Search content error:', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterExamId('');
    setFilterSubjectId('');
    setFilterTopicId('');
    setSearchResults([]);
    setMaterialResults([]);
    setHasSearched(false);
  };

  // Content Click Handler (Redirects to Login if not logged in)
  const handleContentClick = (targetPath, externalUrl = null) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (externalUrl) {
      window.open(externalUrl, '_blank');
      return;
    }
    if (targetPath) {
      navigate(targetPath);
    }
  };

  // Filter dropdown cascades
  const filteredSubjects = filterExamId
    ? allSubjects.filter(
        (s) => s.exam && (s.exam._id === filterExamId || s.exam === filterExamId)
      )
    : allSubjects;

  const filteredTopics = filterSubjectId
    ? allTopics.filter(
        (t) => t.subject && (t.subject._id === filterSubjectId || t.subject === filterSubjectId)
      )
    : allTopics;

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

  const labels = {
    en: {
      title: 'Competitive Examinations',
      subtitle:
        'Select an exam category to explore subjects, or search lecture videos and study materials directly below',
      subjectsCount: 'Subjects Available',
      browseBtn: 'Explore Subjects →',
      noExams: 'No active exams available at the moment.',
      loading: 'Loading competitive exam catalog...',
      retry: 'Retry Loading',
      searchHeading: '🔍 Search & Discover Lecture Videos & Notes',
      searchPlaceholder: 'Search topics, titles, or concepts (English / தமிழ்)...',
      filterExam: 'Exam Category:',
      filterSubject: 'Subject:',
      filterTopic: 'Topic:',
      allExams: 'All Exams',
      allSubjects: 'All Subjects',
      allTopics: 'All Topics',
      resetBtn: 'Clear Search & Filters',
      resultsVideosHeading: 'Matching Video Lectures',
      resultsNotesHeading: 'Matching Study Materials & Notes',
      searching: 'Searching learning repository...',
      noContentFound: 'No lecture videos or study materials matched your search query or filter combination.',
      watchBtn: 'Watch Lecture ▶',
      openNotesBtn: 'Open Notes / PDF ↗',
      mins: 'mins'
    },
    ta: {
      title: 'போட்டித் தேர்வுகள்',
      subtitle:
        'பாடங்களைக் காண ஒரு தேர்வுப் பிரிவைத் தேர்ந்தெடுக்கவும், அல்லது நேரடியாகக் காணொளிகள் மற்றும் குறிப்புகளைத் தேடவும்',
      subjectsCount: 'பாடங்கள் உள்ளன',
      browseBtn: 'பாடங்களைக் காண்க →',
      noExams: 'தற்போது தேர்வுகள் எதுவும் கிடைக்கவில்லை.',
      loading: 'தேர்வுகள் பட்டியல் ஏற்றப்படுகிறது...',
      retry: 'மீண்டும் முயற்சிக்க',
      searchHeading: '🔍 காணொளிகள் மற்றும் குறிப்புகளைத் தேடுக',
      searchPlaceholder: 'தலைப்புகள், பாடங்கள் அல்லது சொற்களைத் தேடுக (தமிழ் / English)...',
      filterExam: 'தேர்வுப் பிரிவு:',
      filterSubject: 'பாடம்:',
      filterTopic: 'தலைப்பு:',
      allExams: 'அனைத்துத் தேர்வுகளும்',
      allSubjects: 'அனைத்துப் பாடங்களும்',
      allTopics: 'அனைத்துத் தலைப்புகளும்',
      resetBtn: 'வடிகட்டிகளை அழிக்க',
      resultsVideosHeading: 'பொருந்தும் காணொளிப் பாடங்கள்',
      resultsNotesHeading: 'பொருந்தும் பாடக் குறிப்புகள் & கையேடுகள்',
      searching: 'தேடப்படுகிறது...',
      noContentFound: 'உங்கள் தேடலுக்குப் பொருத்தமான காணொளிகள் அல்லது குறிப்புகள் கிடைக்கவில்லை.',
      watchBtn: 'காணொளியைக் காண்க ▶',
      openNotesBtn: 'குறிப்புகளைத் திற ↗',
      mins: 'நிமிடம்'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge">EXAM CATALOG & DISCOVERY</span>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            marginTop: '0.25rem',
            color: 'var(--text-primary)'
          }}
        >
          {t.title}
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '700px',
            margin: '0.5rem auto 0'
          }}
        >
          {t.subtitle}
        </p>
      </div>

      {/* SEARCH & FILTER CONTROLS BAR */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '1.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '3rem'
        }}
      >
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-primary)'
          }}
        >
          {t.searchHeading}
        </h3>

        {/* Search Text Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', fontSize: '1rem', padding: '0.9rem 1.25rem' }}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Cascade Filter Dropdowns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end'
          }}
        >
          <div>
            <label
              style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}
            >
              {t.filterExam}
            </label>
            <select
              className="form-control"
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={filterExamId}
              onChange={(e) => {
                setFilterExamId(e.target.value);
                setFilterSubjectId('');
                setFilterTopicId('');
              }}
            >
              <option value="">{t.allExams}</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.code} - {getLangText(e, 'name', currentLang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}
            >
              {t.filterSubject}
            </label>
            <select
              className="form-control"
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setFilterTopicId('');
              }}
            >
              <option value="">{t.allSubjects}</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {getLangText(s, 'name', currentLang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}
            >
              {t.filterTopic}
            </label>
            <select
              className="form-control"
              style={{ width: '100%', marginTop: '0.3rem' }}
              value={filterTopicId}
              onChange={(e) => setFilterTopicId(e.target.value)}
            >
              <option value="">{t.allTopics}</option>
              {filteredTopics.map((tp) => (
                <option key={tp._id} value={tp._id}>
                  {getLangText(tp, 'name', currentLang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            {(searchQuery || filterExamId || filterSubjectId || filterTopicId) && (
              <button
                onClick={handleResetFilters}
                className="btn-secondary"
                style={{
                  width: '100%',
                  height: '46px',
                  color: '#b91c1c',
                  borderColor: '#fecaca',
                  background: '#fef2f2'
                }}
              >
                {t.resetBtn}
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS SECTION */}
        {hasSearched && (
          <div
            style={{
              marginTop: '2rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem'
            }}
          >
            {searching && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <div className="status-badge">
                  <span className="status-dot"></span>
                  {t.searching}
                </div>
              </div>
            )}

            {!searching && searchResults.length === 0 && materialResults.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>{t.noContentFound}</p>
              </div>
            )}

            {/* 1. Matching Video Lectures */}
            {!searching && searchResults.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  <h4
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t.resultsVideosHeading} ({searchResults.length})
                  </h4>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {searchResults.map((vid) => (
                    <div
                      key={vid._id}
                      className="exam-card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleContentClick(`/videos/${vid._id}`)}
                    >
                      <div>
                        <div
                          style={{
                            height: '140px',
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
                                fontSize: '1.2rem',
                                fontWeight: 700
                              }}
                            >
                              ▶
                            </div>
                          )}
                          {vid.duration > 0 && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.75)',
                                color: '#fff',
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}
                            >
                              {Math.ceil(vid.duration / 60)} {t.mins}
                            </span>
                          )}
                        </div>

                        <span className="exam-tag">
                          {vid.exam?.code} • {getLangText(vid.subject, 'name', currentLang)}
                        </span>
                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            margin: '0.35rem 0',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {getLangText(vid, 'title', currentLang)}
                        </h4>
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentClick(`/videos/${vid._id}`);
                        }}
                        className="btn-primary"
                        style={{
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          padding: '0.65rem',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        {t.watchBtn}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Matching Study Materials & Notes */}
            {!searching && materialResults.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  <h4
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t.resultsNotesHeading} ({materialResults.length})
                  </h4>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {materialResults.map((mat) => (
                    <div
                      key={mat._id}
                      className="exam-card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleContentClick(null, mat.fileUrl)}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
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
                          <span className="exam-tag" style={{ margin: 0 }}>
                            {mat.exam?.code}
                          </span>
                        </div>

                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            margin: '0.35rem 0',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {getLangText(mat, 'title', currentLang)}
                        </h4>
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
                          {getLangText(mat, 'description', currentLang)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentClick(null, mat.fileUrl);
                        }}
                        className="btn-secondary"
                        style={{
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          padding: '0.65rem',
                          width: '100%',
                          color: 'var(--accent-primary)',
                          borderColor: 'var(--accent-primary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {t.openNotesBtn}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EXAM CATALOG SECTION */}
      <h2
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)'
        }}
      >
        {t.title}
      </h2>

      {loadingExams && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div className="status-badge" style={{ marginBottom: '1rem' }}>
            <span className="status-dot"></span>
            {t.loading}
          </div>
        </div>
      )}

      {examError && (
        <div
          className="alert alert-error"
          style={{ maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center' }}
        >
          <p>{examError}</p>
          <button
            onClick={fetchExamsAndFilters}
            className="btn-secondary"
            style={{ marginTop: '0.75rem' }}
          >
            {t.retry}
          </button>
        </div>
      )}

      {!loadingExams && !examError && exams.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>{t.noExams}</p>
        </div>
      )}

      {!loadingExams && !examError && exams.length > 0 && (
        <div className="card-grid" style={{ margin: '0' }}>
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="exam-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  <span className="badge" style={{ marginBottom: 0 }}>
                    {exam.code}
                  </span>
                  <span className="status-badge" style={{ fontSize: '0.8rem' }}>
                    {exam.subjectCount || 0} {t.subjectsCount}
                  </span>
                </div>

                <h3 className="exam-title">{getLangText(exam, 'name', currentLang)}</h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6
                  }}
                >
                  {getLangText(exam, 'description', currentLang)}
                </p>
              </div>

              <button
                onClick={() => handleContentClick(`/exams/${exam._id}/subjects`)}
                className="btn-primary"
                style={{
                  textAlign: 'center',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {t.browseBtn}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
