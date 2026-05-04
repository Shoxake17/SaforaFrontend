// src/pages/staff/AddStaff.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

import { addStaff } from '@services/staff';
import { getRoleConfig } from '@config/roles';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout/PortalLayout';

const ROLE_OPTIONS = ['Receptionist', 'Housekeeping', 'Restaurant', 'Other'];

const AddStaff: React.FC = () => {
  const navigate = useNavigate();
  const { slug, roleKey, role } = useAuthGuard();
  const config = getRoleConfig(role);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Rasm hajmi 5MB dan katta bo'lmasligi kerak");
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
      setError("Asosiy maydonlarni to'ldiring");
      return;
    }
    if (password.length < 8) {
      setError("Parol kamida 8 belgili bo'lishi kerak");
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

  return (
    <PortalLayout
      activeNav="staff"
      contentClassName="as-content"
      rootClassName="as-root"
      mainClassName="as-main"
    >
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
              placeholder="Shoxrux"
              required
            />
            <Field
              label="Last Name *"
              value={lastName}
              onChange={setLastName}
              placeholder="Turaxonov"
              required
            />
          </div>

          <div className="as-field-full">
            <Field
              label="Username *"
              value={username}
              onChange={setUsername}
              placeholder="shoxrux_developer"
              required
            />
          </div>

          <div className="as-grid">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="example@gmail.com"
              iconLeft={<Mail size={14} strokeWidth={2.2} />}
            />
            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="+998901234567"
              iconLeft={<Phone size={14} strokeWidth={2.2} />}
            />
          </div>

          <div className="as-field-full">
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Tashkent"
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
            <span>
              At least 8 characters • Not too common • Can't be entirely numeric
            </span>
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
    </PortalLayout>
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
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  iconLeft,
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