// src/pages/guest/components/GuestMainScreen.tsx
import React, { useState } from 'react';
import {
  Home as HomeIcon,
  User,
  Compass,
  ConciergeBell,
  Store,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import HomeTab from '../tabs/HomeTab/HomeTab';
import ExploreTab from '../tabs/ExploreTab/ExploreTab';
import MarketTab from '../tabs/MarketTab/MarketTab';
import ServicesTab from '../tabs/ServicesTab/ServicesTab';
import ProfileTab from '../tabs/ProfileTab/ProfileTab';

// ⭐ YANGI IMPORT'lar
import {
  GuestNotificationsProvider,
  useGuestNotificationsContext,
} from '@contexts/GuestNotificationsContext';
import GuestNotificationPanel from './GuestNotificationPanel/GuestNotificationPanel';

import './GuestMainScreen.css';

type TabKey = 'home' | 'services' | 'profile' | 'market' | 'explore';

interface GuestMainScreenProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
}

const BOTTOM_NAV: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'home',     icon: HomeIcon,      label: 'Home' },
  { key: 'services', icon: ConciergeBell, label: 'Services' },
  { key: 'market',   icon: Store,         label: 'Market' },
  { key: 'explore',  icon: Compass,       label: 'Explore' },
  { key: 'profile',  icon: User,          label: 'Profile' },
];

// ⭐ Inner component — Context'ga kira oladigan qism
const GuestMainScreenContent: React.FC<GuestMainScreenProps> = ({
  hotel,
  room,
  settings,
  guestName,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const accentColor = settings.primary_color || '#16a34a';

  // ⭐ Context'dan Panel uchun kerakli qiymatlar
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    panelOpen,
    closePanel,
  } = useGuestNotificationsContext();

  return (
    <div className="gms-screen">
      {/* TAB CONTENT */}
      {activeTab === 'home' && (
        <HomeTab
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
          accentColor={accentColor}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'services' && (
        <ServicesTab
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
          accentColor={accentColor}
          onTabChange={(tab) => setActiveTab(tab)}
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

      {activeTab === 'market' && (
        <MarketTab hotel={hotel} accentColor={accentColor} />
      )}

      {activeTab === 'explore' && (
        <ExploreTab hotel={hotel} settings={settings} accentColor={accentColor} />
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="gms-bottom-nav">
        {BOTTOM_NAV.map((item) => {
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
                style={isActive ? { background: `${accentColor}15` } : undefined}
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

      {/* ⭐⭐⭐ PANEL ENG YUQORI DARAJADA — endi clip bo'lmaydi */}
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
    </div>
  );
};

// ⭐ Outer wrapper — Provider'ni o'rab beradi
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