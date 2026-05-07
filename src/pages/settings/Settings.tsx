// src/pages/settings/Settings.tsx
import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Image as ImageIcon,
  Hotel as HotelIcon,
  Save, Trash2, Upload, Loader2, Phone, Share2,
  MapPin, Compass, Plus, Edit2, Clock,
} from 'lucide-react';

import {
  FaInstagram, FaFacebookF, FaTelegramPlane, FaWhatsapp, FaTripadvisor,
} from 'react-icons/fa';
import { SiGooglemaps } from 'react-icons/si';

import useAuthGuard from '@hooks/useAuthGuard';
import PortalLayout from '@components/PortalLayout/PortalLayout';
import Alert from '@components/Alert';
import { imageUrl } from '@utils/imageUrl';
import { extractCoordsFromMapsUrl } from '@utils/distance';

import {
  fetchSettings, updateSettings, uploadCoverPhotos,
  deleteCoverPhoto, uploadRecommendationImage,
  RECOMMENDATION_CATEGORIES, DEFAULT_SETTINGS,
  type HotelSettings, type TouristRecommendation, type RecommendationCategory,
} from '@services/settings';

import './Settings.css';

const emptyRec: TouristRecommendation = {
  name: '',
  category: 'landmark',
  address: '',
  google_maps_link: '',
  description: '',
  image_url: '',
  latitude: null,
  longitude: null,
  open_hours: '',
};

const Settings: React.FC = () => {
  const { slug, isAuthenticated } = useAuthGuard();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<HotelSettings>(DEFAULT_SETTINGS);

  const [newRec, setNewRec] = useState<TouristRecommendation>(emptyRec);
  const [newRecPhoto, setNewRecPhoto] = useState<File | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [recBusy, setRecBusy] = useState(false);

  // ─── Load ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchSettings(slug);
      if (data) setSettings(data);
      setLoading(false);
    };
    load();
  }, [isAuthenticated, slug]);

  // ─── Cover photos ─────────────────────────
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !slug) return;
    const arr = Array.from(files);
    if (arr.length === 0) return;

    setUploading(true);
    setError(null);
    const result = await uploadCoverPhotos(slug, arr);
    setUploading(false);

    if (result.success && result.cover_photos) {
      setSettings({ ...settings, cover_photos: result.cover_photos });
      flashSuccess(`${arr.length} ta rasm yuklandi`);
    } else {
      setError(result.error || 'Rasm yuklashda xato');
    }
  };

  const handlePhotoDelete = async (idx: number) => {
    if (!slug || !window.confirm('Rasmni o\'chirishni tasdiqlaysizmi?')) return;
    const result = await deleteCoverPhoto(slug, idx);
    if (result.success && result.cover_photos) {
      setSettings({ ...settings, cover_photos: result.cover_photos });
    } else {
      setError(result.error || 'O\'chirishda xato');
    }
  };

  // ─── Save all ─────────────────────────────
  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    setError(null);

    // ⭐ WiFi va active_services BU YERDA SAQLANMAYDI — ular HotelServices sahifasidan
    const result = await updateSettings(slug, {
      welcome_title: settings.welcome_title,
      welcome_subtitle: settings.welcome_subtitle,
      hotel_rules: settings.hotel_rules,
      reception_phone: settings.reception_phone,
      whatsapp: settings.whatsapp,
      social_media: settings.social_media,
      directions: settings.directions,
      tourist_recommendations: settings.tourist_recommendations,
    });

    setSaving(false);
    if (result.success) flashSuccess('Sozlamalar saqlandi');
    else setError(result.error || 'Saqlashda xato');
  };

  // ─── Recommendations ──────────────────────
  const handleAddRec = async () => {
    if (!slug || !newRec.name.trim()) {
      setError('Joy nomini kiriting');
      return;
    }

    setRecBusy(true);
    setError(null);

    let imageUrlValue = newRec.image_url;

    if (newRecPhoto) {
      const upload = await uploadRecommendationImage(slug, newRecPhoto);
      if (upload.success && upload.url) {
        imageUrlValue = upload.url;
      } else {
        setError(upload.error || 'Rasm yuklashda xato');
        setRecBusy(false);
        return;
      }
    }

    const updated = [...settings.tourist_recommendations];
    const recData: TouristRecommendation = { ...newRec, image_url: imageUrlValue };

    if (editingIdx !== null) {
      updated[editingIdx] = recData;
    } else {
      updated.push(recData);
    }

    const result = await updateSettings(slug, { tourist_recommendations: updated });
    setRecBusy(false);

    if (result.success) {
      setSettings({ ...settings, tourist_recommendations: updated });
      setNewRec(emptyRec);
      setNewRecPhoto(null);
      setEditingIdx(null);
      flashSuccess(editingIdx !== null ? 'Yangilandi' : 'Qo\'shildi');
    } else {
      setError(result.error || 'Saqlashda xato');
    }
  };

  const handleEditRec = (idx: number) => {
    setNewRec(settings.tourist_recommendations[idx]);
    setEditingIdx(idx);
    setNewRecPhoto(null);
    setTimeout(() => {
      const formEl = document.querySelector('.st-rec-form');
      formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleDeleteRec = async (idx: number) => {
    if (!slug || !window.confirm('Joyni o\'chirishni tasdiqlaysizmi?')) return;
    const updated = settings.tourist_recommendations.filter((_, i) => i !== idx);
    const result = await updateSettings(slug, { tourist_recommendations: updated });
    if (result.success) {
      setSettings({ ...settings, tourist_recommendations: updated });
    }
  };

  const handleCancelRec = () => {
    setNewRec(emptyRec);
    setNewRecPhoto(null);
    setEditingIdx(null);
  };

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleMapsLinkChange = (link: string) => {
    const coords = extractCoordsFromMapsUrl(link);
    setNewRec({
      ...newRec,
      google_maps_link: link,
      ...(coords && { latitude: coords.lat, longitude: coords.lng }),
    });
  };

  return (
    <PortalLayout activeNav="settings" pageLoading={loading} contentClassName="st-content">
      {/* Header */}
      <div className="st-header">
        <div>
          <h1 className="st-title">
            <SettingsIcon size={22} strokeWidth={2.2} className="st-title-icon" />
            Settings
          </h1>
          <p className="st-subtitle">
            Configure your guest page, hotel rules, and tourist recommendations
          </p>
        </div>
        <button type="button" className="st-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 size={14} className="st-spin" /> Saving...</>
          ) : (
            <><Save size={14} strokeWidth={2.4} /> Save Changes</>
          )}
        </button>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} />}

      {/* ═══════ Cover Photos ═══════ */}
      <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <ImageIcon size={18} strokeWidth={2.2} />
            Hotel Cover Photos
          </div>
          <span className="st-card-hint">Carousel on guest page</span>
        </div>
        <p className="st-card-desc">
          Upload 2–5 photos for an animated carousel at the top of the guest QR page
        </p>

        {settings.cover_photos.length > 0 && (
          <div className="st-photo-grid">
            {settings.cover_photos.map((photo, idx) => (
              <div key={idx} className="st-photo-item">
                <span className="st-photo-num">{idx + 1}</span>
                <img src={imageUrl(photo.url)} alt={`Cover ${idx + 1}`} />
                <button type="button" className="st-photo-delete"
                  onClick={() => handlePhotoDelete(idx)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {settings.cover_photos.length < 5 && (
          <label className="st-upload-zone">
            <input type="file" accept="image/*" multiple hidden
              onChange={(e) => handlePhotoUpload(e.target.files)} disabled={uploading} />
            {uploading ? (
              <><Loader2 size={28} className="st-spin" /><div>Yuklanmoqda...</div></>
            ) : (
              <>
                <Upload size={28} strokeWidth={1.8} />
                <div className="st-upload-title">Drop photos here or click to browse</div>
                <div className="st-upload-sub">JPG, PNG up to 5MB each</div>
              </>
            )}
          </label>
        )}
      </div>

      {/* ═══════ Welcome & Rules ═══════ */}
      <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <HotelIcon size={18} strokeWidth={2.2} />
            Welcome &amp; Rules
          </div>
        </div>

        <div className="st-field">
          <label className="st-label">WELCOME TITLE</label>
          <input type="text" className="st-input" value={settings.welcome_title}
            onChange={(e) => setSettings({ ...settings, welcome_title: e.target.value })}
            placeholder="Welcome to Our Hotel" maxLength={200} />
        </div>

        <div className="st-field">
          <label className="st-label">WELCOME SUBTITLE</label>
          <input type="text" className="st-input" value={settings.welcome_subtitle}
            onChange={(e) => setSettings({ ...settings, welcome_subtitle: e.target.value })}
            placeholder="We are here to make your stay exceptional." maxLength={500} />
        </div>

        <div className="st-field">
          <label className="st-label">HOTEL RULES</label>
          <textarea className="st-input st-textarea" value={settings.hotel_rules} rows={5}
            onChange={(e) => setSettings({ ...settings, hotel_rules: e.target.value })}
            placeholder="Enter hotel rules — these will be shown to guests..." />
          <div className="st-field-hint">
            These rules will be displayed on the guest's mobile app
          </div>
        </div>
      </div>

      {/* ═══════ Contact ═══════ */}
      <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <Phone size={18} strokeWidth={2.2} className="st-icon-green" />
            Contact Info
          </div>
        </div>
        <div className="st-row-2">
          <div className="st-field">
            <label className="st-label">RECEPTION PHONE</label>
            <input type="tel" className="st-input" value={settings.reception_phone}
              onChange={(e) => setSettings({ ...settings, reception_phone: e.target.value })}
              placeholder="+998 XX XXX XX XX" />
          </div>
          <div className="st-field">
            <label className="st-label">WHATSAPP</label>
            <input type="tel" className="st-input" value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="998XXXXXXXXX" />
          </div>
        </div>
      </div>

      {/* ⛔ WIFI BLOCK OLIB TASHLANDI — endi /services sahifasida boshqariladi */}

      {/* ═══════ Social Media ═══════ */}
      <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <Share2 size={18} strokeWidth={2.2} className="st-icon-red" />
            Social Media
          </div>
        </div>
        <div className="st-row-2">
          <div className="st-field">
            <label className="st-label">
              <FaInstagram size={12} className="st-icon-pink" /> INSTAGRAM
            </label>
            <input type="url" className="st-input" value={settings.social_media.instagram}
              onChange={(e) => setSettings({
                ...settings, social_media: { ...settings.social_media, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/yourhotel" />
          </div>
          <div className="st-field">
            <label className="st-label">
              <FaFacebookF size={12} className="st-icon-blue" /> FACEBOOK
            </label>
            <input type="url" className="st-input" value={settings.social_media.facebook}
              onChange={(e) => setSettings({
                ...settings, social_media: { ...settings.social_media, facebook: e.target.value }
              })}
              placeholder="https://facebook.com/yourhotel" />
          </div>
          <div className="st-field">
            <label className="st-label">
              <FaTelegramPlane size={12} className="st-icon-blue" /> TELEGRAM
            </label>
            <input type="url" className="st-input" value={settings.social_media.telegram}
              onChange={(e) => setSettings({
                ...settings, social_media: { ...settings.social_media, telegram: e.target.value }
              })}
              placeholder="https://t.me/yourhotel" />
          </div>
          <div className="st-field">
            <label className="st-label">
              <FaWhatsapp size={12} className="st-icon-green" /> WHATSAPP CHANNEL
            </label>
            <input type="url" className="st-input" value={settings.social_media.whatsapp_channel}
              onChange={(e) => setSettings({
                ...settings, social_media: { ...settings.social_media, whatsapp_channel: e.target.value }
              })}
              placeholder="https://wa.me/yourhotel" />
          </div>
          <div className="st-field st-field-full">
            <label className="st-label">
              <FaTripadvisor size={12} className="st-icon-green" /> TRIPADVISOR
            </label>
            <input type="url" className="st-input" value={settings.social_media.tripadvisor}
              onChange={(e) => setSettings({
                ...settings, social_media: { ...settings.social_media, tripadvisor: e.target.value }
              })}
              placeholder="https://tripadvisor.com/..." />
          </div>
        </div>
      </div>

      {/* ═══════ Directions ═══════ */}
      {/* <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <Compass size={18} strokeWidth={2.2} className="st-icon-green" />
            Hotel Directions
          </div>
        </div>
        <p className="st-card-desc">
          Share your hotel location with guests
        </p>

        <div className="st-field">
          <label className="st-label">
            <SiGooglemaps size={12} className="st-icon-blue" /> GOOGLE MAPS
          </label>
          <input type="url" className="st-input" value={settings.directions.google_maps}
            onChange={(e) => setSettings({
              ...settings, directions: { ...settings.directions, google_maps: e.target.value }
            })}
            placeholder="https://maps.google.com/..." />
        </div>

        <div className="st-field">
          <label className="st-label">
            <MapPin size={12} className="st-icon-red" /> YANDEX MAPS
          </label>
          <input type="url" className="st-input" value={settings.directions.yandex_maps}
            onChange={(e) => setSettings({
              ...settings, directions: { ...settings.directions, yandex_maps: e.target.value }
            })}
            placeholder="https://yandex.com/maps/..." />
        </div>

        <div className="st-field">
          <label className="st-label">
            <MapPin size={12} className="st-icon-green" /> 2GIS
          </label>
          <input type="url" className="st-input" value={settings.directions.twogis}
            onChange={(e) => setSettings({
              ...settings, directions: { ...settings.directions, twogis: e.target.value }
            })}
            placeholder="https://2gis.com/..." />
        </div>
      </div> */}

      {/* ═══════ Tourist Recommendations ═══════ */}
      <div className="st-card">
        <div className="st-card-head">
          <div className="st-card-title">
            <MapPin size={18} strokeWidth={2.2} className="st-icon-orange" />
            Tourist Recommendations
          </div>
        </div>
        <p className="st-card-desc">
          Places guests should know about — shown in guest app with distance
        </p>

        {settings.tourist_recommendations.map((rec, idx) => (
          <div key={idx} className="st-rec-item">
            {rec.image_url ? (
              <img src={imageUrl(rec.image_url)} alt={rec.name} className="st-rec-img" />
            ) : (
              <div className="st-rec-img st-rec-img-placeholder">
                <MapPin size={20} />
              </div>
            )}
            <div className="st-rec-content">
              <div className="st-rec-cat">{rec.category.toUpperCase()}</div>
              <div className="st-rec-name">{rec.name}</div>
              <div className="st-rec-addr">
                <MapPin size={11} /> {rec.address || '—'}
                {rec.latitude && rec.longitude && (
                  <span style={{ marginLeft: 8, color: '#16a34a' }}>📍 GPS</span>
                )}
              </div>
            </div>
            <div className="st-rec-actions">
              <button type="button" className="st-rec-edit"
                onClick={() => handleEditRec(idx)} aria-label="Edit">
                <Edit2 size={13} />
              </button>
              <button type="button" className="st-rec-del"
                onClick={() => handleDeleteRec(idx)} aria-label="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        <div className="st-rec-form">
          <div className="st-rec-form-title">
            <Plus size={14} /> {editingIdx !== null ? 'Edit Place' : 'Add Place'}
          </div>

          <div className="st-row-2">
            <div className="st-field">
              <label className="st-label">NAME</label>
              <input type="text" className="st-input" value={newRec.name}
                onChange={(e) => setNewRec({ ...newRec, name: e.target.value })}
                placeholder="Registan Square" />
            </div>
            <div className="st-field">
              <label className="st-label">CATEGORY</label>
              <select className="st-input" value={newRec.category}
                onChange={(e) => setNewRec({
                  ...newRec, category: e.target.value as RecommendationCategory
                })}>
                {RECOMMENDATION_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">ADDRESS</label>
            <input type="text" className="st-input" value={newRec.address}
              onChange={(e) => setNewRec({ ...newRec, address: e.target.value })}
              placeholder="123 Main Street" />
          </div>

          <div className="st-field">
            <label className="st-label">GOOGLE MAPS LINK</label>
            <input type="url" className="st-input" value={newRec.google_maps_link}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="https://maps.google.com/..." />
            {newRec.latitude && newRec.longitude && (
              <div className="st-field-hint" style={{ color: '#16a34a' }}>
                ✓ Coordinates: {newRec.latitude.toFixed(4)}, {newRec.longitude.toFixed(4)}
              </div>
            )}
          </div>

          <div className="st-row-2">
            <div className="st-field">
              <label className="st-label">LATITUDE (optional)</label>
              <input type="number" step="any" className="st-input"
                value={newRec.latitude ?? ''}
                onChange={(e) => setNewRec({
                  ...newRec,
                  latitude: e.target.value ? parseFloat(e.target.value) : null
                })}
                placeholder="41.3111" />
            </div>
            <div className="st-field">
              <label className="st-label">LONGITUDE (optional)</label>
              <input type="number" step="any" className="st-input"
                value={newRec.longitude ?? ''}
                onChange={(e) => setNewRec({
                  ...newRec,
                  longitude: e.target.value ? parseFloat(e.target.value) : null
                })}
                placeholder="69.2401" />
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">
              <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
              OPEN HOURS
            </label>
            <input type="text" className="st-input" value={newRec.open_hours || ''}
              onChange={(e) => setNewRec({ ...newRec, open_hours: e.target.value })}
              placeholder="Open 24 Hours / Open 09:00 - 18:00" />
          </div>

          <div className="st-field">
            <label className="st-label">DESCRIPTION</label>
            <textarea className="st-input st-textarea" value={newRec.description} rows={3}
              onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
              placeholder="Brief description for guests..." />
          </div>

          <div className="st-field">
            <label className="st-label">PHOTO (OPTIONAL)</label>
            <input type="file" accept="image/*" className="st-file-input"
              onChange={(e) => setNewRecPhoto(e.target.files?.[0] || null)} />
            {newRecPhoto && <div className="st-rec-photo-name">📎 {newRecPhoto.name}</div>}
            {!newRecPhoto && newRec.image_url && (
              <div className="st-rec-photo-name">📎 Existing photo</div>
            )}
          </div>

          <div className="st-rec-form-actions">
            {editingIdx !== null && (
              <button type="button" className="st-rec-cancel" onClick={handleCancelRec}>
                Cancel
              </button>
            )}
            <button type="button" className="st-rec-add" onClick={handleAddRec} disabled={recBusy}>
              {recBusy ? (
                <><Loader2 size={14} className="st-spin" /> Saving...</>
              ) : (
                <><Plus size={14} /> {editingIdx !== null ? 'Update' : 'Add Place'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Settings;