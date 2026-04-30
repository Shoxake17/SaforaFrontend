// src/pages/register/StepBusinessThree.tsx
import React from 'react';
import type { BusinessType } from '../../types/register';

interface StepBusinessThreeProps {
  businessType: BusinessType | null;
  setBusinessType: (type: BusinessType) => void;
  goStep: (n: number) => void;
}

// ── Business types — bir joyda saqlanadi ─────────────────
const BUSINESS_TYPES = [
  {
    type: 'hotel' as const,
    icon: 'fa-hotel',
    name: 'Hotel',
    desc: 'Full-service hotels with rooms, amenities and staff management',
    iconClass: '',
    checkClass: '',
  },
  {
    type: 'hostel' as const,
    icon: 'fa-bed',
    name: 'Hostel',
    desc: 'Shared and private rooms for budget travelers and backpackers',
    iconClass: 'btype-icon-red',
    checkClass: 'btype-check-red',
  },
  {
    type: 'guest_house' as const,
    icon: 'fa-house-chimney',
    name: 'Guest House',
    desc: 'Cozy accommodation with a personal, home-like experience',
    iconClass: 'btype-icon-warm',
    checkClass: 'btype-check-warm',
  },
];

const StepBusinessThree: React.FC<StepBusinessThreeProps> = ({
  businessType,
  setBusinessType,
  goStep,
}) => (
  <div className="reg-panel">
    <h2 className="reg-panel-title">
      What type of business are you registering?
    </h2>
    <p className="reg-panel-desc">
      Select your business type to customize your experience
    </p>

    <div className="btype-grid">
      {BUSINESS_TYPES.map((b) => (
        <div
          key={b.type}
          data-type={b.type}
          className={`btype-card ${businessType === b.type ? 'selected' : ''}`}
          onClick={() => setBusinessType(b.type)}
        >
          <div className={`btype-icon ${b.iconClass}`}>
            <i className={`fa-solid ${b.icon}`}></i>
          </div>
          <div className="btype-name">{b.name}</div>
          <div className="btype-desc">{b.desc}</div>
          <div className={`btype-check ${b.checkClass}`}>
            <i className="fa-solid fa-check"></i>
          </div>
        </div>
      ))}
    </div>

    <div className="reg-btn-row">
      <button
        type="button"
        className="reg-btn reg-btn-back"
        onClick={() => goStep(1)}
      >
        <i className="fa-solid fa-arrow-left me-1"></i> Back
      </button>
      <button
        type="button"
        className="reg-btn reg-btn-primary"
        onClick={() => goStep(3)}
        disabled={!businessType}
        style={{ flex: 1 }}
      >
        Continue <i className="fa-solid fa-arrow-right ms-2"></i>
      </button>
    </div>
  </div>
);

export default StepBusinessThree;