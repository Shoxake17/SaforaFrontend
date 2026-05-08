// src/pages/guest/modals/LaundryGuestModal/LaundryGuestModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Clock, FileText, MessageSquare, Loader2, Check,
  Plus, Minus, ShoppingBag, User, UserCircle, Baby,
  WashingMachine, Trash2,
} from 'lucide-react';
import { createGuestRequest } from '@services/requests';
import { imageUrl } from '@utils/imageUrl';
import './LaundryGuestModal.css';

export interface LaundryItem {
  _id?: string;
  category: 'men' | 'women' | 'children';
  name: string;
  price: number;
}

export interface LaundryServiceDetail {
  images?: string[];
  description?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
  location?: string;
  items?: LaundryItem[];
}

interface LaundryGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  accentColor: string;
  serviceDetail?: LaundryServiceDetail;
}

const CATEGORIES: { id: 'men' | 'women' | 'children'; label: string; icon: any }[] = [
  { id: 'men', label: 'Erkaklar', icon: User },
  { id: 'women', label: 'Ayollar', icon: UserCircle },
  { id: 'children', label: 'Bolalar', icon: Baby },
];

const formatPrice = (n: number): string => {
  return new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');
};

const LaundryGuestModal: React.FC<LaundryGuestModalProps> = ({
  isOpen, onClose, hotelSlug, roomNumber, guestName, accentColor,
  serviceDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'men' | 'women' | 'children'>('men');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photos = Array.isArray(serviceDetail?.images) ? serviceDetail!.images : [];
  const hasPhotos = photos.length > 0;
  const allItems = serviceDetail?.items || [];

  const description = serviceDetail?.description?.trim() ||
    'Yuvish va dazmollash xizmati';

  const isOpenAllDay = !!serviceDetail?.is_24_hours;
  const openTime = serviceDetail?.open_time || '08:00';
  const closeTime = serviceDetail?.close_time || '20:00';
  const hoursLabel = isOpenAllDay ? '24 Hours' : `${openTime} – ${closeTime}`;

  // Cart calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const item = allItems.find(it => it._id === id);
        if (!item) return null;
        return {
          ...item,
          quantity,
          subtotal: item.price * quantity,
        };
      })
      .filter(Boolean) as Array<LaundryItem & { quantity: number; subtotal: number }>;
  }, [cart, allItems]);

  const totalItems = cartItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = cartItems.reduce((sum, it) => sum + it.subtotal, 0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('men');
      setCart({});
      setComments('');
      setShowCart(false);
      setError(null);
      setSuccess(false);
      setCurrentPhoto(0);
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = allItems.filter(it => it.category === activeTab);
  const counts = {
    men: allItems.filter(it => it.category === 'men').length,
    women: allItems.filter(it => it.category === 'women').length,
    children: allItems.filter(it => it.category === 'children').length,
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
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
      setError('Iltimos, kamida 1 ta kiyim tanlang');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGuestRequest({
      hotel_slug: hotelSlug,
      room_number: roomNumber,
      guest_name: guestName,
      service_type: 'laundry',
      details: {
        items: cartItems.map(it => ({
          item_id: it._id,
          category: it.category,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
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

  // SUCCESS SCREEN
  if (success) {
    return (
      <div className="lgm-overlay" onClick={onClose}>
        <div className="lgm-modal lgm-success" onClick={(e) => e.stopPropagation()}>
          <div className="lgm-success-icon" style={{ background: accentColor }}>
            <Check size={32} strokeWidth={2.4} />
          </div>
          <h2 className="lgm-success-title">So'rov yuborildi!</h2>
          <p className="lgm-success-msg">
            {totalItems} ta kiyim qabul qilindi.<br />
            Tez orada kiyimlaringizni olishga keladi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lgm-overlay" onClick={onClose}>
      <div className="lgm-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lgm-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={2.4} />
        </button>

        {/* HERO */}
        {hasPhotos ? (
          <div className="lgm-hero lgm-hero-photo">
            <img src={imageUrl(photos[currentPhoto])} alt="Laundry" className="lgm-hero-img" />
            {photos.length > 1 && (
              <>
                <div className="lgm-hero-counter">{currentPhoto + 1} / {photos.length}</div>
                <div className="lgm-hero-dots">
                  {photos.map((_, idx) => (
                    <button key={idx} type="button"
                      className={`lgm-hero-dot ${idx === currentPhoto ? 'active' : ''}`}
                      onClick={() => setCurrentPhoto(idx)}
                      aria-label={`Photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="lgm-hero" style={{ background: `linear-gradient(135deg, ${accentColor}, #ea580c)` }}>
            <WashingMachine size={48} strokeWidth={1.8} className="lgm-hero-icon" />
          </div>
        )}

        {/* CONTENT */}
        <div className="lgm-content">
          <h2 className="lgm-title">Laundry Service</h2>

          <div className="lgm-info-card">
            <div className="lgm-info-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
              <Clock size={16} strokeWidth={2.2} />
            </div>
            <div className="lgm-info-text">
              <div className="lgm-info-label">Service Available</div>
              <div className="lgm-info-value">{hoursLabel}</div>
            </div>
          </div>

          

          {/* CATEGORY TABS */}
          <div className="lgm-tabs">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`lgm-tab ${active ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                  style={active ? { color: accentColor, borderColor: accentColor } : {}}
                >
                  <Icon size={16} strokeWidth={2.2} />
                  <span>{cat.label}</span>
                  {counts[cat.id] > 0 && (
                    <span className="lgm-tab-count">{counts[cat.id]}</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <div className="lgm-error">⚠️ {error}</div>}

          {/* ITEMS LIST */}
          <div className="lgm-items">
            {filteredItems.length === 0 ? (
              <div className="lgm-empty">
                <ShoppingBag size={36} strokeWidth={1.5} />
                <p>Bu kategoriyada kiyim yo'q</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const qty = cart[item._id || ''] || 0;
                const inCart = qty > 0;

                return (
                  <div key={item._id} className={`lgm-item ${inCart ? 'is-active' : ''}`}>
                    <div className="lgm-item-info">
                      <div className="lgm-item-name">{item.name}</div>
                      <div className="lgm-item-price">
                        {formatPrice(item.price)} <span>UZS</span>
                      </div>
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        className="lgm-item-add"
                        onClick={() => updateQuantity(item._id || '', 1)}
                        style={{ color: accentColor, borderColor: accentColor }}
                      >
                        <Plus size={16} strokeWidth={2.4} />
                      </button>
                    ) : (
                      <div className="lgm-item-qty" style={{ background: `${accentColor}15` }}>
                        <button
                          type="button"
                          className="lgm-qty-btn"
                          onClick={() => updateQuantity(item._id || '', -1)}
                          style={{ color: accentColor }}
                        >
                          <Minus size={14} strokeWidth={2.4} />
                        </button>
                        <span className="lgm-qty-value" style={{ color: accentColor }}>{qty}</span>
                        <button
                          type="button"
                          className="lgm-qty-btn"
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

          {/* CART PREVIEW + COMMENTS — faqat cart bo'sh emas bo'lsa */}
          {totalItems > 0 && (
            <>
              <div className="lgm-section" style={{ marginTop: 12 }}>
                <div className="lgm-section-title">
                  <ShoppingBag size={13} strokeWidth={2.2} style={{ color: accentColor }} />
                  Savatcha ({totalItems})
                  <button
                    type="button"
                    className="lgm-cart-toggle"
                    onClick={() => setShowCart(!showCart)}
                  >
                    {showCart ? 'Yashirish' : 'Ko\'rish'}
                  </button>
                </div>

                {showCart && (
                  <div className="lgm-cart-list">
                    {cartItems.map((it) => (
                      <div key={it._id} className="lgm-cart-row">
                        <span className="lgm-cart-name">{it.name}</span>
                        <span className="lgm-cart-qty">×{it.quantity}</span>
                        <span className="lgm-cart-sub">{formatPrice(it.subtotal)}</span>
                        <button
                          type="button"
                          className="lgm-cart-remove"
                          onClick={() => setCart(prev => {
                            const next = { ...prev };
                            delete next[it._id || ''];
                            return next;
                          })}
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
              <div className="lgm-field">
                <label className="lgm-label">
                  <MessageSquare size={11} strokeWidth={2.4} style={{ color: accentColor }} />
                  COMMENTS (OPTIONAL)
                </label>
                <textarea
                  className="lgm-textarea"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Maxsus ko'rsatmalar..."
                  rows={2}
                  maxLength={200}
                />
              </div>
            </>
          )}
        </div>

        {/* STICKY FOOTER — Cart Bar */}
        <div className="lgm-footer">
          {totalItems > 0 && (
            <div className="lgm-cart-bar">
              <div className="lgm-cart-info">
                <div className="lgm-cart-count">{totalItems} ta kiyim</div>
                <div className="lgm-cart-total" style={{ color: accentColor }}>
                  {formatPrice(totalAmount)} UZS
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="lgm-btn-submit"
            onClick={handleSubmit}
            disabled={submitting || totalItems === 0}
            style={{ background: accentColor }}
          >
            {submitting ? (
              <><Loader2 size={16} className="lgm-spin" /> Sending...</>
            ) : totalItems > 0 ? (
              <><WashingMachine size={16} strokeWidth={2.2} /> Send Request</>
            ) : (
              <>Kiyim tanlang</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaundryGuestModal;