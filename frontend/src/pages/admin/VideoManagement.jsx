import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { getLangText } from '../../utils/langHelper';

const VideoManagement = ({ currentLang }) => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [videos, setVideos] = useState([]);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    examId: '',
    subjectId: '',
    topicId: '',
    title: '',
    titleTa: '',
    description: '',
    descriptionTa: '',
    isPublished: true
  });
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Details Modal State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    titleTa: '',
    description: '',
    descriptionTa: '',
    examId: '',
    subjectId: '',
    topicId: '',
    isPublished: true
  });

  // Replace Video Modal State
  const [replacingVideo, setReplacingVideo] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [selectedExamId, selectedSubjectId, selectedTopicId]);

  const fetchInitialData = async () => {
    try {
      const [examsData, subjectsData, topicsData] = await Promise.all([
        apiRequest('/exams?all=true'),
        apiRequest('/subjects?all=true'),
        apiRequest('/topics?all=true')
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
      setTopics(topicsData);
    } catch (err) {
      setError(err.message || 'Failed to load initial hierarchy data');
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    setError('');
    try {
      let queryParams = '?all=true';
      if (selectedTopicId) queryParams += `&topicId=${selectedTopicId}`;
      else if (selectedSubjectId) queryParams += `&subjectId=${selectedSubjectId}`;
      else if (selectedExamId) queryParams += `&examId=${selectedExamId}`;

      const data = await apiRequest(`/videos${queryParams}`);
      setVideos(data);
    } catch (err) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Upload Form Handlers
  const handleOpenUploadModal = () => {
    setError('');
    setSuccess('');
    setVideoFile(null);
    setUploadFormData({
      examId: selectedExamId || (exams.length > 0 ? exams[0]._id : ''),
      subjectId: selectedSubjectId || '',
      topicId: selectedTopicId || '',
      title: '',
      titleTa: '',
      description: '',
      descriptionTa: '',
      isPublished: true
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file (.mp4, .mkv, .webm, .mov, .avi)');
      return;
    }

    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', uploadFormData.title);
      formData.append('titleTa', uploadFormData.titleTa);
      formData.append('description', uploadFormData.description);
      formData.append('descriptionTa', uploadFormData.descriptionTa);
      formData.append('examId', uploadFormData.examId);
      formData.append('subjectId', uploadFormData.subjectId);
      formData.append('topicId', uploadFormData.topicId);
      formData.append('isPublished', uploadFormData.isPublished);

      await apiRequest('/videos/upload', {
        method: 'POST',
        body: formData
      });

      setSuccess(currentLang === 'ta' ? 'காணொளி Cloudinary-ல் வெற்றி கரமாகப் பதிவேற்றப்பட்டது!' : 'Video successfully uploaded to Cloudinary & saved!');
      setShowUploadModal(false);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit Details Handlers
  const handleOpenEditModal = (video) => {
    setError('');
    setSuccess('');
    setEditingVideo(video);
    setEditFormData({
      title: video.title || '',
      titleTa: video.titleTa || '',
      description: video.description || '',
      descriptionTa: video.descriptionTa || '',
      examId: video.exam?._id || '',
      subjectId: video.subject?._id || '',
      topicId: video.topic?._id || '',
      isPublished: video.isPublished !== undefined ? video.isPublished : true
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiRequest(`/videos/${editingVideo._id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setSuccess(currentLang === 'ta' ? 'காணொளி விவரங்கள் புதுப்பிக்கப்பட்டன' : 'Video details updated successfully');
      setEditingVideo(null);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Failed to update video details');
    }
  };

  // Replace Video Handlers
  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceFile) {
      setError('Please select a new video file to replace');
      return;
    }

    setError('');
    setSuccess('');
    setIsReplacing(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', replaceFile);

      await apiRequest(`/videos/${replacingVideo._id}/replace`, {
        method: 'PUT',
        body: formData
      });

      setSuccess(currentLang === 'ta' ? 'புதிய காணொளி Cloudinary-ல் புதுப்பிக்கப்பட்டது!' : 'Video file replaced & old Cloudinary asset purged safely!');
      setReplacingVideo(null);
      setReplaceFile(null);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Video replacement failed');
    } finally {
      setIsReplacing(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (video) => {
    try {
      await apiRequest(`/videos/${video._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !video.isPublished })
      });
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Failed to update publish status');
    }
  };

  // Delete Video Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/videos/${deleteTarget._id}`, { method: 'DELETE' });
      setSuccess(currentLang === 'ta' ? 'காணொளி Cloudinary மற்றும் MongoDB-லிருந்து நீக்கப்பட்டது' : 'Video deleted from Cloudinary & database');
      setDeleteTarget(null);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
      setDeleteTarget(null);
    }
  };

  // Filter cascades
  const filteredSubjects = selectedExamId
    ? subjects.filter(s => s.exam && (s.exam._id === selectedExamId || s.exam === selectedExamId))
    : subjects;

  const filteredTopics = selectedSubjectId
    ? topics.filter(t => t.subject && (t.subject._id === selectedSubjectId || t.subject === selectedSubjectId))
    : topics;

  // Filter helper for modal dropdowns
  const modalFilteredSubjects = uploadFormData.examId
    ? subjects.filter(s => s.exam && (s.exam._id === uploadFormData.examId || s.exam === uploadFormData.examId))
    : subjects;

  const modalFilteredTopics = uploadFormData.subjectId
    ? topics.filter(t => t.subject && (t.subject._id === uploadFormData.subjectId || t.subject === uploadFormData.subjectId))
    : topics;

  const labels = {
    en: {
      title: 'Cloudinary Video Management',
      subtitle: 'Upload, manage, replace, and publish lecture videos directly to Cloudinary',
      uploadBtn: '☁️ Upload New Video Lecture',
      filterExam: 'Filter by Exam:',
      filterSubject: 'Filter by Subject:',
      filterTopic: 'Filter by Topic:',
      allExams: 'All Exams',
      allSubjects: 'All Subjects',
      allTopics: 'All Topics',
      videoTitle: 'Video Title & Cloudinary ID',
      hierarchy: 'Hierarchy (Exam → Sub → Topic)',
      status: 'Publish Status',
      actions: 'Management Actions',
      published: 'Published & Live',
      draft: 'Draft / Hidden',
      edit: 'Edit Details',
      replace: 'Replace Video File',
      delete: 'Delete',
      uploadModalTitle: 'Upload New Video Lecture to Cloudinary',
      editModalTitle: 'Edit Video Metadata Details',
      replaceModalTitle: 'Safe Cloudinary Video Replacement',
      selectFile: 'Select Lecture Video File (.mp4, .mkv, .webm, .mov - Max 100MB):',
      selectFileHint: 'Click to choose or drag and drop video file from your computer',
      replaceWarning: 'Safe Replacement: New video will be uploaded to Cloudinary and verified before old asset is destroyed.',
      titleEn: 'Video Title (English)',
      titleTa: 'Video Title (Tamil - Optional)',
      descEn: 'Detailed Description (English)',
      descTa: 'Detailed Description (Tamil - Optional)',
      isPublishedLabel: 'Publish Video Immediately (Visible to Students)',
      uploading: 'Uploading buffer to Cloudinary... Please wait',
      replacing: 'Uploading replacement video...',
      saveBtn: 'Save Changes',
      cancelBtn: 'Cancel',
      deleteConfirmTitle: 'Confirm Permanent Deletion',
      deleteConfirmText: 'Warning: This will permanently delete the video asset from Cloudinary storage and remove its record from MongoDB!',
      confirmDeleteBtn: 'Yes, Purge Video',
      backToDashboard: '← Back to Admin Dashboard'
    },
    ta: {
      title: 'Cloudinary காணொளி மேலாண்மை',
      subtitle: 'காணொளிப் பாடங்களைப் பதிவேற்றவும், திருத்தவும், மாற்றவும் மற்றும் வெளியிடவும்',
      uploadBtn: '☁️ புதிய காணொளி பதிவேற்று',
      filterExam: 'தேர்வு வடிகட்டி:',
      filterSubject: 'பாடம் வடிகட்டி:',
      filterTopic: 'தலைப்பு வடிகட்டி:',
      allExams: 'அனைத்துத் தேர்வுகளும்',
      allSubjects: 'அனைத்துப் பாடங்களும்',
      allTopics: 'அனைத்துத் தலைப்புகளும்',
      videoTitle: 'காணொளித் தலைப்பு & ID',
      hierarchy: 'படிநிலை (தேர்வு → பாடம் → தலைப்பு)',
      status: 'வெளியீட்டு நிலை',
      actions: 'செயல்கள்',
      published: 'வெளியிடப்பட்டது (Live)',
      draft: 'வரைவு / ரகசியம் (Draft)',
      edit: 'விவரங்களை திருத்து',
      replace: 'காணொளியை மாற்று',
      delete: 'நீக்கு',
      uploadModalTitle: 'Cloudinary-ல் புதிய காணொளி பதிவேற்றவும்',
      editModalTitle: 'காணொளி விவரங்களை திருத்து',
      replaceModalTitle: 'பாதுகாப்பான காணொளி மாற்றுதல்',
      selectFile: 'காணொளிக் கோப்பைத் தேர்ந்தெடுக்கவும் (.mp4, .mkv, .webm - அதிகபட்சம் 100MB):',
      selectFileHint: 'கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்',
      replaceWarning: 'பாதுகாப்பான மாற்றுதல்: புதிய காணொளி பதிவேற்றப்பட்ட பின்பே பழைய காணொளி அழிக்கப்படும்.',
      titleEn: 'காணொளித் தலைப்பு (ஆங்கிலம்)',
      titleTa: 'காணொளித் தலைப்பு (தமிழ்)',
      descEn: 'விளக்கம் (ஆங்கிலம்)',
      descTa: 'விளக்கம் (தமிழ்)',
      isPublishedLabel: 'உடனடியாக வெளியிடுக (மாணவர்களுக்குத் தெரியும்)',
      uploading: 'Cloudinary-ல் பதிவேற்றப்படுகிறது... காத்திருக்கவும்',
      replacing: 'மாற்று காணொளி பதிவேற்றப்படுகிறது...',
      saveBtn: 'சேமிக்க',
      cancelBtn: 'ரத்து செய்',
      deleteConfirmTitle: 'காணொளி நீக்கத்தை உறுதிசெய்க',
      deleteConfirmText: 'எச்சரிக்கை: இது Cloudinary மற்றும் MongoDB இரண்டிலிருந்தும் காணொளியை நிரந்தரமாக நீக்கும்!',
      confirmDeleteBtn: 'ஆம், நீக்கு',
      backToDashboard: '← நிர்வாக மையத்திற்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="admin-container-spacious">
      {/* Top Bar with Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <Link to="/admin/dashboard" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>
            {t.backToDashboard}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-admin">ADMIN VIDEO CONTROL</span>
            <span className="status-badge" style={{ fontSize: '0.85rem' }}>{videos.length} Videos</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>{t.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>{t.subtitle}</p>
        </div>
        <button
          onClick={handleOpenUploadModal}
          className="btn-primary admin-btn-large"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {t.uploadBtn}
        </button>
      </div>

      {/* Filter Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem', background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.filterExam}</label>
          <select className="form-control admin-form-control-large" style={{ width: '100%', marginTop: '0.4rem' }} value={selectedExamId} onChange={(e) => { setSelectedExamId(e.target.value); setSelectedSubjectId(''); setSelectedTopicId(''); }}>
            <option value="">{t.allExams}</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.code} - {getLangText(e, 'name', currentLang)}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.filterSubject}</label>
          <select className="form-control admin-form-control-large" style={{ width: '100%', marginTop: '0.4rem' }} value={selectedSubjectId} onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedTopicId(''); }}>
            <option value="">{t.allSubjects}</option>
            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{getLangText(s, 'name', currentLang)}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.filterTopic}</label>
          <select className="form-control admin-form-control-large" style={{ width: '100%', marginTop: '0.4rem' }} value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)}>
            <option value="">{t.allTopics}</option>
            {filteredTopics.map(tp => <option key={tp._id} value={tp._id}>{getLangText(tp, 'name', currentLang)}</option>)}
          </select>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{error}</div>}

      {/* Videos List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          <div className="status-badge" style={{ padding: '8px 18px', fontSize: '0.95rem' }}>
            <span className="status-dot"></span>
            Loading video lectures from database...
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <table className="admin-table-spacious" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.2rem 1rem', width: '140px' }}>Video Preview</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.videoTitle}</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.hierarchy}</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.status}</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    No video lectures uploaded yet under this selection. Click <strong>"{t.uploadBtn}"</strong> to upload your first lecture.
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ width: '120px', height: '68px', background: '#0f172a', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {vid.thumbnailUrl ? (
                          <img src={vid.thumbnailUrl} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.88rem', fontWeight: 700 }}>▶ VIDEO</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{getLangText(vid, 'title', currentLang)}</div>
                      {vid.titleTa && currentLang !== 'ta' && (
                        <div style={{ fontSize: '0.92rem', color: 'var(--accent-primary)', marginTop: '0.2rem', fontWeight: 600 }}>{vid.titleTa}</div>
                      )}
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        Cloudinary ID: <code style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>{vid.cloudinaryPublicId}</code> {vid.duration > 0 && `• ⏱️ ${Math.ceil(vid.duration / 60)} mins`}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.92rem' }}>
                        <span className="badge" style={{ marginBottom: 0, padding: '3px 10px', fontSize: '0.78rem' }}>{vid.exam?.code || 'EXAM'}</span>
                        <div style={{ marginTop: '0.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{getLangText(vid.subject, 'name', currentLang)}</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>→ {getLangText(vid.topic, 'name', currentLang)}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <button
                        onClick={() => handleTogglePublish(vid)}
                        className={`status-badge ${vid.isPublished ? '' : 'alert-error'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: '0.88rem' }}
                        title="Click to toggle publish status"
                      >
                        <span className="status-dot" style={{ backgroundColor: vid.isPublished ? '#10b981' : '#ef4444' }}></span>
                        {vid.isPublished ? t.published : t.draft}
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button onClick={() => handleOpenEditModal(vid)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                          ✏️ {t.edit}
                        </button>
                        <button onClick={() => { setReplacingVideo(vid); setReplaceFile(null); }} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem', borderColor: '#fde68a', color: 'var(--accent-gold)' }}>
                          🔄 {t.replace}
                        </button>
                        <button onClick={() => setDeleteTarget(vid)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem', borderColor: '#fecaca', color: '#b91c1c' }}>
                          🗑️ {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Video Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card admin-modal-large" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.uploadModalTitle}</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="auth-form" style={{ gap: '1.5rem' }}>
              {/* Hierarchy Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>1. Exam Category</label>
                  <select className="form-control admin-form-control-large" value={uploadFormData.examId} onChange={(e) => setUploadFormData({ ...uploadFormData, examId: e.target.value, subjectId: '', topicId: '' })} required>
                    <option value="" disabled>Select Exam</option>
                    {exams.map(e => <option key={e._id} value={e._id}>{e.code} - {e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>2. Subject</label>
                  <select className="form-control admin-form-control-large" value={uploadFormData.subjectId} onChange={(e) => setUploadFormData({ ...uploadFormData, subjectId: e.target.value, topicId: '' })} required>
                    <option value="" disabled>Select Subject</option>
                    {modalFilteredSubjects.map(s => <option key={s._id} value={s._id}>{getLangText(s, 'name', currentLang)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>3. Topic</label>
                  <select className="form-control admin-form-control-large" value={uploadFormData.topicId} onChange={(e) => setUploadFormData({ ...uploadFormData, topicId: e.target.value })} required>
                    <option value="" disabled>Select Topic</option>
                    {modalFilteredTopics.map(tp => <option key={tp._id} value={tp._id}>{getLangText(tp, 'name', currentLang)}</option>)}
                  </select>
                </div>
              </div>

              {/* Spacious File Selector Dropzone */}
              <div className="admin-upload-zone-large">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                <label style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>
                  {t.selectFile}
                </label>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {t.selectFileHint}
                </p>
                <input
                  type="file"
                  accept="video/mp4,video/x-matroska,video/webm,video/quicktime,video/x-msvideo"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  required
                  style={{ color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer' }}
                />
                {videoFile && (
                  <div style={{ marginTop: '0.75rem', color: '#15803d', fontWeight: 700, fontSize: '0.95rem' }}>
                    ✓ Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.titleEn}</label>
                  <input type="text" className="form-control admin-form-control-large" value={uploadFormData.title} onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })} required placeholder="e.g. Ancient Indian History - Indus Civilization" />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.titleTa}</label>
                  <input type="text" className="form-control admin-form-control-large" value={uploadFormData.titleTa} onChange={(e) => setUploadFormData({ ...uploadFormData, titleTa: e.target.value })} placeholder="பண்டைய இந்திய வரலாறு - சிந்து சமவெளி" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.descEn}</label>
                  <textarea className="form-control admin-form-control-large" rows="3" value={uploadFormData.description} onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })} placeholder="Enter detailed lecture overview and concepts covered..." />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.descTa}</label>
                  <textarea className="form-control admin-form-control-large" rows="3" value={uploadFormData.descriptionTa} onChange={(e) => setUploadFormData({ ...uploadFormData, descriptionTa: e.target.value })} placeholder="பாட விளக்கம் மற்றும் முக்கியக் குறிப்புகள்..." />
                </div>
              </div>

              <label className="checkbox-card" style={{ padding: '1rem 1.25rem' }}>
                <input type="checkbox" checked={uploadFormData.isPublished} onChange={(e) => setUploadFormData({ ...uploadFormData, isPublished: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{t.isPublishedLabel}</span>
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary admin-btn-large" style={{ flex: 1 }} disabled={isUploading}>
                  {isUploading ? t.uploading : '☁️ Stream Video Buffer to Cloudinary'}
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary admin-btn-large" disabled={isUploading}>{t.cancelBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card admin-modal-large" style={{ maxWidth: '680px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.editModalTitle}</h3>

            <form onSubmit={handleEditSubmit} className="auth-form" style={{ gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.titleEn}</label>
                <input type="text" className="form-control admin-form-control-large" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.titleTa}</label>
                <input type="text" className="form-control admin-form-control-large" value={editFormData.titleTa} onChange={(e) => setEditFormData({ ...editFormData, titleTa: e.target.value })} />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descEn}</label>
                <textarea className="form-control admin-form-control-large" rows="3" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descTa}</label>
                <textarea className="form-control admin-form-control-large" rows="3" value={editFormData.descriptionTa} onChange={(e) => setEditFormData({ ...editFormData, descriptionTa: e.target.value })} />
              </div>

              <label className="checkbox-card" style={{ padding: '0.85rem 1.1rem' }}>
                <input type="checkbox" checked={editFormData.isPublished} onChange={(e) => setEditFormData({ ...editFormData, isPublished: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700 }}>{t.isPublishedLabel}</span>
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary admin-btn-large" style={{ flex: 1 }}>{t.saveBtn}</button>
                <button type="button" onClick={() => setEditingVideo(null)} className="btn-secondary admin-btn-large">{t.cancelBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Video Modal */}
      {replacingVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card admin-modal-large" style={{ maxWidth: '640px', borderColor: '#fde68a' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-gold)', fontSize: '1.5rem', fontWeight: 800 }}>{t.replaceModalTitle}</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.replaceWarning}</p>

            <form onSubmit={handleReplaceSubmit} className="auth-form">
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.95rem' }}>Current Video Title:</label>
                <div style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', fontWeight: 700 }}>{replacingVideo.title}</div>
              </div>

              <div className="admin-upload-zone-large" style={{ borderColor: 'var(--accent-gold)' }}>
                <label style={{ color: 'var(--accent-gold)', fontSize: '1.05rem', fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>
                  Select Replacement Video File (.mp4, .mkv, .webm):
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/x-matroska,video/webm,video/quicktime,video/x-msvideo"
                  onChange={(e) => setReplaceFile(e.target.files[0])}
                  required
                  style={{ color: 'var(--text-primary)', marginTop: '0.5rem', fontSize: '0.95rem' }}
                />
                {replaceFile && (
                  <div style={{ marginTop: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                    ✓ Selected: {replaceFile.name} ({(replaceFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary btn-admin admin-btn-large" style={{ flex: 1 }} disabled={isReplacing}>
                  {isReplacing ? t.replacing : 'Safe Upload & Replace Video'}
                </button>
                <button type="button" onClick={() => setReplacingVideo(null)} className="btn-secondary admin-btn-large" disabled={isReplacing}>{t.cancelBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card" style={{ maxWidth: '500px', width: '100%', borderColor: '#fecaca', padding: '2.5rem' }}>
            <h3 style={{ color: '#b91c1c', marginBottom: '0.75rem', fontSize: '1.4rem' }}>{t.deleteConfirmTitle}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {t.deleteConfirmText}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleDelete} className="btn-primary" style={{ background: '#dc2626', flex: 1, padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}>
                {t.confirmDeleteBtn}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary" style={{ padding: '0.9rem', fontSize: '1rem' }}>
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;
