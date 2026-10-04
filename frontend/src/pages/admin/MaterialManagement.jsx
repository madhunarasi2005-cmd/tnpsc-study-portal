import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { getLangText } from '../../utils/langHelper';

const MaterialManagement = ({ currentLang }) => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedType, setSelectedType] = useState('');

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
    materialType: 'pdf',
    isPublished: true
  });
  const [materialFile, setMaterialFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Details Modal State
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    titleTa: '',
    description: '',
    descriptionTa: '',
    materialType: 'pdf',
    examId: '',
    subjectId: '',
    topicId: '',
    isPublished: true
  });

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchInitialHierarchy();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [selectedExamId, selectedSubjectId, selectedTopicId, selectedType]);

  const fetchInitialHierarchy = async () => {
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

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      let queryParams = '?all=true';
      if (selectedTopicId) queryParams += `&topicId=${selectedTopicId}`;
      else if (selectedSubjectId) queryParams += `&subjectId=${selectedSubjectId}`;
      else if (selectedExamId) queryParams += `&examId=${selectedExamId}`;

      if (selectedType) queryParams += `&materialType=${selectedType}`;

      const data = await apiRequest(`/materials${queryParams}`);
      setMaterials(data);
    } catch (err) {
      setError(err.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadModal = () => {
    setError('');
    setSuccess('');
    setMaterialFile(null);
    setUploadFormData({
      examId: selectedExamId || (exams.length > 0 ? exams[0]._id : ''),
      subjectId: selectedSubjectId || '',
      topicId: selectedTopicId || '',
      title: '',
      titleTa: '',
      description: '',
      descriptionTa: '',
      materialType: 'pdf',
      isPublished: true
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      setError('Please select a study material file (PDF, DOC, DOCX, PPT, PPTX, JPG, PNG)');
      return;
    }

    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('title', uploadFormData.title);
      formData.append('titleTa', uploadFormData.titleTa);
      formData.append('description', uploadFormData.description);
      formData.append('descriptionTa', uploadFormData.descriptionTa);
      formData.append('materialType', uploadFormData.materialType);
      formData.append('examId', uploadFormData.examId);
      formData.append('subjectId', uploadFormData.subjectId);
      formData.append('topicId', uploadFormData.topicId);
      formData.append('isPublished', uploadFormData.isPublished);

      await apiRequest('/materials/upload', {
        method: 'POST',
        body: formData
      });

      setSuccess(
        currentLang === 'ta'
          ? 'பாடக் குறிப்பு வெற்றிகரமாகப் பதிவேற்றப்பட்டது!'
          : 'Study material uploaded successfully to Cloudinary & saved!'
      );
      setShowUploadModal(false);
      fetchMaterials();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEditModal = (material) => {
    setError('');
    setSuccess('');
    setEditingMaterial(material);
    setEditFormData({
      title: material.title || '',
      titleTa: material.titleTa || '',
      description: material.description || '',
      descriptionTa: material.descriptionTa || '',
      materialType: material.materialType || 'pdf',
      examId: material.exam?._id || '',
      subjectId: material.subject?._id || '',
      topicId: material.topic?._id || '',
      isPublished: material.isPublished !== undefined ? material.isPublished : true
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiRequest(`/materials/${editingMaterial._id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setSuccess(
        currentLang === 'ta'
          ? 'பாடக் குறிப்பு விவரங்கள் புதுப்பிக்கப்பட்டன'
          : 'Study material details updated successfully'
      );
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) {
      setError(err.message || 'Failed to update study material');
    }
  };

  const handleTogglePublish = async (material) => {
    try {
      await apiRequest(`/materials/${material._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !material.isPublished })
      });
      fetchMaterials();
    } catch (err) {
      setError(err.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/materials/${deleteTarget._id}`, { method: 'DELETE' });
      setSuccess(
        currentLang === 'ta'
          ? 'பாடக் குறிப்பு வெற்றிகரமாக நீக்கப்பட்டது'
          : 'Study material deleted from storage and database'
      );
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err) {
      setError(err.message || 'Failed to delete study material');
      setDeleteTarget(null);
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
    if (!bytes || bytes === 0) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Cascading filters
  const filteredSubjects = selectedExamId
    ? subjects.filter(
        (s) => s.exam && (s.exam._id === selectedExamId || s.exam === selectedExamId)
      )
    : subjects;

  const filteredTopics = selectedSubjectId
    ? topics.filter(
        (t) => t.subject && (t.subject._id === selectedSubjectId || t.subject === selectedSubjectId)
      )
    : topics;

  // Modal cascading filters
  const modalFilteredSubjects = uploadFormData.examId
    ? subjects.filter(
        (s) => s.exam && (s.exam._id === uploadFormData.examId || s.exam === uploadFormData.examId)
      )
    : subjects;

  const modalFilteredTopics = uploadFormData.subjectId
    ? topics.filter(
        (t) =>
          t.subject &&
          (t.subject._id === uploadFormData.subjectId || t.subject === uploadFormData.subjectId)
      )
    : topics;

  const labels = {
    en: {
      title: 'Study Materials & Notes Management',
      subtitle:
        'Upload, manage, and organize PDF documents, handwritten notes, Word files, and presentations',
      uploadBtn: '📄 Upload New Study Material',
      filterExam: 'Filter by Exam:',
      filterSubject: 'Filter by Subject:',
      filterTopic: 'Filter by Topic:',
      filterType: 'Material Type:',
      allExams: 'All Exams',
      allSubjects: 'All Subjects',
      allTopics: 'All Topics',
      allTypes: 'All Types',
      materialTitle: 'Material Title & Format',
      hierarchy: 'Hierarchy (Exam → Sub → Topic)',
      status: 'Status',
      actions: 'Actions',
      published: 'Published',
      draft: 'Draft / Hidden',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View / Open ↗',
      uploadModalTitle: 'Upload New Study Material / Notes',
      editModalTitle: 'Edit Study Material Details',
      selectFile: 'Select Material File (PDF, DOC, DOCX, PPT, PPTX, JPG, PNG - Max 50MB):',
      selectFileHint: 'Click to choose or drag and drop document file',
      typeLabel: 'Material Classification / Type',
      titleEn: 'Document Title (English)',
      titleTa: 'Document Title (Tamil - Optional)',
      descEn: 'Overview / Description (English)',
      descTa: 'Overview / Description (Tamil - Optional)',
      isPublishedLabel: 'Publish Material Immediately (Visible to Students)',
      uploading: 'Uploading document to Cloudinary... Please wait',
      saveBtn: 'Save Changes',
      cancelBtn: 'Cancel',
      deleteConfirmTitle: 'Confirm Material Deletion',
      deleteConfirmText:
        'Warning: This will permanently delete the material document file and its record!',
      confirmDeleteBtn: 'Yes, Delete Material',
      backToDashboard: '← Back to Admin Dashboard'
    },
    ta: {
      title: 'பாடக் குறிப்புகள் & கையேடுகள் மேலாண்மை',
      subtitle:
        'PDF ஆவணங்கள், கையெழுத்துக் குறிப்புகள், DOC மற்றும் PPT கோப்புகளைப் பதிவேற்றி நிர்வகிக்கவும்',
      uploadBtn: '📄 புதிய குறிப்பு பதிவேற்று',
      filterExam: 'தேர்வு வடிகட்டி:',
      filterSubject: 'பாடம் வடிகட்டி:',
      filterTopic: 'தலைப்பு வடிகட்டி:',
      filterType: 'கோப்பு வகை:',
      allExams: 'அனைத்துத் தேர்வுகளும்',
      allSubjects: 'அனைத்துப் பாடங்களும்',
      allTopics: 'அனைத்துத் தலைப்புகளும்',
      allTypes: 'அனைத்து வகைகளும்',
      materialTitle: 'குறிப்பின் தலைப்பு & வகை',
      hierarchy: 'படிநிலை (தேர்வு → பாடம் → தலைப்பு)',
      status: 'நிலை',
      actions: 'செயல்கள்',
      published: 'வெளியிடப்பட்டது',
      draft: 'வரைவு (Draft)',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      view: 'திறந்து பார் ↗',
      uploadModalTitle: 'புதிய பாடக் குறிப்பு பதிவேற்றவும்',
      editModalTitle: 'குறிப்பு விவரங்களை திருத்து',
      selectFile: 'கோப்பைத் தேர்ந்தெடுக்கவும் (PDF, DOC, PPT, JPG - அதிகபட்சம் 50MB):',
      selectFileHint: 'கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்',
      typeLabel: 'ஆவண வகை',
      titleEn: 'தலைப்பு (ஆங்கிலம்)',
      titleTa: 'தலைப்பு (தமிழ்)',
      descEn: 'விளக்கம் (ஆங்கிலம்)',
      descTa: 'விளக்கம் (தமிழ்)',
      isPublishedLabel: 'உடனடியாக வெளியிடுக (மாணவர்களுக்குத் தெரியும்)',
      uploading: 'பதிவேற்றப்படுகிறது... காத்திருக்கவும்',
      saveBtn: 'சேமிக்க',
      cancelBtn: 'ரத்து செய்',
      deleteConfirmTitle: 'குறிப்பு நீக்கத்தை உறுதிசெய்க',
      deleteConfirmText: 'எச்சரிக்கை: இது ஆவணக் கோப்பை நிரந்தரமாக நீக்கும்!',
      confirmDeleteBtn: 'ஆம், நீக்கு',
      backToDashboard: '← நிர்வாக மையத்திற்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="admin-container-spacious">
      {/* Top Bar Navigation & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <Link
            to="/admin/dashboard"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}
          >
            {t.backToDashboard}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-admin">STUDY MATERIALS HUB</span>
            <span className="status-badge" style={{ fontSize: '0.85rem' }}>
              {materials.length} Documents
            </span>
          </div>
          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              marginTop: '0.4rem',
              color: 'var(--text-primary)'
            }}
          >
            {t.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>{t.subtitle}</p>
        </div>
        <button
          onClick={handleOpenUploadModal}
          className="btn-primary admin-btn-large"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {t.uploadBtn}
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
          background: 'var(--bg-card)',
          padding: '1.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <label
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}
          >
            {t.filterExam}
          </label>
          <select
            className="form-control admin-form-control-large"
            style={{ width: '100%', marginTop: '0.4rem' }}
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedSubjectId('');
              setSelectedTopicId('');
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
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}
          >
            {t.filterSubject}
          </label>
          <select
            className="form-control admin-form-control-large"
            style={{ width: '100%', marginTop: '0.4rem' }}
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedTopicId('');
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
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}
          >
            {t.filterTopic}
          </label>
          <select
            className="form-control admin-form-control-large"
            style={{ width: '100%', marginTop: '0.4rem' }}
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
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
          <label
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)' }}
          >
            {t.filterType}
          </label>
          <select
            className="form-control admin-form-control-large"
            style={{ width: '100%', marginTop: '0.4rem' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">{t.allTypes}</option>
            <option value="pdf">📄 PDF Document</option>
            <option value="handwritten_notes">✍️ Handwritten Notes</option>
            <option value="doc">📝 Word Document (DOC/DOCX)</option>
            <option value="ppt">📊 Presentation (PPT/PPTX)</option>
            <option value="other">📑 Other</option>
          </select>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>
          {error}
        </div>
      )}

      {/* Materials List Table */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)',
            fontSize: '1.1rem'
          }}
        >
          <div className="status-badge" style={{ padding: '8px 18px', fontSize: '0.95rem' }}>
            <span className="status-dot"></span>
            Loading study materials from database...
          </div>
        </div>
      ) : (
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
                <th style={{ padding: '1.2rem 1rem', width: '80px' }}>Type</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.materialTitle}</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.hierarchy}</th>
                <th style={{ padding: '1.2rem 1rem' }}>{t.status}</th>
                <th style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: '3.5rem',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '1.1rem'
                    }}
                  >
                    No study materials uploaded yet under this selection. Click{' '}
                    <strong>"{t.uploadBtn}"</strong> to upload your first notes or PDF.
                  </td>
                </tr>
              ) : (
                materials.map((mat) => (
                  <tr key={mat._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top', fontSize: '1.8rem' }}>
                      {getMaterialIcon(mat.materialType)}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {getLangText(mat, 'title', currentLang)}
                      </div>
                      {mat.titleTa && currentLang !== 'ta' && (
                        <div
                          style={{
                            fontSize: '0.92rem',
                            color: 'var(--accent-primary)',
                            marginTop: '0.2rem',
                            fontWeight: 600
                          }}
                        >
                          {mat.titleTa}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.35rem'
                        }}
                      >
                        Format: <code style={{ fontSize: '0.82rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>{mat.fileFormat || 'PDF'}</code> • Size: {formatFileSize(mat.fileSize)}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.92rem' }}>
                        <span
                          className="badge"
                          style={{ marginBottom: 0, padding: '3px 10px', fontSize: '0.78rem' }}
                        >
                          {mat.exam?.code || 'EXAM'}
                        </span>
                        <div
                          style={{
                            marginTop: '0.35rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {getLangText(mat.subject, 'name', currentLang)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.15rem'
                          }}
                        >
                          → {getLangText(mat.topic, 'name', currentLang)}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', verticalAlign: 'top' }}>
                      <button
                        onClick={() => handleTogglePublish(mat)}
                        className={`status-badge ${mat.isPublished ? '' : 'alert-error'}`}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          padding: '6px 14px',
                          fontSize: '0.88rem'
                        }}
                        title="Click to toggle publish status"
                      >
                        <span
                          className="status-dot"
                          style={{ backgroundColor: mat.isPublished ? '#10b981' : '#ef4444' }}
                        ></span>
                        {mat.isPublished ? t.published : t.draft}
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right', verticalAlign: 'top' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.6rem',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap'
                        }}
                      >
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.88rem',
                            textDecoration: 'none',
                            color: 'var(--accent-primary)',
                            borderColor: 'var(--accent-primary)',
                            fontWeight: 700
                          }}
                        >
                          {t.view}
                        </a>
                        <button
                          onClick={() => handleOpenEditModal(mat)}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.88rem' }}
                        >
                          ✏️ {t.edit}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(mat)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.88rem',
                            borderColor: '#fecaca',
                            color: '#b91c1c'
                          }}
                        >
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

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <div
            className="auth-card admin-modal-large"
            style={{ maxHeight: '92vh', overflowY: 'auto' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem'
              }}
            >
              <h3
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
                }}
              >
                {t.uploadModalTitle}
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="auth-form" style={{ gap: '1.4rem' }}>
              {/* Hierarchy Dropdowns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>1. Exam Category</label>
                  <select
                    className="form-control admin-form-control-large"
                    value={uploadFormData.examId}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        examId: e.target.value,
                        subjectId: '',
                        topicId: ''
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Exam
                    </option>
                    {exams.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.code} - {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>2. Subject</label>
                  <select
                    className="form-control admin-form-control-large"
                    value={uploadFormData.subjectId}
                    onChange={(e) =>
                      setUploadFormData({
                        ...uploadFormData,
                        subjectId: e.target.value,
                        topicId: ''
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Subject
                    </option>
                    {modalFilteredSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {getLangText(s, 'name', currentLang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>3. Topic</label>
                  <select
                    className="form-control admin-form-control-large"
                    value={uploadFormData.topicId}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, topicId: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Topic
                    </option>
                    {modalFilteredTopics.map((tp) => (
                      <option key={tp._id} value={tp._id}>
                        {getLangText(tp, 'name', currentLang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Material Classification Type */}
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.typeLabel}</label>
                <select
                  className="form-control admin-form-control-large"
                  value={uploadFormData.materialType}
                  onChange={(e) =>
                    setUploadFormData({ ...uploadFormData, materialType: e.target.value })
                  }
                  required
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="handwritten_notes">✍️ Handwritten Notes (Scanned PDF/Images)</option>
                  <option value="doc">📝 Microsoft Word Document (DOC / DOCX)</option>
                  <option value="ppt">📊 PowerPoint Presentation (PPT / PPTX)</option>
                  <option value="other">📑 Other Study Reference</option>
                </select>
              </div>

              {/* File Dropzone */}
              <div className="admin-upload-zone-large">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                <label
                  style={{
                    color: 'var(--accent-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  {t.selectFile}
                </label>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}
                >
                  {t.selectFileHint}
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setMaterialFile(e.target.files[0])}
                  required
                  style={{ color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer' }}
                />
                {materialFile && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      color: '#15803d',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    ✓ Selected: {materialFile.name} ({(materialFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.titleEn}</label>
                  <input
                    type="text"
                    className="form-control admin-form-control-large"
                    value={uploadFormData.title}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, title: e.target.value })
                    }
                    required
                    placeholder="e.g. Unit 1: Indian Polity Complete Handwritten Notes"
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.titleTa}</label>
                  <input
                    type="text"
                    className="form-control admin-form-control-large"
                    value={uploadFormData.titleTa}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, titleTa: e.target.value })
                    }
                    placeholder="எ.கா: இந்திய ஆட்சியியல் முழுமையான கையேடு"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.descEn}</label>
                  <textarea
                    className="form-control admin-form-control-large"
                    rows="3"
                    value={uploadFormData.description}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, description: e.target.value })
                    }
                    placeholder="Key concepts, formulas, mind maps, and exam revision summary..."
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.descTa}</label>
                  <textarea
                    className="form-control admin-form-control-large"
                    rows="3"
                    value={uploadFormData.descriptionTa}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, descriptionTa: e.target.value })
                    }
                    placeholder="முக்கியக் குறிப்புகள் மற்றும் சுருக்கம்..."
                  />
                </div>
              </div>

              <label className="checkbox-card" style={{ padding: '1rem 1.25rem' }}>
                <input
                  type="checkbox"
                  checked={uploadFormData.isPublished}
                  onChange={(e) =>
                    setUploadFormData({ ...uploadFormData, isPublished: e.target.checked })
                  }
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{t.isPublishedLabel}</span>
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn-primary admin-btn-large"
                  style={{ flex: 1 }}
                  disabled={isUploading}
                >
                  {isUploading ? t.uploading : '☁️ Upload Study Material to Cloudinary'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary admin-btn-large"
                  disabled={isUploading}
                >
                  {t.cancelBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingMaterial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <div className="auth-card admin-modal-large" style={{ maxWidth: '680px' }}>
            <h3
              style={{
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}
            >
              {t.editModalTitle}
            </h3>

            <form onSubmit={handleEditSubmit} className="auth-form" style={{ gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.typeLabel}</label>
                <select
                  className="form-control admin-form-control-large"
                  value={editFormData.materialType}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, materialType: e.target.value })
                  }
                  required
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="handwritten_notes">✍️ Handwritten Notes</option>
                  <option value="doc">📝 Word Document (DOC / DOCX)</option>
                  <option value="ppt">📊 Presentation (PPT / PPTX)</option>
                  <option value="other">📑 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.titleEn}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.titleTa}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={editFormData.titleTa}
                  onChange={(e) => setEditFormData({ ...editFormData, titleTa: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descEn}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descTa}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={editFormData.descriptionTa}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, descriptionTa: e.target.value })
                  }
                />
              </div>

              <label className="checkbox-card" style={{ padding: '0.85rem 1.1rem' }}>
                <input
                  type="checkbox"
                  checked={editFormData.isPublished}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isPublished: e.target.checked })
                  }
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                  {t.isPublishedLabel}
                </span>
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary admin-btn-large" style={{ flex: 1 }}>
                  {t.saveBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="btn-secondary admin-btn-large"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <div
            className="auth-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              borderColor: '#fecaca',
              padding: '2.5rem'
            }}
          >
            <h3 style={{ color: '#b91c1c', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
              {t.deleteConfirmTitle}
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                marginBottom: '1.75rem',
                lineHeight: 1.6
              }}
            >
              {t.deleteConfirmText}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleDelete}
                className="btn-primary"
                style={{
                  background: '#dc2626',
                  flex: 1,
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                {t.confirmDeleteBtn}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary"
                style={{ padding: '0.9rem', fontSize: '1rem' }}
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialManagement;
