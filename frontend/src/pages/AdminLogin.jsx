import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = ({ currentLang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      if (data.role !== 'admin') {
        setError(currentLang === 'ta' ? 'அணுகல் மறுக்கப்பட்டது: நீங்கள் ஒரு நிர்வாகி அல்ல' : 'Access Denied: You are not an administrator.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Admin authentication failed. Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels = {
    en: {
      title: 'Administrator Access',
      subtitle: 'Secure portal for exam, subject, topic, and video content management',
      emailLabel: 'Admin Email',
      emailPlaceholder: 'admin@tnpscportal.com',
      passwordLabel: 'Admin Password',
      passwordPlaceholder: 'Enter admin password',
      loginBtn: 'Login to Admin Dashboard',
      loggingIn: 'Verifying Admin Privileges...',
      studentLoginPrompt: 'Are you a Student?',
      studentLoginLink: 'Go to Student Login'
    },
    ta: {
      title: 'நிர்வாகி பகுதி',
      subtitle: 'தேர்வுகள், பாடங்கள், தலைப்புகள் மற்றும் காணொளிகளை நிர்வகிக்கும் பாதுகாப்பு மையம்',
      emailLabel: 'நிர்வாகி மின்னஞ்சல்',
      emailPlaceholder: 'admin@tnpscportal.com',
      passwordLabel: 'நிர்வாகி கடவுச்சொல்',
      passwordPlaceholder: 'கடவுச்சொல்லை உள்ளிடவும்',
      loginBtn: 'நிர்வாகி பகுதிக்குச் செல்க',
      loggingIn: 'சரிபார்க்கப்படுகிறது...',
      studentLoginPrompt: 'நீங்கள் ஒரு மாணவரா?',
      studentLoginLink: 'மாணவர் உள்நுழைவுக்குச் செல்க'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="auth-container">
      <div className="auth-card admin-card">
        <div className="auth-header">
          <span className="badge badge-admin">🛡️ PROTECTED ADMIN PORTAL</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t.emailLabel}</label>
            <input
              type="email"
              className="form-control"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t.passwordLabel}</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-admin" disabled={isSubmitting}>
            {isSubmitting ? t.loggingIn : t.loginBtn}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t.studentLoginPrompt} <Link to="/login">{t.studentLoginLink}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
