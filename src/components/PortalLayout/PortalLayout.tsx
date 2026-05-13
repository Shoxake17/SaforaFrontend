// src/components/PortalLayout/PortalLayout.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import './PortalLayout.css';
import Sidebar from '../Sidebar';
import MainLayout from '../MainLayout';
import IncomingCallOverlay from '../IncomingCall/IncomingCallOverlay';
import useAuthGuard from '@hooks/useAuthGuard';
import useHotel from '@hooks/useHotel';
import usePortalNavigation from '@hooks/useNavigation';
import { getRoleConfig } from '@config/roles';

interface PortalLayoutProps {
  activeNav: string;
  children: React.ReactNode;
  pageLoading?: boolean;
  loadingText?: string;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({
  activeNav,
  children,
  pageLoading = false,
  loadingText = 'Loading...',
}) => {
  const { slug, roleKey, role, isAuthenticated, isAuthLoading, handleLogout } =
    useAuthGuard();
  const { hotel, hotelLoading } = useHotel(slug, isAuthenticated);
  const { goTo } = usePortalNavigation(slug, roleKey);

  // ⭐ Sidebar holati localStorage'da saqlanadi
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('safora_sidebar_open');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('safora_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  const config = getRoleConfig(role);
  const isLoading = isAuthLoading || hotelLoading || pageLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="pl-loading">
        <Loader2 size={36} color={config.badgeColor} className="pl-spin" />
        <p>{loadingText}</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ─── Call qabul qila oladigan rolelar ───
  const normalizedRole = String(role || roleKey || '')
    .toLowerCase()
    .replace(/[-\s]/g, '_');

  const canReceiveCalls =
    normalizedRole === 'manager' ||
    normalizedRole === 'receptionist' ||
    normalizedRole === 'dept_manager' ||
    normalizedRole.startsWith('dept_manager');

  return (
    <div className={`pl-root ${sidebarOpen ? 'pl-open' : 'pl-closed'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav={activeNav}
        onNavChange={goTo}
        onLogout={handleLogout}
        onToggle={toggleSidebar}
      />

      <main className="pl-main">
        <MainLayout hotel={hotel} />
        <div className="pl-content">{children}</div>
      </main>

      {canReceiveCalls && <IncomingCallOverlay />}
    </div>
  );
};

export default PortalLayout;