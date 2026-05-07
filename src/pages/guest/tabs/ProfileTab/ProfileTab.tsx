// src/pages/guest/tabs/ProfileTab/ProfileTab.tsx
import React, { useState } from 'react';
import {
  User, Lock, Globe, FileText,
  Headphones, LogOut, ChevronRight, Camera,
} from 'lucide-react';
import {
  FaInstagram, FaFacebookF, FaTelegramPlane, FaWhatsapp, FaTripadvisor,
} from 'react-icons/fa';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import HelpSupportModal from '../../modals/HelpSupportModal/HelpSupportModal';
import './ProfileTab.css';

interface ProfileTabProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
  guestEmail?: string;
  accentColor: string;
  onLogout?: () => void;
}

const ACCOUNT_SETTINGS = [
  { key: 'personal',  icon: User,     title: 'Personal Information', sub: 'Update your personal details' },
  { key: 'password',  icon: Lock,     title: 'Change Password',      sub: 'Update your password' },
  { key: 'language',  icon: Globe,    title: 'Language',             sub: 'Choose your preferred language' },
  { key: 'terms',     icon: FileText, title: 'Terms & Conditions',   sub: 'Read our terms & conditions' },
];

// ⭐ Social Media platformalari ro'yxati
const SOCIAL_PLATFORMS = [
  { key: 'instagram',        icon: FaInstagram,      color: '#e4405f', label: 'Instagram' },
  { key: 'facebook',         icon: FaFacebookF,      color: '#1877f2', label: 'Facebook' },
  { key: 'telegram',         icon: FaTelegramPlane,  color: '#0088cc', label: 'Telegram' },
  { key: 'whatsapp_channel', icon: FaWhatsapp,       color: '#25d366', label: 'WhatsApp' },
  { key: 'tripadvisor',      icon: FaTripadvisor,    color: '#00af87', label: 'Tripadvisor' },
];

const ProfileTab: React.FC<ProfileTabProps> = ({
  hotel,
  room,
  settings,
  guestName,
  guestEmail,
  accentColor,
  onLogout,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSettingClick = (key: string) => {
    if (key === 'help') {
      setShowHelpModal(true);
    } else {
      console.log(`Setting clicked: ${key}`);
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm('Tizimdan chiqishni tasdiqlaysizmi?')) {
      onLogout?.();
    }
  };

  // ⭐ Social media link'ni tozalash va to'liq URL qaytarish
  const formatSocialUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // ⭐ Social media tap handler
  const handleSocialClick = (url: string) => {
    const formatted = formatSocialUrl(url);
    if (formatted) {
      window.open(formatted, '_blank', 'noopener,noreferrer');
    }
  };

  // ⭐ Faqat to'ldirilgan social media'larni filtrlash
  const activeSocials = SOCIAL_PLATFORMS.filter((platform) => {
    const url = settings.social_media?.[platform.key as keyof typeof settings.social_media];
    return url && String(url).trim().length > 0;
  });

  // Avatar — birinchi harf yoki rasm
  const initial = (guestName || 'G').charAt(0).toUpperCase();
  const displayEmail = guestEmail || `room${room.number}@${hotel.slug}.guest`;

  return (
    <div className="pf-screen">
      
      {/* ═══════════ PROFILE CARD ═══════════ */}
      <div className="pf-card pf-profile-card">
        <div className="pf-profile-row">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar" style={{ background: `${accentColor}20`, color: accentColor }}>
              {initial}
            </div>
            <button type="button" className="pf-avatar-edit" style={{ background: accentColor }}>
              <Camera size={11} strokeWidth={2.4} />
            </button>
          </div>

          <div className="pf-profile-info">
            <h2 className="pf-name">{guestName}</h2>
            <p className="pf-email">{displayEmail}</p>
            <div className="pf-badge" style={{ background: `${accentColor}15`, color: accentColor }}>
              Hotel Guest
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ ACCOUNT SETTINGS ═══════════ */}
      <div className="pf-section-title">Account Settings</div>

      <div className="pf-card pf-list-card">
        {ACCOUNT_SETTINGS.map((setting, idx) => {
          const Icon = setting.icon;
          const isLast = idx === ACCOUNT_SETTINGS.length - 1;
          return (
            <button
              key={setting.key}
              type="button"
              className={`pf-list-item ${isLast ? 'is-last' : ''}`}
              onClick={() => handleSettingClick(setting.key)}
            >
              <div className="pf-list-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="pf-list-text">
                <div className="pf-list-title">{setting.title}</div>
                <div className="pf-list-sub">{setting.sub}</div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="pf-list-arrow" />
            </button>
          );
        })}
      </div>

      {/* ═══════════ HELP & SUPPORT — alohida card ═══════════ */}
      <button
        type="button"
        className="pf-card pf-help-card"
        onClick={() => setShowHelpModal(true)}
      >
        <div className="pf-list-icon" style={{ color: accentColor }}>
          <Headphones size={20} strokeWidth={2} />
        </div>
        <div className="pf-list-text">
          <div className="pf-list-title">Help & Support</div>
          <div className="pf-list-sub">Get help and support</div>
        </div>
        <ChevronRight size={16} strokeWidth={2.2} className="pf-list-arrow" />
      </button>

      {/* ═══════════ ⭐ SOCIAL MEDIA ICONS — YANGI ═══════════ */}
      {activeSocials.length > 0 && (
        <>
          <div className="pf-section-title pf-social-title">Follow Us</div>
          <div className="pf-card pf-social-card">
            <div className="pf-social-grid">
              {activeSocials.map((platform) => {
                const Icon = platform.icon;
                const url = settings.social_media?.[
                  platform.key as keyof typeof settings.social_media
                ] as string;

                return (
                  <button
                    key={platform.key}
                    type="button"
                    className="pf-social-btn"
                    onClick={() => handleSocialClick(url)}
                    aria-label={`Open ${platform.label}`}
                  >
                    <div
                      className="pf-social-icon"
                      style={{
                        background: `${platform.color}15`,
                        color: platform.color,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="pf-social-label">{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ LOGOUT ═══════════ */}
      <button
        type="button"
        className="pf-logout-btn"
        style={{ color: accentColor, borderColor: `${accentColor}30` }}
        onClick={handleLogoutClick}
      >
        <LogOut size={16} strokeWidth={2.2} />
        Log Out
      </button>

      {/* ═══════════ HELP MODAL ═══════════ */}
      {showHelpModal && (
        <HelpSupportModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          hotel={hotel}
          settings={settings}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

export default ProfileTab;