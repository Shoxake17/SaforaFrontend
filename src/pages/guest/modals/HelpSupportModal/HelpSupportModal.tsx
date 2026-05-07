// src/pages/guest/modals/HelpSupportModal.tsx
import React, { useEffect } from 'react';
import { X, Phone, MessageCircle, Send, Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import type { GuestHotel, GuestSettings } from '@apptypes/guest';
import './HelpSupportModal.css';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: GuestHotel;
  settings: GuestSettings;
  accentColor: string;
}

const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  hotel,
  settings,
  accentColor,
}) => {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const phone = settings.reception_phone?.trim();
  const whatsapp = settings.whatsapp?.trim();
  const telegram = settings.social_media?.telegram?.trim();

  const handlePhoneCall = () => {
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };

  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleaned = whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleaned}`, '_blank');
    }
  };

  const handleTelegram = () => {
    if (telegram) {
      const url = telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace('@', '')}`;
      window.open(url, '_blank');
    }
  };

  const hasAnyContact = phone || whatsapp || telegram;

  return (
    <div className="hs-overlay" onClick={onClose}>
      <div className="hs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="hs-header">
          <div>
            <h2 className="hs-title">Help & Support</h2>
            <p className="hs-subtitle">Contact our hotel team — we're here to help 24/7</p>
          </div>
          <button type="button" className="hs-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Hotel info */}
        <div className="hs-hotel-info" style={{ background: `${accentColor}10` }}>
          <div className="hs-hotel-icon" style={{ background: accentColor }}>
            {hotel.name?.charAt(0).toUpperCase() || 'H'}
          </div>
          <div className="hs-hotel-text">
            <div className="hs-hotel-name">{hotel.name}</div>
            <div className="hs-hotel-loc">
              <MapPin size={11} strokeWidth={2.2} />
              {hotel.city || 'Tashkent'}{hotel.country ? `, ${hotel.country}` : ''}
            </div>
          </div>
        </div>

        {/* Contact methods */}
        <div className="hs-methods">
          {/* PHONE */}
          {phone && (
            <button type="button" className="hs-method" onClick={handlePhoneCall}>
              <div className="hs-method-icon" style={{ background: '#10b98115', color: '#10b981' }}>
                <Phone size={20} strokeWidth={2} />
              </div>
              <div className="hs-method-text">
                <div className="hs-method-title">Phone Call</div>
                <div className="hs-method-value">{phone}</div>
              </div>
              <div className="hs-method-action" style={{ background: '#10b981' }}>
                Call
              </div>
            </button>
          )}

          {/* WHATSAPP */}
          {whatsapp && (
            <button type="button" className="hs-method" onClick={handleWhatsApp}>
              <div className="hs-method-icon" style={{ background: '#25d36615', color: '#25d366' }}>
                <FaWhatsapp size={20} />
              </div>
              <div className="hs-method-text">
                <div className="hs-method-title">WhatsApp</div>
                <div className="hs-method-value">+{whatsapp.replace(/[^0-9]/g, '')}</div>
              </div>
              <div className="hs-method-action" style={{ background: '#25d366' }}>
                Chat
              </div>
            </button>
          )}

          {/* TELEGRAM */}
          {telegram && (
            <button type="button" className="hs-method" onClick={handleTelegram}>
              <div className="hs-method-icon" style={{ background: '#0088cc15', color: '#0088cc' }}>
                <FaTelegramPlane size={20} />
              </div>
              <div className="hs-method-text">
                <div className="hs-method-title">Telegram</div>
                <div className="hs-method-value">
                  {telegram.startsWith('http') ? telegram.replace('https://t.me/', '@') : telegram}
                </div>
              </div>
              <div className="hs-method-action" style={{ background: '#0088cc' }}>
                Open
              </div>
            </button>
          )}

          {/* Empty state */}
          {!hasAnyContact && (
            <div className="hs-empty">
              <Mail size={32} strokeWidth={1.5} />
              <p>No contact info available</p>
              <small>Please ask reception for assistance</small>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="hs-footer">
          <Phone size={11} strokeWidth={2.2} style={{ color: accentColor }} />
          Reception is available 24/7 for any urgent assistance
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;