// src/pages/guest/modals/WifiModal.tsx
import React, { useEffect, useState } from 'react';
import { X, Wifi, Copy, Check, Eye, EyeOff } from 'lucide-react';
import './WifiModal.css';

interface WiFiNetwork {
  network_name: string;
  password: string;
  description?: string;
}

interface WifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  wifiNetworks: WiFiNetwork[];
  accentColor: string;
}

const WifiModal: React.FC<WifiModalProps> = ({
  isOpen,
  onClose,
  wifiNetworks,
  accentColor,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const togglePassword = (idx: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="wf-overlay" onClick={onClose}>
      <div className="wf-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wf-header">
          <div className="wf-header-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
            <Wifi size={22} strokeWidth={2} />
          </div>
          <div className="wf-header-text">
            <h2 className="wf-title">WiFi Networks</h2>
            <p className="wf-subtitle">
              {wifiNetworks.length === 0
                ? 'No networks available'
                : `${wifiNetworks.length} network${wifiNetworks.length > 1 ? 's' : ''} available`}
            </p>
          </div>
          <button type="button" className="wf-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Networks list */}
        <div className="wf-list">
          {wifiNetworks.length === 0 ? (
            <div className="wf-empty">
              <Wifi size={32} strokeWidth={1.5} />
              <p>No WiFi networks</p>
              <small>Hotel manager hasn't added any networks yet</small>
            </div>
          ) : (
            wifiNetworks.map((wifi, idx) => {
              const isCopied = copiedIdx === idx;
              const isVisible = visiblePasswords.has(idx);

              return (
                <div key={idx} className="wf-card">
                  <div className="wf-card-top">
                    <div className="wf-card-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
                      <Wifi size={18} strokeWidth={2.2} />
                    </div>
                    <div className="wf-card-info">
                      <div className="wf-card-name">{wifi.network_name || 'Unnamed network'}</div>
                      {wifi.description && (
                        <div className="wf-card-desc">{wifi.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="wf-row">
                    <div className="wf-row-label">NETWORK</div>
                    <div className="wf-row-value">
                      <span className="wf-row-text">{wifi.network_name}</span>
                      
                    </div>
                  </div>

                  <div className="wf-row">
                    <div className="wf-row-label">PASSWORD</div>
                    <div className="wf-row-value">
                      <span className="wf-row-text wf-password">
                        {isVisible ? wifi.password : '••••••••••'}
                      </span>
                      <button
                        type="button"
                        className="wf-row-action"
                        onClick={() => togglePassword(idx)}
                        style={{ color: accentColor }}
                        aria-label={isVisible ? 'Hide' : 'Show'}
                      >
                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        className="wf-row-action"
                        onClick={() => handleCopy(wifi.password, idx * 2 + 1)}
                        style={copiedIdx === idx * 2 + 1 ? { color: '#16a34a' } : { color: accentColor }}
                        aria-label="Copy password"
                      >
                        {copiedIdx === idx * 2 + 1 ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  
                </div>
              );
            })
          )}
        </div>

        <div className="wf-footer">
          <Wifi size={11} strokeWidth={2.2} style={{ color: accentColor }} />
          Tap copy button to quickly paste in WiFi settings
        </div>
      </div>
    </div>
  );
};

export default WifiModal;