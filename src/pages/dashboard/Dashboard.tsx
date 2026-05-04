// src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
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
import PortalLayout from '@components/PortalLayout';
import QrOperations from '@components/QrOperations';
import QuickCallPanel from '@components/QuickCallPanel';
import OutgoingCallModal from '@components/OutgoingCallModal';

import { fetchStaff } from '@services/staff';
import { fetchRooms } from '@services/rooms';
import { getRoleConfig } from '@config/roles';

import useAuthGuard from '@hooks/useAuthGuard';
import useHotel from '@hooks/useHotel';
import usePortalNavigation from '@hooks/useNavigation';

const RoleDashboard: React.FC = () => {
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const { hotel } = useHotel(slug, isAuthenticated);
  const { goTo } = usePortalNavigation(slug, roleKey);

  const config = getRoleConfig(role);
  const RoleIcon = config.icon;
  const isDeptManager = roleKey === 'dept-manager';

  const [staffCount, setStaffCount] = useState<number>(0);
  const [staffLoading, setStaffLoading] = useState(true);

  const [roomsCount, setRoomsCount] = useState<number>(0);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [callingRoom, setCallingRoom] = useState<string | null>(null);
  // Staff count
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const load = async () => {
      setStaffLoading(true);
      const result = await fetchStaff(slug);
      if (result.success) setStaffCount(result.staff.length);
      setStaffLoading(false);
    };
    load();
  }, [isAuthenticated, slug]);

  // Rooms count
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const load = async () => {
      setRoomsLoading(true);
      const result = await fetchRooms(slug);
      if (result.success) setRoomsCount(result.rooms.length);
      setRoomsLoading(false);
    };
    load();
  }, [isAuthenticated, slug]);

  const formatCount = (count: number, loading: boolean): string | number =>
    loading ? '—' : count;

  // ═════ Call tugmasi handler — backend hali tayyor emas ═════
  const handleCallRoom = (roomNumber: string) => {
  console.log('[Dashboard] Call room', roomNumber);
  setCallingRoom(roomNumber); // ⭐ Modal ochish
};

  return (
    <PortalLayout
      activeNav="dashboard"
      loadingText="Loading dashboard..."
      contentClassName="rd-content"
      rootClassName="rd-root"
      mainClassName="rd-main"
    >
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
        <QrOperations hotelSlug={slug} badgeColor={config.badgeColor} />
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
              value = roomsCount;
              isLoading = roomsLoading;
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
                onClick={() => goTo('qrcodes')}
              >
                <QrCode size={14} strokeWidth={2.2} /> QR Codes
              </button>
            )}

            <button
              type="button"
              className="rd-quick-btn"
              onClick={() => goTo('qrrooms')}
            >
              <ConciergeBell size={14} strokeWidth={2.2} /> Live Feed
            </button>

            <button
              type="button"
              className="rd-quick-btn"
              onClick={() => goTo('staff')}
            >
              <Users size={14} strokeWidth={2.2} /> Staff
            </button>
          </div>
        </div>
      )}

      {/* ⭐ 3 ta blok: Recent Activity / Recent Requests / Quick Call */}
      <div className="rd-three-grid">
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

        <QuickCallPanel
          hotelSlug={slug || ''}
          accentColor={config.badgeColor}
          onCallRoom={handleCallRoom}
        />
      </div>
      {/* ⭐ Outgoing Call Modal */}
      {callingRoom && (
        <OutgoingCallModal
          isOpen={true}
          roomNumber={callingRoom}
          onClose={() => setCallingRoom(null)}
        />
      )}
    </PortalLayout>
  );
};

export default RoleDashboard;