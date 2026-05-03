// src/pages/rooms/EditRoomType.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Loader2,
  Layers,
  ArrowLeft,
  Save,
  Trash2,
} from 'lucide-react';

import { fetchRoomTypeById, updateRoomType, deleteRoomType } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout/PortalLayout';
import Alert from '@components/Alert';
import ConfirmDialog from '@components/ConfirmDialog';

import './AddRoomType.css';

const EditRoomType: React.FC = () => {
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

  const [name, setName] = useState('');
  const [pricePerNight, setPricePerNight] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('2');
  const [description, setDescription] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !slug || !id) return;

    const load = async () => {
      setLoading(true);
      const result = await fetchRoomTypeById(slug, id);
      setLoading(false);

      if (result.success && result.roomType) {
        setName(result.roomType.name);
        setPricePerNight(String(result.roomType.price_per_night));
        setCapacity(String(result.roomType.capacity || 2));
        setDescription(result.roomType.description || '');
        setAmenitiesText((result.roomType.amenities || []).join(', '));
      } else {
        setError(result.error || 'Failed to load room type');
      }
    };

    load();
  }, [isAuthenticated, slug, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !id) return;

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const price = parseFloat(pricePerNight);
    if (isNaN(price) || price < 0) {
      setError('Price must be a valid number');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const amenities = amenitiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const result = await updateRoomType(slug, id, {
      name: name.trim(),
      price_per_night: price,
      capacity: parseInt(capacity) || 2,
      description: description.trim(),
      amenities,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/portal/${slug}/${roleKey}/rooms`);
      }, 800);
    } else {
      setError(result.error || 'Failed to update room type');
    }
  };

  const handleDelete = async () => {
    if (!slug || !id) return;

    setDeleting(true);
    const result = await deleteRoomType(slug, id);
    setDeleting(false);

    if (result.success) {
      navigate(`/portal/${slug}/${roleKey}/rooms`);
    } else {
      setShowDeleteModal(false);
      setError(result.error || 'Failed to delete');
    }
  };

  return (
    <PortalLayout
      activeNav="rooms"
      pageLoading={loading}
      contentClassName="art-content"
      rootClassName="art-root"
      mainClassName="art-main"
    >
      {/* Topbar */}
      <div className="art-topbar">
        <div>
          <h1 className="art-title">
            <Layers
              size={22}
              strokeWidth={2.2}
              style={{ color: config.badgeColor, marginRight: 10 }}
            />
            Edit Room Type
          </h1>
          <p className="art-subtitle">Update room type details</p>
        </div>

        <Link to={`/portal/${slug}/${roleKey}/rooms`} className="art-back-btn">
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
          className="art-alert-spacing"
        />
      )}
      {success && (
        <Alert
          variant="success"
          message="Updated successfully"
          className="art-alert-spacing"
        />
      )}

      {/* Form */}
      <form className="art-form" onSubmit={handleSubmit}>
        <div className="art-grid">
          <div className="art-field art-field-full">
            <label className="art-label">Name *</label>
            <input
              type="text"
              className="art-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="art-field">
            <label className="art-label">Price per night (UZS) *</label>
            <input
              type="number"
              className="art-input"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              min={0}
              step="1000"
              required
            />
          </div>

          <div className="art-field">
            <label className="art-label">Capacity (guests)</label>
            <input
              type="number"
              className="art-input"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min={1}
              max={20}
            />
          </div>

          <div className="art-field art-field-full">
            <label className="art-label">Description</label>
            <textarea
              className="art-input art-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="art-field art-field-full">
            <label className="art-label">
              Amenities <span className="art-label-hint">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="art-input"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              placeholder="WiFi, TV, Air Conditioning"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="art-actions art-actions-edit">
          <button
            type="button"
            className="art-btn-delete"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            <Trash2 size={14} strokeWidth={2.2} />
            Delete
          </button>

          <div className="art-actions-right">
            <Link
              to={`/portal/${slug}/${roleKey}/rooms`}
              className="art-btn-cancel"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="art-btn-submit"
              disabled={submitting}
              style={{
                background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="art-spin" />
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
        </div>
      </form>

      {/* Delete confirmation — YANGI komponent */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this room type?"
        message="This action cannot be undone. Rooms using this type will keep their number but lose the type assignment."
        variant="danger"
        confirmText="Yes, Delete"
        confirmIcon={<Trash2 size={14} strokeWidth={2.2} />}
        loading={deleting}
      />
    </PortalLayout>
  );
};

export default EditRoomType;