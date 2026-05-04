// src/components/QuickCallPanel.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Phone, Search, BedDouble } from 'lucide-react';
import { fetchRooms } from '@services/rooms';
import type { Room } from '@apptypes/room';
import './QuickCallPanel.css';

interface Props {
  hotelSlug: string;
  accentColor: string;
  onCallRoom: (roomNumber: string) => void;
}

const QuickCallPanel: React.FC<Props> = ({ hotelSlug, accentColor, onCallRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ═════ Xonalarni yuklash ═════
  useEffect(() => {
    if (!hotelSlug) return;

    const load = async () => {
      setLoading(true);
      const result = await fetchRooms(hotelSlug);
      if (result.success) {
        // Raqam bo'yicha tartibga solish (101, 102, 201, 202...)
        const sorted = [...result.rooms].sort((a, b) =>
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setRooms(sorted);
      }
      setLoading(false);
    };

    load();
  }, [hotelSlug]);

  // ═════ Search filter ═════
  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => r.number.toLowerCase().includes(q));
  }, [rooms, search]);

  return (
    <div className="qc-panel">
      {/* ═════ HEADER ═════ */}
      <div className="qc-header">
        <div
          className="qc-header-icon"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <Phone size={16} strokeWidth={2.4} />
        </div>
        <div className="qc-header-text">
          <div className="qc-title">Quick Call</div>
          <div className="qc-subtitle">Call any room directly</div>
        </div>
        <div className="qc-count">{filteredRooms.length} rooms</div>
      </div>

      {/* ═════ SEARCH ═════ */}
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

      {/* ═════ ROOMS LIST ═════ */}
      <div className="qc-list">
        {loading ? (
          <div className="qc-empty">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="qc-empty">
            {search ? `No room matching "${search}"` : 'No rooms available'}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div key={room.id || room.number} className="qc-row">
              <div className="qc-room-info">
                <div className="qc-room-icon">
                  <BedDouble size={14} strokeWidth={2.2} />
                </div>
                <span className="qc-room-number">Room {room.number}</span>
                {room.floor !== undefined && (
                  <span className="qc-room-floor">Floor {room.floor}</span>
                )}
              </div>

              <button
                type="button"
                className="qc-call-btn"
                style={{ background: accentColor }}
                onClick={() => onCallRoom(room.number)}
                aria-label={`Call room ${room.number}`}
              >
                <Phone size={13} strokeWidth={2.4} />
                <span>Call</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickCallPanel;