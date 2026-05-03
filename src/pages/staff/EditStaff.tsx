// src/pages/staff/EditStaff.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Loader2,
  Pencil,
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
  Trash2,
} from 'lucide-react';
import './AddStaff.css';

import { fetchStaffById, updateStaff, deleteStaff } from '@services/staff';
import { API_URL } from '@config/api';
import { getRoleConfig } from '@config/roles';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout/PortalLayout';
import Alert from '@components/Alert';
import ConfirmDialog from '@components/ConfirmDialog';

const ROLE_OPTIONS = ['Receptionist', 'Housekeeping', 'Restaurant', 'Other'];

const EditStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const config = getRoleConfig(role);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('Receptionist');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  const [staffLoading, setStaffLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Staff fetch
  useEffect(() => {
    if (!isAuthenticated || !slug || !id) return;

    const loadStaff = async () => {
      setStaffLoading(true);
      const result = await fetchStaffById(slug, id);

      if (result.success && result.staff) {
        const s = result.staff;
        setFirstName(s.first_name || '');
        setLastName(s.last_name || '');
        setEmail(s.email || '');
        setPhone(s.phone || '');
        setRoleLabel(s.role_label || 'Receptionist');
        setAddress(s.address || '');
        setExistingPhoto(s.profile_photo || null);
      } else {
        setError(result.error || "Xodim ma'lumotini yuklashda xatolik");
      }

      setStaffLoading(false);
    };

    loadStaff();
  }, [isAuthenticated, slug, id]);

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

  const handleRemoveNewPhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const getPhotoUrl = (p: string) => {
    if (p.startsWith('http')) return p;
    return `${API_URL}${p}`;
  };

  const displayPhoto =
    photoPreview || (existingPhoto ? getPhotoUrl(existingPhoto) : null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name va Last name kiritilishi shart');
      return;
    }

    if (password) {
      if (password.length < 8) {
        setError("Parol kamida 8 belgi bo'lishi kerak");
        return;
      }
      if (password !== confirmPassword) {
        setError('Parollar mos kelmadi');
        return;
      }
    }

    if (!slug || !id) return;

    setSubmitting(true);
    const result = await updateStaff(slug, id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role_label: roleLabel,
      address: address.trim(),
      password: password || undefined,
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

  const handleDelete = async () => {
    if (!slug || !id) return;
    setDeleting(true);

    const result = await deleteStaff(slug, id);
    setDeleting(false);

    if (result.success) {
      navigate(`/portal/${slug}/${roleKey}/staff`);
    } else {
      setError(result.error || "O'chirib bo'lmadi");
      setShowDeleteConfirm(false);
    }
  };

  return (
    <PortalLayout
      activeNav="staff"
      pageLoading={staffLoading}
      loadingText="Loading staff data..."
      contentClassName="as-content"
      rootClassName="as-root"
      mainClassName="as-main"
    >
      <div className="as-topbar">
        <div className="as-topbar-left">
          <h1 className="as-title">
            <Pencil
              size={22}
              strokeWidth={2.2}
              style={{ color: config.badgeColor, marginRight: 10 }}
            />
            Edit Staff Member
          </h1>
          <p className="as-subtitle">Update staff information</p>
        </div>

        <Link to={`/portal/${slug}/${roleKey}/staff`} className="as-back-btn">
          <ArrowLeft size={14} strokeWidth={2.4} />
          <span>Back</span>
        </Link>
      </div>

      <div className="as-form-wrapper">
        {/* Alerts — YANGI komponent */}
        {success && (
          <Alert
            variant="success"
            message="Xodim ma'lumoti yangilandi! Redirecting..."
          />
        )}

        {error && !success && (
          <Alert
            variant="error"
            message={error}
            onClose={() => setError('')}
          />
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
              {displayPhoto ? (
                <img src={displayPhoto} alt="Preview" />
              ) : (
                <User size={28} strokeWidth={2} color={config.badgeColor} />
              )}
            </div>
            <h2 className="as-form-title">
              {firstName} {lastName}
            </h2>
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
              <span>{photo ? 'Change Photo' : 'Upload New Photo'}</span>
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
                onClick={handleRemoveNewPhoto}
                className="as-btn-remove"
              >
                <X size={14} strokeWidth={2.2} />
                <span>Cancel</span>
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
              required
            />
            <Field
              label="Last Name *"
              value={lastName}
              onChange={setLastName}
              required
            />
          </div>

          <div className="as-grid">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              iconLeft={<Mail size={14} strokeWidth={2.2} />}
            />
            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              iconLeft={<Phone size={14} strokeWidth={2.2} />}
            />
          </div>

          <div className="as-field-full">
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
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
            <span>CHANGE PASSWORD (OPTIONAL)</span>
          </div>

          <div className="as-grid">
            <Field
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Leave empty to keep current"
            />
            <Field
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter new password"
            />
          </div>

          <div className="as-password-hint" style={{ color: config.badgeColor }}>
            <Lock size={12} strokeWidth={2.2} />
            <span>
              Parolni o'zgartirmoqchi bo'lsangiz to'ldiring. Aks holda eski parol
              saqlanadi.
            </span>
          </div>

          <div className="es-actions">
            <button
              type="button"
              className="es-btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={submitting}
            >
              <Trash2 size={14} strokeWidth={2.2} />
              <span>Delete Staff</span>
            </button>

            <div className="es-actions-right">
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.4} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete confirmation — YANGI komponent */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Xodimni o'chirishni tasdiqlang"
        message={`${firstName} ${lastName} xodimini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
        variant="danger"
        confirmText="Yes, Delete"
        confirmIcon={<Trash2 size={14} strokeWidth={2.2} />}
        loading={deleting}
      />
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

export default EditStaff;