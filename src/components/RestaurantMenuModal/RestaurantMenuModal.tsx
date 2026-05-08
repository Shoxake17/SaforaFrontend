// src/pages/services/modals/RestaurantMenuModal/RestaurantMenuModal.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Save, Loader2, Plus, Edit2, Trash2, ArrowUp, ArrowDown,
  ArrowLeft, Image as ImageIcon, Check, AlertTriangle,
  Utensils, Tag, Power, PowerOff, Sparkles,
} from 'lucide-react';
import {
  uploadServiceImage,
  RESTAURANT_CATEGORY_TEMPLATES,
  type RestaurantCategory,
  type RestaurantItem,
  type RestaurantDetail,
} from '@services/settings';
import './RestaurantMenuModal.css';

// ⭐ Curated food/drink emoji picker
const FOOD_EMOJIS = [
  '🍳', '🥗', '🍽️', '🍰', '🍔', '🍕', '🌮', '🍱',
  '🥟', '🍣', '🍜', '🍝', '🥘', '🍖', '🍗', '🍤',
  '🥩', '🌯', '🥪', '🥐', '🍞', '🥯', '🧀', '🥚',
  '🍦', '🧁', '🍪', '🍩', '🍫', '🍬', '🍭', '🥧',
  '☕', '🥤', '💧', '🧃', '🍷', '🍺', '🍹', '🍸',
  '🍶', '🧊', '🌶️', '🍎', '🍌', '🍇', '🍓', '🍿',
];

const generateTmpId = (prefix: string) =>
  `tmp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const formatPrice = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  restaurant: RestaurantDetail;
  onSave: (restaurant: RestaurantDetail) => Promise<void>;
  accentColor?: string;
}

const RestaurantMenuModal: React.FC<Props> = ({
  isOpen, onClose, slug, restaurant, onSave, accentColor = '#f97316',
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');

  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [items, setItems] = useState<RestaurantItem[]>([]);

  // Categories state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [tempCategoryIcon, setTempCategoryIcon] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Items state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RestaurantItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Saving
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init when opened
  useEffect(() => {
    if (isOpen) {
      setCategories(restaurant.categories || []);
      setItems(restaurant.items || []);
      setActiveTab('categories');
      setShowCategoryForm(false);
      setShowItemForm(false);
      setEditingCategoryId(null);
      setEditingItem(null);
      setShowEmojiPicker(false);
      setError(null);
    }
  }, [isOpen, restaurant]);

  // ─── Apply templates
  const handleApplyTemplates = () => {
    const newCats: RestaurantCategory[] = RESTAURANT_CATEGORY_TEMPLATES.map((t) => ({
      _id: generateTmpId('cat'),
      name: t.name,
      icon: t.icon,
      order: t.order,
    }));
    setCategories(newCats);
  };

  // ─── Category form
  const startAddCategory = () => {
    setTempCategoryName('');
    setTempCategoryIcon('🍽️');
    setEditingCategoryId(null);
    setShowEmojiPicker(false);
    setShowCategoryForm(true);
  };

  const startEditCategory = (cat: RestaurantCategory) => {
    setTempCategoryName(cat.name);
    setTempCategoryIcon(cat.icon);
    setEditingCategoryId(cat._id || null);
    setShowEmojiPicker(false);
    setShowCategoryForm(true);
  };

  const cancelCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setTempCategoryName('');
    setTempCategoryIcon('🍽️');
    setShowEmojiPicker(false);
  };

  const handleSaveCategory = () => {
    const name = tempCategoryName.trim();
    if (!name) return;

    if (editingCategoryId) {
      setCategories((prev) =>
        prev.map((c) =>
          c._id === editingCategoryId
            ? { ...c, name, icon: tempCategoryIcon }
            : c
        )
      );
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), 0);
      setCategories((prev) => [
        ...prev,
        {
          _id: generateTmpId('cat'),
          name,
          icon: tempCategoryIcon,
          order: maxOrder + 1,
        },
      ]);
    }

    cancelCategoryForm();
  };

  const handleDeleteCategory = (catId: string) => {
    const itemsInCat = items.filter((it) => it.category_id === catId).length;
    if (itemsInCat > 0) {
      const ok = window.confirm(
        `Bu kategoriyada ${itemsInCat} ta taom bor. Kategoriya va barcha taomlar o'chiriladi. Davom etamizmi?`
      );
      if (!ok) return;
      setItems((prev) => prev.filter((it) => it.category_id !== catId));
    } else {
      if (!window.confirm('Kategoriyani o\'chirasizmi?')) return;
    }
    setCategories((prev) => prev.filter((c) => c._id !== catId));
  };

  const handleMoveCategory = (catId: string, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c._id === catId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sorted.length) return;

    [sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
    const reordered = sorted.map((c, i) => ({ ...c, order: i + 1 }));
    setCategories(reordered);
  };

  // ─── Item handlers
  const startAddItem = () => {
    if (categories.length === 0) {
      setActiveTab('categories');
      setError('Avval kamida bitta kategoriya qo\'shing');
      setTimeout(() => setError(null), 3500);
      return;
    }
    setEditingItem(null);
    setShowItemForm(true);
  };

  const startEditItem = (item: RestaurantItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleSaveItem = (item: RestaurantItem) => {
    if (editingItem) {
      setItems((prev) => prev.map((it) => (it._id === editingItem._id ? item : it)));
    } else {
      const maxOrder = items.reduce((m, it) => Math.max(m, it.order), 0);
      setItems((prev) => [...prev, { ...item, order: maxOrder + 1 }]);
    }
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm('Taomni o\'chirasizmi?')) return;
    setItems((prev) => prev.filter((it) => it._id !== itemId));
  };

  const handleToggleAvailable = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, available: !it.available } : it))
    );
  };

  // ─── Save all
  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated: RestaurantDetail = {
        ...restaurant,
        categories,
        items,
      };
      await onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const itemsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      map[it.category_id] = (map[it.category_id] || 0) + 1;
    });
    return map;
  }, [items]);

  const visibleItems = useMemo(() => {
    let filtered = items;
    if (filterCategory !== 'all') {
      filtered = filtered.filter((it) => it.category_id === filterCategory);
    }
    return [...filtered].sort((a, b) => a.order - b.order);
  }, [items, filterCategory]);

  if (!isOpen) return null;

  return (
    <div className="rmm-backdrop" onClick={onClose}>
      <div className="rmm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="rmm-header">
          <div className="rmm-header-title">
            <Utensils size={20} strokeWidth={2.2} />
            <span>Restaurant Menu</span>
          </div>
          <button type="button" className="rmm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* TABS */}
        {!showItemForm && (
          <div className="rmm-tabs">
            <button
              type="button"
              className={`rmm-tab ${activeTab === 'categories' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('categories')}
              style={
                activeTab === 'categories'
                  ? { borderBottomColor: accentColor, color: accentColor }
                  : undefined
              }
            >
              <Tag size={14} />
              <span>Categories</span>
              <span
                className="rmm-tab-count"
                style={
                  activeTab === 'categories'
                    ? { background: accentColor, color: 'white' }
                    : undefined
                }
              >
                {categories.length}
              </span>
            </button>
            <button
              type="button"
              className={`rmm-tab ${activeTab === 'items' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('items')}
              style={
                activeTab === 'items'
                  ? { borderBottomColor: accentColor, color: accentColor }
                  : undefined
              }
            >
              <Utensils size={14} />
              <span>Items</span>
              <span
                className="rmm-tab-count"
                style={
                  activeTab === 'items'
                    ? { background: accentColor, color: 'white' }
                    : undefined
                }
              >
                {items.length}
              </span>
            </button>
          </div>
        )}

        {/* CONTENT */}
        <div className="rmm-content">
          {error && (
            <div className="rmm-alert">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* ─── ITEM FORM (replaces list view when active) */}
          {showItemForm && (
            <RestaurantItemForm
              initial={editingItem}
              categories={sortedCategories}
              slug={slug}
              accentColor={accentColor}
              onSave={handleSaveItem}
              onCancel={() => {
                setShowItemForm(false);
                setEditingItem(null);
              }}
            />
          )}

          {/* ─── CATEGORIES TAB */}
          {!showItemForm && activeTab === 'categories' && (
            <div className="rmm-categories">
              {/* Add button */}
              {!showCategoryForm && (
                <button
                  type="button"
                  className="rmm-btn-add"
                  onClick={startAddCategory}
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  <Plus size={16} strokeWidth={2.4} />
                  Add Category
                </button>
              )}

              {/* Category form */}
              {showCategoryForm && (
                <div className="rmm-cat-form">
                  <div className="rmm-cat-form-row">
                    <button
                      type="button"
                      className="rmm-icon-picker"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      {tempCategoryIcon}
                    </button>
                    <input
                      type="text"
                      className="rmm-input"
                      placeholder="Kategoriya nomi (Breakfast, Mains...)"
                      value={tempCategoryName}
                      onChange={(e) => setTempCategoryName(e.target.value)}
                      maxLength={50}
                      autoFocus
                    />
                  </div>

                  {showEmojiPicker && (
                    <div className="rmm-emoji-grid">
                      {FOOD_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`rmm-emoji ${
                            tempCategoryIcon === emoji ? 'is-active' : ''
                          }`}
                          onClick={() => {
                            setTempCategoryIcon(emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={
                            tempCategoryIcon === emoji
                              ? {
                                  background: `${accentColor}33`,
                                  borderColor: accentColor,
                                }
                              : undefined
                          }
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="rmm-form-actions">
                    <button
                      type="button"
                      className="rmm-btn rmm-btn-cancel"
                      onClick={cancelCategoryForm}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      className="rmm-btn rmm-btn-primary"
                      onClick={handleSaveCategory}
                      disabled={!tempCategoryName.trim()}
                      style={{ background: accentColor }}
                    >
                      <Check size={14} strokeWidth={2.4} />
                      {editingCategoryId ? 'Yangilash' : 'Qo\'shish'}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {categories.length === 0 && !showCategoryForm && (
                <div className="rmm-empty">
                  <Utensils size={36} strokeWidth={1.5} />
                  <p>Hali kategoriya yo'q</p>
                  <button
                    type="button"
                    className="rmm-btn rmm-btn-primary rmm-btn-template"
                    onClick={handleApplyTemplates}
                    style={{ background: accentColor }}
                  >
                    <Sparkles size={14} strokeWidth={2.4} />
                    Tayyor namunalardan ({RESTAURANT_CATEGORY_TEMPLATES.length})
                  </button>
                  <small>Breakfast, Mains, Beverages, Desserts...</small>
                </div>
              )}

              {/* List */}
              {sortedCategories.length > 0 && (
                <div className="rmm-cat-list">
                  {sortedCategories.map((cat, idx) => (
                    <div key={cat._id || idx} className="rmm-cat-row">
                      <span className="rmm-cat-icon">{cat.icon}</span>
                      <div className="rmm-cat-info">
                        <div className="rmm-cat-name">{cat.name}</div>
                        <div className="rmm-cat-meta">
                          {itemsByCategory[cat._id || ''] || 0} ta taom
                        </div>
                      </div>
                      <div className="rmm-cat-actions">
                        <button
                          type="button"
                          className="rmm-icon-btn"
                          onClick={() => handleMoveCategory(cat._id || '', -1)}
                          disabled={idx === 0}
                          aria-label="Yuqoriga"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="rmm-icon-btn"
                          onClick={() => handleMoveCategory(cat._id || '', 1)}
                          disabled={idx === sortedCategories.length - 1}
                          aria-label="Pastga"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="rmm-icon-btn"
                          onClick={() => startEditCategory(cat)}
                          aria-label="Tahrirlash"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="rmm-icon-btn rmm-danger"
                          onClick={() => handleDeleteCategory(cat._id || '')}
                          aria-label="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── ITEMS TAB */}
          {!showItemForm && activeTab === 'items' && (
            <div className="rmm-items">
              {/* Filter chips */}
              {categories.length > 0 && (
                <div className="rmm-filter-chips">
                  <button
                    type="button"
                    className={`rmm-chip ${filterCategory === 'all' ? 'is-active' : ''}`}
                    onClick={() => setFilterCategory('all')}
                    style={
                      filterCategory === 'all'
                        ? { background: accentColor, color: 'white', borderColor: accentColor }
                        : undefined
                    }
                  >
                    <span>Hammasi</span>
                    <span className="rmm-chip-count">{items.length}</span>
                  </button>
                  {sortedCategories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      className={`rmm-chip ${
                        filterCategory === cat._id ? 'is-active' : ''
                      }`}
                      onClick={() => setFilterCategory(cat._id || '')}
                      style={
                        filterCategory === cat._id
                          ? { background: accentColor, color: 'white', borderColor: accentColor }
                          : undefined
                      }
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="rmm-chip-count">
                        {itemsByCategory[cat._id || ''] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add button */}
              <button
                type="button"
                className="rmm-btn-add"
                onClick={startAddItem}
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <Plus size={16} strokeWidth={2.4} />
                Yangi taom qo'shish
              </button>

              {/* Empty state */}
              {visibleItems.length === 0 && (
                <div className="rmm-empty">
                  <Utensils size={36} strokeWidth={1.5} />
                  <p>
                    {filterCategory === 'all'
                      ? 'Hali taom yo\'q'
                      : 'Bu kategoriyada taom yo\'q'}
                  </p>
                  {categories.length === 0 && (
                    <small>Avval kategoriya qo'shing</small>
                  )}
                </div>
              )}

              {/* Items list */}
              {visibleItems.length > 0 && (
                <div className="rmm-item-list">
                  {visibleItems.map((item) => {
                    const cat = categories.find((c) => c._id === item.category_id);
                    return (
                      <div
                        key={item._id}
                        className={`rmm-item-card ${
                          !item.available ? 'is-unavailable' : ''
                        }`}
                        onClick={() => startEditItem(item)}
                      >
                        <div className="rmm-item-img">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <ImageIcon size={24} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="rmm-item-body">
                          <div className="rmm-item-head">
                            <div className="rmm-item-name">{item.name}</div>
                            <div className="rmm-item-price">
                              {formatPrice(item.price)}{' '}
                              <span>UZS</span>
                            </div>
                          </div>
                          {item.description && (
                            <div className="rmm-item-desc">{item.description}</div>
                          )}
                          <div className="rmm-item-meta">
                            {cat && (
                              <span className="rmm-item-cat">
                                {cat.icon} {cat.name}
                              </span>
                            )}
                            <span
                              className={`rmm-item-status ${
                                item.available ? 'is-on' : 'is-off'
                              }`}
                            >
                              {item.available ? '● Mavjud' : '○ Mavjud emas'}
                            </span>
                          </div>
                        </div>
                        <div
                          className="rmm-item-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="rmm-icon-btn"
                            onClick={() => handleToggleAvailable(item._id || '')}
                            aria-label="Mavjudlikni o'zgartirish"
                            title={item.available ? 'Vaqtincha o\'chirish' : 'Yoqish'}
                          >
                            {item.available ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                          <button
                            type="button"
                            className="rmm-icon-btn rmm-danger"
                            onClick={() => handleDeleteItem(item._id || '')}
                            aria-label="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!showItemForm && (
          <div className="rmm-footer">
            <button
              type="button"
              className="rmm-btn rmm-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className="rmm-btn rmm-btn-primary rmm-btn-save"
              onClick={handleSaveAll}
              disabled={saving}
              style={{ background: accentColor }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="rmm-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save size={14} strokeWidth={2.4} />
                  Hammasini saqlash
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 🍽️ Restaurant Item Form (sub-view inside the modal)
// ═══════════════════════════════════════════════════════
interface ItemFormProps {
  initial: RestaurantItem | null;
  categories: RestaurantCategory[];
  slug: string;
  accentColor: string;
  onSave: (item: RestaurantItem) => void;
  onCancel: () => void;
}

const RestaurantItemForm: React.FC<ItemFormProps> = ({
  initial, categories, slug, accentColor, onSave, onCancel,
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState<string>(
    initial?.price !== undefined ? String(initial.price) : ''
  );
  const [categoryId, setCategoryId] = useState(
    initial?.category_id || categories[0]?._id || ''
  );
  const [description, setDescription] = useState(initial?.description || '');
  const [image, setImage] = useState(initial?.image || '');
  const [available, setAvailable] = useState(initial?.available !== false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Rasm 5MB dan kichik bo\'lishi kerak');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const result = await uploadServiceImage(slug, file);
    setUploading(false);

    if (result.success && result.url) {
      setImage(result.url);
    } else {
      setUploadError(result.error || 'Yuklashda xato');
    }

    e.target.value = '';
  };

  const priceNum = Number(price);
  const isValid =
    name.trim().length > 0 &&
    !!categoryId &&
    price !== '' &&
    !isNaN(priceNum) &&
    priceNum >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      _id: initial?._id || generateTmpId('item'),
      name: name.trim(),
      price: priceNum,
      category_id: categoryId,
      description: description.trim(),
      image,
      available,
      order: initial?.order || 0,
    });
  };

  return (
    <div className="rmm-form">
      <button type="button" className="rmm-back-btn" onClick={onCancel}>
        <ArrowLeft size={14} />
        Ro'yxatga qaytish
      </button>

      <div className="rmm-form-title">
        {initial ? 'Taomni tahrirlash' : 'Yangi taom'}
      </div>

      {/* Image */}
      <div className="rmm-form-group">
        <label className="rmm-label">Rasm</label>
        <div className="rmm-img-upload">
          {image ? (
            <div className="rmm-img-preview">
              <img src={image} alt="" />
              <button
                type="button"
                className="rmm-img-remove"
                onClick={() => setImage('')}
                aria-label="Rasmni olib tashlash"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="rmm-img-drop"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={24} className="rmm-spin" />
                  <span>Yuklanmoqda...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={28} strokeWidth={1.5} />
                  <span>Rasm yuklash uchun bosing</span>
                  <small>JPG, PNG, max 5MB</small>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </div>
        {uploadError && (
          <div className="rmm-form-error">
            <AlertTriangle size={12} /> {uploadError}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="rmm-form-group">
        <label className="rmm-label">Kategoriya *</label>
        <select
          className="rmm-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div className="rmm-form-group">
        <label className="rmm-label">Nomi *</label>
        <input
          type="text"
          className="rmm-input"
          placeholder="Masalan: Plov (qo'y go'shti bilan)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Price */}
      <div className="rmm-form-group">
        <label className="rmm-label">Narxi (UZS) *</label>
        <input
          type="number"
          className="rmm-input"
          placeholder="35000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min={0}
          inputMode="numeric"
        />
      </div>

      {/* Description */}
      <div className="rmm-form-group">
        <label className="rmm-label">Tavsif</label>
        <textarea
          className="rmm-textarea"
          placeholder="An'anaviy o'zbek osh - sabzi, qo'y go'shti va xushbo'y ziravorlar bilan..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <div className="rmm-char-count">{description.length} / 500</div>
      </div>

      {/* Available toggle */}
      <div className="rmm-form-group">
        <div className="rmm-toggle-row">
          <div>
            <div className="rmm-label" style={{ marginBottom: 2 }}>
              Buyurtma uchun mavjud
            </div>
            <div className="rmm-toggle-hint">
              {available
                ? 'Mehmonlar buyurtma berishi mumkin'
                : 'Vaqtincha o\'chirilgan'}
            </div>
          </div>
          <button
            type="button"
            className={`rmm-toggle ${available ? 'is-on' : ''}`}
            onClick={() => setAvailable(!available)}
            style={available ? { background: accentColor } : undefined}
            aria-label="Mavjudlikni o'zgartirish"
          >
            <span className="rmm-toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="rmm-form-actions rmm-form-actions-bottom">
        <button
          type="button"
          className="rmm-btn rmm-btn-cancel"
          onClick={onCancel}
        >
          Bekor qilish
        </button>
        <button
          type="button"
          className="rmm-btn rmm-btn-primary"
          onClick={handleSubmit}
          disabled={!isValid}
          style={{ background: accentColor }}
        >
          <Check size={14} strokeWidth={2.4} />
          {initial ? 'Yangilash' : 'Qo\'shish'}
        </button>
      </div>
    </div>
  );
};

export default RestaurantMenuModal;