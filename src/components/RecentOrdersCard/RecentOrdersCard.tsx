// src/components/RecentOrdersCard/RecentOrdersCard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  Check,
  X,
  Loader2,
  Utensils,
  ChevronRight,
} from 'lucide-react';
import {
  listRequests,
  approveRequest,
  cancelRequest,
  type ServiceRequest,
} from '@services/requests';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import './RecentOrdersCard.css';

interface RecentOrdersCardProps {
  hotelSlug: string;
  accentColor: string;
  onViewAll?: () => void;
  maxItems?: number;
}

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
};

const formatPrice = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');

const getOrderTotals = (request: ServiceRequest) => {
  const d: any = request.details || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const totalItems =
    d.total_items ||
    items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
  const totalAmount =
    d.total_amount ||
    items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0);
  return { totalItems, totalAmount };
};

const RecentOrdersCard: React.FC<RecentOrdersCardProps> = ({
  hotelSlug,
  accentColor,
  onViewAll,
  maxItems = 5,
}) => {
  const [orders, setOrders] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!hotelSlug) return;
    try {
      const result = await listRequests(hotelSlug, 'pending', 100);
      if (result.success && result.requests) {
        const restaurantOnly = result.requests
          .filter((r) => r.service_type === 'restaurant')
          .slice(0, maxItems);
        setOrders(restaurantOnly);
      }
    } catch (err) {
      console.warn('[RecentOrdersCard] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [hotelSlug, maxItems]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  // ─── Socket — real-time refresh ──────────────────
  useEffect(() => {
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleNewRequest = (data: any) => {
      if (data?.service_type === 'restaurant' || !data?.service_type) {
        loadOrders();
      }
    };
    const handleStatusChanged = () => loadOrders();

    socket.on('new-request', handleNewRequest);
    socket.on('request:status_changed', handleStatusChanged);

    return () => {
      socket.off('new-request', handleNewRequest);
      socket.off('request:status_changed', handleStatusChanged);
    };
  }, [loadOrders]);

  // ─── Approve ─────────────────────────────────────
  const handleApprove = async (
    request: ServiceRequest,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setProcessingId(request._id);
    const result = await approveRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadOrders();
    else alert(result.error || 'Tasdiqlashda xato');
  };

  // ─── Cancel ──────────────────────────────────────
  const handleCancel = async (
    request: ServiceRequest,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!window.confirm('Buyurtmani bekor qilasizmi?')) return;
    setProcessingId(request._id);
    const result = await cancelRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadOrders();
    else alert(result.error || 'Bekor qilishda xato');
  };

  return (
    <div className="roc-card">
      {/* Header */}
      <div className="roc-header">
        <div className="roc-title-wrap">
          <div
            className="roc-icon"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            <ShoppingCart size={16} strokeWidth={2.2} />
          </div>
          <div className="roc-title">Recent Orders</div>
          {orders.length > 0 && (
            <span className="roc-count-badge">{orders.length}</span>
          )}
        </div>

        {onViewAll && (
          <button
            type="button"
            className="roc-view-all"
            onClick={onViewAll}
            aria-label="View all orders"
          >
            View all
            <ChevronRight size={12} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="roc-body">
        {loading ? (
          <div className="roc-loading">
            <Loader2 size={20} className="roc-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="roc-empty">
            <div className="roc-empty-ico">
              <ShoppingCart size={26} strokeWidth={1.5} />
            </div>
            <div className="roc-empty-title">No pending orders</div>
            <div className="roc-empty-text">New orders will appear here</div>
          </div>
        ) : (
          <div className="roc-list">
            {orders.map((order) => {
              const { totalItems, totalAmount } = getOrderTotals(order);
              const isProcessing = processingId === order._id;

              return (
                <div key={order._id} className="roc-item">
                  <div
                    className="roc-item-ico"
                    style={{
                      background: `${accentColor}12`,
                      color: accentColor,
                    }}
                  >
                    <Utensils size={14} strokeWidth={2.2} />
                  </div>

                  <div className="roc-item-info">
                    <div className="roc-item-top">
                      <span className="roc-item-room">
                        Room {order.room_number}
                      </span>
                      <span className="roc-item-time">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="roc-item-bot">
                      <span className="roc-item-meta">
                        {totalItems} {totalItems === 1 ? 'item' : 'products'}
                        {order.guest_name ? ` • ${order.guest_name}` : ''}
                      </span>
                      <span
                        className="roc-item-total"
                        style={{ color: accentColor }}
                      >
                        {formatPrice(totalAmount)} UZS
                      </span>
                    </div>
                  </div>

                  <div className="roc-item-actions">
                    <button
                      type="button"
                      className="roc-btn roc-btn-approve"
                      onClick={(e) => handleApprove(order, e)}
                      disabled={isProcessing}
                      style={{ background: accentColor }}
                      aria-label="Accept order"
                      title="Accept"
                    >
                      {isProcessing ? (
                        <Loader2 size={12} className="roc-spin" />
                      ) : (
                        <Check size={12} strokeWidth={2.6} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="roc-btn roc-btn-cancel"
                      onClick={(e) => handleCancel(order, e)}
                      disabled={isProcessing}
                      aria-label="Cancel order"
                      title="Cancel"
                    >
                      <X size={12} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrdersCard;