// src/pages/qrrooms/panels/RequestsPanel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  HandHelping, Car, Sparkles, Waves, Dumbbell, WashingMachine,
  AlarmClock, ConciergeBell, Check, X, MapPin, Calendar, MessageSquare,
  Loader2, RefreshCw, ShoppingBag, Utensils,                       // ⭐ Utensils
} from 'lucide-react';
import { listRequests, approveRequest, cancelRequest, type ServiceRequest, type RequestStatus } from '@services/requests';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import './RequestsPanel.css';

interface RequestsPanelProps {
  hotelSlug: string;
  accentColor: string;
}

const SERVICE_ICONS: Record<string, any> = {
  yandex_taxi: Car,
  spa: Sparkles,
  pool: Waves,
  gym: Dumbbell,
  laundry: WashingMachine,
  restaurant: Utensils,                                             // ⭐ YANGI
  wake_up: AlarmClock,
  concierge: ConciergeBell,
  default: HandHelping,
};

const SERVICE_LABELS: Record<string, string> = {
  yandex_taxi: 'Yandex Taxi',
  spa: 'Spa & Wellness',
  pool: 'Swimming Pool',
  gym: 'Gym & Fitness',
  laundry: 'Laundry',
  restaurant: 'Restaurant',                                         // ⭐ YANGI
  wake_up: 'Wake-up Call',
  concierge: 'Concierge',
};

const CATEGORY_EMOJI: Record<string, string> = {
  men: '👔',
  women: '👗',
  children: '👶',
};

const CATEGORY_LABEL: Record<string, string> = {
  men: 'Erkaklar',
  women: 'Ayollar',
  children: 'Bolalar',
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
};

const formatPrice = (n: number): string => {
  return new Intl.NumberFormat('en-US').format(n).replace(/,/g, ' ');
};

const RequestsPanel: React.FC<RequestsPanelProps> = ({ hotelSlug, accentColor }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ─── Load requests ──────────────────────
  const loadRequests = useCallback(async () => {
    const result = await listRequests(hotelSlug, filter, 100);
    if (result.success && result.requests) {
      setRequests(result.requests);
    }
    setLoading(false);
  }, [hotelSlug, filter]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [loadRequests]);

  // ─── Socket — real-time updates ─────────
  useEffect(() => {
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleNewRequest = (data: any) => {
      console.log('[RequestsPanel] 📡 new-request:', data);
      loadRequests();
    };

    const handleStatusChanged = (data: any) => {
      console.log('[RequestsPanel] 📡 status changed:', data);
      loadRequests();
    };

    socket.on('new-request', handleNewRequest);
    socket.on('request:status_changed', handleStatusChanged);

    return () => {
      socket.off('new-request', handleNewRequest);
      socket.off('request:status_changed', handleStatusChanged);
    };
  }, [loadRequests]);

  // ─── Approve ────────────────────────────
  const handleApprove = async (request: ServiceRequest) => {
    setProcessingId(request._id);
    const result = await approveRequest(hotelSlug, request._id);
    setProcessingId(null);

    if (result.success) {
      loadRequests();
    } else {
      alert(result.error || 'Tasdiqlashda xato');
    }
  };

  // ─── Cancel ─────────────────────────────
  const handleCancel = async (request: ServiceRequest) => {
    if (!window.confirm('So\'rovni bekor qilasizmi?')) return;
    setProcessingId(request._id);
    const result = await cancelRequest(hotelSlug, request._id);
    setProcessingId(null);

    if (result.success) {
      loadRequests();
    } else {
      alert(result.error || 'Bekor qilishda xato');
    }
  };

  // ─── Render details ─────────────────────
  const renderDetails = (request: ServiceRequest) => {
    const d: any = request.details || {};

    // ⭐⭐⭐ YANDEX TAXI
    if (request.service_type === 'yandex_taxi') {
      return (
        <div className="rqp-details">
          {d.pickup_location && (
            <div className="rqp-detail-row">
              <MapPin size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Pickup:</span>
              <span className="rqp-detail-val">{d.pickup_location}</span>
            </div>
          )}
          {d.dropoff_location && (
            <div className="rqp-detail-row">
              <MapPin size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Drop-off:</span>
              <span className="rqp-detail-val">{d.dropoff_location}</span>
            </div>
          )}
          {d.scheduled_at && (
            <div className="rqp-detail-row">
              <Calendar size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">When:</span>
              <span className="rqp-detail-val">
                {new Date(d.scheduled_at).toLocaleString()}
              </span>
            </div>
          )}
          {d.comments && (
            <div className="rqp-detail-row">
              <MessageSquare size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Note:</span>
              <span className="rqp-detail-val">{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // ⭐⭐⭐ LAUNDRY — items bilan
    if (request.service_type === 'laundry') {
      const items = Array.isArray(d.items) ? d.items : [];
      const totalItems = d.total_items || items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = d.total_amount || items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0);

      return (
        <div className="rqp-details">
          {/* Summary */}
          <div className="rqp-laundry-summary" style={{ borderColor: `${accentColor}30` }}>
            <div className="rqp-laundry-stat">
              <ShoppingBag size={13} strokeWidth={2.4} style={{ color: accentColor }} />
              <strong>{totalItems}</strong>
              <span>kiyim</span>
            </div>
            <div className="rqp-laundry-stat rqp-laundry-total">
              <strong style={{ color: accentColor }}>
                {formatPrice(totalAmount)} <span style={{ fontSize: 10 }}>UZS</span>
              </strong>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="rqp-laundry-items">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="rqp-li">
                  <span className="rqp-li-cat" title={CATEGORY_LABEL[it.category] || ''}>
                    {CATEGORY_EMOJI[it.category] || '👕'}
                  </span>
                  <span className="rqp-li-name">{it.name}</span>
                  <span className="rqp-li-qty">×{it.quantity}</span>
                  <span className="rqp-li-sub">{formatPrice(it.subtotal || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {d.comments && (
            <div className="rqp-detail-row" style={{ marginTop: 8 }}>
              <MessageSquare size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Note:</span>
              <span className="rqp-detail-val">{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // ⭐⭐⭐ RESTAURANT — taom buyurtmasi
    if (request.service_type === 'restaurant') {
      const items = Array.isArray(d.items) ? d.items : [];
      const totalItems = d.total_items || items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = d.total_amount || items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0);

      return (
        <div className="rqp-details">
          {/* Summary */}
          <div className="rqp-laundry-summary" style={{ borderColor: `${accentColor}30` }}>
            <div className="rqp-laundry-stat">
              <Utensils size={13} strokeWidth={2.4} style={{ color: accentColor }} />
              <strong>{totalItems}</strong>
              <span>taom</span>
            </div>
            <div className="rqp-laundry-stat rqp-laundry-total">
              <strong style={{ color: accentColor }}>
                {formatPrice(totalAmount)} <span style={{ fontSize: 10 }}>UZS</span>
              </strong>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="rqp-restaurant-items">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="rqp-ri">
                  <div className="rqp-ri-img">
                    {it.image ? (
                      <img src={it.image} alt={it.name} />
                    ) : (
                      <span className="rqp-ri-emoji">{it.category_icon || '🍽️'}</span>
                    )}
                  </div>
                  <div className="rqp-ri-info">
                    <div className="rqp-ri-name">{it.name}</div>
                    {it.category_name && (
                      <div className="rqp-ri-cat">
                        {it.category_icon} {it.category_name}
                      </div>
                    )}
                  </div>
                  <div className="rqp-ri-qty">×{it.quantity}</div>
                  <div className="rqp-ri-sub">{formatPrice(it.subtotal || 0)}</div>
                </div>
              ))}
            </div>
          )}

          {d.comments && (
            <div className="rqp-detail-row" style={{ marginTop: 8 }}>
              <MessageSquare size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Note:</span>
              <span className="rqp-detail-val">{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // Generic details for other services
    if (d.comments || d.notes || d.description) {
      return (
        <div className="rqp-details">
          {(d.comments || d.notes || d.description) && (
            <div className="rqp-detail-row">
              <MessageSquare size={12} strokeWidth={2.4} className="rqp-detail-icon" />
              <span className="rqp-detail-label">Note:</span>
              <span className="rqp-detail-val">{d.comments || d.notes || d.description}</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rqp-panel">
      {/* HEADER + FILTERS */}
      <div className="rqp-toolbar">
        <div className="rqp-filters">
          {(['all', 'pending', 'approved', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`rqp-filter ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
              style={filter === f ? {
                background: `${accentColor}20`,
                color: accentColor,
                borderColor: `${accentColor}40`,
              } : undefined}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="rqp-refresh"
          onClick={loadRequests}
          aria-label="Refresh"
        >
          <RefreshCw size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="rqp-loading">
          <Loader2 size={24} className="rqp-spin" />
          <span>Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rqp-empty">
          <HandHelping size={32} strokeWidth={1.5} />
          <p>No requests yet</p>
          <small>Guest service requests will appear here</small>
        </div>
      ) : (
        <div className="rqp-list">
          {requests.map((request) => {
            const Icon = SERVICE_ICONS[request.service_type] || SERVICE_ICONS.default;
            const label = SERVICE_LABELS[request.service_type] || request.service_type;
            const isProcessing = processingId === request._id;
            const isPending = request.status === 'pending';

            return (
              <div key={request._id} className={`rqp-item rqp-status-${request.status}`}>
                <div className="rqp-item-icon" style={{
                  background: `${accentColor}15`,
                  color: accentColor,
                }}>
                  <Icon size={20} strokeWidth={2} />
                </div>

                <div className="rqp-item-body">
                  <div className="rqp-item-head">
                    <div className="rqp-item-title">{label}</div>
                    <div className={`rqp-item-status rqp-status-${request.status}`}>
                      {request.status}
                    </div>
                  </div>

                  <div className="rqp-item-meta">
                    <span>Room {request.room_number}</span>
                    {request.guest_name && <span>• {request.guest_name}</span>}
                    <span>• {formatTime(request.createdAt)}</span>
                  </div>

                  {renderDetails(request)}

                  {request.response_message && (
                    <div className="rqp-response">
                      💬 {request.response_message}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="rqp-item-actions">
                    <button
                      type="button"
                      className="rqp-btn rqp-btn-approve"
                      onClick={() => handleApprove(request)}
                      disabled={isProcessing}
                      style={{ background: accentColor }}
                    >
                      {isProcessing ? (
                        <Loader2 size={14} className="rqp-spin" />
                      ) : (
                        <><Check size={14} strokeWidth={2.4} /> Approve</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="rqp-btn rqp-btn-cancel"
                      onClick={() => handleCancel(request)}
                      disabled={isProcessing}
                      aria-label="Cancel"
                    >
                      <X size={14} strokeWidth={2.4} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsPanel;