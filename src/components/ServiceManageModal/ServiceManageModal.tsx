// src/components/ServiceManageModal/ServiceManageModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Trash2, Save, Clock, MapPin, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { uploadServiceImage, type ServiceDetail } from '@services/settings';
import { imageUrl } from '@utils/imageUrl';
import './ServiceManageModal.css';

interface ServiceManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  serviceTitle: string;
  serviceColor: string;
  serviceIcon: LucideIcon;
  detail: ServiceDetail;
  onSave: (detail: ServiceDetail) => void;
  defaultOpenTime?: string;
  defaultCloseTime?: string;
}

const MAX_IMAGES = 10;

const ServiceManageModal: React.FC<ServiceManageModalProps> = ({
  isOpen,
  onClose,
  slug,
  serviceTitle,
  serviceColor,
  serviceIcon: Icon,
  detail,
  onSave,
  defaultOpenTime = '06:00',
  defaultCloseTime = '23:00',
}) => {
  const [localDetail, setLocalDetail] = useState<ServiceDetail>({
    images: [],
    description: '',
    open_time: defaultOpenTime,
    close_time: defaultCloseTime,
    is_24_hours: false,
    location: '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalDetail({
        images: Array.isArray(detail?.images) ? [...detail.images] : [],
        description: detail?.description || '',
        open_time: detail?.open_time || defaultOpenTime,
        close_time: detail?.close_time || defaultCloseTime,
        is_24_hours: detail?.is_24_hours || false,
        location: detail?.location || '',
      });
      setError(null);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, detail, defaultOpenTime, defaultCloseTime]);

  if (!isOpen) return null;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (localDetail.images.length + files.length > MAX_IMAGES) {
      setError(`Maksimum ${MAX_IMAGES} ta rasm qo'sha olasiz`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const results = await Promise.all(
        Array.from(files).map((file) => uploadServiceImage(slug, file))
      );

      const newUrls: string[] = [];
      for (const r of results) {
        if (r.success && r.url) newUrls.push(r.url);
      }

      if (newUrls.length === 0) {
        setError('Rasm yuklashda xato');
      } else {
        setLocalDetail({
          ...localDetail,
          images: [...localDetail.images, ...newUrls],
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Rasm yuklashda xato');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setLocalDetail({
      ...localDetail,
      images: localDetail.images.filter((_, i) => i !== idx),
    });
  };

  const handleSave = () => {
    onSave(localDetail);
    onClose();
  };

  const totalImages = localDetail.images.length;
  const canAddMore = totalImages < MAX_IMAGES;

  return (
    <div className="smm-overlay" onClick={onClose}>
      <div className="smm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="smm-header">
          <div
            className="smm-header-icon"
            style={{ background: `${serviceColor}20`, color: serviceColor }}
          >
            <Icon size={22} strokeWidth={2.2} />
          </div>
          <div className="smm-header-text">
            <h2 className="smm-title">Manage {serviceTitle}</h2>
            <p className="smm-subtitle">Add details guests will see</p>
          </div>
          <button type="button" className="smm-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {error && <div className="smm-error">⚠️ {error}</div>}

        {/* CONTENT */}
        <div className="smm-content">
          {/* IMAGES */}
          <div className="smm-field">
            <label className="smm-label">PHOTOS ({totalImages} / {MAX_IMAGES})</label>

            {totalImages > 0 && (
              <div className="smm-images-grid">
                {localDetail.images.map((url, idx) => (
                  <div key={idx} className="smm-image-item">
                    <span className="smm-image-num">{idx + 1}</span>
                    <img src={imageUrl(url)} alt={`Photo ${idx + 1}`} />
                    <button
                      type="button"
                      className="smm-image-remove"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canAddMore && (
              <label className={`smm-upload-zone ${uploading ? 'is-uploading' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleImageUpload(e.target.files)}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 size={28} className="smm-spin" />
                    <div className="smm-upload-title">Uploading...</div>
                  </>
                ) : (
                  <>
                    <Upload size={28} strokeWidth={1.8} />
                    <div className="smm-upload-title">
                      {totalImages === 0 ? 'Click to upload photos' : 'Add more photos'}
                    </div>
                    <div className="smm-upload-sub">
                      JPG, PNG up to 5MB • Multiple selection allowed
                    </div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* HOURS */}
          <div className="smm-field">
            <label className="smm-label">
              <Clock size={11} strokeWidth={2.4} />
              OPENING HOURS
            </label>

            <div
              className="smm-24h-toggle"
              onClick={() =>
                setLocalDetail({ ...localDetail, is_24_hours: !localDetail.is_24_hours })
              }
            >
              <span className="smm-24h-label">Open 24 hours</span>
              <button
                type="button"
                className={`smm-toggle ${localDetail.is_24_hours ? 'is-on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalDetail({ ...localDetail, is_24_hours: !localDetail.is_24_hours });
                }}
                style={localDetail.is_24_hours ? { background: serviceColor } : undefined}
              >
                <span className="smm-toggle-thumb" />
              </button>
            </div>

            {!localDetail.is_24_hours && (
              <div className="smm-time-row">
                <div className="smm-time-field">
                  <label className="smm-time-label">OPENS AT</label>
                  <input
                    type="time"
                    className="smm-input smm-time-input"
                    value={localDetail.open_time}
                    onChange={(e) =>
                      setLocalDetail({ ...localDetail, open_time: e.target.value })
                    }
                  />
                </div>
                <div className="smm-time-divider">—</div>
                <div className="smm-time-field">
                  <label className="smm-time-label">CLOSES AT</label>
                  <input
                    type="time"
                    className="smm-input smm-time-input"
                    value={localDetail.close_time}
                    onChange={(e) =>
                      setLocalDetail({ ...localDetail, close_time: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          

          {/* DESCRIPTION */}
          <div className="smm-field">
            <label className="smm-label">
              <FileText size={11} strokeWidth={2.4} />
              DESCRIPTION
            </label>
            <textarea
              className="smm-input smm-textarea"
              value={localDetail.description}
              onChange={(e) => setLocalDetail({ ...localDetail, description: e.target.value })}
              placeholder={`Brief description of ${serviceTitle.toLowerCase()}...`}
              rows={4}
              maxLength={1000}
            />
            <div className="smm-field-hint">
              {(localDetail.description || '').length} / 1000 characters
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="smm-footer">
          <button type="button" className="smm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="smm-btn-save"
            onClick={handleSave}
            disabled={uploading}
            style={{ background: serviceColor }}
          >
            <Save size={14} strokeWidth={2.4} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManageModal;