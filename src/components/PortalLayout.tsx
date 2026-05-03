// src/components/PortalLayout.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import Sidebar from './Sidebar';
import MainLayout from './MainLayout';
import IncomingCallOverlay from './IncomingCall/IncomingCallOverlay';
import useAuthGuard from '@hooks/useAuthGuard';
import useHotel from '@hooks/useHotel';
import usePortalNavigation from '@hooks/useNavigation';
import { getRoleConfig } from '@config/roles';

interface PortalLayoutProps {
  /** Active sidebar nav key (e.g. 'dashboard', 'staff', 'rooms') */
  activeNav: string;
  /** Page content */
  children: React.ReactNode;
  /** Optional loading state from page (e.g. data still loading) */
  pageLoading?: boolean;
  /** Custom loading message */
  loadingText?: string;
  /** CSS class for the content wrapper (e.g. 'rd-content', 'st-content') */
  contentClassName?: string;
  /** CSS class for the root element (e.g. 'rd-root', 'st-root') */
  rootClassName?: string;
  /** CSS class for the main element */
  mainClassName?: string;
}

/**
 * Universal portal layout wrapper.
 * Handles: auth guard, hotel loading, sidebar, navigation, logout.
 *
 * Pages just provide their content + activeNav.
 *
 * Includes global IncomingCallOverlay for manager/receptionist/dept_manager roles.
 */
const PortalLayout: React.FC<PortalLayoutProps> = ({
  activeNav,
  children,
  pageLoading = false,
  loadingText = 'Loading...',
  contentClassName = '',
  rootClassName = '',
  mainClassName = '',
}) => {
  const { slug, roleKey, role, isAuthenticated, isAuthLoading, handleLogout } =
    useAuthGuard();
  const { hotel, hotelLoading } = useHotel(slug, isAuthenticated);
  const { goTo } = usePortalNavigation(slug, roleKey);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const config = getRoleConfig(role);
  const isLoading = isAuthLoading || hotelLoading || pageLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className={`pl-loading ${rootClassName}`}>
        <Loader2 size={36} color={config.badgeColor} className="pl-spin" />
        <p>{loadingText}</p>
      </div>
    );
  }

  // Auth check failed (redirect happens in useAuthGuard)
  if (!isAuthenticated) return null;

  // ═══════════════════════════════════════════════════════
  // Call qabul qila oladigan rolelar
  // Role'larni har xil formatda qabul qilish (dept-manager, dept_manager)
  // ═══════════════════════════════════════════════════════
  const normalizedRole = String(role || roleKey || '')
    .toLowerCase()
    .replace(/[-\s]/g, '_');

  const canReceiveCalls =
    normalizedRole === 'manager' ||
    normalizedRole === 'receptionist' ||
    normalizedRole === 'dept_manager' ||
    normalizedRole.startsWith('dept_manager');

  // DEBUG (vaqtinchalik — keyin o'chirish mumkin)
  console.log(
    '[PortalLayout]',
    'role:', role,
    '| roleKey:', roleKey,
    '| normalized:', normalizedRole,
    '| canReceiveCalls:', canReceiveCalls
  );

  return (
    <div className={`pl-root ${rootClassName}`}>
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav={activeNav}
        onNavChange={goTo}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`pl-main ${mainClassName}`}>
        <MainLayout hotel={hotel} />

        <div className={`pl-content ${contentClassName}`}>{children}</div>
      </main>

      {/* ═══ Global Incoming Call Overlay ═══ */}
      {canReceiveCalls && <IncomingCallOverlay />}
    </div>
  );
};

export default PortalLayout;