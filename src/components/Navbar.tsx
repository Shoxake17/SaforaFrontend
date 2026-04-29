import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const langRef = useRef(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  // Close lang menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ESC closes drawer + lang
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸', name: 'English' },
    { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
    { code: 'uz', label: 'UZ', flag: '🇺🇿', name: 'Oʻzbekcha' },
    { code: 'tr', label: 'TR', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'ar', label: 'SA', flag: '🇸🇦', name: 'العربية' },
    { code: 'zh', label: 'CN', flag: '🇨🇳', name: '中文' },
    { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
    { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
    { code: 'de', label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'ja', label: 'JA', flag: '🇯🇵', name: '日本語' },
  ];

  const handleLangSelect = (lang) => {
    setCurrentLang(lang.label);
    setLangOpen(false);
    // You can integrate i18n logic here
  };

  return (
    <>
      <nav className={`nav-pro ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo" aria-label="Safora Home">
            <div className="nav-logo-icon">
              <img src="/logo.png" alt="Safora" className="navbar-logo" />
            </div>
            <span className="nav-logo-text">SAFORA</span>
          </Link>

          {/* Center menu */}
          <div className="nav-center">
            {/* Industries Mega */}
            <div className="np-dd np-dd-mega" data-mega="industries">
              <button className="np-link" aria-haspopup="true">
                <span>Industries</span>
                <i className="fa-solid fa-chevron-down np-chev"></i>
              </button>
              <div className="np-mega np-mega-industries">
                <div className="np-mega-head">
                  <span className="np-mega-eyebrow">HOSPITALITY · LIVE</span>
                  <span className="np-mega-tag">Built for tourism</span>
                </div>
                <div className="np-ind-grid">
                  <a href="/solutions/full-pms/" className="np-ind-item">
                    <span className="np-ind-icon"><i className="fa-solid fa-hotel"></i></span>
                    <span className="np-ind-text">
                      <span className="np-ind-title">Hotels <span className="np-ind-live">LIVE</span></span>
                      <span className="np-ind-sub">Full PMS for boutique &amp; business hotels</span>
                    </span>
                  </a>
                  <a href="/industries/hostels/" className="np-ind-item">
                    <span className="np-ind-icon"><i className="fa-solid fa-bed"></i></span>
                    <span className="np-ind-text">
                      <span className="np-ind-title">Hostels <span className="np-ind-live">LIVE</span></span>
                      <span className="np-ind-sub">Bed-level inventory &amp; shared rooms</span>
                    </span>
                  </a>
                  <a href="/industries/guesthouses/" className="np-ind-item">
                    <span className="np-ind-icon"><i className="fa-solid fa-house-chimney"></i></span>
                    <span className="np-ind-text">
                      <span className="np-ind-title">Guest Houses <span className="np-ind-live">LIVE</span></span>
                      <span className="np-ind-sub">Family-run stays &amp; B&amp;Bs</span>
                    </span>
                  </a>
                </div>
                <div className="np-ind-foot">
                  <i className="fa-solid fa-rocket"></i>
                  <span>More verticals after Vision 2027 — restaurants, salons, clinics, fitness.</span>
                </div>
              </div>
            </div>

            {/* Solutions Mega */}
            <div className="np-dd np-dd-mega" data-mega="solutions">
              <button className="np-link" aria-haspopup="true">
                <span>Solutions</span>
                <i className="fa-solid fa-chevron-down np-chev"></i>
              </button>
              <div className="np-mega np-mega-cols-3">
                <div className="np-mega-grid np-mega-cols-3">
                  <div className="np-col">
                    <div className="np-col-h">CORE OPERATIONS</div>
                    <a href="/solutions/full-pms/" className="np-it">
                      <i className="fa-solid fa-building"></i>
                      <span><b>Full PMS</b><em>Property management</em></span>
                    </a>
                    <a href="/solutions/channel-manager/" className="np-it">
                      <i className="fa-solid fa-globe"></i>
                      <span><b>Channel Manager</b><em>Booking, Expedia, Airbnb</em></span>
                    </a>
                    <a href="/solutions/booking-engine/" className="np-it">
                      <i className="fa-solid fa-cart-shopping"></i>
                      <span><b>Booking Engine</b><em>Direct bookings</em></span>
                    </a>
                    <a href="/solutions/calendar/" className="np-it">
                      <i className="fa-solid fa-calendar-days"></i>
                      <span><b>Calendar</b><em>Visual reservations</em></span>
                    </a>
                    <a href="/solutions/front-desk/" className="np-it">
                      <i className="fa-solid fa-key"></i>
                      <span><b>Front Desk</b><em>Fast check-in/out</em></span>
                    </a>
                  </div>
                  <div className="np-col">
                    <div className="np-col-h">REVENUE &amp; MARKETING</div>
                    <a href="/solutions/website-builder/" className="np-it">
                      <i className="fa-solid fa-laptop"></i>
                      <span><b>Website Builder</b><em>Hotel sites in 10 days</em></span>
                    </a>
                    <a href="/solutions/reputation-manager/" className="np-it">
                      <i className="fa-solid fa-star"></i>
                      <span><b>Reputation Manager</b><em>Reviews &amp; ratings</em></span>
                    </a>
                    <a href="/solutions/ai-price-assist/" className="np-it">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span><b>AI Price Assist <span className="np-tag np-tag-ai">AI</span></b><em>Smart pricing</em></span>
                    </a>
                    <a href="/solutions/loyalty-program/" className="np-it">
                      <i className="fa-solid fa-coins"></i>
                      <span><b>Loyalty Program</b><em>Reward repeat guests</em></span>
                    </a>
                    <a href="/solutions/payment-hub/" className="np-it">
                      <i className="fa-solid fa-credit-card"></i>
                      <span><b>Payment Hub</b><em>Click, Payme, cards</em></span>
                    </a>
                  </div>
                  <div className="np-col np-col-ai">
                    <div className="np-col-h ai">AI &amp; AUTOMATION</div>
                    <a href="#" onClick={(e) => e.preventDefault()} className="np-it disabled">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span><b>AI Concierge <span className="np-tag np-tag-soon">SOON</span></b><em>10 languages</em></span>
                    </a>
                    <a href="/solutions/whatsapp-bot/" className="np-it">
                      <i className="fa-brands fa-whatsapp"></i>
                      <span><b>WhatsApp Bot <span className="np-tag np-tag-ai">AI</span></b><em>Auto-respond</em></span>
                    </a>
                    <a href="/solutions/telegram-ops/" className="np-it">
                      <i className="fa-brands fa-telegram"></i>
                      <span><b>Telegram Ops <span className="np-tag np-tag-ai">AI</span></b><em>Staff alerts</em></span>
                    </a>
                    <a href="/solutions/ai-agents-24-7/" className="np-it">
                      <i className="fa-solid fa-headset"></i>
                      <span><b>AI Agents 24/7 <span className="np-tag np-tag-ai">AI</span></b><em>Virtual receptionist</em></span>
                    </a>
                    <a href="/solutions/qr-guest-service/" className="np-it">
                      <i className="fa-solid fa-qrcode"></i>
                      <span><b>QR Guest Service</b><em>In-room ordering</em></span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Hotels */}
            <div className="np-dd np-dd-mega np-dd-ai">
              <button className="np-link np-link-ai" aria-haspopup="true">
                <span className="np-ai-icon"><i className="fa-solid fa-rocket"></i></span>
                AI Hotels
                <span className="np-ai-badge">VISION 2027</span>
              </button>
              <div className="np-mega np-mega-ai">
                <div className="np-mega-ai-grid">
                  <div className="np-ai-left">
                    <div className="np-ai-tag"><i className="fa-solid fa-rocket"></i> THE FUTURE OF HOSPITALITY</div>
                    <h3 className="np-ai-title">
                      The World's First Fully <span className="np-ai-grad">Autonomous AI Hotels</span>
                    </h3>
                    <p className="np-ai-sub">
                      Hotels that run themselves. No front desk. No managers. No staff shortages.
                      Just seamless guest experiences powered by AI.
                    </p>
                    <div className="np-ai-features">
                      <div className="np-ai-feat">
                        <div className="np-ai-feat-i" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                          <i className="fa-solid fa-robot"></i>
                        </div>
                        <div>
                          <div className="np-ai-feat-t">AI-Run Operations</div>
                          <div className="np-ai-feat-d">Bookings, check-ins, requests, complaints — 24/7 in 50+ languages</div>
                        </div>
                      </div>
                      <div className="np-ai-feat">
                        <div className="np-ai-feat-i" style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
                          <i className="fa-solid fa-building-circle-check"></i>
                        </div>
                        <div>
                          <div className="np-ai-feat-t">Smart Building Integration</div>
                          <div className="np-ai-feat-d">Connected locks, lights, climate, services — all controlled by AI</div>
                        </div>
                      </div>
                      <div className="np-ai-feat">
                        <div className="np-ai-feat-i" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                          <i className="fa-solid fa-chart-line"></i>
                        </div>
                        <div>
                          <div className="np-ai-feat-t">Self-Optimizing Revenue</div>
                          <div className="np-ai-feat-d">AI dynamically adjusts pricing, marketing, inventory in real-time</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="np-ai-right">
                    <div className="np-ai-illust">
                      <div className="np-ai-orb"></div>
                      <div className="np-ai-icon-big"><i className="fa-solid fa-hotel"></i></div>
                      <div className="np-ai-particles">
                        <span></span><span></span><span></span>
                        <span></span><span></span><span></span>
                      </div>
                      <div className="np-ai-eta">Coming 2027</div>
                    </div>
                    <div className="np-ai-ctas">
                      <a href="/vision/#waitlist" className="np-ai-btn np-ai-btn-pri">
                        <i className="fa-solid fa-bell"></i> Join Waitlist
                      </a>
                      <a href="/vision/" className="np-ai-btn np-ai-btn-sec">
                        <i className="fa-regular fa-file-lines"></i> Vision Page
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="np-dd">
              <button className="np-link" aria-haspopup="true">
                <span>Services</span>
                <i className="fa-solid fa-chevron-down np-chev"></i>
              </button>
              <div className="np-simple-menu">
                <a href="#turnkey" className="np-sm-item">
                  <i className="fa-solid fa-crown" style={{ color: '#fbbf24' }}></i>
                  <span><b>Hotel-as-a-Service</b><em>Turnkey management</em></span>
                  <span className="np-tag np-tag-gold">PILOT</span>
                </a>
                <a href="#turnkey" className="np-sm-item">
                  <i className="fa-solid fa-rocket"></i>
                  <span><b>AI Hotel Setup</b><em>1-month deployment</em></span>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="np-sm-item">
                  <i className="fa-solid fa-graduation-cap"></i>
                  <span><b>Custom AI Training</b><em>Tailored to your brand</em></span>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="np-sm-item">
                  <i className="fa-solid fa-arrow-right-arrow-left"></i>
                  <span><b>Migration from Other PMS</b><em>Free data import</em></span>
                </a>
                <a href="mailto:silkroaddreamstour@gmail.com" className="np-sm-item">
                  <i className="fa-solid fa-handshake"></i>
                  <span><b>Consulting &amp; Strategy</b><em>Book a session</em></span>
                </a>
              </div>
            </div>

            <a href="#roadmap" className="np-link np-link-flat">Roadmap</a>
            <a href="#pricing" className="np-link np-link-flat">Pricing</a>
          </div>

          {/* Right actions */}
          <div className="nav-actions">
            <Link to="/login" className="np-signin">Sign In</Link>
            <Link to="/register" className="np-cta">
              Get Started <i className="fa-solid fa-arrow-right"></i>
            </Link>

            <div className="np-lang" ref={langRef}>
              <button
                className="np-lang-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen(!langOpen);
                }}
                type="button"
                aria-label="Language"
              >
                <i className="fa-solid fa-globe"></i>
                <span>{currentLang}</span>
              </button>
              <div className={`np-lang-menu ${langOpen ? 'open' : ''}`}>
                {languages.map((lang) => (
                  <a
                    key={lang.code}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLangSelect(lang);
                    }}
                  >
                    <span className="flg">{lang.flag}</span> {lang.name}
                  </a>
                ))}
              </div>
            </div>

            <button
              className="np-burger"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Open menu"
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className="np-drawer-backdrop"
        onClick={() => setDrawerOpen(false)}
      ></div>
      <aside className="np-drawer" aria-label="Mobile navigation">
        <div className="np-drawer-head">
          <Link to="/" className="np-drawer-logo" onClick={() => setDrawerOpen(false)}>
            <div className="nav-logo-icon">
              <div className="logo-fallback">S</div>
            </div>
            <span>SAFORA</span>
          </Link>
          <button
            className="np-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="np-drawer-body">
          <a href="#aihotels" className="np-drawer-ai" onClick={() => setDrawerOpen(false)}>
            <div className="np-drawer-ai-i"><i className="fa-solid fa-rocket"></i></div>
            <div>
              <div className="np-drawer-ai-t">
                AI Hotels <span className="np-ai-badge">VISION 2027</span>
              </div>
              <div className="np-drawer-ai-d">The future of autonomous hospitality</div>
            </div>
          </a>

          <details className="np-acc">
            <summary>Industries</summary>
            <a href="/industries/hotels/">Hotels</a>
            <a href="/industries/hostels/">Hostels</a>
            <a href="/industries/guesthouses/">Guest Houses</a>
          </details>
          <details className="np-acc">
            <summary>Solutions</summary>
            <a href="/solutions/full-pms/">Full PMS</a>
            <a href="/solutions/channel-manager/">Channel Manager</a>
            <a href="/solutions/booking-engine/">Booking Engine</a>
            <a href="/solutions/whatsapp-bot/">WhatsApp Bot</a>
            <a href="/solutions/qr-guest-service/">QR Guest Service</a>
            <a href="/solutions/loyalty-program/">Loyalty Program</a>
          </details>
          <details className="np-acc">
            <summary>Services</summary>
            <a href="#turnkey">Hotel-as-a-Service</a>
            <a href="#turnkey">AI Hotel Setup</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Custom AI Training</a>
            <a href="mailto:silkroaddreamstour@gmail.com">Consulting</a>
          </details>
          <a
            href="#roadmap"
            className="np-drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            Roadmap
          </a>
          <a
            href="#pricing"
            className="np-drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            Pricing
          </a>

          <div className="np-drawer-langs">
            <div className="np-drawer-lang-h">LANGUAGE</div>
            <div className="np-drawer-lang-row">
              {languages.slice(0, 6).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangSelect(lang)}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="np-drawer-foot">
          <Link to="/login" className="np-drawer-signin" onClick={() => setDrawerOpen(false)}>
            Sign In
          </Link>
          <Link to="/register" className="np-drawer-cta" onClick={() => setDrawerOpen(false)}>
            Get Started <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Navbar;