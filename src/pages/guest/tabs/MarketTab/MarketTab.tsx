// src/pages/guest/tabs/MarketTab/MarketTab.tsx
import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, ArrowRight,
  LayoutGrid, Camera, Car, ShoppingBag, Bus, MoreHorizontal,
  ShieldCheck, Lock, Headphones, Users,
} from 'lucide-react';
import type { GuestHotel } from '@apptypes/guest';
import GuestNavbar from '../../components/GuestNavbar/GuestNavbar';
import './MarketTab.css';

interface MarketTabProps {
  hotel: GuestHotel;
  accentColor: string;
}

const CATEGORIES = [
  { key: 'all',        label: 'All',                 icon: LayoutGrid },
  { key: 'tours',      label: 'Tours & Experiences', icon: Camera },
  { key: 'cars',       label: 'Car Rentals',         icon: Car },
  { key: 'souvenirs',  label: 'Souvenirs',           icon: ShoppingBag },
  { key: 'transport',  label: 'Transport',           icon: Bus },
  { key: 'other',      label: 'Other Services',      icon: MoreHorizontal },
];

const TRUST_FEATURES = [
  { icon: ShieldCheck, title: 'Best Price', sub: 'Guarantee' },
  { icon: Lock,        title: 'Secure',     sub: 'Payments' },
  { icon: Headphones,  title: '24/7',       sub: 'Support' },
  { icon: Users,       title: 'Trusted',    sub: 'Local Partners' },
];

const MarketTab: React.FC<MarketTabProps> = ({ hotel, accentColor }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const handleStayTuned = () => {
    console.log('Subscribe to notifications');
  };

  return (
    <div className="mk-screen">
      {/* ═══════════ HEADER NAVBAR ═══════════ */}
      <div className="mk-header-top">
        <GuestNavbar
          hotel={hotel}
          accentColor={accentColor}
          variant="solid"
          hasNotification={true}
        />
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <div className="mk-hero">
        <div className="mk-hero-text">
          <h1 className="mk-title">Market</h1>
          <p className="mk-subtitle">Everything you need for a perfect stay</p>
        </div>
        <div className="mk-hero-illustration">
          <img src="/MarketLogo.png" alt="Market" />
        </div>
      </div>

      {/* ═══════════ SEARCH ═══════════ */}
      <div className="mk-search-wrap">
        <div className="mk-search">
          <Search size={18} strokeWidth={2.2} className="mk-search-icon" />
          <input
            type="text"
            className="mk-search-input"
            placeholder="Search products, services, experiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="mk-filter-btn" style={{ color: accentColor }}>
            <SlidersHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ═══════════ CATEGORY PILLS ═══════════ */}
      <div className="mk-categories-wrap">
        <div className="mk-categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`mk-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                style={isActive ? {
                  background: `${accentColor}15`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                } : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ COMING SOON CARD ═══════════ */}
      <div
        className="mk-coming-soon"
        style={{
          background: `linear-gradient(180deg, ${accentColor}08 0%, ${accentColor}15 100%)`,
        }}
      >
        <div className="mk-shop-illustration">
          <img src="/MarketSoon.png" alt="Coming Soon" />
        </div>

        <h2 className="mk-cs-title">Market is Coming Soon!</h2>
        <p className="mk-cs-desc">
          We are working hard to bring you the best deals on tours,
          car rentals, souvenirs and much more.
        </p>

        <button
          type="button"
          className="mk-cs-btn"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
          }}
          onClick={handleStayTuned}
        >
          Stay Tuned <ArrowRight size={16} strokeWidth={2.4} />
        </button>
      </div>

      {/* ═══════════ TRUST FEATURES ═══════════ */}
      <div className="mk-trust">
        {TRUST_FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div key={idx} className="mk-trust-item">
              <div className="mk-trust-icon" style={{ color: accentColor }}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="mk-trust-text">
                <div className="mk-trust-title">{feature.title}</div>
                <div className="mk-trust-sub">{feature.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTab;