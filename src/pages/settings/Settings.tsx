// src/pages/settings/Settings.tsx
import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Image as ImageIcon,
  Hotel as HotelIcon,
  Save, Trash2, Upload, Loader2, Phone, Share2,
  MapPin, Plus, Edit2, Clock,
} from 'lucide-react';

import {
  FaInstagram, FaFacebookF, FaTelegramPlane, FaWhatsapp, FaTripadvisor,
} from 'react-icons/fa';

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

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    setError(null);

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
      const formEl = document.querySelector('.set-rec-form');
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

  // ⛔ pageLoading={loading} OLIB TASHLANDI — endi inline loading
  return (
    <PortalLayout activeNav="settings">
      {/* Header — har doim ko'rinadi */}
      <div className="set-header">
        <div>
          <h1 className="set-title">
            <SettingsIcon size={22} strokeWidth={2.2} className="set-title-icon" />
            Settings
          </h1>
          <p className="set-subtitle">
            Configure your guest page, hotel rules, and tourist recommendations
          </p>
        </div>
        <button type="button" className="set-save-btn" onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <><Loader2 size={14} className="set-spin" /> Saving...</>
          ) : (
            <><Save size={14} strokeWidth={2.4} /> Save Changes</>
          )}
        </button>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} />}

      {/* ⭐ INLINE LOADING — sidebar yo'qolmaydi */}
      {loading ? (
        <div className="set-inline-loading">
          <Loader2 size={28} className="set-spin" />
          <p>Loading settings...</p>
        </div>
      ) : (
        <>
          {/* Cover Photos */}
          <div className="set-card">
            <div className="set-card-head">
              <div className="set-card-title">
                <ImageIcon size={18} strokeWidth={2.2} />
                Hotel Cover Photos
              </div>
              <span className="set-card-hint">Carousel on guest page</span>
            </div>
            <p className="set-card-desc">
              Upload 2–5 photos for an animated carousel at the top of the guest QR page
            </p>

            {settings.cover_photos.length > 0 && (
              <div className="set-photo-grid">
                {settings.cover_photos.map((photo, idx) => (
                  <div key={idx} className="set-photo-item">
                    <span className="set-photo-num">{idx + 1}</span>
                    <img src={imageUrl(photo.url)} alt={`Cover ${idx + 1}`} />
                    <button type="button" className="set-photo-delete"
                      onClick={() => handlePhotoDelete(idx)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {settings.cover_photos.length < 5 && (
              <label className="set-upload-zone">
                <input type="file" accept="image/*" multiple hidden
                  onChange={(e) => handlePhotoUpload(e.target.files)} disabled={uploading} />
                {uploading ? (
                  <><Loader2 size={28} className="set-spin" /><div>Yuklanmoqda...</div></>
                ) : (
                  <>
                    <Upload size={28} strokeWidth={1.8} />
                    <div className="set-upload-title">Drop photos here or click to browse</div>
                    <div className="set-upload-sub">JPG, PNG up to 5MB each</div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Welcome & Rules */}
          <div className="set-card">
            <div className="set-card-head">
              <div className="set-card-title">
                <HotelIcon size={18} strokeWidth={2.2} />
                Welcome &amp; Rules
              </div>
            </div>

            <div className="set-field">
              <label className="set-label">WELCOME TITLE</label>
              <input type="text" className="set-input" value={settings.welcome_title}
                onChange={(e) => setSettings({ ...settings, welcome_title: e.target.value })}
                placeholder="Welcome to Our Hotel" maxLength={200} />
            </div>

            <div className="set-field">
              <label className="set-label">WELCOME SUBTITLE</label>
              <input type="text" className="set-input" value={settings.welcome_subtitle}
                onChange={(e) => setSettings({ ...settings, welcome_subtitle: e.target.value })}
                placeholder="We are here to make your stay exceptional." maxLength={500} />
            </div>

            <div className="set-field">
              <label className="set-label">HOTEL RULES</label>
              <textarea className="set-input set-textarea" value={settings.hotel_rules} rows={5}
                onChange={(e) => setSettings({ ...settings, hotel_rules: e.target.value })}
                placeholder="Enter hotel rules — these will be shown to guests..." />
              <div className="set-field-hint">
                These rules will be displayed on the guest's mobile app
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="set-card">
            <div className="set-card-head">
              <div className="set-card-title">
                <Phone size={18} strokeWidth={2.2} className="set-icon-green" />
                Contact Info
              </div>
            </div>
            <div className="set-row-2">
              <div className="set-field">
                <label className="set-label">RECEPTION PHONE</label>
                <input type="tel" className="set-input" value={settings.reception_phone}
                  onChange={(e) => setSettings({ ...settings, reception_phone: e.target.value })}
                  placeholder="+998 XX XXX XX XX" />
              </div>
              <div className="set-field">
                <label className="set-label">WHATSAPP</label>
                <input type="tel" className="set-input" value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="998XXXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="set-card">
            <div className="set-card-head">
              <div className="set-card-title">
                <Share2 size={18} strokeWidth={2.2} className="set-icon-red" />
                Social Media
              </div>
            </div>
            <div className="set-row-2">
              <div className="set-field">
                <label className="set-label">
                  <FaInstagram size={12} className="set-icon-pink" /> INSTAGRAM
                </label>
                <input type="url" className="set-input" value={settings.social_media.instagram}
                  onChange={(e) => setSettings({
                    ...settings, social_media: { ...settings.social_media, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/yourhotel" />
              </div>
              <div className="set-field">
                <label className="set-label">
                  <FaFacebookF size={12} className="set-icon-blue" /> FACEBOOK
                </label>
                <input type="url" className="set-input" value={settings.social_media.facebook}
                  onChange={(e) => setSettings({
                    ...settings, social_media: { ...settings.social_media, facebook: e.target.value }
                  })}
                  placeholder="https://facebook.com/yourhotel" />
              </div>
              <div className="set-field">
                <label className="set-label">
                  <FaTelegramPlane size={12} className="set-icon-blue" /> TELEGRAM
                </label>
                <input type="url" className="set-input" value={settings.social_media.telegram}
                  onChange={(e) => setSettings({
                    ...settings, social_media: { ...settings.social_media, telegram: e.target.value }
                  })}
                  placeholder="https://t.me/yourhotel" />
              </div>
              <div className="set-field">
                <label className="set-label">
                  <FaWhatsapp size={12} className="set-icon-green" /> WHATSAPP CHANNEL
                </label>
                <input type="url" className="set-input" value={settings.social_media.whatsapp_channel}
                  onChange={(e) => setSettings({
                    ...settings, social_media: { ...settings.social_media, whatsapp_channel: e.target.value }
                  })}
                  placeholder="https://wa.me/yourhotel" />
              </div>
              <div className="set-field set-field-full">
                <label className="set-label">
                  <FaTripadvisor size={12} className="set-icon-green" /> TRIPADVISOR
                </label>
                <input type="url" className="set-input" value={settings.social_media.tripadvisor}
                  onChange={(e) => setSettings({
                    ...settings, social_media: { ...settings.social_media, tripadvisor: e.target.value }
                  })}
                  placeholder="https://tripadvisor.com/..." />
              </div>
            </div>
          </div>

          {/* Tourist Recommendations */}
          <div className="set-card">
            <div className="set-card-head">
              <div className="set-card-title">
                <MapPin size={18} strokeWidth={2.2} className="set-icon-orange" />
                Tourist Recommendations
              </div>
            </div>
            <p className="set-card-desc">
              Places guests should know about — shown in guest app with distance
            </p>

            {settings.tourist_recommendations.map((rec, idx) => (
              <div key={idx} className="set-rec-item">
                {rec.image_url ? (
                  <img src={imageUrl(rec.image_url)} alt={rec.name} className="set-rec-img" />
                ) : (
                  <div className="set-rec-img set-rec-img-placeholder">
                    <MapPin size={20} />
                  </div>
                )}
                <div className="set-rec-content">
                  <div className="set-rec-cat">{rec.category.toUpperCase()}</div>
                  <div className="set-rec-name">{rec.name}</div>
                  <div className="set-rec-addr">
                    <MapPin size={11} /> {rec.address || '—'}
                    {rec.latitude && rec.longitude && (
                      <span style={{ marginLeft: 8, color: '#16a34a' }}>📍 GPS</span>
                    )}
                  </div>
                </div>
                <div className="set-rec-actions">
                  <button type="button" className="set-rec-edit"
                    onClick={() => handleEditRec(idx)} aria-label="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button type="button" className="set-rec-del"
                    onClick={() => handleDeleteRec(idx)} aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            <div className="set-rec-form">
              <div className="set-rec-form-title">
                <Plus size={14} /> {editingIdx !== null ? 'Edit Place' : 'Add Place'}
              </div>

              <div className="set-row-2">
                <div className="set-field">
                  <label className="set-label">NAME</label>
                  <input type="text" className="set-input" value={newRec.name}
                    onChange={(e) => setNewRec({ ...newRec, name: e.target.value })}
                    placeholder="Registan Square" />
                </div>
                <div className="set-field">
                  <label className="set-label">CATEGORY</label>
                  <select className="set-input" value={newRec.category}
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

              <div className="set-field">
                <label className="set-label">ADDRESS</label>
                <input type="text" className="set-input" value={newRec.address}
                  onChange={(e) => setNewRec({ ...newRec, address: e.target.value })}
                  placeholder="123 Main Street" />
              </div>

              <div className="set-field">
                <label className="set-label">GOOGLE MAPS LINK</label>
                <input type="url" className="set-input" value={newRec.google_maps_link}
                  onChange={(e) => handleMapsLinkChange(e.target.value)}
                  placeholder="https://maps.google.com/..." />
                {newRec.latitude && newRec.longitude && (
                  <div className="set-field-hint" style={{ color: '#16a34a' }}>
                    ✓ Coordinates: {newRec.latitude.toFixed(4)}, {newRec.longitude.toFixed(4)}
                  </div>
                )}
              </div>

              <div className="set-row-2">
                <div className="set-field">
                  <label className="set-label">LATITUDE (optional)</label>
                  <input type="number" step="any" className="set-input"
                    value={newRec.latitude ?? ''}
                    onChange={(e) => setNewRec({
                      ...newRec,
                      latitude: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="41.3111" />
                </div>
                <div className="set-field">
                  <label className="set-label">LONGITUDE (optional)</label>
                  <input type="number" step="any" className="set-input"
                    value={newRec.longitude ?? ''}
                    onChange={(e) => setNewRec({
                      ...newRec,
                      longitude: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="69.2401" />
                </div>
              </div>

              <div className="set-field">
                <label className="set-label">
                  <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                  OPEN HOURS
                </label>
                <input type="text" className="set-input" value={newRec.open_hours || ''}
                  onChange={(e) => setNewRec({ ...newRec, open_hours: e.target.value })}
                  placeholder="Open 24 Hours / Open 09:00 - 18:00" />
              </div>

              <div className="set-field">
                <label className="set-label">DESCRIPTION</label>
                <textarea className="set-input set-textarea" value={newRec.description} rows={3}
                  onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
                  placeholder="Brief description for guests..." />
              </div>

              <div className="set-field">
                <label className="set-label">PHOTO (OPTIONAL)</label>
                <input type="file" accept="image/*" className="set-file-input"
                  onChange={(e) => setNewRecPhoto(e.target.files?.[0] || null)} />
                {newRecPhoto && <div className="set-rec-photo-name">📎 {newRecPhoto.name}</div>}
                {!newRecPhoto && newRec.image_url && (
                  <div className="set-rec-photo-name">📎 Existing photo</div>
                )}
              </div>

              <div className="set-rec-form-actions">
                {editingIdx !== null && (
                  <button type="button" className="set-rec-cancel" onClick={handleCancelRec}>
                    Cancel
                  </button>
                )}
                <button type="button" className="set-rec-add" onClick={handleAddRec} disabled={recBusy}>
                  {recBusy ? (
                    <><Loader2 size={14} className="set-spin" /> Saving...</>
                  ) : (
                    <><Plus size={14} /> {editingIdx !== null ? 'Update' : 'Add Place'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
};

export default Settings;