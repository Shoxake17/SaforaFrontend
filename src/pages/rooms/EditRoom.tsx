// src/pages/rooms/EditRoom.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Loader2,
  DoorOpen,
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  Film,
  CheckCircle,
} from 'lucide-react';

import {
  fetchRoomById,
  fetchRoomTypes,
  updateRoom,
  deleteRoom,
} from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import type { RoomType, RoomStatus } from '@apptypes/room';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout';
import Alert from '@components/Alert';
import ConfirmDialog from '@components/ConfirmDialog';

import './AddRoom.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace('/api', '');

const EditRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const config = getRoleConfig(role);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Form fields
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState<string>('1');
  const [block, setBlock] = useState('');
  const [status, setStatus] = useState<RoomStatus>('available');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [notes, setNotes] = useState('');

  // Existing files
  const [existingPhoto, setExistingPhoto] = useState<string>('');
  const [existingPhoto2, setExistingPhoto2] = useState<string>('');
  const [existingVideo, setExistingVideo] = useState<string>('');

  // New files
  const [photo, setPhoto] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !slug || !id) return;

    const load = async () => {
      setLoading(true);
      const [roomRes, typesRes] = await Promise.all([
        fetchRoomById(slug, id),
        fetchRoomTypes(slug),
      ]);
      setLoading(false);

      if (roomRes.success && roomRes.room) {
        const r = roomRes.room as any;
        setNumber(r.number);
        setFloor(String(r.floor || 1));
        setBlock(r.block || '');
        setStatus(r.status as RoomStatus);
        setRoomTypeId(r.room_type_id || r.room_type?.id || '');
        setNotes(r.notes || '');
        setExistingPhoto(r.photo || '');
        setExistingPhoto2(r.photo2 || '');
        setExistingVideo(r.video || '');
      } else {
        setError(roomRes.error || 'Failed to load room');
      }

      if (typesRes.success) setRoomTypes(typesRes.roomTypes);
    };

    load();
  }, [isAuthenticated, slug, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !id) return;

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
    fd.append('room_type_id', roomTypeId);
    fd.append('notes', notes);
    if (photo) fd.append('photo', photo);
    if (photo2) fd.append('photo2', photo2);
    if (video) fd.append('video', video);

    const result = await updateRoom(slug, id, fd);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/portal/${slug}/${roleKey}/rooms`);
      }, 800);
    } else {
      setError(result.error || 'Failed to update room');
    }
  };

  const handleDelete = async () => {
    if (!slug || !id) return;

    setDeleting(true);
    const result = await deleteRoom(slug, id);
    setDeleting(false);

    if (result.success) {
      navigate(`/portal/${slug}/${roleKey}/rooms`);
    } else {
      setShowDeleteModal(false);
      setError(result.error || 'Failed to delete');
    }
  };

  const fileUrl = (filename: string) =>
    filename ? `${API_BASE}/uploads/rooms/${filename}` : '';

  // Existing file link helper
  const ExistingFileLink: React.FC<{
    filename: string;
    icon: React.ReactNode;
    label: string;
  }> = ({ filename, icon, label }) => {
    if (!filename) return null;
    return (
      <div className="ar-existing-preview">
        {icon}
        <a href={fileUrl(filename)} target="_blank" rel="noreferrer">
          {label}
        </a>
      </div>
    );
  };

  return (
    <PortalLayout
      activeNav="rooms"
      pageLoading={loading}
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
            Edit Room {number && `— ${number}`}
          </h1>
          <p className="ar-subtitle">Update room details</p>
        </div>

        <Link to={`/portal/${slug}/${roleKey}/rooms`} className="ar-back-btn">
          <ArrowLeft size={14} strokeWidth={2.2} />
          Back
        </Link>
      </div>

      {/* Alerts — YANGI komponent */}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="ar-alert-spacing"
        />
      )}
      {success && (
        <Alert
          variant="success"
          message="Room updated successfully"
          className="ar-alert-spacing"
        />
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
              min={0}
            />
          </div>

          <div className="ar-field">
            <label className="ar-label">Room type</label>
            <select
              className="ar-input"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
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

          {/* Photo 1 */}
          <div className="ar-field">
            <label className="ar-label">
              Photo
              {existingPhoto && !photo && (
                <span className="ar-label-hint">(current saved)</span>
              )}
            </label>
            {!photo && (
              <ExistingFileLink
                filename={existingPhoto}
                icon={<ImageIcon size={14} strokeWidth={2.2} />}
                label="View current photo"
              />
            )}
            <input
              type="file"
              className="ar-input ar-file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            {photo && (
              <div className="ar-new-file">
                <CheckCircle size={12} color="#16a34a" /> {photo.name}
              </div>
            )}
          </div>

          {/* Photo 2 */}
          <div className="ar-field">
            <label className="ar-label">
              Photo 2
              {existingPhoto2 && !photo2 && (
                <span className="ar-label-hint">(current saved)</span>
              )}
            </label>
            {!photo2 && (
              <ExistingFileLink
                filename={existingPhoto2}
                icon={<ImageIcon size={14} strokeWidth={2.2} />}
                label="View current photo"
              />
            )}
            <input
              type="file"
              className="ar-input ar-file"
              accept="image/*"
              onChange={(e) => setPhoto2(e.target.files?.[0] || null)}
            />
            {photo2 && (
              <div className="ar-new-file">
                <CheckCircle size={12} color="#16a34a" /> {photo2.name}
              </div>
            )}
          </div>

          {/* Video */}
          <div className="ar-field ar-field-full">
            <label className="ar-label">
              Video
              {existingVideo && !video && (
                <span className="ar-label-hint">(current saved)</span>
              )}
            </label>
            {!video && (
              <ExistingFileLink
                filename={existingVideo}
                icon={<Film size={14} strokeWidth={2.2} />}
                label="View current video"
              />
            )}
            <input
              type="file"
              className="ar-input ar-file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
            />
            {video && (
              <div className="ar-new-file">
                <CheckCircle size={12} color="#16a34a" /> {video.name}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="ar-actions ar-actions-edit">
          <button
            type="button"
            className="ar-btn-delete"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            <Trash2 size={14} strokeWidth={2.2} />
            Delete
          </button>

          <div className="ar-actions-right">
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete confirmation — YANGI komponent */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete room ${number}?`}
        message="This action cannot be undone. The room and all associated files (photos, videos) will be permanently removed."
        variant="danger"
        confirmText="Yes, Delete"
        confirmIcon={<Trash2 size={14} strokeWidth={2.2} />}
        loading={deleting}
      />
    </PortalLayout>
  );
};

export default EditRoom;