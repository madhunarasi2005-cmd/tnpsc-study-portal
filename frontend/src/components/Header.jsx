import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ currentLang, setLanguage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLabels = {
    en: {
      brand: 'TNPSC + UGC NET + SET Portal',
      brandShort: 'Study Portal',
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
      brandShort: 'கற்றல் மையம்',
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

  const NavLinks = ({ onLinkClick }) => (
    <>
      {user ? (
        <>
          <button
            onClick={() => { handleLogout(); onLinkClick && onLinkClick(); }}
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
          <Link to="/exams" className="nav-link" onClick={onLinkClick}>{t.exams}</Link>
          {user.role === 'admin' ? (
            <Link to="/admin/dashboard" className="nav-link admin-badge-link" onClick={onLinkClick}>
              🛡️ {t.adminPortal}
            </Link>
          ) : (
            <Link to="/dashboard" className="nav-link" onClick={onLinkClick}>{t.dashboard}</Link>
          )}
        </>
      ) : (
        <>
          <Link to="/" className="nav-link" onClick={onLinkClick}>{t.home}</Link>
          <Link to="/exams" className="nav-link" onClick={onLinkClick}>{t.exams}</Link>
          <Link to="/login" className="nav-link" onClick={onLinkClick}>{t.login}</Link>
          <Link to="/register" className="btn-primary-sm" onClick={onLinkClick}>{t.register}</Link>
          <Link to="/admin/login" className="nav-link-subtle" onClick={onLinkClick}>{t.adminLogin}</Link>
        </>
      )}

      <div className="lang-switcher" aria-label="Language Switcher">
        <button
          className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
          onClick={() => { setLanguage('en'); onLinkClick && onLinkClick(); }}
          title="Switch to English"
        >
          EN
        </button>
        <button
          className={`lang-btn ${currentLang === 'ta' ? 'active' : ''}`}
          onClick={() => { setLanguage('ta'); onLinkClick && onLinkClick(); }}
          title="தமிழுக்கு மாறுக"
        >
          தமிழ்
        </button>
      </div>
    </>
  );

  return (
    <header className="navbar" ref={menuRef}>
      <Link to="/" className="brand-logo">
        <div className="brand-icon">TP</div>
        <span className="brand-text-full">{t.brand}</span>
        <span className="brand-text-short">{t.brandShort}</span>
      </Link>

      {/* Desktop Nav */}
      <nav className="nav-desktop">
        <NavLinks />
      </nav>

      {/* Hamburger Button (Mobile only) */}
      <button
        className={`hamburger-btn ${menuOpen ? 'hamburger-open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
      </button>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <nav className={`mobile-nav-drawer ${menuOpen ? 'mobile-nav-open' : ''}`}>
        <NavLinks onLinkClick={() => setMenuOpen(false)} />
      </nav>
    </header>
  );
};

export default Header;
