// src/pages/guest/components/GuestMainScreen.tsx
import React, { useState } from 'react';
import {
  Home as HomeIcon,
  Store,
  Star,
  Compass,
  ConciergeBell,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

import HomeTab from '../tabs/HomeTab/HomeTab';

import './GuestMainScreen.css';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
type TabKey = 'home' | 'services' | 'market' | 'reviews' | 'explore';

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
  { key: 'reviews',  icon: Star,          label: 'Reviews' },
  { key: 'explore',  icon: Compass,       label: 'Explore' },
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
        <div className="gms-placeholder">
          <p>Services Tab — Bosqich 3</p>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="gms-placeholder">
          <p>Market Tab — Bosqich 3</p>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="gms-placeholder">
          <p>Reviews Tab — Bosqich 3</p>
        </div>
      )}

      {activeTab === 'explore' && (
        <div className="gms-placeholder">
          <p>Explore Tab — Bosqich 3</p>
        </div>
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