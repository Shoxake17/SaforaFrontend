// src/pages/qrrooms/panels/RequestsPanel.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  HandHelping,
  Car,
  Sparkles,
  Waves,
  Dumbbell,
  WashingMachine,
  AlarmClock,
  ConciergeBell,
  Check,
  X,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
  Clock,
  Inbox,
  CheckCircle2,
  Activity,
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
import './RequestsPanel.css';

interface RequestsPanelProps {
  hotelSlug: string;
  accentColor: string;
}

// ─── Service config ────────────────────────────────────
type SvcConfig = { icon: typeof Car; label: string; color: string };

const SERVICE_CONFIG: Record<string, SvcConfig> = {
  yandex_taxi: { icon: Car,            label: 'Yandex Taxi',    color: '#eab308' },
  spa:         { icon: Sparkles,       label: 'Spa & Wellness', color: '#a855f7' },
  pool:        { icon: Waves,          label: 'Swimming Pool',  color: '#06b6d4' },
  gym:         { icon: Dumbbell,       label: 'Gym & Fitness',  color: '#dc2626' },
  laundry:     { icon: WashingMachine, label: 'Laundry',        color: '#2563eb' },
  wake_up:     { icon: AlarmClock,     label: 'Wake-up Call',   color: '#f59e0b' },
  concierge:   { icon: ConciergeBell,  label: 'Concierge',      color: '#16a34a' },
};

const getSvc = (type: string): SvcConfig =>
  SERVICE_CONFIG[type] || { icon: HandHelping, label: type, color: '#6b7280' };

const CATEGORY_EMOJI: Record<string, string> = {
  men: '👔', women: '👗', children: '👶',
};

const CATEGORY_LABEL: Record<string, string> = {
  men: 'Erkaklar', women: 'Ayollar', children: 'Bolalar',
};

// ─── Helpers ───────────────────────────────────────────
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

const FILTERS: Array<{ key: RequestStatus | 'all'; label: string; color?: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending',   color: '#f97316' },
  { key: 'approved',  label: 'Approved',  color: '#16a34a' },
  { key: 'cancelled', label: 'Cancelled', color: '#6b7280' },
];

