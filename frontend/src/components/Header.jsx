import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ currentLang, setLanguage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLabels = {
    en: {
      brand: 'TNPSC + UGC NET + SET Portal',
      home: 'Home',
      exams: 'Exams',
      dashboard: 'Dashboard',
      adminPortal: 'Admin Dashboard',
      login: 'Student Login',
      register: 'Register',
      adminLogin: 'Admin',
      logout: 'Logout'
    },
    ta: {
      brand: 'டிஎன்பிஎஸ்சி + UGC NET + SET மையம்',
      home: 'முகப்பு',
      exams: 'தேர்வுகள்',
      dashboard: 'டாஷ்போர்டு',
      adminPortal: 'நிர்வாகப் பகுதி',
      login: 'மாணவர் உள்நுழைவு',
      register: 'பதிவு செய்ய',
      adminLogin: 'நிர்வாகி',
      logout: 'வெளியேறு'
    }
  };

  const t = navLabels[currentLang] || navLabels.en;

  return (
    <header className="navbar">
      <Link to="/" className="brand-logo">
        <div className="brand-icon">TP</div>
        <span>{t.brand}</span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user ? (
          <>
            {/* When logged in: Replace Home with Logout */}
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                padding: 0
              }}
            >
              {t.logout}
            </button>
            <Link to="/exams" className="nav-link">{t.exams}</Link>
            {user.role === 'admin' ? (
              <Link to="/admin/dashboard" className="nav-link admin-badge-link">
                🛡️ {t.adminPortal}
              </Link>
            ) : (
              <Link to="/dashboard" className="nav-link">{t.dashboard}</Link>
            )}
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">{t.home}</Link>
            <Link to="/exams" className="nav-link">{t.exams}</Link>
            <Link to="/login" className="nav-link">{t.login}</Link>
            <Link to="/register" className="btn-primary-sm">{t.register}</Link>
            <Link to="/admin/login" className="nav-link-subtle">{t.adminLogin}</Link>
          </>
        )}

        <div className="lang-switcher" aria-label="Language Switcher">
          <button
            className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            title="Switch to English"
          >
            English
          </button>
          <button
            className={`lang-btn ${currentLang === 'ta' ? 'active' : ''}`}
            onClick={() => setLanguage('ta')}
            title="தமிழுக்கு மாறுக"
          >
            தமிழ்
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
