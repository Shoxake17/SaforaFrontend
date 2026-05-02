// src/pages/rooms/Rooms.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  DoorOpen,
  Plus,
  Layers,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';

import useAuth from '@hooks/useAuth';
import { fetchRooms, fetchRoomTypes, deleteRoom } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import type { Room, RoomType } from '@apptypes/room';
import { ROOM_STATUS_CONFIG } from '@apptypes/room';

import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';
import EmptyStateCard from '@components/EmptyStateCard';

import './Rooms.css';

const RoomsPage: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();

  const {
    hotel,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);

  // ─── Auth check ──────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, slug, roleKey, navigate]);

  // ─── Fetch rooms + types ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !slug) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const [roomsRes, typesRes] = await Promise.all([
        fetchRooms(slug),
        fetchRoomTypes(slug),
      ]);

      if (roomsRes.success) {
        setRooms(roomsRes.rooms);
      } else {
        setError(roomsRes.error || 'Failed to load rooms');
      }

      if (typesRes.success) {
        setRoomTypes(typesRes.roomTypes);
      }

      setLoading(false);
    };

    loadData();
  }, [isAuthenticated, slug]);

  const handleLogout = async () => {
    await logout();
    navigate(`/portal/${slug}`, { replace: true });
  };

  const handleNavChange = (key: string) => {
    const routes: Record<string, string> = {
      dashboard: `/portal/${slug}/${roleKey}/dashboard`,
      staff:     `/portal/${slug}/${roleKey}/staff`,
      rooms:     `/portal/${slug}/${roleKey}/rooms`,
      qrcodes:   `/portal/${slug}/${roleKey}/qr-codes`,
      qrrooms:   `/portal/${slug}/${roleKey}/qr-rooms`,
      services:  `/portal/${slug}/${roleKey}/services`,
      settings:  `/portal/${slug}/${roleKey}/settings`,
    };
    const path = routes[key];
    if (path) navigate(path);
  };

  const handleDelete = async (room: Room) => {
    if (!slug) return;
    if (!window.confirm(`Delete room ${room.number}?`)) return;

    setDeletingId(room.id);
    const result = await deleteRoom(slug, room.id);
    setDeletingId(null);

    if (result.success) {
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } else {
      alert(result.error || 'Failed to delete');
    }
  };

  if (authLoading) {
    return (
      <div className="rm-loading">
        <Loader2 size={36} color={config.badgeColor} className="rm-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="rm-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav="rooms"
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="rm-main">
        <MainLayout hotel={hotel} />

        <div className="rm-content">
          {/* Header */}
          <div className="rm-header">
            <div>
              <h1 className="rm-title">
                <DoorOpen
                  size={22}
                  strokeWidth={2.2}
                  style={{ color: config.badgeColor, marginRight: 10 }}
                />
                Room Management
              </h1>
              <p className="rm-subtitle">Manage hotel rooms and room types</p>
            </div>

            <div className="rm-header-actions">
              <Link
                to={`/portal/${slug}/${roleKey}/rooms/types/add`}
                className="rm-btn-secondary"
              >
                <Layers size={14} strokeWidth={2.2} />
                Add Room Type
              </Link>
              <Link
                to={`/portal/${slug}/${roleKey}/rooms/add`}
                className="rm-btn-primary"
                style={{ background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)` }}
              >
                <Plus size={14} strokeWidth={2.4} />
                Add Room
              </Link>
            </div>
          </div>

          {error && (
            <div className="rm-error">
              <AlertCircle size={16} strokeWidth={2.2} />
              <span>{error}</span>
            </div>
          )}

          {/* Room Types section */}
          <div className="rm-section">
            <div className="rm-section-header">
              <Layers size={16} strokeWidth={2.2} style={{ color: config.badgeColor }} />
              <span>Room Types</span>
              <span className="rm-section-count">({roomTypes.length})</span>
            </div>

            <div className="rm-section-body">
              {loading ? (
                <div className="rm-section-loading">
                  <Loader2 size={20} className="rm-spin" />
                </div>
              ) : roomTypes.length === 0 ? (
                <p className="rm-empty-text">
                  No room types yet.{' '}
                  <Link
                    to={`/portal/${slug}/${roleKey}/rooms/types/add`}
                    style={{ color: config.badgeColor, fontWeight: 600 }}
                  >
                    Add one
                  </Link>
                  .
                </p>
              ) : (
                <div className="rm-types-grid">
                  {roomTypes.map((type) => (
                    <div key={type.id} className="rm-type-card">
                      <div className="rm-type-info">
                        <div className="rm-type-name">{type.name}</div>
                        <div className="rm-type-price">
                          {type.price_per_night.toLocaleString()} UZS / night
                        </div>
                      </div>
                      <Link
                        to={`/portal/${slug}/${roleKey}/rooms/types/${type.id}/edit`}
                        className="rm-type-edit"
                        title="Edit"
                      >
                        <Pencil size={13} strokeWidth={2.2} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rooms section */}
          <div className="rm-section">
            <div className="rm-section-header">
              <DoorOpen size={16} strokeWidth={2.2} style={{ color: config.badgeColor }} />
              <span>Rooms</span>
              <span className="rm-section-count">({rooms.length})</span>
            </div>

            <div className="rm-section-body">
              {loading ? (
                <div className="rm-section-loading">
                  <Loader2 size={24} className="rm-spin" />
                </div>
              ) : rooms.length === 0 ? (
                <EmptyStateCard
                  headerIcon={DoorOpen}
                  title="No Rooms"
                  message="No rooms added yet"
                  subMessage="Click 'Add Room' above to create your first room"
                  accentColor={config.badgeColor}
                  className="rm-empty-card"
                />
              ) : (
                <div className="rm-rooms-grid">
                  {rooms.map((room) => {
                    const statusCfg = ROOM_STATUS_CONFIG[room.status] || ROOM_STATUS_CONFIG.available;
                    const isDeleting = deletingId === room.id;

                    return (
                      <div key={room.id} className="rm-room-tile">
                        {/* Status dot */}
                        <span
                          className="rm-status-dot"
                          style={{
                            background: statusCfg.color,
                            boxShadow: `0 0 6px ${statusCfg.color}80`,
                          }}
                          title={statusCfg.label}
                        />

                        <div className="rm-room-num">{room.number}</div>
                        <div className="rm-room-type">
                          {room.room_type?.name || '—'}
                        </div>
                        <div className="rm-room-floor">
                          Floor {room.floor || '—'} · {statusCfg.label}
                        </div>

                        <div className="rm-room-actions">
                          <Link
                            to={`/portal/${slug}/${roleKey}/rooms/${room.id}/edit`}
                            className="rm-action-edit"
                          >
                            <Pencil size={11} strokeWidth={2.4} />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(room)}
                            disabled={isDeleting}
                            className="rm-action-delete"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <Loader2 size={11} className="rm-spin" />
                            ) : (
                              <Trash2 size={11} strokeWidth={2.4} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomsPage;