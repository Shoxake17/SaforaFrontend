// src/pages/qrrooms/panels/CallsPanel.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Clock,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';
import {
  getCallHistory,
  type CallHistoryItem,
  type CallHistoryFilter,
} from '@services/calls';
import { formatCallDuration } from '@utils/callTimer';
import './CallsPanel.css';

// ═══════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const REFRESH_INTERVAL_MS = 30_000; 

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
}

/** To'liq vaqt formatida */
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

const CallsPanel: React.FC<Props> = ({ accentColor }) => {
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<CallHistoryFilter>('all');
  const [error, setError] = useState<string>('');

  // ═════ Statistika (jadval ustida) ═════
  const stats = useMemo(() => {
    const total = calls.length;
    const ended = calls.filter(c => c.status === 'ended').length;
    const missed = calls.filter(c => c.status === 'missed').length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

    return { total, ended, missed, totalDuration };
  }, [calls]);

  // ═════ Load calls ═════
  const loadCalls = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError('');

    try {
      const result = await getCallHistory(filter, 100);

      if (result.success) {
        setCalls(result.calls);
      } else {
        setError('Failed to load call history');
      }
    } catch (err) {
      console.warn('[CallsPanel] Load error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter o'zgarganda qayta yuklash
  useEffect(() => {
    setLoading(true);
    loadCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Avtomatik refresh (30 sek)
  useEffect(() => {
    const interval = setInterval(() => loadCalls(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // ═════ Loading state ═════
  if (loading) {
    return (
      <div className="cph-loading">
        <Loader2 size={32} className="cph-spin" style={{ color: accentColor }} />
        <p>Loading call history...</p>
      </div>
    );
  }

  // ═════ Empty state ═════
  if (calls.length === 0 && !error) {
    return (
      <div className="cph-container">
        <FilterTabs filter={filter} setFilter={setFilter} accentColor={accentColor} />
        <EmptyPanelState
          icon={Phone}
          title="No calls yet"
          message="Call history from guest room phones will appear here"
        />
      </div>
    );
  }

  // ═════ Main UI ═════
  return (
    <div className="cph-container">
      {/* Stats bar */}
      <div className="cph-stats-bar">
        <div className="cph-stat">
          <span className="cph-stat-value">{stats.total}</span>
          <span className="cph-stat-label">Total</span>
        </div>
        <div className="cph-stat cph-stat-success">
          <span className="cph-stat-value">{stats.ended}</span>
          <span className="cph-stat-label">Answered</span>
        </div>
        <div className="cph-stat cph-stat-danger">
          <span className="cph-stat-value">{stats.missed}</span>
          <span className="cph-stat-label">Missed</span>
        </div>
        

        <button
          type="button"
          className="cph-refresh-btn"
          onClick={() => loadCalls(true)}
          disabled={refreshing}
          title="Refresh"
          style={{ color: accentColor }}
        >
          <RefreshCw size={16} className={refreshing ? 'cph-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <FilterTabs filter={filter} setFilter={setFilter} accentColor={accentColor} />

      {error && (
        <div className="cph-error-banner">
          ⚠ {error}
        </div>
      )}

      {/* Calls list */}
      <div className="cph-list">
        {calls.map(call => (
          <CallRow key={call.id} call={call} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENT: Filter Tabs
// ═══════════════════════════════════════════════════════

interface FilterTabsProps {
  filter: CallHistoryFilter;
  setFilter: (f: CallHistoryFilter) => void;
  accentColor: string;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  filter,
  setFilter,
  accentColor,
}) => {
  const tabs: { key: CallHistoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ended', label: 'Answered' },
    { key: 'missed', label: 'Missed' },
  ];

  return (
    <div className="cph-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          className={`cph-tab ${filter === tab.key ? 'cph-tab-active' : ''}`}
          onClick={() => setFilter(tab.key)}
          style={
            filter === tab.key
              ? {
                  background: `${accentColor}15`,
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                }
              : {}
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENT: Call Row
// ═══════════════════════════════════════════════════════

interface CallRowProps {
  call: CallHistoryItem;
  accentColor: string;
}

const CallRow: React.FC<CallRowProps> = ({ call, accentColor }) => {
  const isMissed = call.status === 'missed';
  const isEnded = call.status === 'ended';

  // Status icon va rang
  const StatusIcon = isMissed ? PhoneMissed : isEnded ? PhoneIncoming : PhoneOff;
  const statusColor = isMissed ? '#ef4444' : isEnded ? '#10b981' : '#94a3b8';
  const statusLabel = isMissed ? 'Missed' : isEnded ? 'Answered' : call.status;

  return (
    <div className="cph-row">
      {/* Status icon */}
      <div
        className="cph-row-icon"
        style={{ background: `${statusColor}15`, color: statusColor }}
      >
        <StatusIcon size={20} strokeWidth={2.2} />
      </div>

      {/* Main content */}
      <div className="cph-row-main">
        <div className="cph-row-title">
          Room {call.roomNumber} — {call.guestName || 'Guest'}
        </div>

        <div className="cph-row-meta">
          {/* Status */}
          <span style={{ color: statusColor, fontWeight: 600 }}>
            {statusLabel}
          </span>

          {/* Answered by */}
          {call.answeredByName && (
            <>
              <span className="cph-row-sep">•</span>
              <span className="cph-row-meta-item">
                <User size={12} strokeWidth={2.2} />
                {call.answeredByName}
              </span>
            </>
          )}

          {/* Duration */}
          {call.duration > 0 && (
            <>
              <span className="cph-row-sep">•</span>
              <span className="cph-row-meta-item">
                <Clock size={12} strokeWidth={2.2} />
                {formatCallDuration(call.duration)}
              </span>
            </>
          )}

          {/* Time */}
          <span className="cph-row-sep">•</span>
          <span
            className="cph-row-time"
            title={formatFullDate(call.createdAt)}
          >
            {formatRelativeTime(call.createdAt)}
          </span>
        </div>
      </div>

      {/* Right badge */}
      <div
        className="cph-row-badge"
        style={{
          background: `${statusColor}15`,
          color: statusColor,
          borderColor: `${statusColor}40`,
        }}
      >
        {statusLabel}
      </div>
    </div>
  );
};

export default CallsPanel;