// src/pages/guest/components/GuestMainScreen.tsx
import React, { useState } from 'react';
import {
  Home as HomeIcon,
  User,
  Star,
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

import './GuestMainScreen.css';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
type TabKey = 'home' | 'services' | 'profile' | 'market' | 'explore';

interface GuestMainScreenProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
}

// ═══════════════════════════════════════════════════════
// Bottom Navigation Configuration
// ═══════════════════════════════════════════════════════
const BOTTOM_NAV: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'home',     icon: HomeIcon,      label: 'Home' },
  { key: 'services', icon: ConciergeBell, label: 'Services' },
  { key: 'market',   icon: Store,         label: 'Market' },
  { key: 'explore',  icon: Compass,       label: 'Explore' },
  { key: 'profile',     icon: User,          label: 'Profile' },

];

// ═══════════════════════════════════════════════════════
// Component — TAB MANAGER
// ═══════════════════════════════════════════════════════
const GuestMainScreen: React.FC<GuestMainScreenProps> = ({
  hotel,
  room,
  settings,
  guestName,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // Hotel accent color
  const accentColor = settings.primary_color || '#16a34a';

  return (
    <div className="gms-screen">
      {/* ═══════════════ TAB CONTENT ═══════════════ */}
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
    onCallClick={() => setShowCallModal(true)}
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
      // Logout logic — masalan:
      localStorage.removeItem('safora_guest_session');
      navigate('/login');
    }}
  />
)}

      {activeTab === 'market' && (
        <MarketTab hotel={hotel} accentColor={accentColor} />
      )}

      {activeTab === 'explore' && (
  <ExploreTab
    hotel={hotel}
    settings={settings}
    accentColor={accentColor}
  />
)}

      {/* ═══════════════ BOTTOM NAVIGATION ═══════════════ */}
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
    </div>
  );
};

export default GuestMainScreen;