// src/pages/portal/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Bed,
  Users,
  CircleCheck,
  QrCode,
  ShoppingCart,
  Bell,
  ConciergeBell,
} from 'lucide-react';
import './Dashboard.css';

import StatCard from '@components/StatCard';
import EmptyStateCard from '@components/EmptyStateCard';
import useAuth from '@hooks/useAuth';
import { fetchHotelBySlug } from '@services/auth';
import { fetchStaff } from '@services/staff';
import { fetchRooms } from '@services/rooms';                 // ← YANGI import
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

  // ⭐ Rooms count — real ma'lumot
  const [roomsCount, setRoomsCount] = useState<number>(0);
  const [roomsLoading, setRoomsLoading] = useState(true);

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

  // ─── Rooms count fetch ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const loadRoomsCount = async () => {
      setRoomsLoading(true);
      const result = await fetchRooms(slug);
      if (result.success) setRoomsCount(result.rooms.length);
      setRoomsLoading(false);
    };
    loadRoomsCount();
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

  // Helper — count yoki '—' qaytaradi
  const formatCount = (count: number, loading: boolean): string | number =>
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
                let isLoading = false;

                if (stat.label.toLowerCase().includes('staff')) {
                  value = staffCount;
                  isLoading = staffLoading;
                } else if (stat.label.toLowerCase().includes('rooms')) {
                  value = roomsCount;          // ← real qiymat
                  isLoading = roomsLoading;    // ← loading state
                }

                return (
                  <StatCard
                    key={i}
                    icon={StatIcon}
                    value={value}
                    label={stat.label}
                    color={stat.color}
                    loading={isLoading}
                    variant="compact"
                  />
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
                    {formatCount(roomsCount, roomsLoading)} Room
                    {!roomsLoading && roomsCount !== 1 ? 's' : ''}
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
                  <ConciergeBell size={14} strokeWidth={2.2} /> Live Feed
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
          <div className="rd-empty-row">
            <EmptyStateCard
              headerIcon={ShoppingCart}
              title="Recent Activity"
              message="No recent activity yet"
              accentColor={config.badgeColor}
            />

            <EmptyStateCard
              headerIcon={Bell}
              title="Recent Requests"
              message="No recent requests yet"
              accentColor={config.badgeColor}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleDashboard;