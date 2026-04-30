// src/pages/portal/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════
// Rol konfiguratsiyasi
// ═══════════════════════════════════════════════════════
type RoleKey = 'management' | 'frontdesk' | 'housekeeping' | 'dept-manager';

interface RoleConfig {
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  navItems: { icon: string; label: string; key: string }[];
  stats: { icon: string; label: string; color: string }[];
}

const ROLE_CONFIG: Record<RoleKey, RoleConfig> = {
  management: {
    badge: 'MANAGEMENT',
    badgeColor: '#f97316',
    icon: 'fa-shield-halved',
    title: 'Management Dashboard',
    subtitle: 'Full Hotel Control',
    description: 'Manage your hotel operations, staff, and analytics',
    navItems: [
      { icon: 'fa-gauge-high', label: 'Dashboard', key: 'dashboard' },
      { icon: 'fa-calendar-check', label: 'Reservations', key: 'reservations' },
      { icon: 'fa-bed', label: 'Rooms', key: 'rooms' },
      { icon: 'fa-users', label: 'Staff', key: 'staff' },
      { icon: 'fa-chart-line', label: 'Reports', key: 'reports' },
      { icon: 'fa-gear', label: 'Settings', key: 'settings' },
    ],
    stats: [
      { icon: 'fa-calendar-check', label: 'Reservations Today', color: '#f97316' },
      { icon: 'fa-bed', label: 'Available Rooms', color: '#16a34a' },
      { icon: 'fa-users', label: 'Active Staff', color: '#0ea5e9' },
      { icon: 'fa-dollar-sign', label: 'Revenue Today', color: '#8b5cf6' },
    ],
  },
  frontdesk: {
    badge: 'FRONT DESK',
    badgeColor: '#dc2626',
    icon: 'fa-concierge-bell',
    title: 'Front Desk Dashboard',
    subtitle: 'Reception Operations',
    description: 'Manage check-ins, check-outs and guest services',
    navItems: [
      { icon: 'fa-gauge-high', label: 'Dashboard', key: 'dashboard' },
      { icon: 'fa-right-to-bracket', label: 'Check-in', key: 'checkin' },
      { icon: 'fa-right-from-bracket', label: 'Check-out', key: 'checkout' },
      { icon: 'fa-bed', label: 'Rooms', key: 'rooms' },
      { icon: 'fa-receipt', label: 'Billing', key: 'billing' },
    ],
    stats: [
      { icon: 'fa-right-to-bracket', label: 'Check-ins Today', color: '#dc2626' },
      { icon: 'fa-right-from-bracket', label: 'Check-outs Today', color: '#f97316' },
      { icon: 'fa-bed', label: 'Available Rooms', color: '#16a34a' },
      { icon: 'fa-bell', label: 'Pending Requests', color: '#8b5cf6' },
    ],
  },
  housekeeping: {
    badge: 'HOUSEKEEPING',
    badgeColor: '#ea580c',
    icon: 'fa-broom',
    title: 'Housekeeping Dashboard',
    subtitle: 'Room Management',
    description: 'Manage room cleaning and maintenance tasks',
    navItems: [
      { icon: 'fa-gauge-high', label: 'Dashboard', key: 'dashboard' },
      { icon: 'fa-list-check', label: 'My Tasks', key: 'tasks' },
      { icon: 'fa-bed', label: 'Rooms', key: 'rooms' },
      { icon: 'fa-spray-can', label: 'Cleaning', key: 'cleaning' },
    ],
    stats: [
      { icon: 'fa-list-check', label: 'Tasks Today', color: '#ea580c' },
      { icon: 'fa-spray-can', label: 'Rooms to Clean', color: '#f97316' },
      { icon: 'fa-circle-check', label: 'Completed', color: '#16a34a' },
      { icon: 'fa-triangle-exclamation', label: 'Urgent', color: '#dc2626' },
    ],
  },
  'dept-manager': {
    badge: 'QR MANAGER',
    badgeColor: '#ef4444',
    icon: 'fa-qrcode',
    title: 'QR Service Dashboard',
    subtitle: 'QR Operations',
    description: 'Manage QR codes, guest orders & requests',
    navItems: [
      { icon: 'fa-gauge-high', label: 'Dashboard', key: 'dashboard' },
      { icon: 'fa-users', label: 'Staff', key: 'staff' },
      { icon: 'fa-bed', label: 'Rooms', key: 'rooms' },
      { icon: 'fa-qrcode', label: 'QR Codes', key: 'qrcodes' },
      { icon: 'fa-grip', label: 'QR Rooms', key: 'qrrooms' },
      { icon: 'fa-bell-concierge', label: 'Services', key: 'services' },
      { icon: 'fa-gear', label: 'Settings', key: 'settings' },
    ],
    stats: [
      { icon: 'fa-cart-shopping', label: 'Orders Today', color: '#ef4444' },
      { icon: 'fa-bell-concierge', label: 'Requests Today', color: '#f97316' },
      { icon: 'fa-comment', label: 'Messages Today', color: '#0ea5e9' },
      { icon: 'fa-phone', label: 'Calls Today', color: '#16a34a' },
    ],
  },
};

