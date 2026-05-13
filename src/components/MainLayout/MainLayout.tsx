// src/components/MainLayout/MainLayout.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Hotel, Bell } from 'lucide-react';
import useAuth from '@hooks/useAuth';
import ThemeToggle from '@components/ThemeToggle';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import './MainLayout.css';

interface HotelType {
  name: string;
  [key: string]: any;
}

interface MainLayoutProps {
  hotel?: HotelType | null;
}

/**
 * URL'dan joriy sahifa nomini aniqlaydi.
 */
const getPageTitle = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  // /portal/SLUG/ROLE/PAGE/...
  // segments[0]=portal, [1]=slug, [2]=role, [3]=page, [4]=action/id, [5]=action

  const page = segments[3];
  const action = segments[5];
  const addAction = segments[4];

  // Edit holati: /staff/:id/edit
  if (action === 'edit') {
    if (page === 'staff') return 'Edit Staff';
    if (page === 'rooms') return 'Edit Room';
    return 'Edit';
  }

  // Add holati: /staff/add
  if (addAction === 'add') {
    if (page === 'staff') return 'Add Staff';
    if (page === 'rooms') return 'Add Room';
    return 'Add';
  }

  // Asosiy sahifalar
  switch (page) {
    case 'dashboard':    return 'Dashboard';
    case 'staff':        return 'Staff';
    case 'rooms':        return 'Rooms';
    case 'qrrooms':      return 'QR Rooms';
    case 'services':     return 'Services';
    case 'settings':     return 'Settings';
    case 'reservations': return 'Reservations';
    case 'reports':      return 'Reports';
    case 'checkin':      return 'Check In';
    case 'checkout':     return 'Check Out';
    case 'billing':      return 'Billing';
    case 'tasks':        return 'Tasks';
    case 'cleaning':     return 'Cleaning';
    default:             return 'Dashboard';
  }
};

const MainLayout: React.FC<MainLayoutProps> = ({ hotel: hotelProp }) => {
  const { role } = useParams<{ slug: string; role: RoleKey }>();
  const location = useLocation();
  const { user, hotel: contextHotel } = useAuth();

  const hotel = hotelProp ?? contextHotel;
  const config = getRoleConfig(role);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Joriy sahifa nomi
  const pageTitle = getPageTitle(location.pathname);

  const weekday = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const day = currentTime.getDate();
  const month = currentTime.toLocaleDateString('en-US', { month: 'long' });
  const year = currentTime.getFullYear();
  const formattedDate = `${weekday}, ${day} ${month} ${year}`;
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour12: false });

  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'U';

  return (
    <header className="ml-topbar">
      {/* LEFT — Faqat sahifa nomi */}
      <div className="ml-left">
        <span className="ml-breadcrumb">
          {pageTitle}
        </span>
      </div>

      {/* CENTER */}
      <div className="ml-center">
        <div className="ml-clock">
          {formattedDate} — {formattedTime}
        </div>
      </div>

      {/* RIGHT */}
      <div className="ml-right">
        

        {/* Theme Toggle */}
        <ThemeToggle />

        <button
          type="button"
          className="ml-icon-btn ml-icon-bell"
          title="Notifications"
        >
          <Bell size={16} strokeWidth={2.2} />
        </button>

        <div className="ml-user">
          <div
            className="ml-user-avatar"
            style={{
              background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
            }}
          >
            {userInitial}
          </div>
          <span className="ml-user-name">
            {user?.first_name} - Safora PMS
          </span>
        </div>
      </div>
    </header>
  );
};

export default MainLayout;