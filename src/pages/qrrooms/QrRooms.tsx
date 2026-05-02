// src/pages/qrrooms/QrRooms.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShoppingCart,
  HandHelping,
  MessageSquare,
  Phone,
  Star,
  Inbox,
} from 'lucide-react';

import useAuth from '@hooks/useAuth';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import type { QrTabKey } from '@apptypes/qrroom';

import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';

import OrdersPanel from './panels/OrdersPanel';
import RequestsPanel from './panels/RequestsPanel';
import MessagesPanel from './panels/MessagesPanel';
import CallsPanel from './panels/CallsPanel';
import ReviewsPanel from './panels/ReviewsPanel';

import './QrRooms.css';

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

const QrRooms: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();
  const { hotel, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<QrTabKey>('orders');

  // Counts (kelajakda API'dan keladi)
  const [counts, setCounts] = useState({
    orders: 0,
    requests: 9,
    messages: 0,
    calls: 0,
    reviews: 2,
  });

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, slug, roleKey, navigate]);

  // Hash-based tab switching (notification clicks)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as QrTabKey;
    if (hash && TABS.some((t) => t.key === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(`/portal/${slug}`, { replace: true });
  };

  const handleNavChange = (key: string) => {
    const routes: Record<string, string> = {
      dashboard: `/portal/${slug}/${roleKey}/dashboard`,
      staff:     `/portal/${slug}/${roleKey}/staff`,
      rooms:     `/portal/${slug}/${roleKey}/rooms`,
      qrcodes:   `/portal/${slug}/${roleKey}/qr-codes`,
      qrrooms:   `/portal/${slug}/${roleKey}/qr-rooms`,
      services:  `/portal/${slug}/${roleKey}/services`,
      settings:  `/portal/${slug}/${roleKey}/settings`,
    };
    const path = routes[key];
    if (path) navigate(path);
  };

  if (authLoading) {
    return (
      <div className="qrr-loading">
        <Loader2 size={36} color={config.badgeColor} className="qrr-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="qrr-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav="qrrooms"
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="qrr-main">
        <MainLayout hotel={hotel} />

        <div className="qrr-content">
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
                      style={{
                        background: tab.bgColor,
                        color: tab.color,
                      }}
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
              {activeTab === 'orders'   && <OrdersPanel hotelSlug={slug} accentColor={config.badgeColor} />}
              {activeTab === 'requests' && <RequestsPanel hotelSlug={slug} accentColor={config.badgeColor} />}
              {activeTab === 'messages' && <MessagesPanel hotelSlug={slug} accentColor={config.badgeColor} />}
              {activeTab === 'calls'    && <CallsPanel hotelSlug={slug} accentColor={config.badgeColor} />}
              {activeTab === 'reviews'  && <ReviewsPanel hotelSlug={slug} accentColor={config.badgeColor} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QrRooms;