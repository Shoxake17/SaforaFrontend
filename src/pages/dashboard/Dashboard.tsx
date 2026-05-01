// src/pages/portal/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Bed,
  Users,
  CircleCheck,
  QrCode,
  Zap,
  ShoppingCart,
  Bell,
  Inbox,
} from 'lucide-react';
import './Dashboard.css';

import useAuth from '@hooks/useAuth';
import { fetchHotelBySlug } from '@services/auth';
import { fetchStaff } from '@services/staff';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';
import QrOperations from '@components/QrOperations';

const RoleDashboard: React.FC = () => {
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
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [staffCount, setStaffCount] = useState<number>(0);
  const [staffLoading, setStaffLoading] = useState(true);
  const [roomsCount, setRoomsCount] = useState<number>(0);

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);
  const RoleIcon = config.icon;
  const isDeptManager = roleKey === 'dept-manager';

  // ─── Auth check ──────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, slug, roleKey, navigate]);

  // ─── Hotel fetch ─────────────────────────────────
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

  // ─── Staff count fetch ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const loadStaffCount = async () => {
      setStaffLoading(true);
      const result = await fetchStaff(slug);
      if (result.success) setStaffCount(result.staff.length);
      setStaffLoading(false);
    };
    loadStaffCount();
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
      <div className="rd-loading">
        <Loader2 size={36} color={config.badgeColor} className="rd-spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const formatCount = (count: number, loading: boolean) =>
    loading ? '—' : count;

  return (
    <div className="rd-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="rd-main">
        <MainLayout hotel={hotel} />

        <div className="rd-content">
          {/* Title section */}
          <div className="rd-title-section">
            <div>
              <h1 className="rd-title">
                <RoleIcon
                  size={22}
                  strokeWidth={2.2}
                  style={{ color: config.badgeColor, marginRight: 10 }}
                />
                {config.dashboardTitle}
              </h1>
              <p className="rd-subtitle">
                {config.dashboardDescription} for {hotel?.name || 'your hotel'}
              </p>
            </div>
            
          </div>

          {/* Stats */}
          {isDeptManager ? (
            <QrOperations
              hotelSlug={slug}
              badgeColor={config.badgeColor}
              staffCount={staffCount}
              staffLoading={staffLoading}
            />
          ) : (
            <div className="rd-stats-grid">
              {config.dashboardStats.map((stat, i) => {
                const StatIcon = stat.icon;
                let value: string | number = 0;
                if (stat.label.toLowerCase().includes('staff')) {
                  value = formatCount(staffCount, staffLoading);
                } else if (stat.label.toLowerCase().includes('rooms')) {
                  value = roomsCount;
                }

                return (
                  <div key={i} className="rd-stat-card">
                    <div
                      className="rd-stat-icon"
                      style={{
                        color: stat.color,
                        background: `${stat.color}15`,
                      }}
                    >
                      <StatIcon size={20} strokeWidth={2.2} />
                    </div>
                    <div className="rd-stat-value">{value}</div>
                    <div className="rd-stat-label">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hotel info card */}
          {hotel && (
            <div className="rd-hotel-info-card">
              <div
                className="rd-hotel-info-icon"
                style={{
                  background: `${config.badgeColor}15`,
                  color: config.badgeColor,
                }}
              >
                <RoleIcon size={22} strokeWidth={2.2} />
              </div>

              <div className="rd-hotel-info-text">
                <div className="rd-hotel-info-title">
                  {hotel.name} — {config.dashboardSubtitle}
                </div>
                <div className="rd-hotel-info-meta">
                  <span>
                    <Bed size={13} strokeWidth={2.2} />
                    {roomsCount} Room{roomsCount !== 1 ? 's' : ''}
                  </span>
                  <span>
                    <Users size={13} strokeWidth={2.2} />
                    {formatCount(staffCount, staffLoading)} Staff
                  </span>
                  <span style={{ color: '#16a34a' }}>
                    <CircleCheck size={13} strokeWidth={2.2} /> Online
                  </span>
                </div>
              </div>

              <div className="rd-quick-actions">
                {(isDeptManager || roleKey === 'management') && (
                  <button
                    type="button"
                    className="rd-quick-btn"
                    onClick={() => handleNavChange('qrcodes')}
                  >
                    <QrCode size={14} strokeWidth={2.2} /> QR Codes
                  </button>
                )}

                <button
                  type="button"
                  className="rd-quick-btn"
                  onClick={() => handleNavChange('qrrooms')}
                >
                  <Zap size={14} strokeWidth={2.2} /> Live Feed
                </button>

                <button
                  type="button"
                  className="rd-quick-btn"
                  onClick={() => handleNavChange('staff')}
                >
                  <Users size={14} strokeWidth={2.2} /> Staff
                </button>
              </div>
            </div>
          )}

          {/* Empty cards */}
          <div className="rd-empty-section">
            <div className="rd-empty-row">
              <div className="rd-empty-card">
                <div className="rd-empty-header">
                  <ShoppingCart
                    size={16}
                    strokeWidth={2.2}
                    style={{ color: config.badgeColor }}
                  />
                  Recent Activity
                </div>
                <div className="rd-empty-body">
                  <Inbox size={32} strokeWidth={1.6} />
                  <p>No recent activity yet</p>
                </div>
              </div>

              <div className="rd-empty-card">
                <div className="rd-empty-header">
                  <Bell
                    size={16}
                    strokeWidth={2.2}
                    style={{ color: config.badgeColor }}
                  />
                  Recent Requests
                </div>
                <div className="rd-empty-body">
                  <Inbox size={32} strokeWidth={1.6} />
                  <p>No recent requests yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleDashboard;