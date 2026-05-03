// src/pages/register/StepDetailsFour.tsx
import React from 'react';
import PasswordInput from '../../components/UI/PasswordInput';
import type {
  BusinessType,
  ServiceType,
  HotelData,
  ManagerData,
  GoogleUser,
} from '../../types/register';

interface StepDetailsFourProps {
  businessType: BusinessType | null;
  serviceType: ServiceType | null;
  hotelData: HotelData;
  setHotelData: (data: HotelData) => void;
  managerData: ManagerData;
  setManagerData: (data: ManagerData) => void;
  googleUser: GoogleUser | null;

  changePcCount: (delta: number) => void;
  goStep: (n: number) => void;

  photoFiles: File[];
  photoZoneRef: React.RefObject<HTMLDivElement>;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotos: (files: FileList | null) => void;
  removePhoto: (idx: number) => void;

  submitting: boolean;
}

const StepDetailsFour: React.FC<StepDetailsFourProps> = ({
  businessType,
  serviceType,
  hotelData,
  setHotelData,
  managerData,
  setManagerData,
  googleUser,
  changePcCount,
  goStep,
  photoFiles,
  photoZoneRef,
  photoInputRef,
  handlePhotos,
  removePhoto,
  submitting,
}) => {
  const businessLabel =
    businessType === 'hostel'
      ? 'Hostel'
      : businessType === 'guest_house'
      ? 'Guest House'
      : 'Hotel';

  return (
    <div className="reg-panel">
      <h2 className="reg-panel-title">{businessLabel} &amp; Manager Details</h2>
      <p className="reg-panel-desc">Set up your property and admin account</p>

      <div className="reg-fields">
        {/* Business Name */}
        <div className="reg-field">
          <label className="reg-label">
            Business Name <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Grand Palace Hotel"
            value={hotelData.name}
            onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
            required
          />
        </div>

        {/* Country + City */}
        <div className="reg-row">
          <div className="reg-field">
            <label className="reg-label">
              Country <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Uzbekistan"
              value={hotelData.country}
              onChange={(e) => setHotelData({ ...hotelData, country: e.target.value })}
              required
            />
          </div>
          <div className="reg-field">
            <label className="reg-label">
              City <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Tashkent"
              value={hotelData.city}
              onChange={(e) => setHotelData({ ...hotelData, city: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Address */}
        <div className="reg-field">
          <label className="reg-label">
            Street Address <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="123 Amir Temur St."
            value={hotelData.address}
            onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
            required
          />
        </div>

        {/* Phone + Email */}
        <div className="reg-row">
          <div className="reg-field">
            <label className="reg-label">
              Hotel Phone <span className="req">*</span>
            </label>
            <input
              type="tel"
              className="form-control"
              placeholder="+998 90 123 45 67"
              value={hotelData.phone}
              onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
              required
            />
          </div>
          <div className="reg-field">
            <label className="reg-label">Hotel Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="info@hotel.com"
              value={hotelData.email}
              onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
            />
          </div>
        </div>

        {/* House Rules — faqat full service uchun */}
        {serviceType !== 'qr_only' && (
          <div className="reg-field">
            <label className="reg-label">
              House Rules{' '}
              <span className="reg-hint">(shown on check-in document)</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={hotelData.rules}
              onChange={(e) => setHotelData({ ...hotelData, rules: e.target.value })}
            />
          </div>
        )}

        {/* Photos */}
        <div className="reg-field">
          <label className="reg-label">
            Photos <span className="reg-hint">(up to 10 images)</span>
          </label>
          <div
            ref={photoZoneRef}
            className={`photo-upload-zone ${photoFiles.length > 0 ? 'has-photos' : ''}`}
            onClick={() => photoInputRef.current?.click()}
          >
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handlePhotos(e.target.files)}
            />
            <div className="photo-upload-placeholder">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <div>
                Drag &amp; drop images or{' '}
                <span style={{ color: '#f97316', fontWeight: 600 }}>browse</span>
              </div>
              <div style={{ fontSize: 11, color: '#a3a3a3', marginTop: 2 }}>
                JPG, PNG up to 5 MB each
              </div>
            </div>
          </div>

          {photoFiles.length > 0 && (
            <div className="photo-preview-row">
              {photoFiles.map((file, idx) => (
                <div key={idx} className="photo-thumb">
                  <img src={URL.createObjectURL(file)} alt="" />
                  <button
                    type="button"
                    className="photo-thumb-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(idx);
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portal Passwords */}
        <div className="reg-row">
          <div className="reg-field">
            <label className="reg-label">
              Portal Password <span className="req">*</span>
            </label>
            <PasswordInput
              value={hotelData.portal_password}
              onChange={(value) => setHotelData({ ...hotelData, portal_password: value })}
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
            <div className="reg-hint-text">Staff use this to access your portal</div>
          </div>
          <div className="reg-field">
            <label className="reg-label">
              Confirm Portal Password <span className="req">*</span>
            </label>
            <PasswordInput
              value={hotelData.portal_password_confirm}
              onChange={(value) =>
                setHotelData({ ...hotelData, portal_password_confirm: value })
              }
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Reception PCs — faqat full service uchun */}
        {serviceType !== 'qr_only' && (
          <div className="reg-field">
            <label className="reg-label">
              Reception PCs{' '}
              <span className="reg-hint">(workstations at front desk)</span>
            </label>
            <div className="pc-count-wrap">
              <div className="pc-count-info">
                <i className="fa-solid fa-desktop"></i>
                <span>How many computers does your reception have?</span>
              </div>
              <div className="pc-count-control">
                <button type="button" className="pc-count-btn" onClick={() => changePcCount(-1)}>
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={hotelData.reception_pc_count}
                  onChange={(e) =>
                    setHotelData({
                      ...hotelData,
                      reception_pc_count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)),
                    })
                  }
                />
                <button type="button" className="pc-count-btn" onClick={() => changePcCount(1)}>
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              <div className="pc-count-labels">
                {Array.from({ length: hotelData.reception_pc_count }).map((_, i) => (
                  <span key={i} className="pc-label">
                    PC {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(249,115,22,.08)', margin: '8px 0' }}></div>

        {/* Manager section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className="fa-solid fa-user-shield" style={{ color: '#f97316', fontSize: 14 }}></i>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a' }}>
            Manager Account
          </span>
          {googleUser && (
            <span
              style={{
                fontSize: 11,
                color: '#16a34a',
                marginLeft: 'auto',
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-circle-check"></i> Auto-filled from Google
            </span>
          )}
        </div>

        {/* First + Last Name */}
        <div className="reg-row">
          <div className="reg-field">
            <label className="reg-label">
              First Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={managerData.first_name}
              onChange={(e) =>
                setManagerData({ ...managerData, first_name: e.target.value })
              }
              required
            />
          </div>
          <div className="reg-field">
            <label className="reg-label">
              Last Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={managerData.last_name}
              onChange={(e) =>
                setManagerData({ ...managerData, last_name: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* Username */}
        <div className="reg-field">
          <label className="reg-label">
            Username <span className="req">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={managerData.username}
            onChange={(e) =>
              setManagerData({ ...managerData, username: e.target.value })
            }
            required
          />
        </div>

        

        <div className="reg-row">
          <div className="reg-field">
            <label className="reg-label">
              Password{' '}
              {!googleUser && <span className="req">*</span>}
              {googleUser && <span className="reg-hint">(optional)</span>}
            </label>
            <PasswordInput
              value={managerData.password1}
              onChange={(value) => setManagerData({ ...managerData, password1: value })}
              placeholder={googleUser ? 'Password' : ''}
              required={!googleUser}
              autoComplete="new-password"
            />
          </div>
          <div className="reg-field">
            <label className="reg-label">
              Confirm Password{' '}
              {!googleUser && <span className="req">*</span>}
              {googleUser && <span className="reg-hint">(optional)</span>}
            </label>
            <PasswordInput
              value={managerData.password2}
              onChange={(value) => setManagerData({ ...managerData, password2: value })}
              placeholder="Repeat password"
              required={!googleUser}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      {/* Submit buttons */}
      <div className="reg-btn-row">
        <button type="button" className="reg-btn reg-btn-back" onClick={() => goStep(2)}>
          <i className="fa-solid fa-arrow-left me-1"></i> Back
        </button>
        <button
          type="submit"
          className="reg-btn reg-btn-submit"
          disabled={submitting}
          style={{ flex: 1 }}
        >
          {submitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin me-2"></i>
              Creating account...
            </>
          ) : (
            <>
              <i className="fa-solid fa-rocket me-2"></i>
              Create Account &amp; Start
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepDetailsFour;