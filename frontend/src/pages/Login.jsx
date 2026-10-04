import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = ({ currentLang }) => {
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
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels = {
    en: {
      title: 'Student Login',
      subtitle: 'Access your competitive exam video lectures and progress',
      emailLabel: 'Email Address',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      loginBtn: 'Login to Study Portal',
      loggingIn: 'Authenticating...',
      noAccount: "Don't have an account?",
      registerNow: 'Register Here',
      adminPortalPrompt: 'Are you an Administrator?',
      adminLoginLink: 'Admin Login Portal'
    },
    ta: {
      title: 'மாணவர் உள்நுழைவு',
      subtitle: 'உங்கள் காணொளிப் பாடங்கள் மற்றும் கற்றல் முன்னேற்றத்தைக் காண்க',
      emailLabel: 'மின்னஞ்சல் முகவரி',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'கடவுச்சொல்',
      passwordPlaceholder: 'கடவுச்சொல்லை உள்ளிடவும்',
      loginBtn: 'உள்நுழைக',
      loggingIn: 'சரிபார்க்கப்படுகிறது...',
      noAccount: 'கணக்கு இல்லையா?',
      registerNow: 'இங்கே பதிவு செய்க',
      adminPortalPrompt: 'நீங்கள் நிர்வாகியா?',
      adminLoginLink: 'நிர்வாகி உள்நுழைவு'
    }
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="auth-container-light">
      <div className="auth-card-light">
        <div className="auth-header">
          <span className="badge-light">STUDENT PORTAL</span>
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

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t.loggingIn : t.loginBtn}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t.noAccount} <Link to="/register">{t.registerNow}</Link></p>
          <p style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>
            {t.adminPortalPrompt} <Link to="/admin/login">{t.adminLoginLink}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
