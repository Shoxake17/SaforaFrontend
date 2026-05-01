// src/pages/staff/Staff.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  Users,
  Plus,
  Phone,
  Mail,
  Calendar,
  Pencil,
} from 'lucide-react';
import './Staff.css';

import useAuth from '@hooks/useAuth';
import { fetchHotelBySlug } from '@services/auth';
import { fetchStaff } from '@services/staff';
import type { StaffMember } from '@services/staff';
import { API_URL } from '@config/api';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';

const StaffPage: React.FC = () => {
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
  const [activeNav, setActiveNav] = useState('staff');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');

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
      const loadHotel = async () => {
        const result = await fetchHotelBySlug(slug);
        if (result.success && result.hotel) setHotel(result.hotel);
        setHotelLoading(false);
      };
      loadHotel();
    }
  }, [contextHotel, slug, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const loadStaff = async () => {
      setStaffLoading(true);
      setStaffError('');
      const result = await fetchStaff(slug);
      if (result.success) {
        setStaff(result.staff);
      } else {
        setStaffError(result.error || 'Xodimlar ro\'yxatini yuklashda xatolik');
      }
      setStaffLoading(false);
    };
    loadStaff();
  }, [isAuthenticated, slug]);

  const handleLogout = async () => {
    await logout();
    navigate(`/portal/${slug}`, { replace: true });
  };

  const handleNavChange = (key: string) => {
    setActiveNav(key);
    const routes: Record<string, string> = {
      dashboard:    `/portal/${slug}/${roleKey}/dashboard`,
      staff:        `/portal/${slug}/${roleKey}/staff`,
      rooms:        `/portal/${slug}/${roleKey}/rooms`,
      qrcodes:      `/portal/${slug}/${roleKey}/qr-codes`,
      qrrooms:      `/portal/${slug}/${roleKey}/qr-rooms`,
      services:     `/portal/${slug}/${roleKey}/services`,
      settings:     `/portal/${slug}/${roleKey}/settings`,
      reservations: `/portal/${slug}/${roleKey}/reservations`,
      reports:      `/portal/${slug}/${roleKey}/reports`,
      checkin:      `/portal/${slug}/${roleKey}/checkin`,
      checkout:     `/portal/${slug}/${roleKey}/checkout`,
      billing:      `/portal/${slug}/${roleKey}/billing`,
      tasks:        `/portal/${slug}/${roleKey}/tasks`,
      cleaning:     `/portal/${slug}/${roleKey}/cleaning`,
    };
    const path = routes[key];
    if (path) navigate(path);
  };

  if (authLoading || hotelLoading) {
    return (
      <div className="st-loading">
        <Loader2 size={36} color={config.badgeColor} className="st-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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
    <div className="st-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="st-main">
        <MainLayout hotel={hotel} />

        <div className="st-content">
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
                    <div
                      className="st-card-stripe"
                      style={{ background: config.badgeColor }}
                    />

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
                          <Phone
                            size={13}
                            strokeWidth={2.2}
                            style={{ color: config.badgeColor }}
                          />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.email && (
                        <div className="st-info-row">
                          <Mail
                            size={13}
                            strokeWidth={2.2}
                            style={{ color: config.badgeColor }}
                          />
                          <span>{member.email}</span>
                        </div>
                      )}
                      <div className="st-info-row">
                        <Calendar
                          size={13}
                          strokeWidth={2.2}
                          style={{ color: config.badgeColor }}
                        />
                        <span>
                          Joined {formatJoined(member.joined_at || member.createdAt)}
                        </span>
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
        </div>
      </main>
    </div>
  );
};

export default StaffPage;