interface Hotel {
  id: string;
  name: string;
  slug: string;
  service_type: 'full' | 'qr_only';
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const RoleDashboard: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const roleKey = (role || 'management') as RoleKey;
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.management;

  // ═══════════════════════════════════════════════════
  // Auth tekshirish + ma'lumot olish
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('safora_token');

      if (!token) {
        navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
        return;
      }

      try {
        // User ma'lumotlari
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (!meRes.ok) {
          // Token yaroqsiz
          localStorage.removeItem('safora_token');
          navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
          return;
        }

        const meData = await meRes.json();
        if (meData.success) {
          setUser(meData.user);
          if (meData.hotel) setHotel(meData.hotel);
        }

        // Hotel ma'lumotlari (agar /me'da yo'q bo'lsa)
        if (!meData.hotel && slug) {
          const hotelRes = await fetch(`${API_URL}/portal/${slug}`, {
            headers: { Accept: 'application/json' },
            credentials: 'include',
          });
          const hotelData = await hotelRes.json();
          if (hotelData.success) setHotel(hotelData.hotel);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, roleKey, navigate]);

  // ── Logout ────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('safora_token');
    navigate(`/portal/${slug}`, { replace: true });
  };

  // ── Vaqt ──────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour12: false,
  });

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="rd-loading">
        <i
          className="fa-solid fa-spinner fa-spin"
          style={{ fontSize: 36, color: '#f97316' }}
        />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="rd-root">
      {/* ════════ SIDEBAR ════════ */}
      <aside className={`rd-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="rd-logo">
          <div className="rd-logo-icon">
            <img src="/logo.png" alt="Safora" />
          </div>
          {sidebarOpen && <span className="rd-logo-text">Safora</span>}
        </div>

        {/* Hotel info */}
        {sidebarOpen && hotel && (
          <div className="rd-hotel-card">
            <div className="rd-hotel-icon" style={{ background: config.badgeColor }}>
              <i className={`fa-solid ${config.icon}`}></i>
            </div>
            <div className="rd-hotel-info">
              <div className="rd-hotel-name">{hotel.name}</div>
              <div className="rd-hotel-role">{config.badge}</div>
            </div>
          </div>
        )}

        {/* Section label */}
        {sidebarOpen && <div className="rd-section-label">{config.badge}</div>}

        {/* Nav items */}
        <nav className="rd-nav">
          {config.navItems.map((item) => (
            <button
              key={item.key}
              className={`rd-nav-item ${activeNav === item.key ? 'active' : ''}`}
              onClick={() => setActiveNav(item.key)}
              style={
                activeNav === item.key
                  ? {
                      background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
                    }
                  : {}
              }
            >
              <i className={`fa-solid ${item.icon}`}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="rd-user-card">
          <div className="rd-user-avatar">
            {user?.first_name?.[0] || 'U'}
          </div>
          {sidebarOpen && (
            <>
              <div className="rd-user-info">
                <div className="rd-user-name">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="rd-user-role">{config.badge}</div>
              </div>
              <button
                type="button"
                className="rd-logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <main className="rd-main">
        {/* Top bar */}
        <header className="rd-topbar">
          <button
            type="button"
            className="rd-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <Link to={`/portal/${slug}`} className="rd-breadcrumb">
            <i className="fa-solid fa-house"></i> Home
          </Link>

          <div className="rd-datetime">
            {formattedDate} — {formattedTime}
          </div>

          <div className="rd-topbar-actions">
            {hotel && (
              <div
                className="rd-hotel-badge"
                style={{
                  background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
                }}
              >
                <i className="fa-solid fa-hotel"></i>
                {hotel.name}
              </div>
            )}
            <button type="button" className="rd-icon-btn" title="Settings">
              <i className="fa-solid fa-gear"></i>
            </button>
            <button type="button" className="rd-icon-btn" title="Notifications">
              <i className="fa-solid fa-bell"></i>
            </button>
            <div className="rd-user-badge">
              <div className="rd-user-mini-avatar">
                {user?.first_name?.[0] || 'U'}
              </div>
              <span>
                {user?.first_name} - Safora PMS
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="rd-content">
          {/* Title */}
          <div className="rd-title-section">
            <div>
              <h1 className="rd-title">
                <i
                  className={`fa-solid ${config.icon}`}
                  style={{ color: config.badgeColor, marginRight: 8 }}
                ></i>
                {config.title}
              </h1>
              <p className="rd-subtitle">
                {config.description} for {hotel?.name || 'your hotel'}
              </p>
            </div>
            <div
              className="rd-status-pill"
              style={{
                background: `${config.badgeColor}10`,
                border: `1px solid ${config.badgeColor}30`,
                color: config.badgeColor,
              }}
            >
              <span
                className="rd-status-dot"
                style={{ background: config.badgeColor }}
              ></span>
              {config.subtitle} Active
            </div>
          </div>

          {/* Stats grid */}
          <div className="rd-stats-grid">
            {config.stats.map((stat, i) => (
              <div key={i} className="rd-stat-card">
                <div
                  className="rd-stat-icon"
                  style={{ color: stat.color, background: `${stat.color}15` }}
                >
                  <i className={`fa-solid ${stat.icon}`}></i>
                </div>
                <div className="rd-stat-value">0</div>
                <div className="rd-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Hotel info card */}
          {hotel && (
            <div className="rd-hotel-info-card">
              <div
                className="rd-hotel-info-icon"
                style={{ background: `${config.badgeColor}15`, color: config.badgeColor }}
              >
                <i className={`fa-solid ${config.icon}`}></i>
              </div>
              <div className="rd-hotel-info-text">
                <div className="rd-hotel-info-title">
                  {hotel.name} — {config.subtitle}
                </div>
                <div className="rd-hotel-info-meta">
                  <span>
                    <i className="fa-solid fa-bed"></i> 1 Rooms
                  </span>
                  <span>
                    <i className="fa-solid fa-users"></i> 3 Staff
                  </span>
                  <span style={{ color: '#16a34a' }}>
                    <i className="fa-solid fa-circle-check"></i> Online
                  </span>
                </div>
              </div>
              <div className="rd-quick-actions">
                <button type="button" className="rd-quick-btn">
                  <i className="fa-solid fa-qrcode"></i> QR Codes
                </button>
                <button type="button" className="rd-quick-btn">
                  <i className="fa-solid fa-bolt"></i> Live Feed
                </button>
                <button type="button" className="rd-quick-btn">
                  <i className="fa-solid fa-users"></i> Staff
                </button>
              </div>
            </div>
          )}

          {/* Bo'sh blok — kelajakda content qo'shamiz */}
          <div className="rd-empty-section">
            <div className="rd-empty-row">
              <div className="rd-empty-card">
                <div className="rd-empty-header">
                  <i
                    className="fa-solid fa-cart-shopping"
                    style={{ color: config.badgeColor }}
                  ></i>
                  Recent Activity
                </div>
                <div className="rd-empty-body">
                  <i className="fa-solid fa-inbox"></i>
                  <p>No recent activity yet</p>
                </div>
              </div>
              <div className="rd-empty-card">
                <div className="rd-empty-header">
                  <i className="fa-solid fa-bell" style={{ color: config.badgeColor }}></i>
                  Recent Requests
                </div>
                <div className="rd-empty-body">
                  <i className="fa-solid fa-inbox"></i>
                  <p>No recent requests yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleDashboard;