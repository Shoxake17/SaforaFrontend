// src/components/QuickCallPanel/QuickCallPanel.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Phone, Search, BedDouble, ChevronRight, Users } from 'lucide-react';
import { fetchRooms } from '@services/rooms';
import type { Room } from '@apptypes/room';
import RoomGuestsModal from '@components/RoomGuestsModal/RoomGuestsModal';
import type { RoomGuest } from '@services/roomGuests';
import './QuickCallPanel.css';

interface Props {
  hotelSlug: string;
  accentColor: string;
  onCallGuest: (params: { roomNumber: string; guest: RoomGuest }) => void;
}

const QuickCallPanel: React.FC<Props> = ({ hotelSlug, accentColor, onCallGuest }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelSlug) return;

    const load = async () => {
      setLoading(true);
      const result = await fetchRooms(hotelSlug);
      if (result.success) {
        const sorted = [...result.rooms].sort((a, b) =>
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setRooms(sorted);
      }
      setLoading(false);
    };

    load();
  }, [hotelSlug]);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => r.number.toLowerCase().includes(q));
  }, [rooms, search]);

  const handleSelectGuest = (guest: RoomGuest) => {
    if (!selectedRoom) return;
    onCallGuest({ roomNumber: selectedRoom, guest });
    setSelectedRoom(null);
  };

  return (
    <div className="qc-panel">
      <div className="qc-header">
        <div
          className="qc-header-icon"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <Phone size={16} strokeWidth={2.4} />
        </div>
        <div className="qc-header-text">
          <div className="qc-title">Quick Call</div>
          <div className="qc-subtitle">Tap room to view guests</div>
        </div>
        <div className="qc-count">{filteredRooms.length} rooms</div>
      </div>

      <div className="qc-search">
        <Search size={14} strokeWidth={2.4} className="qc-search-icon" />
        <input
          type="text"
          className="qc-search-input"
          placeholder="Search by room number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="qc-list">
        {loading ? (
          <div className="qc-empty">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="qc-empty">
            {search ? `No room matching "${search}"` : 'No rooms available'}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <button
              key={room.id || room.number}
              type="button"
              className="qc-row qc-row-clickable"
              onClick={() => setSelectedRoom(room.number)}
            >
              <div className="qc-room-info">
                <div
                  className="qc-room-icon"
                  style={{ background: `${accentColor}15`, color: accentColor }}
                >
                  <BedDouble size={14} strokeWidth={2.2} />
                </div>
                <span className="qc-room-number">Room {room.number}</span>
                {room.floor !== undefined && (
                  <span className="qc-room-floor">Floor {room.floor}</span>
                )}
              </div>

              <div className="qc-row-action">
                <Users size={13} strokeWidth={2.2} className="qc-action-icon" />
                <ChevronRight size={14} strokeWidth={2.4} className="qc-action-arrow" />
              </div>
            </button>
          ))
        )}
      </div>

      {selectedRoom && (
        <RoomGuestsModal
          isOpen={!!selectedRoom}
          hotelSlug={hotelSlug}
          roomNumber={selectedRoom}
          accentColor={accentColor}
          onClose={() => setSelectedRoom(null)}
          onSelectGuest={handleSelectGuest}
        />
      )}
    </div>
  );
};

export default QuickCallPanel;