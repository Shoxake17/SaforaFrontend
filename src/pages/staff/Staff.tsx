// src/pages/staff/Staff.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Users,
  Plus,
  Phone,
  Mail,
  Calendar,
  Pencil,
} from 'lucide-react';

import { fetchStaff } from '@services/staff';
import type { StaffMember } from '@services/staff';
import { API_URL } from '@config/api';
import { getRoleConfig } from '@config/roles';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout';
import './Staff.css';

const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const config = getRoleConfig(role);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const loadStaff = async () => {
      setStaffLoading(true);
      setStaffError('');
      const result = await fetchStaff(slug);
      if (result.success) {
        setStaff(result.staff);
      } else {
        setStaffError(result.error || 'Failed to load staff');
      }
      setStaffLoading(false);
    };
    loadStaff();
  }, [isAuthenticated, slug]);

  const getInitials = (s: StaffMember) =>
    (s.first_name[0] || '').toUpperCase() + (s.last_name[0] || '').toUpperCase();

  const formatJoined = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
  };

  const getPhotoUrl = (photo?: string) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    return `${API_URL}${photo}`;
  };

  const getKey = (member: StaffMember) => member._id || member.id || '';

  return (
    <PortalLayout
      activeNav="staff"
      contentClassName="st-content"
      rootClassName="st-root"
      mainClassName="st-main"
    >
      <div className="st-header">
        <div>
          <h1 className="st-title">
            <Users
              size={22}
              strokeWidth={2.2}
              style={{ color: config.badgeColor, marginRight: 10 }}
            />
            My Staff
          </h1>
          <p className="st-subtitle">
            {staff.length} staff member{staff.length !== 1 ? 's' : ''} in your department
          </p>
        </div>

        <Link
          to={`/portal/${slug}/${roleKey}/staff/add`}
          className="st-add-btn"
          style={{
            background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
          }}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>Add Staff</span>
        </Link>
      </div>

      {staffError && (
        <div className="st-error">
          <span>{staffError}</span>
        </div>
      )}

      {staffLoading ? (
        <div className="st-loading-inner">
          <Loader2 size={28} color={config.badgeColor} className="st-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="st-empty">
          <Users size={40} strokeWidth={1.6} />
          <p>No staff members yet</p>
          <span>Click "Add Staff" to add your first team member</span>
        </div>
      ) : (
        <div className="st-grid">
          {staff.map((member) => {
            const memberId = getKey(member);
            const photoUrl = getPhotoUrl(member.profile_photo);

            return (
              <div key={memberId} className="st-card">
                <div className="st-card-stripe" style={{ background: config.badgeColor }} />
                <div className="st-card-top">
                  <div
                    className="st-avatar"
                    style={{
                      background: `${config.badgeColor}20`,
                      border: `2px solid ${config.badgeColor}50`,
                      color: config.badgeColor,
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${member.first_name} ${member.last_name}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getInitials(member)
                    )}
                  </div>
                  <h3 className="st-name">
                    {member.first_name} {member.last_name}
                  </h3>
                  <div
                    className="st-role-badge"
                    style={{
                      background: `${config.badgeColor}15`,
                      color: config.badgeColor,
                      border: `1px solid ${config.badgeColor}30`,
                    }}
                  >
                    {member.role_label}
                  </div>
                </div>

                <div className="st-info">
                  {member.phone && (
                    <div className="st-info-row">
                      <Phone size={13} strokeWidth={2.2} style={{ color: config.badgeColor }} />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="st-info-row">
                      <Mail size={13} strokeWidth={2.2} style={{ color: config.badgeColor }} />
                      <span>{member.email}</span>
                    </div>
                  )}
                  <div className="st-info-row">
                    <Calendar size={13} strokeWidth={2.2} style={{ color: config.badgeColor }} />
                    <span>Joined {formatJoined(member.joined_at || member.createdAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="st-edit-btn"
                  onClick={() =>
                    navigate(`/portal/${slug}/${roleKey}/staff/${memberId}/edit`)
                  }
                  style={{
                    background: `${config.badgeColor}15`,
                    color: config.badgeColor,
                    border: `1px solid ${config.badgeColor}30`,
                  }}
                >
                  <Pencil size={13} strokeWidth={2.2} />
                  <span>Edit</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
};

export default StaffPage;