// ─── Component ────────────────────────────────────────
const RequestsPanel: React.FC<RequestsPanelProps> = ({ hotelSlug, accentColor }) => {
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load all, client-side filter (restaurant EXCLUDED)
  const loadRequests = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await listRequests(hotelSlug, 'all', 200);
      if (result.success && result.requests) {
        const nonRestaurant = result.requests.filter(
          (r) => r.service_type !== 'restaurant'
        );
        setAllRequests(nonRestaurant);
      }
    } catch (err) {
      console.warn('[RequestsPanel] load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelSlug]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [loadRequests]);

  // Socket real-time
  useEffect(() => {
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleNew = (data: any) => {
      if (data?.service_type !== 'restaurant') {
        loadRequests();
      }
    };
    const handleChange = () => loadRequests();

    socket.on('new-request', handleNew);
    socket.on('request:status_changed', handleChange);

    return () => {
      socket.off('new-request', handleNew);
      socket.off('request:status_changed', handleChange);
    };
  }, [loadRequests]);

  // Actions
  const handleApprove = async (request: ServiceRequest) => {
    setProcessingId(request._id);
    const result = await approveRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadRequests();
    else alert(result.error || 'Tasdiqlashda xato');
  };

  const handleCancel = async (request: ServiceRequest) => {
    if (!window.confirm("So'rovni bekor qilasizmi?")) return;
    setProcessingId(request._id);
    const result = await cancelRequest(hotelSlug, request._id);
    setProcessingId(null);
    if (result.success) loadRequests();
    else alert(result.error || 'Bekor qilishda xato');
  };

  // Derived data
  const counts = useMemo(() => ({
    all: allRequests.length,
    pending: allRequests.filter((r) => r.status === 'pending').length,
    approved: allRequests.filter((r) => r.status === 'approved').length,
    cancelled: allRequests.filter((r) => r.status === 'cancelled').length,
  }), [allRequests]);

  const requests = useMemo(() =>
    filter === 'all' ? allRequests : allRequests.filter((r) => r.status === filter),
    [allRequests, filter]
  );

  // Stats
  const stats = useMemo(() => {
    const pending = allRequests.filter((r) => r.status === 'pending');
    const typeCounts: Record<string, number> = {};
    pending.forEach((r) => {
      typeCounts[r.service_type] = (typeCounts[r.service_type] || 0) + 1;
    });
    const topEntry = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
    const topService = topEntry
      ? { type: topEntry[0], count: topEntry[1], ...getSvc(topEntry[0]) }
      : null;
    return {
      pendingCount: pending.length,
      approvedCount: allRequests.filter((r) => r.status === 'approved').length,
      topService,
    };
  }, [allRequests]);

  // ─── Service-specific details ──────────────────
  const renderDetails = (request: ServiceRequest) => {
    const d: any = request.details || {};
    const svc = getSvc(request.service_type);

    // 🚕 YANDEX TAXI
    if (request.service_type === 'yandex_taxi') {
      const hasRoute = d.pickup_location || d.dropoff_location;
      return (
        <div className="rp-body">
          {hasRoute && (
            <div className="rp-taxi-route">
              {d.pickup_location && (
                <div className="rp-taxi-stop">
                  <div className="rp-taxi-marker">
                    <div className="rp-taxi-dot is-pickup" />
                    {d.dropoff_location && <div className="rp-taxi-line" />}
                  </div>
                  <div className="rp-taxi-info">
                    <div className="rp-taxi-lab">Pickup</div>
                    <div className="rp-taxi-val">{d.pickup_location}</div>
                  </div>
                </div>
              )}
              {d.dropoff_location && (
                <div className="rp-taxi-stop">
                  <div className="rp-taxi-marker">
                    <div className="rp-taxi-dot is-dropoff" />
                  </div>
                  <div className="rp-taxi-info">
                    <div className="rp-taxi-lab">Drop-off</div>
                    <div className="rp-taxi-val">{d.dropoff_location}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {d.scheduled_at && (
            <div className="rp-detail-row">
              <Calendar size={12} strokeWidth={2.4} />
              <span className="rp-detail-lab">When</span>
              <span className="rp-detail-val">
                {new Date(d.scheduled_at).toLocaleString()}
              </span>
            </div>
          )}
          {d.comments && (
            <div className="rp-note">
              <MessageSquare size={12} strokeWidth={2.4} />
              <span>{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // 🧺 LAUNDRY
    if (request.service_type === 'laundry') {
      const items = Array.isArray(d.items) ? d.items : [];
      const totalItems =
        d.total_items || items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount =
        d.total_amount || items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0);

      return (
        <div className="rp-body">
          {/* Summary */}
          <div
            className="rp-laundry-summary"
            style={{
              background: `${svc.color}10`,
              borderColor: `${svc.color}30`,
            }}
          >
            <div className="rp-laundry-left">
              <span className="rp-laundry-emoji">👕</span>
              <div className="rp-laundry-count">
                <strong>{totalItems}</strong>
                <span>kiyim</span>
              </div>
            </div>
            <div className="rp-laundry-total" style={{ color: svc.color }}>
              {formatPrice(totalAmount)}
              <span className="rp-laundry-cur">UZS</span>
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="rp-items">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="rp-item">
                  <div
                    className="rp-item-cat"
                    title={CATEGORY_LABEL[it.category] || ''}
                  >
                    {CATEGORY_EMOJI[it.category] || '👕'}
                  </div>
                  <div className="rp-item-info">
                    <div className="rp-item-name">{it.name}</div>
                    {it.category && (
                      <div className="rp-item-meta">
                        {CATEGORY_LABEL[it.category] || it.category}
                      </div>
                    )}
                  </div>
                  <div
                    className="rp-item-qty-chip"
                    style={{
                      background: `${svc.color}15`,
                      color: svc.color,
                      borderColor: `${svc.color}35`,
                    }}
                  >
                    ×{it.quantity || 1}
                  </div>
                  <div className="rp-item-sub">
                    <span>{formatPrice(it.subtotal || 0)}</span>
                    <span className="rp-item-cur">UZS</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {d.comments && (
            <div className="rp-note">
              <MessageSquare size={12} strokeWidth={2.4} />
              <span>{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // ⏰ WAKE-UP CALL
    if (request.service_type === 'wake_up') {
      const wakeTime = d.scheduled_at || d.wake_up_time || d.time;
      return (
        <div className="rp-body">
          {wakeTime && (
            <div
              className="rp-wake-card"
              style={{
                background: `${svc.color}10`,
                borderColor: `${svc.color}30`,
                color: svc.color,
              }}
            >
              <AlarmClock size={20} strokeWidth={2.2} />
              <div className="rp-wake-text">
                <div className="rp-wake-lab">Scheduled for</div>
                <div className="rp-wake-val">
                  {new Date(wakeTime).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )}
          {d.comments && (
            <div className="rp-note">
              <MessageSquare size={12} strokeWidth={2.4} />
              <span>{d.comments}</span>
            </div>
          )}
        </div>
      );
    }

    // ─── Generic (Spa/Pool/Gym/Concierge) ──────
    const hasAny = d.comments || d.notes || d.description || d.scheduled_at;
    if (!hasAny) return null;

    return (
      <div className="rp-body">
        {d.scheduled_at && (
          <div className="rp-detail-row">
            <Calendar size={12} strokeWidth={2.4} />
            <span className="rp-detail-lab">When</span>
            <span className="rp-detail-val">
              {new Date(d.scheduled_at).toLocaleString()}
            </span>
          </div>
        )}
        {(d.comments || d.notes || d.description) && (
          <div className="rp-note">
            <MessageSquare size={12} strokeWidth={2.4} />
            <span>{d.comments || d.notes || d.description}</span>
          </div>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────
  return (
    <div className="rp-panel">
      

      {/* FILTER PILLS */}
      <div className="rp-filters">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const count = counts[f.key];
          const color = f.color || accentColor;

          return (
            <button
              key={f.key}
              type="button"
              className={`rp-pill ${isActive ? 'active' : ''}`}
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
                  className="rp-pill-count"
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
        <div className="rp-skeletons">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rp-skeleton">
              <div className="rp-skeleton-head" />
              <div className="rp-skeleton-body" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rp-empty">
          <div
            className="rp-empty-ico"
            style={{ background: `${accentColor}10`, color: accentColor }}
          >
            <Inbox size={32} strokeWidth={1.6} />
          </div>
          <div className="rp-empty-title">
            No {filter === 'all' ? '' : filter} requests
          </div>
          <div className="rp-empty-text">
            Guest service requests will appear here
          </div>
        </div>
      ) : (
        <div className="rp-list">
          {requests.map((request) => {
            const svc = getSvc(request.service_type);
            const Icon = svc.icon;
            const isProcessing = processingId === request._id;
            const isPending = request.status === 'pending';
            const urgency = getUrgency(request.createdAt, request.status);

            return (
              <article
                key={request._id}
                className={`rp-card rp-card-${request.status} rp-urg-${urgency}`}
              >
                {/* Head */}
                <header className="rp-card-head">
                  <div className="rp-card-id">
                    <div
                      className="rp-card-ico"
                      style={{ background: `${svc.color}15`, color: svc.color }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="rp-card-id-text">
                      <div className="rp-card-title">{svc.label}</div>
                      <div className="rp-card-meta">
                        <span className="rp-card-room">
                          Room {request.room_number}
                        </span>
                        {request.guest_name && (
                          <>
                            <span className="rp-dot" />
                            <span className="rp-card-guest">{request.guest_name}</span>
                          </>
                        )}
                        <span className="rp-dot" />
                        <span className={`rp-card-time rp-time-${urgency}`}>
                          <Clock size={11} strokeWidth={2.4} />
                          {formatTime(request.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`rp-status rp-status-${request.status}`}>
                    <span className="rp-status-dot" />
                    {request.status}
                  </div>
                </header>

                {/* Service-specific details */}
                {renderDetails(request)}

                {/* Response from staff */}
                {request.response_message && (
                  <div className="rp-response">
                    💬 {request.response_message}
                  </div>
                )}

                {/* Footer / actions */}
                {isPending && (
                  <footer className="rp-card-foot">
                    <span
                      className="rp-foot-badge"
                      style={{
                        background: `${svc.color}10`,
                        color: svc.color,
                      }}
                    >
                      <Icon size={11} strokeWidth={2.4} />
                      {svc.label}
                    </span>

                    <div className="rp-actions">
                      <button
                        type="button"
                        className="rp-btn rp-btn-cancel"
                        onClick={() => handleCancel(request)}
                        disabled={isProcessing}
                      >
                        <X size={14} strokeWidth={2.4} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        className="rp-btn rp-btn-approve"
                        onClick={() => handleApprove(request)}
                        disabled={isProcessing}
                        style={{ background: svc.color }}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="rp-spin" />
                            <span>Processing…</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} strokeWidth={2.6} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </footer>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsPanel;