// src/pages/services/modals/LaundryItemsModal/LaundryItemsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, Loader2, Edit2, Check, User, UserCircle, Baby, ShoppingBag,
} from 'lucide-react';
import './LaundryItemsModal.css';

export interface LaundryItem {
  _id?: string;
  category: 'men' | 'women' | 'children';
  name: string;
  price: number;
}

interface LaundryItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LaundryItem[];
  onSave: (items: LaundryItem[]) => Promise<void> | void;
  accentColor?: string;
}

const CATEGORIES: { id: 'men' | 'women' | 'children'; label: string; icon: any }[] = [
  { id: 'men', label: 'Erkaklar', icon: User },
  { id: 'women', label: 'Ayollar', icon: UserCircle },
  { id: 'children', label: 'Bolalar', icon: Baby },
];

const formatPrice = (n: number): string => {
  return new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');
};

const LaundryItemsModal: React.FC<LaundryItemsModalProps> = ({
  isOpen, onClose, items, onSave, accentColor = '#f97316',
}) => {
  const [activeTab, setActiveTab] = useState<'men' | 'women' | 'children'>('men');
  const [localItems, setLocalItems] = useState<LaundryItem[]>([]);

  // New item form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalItems(items.map(it => ({ ...it })));
      setActiveTab('men');
      setNewName('');
      setNewPrice('');
      setEditingId(null);
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const filteredItems = localItems.filter(it => it.category === activeTab);
  const totalCount = localItems.length;
  const counts = {
    men: localItems.filter(it => it.category === 'men').length,
    women: localItems.filter(it => it.category === 'women').length,
    children: localItems.filter(it => it.category === 'children').length,
  };

  const handleAdd = () => {
    const name = newName.trim();
    const price = parseInt(newPrice.replace(/\D/g, '')) || 0;

    if (!name) return;

    const newItem: LaundryItem = {
      _id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      category: activeTab,
      name,
      price,
    };

    setLocalItems(prev => [...prev, newItem]);
    setNewName('');
    setNewPrice('');
  };

  const handleDelete = (id: string) => {
    setLocalItems(prev => prev.filter(it => it._id !== id));
  };

  const handleStartEdit = (item: LaundryItem) => {
    setEditingId(item._id || '');
    setEditName(item.name);
    setEditPrice(String(item.price));
  };

  const handleSaveEdit = (id: string) => {
    const name = editName.trim();
    const price = parseInt(editPrice.replace(/\D/g, '')) || 0;
    if (!name) return;

    setLocalItems(prev =>
      prev.map(it => (it._id === id ? { ...it, name, price } : it))
    );
    setEditingId(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onSave(localItems);
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lim-overlay" onClick={onClose}>
      <div className="lim-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="lim-header">
          <div className="lim-header-left">
            <div
              className="lim-header-icon"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <ShoppingBag size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="lim-title">Laundry Items</h2>
              <p className="lim-subtitle">
                {totalCount} ta kiyim turlari
              </p>
            </div>
          </div>

          <button type="button" className="lim-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="lim-tabs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`lim-tab ${active ? 'is-active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
                style={active ? { color: accentColor, borderColor: accentColor } : {}}
              >
                <Icon size={15} strokeWidth={2.2} />
                <span>{cat.label}</span>
                <span className="lim-tab-count">{counts[cat.id]}</span>
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="lim-body">
          {/* ADD FORM */}
          <div className="lim-add-form">
            <input
              type="text"
              className="lim-input lim-input-name"
              placeholder="Kiyim nomi (masalan, Ko'ylak)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <div className="lim-input-price-wrap">
              <input
                type="text"
                inputMode="numeric"
                className="lim-input lim-input-price"
                placeholder="Narx"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <span className="lim-input-currency">UZS</span>
            </div>
            <button
              type="button"
              className="lim-btn-add"
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{ background: accentColor }}
              aria-label="Add"
            >
              <Plus size={18} strokeWidth={2.4} />
            </button>
          </div>

          {/* ITEMS LIST */}
          <div className="lim-list">
            {filteredItems.length === 0 ? (
              <div className="lim-empty">
                <ShoppingBag size={36} strokeWidth={1.5} />
                <p>Hozircha kiyim qo'shilmagan</p>
                <small>Yuqoridagi forma orqali qo'shing</small>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isEditing = editingId === item._id;

                return (
                  <div key={item._id} className={`lim-item ${isEditing ? 'is-editing' : ''}`}>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          className="lim-input lim-edit-name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          className="lim-input lim-edit-price"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value.replace(/\D/g, ''))}
                        />
                        <button
                          type="button"
                          className="lim-item-action lim-item-save"
                          onClick={() => handleSaveEdit(item._id || '')}
                          style={{ color: accentColor }}
                          aria-label="Save"
                        >
                          <Check size={16} strokeWidth={2.4} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="lim-item-name">{item.name}</div>
                        <div className="lim-item-price">
                          {formatPrice(item.price)} <span>UZS</span>
                        </div>
                        <button
                          type="button"
                          className="lim-item-action"
                          onClick={() => handleStartEdit(item)}
                          aria-label="Edit"
                        >
                          <Edit2 size={14} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="lim-item-action lim-item-delete"
                          onClick={() => handleDelete(item._id || '')}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="lim-footer">
          <button type="button" className="lim-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="lim-btn-save"
            onClick={handleSaveAll}
            disabled={saving}
            style={{ background: accentColor }}
          >
            {saving ? (
              <><Loader2 size={16} className="lim-spin" /> Saving...</>
            ) : (
              <><Save size={16} strokeWidth={2.2} /> Save All ({totalCount})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaundryItemsModal;