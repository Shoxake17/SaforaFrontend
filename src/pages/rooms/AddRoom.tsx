// src/pages/rooms/AddRoom.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  DoorOpen,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { addRoom, fetchRoomTypes } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import type { RoomType, RoomStatus } from '@apptypes/room';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout/PortalLayout';

import './AddRoom.css';

const AddRoom: React.FC = () => {
  const navigate = useNavigate();
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const config = getRoleConfig(role);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  // Form fields
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState<string>('1');
  const [block, setBlock] = useState('');
  const [status, setStatus] = useState<RoomStatus>('available');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);

  // Load room types
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const load = async () => {
      setTypesLoading(true);
      const result = await fetchRoomTypes(slug);
      if (result.success) setRoomTypes(result.roomTypes);
      setTypesLoading(false);
    };
    load();
  }, [isAuthenticated, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    if (!number.trim()) {
      setError('Room number is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData();
    fd.append('number', number.trim());
    fd.append('floor', floor || '1');
    fd.append('block', block.trim());
    fd.append('status', status);
    if (roomTypeId) fd.append('room_type_id', roomTypeId);
    fd.append('notes', notes);
    if (photo) fd.append('photo', photo);
    if (photo2) fd.append('photo2', photo2);

    const result = await addRoom(slug, fd);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/portal/${slug}/${roleKey}/rooms`);
      }, 800);
    } else {
      setError(result.error || 'Failed to create room');
    }
  };

  return (
    <PortalLayout
      activeNav="rooms"
      contentClassName="ar-content"
      rootClassName="ar-root"
      mainClassName="ar-main"
    >
      {/* Topbar */}
      <div className="ar-topbar">
        <div>
          <h1 className="ar-title">
            <DoorOpen
              size={22}
              strokeWidth={2.2}
              style={{ color: config.badgeColor, marginRight: 10 }}
            />
            Add Room
          </h1>
          <p className="ar-subtitle">Create a new room for your hotel</p>
        </div>

        <Link to={`/portal/${slug}/${roleKey}/rooms`} className="ar-back-btn">
          <ArrowLeft size={14} strokeWidth={2.2} />
          Back
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="ar-alert ar-alert-error">
          <AlertCircle size={16} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="ar-alert ar-alert-success">
          <CheckCircle size={16} strokeWidth={2.2} />
          <span>Room created successfully</span>
        </div>
      )}

      {/* Form */}
      <form className="ar-form" onSubmit={handleSubmit}>
        <div className="ar-grid">
          <div className="ar-field">
            <label className="ar-label">Number *</label>
            <input
              type="text"
              className="ar-input"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. 101"
              required
            />
          </div>

          <div className="ar-field">
            <label className="ar-label">Floor</label>
            <input
              type="number"
              className="ar-input"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="1"
              min={0}
            />
          </div>

          <div className="ar-field">
            <label className="ar-label">Room type</label>
            <select
              className="ar-input"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              disabled={typesLoading}
            >
              <option value="">— None —</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ar-field">
            <label className="ar-label">Block</label>
            <input
              type="text"
              className="ar-input"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              placeholder="e.g. A, B, Wing 1 (optional)"
            />
          </div>

          <div className="ar-field ar-field-full">
            <label className="ar-label">Status</label>
            <select
              className="ar-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="dirty">Dirty</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="ar-field ar-field-full">
            <label className="ar-label">Notes</label>
            <textarea
              className="ar-input ar-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes (optional)"
            />
          </div>

        </div>

        <div className="ar-actions">
          <Link
            to={`/portal/${slug}/${roleKey}/rooms`}
            className="ar-btn-cancel"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="ar-btn-submit"
            disabled={submitting}
            style={{
              background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="ar-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={2.4} />
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </PortalLayout>
  );
};

export default AddRoom;