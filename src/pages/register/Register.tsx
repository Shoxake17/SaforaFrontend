import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './Register.css';
import {
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  CircleCheck,
  CircleAlert,
  Hotel,
  QrCode,
  Bed,
  Home,
  CloudUpload,
  X,
  Monitor,
  Minus,
  Plus,
  UserCheck,
  Rocket,
  Loader2,
  Zap,
  ShieldCheck,
  Bot,
  Headphones,
} from 'lucide-react';
// Backend URL (Vite proxy ishlatamiz, shuning uchun bo'sh)
const API_BASE = '';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
interface GoogleUser {
  email: string;
  googleId: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
}

interface HotelData {
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  rules: string;
  portal_password: string;
  portal_password_confirm: string;
  reception_pc_count: number;
}

interface ManagerData {
  first_name: string;
  last_name: string;
  username: string;
  password1: string;
  password2: string;
}

// ═══════════════════════════════════════════════════════
// 🔒 PasswordInput — Password input + eye toggle
// ═══════════════════════════════════════════════════════
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
  required,
  autoComplete = 'new-password',
}) => {
  const [show, setShow] = useState(false);

    return (
    <div className="password-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        className="form-control password-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow(!show)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </button>
    </div>
  );
};

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();

  // ═══════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0 — Account
  const [email, setEmail] = useState('');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  // Step 1 — Service Type
  const [serviceType, setServiceType] = useState<'full' | 'qr_only' | null>(null);

  // Step 2 — Business Type
  const [businessType, setBusinessType] = useState<'hotel' | 'hostel' | 'guest_house' | null>(null);

  // Step 3 — Business + Manager
  const [hotelData, setHotelData] = useState<HotelData>({
    name: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    rules: '',
    portal_password: '',
    portal_password_confirm: '',
    reception_pc_count: 1,
  });
  const [managerData, setManagerData] = useState<ManagerData>({
    first_name: '',
    last_name: '',
    username: '',
    password1: '',
    password2: '',
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoZoneRef = useRef<HTMLDivElement>(null);

  // Submit
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ═══════════════════════════════════════════════════════
  // Google OAuth — query parametrlarni qabul qilish
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const googleEmail = searchParams.get('google_email');
    const googleId = searchParams.get('google_id');
    const firstName = searchParams.get('first_name');
    const lastName = searchParams.get('last_name');
    const photo = searchParams.get('photo');
    const error = searchParams.get('error');

    if (error) {
      setFormError(
        error === 'google_failed'
          ? 'Google bilan kirish bekor qilindi'
          : 'Tizimda xatolik. Qaytadan urinib ko\'ring.'
      );
      return;
    }

    if (googleEmail && googleId) {
      setGoogleUser({
        email: googleEmail,
        googleId,
        firstName: firstName || '',
        lastName: lastName || '',
        photo: photo || '',
      });
      setEmail(googleEmail);
      setManagerData((prev) => ({
        ...prev,
        first_name: firstName || '',
        last_name: lastName || '',
        username: googleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, ''),
      }));
    }
  }, [searchParams]);

  // ═══════════════════════════════════════════════════════
  // Step navigation
  // ═══════════════════════════════════════════════════════
  const goStep = (n: number) => {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ═══════════════════════════════════════════════════════
  // Photo upload
  // ═══════════════════════════════════════════════════════
  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const newFiles = [...photoFiles];
    for (let i = 0; i < files.length && newFiles.length < 10; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      newFiles.push(file);
    }
    setPhotoFiles(newFiles);
  };

  const removePhoto = (idx: number) => {
    const newFiles = [...photoFiles];
    newFiles.splice(idx, 1);
    setPhotoFiles(newFiles);
  };

  useEffect(() => {
    const zone = photoZoneRef.current;
    if (!zone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    };
    const handleDragLeave = () => zone.classList.remove('drag-over');
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handlePhotos(e.dataTransfer?.files || null);
    };

    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    return () => {
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, [currentStep, photoFiles]);

  // ═══════════════════════════════════════════════════════
  // PC count
  // ═══════════════════════════════════════════════════════
  const changePcCount = (delta: number) => {
    setHotelData((prev) => ({
      ...prev,
      reception_pc_count: Math.max(1, Math.min(20, prev.reception_pc_count + delta)),
    }));
  };

  // ═══════════════════════════════════════════════════════
  // Form validation (Step 3)
  // ═══════════════════════════════════════════════════════
  const validateStep3 = (): string | null => {
    if (!hotelData.name.trim()) return 'Business name kiritilishi shart';
    if (!hotelData.country.trim()) return 'Country kiritilishi shart';
    if (!hotelData.city.trim()) return 'City kiritilishi shart';
    if (!hotelData.address.trim()) return 'Address kiritilishi shart';
    if (!hotelData.phone.trim()) return 'Hotel phone kiritilishi shart';

    if (!hotelData.portal_password) return 'Portal password kiritilishi shart';
    if (hotelData.portal_password.length < 6) return 'Portal password kamida 6 belgi bo\'lishi kerak';
    if (hotelData.portal_password !== hotelData.portal_password_confirm) {
      return 'Portal parollar mos kelmayapti';
    }

    if (!managerData.first_name.trim()) return 'First name kiritilishi shart';
    if (!managerData.last_name.trim()) return 'Last name kiritilishi shart';
    if (!managerData.username.trim()) return 'Username kiritilishi shart';

    if (!googleUser) {
      if (!managerData.password1) return 'Password kiritilishi shart';
      if (managerData.password1.length < 6) return 'Password kamida 6 belgi bo\'lishi kerak';
      if (managerData.password1 !== managerData.password2) {
        return 'Manager parollar mos kelmayapti';
      }
    }

    return null;
  };

  // ═══════════════════════════════════════════════════════
  // Final submit — MongoDB ga saqlash
  // ═══════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validatsiya
    const validationError = validateStep3();
    if (validationError) {
      setFormError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setFormError('');

    const formData = new FormData();

    // Service & Business types
    formData.append('service_type', serviceType || '');
    formData.append('business_type', businessType || '');

    // Hotel data — har bir maydonni ALOHIDA qo'shamiz
    formData.append('name', hotelData.name);
    formData.append('country', hotelData.country);
    formData.append('city', hotelData.city);
    formData.append('address', hotelData.address);
    formData.append('phone', hotelData.phone);
    formData.append('hotel_email', hotelData.email || '');
    formData.append('rules', hotelData.rules || '');
    formData.append('portal_password', hotelData.portal_password);
    formData.append('portal_password_confirm', hotelData.portal_password_confirm);
    formData.append('reception_pc_count', String(hotelData.reception_pc_count));

    // Manager data
    formData.append('first_name', managerData.first_name);
    formData.append('last_name', managerData.last_name);
    formData.append('username', managerData.username);
    if (managerData.password1) formData.append('password1', managerData.password1);
    if (managerData.password2) formData.append('password2', managerData.password2);

    // User email
    formData.append('email', email || googleUser?.email || '');

    // Google ma'lumotlari
    if (googleUser) {
      formData.append('google_id', googleUser.googleId);
      formData.append('photo', googleUser.photo || '');
    }

    // Photo files
    photoFiles.forEach((f) => formData.append('hotel_images', f));

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('safora_token', data.token);
        }
        window.location.href = '/dashboard';
      } else {
        setFormError(data.error || 'Ro\'yxatdan o\'tishda xatolik');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setFormError('Tarmoq xatosi. Qaytadan urinib ko\'ring.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════
  const renderSteps = () => (
    <div className="reg-steps">
      {[0, 1, 2, 3].map((idx) => (
        <React.Fragment key={idx}>
          <div className={`reg-step-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'done' : ''}`}>
            <div className="reg-step-num">
              {idx < currentStep ? (
                <i className="fa-solid fa-check" style={{ fontSize: 10 }}></i>
              ) : (
                idx + 1
              )}
            </div>
            <span>{['Account', 'Service', 'Business Type', 'Details'][idx]}</span>
          </div>
          {idx < 3 && <div className={`reg-step-line ${idx < currentStep ? 'done' : ''}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );

  return (
    <div className="reg-page">
      <div className="reg-bg">
        <div className="reg-bg-shape reg-bg-1"></div>
        <div className="reg-bg-shape reg-bg-2"></div>
        <div className="reg-bg-shape reg-bg-3"></div>
        <div className="reg-3d-shape reg-3d-1"></div>
        <div className="reg-3d-shape reg-3d-2"></div>
      </div>

      <div className="reg-container">
        <div className="reg-header">
          <img src="/logo.png" alt="Safora" className="reg-logo" />
          <h1 className="reg-title">Register Your Business</h1>
          <p className="reg-subtitle">Get started in under 2 minutes — free setup, no credit card</p>
        </div>

        {renderSteps()}

        {formError && (
          <div className="reg-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ═══════════════════════════════════════════════════════
              STEP 0 — Account
          ═══════════════════════════════════════════════════════ */}
          {currentStep === 0 && (
            <div className="reg-panel">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div className="reg-step-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
              </div>
              <h2 className="reg-panel-title" style={{ textAlign: 'center' }}>Create Your Account</h2>
              <p className="reg-panel-desc" style={{ textAlign: 'center' }}>Start with your email or Google account</p>

              {googleUser ? (
                <>
                  <div className="reg-google-verified">
                    <GoogleIcon />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                        Google account verified
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{googleUser.email}</div>
                    </div>
                    <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: 18 }}></i>
                  </div>
                  <button type="button" className="reg-btn reg-btn-primary" onClick={() => goStep(1)}>
                    Continue <i className="fa-solid fa-arrow-right ms-2"></i>
                  </button>
                </>
              ) : (
                <>
                  <a href="http://localhost:5000/auth/google/login?flow=register" className="google-signup-btn">
                    <GoogleIcon />
                    Sign up with Google
                  </a>

                  <div className="reg-divider">
                    <span>or enter your email</span>
                  </div>

                  <div className="reg-fields">
                    <div className="reg-field">
                      <label className="reg-label">
                        Email Address <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="reg-btn reg-btn-primary"
                    onClick={() => email && goStep(1)}
                    disabled={!email}
                    style={{ marginTop: 20 }}
                  >
                    Continue <i className="fa-solid fa-arrow-right ms-2"></i>
                  </button>
                </>
              )}

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link to="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
                  Already have an account?{' '}
                  <span style={{ color: '#f97316', fontWeight: 600 }}>Sign in</span>
                </Link>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 1 — Service Type
          ═══════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="reg-panel">
              <h2 className="reg-panel-title">What service do you need?</h2>
              <p className="reg-panel-desc">Choose the plan that fits your business</p>

              <div className="stype-grid">
                <div className={`stype-card ${serviceType === 'full' ? 'selected' : ''}`} onClick={() => setServiceType('full')}>
                  <div className="stype-ribbon">Most Popular</div>
                  <div className="stype-icon"><i className="fa-solid fa-hotel"></i></div>
                  <div className="stype-name">Full Channel Manager</div>
                  <div className="stype-desc">
                    Complete hotel management system — reservations, front desk, housekeeping, staff management, AI operator, reports &amp; analytics
                  </div>
                  <div className="stype-features">
                    {['Full PMS Dashboard', 'Reservations & Calendar', 'Staff & Department Management', 'QR Room Services', 'AI Operator & Reports', 'HotelNet & City Ledger'].map((f) => (
                      <div key={f} className="stype-feat"><i className="fa-solid fa-check"></i> {f}</div>
                    ))}
                  </div>
                  <div className="stype-check"><i className="fa-solid fa-check"></i></div>
                </div>

                <div className={`stype-card stype-card-qr ${serviceType === 'qr_only' ? 'selected' : ''}`} onClick={() => setServiceType('qr_only')}>
                  <div className="stype-icon stype-icon-purple"><i className="fa-solid fa-qrcode"></i></div>
                  <div className="stype-name">QR Service Only</div>
                  <div className="stype-desc">
                    Smart QR codes for rooms — guests scan to order services, send requests, chat with reception, and call staff instantly
                  </div>
                  <div className="stype-features">
                    {['QR Code Dashboard', 'Guest Room Portal', 'Service Orders & Requests', 'Real-time Notifications', 'Receptionist Management', 'Quick & Lightweight Setup'].map((f) => (
                      <div key={f} className="stype-feat"><i className="fa-solid fa-check"></i> {f}</div>
                    ))}
                  </div>
                  <div className="stype-check stype-check-purple"><i className="fa-solid fa-check"></i></div>
                </div>
              </div>

              <div className="reg-btn-row">
                <button type="button" className="reg-btn reg-btn-back" onClick={() => goStep(0)}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button type="button" className="reg-btn reg-btn-primary" onClick={() => goStep(2)} disabled={!serviceType} style={{ flex: 1 }}>
                  Continue <i className="fa-solid fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2 — Business Type
          ═══════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="reg-panel">
              <h2 className="reg-panel-title">What type of business are you registering?</h2>
              <p className="reg-panel-desc">Select your business type to customize your experience</p>

              <div className="btype-grid">
                {[
                  { type: 'hotel' as const, icon: 'fa-hotel', name: 'Hotel', desc: 'Full-service hotels with rooms, amenities and staff management', iconClass: '', checkClass: '' },
                  { type: 'hostel' as const, icon: 'fa-bed', name: 'Hostel', desc: 'Shared and private rooms for budget travelers and backpackers', iconClass: 'btype-icon-red', checkClass: 'btype-check-red' },
                  { type: 'guest_house' as const, icon: 'fa-house-chimney', name: 'Guest House', desc: 'Cozy accommodation with a personal, home-like experience', iconClass: 'btype-icon-warm', checkClass: 'btype-check-warm' },
                ].map((b) => (
                  <div key={b.type} data-type={b.type} className={`btype-card ${businessType === b.type ? 'selected' : ''}`} onClick={() => setBusinessType(b.type)}>
                    <div className={`btype-icon ${b.iconClass}`}><i className={`fa-solid ${b.icon}`}></i></div>
                    <div className="btype-name">{b.name}</div>
                    <div className="btype-desc">{b.desc}</div>
                    <div className={`btype-check ${b.checkClass}`}><i className="fa-solid fa-check"></i></div>
                  </div>
                ))}
              </div>

              <div className="reg-btn-row">
                <button type="button" className="reg-btn reg-btn-back" onClick={() => goStep(1)}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button type="button" className="reg-btn reg-btn-primary" onClick={() => goStep(3)} disabled={!businessType} style={{ flex: 1 }}>
                  Continue <i className="fa-solid fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3 — Hotel + Manager Details (FINAL)
          ═══════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="reg-panel">
              <h2 className="reg-panel-title">
                {businessType === 'hostel' ? 'Hostel' : businessType === 'guest_house' ? 'Guest House' : 'Hotel'} &amp; Manager Details
              </h2>
              <p className="reg-panel-desc">Set up your property and admin account</p>

              <div className="reg-fields">
                <div className="reg-field">
                  <label className="reg-label">Business Name <span className="req">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g. Grand Palace Hotel" value={hotelData.name} onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })} required />
                </div>

                <div className="reg-row">
                  <div className="reg-field">
                    <label className="reg-label">Country <span className="req">*</span></label>
                    <input type="text" className="form-control" placeholder="Uzbekistan" value={hotelData.country} onChange={(e) => setHotelData({ ...hotelData, country: e.target.value })} required />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">City <span className="req">*</span></label>
                    <input type="text" className="form-control" placeholder="Tashkent" value={hotelData.city} onChange={(e) => setHotelData({ ...hotelData, city: e.target.value })} required />
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Street Address <span className="req">*</span></label>
                  <input type="text" className="form-control" placeholder="123 Amir Temur St." value={hotelData.address} onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })} required />
                </div>

                <div className="reg-row">
                  <div className="reg-field">
                    <label className="reg-label">Hotel Phone <span className="req">*</span></label>
                    <input type="tel" className="form-control" placeholder="+998 90 123 45 67" value={hotelData.phone} onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })} required />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Hotel Email</label>
                    <input type="email" className="form-control" placeholder="info@hotel.com" value={hotelData.email} onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })} />
                  </div>
                </div>

                {serviceType !== 'qr_only' && (
                  <div className="reg-field">
                    <label className="reg-label">House Rules <span className="reg-hint">(shown on check-in document)</span></label>
                    <textarea className="form-control" rows={3} value={hotelData.rules} onChange={(e) => setHotelData({ ...hotelData, rules: e.target.value })} />
                  </div>
                )}

                <div className="reg-field">
                  <label className="reg-label">Photos <span className="reg-hint">(up to 10 images)</span></label>
                  <div ref={photoZoneRef} className={`photo-upload-zone ${photoFiles.length > 0 ? 'has-photos' : ''}`} onClick={() => photoInputRef.current?.click()}>
                    <input ref={photoInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotos(e.target.files)} />
                    <div className="photo-upload-placeholder">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <div>Drag &amp; drop images or <span style={{ color: '#f97316', fontWeight: 600 }}>browse</span></div>
                      <div style={{ fontSize: 11, color: '#a3a3a3', marginTop: 2 }}>JPG, PNG up to 5 MB each</div>
                    </div>
                  </div>
                  {photoFiles.length > 0 && (
                    <div className="photo-preview-row">
                      {photoFiles.map((file, idx) => (
                        <div key={idx} className="photo-thumb">
                          <img src={URL.createObjectURL(file)} alt="" />
                          <button type="button" className="photo-thumb-remove" onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}>
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ═══════════════════════════════════════════
                    PORTAL PASSWORDS (eye toggle bilan)
                ═══════════════════════════════════════════ */}
                <div className="reg-row">
                  <div className="reg-field">
                    <label className="reg-label">Portal Password <span className="req">*</span></label>
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
                    <label className="reg-label">Confirm Portal Password <span className="req">*</span></label>
                    <PasswordInput
                      value={hotelData.portal_password_confirm}
                      onChange={(value) => setHotelData({ ...hotelData, portal_password_confirm: value })}
                      placeholder="Repeat password"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {serviceType !== 'qr_only' && (
                  <div className="reg-field">
                    <label className="reg-label">Reception PCs <span className="reg-hint">(workstations at front desk)</span></label>
                    <div className="pc-count-wrap">
                      <div className="pc-count-info">
                        <i className="fa-solid fa-desktop"></i>
                        <span>How many computers does your reception have?</span>
                      </div>
                      <div className="pc-count-control">
                        <button type="button" className="pc-count-btn" onClick={() => changePcCount(-1)}>
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <input type="number" min={1} max={20} value={hotelData.reception_pc_count} onChange={(e) => setHotelData({ ...hotelData, reception_pc_count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })} />
                        <button type="button" className="pc-count-btn" onClick={() => changePcCount(1)}>
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                      <div className="pc-count-labels">
                        {Array.from({ length: hotelData.reception_pc_count }).map((_, i) => (
                          <span key={i} className="pc-label">PC {i + 1}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(249,115,22,.08)', margin: '8px 0' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <i className="fa-solid fa-user-shield" style={{ color: '#f97316', fontSize: 14 }}></i>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a' }}>Manager Account</span>
                  {googleUser && (
                    <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto', fontWeight: 600 }}>
                      <i className="fa-solid fa-circle-check"></i> Auto-filled from Google
                    </span>
                  )}
                </div>

                <div className="reg-row">
                  <div className="reg-field">
                    <label className="reg-label">First Name <span className="req">*</span></label>
                    <input type="text" className="form-control" value={managerData.first_name} onChange={(e) => setManagerData({ ...managerData, first_name: e.target.value })} required />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Last Name <span className="req">*</span></label>
                    <input type="text" className="form-control" value={managerData.last_name} onChange={(e) => setManagerData({ ...managerData, last_name: e.target.value })} required />
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Username <span className="req">*</span></label>
                  <input type="text" className="form-control" value={managerData.username} onChange={(e) => setManagerData({ ...managerData, username: e.target.value })} required />
                </div>

                {/* ═══════════════════════════════════════════
                    MANAGER PASSWORDS (eye toggle bilan)
                    Faqat Google emas bo'lsa ko'rsatamiz
                ═══════════════════════════════════════════ */}
                {!googleUser && (
                  <div className="reg-row">
                    <div className="reg-field">
                      <label className="reg-label">Password <span className="req">*</span></label>
                      <PasswordInput
                        value={managerData.password1}
                        onChange={(value) => setManagerData({ ...managerData, password1: value })}
                        placeholder="At least 6 characters"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="reg-field">
                      <label className="reg-label">Confirm Password <span className="req">*</span></label>
                      <PasswordInput
                        value={managerData.password2}
                        onChange={(value) => setManagerData({ ...managerData, password2: value })}
                        placeholder="Repeat password"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="reg-btn-row">
                <button type="button" className="reg-btn reg-btn-back" onClick={() => goStep(2)}>
                  <i className="fa-solid fa-arrow-left me-1"></i> Back
                </button>
                <button type="submit" className="reg-btn reg-btn-submit" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin me-2"></i> Creating account...</>
                  ) : (
                    <><i className="fa-solid fa-rocket me-2"></i> Create Account &amp; Start</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="reg-footer-link">
          <Link to="/"><i className="fa-solid fa-arrow-left me-1"></i> Back to portal</Link>
        </div>

        <div className="reg-features">
          <div className="reg-feat"><i className="fa-solid fa-bolt"></i> Quick 2-min setup</div>
          <div className="reg-feat"><i className="fa-solid fa-shield-halved"></i> Secure &amp; private</div>
          <div className="reg-feat"><i className="fa-solid fa-robot"></i> AI-powered tools</div>
          <div className="reg-feat"><i className="fa-solid fa-headset"></i> 24/7 support</div>
        </div>
      </div>
    </div>
  );
};

export default Register;