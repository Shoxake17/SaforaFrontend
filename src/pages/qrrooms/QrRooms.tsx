// src/pages/qrrooms/QrRooms.tsx
// ⭐ SOCKET-ONLY VERSION — No polling, real-time updates
import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  HandHelping,
  MessageSquare,
  Phone,
  Star,
  Inbox,
} from 'lucide-react';

import { getRoleConfig } from '@config/roles';
import type { QrTabKey } from '@apptypes/qrroom';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout/PortalLayout';

import OrdersPanel from './panels/OrdersPanel';
import RequestsPanel from './panels/RequestsPanel';
import MessagesPanel from './panels/MessagesPanel';
import CallsPanel from './panels/CallsPanel';
import ReviewsPanel from './panels/ReviewsPanel';

import { getCallHistory } from '@services/calls';
import { listRequests } from '@services/requests';   // ⭐ yangi
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';

import './QrRooms.css';

// ═══════════════════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════════════════

interface TabConfig {
  key: QrTabKey;
  icon: typeof ShoppingCart;
  label: string;
  color: string;
  bgColor: string;
}

const TABS: TabConfig[] = [
  { key: 'orders',   icon: ShoppingCart,  label: 'Orders',   color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  { key: 'requests', icon: HandHelping,   label: 'Requests', color: '#7c3aed', bgColor: 'rgba(124,58,237,0.12)' },
  { key: 'messages', icon: MessageSquare, label: 'Messages', color: '#2563eb', bgColor: 'rgba(37,99,235,0.12)' },
  { key: 'calls',    icon: Phone,         label: 'Calls',    color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' },
  { key: 'reviews',  icon: Star,          label: 'Reviews',  color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
];

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

const QrRooms: React.FC = () => {
  const { slug, role } = useAuthGuard();
  const config = getRoleConfig(role);

  const [activeTab, setActiveTab] = useState<QrTabKey>('orders');

  // ═════ Counts (real va hardcoded) ═════
  const [counts, setCounts] = useState({
    orders: 0,
    requests: 0,    // ⭐ endi real-time
    messages: 0,    // TODO: API
    calls: 0,       // ✅ Socket orqali real-time
    reviews: 2,     // TODO: API
  });

  // ═══════════════════════════════════════════════════════
  // ⭐ Calls count
  // ═══════════════════════════════════════════════════════
  const loadCallsCount = useCallback(async () => {
    try {
      const result = await getCallHistory('all', 200);
      if (result.success) {
        setCounts((prev) => ({ ...prev, calls: result.total }));
      }
    } catch (err) {
      console.warn('[QrRooms] Failed to load calls count:', err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════
  // ⭐ Requests count (faqat pending)
  // ═══════════════════════════════════════════════════════
  const loadRequestsCount = useCallback(async () => {
    if (!slug) return;
    try {
      const result = await listRequests(slug, 'pending', 1);
      if (result.success) {
        setCounts((prev) => ({
          ...prev,
          requests: result.pending ?? result.total ?? 0,
        }));
      }
    } catch (err) {
      console.warn('[QrRooms] Failed to load requests count:', err);
    }
  }, [slug]);

  // ═══════════════════════════════════════════════════════
  // ⭐ Initial load + Socket listeners
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    loadCallsCount();
    loadRequestsCount();

    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    // Calls events
    const handleCallEnded = () => {
      console.log('[QrRooms] 📡 call:ended — refreshing calls count');
      loadCallsCount();
    };

    const handleNewCall = () => {
      console.log('[QrRooms] 📡 new-call — refreshing calls count');
      loadCallsCount();
    };

    // ⭐ Requests events
    const handleNewRequest = () => {
      console.log('[QrRooms] 📡 new-request — refreshing requests count');
      loadRequestsCount();
    };

    const handleRequestStatusChanged = () => {
      console.log('[QrRooms] 📡 request:status_changed — refreshing requests count');
      loadRequestsCount();
    };

    socket.on('call:ended', handleCallEnded);
    socket.on('new-call', handleNewCall);
    socket.on('new-request', handleNewRequest);
    socket.on('request:status_changed', handleRequestStatusChanged);

    return () => {
      socket.off('call:ended', handleCallEnded);
      socket.off('new-call', handleNewCall);
      socket.off('new-request', handleNewRequest);
      socket.off('request:status_changed', handleRequestStatusChanged);
    };
  }, [loadCallsCount, loadRequestsCount]);

  // ═════ Hash-based tab switching (notification clicks) ═════
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as QrTabKey;
    if (hash && TABS.some((t) => t.key === hash)) {
      setActiveTab(hash);
    }
  }, []);

  return (
    <PortalLayout
      activeNav="qrrooms"
      contentClassName="qrr-content"
      rootClassName="qrr-root"
      mainClassName="qrr-main"
    >
      {/* Background orbs */}
      <div className="qrr-bg-anim">
        <div className="qrr-bg-orb"></div>
        <div className="qrr-bg-orb"></div>
        <div className="qrr-bg-orb"></div>
      </div>

      <div className="qrr-hub">
        {/* Header */}
        <div className="qrr-header">
          <div>
            <h1 className="qrr-title">
              <Inbox
                size={22}
                strokeWidth={2.2}
                style={{ color: config.badgeColor, marginRight: 10 }}
              />
              Communication Hub
            </h1>
            <p className="qrr-subtitle">
              Guest orders, requests, messages &amp; calls — all in one place
            </p>
          </div>
        </div>

        {/* Stat Tabs */}
        <div className="qrr-stat-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.key];
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className={`qrr-stat-tab ${isActive ? 'active' : ''}`}
                data-tab={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={
                  isActive
                    ? ({
                        ['--accent-color' as any]: tab.color,
                        ['--accent-bg' as any]: tab.bgColor,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <div
                  className="qrr-stat-tab-ico"
                  style={{ background: tab.bgColor, color: tab.color }}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="qrr-stat-tab-text">
                  <div className="qrr-stat-tab-val">{count}</div>
                  <div className="qrr-stat-tab-label">{tab.label}</div>
                </div>

                {(tab.key === 'orders' ||
                  tab.key === 'requests' ||
                  tab.key === 'messages') &&
                  count > 0 && (
                    <span className="qrr-stat-tab-badge">{count}</span>
                  )}
              </button>
            );
          })}
        </div>

        {/* Active Panel */}
        <div className="qrr-panels">
          {activeTab === 'orders' && (
            <OrdersPanel hotelSlug={slug} accentColor={config.badgeColor} />
          )}
          {activeTab === 'requests' && (
            <RequestsPanel hotelSlug={slug} accentColor={config.badgeColor} />
          )}
          {activeTab === 'messages' && (
            <MessagesPanel hotelSlug={slug} accentColor={config.badgeColor} />
          )}
          {activeTab === 'calls' && (
            <CallsPanel hotelSlug={slug} accentColor={config.badgeColor} />
          )}
          {activeTab === 'reviews' && (
            <ReviewsPanel hotelSlug={slug} accentColor={config.badgeColor} />
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default QrRooms;