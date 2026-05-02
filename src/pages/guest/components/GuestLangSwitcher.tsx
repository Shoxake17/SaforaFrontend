// src/pages/guest/components/GuestLangSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbek" },
  { code: 'tr', label: 'Türkçe' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
];

const GuestLangSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('guest_lang');
    if (saved && LANGUAGES.find((l) => l.code === saved)) {
      setLang(saved);
    } else {
      // Auto-detect from browser
      const nav = (navigator.language || 'en').toLowerCase();
      const detected = LANGUAGES.find((l) => nav.startsWith(l.code))?.code || 'en';
      setLang(detected);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleOutside);
    }, 10);
    return () => document.removeEventListener('click', handleOutside);
  }, [open]);

  const handleSelect = (code: string) => {
    setLang(code);
    localStorage.setItem('guest_lang', code);
    setOpen(false);
    // TODO: trigger translation reload (will be added in next phase)
  };

  return (
    <div ref={dropRef}>
      <button
        type="button"
        className="guest-lang-btn"
        onClick={() => setOpen(!open)}
        aria-label="Language"
      >
        {lang.toUpperCase()}
      </button>

      {open && (
        <div className="guest-lang-dropdown">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`guest-lang-option ${l.code === lang ? 'active' : ''}`}
              onClick={() => handleSelect(l.code)}
            >
              <span className="guest-lang-code">{l.code.toUpperCase()}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestLangSwitcher;