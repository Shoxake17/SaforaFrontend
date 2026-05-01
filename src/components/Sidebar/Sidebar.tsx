// src/components/Sidebar/Sidebar.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import useAuth from '@hooks/useAuth';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import './Sidebar.css';

interface HotelType {
  name: string;
  logo?: string;
  [key: string]: any;
}

interface SidebarProps {
  isOpen: boolean;
  hotel?: HotelType | null;
  activeNav: string;
  onNavChange: (key: string) => void;
  onLogout: () => void;
  onToggle?: () => void;       // ← YANGI prop — toggle tugma uchun
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  hotel: hotelProp,
  activeNav,
  onNavChange,
  onLogout,
  onToggle,
}) => {
  const { role } = useParams<{ role: RoleKey }>();
  const { user, hotel: contextHotel } = useAuth();

  const hotel = hotelProp ?? contextHotel;
  const config = getRoleConfig(role);

  const RoleIcon = config.icon;

  const userInitial =
    (user?.first_name?.[0] || '').toUpperCase() +
    (user?.last_name?.[0] || '').toUpperCase();

  return (
    <aside className={`sb-root ${isOpen ? 'sb-open' : 'sb-closed'}`}>
      {/* ─── Role color strip ─── */}
      <div
        className="sb-role-strip"
        style={{ background: config.badgeColor }}
      />

      {/* ─── Header: Logo + Toggle button ─── */}
      <div className="sb-header">
        <div className="sb-logo">
          <img src="/logo.png" alt="Safora" className="sb-logo-img" />
          {isOpen && <span className="sb-logo-text">Safora</span>}
        </div>

        {/* Toggle tugma — Sidebar ichida */}
        {onToggle && (
          <button
            type="button"
            className="sb-toggle"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? (
              <PanelLeftClose size={18} strokeWidth={2.2} />
            ) : (
              <PanelLeftOpen size={18} strokeWidth={2.2} />
            )}
          </button>
        )}
      </div>

      {/* ─── Hotel card ─── */}
      {isOpen && hotel && (
        <div className="sb-hotel-card">
          <div
            className="sb-hotel-icon"
            style={{ background: config.badgeColor }}
          >
            {hotel.logo ? (
              <img src={hotel.logo} alt={hotel.name} />
            ) : (
              <RoleIcon size={18} strokeWidth={2.2} color="#fff" />
            )}
          </div>
          <div className="sb-hotel-info">
            <div className="sb-hotel-name">{hotel.name}</div>
            <div className="sb-hotel-role">{config.badge}</div>
          </div>
        </div>
      )}

      {/* ─── Section label ─── */}
      {isOpen && <div className="sb-section-label">{config.badge}</div>}

      {/* ─── Navigation ─── */}
      <nav className="sb-nav">
        {config.dashboardNavItems.map((item) => {
          const NavIcon = item.icon;
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`sb-nav-item ${isActive ? 'sb-active' : ''}`}
              onClick={() => onNavChange(item.key)}
              title={!isOpen ? item.label : undefined}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
                    }
                  : undefined
              }
            >
              <NavIcon size={18} strokeWidth={2.2} />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ─── Footer ─── */}
      <div className="sb-footer">
        <div className="sb-user">
          <div
            className="sb-user-avatar"
            style={{
              background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
            }}
          >
            {userInitial || 'U'}
          </div>
          {isOpen && (
            <div className="sb-user-info">
              <div className="sb-user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="sb-user-role">{config.badge}</div>
            </div>
          )}
        </div>

        {isOpen && (
          <button
            type="button"
            className="sb-logout"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;