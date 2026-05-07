// src/pages/services/WifiManageModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Wifi, Plus, Trash2, Save } from 'lucide-react';
import './WifiManageModal.css';

interface WiFiNetwork {
  network_name: string;
  password: string;
  description?: string;
}

interface WifiManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  wifiList: WiFiNetwork[];
  onSave: (list: WiFiNetwork[]) => void;
}

const emptyWifi: WiFiNetwork = {
  network_name: '',
  password: '',
  description: '',
};

const WifiManageModal: React.FC<WifiManageModalProps> = ({
  isOpen,
  onClose,
  wifiList,
  onSave,
}) => {
  const [localList, setLocalList] = useState<WiFiNetwork[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWifi, setNewWifi] = useState<WiFiNetwork>(emptyWifi);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalList([...wifiList]);
      setShowAddForm(wifiList.length === 0);   // Bo'sh bo'lsa darhol form ochiladi
      setNewWifi(emptyWifi);
      setError(null);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, wifiList]);

  if (!isOpen) return null;

  // ─── WiFi qo'shish ──────────────────────
  const handleAdd = () => {
    if (!newWifi.network_name.trim()) {
      setError('Network name kiriting');
      return;
    }
    setLocalList([...localList, { ...newWifi }]);
    setNewWifi(emptyWifi);
    setShowAddForm(false);
    setError(null);
  };

  // ─── WiFi yangilash ─────────────────────
  const handleUpdate = (idx: number, field: keyof WiFiNetwork, value: string) => {
    const updated = [...localList];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocalList(updated);
  };

  // ─── WiFi o'chirish ─────────────────────
  const handleDelete = (idx: number) => {
    if (!window.confirm('WiFi tarmog\'ini o\'chirishni tasdiqlaysizmi?')) return;
    setLocalList(localList.filter((_, i) => i !== idx));
  };

  // ─── Saqlash va yopish ──────────────────
  const handleSaveAndClose = () => {
    onSave(localList);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="wm-overlay" onClick={handleCancel}>
      <div className="wm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="wm-header">
          <div className="wm-header-icon">
            <Wifi size={22} strokeWidth={2.2} />
          </div>
          <div className="wm-header-text">
            <h2 className="wm-title">Manage WiFi Networks</h2>
            <p className="wm-subtitle">
              Add multiple networks — guests will see all of them
            </p>
          </div>
          <button type="button" className="wm-close" onClick={handleCancel} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {error && (
          <div className="wm-error">
            ⚠️ {error}
          </div>
        )}

        {/* WIFI LIST */}
        <div className="wm-content">
          {localList.length === 0 && !showAddForm && (
            <div className="wm-empty">
              <Wifi size={36} strokeWidth={1.5} />
              <p>No WiFi networks yet</p>
              <small>Click "Add WiFi" to add your first network</small>
            </div>
          )}

          {localList.map((wifi, idx) => (
            <div key={idx} className="wm-item">
              <div className="wm-item-header">
                <div className="wm-item-num">
                  <Wifi size={14} strokeWidth={2.4} />
                  Network #{idx + 1}
                </div>
                <button
                  type="button"
                  className="wm-item-del"
                  onClick={() => handleDelete(idx)}
                  aria-label="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="wm-row">
                <div className="wm-field">
                  <label className="wm-label">NETWORK NAME</label>
                  <input
                    type="text"
                    className="wm-input"
                    value={wifi.network_name}
                    onChange={(e) => handleUpdate(idx, 'network_name', e.target.value)}
                    placeholder="Hotel_WiFi"
                  />
                </div>
                <div className="wm-field">
                  <label className="wm-label">PASSWORD</label>
                  <input
                    type="text"
                    className="wm-input"
                    value={wifi.password}
                    onChange={(e) => handleUpdate(idx, 'password', e.target.value)}
                    placeholder="password123"
                  />
                </div>
              </div>

              
            </div>
          ))}

          {/* ADD NEW WIFI FORM */}
          {showAddForm ? (
            <div className="wm-item wm-item-new">
              <div className="wm-item-header">
                <div className="wm-item-num wm-item-num-new">
                  <Plus size={14} strokeWidth={2.4} />
                  New Network
                </div>
                <button
                  type="button"
                  className="wm-item-del"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWifi(emptyWifi);
                    setError(null);
                  }}
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="wm-row">
                <div className="wm-field">
                  <label className="wm-label">NETWORK NAME</label>
                  <input
                    type="text"
                    className="wm-input"
                    value={newWifi.network_name}
                    onChange={(e) => {
                      setNewWifi({ ...newWifi, network_name: e.target.value });
                      setError(null);
                    }}
                    placeholder="Hotel_WiFi"
                    autoFocus
                  />
                </div>
                <div className="wm-field">
                  <label className="wm-label">PASSWORD</label>
                  <input
                    type="text"
                    className="wm-input"
                    value={newWifi.password}
                    onChange={(e) => setNewWifi({ ...newWifi, password: e.target.value })}
                    placeholder="password123"
                  />
                </div>
              </div>

             

              <div className="wm-form-actions">
                <button
                  type="button"
                  className="wm-btn-cancel"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWifi(emptyWifi);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="wm-btn-add" onClick={handleAdd}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="wm-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} strokeWidth={2.4} />
              Add WiFi Network
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div className="wm-footer">
          <button type="button" className="wm-btn-cancel-main" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="wm-btn-save" onClick={handleSaveAndClose}>
            <Save size={14} strokeWidth={2.4} />
            Done ({localList.length} network{localList.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
};

export default WifiManageModal;