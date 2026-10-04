import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { getLangText } from '../utils/langHelper';

const Subjects = ({ currentLang }) => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [examData, subjectsData] = await Promise.all([
        apiRequest(`/exams/${examId}`),
        apiRequest(`/subjects?examId=${examId}`)
      ]);
      setExam(examData);
      setSubjects(subjectsData);
    } catch (err) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    en: {
      breadcrumbHome: 'Exams',
      titleSuffix: 'Subjects',
      topicsCount: 'Topics',
      openTopics: 'View Topics →',
      noSubjects: 'No active subjects found under this exam category.',
      loading: 'Loading subjects...',
      backToExams: '← Back to Exams'
    },
    ta: {
      breadcrumbHome: 'தேர்வுகள்',
      titleSuffix: 'பாடங்கள்',
      topicsCount: 'தலைப்புகள்',
      openTopics: 'தலைப்புகளைக் காண்க →',
      noSubjects: 'இந்தத் தேர்வின் கீழ் பாடங்கள் எதுவும் இல்லை.',
      loading: 'பாடங்கள் ஏற்றப்படுகின்றன...',
      backToExams: '← தேர்வுகள் பக்கத்திற்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
          <Link to="/exams" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{t.breadcrumbHome}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{exam ? getLangText(exam, 'name', currentLang) : 'Exam'}</span>
        </div>

        {exam && (
          <div>
            <span className="badge">{exam.code}</span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {getLangText(exam, 'name', currentLang)} - {t.titleSuffix}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.35rem' }}>{getLangText(exam, 'description', currentLang)}</p>
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
        <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center' }}>
          <p>{error}</p>
          <Link to="/exams" className="btn-secondary" style={{ display: 'inline-block', marginTop: '0.75rem', textDecoration: 'none' }}>
            {t.backToExams}
          </Link>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t.noSubjects}</p>
          <Link to="/exams" className="btn-secondary" style={{ textDecoration: 'none' }}>{t.backToExams}</Link>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="card-grid" style={{ margin: '0' }}>
          {subjects.map((subject) => (
            <div key={subject._id} className="exam-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="exam-tag">SUBJECT #{subject.order || 1}</span>
                  <span className="status-badge" style={{ fontSize: '0.8rem' }}>
                    {subject.topicCount || 0} {t.topicsCount}
                  </span>
                </div>
                <h2 className="exam-title">{getLangText(subject, 'name', currentLang)}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {getLangText(subject, 'description', currentLang)}
                </p>
              </div>

              <Link
                to={`/subjects/${subject._id}/topics`}
                className="btn-primary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.95rem', padding: '0.75rem' }}
              >
                {t.openTopics}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subjects;
