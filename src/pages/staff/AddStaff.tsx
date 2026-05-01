// src/pages/staff/AddStaff.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  UserPlus,
  ArrowLeft,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  X,
  Check,
  IdCard,
} from 'lucide-react';
import './AddStaff.css';

import useAuth from '@hooks/useAuth';
import { fetchHotelBySlug } from '@services/auth';
import { addStaff } from '@services/staff';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';

const ROLE_OPTIONS = ['Receptionist', 'Housekeeping', 'Restaurant', 'Other'];

const AddStaff: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();

  const {
    hotel: contextHotel,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();

  const [hotel, setHotel] = useState(contextHotel);
  const [hotelLoading, setHotelLoading] = useState(!contextHotel);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('Receptionist');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, slug, roleKey, navigate]);

  useEffect(() => {
    if (contextHotel) {
      setHotel(contextHotel);
      setHotelLoading(false);
      return;
    }
    if (slug && isAuthenticated) {
      fetchHotelBySlug(slug).then((r) => {
        if (r.success && r.hotel) setHotel(r.hotel);
        setHotelLoading(false);
      });
    }
  }, [contextHotel, slug, isAuthenticated]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Rasm hajmi 5MB dan katta bo\'lmasligi kerak');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password.trim()) {
      setError('Asosiy maydonlarni to\'ldiring');
      return;
    }
    if (password.length < 8) {
      setError('Parol kamida 8 belgili bo\'lishi kerak');
      return;
    }
    if (password !== confirmPassword) {
      setError('Parollar mos kelmadi');
      return;
    }
    if (!slug) return;

    setSubmitting(true);
    const result = await addStaff({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim(),
      password,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role_label: roleLabel,
      address: address.trim() || undefined,
      hotel_slug: slug,
      profile_photo: photo,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/portal/${slug}/${roleKey}/staff`);
      }, 1200);
    } else {
      setError(result.error || 'Xatolik yuz berdi');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(`/portal/${slug}`, { replace: true });
  };

  const handleNavChange = (key: string) => {
    if (key === 'dashboard') navigate(`/portal/${slug}/${roleKey}/dashboard`);
    if (key === 'staff') navigate(`/portal/${slug}/${roleKey}/staff`);
  };

  if (authLoading || hotelLoading) {
    return (
      <div className="as-loading">
        <Loader2 size={36} color={config.badgeColor} className="as-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="as-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav="staff"
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="as-main">
        <MainLayout hotel={hotel} />

        <div className="as-content">
          <div className="as-topbar">
            <div className="as-topbar-left">
              <h1 className="as-title">
                <UserPlus
                  size={22}
                  strokeWidth={2.2}
                  style={{ color: config.badgeColor, marginRight: 10 }}
                />
                Add Staff Member
              </h1>
              <p className="as-subtitle">
                New staff will be assigned to your department
              </p>
            </div>

            <Link
              to={`/portal/${slug}/${roleKey}/staff`}
              className="as-back-btn"
            >
              <ArrowLeft size={14} strokeWidth={2.4} />
              <span>Back</span>
            </Link>
          </div>

          <div className="as-form-wrapper">
            {success && (
              <div className="as-alert as-alert-success">
                <Check size={16} strokeWidth={2.4} />
                <span>Staff member added successfully! Redirecting...</span>
              </div>
            )}

            {error && !success && (
              <div className="as-alert as-alert-error">
                <X size={16} strokeWidth={2.4} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="as-form" autoComplete="off">
              <div className="as-form-header">
                <div
                  className="as-form-avatar"
                  style={{
                    background: `${config.badgeColor}20`,
                    border: `1px solid ${config.badgeColor}40`,
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" />
                  ) : (
                    <User size={28} strokeWidth={2} color={config.badgeColor} />
                  )}
                </div>
                <h2 className="as-form-title">New Staff Member</h2>
              </div>

              <div className="as-photo-actions-row">
                <label
                  className="as-btn-upload"
                  style={{
                    background: `${config.badgeColor}15`,
                    color: config.badgeColor,
                    border: `1px solid ${config.badgeColor}40`,
                  }}
                >
                  <Camera size={14} strokeWidth={2.2} />
                  <span>{photo ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>
                {photo && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="as-btn-remove"
                  >
                    <X size={14} strokeWidth={2.2} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div className="as-section-label" style={{ color: config.badgeColor }}>
                <IdCard size={13} strokeWidth={2.2} />
                <span>PERSONAL INFORMATION</span>
              </div>

              <div className="as-grid">
                <Field
                  label="First Name *"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Fotima"
                  required
                />
                <Field
                  label="Last Name *"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Bek"
                  required
                />
              </div>

              <div className="as-field-full">
                <Field
                  label="Username *"
                  value={username}
                  onChange={setUsername}
                  placeholder="fotima_bek"
                  required
                />
              </div>

              <div className="as-grid">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="example@email.com"
                  iconLeft={<Mail size={14} strokeWidth={2.2} />}
                />
                <Field
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="901234567"
                  iconLeft={<Phone size={14} strokeWidth={2.2} />}
                />
              </div>

              <div className="as-field-full">
                <Field
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Tashkent, Uzbekistan"
                  iconLeft={<MapPin size={14} strokeWidth={2.2} />}
                />
              </div>

              <div className="as-section-label" style={{ color: config.badgeColor }}>
                <Briefcase size={13} strokeWidth={2.2} />
                <span>ROLE & DEPARTMENT</span>
              </div>

              <div className="as-role-grid">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`as-role-pill ${roleLabel === opt ? 'as-active' : ''}`}
                    onClick={() => setRoleLabel(opt)}
                    style={
                      roleLabel === opt
                        ? {
                            background: `${config.badgeColor}20`,
                            borderColor: config.badgeColor,
                            color: config.badgeColor,
                          }
                        : undefined
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="as-section-label" style={{ color: config.badgeColor }}>
                <Lock size={13} strokeWidth={2.2} />
                <span>PASSWORD</span>
              </div>

              <div className="as-grid">
                <Field
                  label="Password *"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Min. 8 characters"
                  required
                />
                <Field
                  label="Confirm Password *"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <div className="as-password-hint" style={{ color: config.badgeColor }}>
                <Lock size={12} strokeWidth={2.2} />
                <span>At least 8 characters • Not too common • Can't be entirely numeric</span>
              </div>

              <div className="as-actions">
                <Link
                  to={`/portal/${slug}/${roleKey}/staff`}
                  className="as-btn-cancel"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="as-btn-submit"
                  disabled={submitting || success}
                  style={{
                    background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="as-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} strokeWidth={2.4} />
                      <span>Add Staff Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  iconLeft?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChange, placeholder, type = 'text', required, iconLeft,
}) => (
  <div className="as-field">
    <label className="as-label">{label}</label>
    <div className={`as-input-wrap ${iconLeft ? 'has-icon' : ''}`}>
      {iconLeft && <span className="as-input-icon">{iconLeft}</span>}
      <input
        className="as-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
    </div>
  </div>
);

export default AddStaff;