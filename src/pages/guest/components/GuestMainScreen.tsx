// src/pages/guest/components/GuestMainScreen.tsx
import React from 'react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

interface Props {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
}

const GuestMainScreen: React.FC<Props> = ({ hotel, guestName }) => {
  return (
    <div className="guest-main">
      <div className="guest-welcome">
        <h2 className="guest-welcome-name">Welcome, {guestName}</h2>
        <p className="guest-welcome-sub">Main screen coming soon...</p>
      </div>

      <div style={{ marginTop: 30, textAlign: 'center', padding: 20, background: '#fff', borderRadius: 16 }}>
        <p>Hotel: {hotel.name}</p>
        <p>This is where the tabs (Home, Services, Market, Reviews, etc.) will go.</p>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
          Bosqich 2 — keyingi javobda qilamiz
        </p>
      </div>
    </div>
  );
};

export default GuestMainScreen;