// src/pages/StepServiceTwo.tsx
import React from 'react';
import type { ServiceType } from '../../types/register';

interface StepServiceTwoProps {
  serviceType: ServiceType | null;
  setServiceType: (type: ServiceType) => void;
  goStep: (n: number) => void;
}

const StepServiceTwo: React.FC<StepServiceTwoProps> = ({
  serviceType,
  setServiceType,
  goStep,
}) => (
  <div className="reg-panel">
    <h2 className="reg-panel-title">What service do you need?</h2>
    <p className="reg-panel-desc">Choose the plan that fits your business</p>

    <div className="stype-grid">
      {/* Full Channel Manager */}
      <div
        className={`stype-card ${serviceType === 'full' ? 'selected' : ''}`}
        onClick={() => setServiceType('full')}
      >
        <div className="stype-ribbon">Most Popular</div>
        <div className="stype-icon">
          <i className="fa-solid fa-hotel"></i>
        </div>
        <div className="stype-name">Full Channel Manager</div>
        <div className="stype-desc">
          Complete hotel management system — reservations, front desk,
          housekeeping, staff management, AI operator, reports &amp; analytics
        </div>
        <div className="stype-features">
          {[
            'Full PMS Dashboard',
            'Reservations & Calendar',
            'Staff & Department Management',
            'QR Room Services',
            'AI Operator & Reports',
            'HotelNet & City Ledger',
          ].map((f) => (
            <div key={f} className="stype-feat">
              <i className="fa-solid fa-check"></i> {f}
            </div>
          ))}
        </div>
        <div className="stype-check">
          <i className="fa-solid fa-check"></i>
        </div>
      </div>

      {/* QR Only */}
      <div
        className={`stype-card stype-card-qr ${serviceType === 'qr_only' ? 'selected' : ''}`}
        onClick={() => setServiceType('qr_only')}
      >
        <div className="stype-icon stype-icon-purple">
          <i className="fa-solid fa-qrcode"></i>
        </div>
        <div className="stype-name">QR Service Only</div>
        <div className="stype-desc">
          Smart QR codes for rooms — guests scan to order services, send
          requests, chat with reception, and call staff instantly
        </div>
        <div className="stype-features">
          {[
            'QR Code Dashboard',
            'Guest Room Portal',
            'Service Orders & Requests',
            'Real-time Notifications',
            'Receptionist Management',
            'Quick & Lightweight Setup',
          ].map((f) => (
            <div key={f} className="stype-feat">
              <i className="fa-solid fa-check"></i> {f}
            </div>
          ))}
        </div>
        <div className="stype-check stype-check-purple">
          <i className="fa-solid fa-check"></i>
        </div>
      </div>
    </div>

    <div className="reg-btn-row">
      <button
        type="button"
        className="reg-btn reg-btn-back"
        onClick={() => goStep(0)}
      >
        <i className="fa-solid fa-arrow-left me-1"></i> Back
      </button>
      <button
        type="button"
        className="reg-btn reg-btn-primary"
        onClick={() => goStep(2)}
        disabled={!serviceType}
        style={{ flex: 1 }}
      >
        Continue <i className="fa-solid fa-arrow-right ms-2"></i>
      </button>
    </div>
  </div>
);

export default StepServiceTwo;