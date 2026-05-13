// src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bed,
  Users,
  CircleCheck,
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
import RecentOrdersCard from '@components/RecentOrdersCard';

import { fetchStaff } from '@services/staff';
import { fetchRooms } from '@services/rooms';
import { listRequests } from '@services/requests';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import { getRoleConfig } from '@config/roles';

import useAuthGuard from '@hooks/useAuthGuard';
import useHotel from '@hooks/useHotel';
import usePortalNavigation from '@hooks/useNavigation';

const STATE_CHECK_INTERVAL_MS = 1_000;

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

  // ⭐ Orders count (restaurant pending orders)
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [callingRoom, setCallingRoom] = useState<string | null>(null);
  const [, setSocketConnected] = useState(false);

  const hasJoinedRoomRef = useRef<boolean>(false);

  // ═══════════════════════════════════════════════════
  // SOCKET.IO — Manager joins staff:<slug> room
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!isAuthenticated || !slug) return;

    const token = tokenService.get();
    if (!token) {
      console.warn('[Dashboard] No staff token, Socket disabled');
      return;
    }

    console.log('[Dashboard] 🚀 Initializing Socket...');
    const socket = getSocket(token);
    hasJoinedRoomRef.current = false;

    const joinRoom = () => {
      if (!socket.connected) return;
      if (hasJoinedRoomRef.current) return;
      socket.emit('staff:join', { hotelSlug: slug });
      hasJoinedRoomRef.current = true;
      console.log(`[Dashboard] ✅ Joined staff room: staff:${slug}`);
      setSocketConnected(true);
    };

    const handleConnect = () => {
      console.log('[Dashboard] 🔌 Socket connected!');
      hasJoinedRoomRef.current = false;
      joinRoom();
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Dashboard] 🔌 Disconnected:', reason);
      hasJoinedRoomRef.current = false;
      setSocketConnected(false);
    };

    const handleNewCall = (data: any) => {
      console.log('[Dashboard] 📞 New call from guest:', data);
    };

    const handleConnectError = (err: Error) => {
      console.warn('[Dashboard] ⚠️ Connection error:', err.message);
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('new-call', handleNewCall);

    if (socket.connected) {
      console.log('[Dashboard] ⚡ Socket already connected — joining immediately');
      joinRoom();
    } else {
      console.log('[Dashboard] ⏳ Socket not yet connected, waiting...');
    }

    const stateCheckInterval = setInterval(() => {
      const isConnected = socket.connected;
      setSocketConnected((prev) => {
        if (prev !== isConnected) {
          console.log(`[Dashboard] 🔄 State sync: ${prev} → ${isConnected}`);
        }
        return isConnected;
      });
      if (isConnected && !hasJoinedRoomRef.current) {
        console.log('[Dashboard] 🔁 Re-joining room (state was out of sync)');
        joinRoom();
      }
    }, STATE_CHECK_INTERVAL_MS);

    return () => {
      console.log('[Dashboard] 🧹 Cleanup');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('new-call', handleNewCall);
      clearInterval(stateCheckInterval);
    };
  }, [isAuthenticated, slug]);

  // ═══════════════════════════════════════════════════
  // Staff count
  // ═══════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════
  // Rooms count
  // ═══════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════
  // ⭐ Orders count (pending restaurant only)
  // ═══════════════════════════════════════════════════
  const loadOrdersCount = useCallback(async () => {
    if (!isAuthenticated || !slug) return;
    try {
      const result = await listRequests(slug, 'pending', 200);
      if (result.success && result.requests) {
        const restaurantCount = result.requests.filter(
          (r) => r.service_type === 'restaurant'
        ).length;
        setOrdersCount(restaurantCount);
      }
    } catch (err) {
      console.warn('[Dashboard] Failed to load orders count:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated, slug]);

  useEffect(() => {
    setOrdersLoading(true);
    loadOrdersCount();
  }, [loadOrdersCount]);

  // ─── Socket — orders count real-time updates ──────
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleNewRequest = (data: any) => {
      if (data?.service_type === 'restaurant' || !data?.service_type) {
        loadOrdersCount();
      }
    };
    const handleStatusChanged = () => loadOrdersCount();

    socket.on('new-request', handleNewRequest);
    socket.on('request:status_changed', handleStatusChanged);

    return () => {
      socket.off('new-request', handleNewRequest);
      socket.off('request:status_changed', handleStatusChanged);
    };
  }, [isAuthenticated, slug, loadOrdersCount]);

  const formatCount = (count: number, loading: boolean): string | number =>
    loading ? '—' : count;

  const handleCallRoom = (roomNumber: string) => {
    console.log('[Dashboard] Call room', roomNumber);
    setCallingRoom(roomNumber);
  };

  return (
    <PortalLayout
      activeNav="dashboard"
      loadingText="Loading dashboard..."
      contentClassName="rd-content"
      rootClassName="rd-root"
      mainClassName="rd-main"
    >
      {/* Title */}
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

            const label = stat.label.toLowerCase();
            if (label.includes('staff')) {
              value = staffCount;
              isLoading = staffLoading;
            } else if (label.includes('rooms')) {
              value = roomsCount;
              isLoading = roomsLoading;
            } else if (label.includes('order')) {
              value = ordersCount;
              isLoading = ordersLoading;
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

      {/* 3 blocks: Recent Orders / Recent Requests / Quick Call */}
      <div className="rd-three-grid">
        {/* ⭐ Real Orders — QrRooms bilan bitta manba */}
        <RecentOrdersCard
          hotelSlug={slug || ''}
          accentColor={config.badgeColor}
          onViewAll={() => goTo('qrrooms')}
          maxItems={5}
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