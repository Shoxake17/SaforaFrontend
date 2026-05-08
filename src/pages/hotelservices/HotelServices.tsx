// src/pages/services/HotelServices.tsx
import React, { useEffect, useState } from 'react';
import {
  ConciergeBell, Search, Save, Loader2,
  Settings as SettingsIcon, Shirt, Utensils,   // ⭐ Utensils
} from 'lucide-react';
import useAuthGuard from '@hooks/useAuthGuard';
import PortalLayout from '@components/PortalLayout/PortalLayout';
import Alert from '@components/Alert';
import {
  fetchSettings, updateSettings, DEFAULT_SETTINGS,
  DEFAULT_GYM, DEFAULT_SPA, DEFAULT_POOL, DEFAULT_LAUNDRY,
  DEFAULT_YANDEX_TAXI, DEFAULT_RESTAURANT,                 // ⭐ Restaurant default
  type HotelSettings, type ServiceDetail,
  type RestaurantDetail,                                   // ⭐ Restaurant type
} from '@services/settings';
import { HOTEL_SERVICES, type HotelServiceDef } from '@constants/hotelServices';
import WifiManageModal from '@components/WifiManageModal/WifiManageModal';
import ServiceManageModal from '@components/ServiceManageModal/ServiceManageModal';
import LaundryItemsModal, { type LaundryItem } from '@components/LaundryItemsModal/LaundryItemsModal';
import RestaurantMenuModal from '@components/RestaurantMenuModal/RestaurantMenuModal';   // ⭐
import './HotelServices.css';

const SERVICE_CONFIGS: Record<string, { defaultOpen: string; defaultClose: string }> = {
  gym:         { defaultOpen: '06:00', defaultClose: '23:00' },
  spa:         { defaultOpen: '09:00', defaultClose: '21:00' },
  pool:        { defaultOpen: '08:00', defaultClose: '22:00' },
  laundry:     { defaultOpen: '09:00', defaultClose: '20:00' },
  yandex_taxi: { defaultOpen: '00:00', defaultClose: '23:59' },
  restaurant:  { defaultOpen: '08:00', defaultClose: '23:00' },   // ⭐
};

