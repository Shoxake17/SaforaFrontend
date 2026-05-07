// src/components/GymManageModal/GymManageModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Trash2, Save, Clock, MapPin, Dumbbell, FileText } from 'lucide-react';
import { uploadServiceImage, type GymDetails, DEFAULT_GYM } from '@services/settings';
import { imageUrl } from '@utils/imageUrl';
import './GymManageModal.css';

interface GymManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  gym: GymDetails;
  onSave: (gym: GymDetails) => void;
}

const GymManageModal: React.FC<GymManageModalProps> = ({
  isOpen,
  onClose,
  slug,
  gym,
  onSave,
}) => {
  const [localGym, setLocalGym] = useState<GymDetails>(DEFAULT_GYM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalGym({
        image_url: gym?.image_url || '',
        description: gym?.description || '',
        open_time: gym?.open_time || '06:00',
        close_time: gym?.close_time || '23:00',
        is_24_hours: gym?.is_24_hours || false,
        location: gym?.location || '',
      });
      setPhotoFile(null);
      setError(null);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, gym]);

  if (!isOpen) return null;

  const handleSave = async () => {
    let finalImageUrl = localGym.image_url;

    if (photoFile) {
      setUploading(true);
      setError(null);
      const result = await uploadServiceImage(slug, photoFile);
      setUploading(false);

      if (!result.success || !result.url) {
        setError(result.error || 'Rasm yuklashda xato');
        return;
      }
      finalImageUrl = result.url;
    }

    onSave({ ...localGym, image_url: finalImageUrl });
    onClose();
  };

  const handleRemovePhoto = () => {
    setLocalGym({ ...localGym, image_url: '' });
    setPhotoFile(null);
  };

  const previewUrl = photoFile
    ? URL.createObjectURL(photoFile)
    : (localGym.image_url ? imageUrl(localGym.image_url) : '');

  return (
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gm-header">
          <div className="gm-header-icon">
            <Dumbbell size={22} strokeWidth={2.2} />
          </div>
          <div className="gm-header-text">
            <h2 className="gm-title">Manage Gym & Fitness</h2>
            <p className="gm-subtitle">Add details guests will see</p>
          </div>
          <button type="button" className="gm-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {error && <div className="gm-error">⚠️ {error}</div>}

        <div className="gm-content">
          {/* PHOTO */}
          <div className="gm-field">
            <label className="gm-label">PHOTO</label>
            {previewUrl ? (
              <div className="gm-photo-preview">
                <img src={previewUrl} alt="Gym preview" />
                <button
                  type="button"
                  className="gm-photo-remove"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className="gm-upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPhotoFile(file);
                  }}
                  disabled={uploading}
                />
                <Upload size={28} strokeWidth={1.8} />
                <div className="gm-upload-title">Click to upload gym photo</div>
                <div className="gm-upload-sub">JPG, PNG up to 5MB</div>
              </label>
            )}
          </div>

          {/* HOURS */}
          <div className="gm-field">
            <label className="gm-label">
              <Clock size={11} strokeWidth={2.4} />
              OPENING HOURS
            </label>

            <div
              className="gm-24h-toggle"
              onClick={() =>
                setLocalGym({ ...localGym, is_24_hours: !localGym.is_24_hours })
              }
            >
              <span className="gm-24h-label">Open 24 hours</span>
              <button
                type="button"
                className={`gm-toggle ${localGym.is_24_hours ? 'is-on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalGym({ ...localGym, is_24_hours: !localGym.is_24_hours });
                }}
              >
                <span className="gm-toggle-thumb" />
              </button>
            </div>

            {!localGym.is_24_hours && (
              <div className="gm-time-row">
                <div className="gm-time-field">
                  <label className="gm-time-label">OPENS AT</label>
                  <input
                    type="time"
                    className="gm-input gm-time-input"
                    value={localGym.open_time}
                    onChange={(e) =>
                      setLocalGym({ ...localGym, open_time: e.target.value })
                    }
                  />
                </div>
                <div className="gm-time-divider">—</div>
                <div className="gm-time-field">
                  <label className="gm-time-label">CLOSES AT</label>
                  <input
                    type="time"
                    className="gm-input gm-time-input"
                    value={localGym.close_time}
                    onChange={(e) =>
                      setLocalGym({ ...localGym, close_time: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          

          {/* DESCRIPTION */}
          <div className="gm-field">
            <label className="gm-label">
              <FileText size={11} strokeWidth={2.4} />
              DESCRIPTION
            </label>
            <textarea
              className="gm-input gm-textarea"
              value={localGym.description}
              onChange={(e) =>
                setLocalGym({ ...localGym, description: e.target.value })
              }
              placeholder="Modern gym with cardio and weight equipment..."
              rows={4}
              maxLength={1000}
            />
            <div className="gm-field-hint">
              {(localGym.description || '').length} / 1000 characters
            </div>
          </div>
        </div>

        <div className="gm-footer">
          <button type="button" className="gm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="gm-btn-save"
            onClick={handleSave}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 size={14} className="gm-spin" /> Uploading...</>
            ) : (
              <><Save size={14} strokeWidth={2.4} /> Save</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GymManageModal;