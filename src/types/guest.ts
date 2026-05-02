// src/types/guest.ts

export interface GuestHotel {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  logo?: string;
}

export interface GuestRoom {
  id: string;
  number: string;
  floor?: number;
}

export interface GuestSettings {
  primary_color?: string;
  welcome_title?: string;
  welcome_subtitle?: string;
  hotel_rules?: string;
  wifi_name?: string;
  wifi_password?: string;
  phone?: string;
  whatsapp?: string;
  hero_photo?: string;
  instagram?: string;
  facebook?: string;
  telegram?: string;
}

export interface GuestSession {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
}

export interface GuestRegisterPayload {
  hotel_slug: string;
  room_number: string;
  name: string;
  phone: string;
  email?: string;
  language?: string;
}

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}