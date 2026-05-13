// src/constants/hotelServices.ts
import {
  Plane, CreditCard, Baby, Wine, Bike, Luggage, Car, Users,
  BadgeDollarSign, Stethoscope, PartyPopper, Flower2, Dumbbell, Shirt,
  Smile, Sparkles, Utensils, ConciergeBell, Bell,
  Waves, PawPrint, Footprints, Map, AlarmClock, Lock, Mail, Newspaper,
  Scissors, Wifi, WashingMachine,
  type LucideIcon,
} from 'lucide-react';

export interface HotelServiceDef {
  key: string;
  title: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  hasDetails?: boolean;
}

export const HOTEL_SERVICES: HotelServiceDef[] = [
  { key: 'wake_up',         title: 'Wake-up Call',       sub: 'Alarm',         icon: AlarmClock,      color: '#f97316' },
  { key: 'spa',             title: 'Spa & Wellness',     sub: 'Relax',         icon: Sparkles,        color: '#f97316', hasDetails: true },
  { key: 'yandex_taxi',     title: 'Yandex Taxi',        sub: 'Car Service',   icon: Car,             color: '#f97316', hasDetails: true },
  { key: 'pool',            title: 'Swimming Pool',      sub: 'Relaxation',    icon: Waves,           color: '#f97316', hasDetails: true },
  { key: 'luggage_storage', title: 'Luggage Storage',    sub: 'Storage',       icon: Luggage,         color: '#f97316', hasDetails: true },   // ⭐ FIXED: 'luggage' → 'luggage_storage'
  { key: 'currency',        title: 'Currency Exchange',  sub: 'Exchange',      icon: BadgeDollarSign, color: '#f97316' },
  { key: 'gym',             title: 'Gym & Fitness',      sub: 'Workout',       icon: Dumbbell,        color: '#f97316', hasDetails: true },
  { key: 'wifi',            title: 'Wi-Fi',              sub: 'Internet',      icon: Wifi,            color: '#f97316' },
  { key: 'laundry',         title: 'Laundry',            sub: 'Cleaning',      icon: WashingMachine,  color: '#f97316', hasDetails: true },
  { key: 'restaurant',      title: 'Restaurant',         sub: 'Dining',        icon: Utensils,        color: '#f97316', hasDetails: true },
];