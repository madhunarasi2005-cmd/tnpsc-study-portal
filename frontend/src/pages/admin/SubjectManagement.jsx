import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { getLangText } from '../../utils/langHelper';

const SubjectManagement = ({ currentLang }) => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    examId: '',
    name: '',
    nameTa: '',
    description: '',
    descriptionTa: '',
    order: 0,
    isActive: true
  });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const data = await apiRequest('/exams?all=true');
      setExams(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const url = selectedExamId ? `/subjects?examId=${selectedExamId}&all=true` : '/subjects?all=true';
      const data = await apiRequest(url);
      setSubjects(data);
    } catch (err) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (subject = null) => {
    setError('');
    setSuccess('');
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        examId: subject.exam?._id || selectedExamId,
        name: subject.name || '',
        nameTa: subject.nameTa || '',
        description: subject.description || '',
        descriptionTa: subject.descriptionTa || '',
        order: subject.order !== undefined ? subject.order : 0,
        isActive: subject.isActive !== undefined ? subject.isActive : true
      });
    } else {
      setEditingSubject(null);
      setFormData({
        examId: selectedExamId || (exams.length > 0 ? exams[0]._id : ''),
        name: '',
        nameTa: '',
        description: '',
        descriptionTa: '',
        order: subjects.length + 1,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingSubject) {
        await apiRequest(`/subjects/${editingSubject._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setSuccess(currentLang === 'ta' ? 'பாடம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது' : 'Subject updated successfully');
      } else {
        await apiRequest('/subjects', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setSuccess(currentLang === 'ta' ? 'புதிய பாடம் சேர்க்கப்பட்டது' : 'New subject added successfully');
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to save subject');
    }
  };

  const handleToggleActive = async (subject) => {
    try {
      await apiRequest(`/subjects/${subject._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !subject.isActive })
      });
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to toggle subject status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/subjects/${deleteTarget._id}`, { method: 'DELETE' });
      setSuccess(currentLang === 'ta' ? 'பாடம் மற்றும் அதன் தலைப்புகள் நீக்கப்பட்டன' : 'Subject and associated topics deleted');
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
      setDeleteTarget(null);
    }
  };

  const labels = {
    en: {
      title: 'Subject Hierarchy Management',
      subtitle: 'Organize subject modules under competitive exam categories',
      addBtn: '+ Add New Subject',
      filterExam: 'Filter by Exam:',
      allExams: 'All Exams',
      order: 'Order',
      name: 'Subject Module Name',
      exam: 'Exam',
      topics: 'Topics',
      status: 'Status',
      actions: 'Actions',
      edit: 'Edit Details',
      delete: 'Delete',
      active: 'Active',
      inactive: 'Inactive',
      modalAddTitle: 'Add New Subject Module',
      modalEditTitle: 'Edit Subject Module',
      selectExamLabel: 'Target Exam Category',
      nameEnLabel: 'Subject Name (English)',
      nameTaLabel: 'Subject Name (Tamil - Optional)',
      orderLabel: 'Display Order Sequence',
      descEnLabel: 'Description (English)',
      descTaLabel: 'Description (Tamil - Optional)',
      activeLabel: 'Is Active (Visible to students)',
      saveBtn: 'Save Subject',
      cancelBtn: 'Cancel',
      deleteConfirmTitle: 'Confirm Subject Deletion',
      deleteConfirmText: 'Warning: Deleting this subject will also delete all its associated topics and mapped videos!',
      confirmDeleteBtn: 'Yes, Delete Subject',
      backToDashboard: '← Back to Admin Dashboard'
    },
    ta: {
      title: 'பாடங்கள் மேலாண்மை',
      subtitle: 'தேர்வுகளின் கீழ் பாடப் பிரிவுகளை உருவாக்கி நிர்வகிக்கவும்',
      addBtn: '+ புதிய பாடம் சேர்',
      filterExam: 'தேர்வு வடிகட்டி:',
      allExams: 'அனைத்துத் தேர்வுகளும்',
      order: 'வரிசை',
      name: 'பாடத்தின் பெயர்',
      exam: 'தேர்வு',
      topics: 'தலைப்புகள்',
      status: 'நிலை',
      actions: 'செயல்கள்',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      active: 'செயலில்',
      inactive: 'செயலிழந்தது',
      modalAddTitle: 'புதிய பாடம் சேர்',
      modalEditTitle: 'பாடத்தை திருத்து',
      selectExamLabel: 'இலக்குத் தேர்வு',
      nameEnLabel: 'பாடத்தின் பெயர் (ஆங்கிலம்)',
      nameTaLabel: 'பாடத்தின் பெயர் (தமிழ்)',
      orderLabel: 'காட்சி வரிசை எண்',
      descEnLabel: 'விளக்கம் (ஆங்கிலம்)',
      descTaLabel: 'விளக்கம் (தமிழ்)',
      activeLabel: 'செயலில் உள்ளதா',
      saveBtn: 'சேமிக்க',
      cancelBtn: 'ரத்து செய்',
      deleteConfirmTitle: 'பாடம் நீக்கத்தை உறுதிசெய்க',
      deleteConfirmText: 'எச்சரிக்கை: இந்த பாடத்தை நீக்கினால் அதனுடன் தொடர்புடைய அனைத்து தலைப்புகளும் நீக்கப்படும்!',
      confirmDeleteBtn: 'ஆம், நீக்கு',
      backToDashboard: '← நிர்வாக மையத்திற்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="admin-container-spacious">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <Link to="/admin/dashboard" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>
            {t.backToDashboard}
          </Link>
          <span className="badge badge-admin" style={{ display: 'block', width: 'fit-content' }}>ADMIN CONTROL</span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>{t.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>{t.subtitle}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary admin-btn-large">
          {t.addBtn}
        </button>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>{t.filterExam}</label>
        <select
          className="form-control admin-form-control-large"
          style={{ width: 'auto', minWidth: '280px' }}
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="">{t.allExams}</option>
          {exams.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.code} - {getLangText(exam, 'name', currentLang)}
            </option>
          ))}
        </select>
      </div>

      {success && <div className="alert alert-success" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading subjects...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <table className="admin-table-spacious" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.2rem 1.1rem', width: '90px' }}>{t.order}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.name}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.exam}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.topics}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.status}</th>
                <th style={{ padding: '1.2rem 1.1rem', textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    No subjects found under this selection. Click "{t.addBtn}" to create one.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.25rem 1.1rem' }}>
                      <span className="badge" style={{ marginBottom: 0, padding: '3px 10px' }}>#{subject.order || 1}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{getLangText(subject, 'name', currentLang)}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{getLangText(subject, 'description', currentLang)}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.1rem' }}>
                      {subject.exam ? (
                        <span className="status-badge" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{subject.exam.code}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1.25rem 1.1rem' }}>
                      <span className="status-badge" style={{ fontSize: '0.9rem', padding: '5px 14px' }}>{subject.topicCount || 0}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.1rem' }}>
                      <button
                        onClick={() => handleToggleActive(subject)}
                        className={`status-badge ${subject.isActive ? '' : 'alert-error'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: '0.88rem' }}
                      >
                        <span className="status-dot" style={{ backgroundColor: subject.isActive ? '#10b981' : '#ef4444' }}></span>
                        {subject.isActive ? t.active : t.inactive}
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 1.1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(subject)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                          ✏️ {t.edit}
                        </button>
                        <button onClick={() => setDeleteTarget(subject)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem', borderColor: '#fecaca', color: '#b91c1c' }}>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card admin-modal-large" style={{ maxWidth: '640px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {editingSubject ? t.modalEditTitle : t.modalAddTitle}
            </h3>

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.selectExamLabel}</label>
                <select
                  className="form-control admin-form-control-large"
                  value={formData.examId}
                  onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Target Exam</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.code} - {getLangText(exam, 'name', currentLang)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem' }}>{t.orderLabel}</label>
                  <input
                    type="number"
                    className="form-control admin-form-control-large"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <label className="checkbox-card" style={{ padding: '0.85rem 1.2rem', marginTop: '1.6rem', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{t.activeLabel}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.nameEnLabel}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. General Studies - History & Culture"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.nameTaLabel}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={formData.nameTa}
                  onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                  placeholder="எ.கா: பொது அறிவு - வரலாறு மற்றும் பண்பாடு"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descEnLabel}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descTaLabel}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={formData.descriptionTa}
                  onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary admin-btn-large" style={{ flex: 1 }}>{t.saveBtn}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary admin-btn-large">{t.cancelBtn}</button>
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

export default SubjectManagement;
