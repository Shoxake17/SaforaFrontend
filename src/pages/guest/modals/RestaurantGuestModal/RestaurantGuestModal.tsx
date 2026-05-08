// src/pages/guest/modals/RestaurantGuestModal/RestaurantGuestModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Clock, MessageSquare, Loader2, Check,
  Plus, Minus, ShoppingBag, Utensils, Trash2, Image as ImageIcon,
} from 'lucide-react';
import { createGuestRequest } from '@services/requests';
import { imageUrl } from '@utils/imageUrl';
import './RestaurantGuestModal.css';

export interface RestaurantCategory {
  _id?: string;
  name: string;
  icon: string;
  order: number;
}

export interface RestaurantItem {
  _id?: string;
  category_id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  available?: boolean;
  order?: number;
}

export interface RestaurantServiceDetail {
  images?: string[];
  description?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
  location?: string;
  categories?: RestaurantCategory[];
  items?: RestaurantItem[];
}

interface RestaurantGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  accentColor: string;
  serviceDetail?: RestaurantServiceDetail;
}

const formatPrice = (n: number): string => {
  return new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');
};

const RestaurantGuestModal: React.FC<RestaurantGuestModalProps> = ({
  isOpen, onClose, hotelSlug, roomNumber, guestName, accentColor,
  serviceDetail,
}) => {
  // 'all' or category._id
  const [activeTab, setActiveTab] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photos = Array.isArray(serviceDetail?.images) ? serviceDetail!.images : [];
  const hasPhotos = photos.length > 0;

  // Categories sorted by order
  const allCategories = useMemo(() => {
    const list = serviceDetail?.categories || [];
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [serviceDetail]);

  // Items: only available, sorted by order
  const allItems = useMemo(() => {
    const list = serviceDetail?.items || [];
    return [...list]
      .filter((it) => it.available !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [serviceDetail]);

  const isOpenAllDay = !!serviceDetail?.is_24_hours;
  const openTime = serviceDetail?.open_time || '08:00';
  const closeTime = serviceDetail?.close_time || '23:00';
  const hoursLabel = isOpenAllDay ? '24 Hours' : `${openTime} – ${closeTime}`;

  // Cart calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const item = allItems.find((it) => it._id === id);
        if (!item) return null;
        const cat = allCategories.find((c) => c._id === item.category_id);
        return {
          ...item,
          category_name: cat?.name || '',
          category_icon: cat?.icon || '',
          quantity,
          subtotal: item.price * quantity,
        };
      })
      .filter(Boolean) as Array<RestaurantItem & {
        category_name: string;
        category_icon: string;
        quantity: number;
        subtotal: number;
      }>;
  }, [cart, allItems, allCategories]);

  const totalItems = cartItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = cartItems.reduce((sum, it) => sum + it.subtotal, 0);

  // Counts per category (and 'all')
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    allCategories.forEach((cat) => {
      counts[cat._id || ''] = allItems.filter((it) => it.category_id === cat._id).length;
    });
    return counts;
  }, [allItems, allCategories]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('all');
      setCart({});
      setComments('');
      setShowCart(false);
      setError(null);
      setSuccess(false);
      setCurrentPhoto(0);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter items by active tab
  const filteredItems =
    activeTab === 'all'
      ? allItems
      : allItems.filter((it) => it.category_id === activeTab);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(99, current + delta));
      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (totalItems === 0) {
      setError('Iltimos, kamida 1 ta taom tanlang');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGuestRequest({
      hotel_slug: hotelSlug,
      room_number: roomNumber,
      guest_name: guestName,
      service_type: 'restaurant',
      details: {
        items: cartItems.map((it) => ({
          item_id: it._id,
          category_id: it.category_id,
          category_name: it.category_name,
          category_icon: it.category_icon,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          image: it.image,
        })),
        total_items: totalItems,
        total_amount: totalAmount,
        comments: comments.trim(),
      },
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => onClose(), 2500);
    } else {
      setError(result.error || 'Yuborishda xato');
    }
  };

  // ═══════════════ SUCCESS SCREEN ═══════════════
  if (success) {
    return (
      <div className="rgm-overlay" onClick={onClose}>
        <div className="rgm-modal rgm-success" onClick={(e) => e.stopPropagation()}>
          <div className="rgm-success-icon" style={{ background: accentColor }}>
            <Check size={32} strokeWidth={2.4} />
          </div>
          <h2 className="rgm-success-title">Buyurtma yuborildi!</h2>
          <p className="rgm-success-msg">
            {totalItems} ta taom qabul qilindi.<br />
            Tez orada tayyorlanadi va sizga keltiriladi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rgm-overlay" onClick={onClose}>
      <div className="rgm-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rgm-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={2.4} />
        </button>

        {/* HERO */}
        {hasPhotos ? (
          <div className="rgm-hero rgm-hero-photo">
            <img src={imageUrl(photos[currentPhoto])} alt="Restaurant" className="rgm-hero-img" />
            {photos.length > 1 && (
              <>
                <div className="rgm-hero-counter">
                  {currentPhoto + 1} / {photos.length}
                </div>
                <div className="rgm-hero-dots">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`rgm-hero-dot ${idx === currentPhoto ? 'active' : ''}`}
                      onClick={() => setCurrentPhoto(idx)}
                      aria-label={`Photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="rgm-hero"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #ea580c)` }}
          >
            <Utensils size={48} strokeWidth={1.8} className="rgm-hero-icon" />
          </div>
        )}

        {/* CONTENT */}
        <div className="rgm-content">
          <h2 className="rgm-title">Restaurant Service</h2>

          <div className="rgm-info-card">
            <div
              className="rgm-info-icon"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <Clock size={16} strokeWidth={2.2} />
            </div>
            <div className="rgm-info-text">
              <div className="rgm-info-label">Service Available</div>
              <div className="rgm-info-value">{hoursLabel}</div>
            </div>
          </div>

          {/* No menu yet */}
          {allItems.length === 0 && (
            <div className="rgm-empty">
              <Utensils size={36} strokeWidth={1.5} />
              <p>Hozircha menyu mavjud emas</p>
            </div>
          )}

          {/* CATEGORY TABS — All + dynamic categories (horizontally scrollable) */}
          {allItems.length > 0 && (
            <div className="rgm-tabs">
              <button
                type="button"
                className={`rgm-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
                style={
                  activeTab === 'all'
                    ? { color: accentColor, borderColor: accentColor }
                    : {}
                }
              >
                <span>Hammasi</span>
                <span
                  className="rgm-tab-count"
                  style={
                    activeTab === 'all'
                      ? { background: `${accentColor}26`, color: accentColor }
                      : {}
                  }
                >
                  {categoryCounts.all}
                </span>
              </button>
              {allCategories.map((cat) => {
                const count = categoryCounts[cat._id || ''] || 0;
                if (count === 0) return null;
                const active = activeTab === cat._id;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    className={`rgm-tab ${active ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(cat._id || '')}
                    style={active ? { color: accentColor, borderColor: accentColor } : {}}
                  >
                    <span className="rgm-tab-icon">{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span
                      className="rgm-tab-count"
                      style={active ? { background: `${accentColor}26`, color: accentColor } : {}}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {error && <div className="rgm-error">⚠️ {error}</div>}

          {/* ITEMS LIST */}
          {allItems.length > 0 && (
            <div className="rgm-items">
              {filteredItems.length === 0 ? (
                <div className="rgm-empty">
                  <ShoppingBag size={36} strokeWidth={1.5} />
                  <p>Bu kategoriyada taom yo'q</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const qty = cart[item._id || ''] || 0;
                  const inCart = qty > 0;
                  const cat = allCategories.find((c) => c._id === item.category_id);

                  return (
                    <div
                      key={item._id}
                      className={`rgm-item ${inCart ? 'is-active' : ''}`}
                      style={inCart ? { borderColor: accentColor, background: `${accentColor}10` } : {}}
                    >
                      <div className="rgm-item-img">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <ImageIcon size={20} strokeWidth={1.5} />
                        )}
                      </div>

                      <div className="rgm-item-info">
                        <div className="rgm-item-name">{item.name}</div>
                        {item.description && (
                          <div className="rgm-item-desc">{item.description}</div>
                        )}
                        <div className="rgm-item-price-row">
                          {activeTab === 'all' && cat && (
                            <span className="rgm-item-cat">
                              {cat.icon} {cat.name}
                            </span>
                          )}
                          <div className="rgm-item-price" style={{ color: accentColor }}>
                            {formatPrice(item.price)} <span>UZS</span>
                          </div>
                        </div>
                      </div>

                      {qty === 0 ? (
                        <button
                          type="button"
                          className="rgm-item-add"
                          onClick={() => updateQuantity(item._id || '', 1)}
                          style={{ color: accentColor, borderColor: accentColor }}
                        >
                          <Plus size={16} strokeWidth={2.4} />
                        </button>
                      ) : (
                        <div
                          className="rgm-item-qty"
                          style={{ background: `${accentColor}15` }}
                        >
                          <button
                            type="button"
                            className="rgm-qty-btn"
                            onClick={() => updateQuantity(item._id || '', -1)}
                            style={{ color: accentColor }}
                          >
                            <Minus size={14} strokeWidth={2.4} />
                          </button>
                          <span className="rgm-qty-value" style={{ color: accentColor }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            className="rgm-qty-btn"
                            onClick={() => updateQuantity(item._id || '', 1)}
                            style={{ color: accentColor }}
                          >
                            <Plus size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* CART PREVIEW + COMMENTS — only when cart has items */}
          {totalItems > 0 && (
            <>
              <div className="rgm-section" style={{ marginTop: 14 }}>
                <div className="rgm-section-title">
                  <ShoppingBag
                    size={13}
                    strokeWidth={2.2}
                    style={{ color: accentColor }}
                  />
                  Savatcha ({totalItems})
                  <button
                    type="button"
                    className="rgm-cart-toggle"
                    onClick={() => setShowCart(!showCart)}
                    style={{ color: accentColor }}
                  >
                    {showCart ? 'Yashirish' : 'Ko\'rish'}
                  </button>
                </div>

                {showCart && (
                  <div className="rgm-cart-list">
                    {cartItems.map((it) => (
                      <div key={it._id} className="rgm-cart-row">
                        {it.category_icon && (
                          <span className="rgm-cart-cat">{it.category_icon}</span>
                        )}
                        <span className="rgm-cart-name">{it.name}</span>
                        <span className="rgm-cart-qty">×{it.quantity}</span>
                        <span className="rgm-cart-sub" style={{ color: accentColor }}>
                          {formatPrice(it.subtotal)}
                        </span>
                        <button
                          type="button"
                          className="rgm-cart-remove"
                          onClick={() =>
                            setCart((prev) => {
                              const next = { ...prev };
                              delete next[it._id || ''];
                              return next;
                            })
                          }
                          aria-label="Remove"
                        >
                          <Trash2 size={12} strokeWidth={2.2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMMENTS */}
              <div className="rgm-field">
                <label className="rgm-label">
                  <MessageSquare size={11} strokeWidth={2.4} style={{ color: accentColor }} />
                  COMMENTS (OPTIONAL)
                </label>
                <textarea
                  className="rgm-textarea"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Maxsus iltimos? Masalan: tuzni kam qo'ying..."
                  rows={2}
                  maxLength={300}
                />
              </div>
            </>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="rgm-footer">
          {totalItems > 0 && (
            <div className="rgm-cart-bar">
              <div className="rgm-cart-info">
                <div className="rgm-cart-count">{totalItems} ta taom</div>
                <div className="rgm-cart-total" style={{ color: accentColor }}>
                  {formatPrice(totalAmount)} UZS
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="rgm-btn-submit"
            onClick={handleSubmit}
            disabled={submitting || totalItems === 0}
            style={{ background: accentColor }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="rgm-spin" /> Yuborilmoqda...
              </>
            ) : totalItems > 0 ? (
              <>
                <Utensils size={16} strokeWidth={2.2} /> Buyurtma berish
              </>
            ) : (
              <>Taom tanlang</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantGuestModal;