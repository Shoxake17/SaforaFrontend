// src/pages/qrrooms/panels/OrdersPanel.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Check,
  X,
  MessageSquare,
  Loader2,
  RefreshCw,
  Utensils,
  Clock,
  TrendingUp,
  Receipt,
  ChefHat,
} from 'lucide-react';
import {
  listRequests,
  approveRequest,
  cancelRequest,
  type ServiceRequest,
  type RequestStatus,
} from '@services/requests';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import './OrdersPanel.css';

interface OrdersPanelProps {
  hotelSlug: string;
  accentColor: string;
}

// ─── Helpers ──────────────────────────────────────────
const formatTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
};

type Urgency = 'fresh' | 'normal' | 'soon' | 'urgent';

const getUrgency = (iso: string, status: string): Urgency => {
  if (status !== 'pending') return 'normal';
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diffMin < 5) return 'fresh';
  if (diffMin < 15) return 'normal';
  if (diffMin < 30) return 'soon';
  return 'urgent';
};

const formatPrice = (n: number): string =>
  new Intl.NumberFormat('en-US').format(Math.round(n)).replace(/,/g, ' ');

const getTotals = (req: ServiceRequest) => {
  const d: any = req.details || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const totalItems =
    d.total_items || items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
  const totalAmount =
    d.total_amount || items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0);
  return { items, totalItems, totalAmount };
};

const FILTERS: Array<{ key: RequestStatus | 'all'; label: string; color?: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending',   color: '#f97316' },
  { key: 'approved',  label: 'Approved',  color: '#16a34a' },
  { key: 'cancelled', label: 'Cancelled', color: '#6b7280' },
];

// ─── Component ────────────────────────────────────────
const OrdersPanel: React.FC<OrdersPanelProps> = ({ hotelSlug, accentColor }) => {
  const [allOrders, setAllOrders] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hammasini bir marta yuklab, client-side filter — counts to'g'ri chiqishi uchun
  const loadOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await listRequests(hotelSlug, 'all', 200);
      if (result.success && result.requests) {
        const restaurantOnly = result.requests.filter(
          (r) => r.service_type === 'restaurant'
        );
        setAllOrders(restaurantOnly);
      }
    } catch (err) {
      console.warn('[OrdersPanel] load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelSlug]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  // ─── Socket realtime ────────────────────────────
  useEffect(() => {
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleNew = (data: any) => {
      if (data?.service_type === 'restaurant' || !data?.service_type) {
        loadOrders();
      }
    };
    const handleChange = () => loadOrders();

    socket.on('new-request', handleNew);
    socket.on('request:status_changed', handleChange);

    return () => {
      socket.off('new-request', handleNew);
      socket.off('request:status_changed', handleChange);
    };
  }, [loadOrders]);

  // ─── Actions ────────────────────────────────────
  const handleApprove = async (request: ServiceRequest) => {
    setProcessingId(request._id);
    const result = await approveRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadOrders();
    else alert(result.error || 'Tasdiqlashda xato');
  };

  const handleCancel = async (request: ServiceRequest) => {
    if (!window.confirm('Buyurtmani bekor qilasizmi?')) return;
    setProcessingId(request._id);
    const result = await cancelRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadOrders();
    else alert(result.error || 'Bekor qilishda xato');
  };

  // ─── Derived data ───────────────────────────────
  const counts = useMemo(
    () => ({
      all: allOrders.length,
      pending: allOrders.filter((o) => o.status === 'pending').length,
      approved: allOrders.filter((o) => o.status === 'approved').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }),
    [allOrders]
  );

  const orders = useMemo(
    () => (filter === 'all' ? allOrders : allOrders.filter((o) => o.status === filter)),
    [allOrders, filter]
  );

  const pendingStats = useMemo(() => {
    const pending = allOrders.filter((o) => o.status === 'pending');
    const totalAmount = pending.reduce((s, o) => s + getTotals(o).totalAmount, 0);
    const totalItems = pending.reduce((s, o) => s + getTotals(o).totalItems, 0);
    return { count: pending.length, totalAmount, totalItems };
  }, [allOrders]);

  // ─── Render ─────────────────────────────────────
  return (
    <div className="op-panel">
      {/* FILTER PILLS */}
      <div className="op-filters">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const count = counts[f.key];
          const color = f.color || accentColor;

          return (
            <button
              key={f.key}
              type="button"
              className={`op-pill ${isActive ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
              style={
                isActive
                  ? {
                      background: `${color}18`,
                      color: color,
                      borderColor: `${color}40`,
                    }
                  : undefined
              }
            >
              <span>{f.label}</span>
              {count > 0 && (
                <span
                  className="op-pill-count"
                  style={isActive ? { background: color, color: '#fff' } : undefined}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="op-skeletons">
          {[1, 2, 3].map((i) => (
            <div key={i} className="op-skeleton">
              <div className="op-skeleton-head" />
              <div className="op-skeleton-body" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="op-empty">
          <div
            className="op-empty-ico"
            style={{ background: `${accentColor}10`, color: accentColor }}
          >
            <Receipt size={32} strokeWidth={1.6} />
          </div>
          <div className="op-empty-title">
            No {filter === 'all' ? '' : filter} orders
          </div>
          <div className="op-empty-text">
            Restaurant orders from guests will appear here
          </div>
        </div>
      ) : (
        <div className="op-list">
          {orders.map((order) => {
            const { items, totalItems, totalAmount } = getTotals(order);
            const isProcessing = processingId === order._id;
            const isPending = order.status === 'pending';
            const urgency = getUrgency(order.createdAt, order.status);
            const d: any = order.details || {};

            return (
              <article
                key={order._id}
                className={`op-card op-card-${order.status} op-urg-${urgency}`}
              >
                {/* Head */}
                <header className="op-card-head">
                  <div className="op-card-id">
                    <div
                      className="op-card-ico"
                      style={{ background: `${accentColor}15`, color: accentColor }}
                    >
                      <Utensils size={18} strokeWidth={2.2} />
                    </div>
                    <div className="op-card-id-text">
                      <div className="op-card-room">Room {order.room_number}</div>
                      <div className="op-card-meta">
                        {order.guest_name && (
                          <>
                            <span className="op-card-guest">{order.guest_name}</span>
                            <span className="op-dot" />
                          </>
                        )}
                        <span className={`op-card-time op-time-${urgency}`}>
                          <Clock size={11} strokeWidth={2.4} />
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`op-status op-status-${order.status}`}>
                    <span className="op-status-dot" />
                    {order.status}
                  </div>
                </header>

                {/* Items */}
                {items.length > 0 && (
                  <div className="op-items">
                    {items.map((it: any, idx: number) => (
                      <div key={idx} className="op-item">
                        {/* 🖼️ Image — endi toza, overlay yo'q */}
                        <div className="op-item-img">
                          {it.image ? (
                            <img src={it.image} alt={it.name} />
                          ) : (
                            <span className="op-item-emoji">
                              {it.category_icon || '🍽️'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="op-item-info">
                          <div className="op-item-name">{it.name}</div>
                          {it.category_name && (
                            <div className="op-item-cat">
                              {it.category_icon} {it.category_name}
                            </div>
                          )}
                        </div>

                        {/* ⭐ Quantity chip — ALOHIDA, aniq ko'rinadi */}
                        <div
                          className="op-item-qty-chip"
                          style={{
                            background: `${accentColor}15`,
                            color: accentColor,
                            borderColor: `${accentColor}35`,
                          }}
                        >
                          ×{it.quantity || 1}
                        </div>

                        {/* Price */}
                        <div className="op-item-price">
                          <span>{formatPrice(it.subtotal || 0)}</span>
                          <span className="op-item-cur">UZS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note from guest */}
                {d.comments && (
                  <div className="op-note">
                    <MessageSquare size={12} strokeWidth={2.4} />
                    <span>{d.comments}</span>
                  </div>
                )}

                {/* Response message */}
                {order.response_message && (
                  <div className="op-response">💬 {order.response_message}</div>
                )}

                {/* Footer */}
                <footer className="op-card-foot">
                  <div className="op-summary">
                    <span className="op-summary-count">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                    <span className="op-summary-total" style={{ color: accentColor }}>
                      {formatPrice(totalAmount)}
                      <span className="op-summary-cur">UZS</span>
                    </span>
                  </div>

                  {isPending && (
                    <div className="op-actions">
                      <button
                        type="button"
                        className="op-btn op-btn-cancel"
                        onClick={() => handleCancel(order)}
                        disabled={isProcessing}
                      >
                        <X size={14} strokeWidth={2.4} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        className="op-btn op-btn-approve"
                        onClick={() => handleApprove(order)}
                        disabled={isProcessing}
                        style={{ background: accentColor }}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="op-spin" />
                            <span>Processing…</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} strokeWidth={2.6} />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;