import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = ({ currentLang }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(currentLang === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // Default to all exams so the backend User model selectedExams array is populated cleanly
      const defaultExams = ['TNPSC', 'UGC NET', 'SET'];
      await register(name, email, password, defaultExams);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels = {
    en: {
      title: 'Aspirant Registration',
      subtitle: 'Create your account to start learning for competitive examinations',
      nameLabel: 'Full Name',
      namePlaceholder: 'Enter your full name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create password (min 6 chars)',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter password',
      registerBtn: 'Create Aspirant Account',
      registering: 'Creating Account...',
      alreadyHaveAccount: 'Already have an account?',
      loginHere: 'Login Here'
    },
    ta: {
      title: 'மாணவர் பதிவு',
      subtitle: 'போட்டித் தேர்வுகளுக்குப் படிக்க புதிய கணக்கை உருவாக்குங்கள்',
      nameLabel: 'முழுப் பெயர்',
      namePlaceholder: 'உங்கள் முழுப் பெயரை உள்ளிடவும்',
      emailLabel: 'மின்னஞ்சல் முகவரி',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'கடவுச்சொல்',
      passwordPlaceholder: 'கடவுச்சொல் உருவாக்கவும்',
      confirmPasswordLabel: 'கடவுச்சொல்லை உறுதிப்படுத்துக',
      confirmPasswordPlaceholder: 'மீண்டும் கடவுச்சொல்லை உள்ளிடவும்',
      registerBtn: 'கணக்கை உருவாக்கு',
      registering: 'உருவாக்கப்படுகிறது...',
      alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
      loginHere: 'இங்கே உள்நுழைக'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <span className="badge">STUDENT REGISTRATION</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t.nameLabel}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>{t.passwordLabel}</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t.confirmPasswordLabel}</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={isSubmitting}>
            {isSubmitting ? t.registering : t.registerBtn}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t.alreadyHaveAccount} <Link to="/login">{t.loginHere}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
