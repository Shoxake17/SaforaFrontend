// src/utils/formatAddress.ts
interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  path?: string;
  footway?: string;
  cycleway?: string;

  amenity?: string;
  shop?: string;
  tourism?: string;
  office?: string;
  leisure?: string;
  building?: string;
  historic?: string;

  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  district?: string;
  county?: string;

  city?: string;
  town?: string;
  village?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;

  [key: string]: any;
}

interface NominatimResult {
  display_name?: string;
  address?: NominatimAddress;
  [key: string]: any;
}

/**
 * Asosiy formatter — structured address fields'dan toza manzil tuzadi.
 */
export const formatNominatimAddress = (data: NominatimResult | null | undefined): string => {
  if (!data) return '';

  const a = data.address || {};
  const parts: string[] = [];

  // 1. Joy nomi (Hotel, Park, Cafe va h.k.)
  const placeName =
    a.amenity || a.tourism || a.shop || a.office ||
    a.leisure || a.historic || a.building;

  // 2. Ko'cha + uy raqami
  const road = a.road || a.pedestrian || a.path || a.footway || a.cycleway;
  const houseNumber = a.house_number;

  // 3. Mahalla / tuman
  const district =
    a.suburb || a.neighbourhood || a.quarter || a.city_district;

  // ───── Yig'ish ─────
  if (placeName) {
    parts.push(placeName);
  }

  if (road) {
    parts.push(houseNumber ? `${road}, ${houseNumber}` : road);
  }

  if (district && !parts.some((p) => p.includes(district))) {
    parts.push(district);
  }

  // Agar hech narsa topilmasa — display_name'ni tozalab qaytar
  if (parts.length === 0) {
    return cleanDisplayName(data.display_name || '');
  }

  return parts.join(', ');
};

/**
 * Fallback — display_name string'idan davlat/indeks/shaharni olib tashlaydi.
 */
const cleanDisplayName = (displayName: string): string => {
  if (!displayName) return '';

  const segments = displayName.split(',').map((s) => s.trim()).filter(Boolean);

  // Ma'lum shahar/davlat nomlarini olib tashlash
  const SKIP_LIST = [
    // Davlatlar
    'O\'zbekiston', 'Oʻzbekiston', 'Uzbekistan', 'Узбекистан',
    'Russia', 'Россия', 'Kazakhstan', 'Қазақстан',
    'Kyrgyzstan', 'Кыргызстан', 'Tajikistan', 'Тоҷикистон',
    // Yirik shaharlar
    'Toshkent', 'Tashkent', 'Тошкент', 'Ташкент',
    'Toshkent shahri', 'Tashkent City',
    'Samarqand', 'Samarkand', 'Самарқанд',
    'Buxoro', 'Bukhara', 'Бухоро',
    'Andijon', 'Andijan', 'Андижон',
    'Namangan', 'Наманган',
    'Farg\'ona', 'Fargʻona', 'Fergana', 'Фарғона',
    'Qarshi', 'Qashqadaryo',
    'Nukus', 'Nukus shahri',
  ];

  const filtered = segments.filter((seg) => {
    // Indeks (4-6 raqam)
    if (/^\d{4,6}$/.test(seg)) return false;
    // Davlat / shahar
    if (SKIP_LIST.includes(seg)) return false;
    return true;
  });

  return filtered.join(', ') || displayName;
};

/**
 * Search natijalari uchun (display_name beradi, address yo'q bo'lishi mumkin).
 */
export const formatSearchResult = (data: NominatimResult): string => {
  // Avval structured address bilan urinib ko'ring
  if (data.address) {
    const formatted = formatNominatimAddress(data);
    if (formatted) return formatted;
  }
  // Aks holda display_name'ni tozalang
  return cleanDisplayName(data.display_name || '');
};