const HotelServices: React.FC = () => {
  const { slug, isAuthenticated } = useAuthGuard();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [settings, setSettings] = useState<HotelSettings>(DEFAULT_SETTINGS);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());

  const [showWifiModal, setShowWifiModal] = useState(false);
  const [wifiList, setWifiList] = useState<Array<{ network_name: string; password: string; description?: string }>>([]);

  const [activeServiceModal, setActiveServiceModal] = useState<HotelServiceDef | null>(null);

  // ⭐ serviceData any-typed (chunki LaundryDetail/RestaurantDetail extends ServiceDetail)
  const [serviceData, setServiceData] = useState<Record<string, any>>({
    gym:         DEFAULT_GYM,
    spa:         DEFAULT_SPA,
    pool:        DEFAULT_POOL,
    laundry:     DEFAULT_LAUNDRY,
    yandex_taxi: DEFAULT_YANDEX_TAXI,
    restaurant:  DEFAULT_RESTAURANT,                              // ⭐
  });

  // ⭐ LAUNDRY ITEMS — alohida state
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
  const [showLaundryItemsModal, setShowLaundryItemsModal] = useState(false);

  // ⭐⭐⭐ RESTAURANT MENU MODAL state
  const [showRestaurantMenuModal, setShowRestaurantMenuModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchSettings(slug);
      if (data) {
        setSettings(data);
        setActiveServices(new Set(data.active_services || []));
        setWifiList(Array.isArray(data.wifi) ? data.wifi : []);
        setServiceData({
          gym:         data.gym         || DEFAULT_GYM,
          spa:         data.spa         || DEFAULT_SPA,
          pool:        data.pool        || DEFAULT_POOL,
          laundry:     data.laundry     || DEFAULT_LAUNDRY,
          yandex_taxi: data.yandex_taxi || DEFAULT_YANDEX_TAXI,
          restaurant:  data.restaurant  || DEFAULT_RESTAURANT,    // ⭐
        });
        // Laundry items'ni alohida state'ga
        setLaundryItems((data.laundry as any)?.items || []);
      }
      setLoading(false);
    };
    load();
  }, [isAuthenticated, slug]);

  const toggleService = (key: string) => {
    setActiveServices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleServiceCardClick = (service: HotelServiceDef) => {
    if (service.key === 'wifi') {
      setShowWifiModal(true);
      return;
    }
    if (service.hasDetails) {
      setActiveServiceModal(service);
      return;
    }
    toggleService(service.key);
  };

  const handleWifiSave = (newList: typeof wifiList) => setWifiList(newList);

  const handleServiceDetailSave = (detail: ServiceDetail) => {
    if (!activeServiceModal) return;
    setServiceData({
      ...serviceData,
      [activeServiceModal.key]: detail,
    });
  };

  // ⭐ LAUNDRY ITEMS — saqlash (darhol backend'ga)
  const handleLaundryItemsSave = async (items: LaundryItem[]) => {
    if (!slug) return;

    const updatedLaundry = {
      ...(serviceData.laundry || DEFAULT_LAUNDRY),
      items,
    };

    const result = await updateSettings(slug, {
      laundry: updatedLaundry as any,
    });

    if (result.success) {
      setLaundryItems(items);
      setServiceData((prev) => ({ ...prev, laundry: updatedLaundry as any }));
      setSettings((prev) => ({ ...prev, laundry: updatedLaundry as any }));
      flashSuccess(`${items.length} ta kiyim saqlandi`);
    } else {
      setError(result.error || 'Saqlashda xato');
      throw new Error(result.error || 'Save failed');
    }
  };

  // ⭐⭐⭐ RESTAURANT MENU — saqlash (darhol backend'ga)
  const handleRestaurantMenuSave = async (
    updatedRestaurant: RestaurantDetail
  ): Promise<void> => {
    if (!slug) return;

    const result = await updateSettings(slug, {
      restaurant: updatedRestaurant as any,
    });

    if (result.success) {
      setServiceData((prev) => ({
        ...prev,
        restaurant: updatedRestaurant,
      }));
      setSettings((prev) => ({
        ...prev,
        restaurant: updatedRestaurant,
      }));

      const catCount = updatedRestaurant.categories.length;
      const itemCount = updatedRestaurant.items.length;
      flashSuccess(
        `Menyu saqlandi: ${catCount} kategoriya, ${itemCount} taom`
      );
    } else {
      setError(result.error || 'Saqlashda xato');
      throw new Error(result.error || 'Save failed');
    }
  };

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    setError(null);

    const result = await updateSettings(slug, {
      active_services: Array.from(activeServices),
      wifi: wifiList,
      gym:         serviceData.gym,
      spa:         serviceData.spa,
      pool:        serviceData.pool,
      laundry:     { ...serviceData.laundry, items: laundryItems } as any,
      yandex_taxi: serviceData.yandex_taxi,
      restaurant:  serviceData.restaurant as any,                 // ⭐
    });

    setSaving(false);
    if (result.success) {
      flashSuccess(`${activeServices.size} ta xizmat saqlandi`);
      setSettings({
        ...settings,
        active_services: Array.from(activeServices),
        wifi: wifiList,
        gym:         serviceData.gym,
        spa:         serviceData.spa,
        pool:        serviceData.pool,
        laundry:     { ...serviceData.laundry, items: laundryItems } as any,
        yandex_taxi: serviceData.yandex_taxi,
        restaurant:  serviceData.restaurant,                      // ⭐
      });
    } else {
      setError(result.error || 'Saqlashda xato');
    }
  };

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const filteredServices = HOTEL_SERVICES.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.sub.toLowerCase().includes(search.toLowerCase())
  );

  const totalEnabled = activeServices.size;

  const servicesChanged = JSON.stringify([...activeServices].sort()) !==
                          JSON.stringify([...(settings.active_services || [])].sort());
  const wifiChanged = JSON.stringify(wifiList) !==
                      JSON.stringify(Array.isArray(settings.wifi) ? settings.wifi : []);
  const detailsChanged =
    JSON.stringify(serviceData.gym)         !== JSON.stringify(settings.gym         || DEFAULT_GYM)         ||
    JSON.stringify(serviceData.spa)         !== JSON.stringify(settings.spa         || DEFAULT_SPA)         ||
    JSON.stringify(serviceData.pool)        !== JSON.stringify(settings.pool        || DEFAULT_POOL)        ||
    JSON.stringify(serviceData.laundry)     !== JSON.stringify(settings.laundry     || DEFAULT_LAUNDRY)     ||
    JSON.stringify(serviceData.yandex_taxi) !== JSON.stringify(settings.yandex_taxi || DEFAULT_YANDEX_TAXI) ||
    JSON.stringify(serviceData.restaurant)  !== JSON.stringify(settings.restaurant  || DEFAULT_RESTAURANT);  // ⭐

  const hasChanges = servicesChanged || wifiChanged || detailsChanged;

  const getManageText = (service: HotelServiceDef): string => {
    if (service.key === 'wifi') {
      return wifiList.length > 0 ? `${wifiList.length} network${wifiList.length > 1 ? 's' : ''}` : 'Manage';
    }
    if (service.hasDetails) {
      const detail = serviceData[service.key];
      const count = detail?.images?.length || 0;
      const hasContent = !!(count || detail?.description || detail?.location);
      return count > 0 ? `${count} photo${count > 1 ? 's' : ''}` : (hasContent ? 'Edit' : 'Manage');
    }
    return 'Manage';
  };

  return (
    <PortalLayout activeNav="services" pageLoading={loading} contentClassName="hs-content">
      <div className="hs-header">
        <div>
          <h1 className="hs-title">
            <ConciergeBell size={22} strokeWidth={2.2} className="hs-title-icon" />
            Hotel Services
          </h1>
          <p className="hs-subtitle">
            Toggle services ON/OFF to control what guests see in their app
          </p>
        </div>

        <div className="hs-header-actions">
          <button
            type="button"
            className={`hs-save-btn ${hasChanges ? 'is-dirty' : ''}`}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <><Loader2 size={14} className="hs-spin" /> Saving...</>
            ) : (
              <><Save size={14} strokeWidth={2.4} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} />}

      <div className="hs-toolbar">
        <div className="hs-stats">
          <div className="hs-stat">
            <span className="hs-stat-num">{totalEnabled}</span>
            <span className="hs-stat-lbl">Active</span>
          </div>
          <div className="hs-stat-divider" />
          <div className="hs-stat">
            <span className="hs-stat-num">{HOTEL_SERVICES.length - totalEnabled}</span>
            <span className="hs-stat-lbl">Disabled</span>
          </div>
          <div className="hs-stat-divider" />
          <div className="hs-stat">
            <span className="hs-stat-num">{HOTEL_SERVICES.length}</span>
            <span className="hs-stat-lbl">Total</span>
          </div>
        </div>

        <div className="hs-search-wrap">
          <Search size={16} strokeWidth={2.2} className="hs-search-icon" />
          <input
            type="text"
            className="hs-search"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="hs-grid">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          const isActive = activeServices.has(service.key);
          const isWifi = service.key === 'wifi';
          const isLaundry = service.key === 'laundry';
          const isRestaurant = service.key === 'restaurant';        // ⭐
          const hasManage = isWifi || service.hasDetails;

          return (
            <div
              key={service.key}
              className={`hs-card ${isActive ? 'is-active' : ''} ${hasManage ? 'has-manage' : ''}`}
              onClick={() => handleServiceCardClick(service)}
            >
              <div className="hs-card-head">
                <div
                  className="hs-card-icon"
                  style={{
                    background: `${service.color}20`,
                    color: service.color,
                  }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>

                <button
                  type="button"
                  className={`hs-toggle ${isActive ? 'is-on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleService(service.key);
                  }}
                  aria-label={isActive ? 'Disable' : 'Enable'}
                  style={isActive ? { background: service.color } : undefined}
                >
                  <span className="hs-toggle-thumb" />
                </button>
              </div>

              <div className="hs-card-body">
                <div className="hs-card-title">{service.title}</div>
                <div className="hs-card-sub">{service.sub}</div>
              </div>

              <div className="hs-card-footer">
                <div className={`hs-card-status ${isActive ? 'is-active' : ''}`}>
                  {isActive ? '● Active' : '○ Disabled'}
                </div>

                {hasManage && (
                  <div className="hs-card-manage" style={{ color: service.color }}>
                    <SettingsIcon size={11} strokeWidth={2.4} />
                    {getManageText(service)}
                  </div>
                )}
              </div>

              {/* ⭐ LAUNDRY — Manage Items button */}
              {isLaundry && (
                <button
                  type="button"
                  className="hs-laundry-items-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLaundryItemsModal(true);
                  }}
                  style={{
                    borderColor: service.color,
                    color: service.color,
                  }}
                >
                  <Shirt size={13} strokeWidth={2.2} />
                  <span>Manage Items</span>
                  <span className="hs-laundry-count" style={{ background: service.color }}>
                    {laundryItems.length}
                  </span>
                </button>
              )}

              {/* ⭐⭐⭐ RESTAURANT — Manage Menu button */}
              {isRestaurant && (
                <button
                  type="button"
                  className="hs-laundry-items-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRestaurantMenuModal(true);
                  }}
                  style={{
                    borderColor: service.color,
                    color: service.color,
                  }}
                >
                  <Utensils size={13} strokeWidth={2.2} />
                  <span>Manage Menu</span>
                  <span className="hs-laundry-count" style={{ background: service.color }}>
                    {(serviceData.restaurant as RestaurantDetail)?.items?.length || 0}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="hs-empty">
          <Search size={32} strokeWidth={1.5} />
          <p>No services found</p>
          <small>Try a different search term</small>
        </div>
      )}

      {showWifiModal && (
        <WifiManageModal
          isOpen={showWifiModal}
          onClose={() => setShowWifiModal(false)}
          wifiList={wifiList}
          onSave={handleWifiSave}
        />
      )}

      {activeServiceModal && slug && (
        <ServiceManageModal
          isOpen={!!activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          slug={slug}
          serviceTitle={activeServiceModal.title}
          serviceColor={activeServiceModal.color}
          serviceIcon={activeServiceModal.icon}
          detail={serviceData[activeServiceModal.key] || DEFAULT_GYM}
          onSave={handleServiceDetailSave}
          defaultOpenTime={SERVICE_CONFIGS[activeServiceModal.key]?.defaultOpen || '09:00'}
          defaultCloseTime={SERVICE_CONFIGS[activeServiceModal.key]?.defaultClose || '21:00'}
        />
      )}

      {/* ⭐ LAUNDRY ITEMS MODAL */}
      {showLaundryItemsModal && (
        <LaundryItemsModal
          isOpen={showLaundryItemsModal}
          onClose={() => setShowLaundryItemsModal(false)}
          items={laundryItems}
          onSave={handleLaundryItemsSave}
          accentColor="#06b6d4"
        />
      )}

      {/* ⭐⭐⭐ RESTAURANT MENU MODAL */}
      {showRestaurantMenuModal && slug && (
        <RestaurantMenuModal
          isOpen={showRestaurantMenuModal}
          onClose={() => setShowRestaurantMenuModal(false)}
          slug={slug}
          restaurant={
            (serviceData.restaurant as RestaurantDetail) || DEFAULT_RESTAURANT
          }
          onSave={handleRestaurantMenuSave}
          accentColor="#f97316"
        />
      )}
    </PortalLayout>
  );
};

export default HotelServices;