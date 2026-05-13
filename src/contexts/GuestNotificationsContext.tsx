// src/contexts/GuestNotificationsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useGuestNotifications } from '@hooks/useGuestNotifications';
// ⭐⭐⭐ TYPE'NI ALOHIDA `import type` BILAN IMPORT QILAMIZ
import type { GuestNotification } from '@hooks/useGuestNotifications';

interface ContextValue {
  notifications: GuestNotification[];
  unreadCount: number;
  hasUnread: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const GuestNotificationsContext = createContext<ContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  hotelSlug: string;
  roomNumber: string;
}

export const GuestNotificationsProvider: React.FC<ProviderProps> = ({
  children,
  hotelSlug,
  roomNumber,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useGuestNotifications({
    hotelSlug,
    roomNumber,
    enableSound: true,
  });

  return (
    <GuestNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        markAsRead,
        markAllAsRead,
        clearAll,
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
      }}
    >
      {children}
    </GuestNotificationsContext.Provider>
  );
};

export const useGuestNotificationsContext = (): ContextValue => {
  const ctx = useContext(GuestNotificationsContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      hasUnread: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAll: () => {},
      panelOpen: false,
      openPanel: () => {},
      closePanel: () => {},
    };
  }
  return ctx;
};