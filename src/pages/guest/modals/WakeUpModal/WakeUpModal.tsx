// src/pages/guest/modals/WakeUpModal/WakeUpModal.tsx
import React, { useState } from 'react';
import {
  X, AlarmClock, Plus, Trash2, Clock, Repeat, Check, AlertTriangle,
  Calendar, Volume2,
} from 'lucide-react';
import { useWakeUpAlarm, type WakeUpAlarm } from '../../hooks/useWakeUpAlarm';
import './WakeUpModal.css';

interface WakeUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

const todayDate = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tomorrowDate = (): string => {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const WakeUpModal: React.FC<WakeUpModalProps> = ({
  isOpen,
  onClose,
  accentColor,
}) => {
  const {
    alarms,
    permission,
    isNative,
    requestPermission,
    scheduleAlarm,
    cancelAlarm,
    testAlarm,                  // ⭐ YANGI
  } = useWakeUpAlarm();

  const [showAddForm, setShowAddForm] = useState(false);
  const [time, setTime] = useState('07:00');
  const [date, setDate] = useState(todayDate());
  const [dateMode, setDateMode] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [label, setLabel] = useState('');
  const [repeat, setRepeat] = useState<'once' | 'daily'>('once');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);                  // ⭐ YANGI

  if (!isOpen) return null;

  const handleDateMode = (mode: 'today' | 'tomorrow' | 'custom') => {
    setDateMode(mode);
    if (mode === 'today') setDate(todayDate());
    if (mode === 'tomorrow') setDate(tomorrowDate());
  };

  const handleAdd = async () => {
    if (!time || !date) return;

    setErrorMsg(null);
    setSubmitting(true);
    const result = await scheduleAlarm(time, date, label.trim() || undefined, repeat);
    setSubmitting(false);

    if (result.success) {
      setShowAddForm(false);
      setLabel('');
      setTime('07:00');
      setDate(todayDate());
      setDateMode('today');
      setRepeat('once');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } else {
      setErrorMsg(result.error || 'Xatolik yuz berdi');
    }
  };

 

  const formatAlarmDate = (alarm: WakeUpAlarm): string => {
    if (alarm.repeat === 'daily') return '🔁 Har kuni';

    const today = todayDate();
    const tomorrow = tomorrowDate();

    if (alarm.date === today) return '📅 Bugun';
    if (alarm.date === tomorrow) return '📅 Ertaga';

    try {
      const d = new Date(alarm.date);
      return `📅 ${d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}`;
    } catch {
      return `📅 ${alarm.date}`;
    }
  };

  const getCountdown = (alarm: WakeUpAlarm): string => {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const [year, month, day] = alarm.date.split('-').map(Number);
    const target = new Date(year, month - 1, day, hours, minutes, 0).getTime();
    const diff = target - Date.now();

    if (diff <= 0) return alarm.repeat === 'daily' ? 'Ertaga ushbu vaqtda' : 'O\'tib bo\'ldi';

    const totalMin = Math.floor(diff / 60000);
    const days = Math.floor(totalMin / 1440);
    const hh = Math.floor((totalMin % 1440) / 60);
    const mm = totalMin % 60;

    if (days > 0) return `${days} kun ${hh} soatdan keyin`;
    if (hh > 0) return `${hh} soat ${mm} daq.`;
    return `${mm} daqiqa keyin`;
  };

  return (
    <div className="wkm-backdrop" onClick={onClose}>
      <div className="wkm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wkm-drag-handle" />

        <div className="wkm-header">
          <div className="wkm-title-wrap">
            <div
              className="wkm-icon-circle"
              style={{ background: `${accentColor}1a`, color: accentColor }}
            >
              <AlarmClock size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="wkm-title">Wake-up Call</h2>
              <p className="wkm-subtitle">
                {alarms.length === 0
                  ? 'Budilnik yo\'q'
                  : `${alarms.length} ta budilnik`}
              </p>
            </div>
          </div>

          <button type="button" className="wkm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {success && (
          <div className="wkm-toast" style={{ background: accentColor }}>
            <Check size={16} strokeWidth={2.6} />
            <span>Budilnik o'rnatildi!</span>
          </div>
        )}

        {permission === 'denied' && (
          <div className="wkm-warning">
            <AlertTriangle size={18} className="wkm-warning-icon" />
            <div className="wkm-warning-text">
              <strong>Ruxsat berilmagan</strong>
              <p>Sozlamalardan ushbu ilova uchun bildirishnoma ruxsatini yoqing.</p>
              <button
                type="button"
                className="wkm-warning-btn"
                onClick={requestPermission}
                style={{ color: accentColor, borderColor: accentColor }}
              >
                Qayta so'rash
              </button>
            </div>
          </div>
        )}

        

        <div className="wkm-body">
          {alarms.length === 0 && !showAddForm ? (
            <div className="wkm-empty">
              <div
                className="wkm-empty-icon"
                style={{ background: `${accentColor}10`, color: accentColor }}
              >
                <AlarmClock size={42} strokeWidth={1.4} />
              </div>
              <h3>Budilnik o'rnatilmagan</h3>
              <p>Yangi budilnik qo'shish uchun pastdagi tugmani bosing</p>
            </div>
          ) : (
            <div className="wkm-list">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="wkm-alarm-card">
                  <div className="wkm-alarm-time" style={{ color: accentColor }}>
                    {alarm.time}
                  </div>
                  <div className="wkm-alarm-info">
                    {alarm.label && (
                      <div className="wkm-alarm-label">{alarm.label}</div>
                    )}
                    <div className="wkm-alarm-meta">{formatAlarmDate(alarm)}</div>
                    <div className="wkm-alarm-countdown">{getCountdown(alarm)}</div>
                  </div>
                  <button
                    type="button"
                    className="wkm-alarm-delete"
                    onClick={() => cancelAlarm(alarm.id)}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddForm ? (
          <div className="wkm-form">
            <div className="wkm-field">
              <label className="wkm-label">
                <Clock size={13} strokeWidth={2.4} /> Uyg'onish vaqti
              </label>
              <input
                type="time"
                className="wkm-time-input"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setErrorMsg(null);
                }}
                style={{ borderColor: `${accentColor}30` }}
              />
            </div>

            <div className="wkm-field">
              <label className="wkm-label">
                <Calendar size={13} strokeWidth={2.4} /> Sana
              </label>
              <div className="wkm-date-chips">
                <button
                  type="button"
                  className={`wkm-chip ${dateMode === 'today' ? 'is-active' : ''}`}
                  onClick={() => handleDateMode('today')}
                  style={
                    dateMode === 'today'
                      ? { background: accentColor, color: 'white', borderColor: accentColor }
                      : undefined
                  }
                >
                  Bugun
                </button>
                <button
                  type="button"
                  className={`wkm-chip ${dateMode === 'tomorrow' ? 'is-active' : ''}`}
                  onClick={() => handleDateMode('tomorrow')}
                  style={
                    dateMode === 'tomorrow'
                      ? { background: accentColor, color: 'white', borderColor: accentColor }
                      : undefined
                  }
                >
                  Ertaga
                </button>
                <button
                  type="button"
                  className={`wkm-chip ${dateMode === 'custom' ? 'is-active' : ''}`}
                  onClick={() => handleDateMode('custom')}
                  style={
                    dateMode === 'custom'
                      ? { background: accentColor, color: 'white', borderColor: accentColor }
                      : undefined
                  }
                >
                  Boshqa
                </button>
              </div>

              {dateMode === 'custom' && (
                <input
                  type="date"
                  className="wkm-date-input"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrorMsg(null);
                  }}
                  min={todayDate()}
                />
              )}
            </div>

            <div className="wkm-field">
              <label className="wkm-label">Eslatma (ixtiyoriy)</label>
              <input
                type="text"
                className="wkm-text-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Masalan: Aeroportga..."
                maxLength={50}
              />
            </div>

            <div className="wkm-field">
              <label className="wkm-label">
                <Repeat size={13} strokeWidth={2.4} /> Takrorlash
              </label>
              <div className="wkm-repeat-group">
                <button
                  type="button"
                  className={`wkm-repeat-btn ${repeat === 'once' ? 'is-active' : ''}`}
                  onClick={() => setRepeat('once')}
                  style={
                    repeat === 'once'
                      ? { background: accentColor, color: 'white', borderColor: accentColor }
                      : undefined
                  }
                >
                  Bir marta
                </button>
                <button
                  type="button"
                  className={`wkm-repeat-btn ${repeat === 'daily' ? 'is-active' : ''}`}
                  onClick={() => setRepeat('daily')}
                  style={
                    repeat === 'daily'
                      ? { background: accentColor, color: 'white', borderColor: accentColor }
                      : undefined
                  }
                >
                  Har kuni
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="wkm-form-error">
                <AlertTriangle size={14} strokeWidth={2.4} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="wkm-form-actions">
              <button
                type="button"
                className="wkm-cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setLabel('');
                  setTime('07:00');
                  setDate(todayDate());
                  setDateMode('today');
                  setRepeat('once');
                  setErrorMsg(null);
                }}
              >
                Bekor
              </button>
              <button
                type="button"
                className="wkm-submit-btn"
                onClick={handleAdd}
                disabled={submitting || !time || !date}
                style={{ background: accentColor }}
              >
                {submitting ? 'Qo\'shilyapti...' : 'Saqlash'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="wkm-add-btn"
            onClick={() => setShowAddForm(true)}
            style={{ background: accentColor }}
          >
            <Plus size={18} strokeWidth={2.6} />
            <span>Yangi budilnik</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WakeUpModal;