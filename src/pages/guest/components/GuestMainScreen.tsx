// src/pages/guest/components/GuestMainScreen.tsx
import React, { useState } from 'react';
import {
  Home as HomeIcon,
  User,
  Compass,
  ConciergeBell,
  Phone,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import HomeTab from '../tabs/HomeTab/HomeTab';
import ExploreTab from '../tabs/ExploreTab/ExploreTab';
import ServicesTab from '../tabs/ServicesTab/ServicesTab';
import ProfileTab from '../tabs/ProfileTab/ProfileTab';

import {
  GuestNotificationsProvider,
  useGuestNotificationsContext,
} from '@contexts/GuestNotificationsContext';
import GuestNotificationPanel from './GuestNotificationPanel/GuestNotificationPanel';

// ⭐ CALL MODAL — ishlovchi versiya
import CallModal from '../modals/CallModal';

import './GuestMainScreen.css';

// ⭐ 'market' o'chirildi
type TabKey = 'home' | 'services' | 'explore' | 'profile';

interface GuestMainScreenProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
}

// Chap 2 ta tab — CALL button'gacha
const LEFT_TABS: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'home',     icon: HomeIcon,      label: 'Home' },
  { key: 'services', icon: ConciergeBell, label: 'Services' },
];

// O'ng 2 ta tab — CALL button'dan keyin
const RIGHT_TABS: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'explore', icon: Compass, label: 'Explore' },
  { key: 'profile', icon: User,    label: 'Profile' },
];

// ⭐ Inner component
const GuestMainScreenContent: React.FC<GuestMainScreenProps> = ({
  hotel,
  room,
  settings,
  guestName,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showCallModal, setShowCallModal] = useState(false);

  const accentColor = settings.primary_color || '#f97316';

  // Context — notification panel
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    panelOpen,
    closePanel,
  } = useGuestNotificationsContext();

  // ⭐ CALL button bosilganda — modal ochiladi
  const handleCallReception = () => {
    console.log('[GuestApp] 📞 Opening call modal');
    setShowCallModal(true);
  };

  return (
    <div className="gms-screen">
      {/* ═════════════ TAB CONTENT ═════════════ */}
      {activeTab === 'home' && (
        <HomeTab
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
          accentColor={accentColor}
          onTabChange={(tab) => setActiveTab(tab as TabKey)}
        />
      )}

      {activeTab === 'services' && (
        <ServicesTab
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
          accentColor={accentColor}
          onTabChange={(tab) => setActiveTab(tab as TabKey)}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTab
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
          accentColor={accentColor}
          onLogout={() => {
            localStorage.removeItem('safora_guest_session');
            localStorage.removeItem('safora_guest_token');
          }}
        />
      )}

      {activeTab === 'explore' && (
        <ExploreTab
          hotel={hotel}
          settings={settings}
          accentColor={accentColor}
        />
      )}

      {/* ═════════════ BOTTOM NAVIGATION ═════════════ */}
      <nav className="gms-bottom-nav">
        {/* CHAP 2 TA tab */}
        {LEFT_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`gms-nav-btn ${isActive ? 'gms-nav-active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <div
                className="gms-nav-icon-wrap"
                style={
                  isActive ? { background: `${accentColor}15` } : undefined
                }
              >
                <Icon
                  size={20}
                  strokeWidth={2.2}
                  color={isActive ? accentColor : '#94a3b8'}
                />
              </div>
              <span
                className="gms-nav-label"
                style={isActive ? { color: accentColor } : undefined}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* ⭐⭐⭐ MARKAZ — ELEVATED CALL BUTTON ⭐⭐⭐ */}
        <button
          type="button"
          className="gms-call-btn"
          onClick={handleCallReception}
          aria-label="Call reception"
          style={{
            background: '#22c55e',
            boxShadow: '0 6px 20px rgba(34, 197, 94, 0.45), 0 0 0 4px #ffffff',
          }}
        >
          <Phone size={26} strokeWidth={2.4} color="#ffffff" />
        </button>

        {/* O'NG 2 TA tab */}
        {RIGHT_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`gms-nav-btn ${isActive ? 'gms-nav-active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <div
                className="gms-nav-icon-wrap"
                style={
                  isActive ? { background: `${accentColor}15` } : undefined
                }
              >
                <Icon
                  size={20}
                  strokeWidth={2.2}
                  color={isActive ? accentColor : '#94a3b8'}
                />
              </div>
              <span
                className="gms-nav-label"
                style={isActive ? { color: accentColor } : undefined}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ═════ NOTIFICATION PANEL ═════ */}
      <GuestNotificationPanel
        open={panelOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        accentColor={accentColor}
        onClose={closePanel}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />

      {/* ═════ ⭐ CALL MODAL ═════ */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        hotelName={hotel.name}
        hotelSlug={(hotel as any).slug || ''}
        roomNumber={room.number}
        guestName={guestName}
        accentColor={accentColor}
      />
    </div>
  );
};

// ⭐ Outer wrapper — Provider
const GuestMainScreen: React.FC<GuestMainScreenProps> = (props) => {
  return (
    <GuestNotificationsProvider
      hotelSlug={(props.hotel as any).slug || ''}
      roomNumber={props.room.number}
    >
      <GuestMainScreenContent {...props} />
    </GuestNotificationsProvider>
  );
};

export default GuestMainScreen;