// src/pages/rooms/AddRoomType.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  Layers,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { addRoomType } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout';

import './AddRoomType.css';

const AddRoomType: React.FC = () => {
  const navigate = useNavigate();
  const { slug, roleKey, role } = useAuthGuard();
  const config = getRoleConfig(role);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [pricePerNight, setPricePerNight] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('2');
  const [description, setDescription] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

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

    const result = await addRoomType(slug, {
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
      setError(result.error || 'Failed to create room type');
    }
  };

  return (
    <PortalLayout
      activeNav="rooms"
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
            Add Room Type
          </h1>
          <p className="art-subtitle">
            Create a new room category (e.g. Standard, Deluxe, Suite)
          </p>
        </div>

        <Link to={`/portal/${slug}/${roleKey}/rooms`} className="art-back-btn">
          <ArrowLeft size={14} strokeWidth={2.2} />
          Back
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="art-alert art-alert-error">
          <AlertCircle size={16} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="art-alert art-alert-success">
          <CheckCircle size={16} strokeWidth={2.2} />
          <span>Room type created successfully</span>
        </div>
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
              placeholder="e.g. Standard, Deluxe, Suite"
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
              placeholder="500000"
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
              placeholder="2"
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
              placeholder="Brief description of this room type..."
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
              placeholder="WiFi, TV, Air Conditioning, Mini Bar"
            />
            <span className="art-field-hint">
              Separate amenities with commas
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="art-actions">
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
      </form>
    </PortalLayout>
  );
};

export default AddRoomType;