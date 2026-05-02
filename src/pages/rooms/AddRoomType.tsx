// src/pages/rooms/AddRoomType.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  Layers,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import useAuth from '@hooks/useAuth';
import { addRoomType } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';

import MainLayout from '@components/MainLayout';
import Sidebar from '@components/Sidebar';

import './AddRoomType.css';

const AddRoomType: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();
  const { hotel, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [pricePerNight, setPricePerNight] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('2');
  const [description, setDescription] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/portal/${slug}/login/${roleKey}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, slug, roleKey, navigate]);

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

    // Amenities — vergul bilan ajratilgan satrlarni array'ga
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

  if (authLoading) {
    return (
      <div className="art-loading">
        <Loader2 size={36} color={config.badgeColor} className="art-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="art-root">
      <Sidebar
        isOpen={sidebarOpen}
        hotel={hotel}
        activeNav="rooms"
        onNavChange={handleNavChange}
        onLogout={handleLogout}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="art-main">
        <MainLayout hotel={hotel} />

        <div className="art-content">
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

            <Link
              to={`/portal/${slug}/${roleKey}/rooms`}
              className="art-back-btn"
            >
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
              {/* Name */}
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

              {/* Price */}
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

              {/* Capacity */}
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

              {/* Description */}
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

              {/* Amenities */}
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
        </div>
      </main>
    </div>
  );
};

export default AddRoomType;