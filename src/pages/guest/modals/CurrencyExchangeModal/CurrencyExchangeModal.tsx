// src/pages/guest/modals/CurrencyExchangeModal/CurrencyExchangeModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, RefreshCw, Loader2, AlertCircle, BadgeDollarSign,
} from 'lucide-react';
import './CurrencyExchangeModal.css';

interface CurrencyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

interface Rate {
  code: string;
  name: string;
  flag: string;
  rate: number;     // 1 X = ? UZS
  popular: boolean;
}

// ⭐ Valyuta nomlari va bayroqlari (uzbek)
const CURRENCY_INFO: Record<string, { name: string; flag: string; popular?: boolean }> = {
  USD: { name: 'AQSH dollar',         flag: '🇺🇸', popular: true },
  EUR: { name: 'Yevro',                flag: '🇪🇺', popular: true },
  RUB: { name: 'Rossiya rubl',        flag: '🇷🇺', popular: true },
  GBP: { name: 'Britaniya funt',      flag: '🇬🇧', popular: true },
  KZT: { name: "Qozog'iston tenge",    flag: '🇰🇿', popular: true },
  KGS: { name: "Qirg'iziston som",    flag: '🇰🇬', popular: true },
  TRY: { name: 'Turk liras',          flag: '🇹🇷', popular: true },
  CNY: { name: 'Xitoy yuan',          flag: '🇨🇳', popular: true },
  JPY: { name: 'Yapon iyenas',        flag: '🇯🇵' },
  KRW: { name: 'Koreya von',          flag: '🇰🇷' },
  AED: { name: 'BAA dirham',          flag: '🇦🇪' },
  SAR: { name: 'Saudiya riyal',       flag: '🇸🇦' },
  INR: { name: 'Hindiston rupiyas',   flag: '🇮🇳' },
  CHF: { name: 'Shveytsariya frank',  flag: '🇨🇭' },
  CAD: { name: 'Kanada dollar',       flag: '🇨🇦' },
  AUD: { name: 'Avstraliya dollar',   flag: '🇦🇺' },
  AZN: { name: 'Ozarbayjon manat',    flag: '🇦🇿' },
  PLN: { name: 'Polsha zlotis',       flag: '🇵🇱' },
  THB: { name: 'Tailand bat',         flag: '🇹🇭' },
  ILS: { name: 'Isroil shekel',       flag: '🇮🇱' },
  SGD: { name: 'Singapur dollar',     flag: '🇸🇬' },
  HKD: { name: 'Gonkong dollar',      flag: '🇭🇰' },
  NOK: { name: 'Norvegiya kronas',    flag: '🇳🇴' },
  SEK: { name: 'Shvetsiya kronas',    flag: '🇸🇪' },
  DKK: { name: 'Daniya kronas',       flag: '🇩🇰' },
};

const CurrencyExchangeModal: React.FC<CurrencyExchangeModalProps> = ({
  isOpen,
  onClose,
  accentColor,
}) => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Calculator
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');

  // ─── FETCH RATES ───────────────────────
  const fetchRates = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Asosiy: exchangerate-api.com (UZS base)
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/UZS');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const allRates = data.rates as Record<string, number>;

      const parsed: Rate[] = Object.entries(allRates)
        .filter(([code]) => code !== 'UZS' && CURRENCY_INFO[code])
        .map(([code, rateUzsToCode]) => {
          const info = CURRENCY_INFO[code];
          return {
            code,
            name: info.name,
            flag: info.flag,
            rate: 1 / rateUzsToCode,    // 1 X = ? UZS
            popular: !!info.popular,
          };
        })
        .sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return a.code.localeCompare(b.code);
        });

      setRates(parsed);
      setDate(data.date || new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      console.error('[CurrencyExchange] fetch error:', err);

      // Fallback: fawazahmed0 GitHub CDN
      try {
        const res = await fetch(
          'https://cdn.jsdelivr.net/gh/fawazahmed0/exchange-api@latest/v1/currencies/uzs.json'
        );
        const data = await res.json();
        const uzsRates = data.uzs as Record<string, number>;

        const parsed: Rate[] = Object.entries(uzsRates)
          .filter(([code]) => CURRENCY_INFO[code.toUpperCase()])
          .map(([code, val]) => {
            const upper = code.toUpperCase();
            const info = CURRENCY_INFO[upper];
            return {
              code: upper,
              name: info.name,
              flag: info.flag,
              rate: 1 / val,
              popular: !!info.popular,
            };
          })
          .sort((a, b) => {
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return a.code.localeCompare(b.code);
          });

        setRates(parsed);
        setDate(data.date);
      } catch (err2: any) {
        setError("Kurslarni yuklab bo'lmadi. Internet aloqasini tekshiring.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && rates.length === 0) {
      fetchRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── FILTER ────────────────────────────
  const filteredRates = useMemo(() => {
    if (!search.trim()) return rates;
    const q = search.toLowerCase();
    return rates.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
    );
  }, [rates, search]);

  // ─── CALCULATOR ────────────────────────
  const selectedRate = rates.find((r) => r.code === fromCurrency);
  const calculatedUzs = selectedRate
    ? parseFloat(amount || '0') * selectedRate.rate
    : 0;

  // ─── HELPERS ───────────────────────────
  const formatPrice = (n: number) => {
    if (n < 1) return n.toFixed(4);
    if (n < 100) return n.toFixed(2);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
      .format(n)
      .replace(/,/g, ' ');
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (!isOpen) return null;

  const popularRates = filteredRates.filter((r) => r.popular);
  const otherRates = filteredRates.filter((r) => !r.popular);

  return (
    <div className="cem-backdrop" onClick={onClose}>
      <div className="cem-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="cem-drag-handle" />

        <div className="cem-header">
          <div className="cem-title-wrap">
            <div
              className="cem-icon-circle"
              style={{ background: `${accentColor}1a`, color: accentColor }}
            >
              <BadgeDollarSign size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="cem-title">Valyuta kursi</h2>
              {date && <p className="cem-subtitle">{formatDate(date)}</p>}
            </div>
          </div>

          <div className="cem-actions">
            <button
              type="button"
              className="cem-icon-btn"
              onClick={() => fetchRates(true)}
              disabled={refreshing || loading}
              aria-label="Refresh"
              title="Yangilash"
            >
              <RefreshCw
                size={17}
                className={refreshing ? 'cem-spin' : ''}
              />
            </button>
            <button
              type="button"
              className="cem-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* CALCULATOR */}
        {!loading && !error && rates.length > 0 && (
          <div
            className="cem-calculator"
            style={{ borderColor: `${accentColor}30` }}
          >
            <div className="cem-calc-label">Hisoblash</div>
            <div className="cem-calc-row">
              <input
                type="number"
                className="cem-calc-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
              />
              <select
                className="cem-calc-select"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
              >
                {rates.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.flag} {r.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="cem-calc-arrow">↓</div>
            <div
              className="cem-calc-result"
              style={{ color: accentColor }}
            >
              {formatPrice(calculatedUzs)}
              <span className="cem-calc-uzs">UZS</span>
            </div>
          </div>
        )}

        {/* SEARCH */}
        {!loading && !error && rates.length > 0 && (
          <div className="cem-search-wrap">
            <Search size={16} className="cem-search-icon" strokeWidth={2.2} />
            <input
              type="text"
              className="cem-search-input"
              placeholder="Valyuta qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* CONTENT */}
        <div className="cem-body">
          {loading ? (
            <div className="cem-state">
              <Loader2 size={32} className="cem-spin" />
              <p>Kurslar yuklanmoqda...</p>
            </div>
          ) : error ? (
            <div className="cem-state cem-state-error">
              <AlertCircle size={36} strokeWidth={1.5} />
              <p>{error}</p>
              <button
                type="button"
                onClick={() => fetchRates()}
                className="cem-retry-btn"
                style={{ background: accentColor }}
              >
                Qayta urinish
              </button>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="cem-state">
              <Search size={32} strokeWidth={1.5} />
              <p>Topilmadi</p>
              <small>Boshqa valyutani qidiring</small>
            </div>
          ) : (
            <div className="cem-rates">
              {/* POPULAR */}
              {!search && popularRates.length > 0 && (
                <>
                  <div className="cem-section-label">POPULAR</div>
                  {popularRates.map((rate) => (
                    <CurrencyRow
                      key={rate.code}
                      rate={rate}
                      accentColor={accentColor}
                    />
                  ))}
                </>
              )}

              {/* OTHER */}
              {!search && otherRates.length > 0 && (
                <>
                  <div className="cem-section-label">BOSHQA VALYUTALAR</div>
                  {otherRates.map((rate) => (
                    <CurrencyRow
                      key={rate.code}
                      rate={rate}
                      accentColor={accentColor}
                    />
                  ))}
                </>
              )}

              {/* SEARCH RESULTS (flat) */}
              {search &&
                filteredRates.map((rate) => (
                  <CurrencyRow
                    key={rate.code}
                    rate={rate}
                    accentColor={accentColor}
                  />
                ))}
            </div>
          )}
        </div>

       
      </div>
    </div>
  );
};

// ─── ROW Component ─────────────────────
const CurrencyRow: React.FC<{ rate: Rate; accentColor: string }> = ({
  rate,
  accentColor,
}) => {
  const formatPrice = (n: number) => {
    if (n < 1) return n.toFixed(4);
    if (n < 100) return n.toFixed(2);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
      .format(n)
      .replace(/,/g, ' ');
  };

  return (
    <div className="cem-row">
      <div className="cem-flag">{rate.flag}</div>
      <div className="cem-info">
        <div className="cem-code">{rate.code}</div>
        <div className="cem-name">{rate.name}</div>
      </div>
      <div className="cem-rate-block">
        <div className="cem-rate-val" style={{ color: accentColor }}>
          {formatPrice(rate.rate)}
        </div>
        <div className="cem-rate-unit">UZS</div>
      </div>
    </div>
  );
};

export default CurrencyExchangeModal;