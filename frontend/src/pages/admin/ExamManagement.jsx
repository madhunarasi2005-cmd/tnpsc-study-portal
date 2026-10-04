import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { getLangText } from '../../utils/langHelper';

const ExamManagement = ({ currentLang }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameTa: '',
    code: '',
    description: '',
    descriptionTa: '',
    isActive: true
  });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/exams?all=true');
      setExams(data);
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam = null) => {
    setError('');
    setSuccess('');
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name || '',
        nameTa: exam.nameTa || '',
        code: exam.code || '',
        description: exam.description || '',
        descriptionTa: exam.descriptionTa || '',
        isActive: exam.isActive !== undefined ? exam.isActive : true
      });
    } else {
      setEditingExam(null);
      setFormData({
        name: '',
        nameTa: '',
        code: '',
        description: '',
        descriptionTa: '',
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
      if (editingExam) {
        await apiRequest(`/exams/${editingExam._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setSuccess(currentLang === 'ta' ? 'தேர்வு விவரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன' : 'Exam details updated successfully');
      } else {
        await apiRequest('/exams', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setSuccess(currentLang === 'ta' ? 'புதிய தேர்வு வெற்றிகரமாகச் சேர்க்கப்பட்டது' : 'New exam category created successfully');
      }
      setShowModal(false);
      fetchExams();
    } catch (err) {
      setError(err.message || 'Failed to save exam details');
    }
  };

  const handleToggleActive = async (exam) => {
    try {
      await apiRequest(`/exams/${exam._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !exam.isActive })
      });
      fetchExams();
    } catch (err) {
      setError(err.message || 'Failed to toggle exam status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/exams/${deleteTarget._id}`, { method: 'DELETE' });
      setSuccess(currentLang === 'ta' ? 'தேர்வு மற்றும் அதன் பாடங்கள் நீக்கப்பட்டன' : 'Exam and associated subjects/topics deleted');
      setDeleteTarget(null);
      fetchExams();
    } catch (err) {
      setError(err.message || 'Failed to delete exam');
      setDeleteTarget(null);
    }
  };

  const labels = {
    en: {
      title: 'Exam Category Management',
      subtitle: 'Create, update, activate, or manage competitive exam categories',
      addBtn: '+ Add New Exam Category',
      code: 'Exam Code',
      name: 'Exam Category Name',
      subjects: 'Subjects',
      status: 'Status',
      actions: 'Actions',
      edit: 'Edit Details',
      delete: 'Delete',
      active: 'Active',
      inactive: 'Inactive',
      modalAddTitle: 'Add New Exam Category',
      modalEditTitle: 'Edit Exam Category',
      nameEnLabel: 'Exam Name (English)',
      nameTaLabel: 'Exam Name (Tamil - Optional)',
      codeLabel: 'Exam Code (e.g. TNPSC, UGC_NET, SET)',
      descEnLabel: 'Description (English)',
      descTaLabel: 'Description (Tamil - Optional)',
      activeLabel: 'Is Active (Visible in catalog)',
      saveBtn: 'Save Exam Category',
      cancelBtn: 'Cancel',
      deleteConfirmTitle: 'Confirm Exam Deletion',
      deleteConfirmText: 'Warning: Deleting this exam will also delete all associated subjects, topics, and mapped videos!',
      confirmDeleteBtn: 'Yes, Delete Exam',
      backToDashboard: '← Back to Admin Dashboard'
    },
    ta: {
      title: 'தேர்வுப் பிரிவு மேலாண்மை',
      subtitle: 'போட்டித் தேர்வுப் பிரிவுகளை உருவாக்கவும், திருத்தவும் மற்றும் நிர்வகிக்கவும்',
      addBtn: '+ புதிய தேர்வு சேர்',
      code: 'குறியீடு',
      name: 'தேர்வின் பெயர்',
      subjects: 'பாடங்கள்',
      status: 'நிலை',
      actions: 'செயல்கள்',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      active: 'செயலில்',
      inactive: 'செயலிழந்தது',
      modalAddTitle: 'புதிய தேர்வு சேர்',
      modalEditTitle: 'தேர்வை திருத்து',
      nameEnLabel: 'தேர்வின் பெயர் (ஆங்கிலம்)',
      nameTaLabel: 'தேர்வின் பெயர் (தமிழ்)',
      codeLabel: 'தேர்வுக் குறியீடு (சான்றாக: TNPSC)',
      descEnLabel: 'விளக்கம் (ஆங்கிலம்)',
      descTaLabel: 'விளக்கம் (தமிழ்)',
      activeLabel: 'செயலில் உள்ளதா (மாணவர்களுக்குத் தெரியும்)',
      saveBtn: 'சேமிக்க',
      cancelBtn: 'ரத்து செய்',
      deleteConfirmTitle: 'தேர்வு நீக்கத்தை உறுதிசெய்க',
      deleteConfirmText: 'எச்சரிக்கை: இந்த தேர்வை நீக்கினால் அதனுடன் தொடர்புடைய அனைத்து பாடங்களும் தலைப்புகளும் நீக்கப்படும்!',
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

      {success && <div className="alert alert-success" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading exams...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <table className="admin-table-spacious" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.code}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.name}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.subjects}</th>
                <th style={{ padding: '1.2rem 1.1rem' }}>{t.status}</th>
                <th style={{ padding: '1.2rem 1.1rem', textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1.25rem 1.1rem' }}>
                    <span className="badge" style={{ marginBottom: 0, padding: '4px 12px', fontSize: '0.85rem' }}>{exam.code}</span>
                  </td>
                  <td style={{ padding: '1.25rem 1.1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{getLangText(exam, 'name', currentLang)}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{getLangText(exam, 'description', currentLang)}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.1rem' }}>
                    <span className="status-badge" style={{ fontSize: '0.9rem', padding: '5px 14px' }}>{exam.subjectCount || 0}</span>
                  </td>
                  <td style={{ padding: '1.25rem 1.1rem' }}>
                    <button
                      onClick={() => handleToggleActive(exam)}
                      className={`status-badge ${exam.isActive ? '' : 'alert-error'}`}
                      style={{ border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: '0.88rem' }}
                    >
                      <span className="status-dot" style={{ backgroundColor: exam.isActive ? '#10b981' : '#ef4444' }}></span>
                      {exam.isActive ? t.active : t.inactive}
                    </button>
                  </td>
                  <td style={{ padding: '1.25rem 1.1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(exam)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                        ✏️ {t.edit}
                      </button>
                      <button onClick={() => setDeleteTarget(exam)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.88rem', borderColor: '#fecaca', color: '#b91c1c' }}>
                        🗑️ {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="auth-card admin-modal-large" style={{ maxWidth: '640px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {editingExam ? t.modalEditTitle : t.modalAddTitle}
            </h3>

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.codeLabel}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g. TNPSC, UGC_NET, SET"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.nameEnLabel}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. TNPSC Group Examinations"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.nameTaLabel}</label>
                <input
                  type="text"
                  className="form-control admin-form-control-large"
                  value={formData.nameTa}
                  onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                  placeholder="எ.கா: டிஎன்பிஎஸ்சி தொகுதி தேர்வுகள்"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descEnLabel}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive coverage for Group 1, 2 & 4..."
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>{t.descTaLabel}</label>
                <textarea
                  className="form-control admin-form-control-large"
                  rows="3"
                  value={formData.descriptionTa}
                  onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
                  placeholder="தேர்வுக்கான முழுமையான பாடத்திட்டம்..."
                />
              </div>

              <label className="checkbox-card" style={{ padding: '0.9rem 1.2rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{t.activeLabel}</span>
              </label>

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

export default ExamManagement;
