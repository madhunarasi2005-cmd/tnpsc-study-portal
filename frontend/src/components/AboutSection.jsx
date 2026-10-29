import React from 'react';

const AboutSection = ({ currentLang }) => {
  const content = {
    en: {
      badge: 'FACULTY & MENTOR',
      title: "About MENTOR",
      subtitle: 'Guiding aspirants to excellence in TNPSC, UGC NET & SET examinations',
      name: "Dr.R.Anusuya, M.A. B.Lis., Ph. D., NET",
      designation: 'Senior Educator & Competitive Exam Mentor',
      bioTitle: 'About & Teaching Philosophy',
      bioText: 'Welcome to our specialized study portal! With years of dedicated experience in mentoring students for competitive civil services and national lectureship eligibility examinations, our mission is to deliver structured, high-yield, and bilingual video lectures that simplify complex syllabus concepts into clear, memorable lessons.',
      qualificationsTitle: 'Education & Qualifications',
      qualifications: [
        'Ph.D. in modern literature',
        'UGC NET & B.Lisc,DGT,DF,PGDCA Qualified',
        '18 Awards',
        '12 Books Published & 54 Seminars Presented, 3 International Conferences Presented & 3 Workshop Organized'
      ],
      experienceTitle: 'Experience & Achievements',
      experienceText: 'Over 18+ years of active teaching and classroom coaching for TNPSC Group 1, 2, 4, UGC NET Paper 1 & 2, and SET examinations with successful selections.',
      contactTitle: 'Contact & Student Support',
      emailLabel: 'Email:',
      emailVal: 'asm2007feb@gmail.com',
      phoneLabel: 'Helpline / WhatsApp:',
      phoneVal: '+91 98765 43210'
    },
    ta: {
      badge: 'ஆசிரியை & வழிகாட்டி',
      title: 'ஆசிரியை பற்றி (About Faculty)',
      subtitle: 'டிஎன்பிஎஸ்சி, UGC NET & SET தேர்வுகளில் மாணவர்களின் வெற்றிக்கு வழிகாட்டுகிறார்',
      name: 'முனைவர் இரா அனுசுயா, M.A. B.Lis., Ph. D., NET',
      designation: 'மூத்த கல்வியாளர் & போட்டித் தேர்வு வழிகாட்டி',
      bioTitle: 'அறிமுகம் & கற்பித்தல் பார்வை',
      bioText: 'நமது கற்றல் மையத்திற்கு உங்களை அன்புடன் வரவேற்கிறோம்! போட்டித் தேர்வுகள் மற்றும் ஆசிரியர் தகுதித் தேர்வுகளுக்கு மாணவர்களை வழிநடத்துவதில் பல வருட அனுபவத்துடன், கடினமான பாடப் பிரிவுகளையும் எளிய முறையில் விளக்கும் உயர்தர இருமொழி காணொளிப் பாடங்களை வழங்குவதே நமது நோக்கமாகும்.',
      qualificationsTitle: 'கல்வித் தகுதிகள்',
      qualifications: [
        'நவீன இலக்கியத்தில் முனைவர் பட்டம் (Ph.D.)',
        'UGC NET & B.Lisc, DGT, DF, PGDCA தேர்ச்சி',
        '18 சிறப்பு விருதுகள்',
        '12 நூல்கள் வெளியீடு, 54 கருத்தரங்கக் கட்டுரைகள், 3 சர்வதேச மாநாட்டு உரைகள்'
      ],
      experienceTitle: 'அனுபவம் & சாதனைகள்',
      experienceText: 'டிஎன்பிஎஸ்சி தொகுதி 1, 2, 4 மற்றும் UGC NET / SET தேர்வுகளில் 18+ வருடங்களுக்கும் மேலான நேரடி மற்றும் இணைய கற்பித்தல் அனுபவம்.',
      contactTitle: 'தொடர்பு விவரங்கள்',
      emailLabel: 'மின்னஞ்சல்:',
      emailVal: 'asm2007feb@gmail.com',
      phoneLabel: 'உதவி எண் / வாட்ஸ்அப்:',
      phoneVal: '+91 98765 43210'
    }
  };

  const t = content[currentLang] || content.en;

  return (
    <section className="about-section-container" id="about-maam">
      <div className="about-inner">
        <div className="about-header">
          <span className="badge">{t.badge}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="about-card-wrapper">
          {/* Photo Column */}
          <div className="about-photo-col">
            <div className="about-photo-frame">
              <img
                src="/Profilephoto.png"
                alt={t.name}
                className="about-photo-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'Profilephoto.png';
                }}
              />
            </div>
            <h3 className="about-name">{t.name}</h3>
            <p className="about-designation">{t.designation}</p>
          </div>

          {/* Bio & Details Column */}
          <div className="about-content-col">
            <div>
              <h4 className="about-block-title">📖 {t.bioTitle}</h4>
              <p className="about-bio">{t.bioText}</p>
            </div>

            <div>
              <h4 className="about-block-title">🎓 {t.qualificationsTitle}</h4>
              <ul className="qualifications-list">
                {t.qualifications.map((q, idx) => (
                  <li key={idx} className="qualification-tag">
                    ✓ {q}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="about-block-title">🏆 {t.experienceTitle}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {t.experienceText}
              </p>
            </div>

            {/* Contact Details Grid (Only Email and Phone) */}
            <div>
              <h4 className="about-block-title">📞 {t.contactTitle}</h4>
              <div className="contact-grid">
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.emailLabel}</div>
                    <div style={{ fontWeight: 600 }}>{t.emailVal}</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">📱</div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.phoneLabel}</div>
                    <div style={{ fontWeight: 600 }}>{t.phoneVal}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
