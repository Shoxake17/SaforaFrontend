// src/contexts/StaffNotificationsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useStaffNotifications, type StaffNotification } from '@hooks/useStaffNotifications';

interface ContextValue {
  notifications: StaffNotification[];
  unreadCount: number;
  hasUnread: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const StaffNotificationsContext = createContext<ContextValue | null>(null);

export const StaffNotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const staffNotifs = useStaffNotifications();

  return (
    <StaffNotificationsContext.Provider
      value={{
        ...staffNotifs,
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
      }}
    >
      {children}
    </StaffNotificationsContext.Provider>
  );
};

export const useStaffNotificationsContext = () => {
  const ctx = useContext(StaffNotificationsContext);
  if (!ctx) throw new Error('useStaffNotificationsContext must be used within StaffNotificationsProvider');
  return ctx;
};
