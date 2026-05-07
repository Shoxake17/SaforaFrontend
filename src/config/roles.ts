// src/config/roles.ts
import {
  // Asosiy roli ikonalari
  ShieldCheck,
  ConciergeBell,
  Sparkles,
  QrCode,
  // Login features
  TrendingUp,
  UsersRound,
  CalendarCheck,
  LogIn,
  BedDouble,
  Receipt,
  ListChecks,
  SprayCan,
  Bell,
  TriangleAlert,
  // Dashboard nav
  LayoutDashboard,
  Calendar,
  Bed,
  Users,
  LineChart,
  Settings,
  LogOut,
  Grid3x3,
  // Stats
  DollarSign,
  CircleCheck,
  ShoppingCart,
  MessageCircle,
  Phone,
  type LucideIcon,
} from 'lucide-react';

export type RoleKey = 'management' | 'frontdesk' | 'housekeeping' | 'dept-manager';

export type RoleTheme = 'orange' | 'red' | 'warm' | 'rose';

// Endi `icon` string emas, Lucide komponenti
export interface RoleFeature {
  icon: LucideIcon;
  text: string;
}

export interface RoleNavItem {
  icon: LucideIcon;
  label: string;
  key: string;
}

export interface RoleStat {
  icon: LucideIcon;
  label: string;
  color: string;
}

export interface RoleConfig {
  badge: string;
  badgeColor: string;
  icon: LucideIcon;
  theme: RoleTheme;

  loginTitle: string;
  loginDesc: string;
  loginFeatures: RoleFeature[];

  dashboardTitle: string;
  dashboardSubtitle: string;
  dashboardDescription: string;
  dashboardNavItems: RoleNavItem[];
  dashboardStats: RoleStat[];
}

export const ROLE_CONFIG: Record<RoleKey, RoleConfig> = {
  // 🟠 MANAGEMENT
  management: {
    badge: 'MANAGER ACCESS',
    badgeColor: '#f97316',
    icon: ShieldCheck,
    theme: 'orange',

    loginTitle: 'Management',
    loginDesc: 'Full hotel management — staff, reservations, analytics & settings.',
    loginFeatures: [
      { icon: TrendingUp, text: 'Real-time analytics & reports' },
      { icon: UsersRound, text: 'Staff & department management' },
      { icon: CalendarCheck, text: 'Reservations & bookings' },
    ],

    dashboardTitle: 'Management Dashboard',
    dashboardSubtitle: 'Full Hotel Control',
    dashboardDescription: 'Manage your hotel operations, staff, and analytics',
    dashboardNavItems: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: CalendarCheck, label: 'Reservations', key: 'reservations' },
      { icon: Bed, label: 'Rooms', key: 'rooms' },
      { icon: Users, label: 'Staff', key: 'staff' },
      { icon: LineChart, label: 'Reports', key: 'reports' },
      { icon: Settings, label: 'Settings', key: 'settings' },
    ],
    dashboardStats: [
      { icon: CalendarCheck, label: 'Reservations Today', color: '#f97316' },
      { icon: Bed, label: 'Available Rooms', color: '#16a34a' },
      { icon: Users, label: 'Active Staff', color: '#0ea5e9' },
      { icon: DollarSign, label: 'Revenue Today', color: '#8b5cf6' },
    ],
  },

  // 🔴 FRONT DESK
  frontdesk: {
    badge: 'RECEPTIONIST ACCESS',
    badgeColor: '#dc2626',
    icon: ConciergeBell,
    theme: 'red',

    loginTitle: 'Front Desk',
    loginDesc: 'Check-ins, check-outs, walk-ins & guest billing.',
    loginFeatures: [
      { icon: LogIn, text: 'Check-in & check-out' },
      { icon: BedDouble, text: 'Room availability' },
      { icon: Receipt, text: 'Guest billing' },
    ],

    dashboardTitle: 'Front Desk Dashboard',
    dashboardSubtitle: 'Reception Operations',
    dashboardDescription: 'Manage check-ins, check-outs and guest services',
    dashboardNavItems: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: LogIn, label: 'Check-in', key: 'checkin' },
      { icon: LogOut, label: 'Check-out', key: 'checkout' },
      { icon: Bed, label: 'Rooms', key: 'rooms' },
      { icon: Receipt, label: 'Billing', key: 'billing' },
    ],
    dashboardStats: [
      { icon: LogIn, label: 'Check-ins Today', color: '#dc2626' },
      { icon: LogOut, label: 'Check-outs Today', color: '#f97316' },
      { icon: Bed, label: 'Available Rooms', color: '#16a34a' },
      { icon: Bell, label: 'Pending Requests', color: '#8b5cf6' },
    ],
  },

  // 🟧 HOUSEKEEPING
  housekeeping: {
    badge: 'HOUSEKEEPING STAFF',
    badgeColor: '#ea580c',
    icon: Sparkles,
    theme: 'warm',

    loginTitle: 'Housekeeping',
    loginDesc: 'Room assignments, cleaning status & task management.',
    loginFeatures: [
      { icon: ListChecks, text: 'View assigned rooms' },
      { icon: SprayCan, text: 'Update cleaning status' },
      { icon: Bell, text: 'Maintenance alerts' },
    ],

    dashboardTitle: 'Housekeeping Dashboard',
    dashboardSubtitle: 'Room Management',
    dashboardDescription: 'Manage room cleaning and maintenance tasks',
    dashboardNavItems: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: ListChecks, label: 'My Tasks', key: 'tasks' },
      { icon: Bed, label: 'Rooms', key: 'rooms' },
      { icon: SprayCan, label: 'Cleaning', key: 'cleaning' },
    ],
    dashboardStats: [
      { icon: ListChecks, label: 'Tasks Today', color: '#ea580c' },
      { icon: SprayCan, label: 'Rooms to Clean', color: '#f97316' },
      { icon: CircleCheck, label: 'Completed', color: '#16a34a' },
      { icon: TriangleAlert, label: 'Urgent', color: '#dc2626' },
    ],
  },

  // 🌹 DEPT MANAGER / QR MANAGER
  'dept-manager': {
    badge: 'QR MANAGER ACCESS',
    badgeColor: '#ef4444',
    icon: QrCode,
    theme: 'rose',

    loginTitle: 'QR Manager',
    loginDesc: 'QR codes, rooms, staff & service management.',
    loginFeatures: [
      { icon: ListChecks, text: 'View your assigned tasks' },
      { icon: Bed, text: 'Update room cleaning status' },
      { icon: TriangleAlert, text: 'Urgent task priority alerts' },
    ],

    dashboardTitle: 'QR Service Dashboard',
    dashboardDescription: 'Manage QR codes, guest orders & requests',
    dashboardNavItems: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: Users, label: 'Staff', key: 'staff' },
      { icon: Bed, label: 'Rooms', key: 'rooms' },
      { icon: Grid3x3, label: 'QR Rooms', key: 'qrrooms' },
      { icon: ConciergeBell, label: 'Services', key: 'services' },
      { icon: Settings, label: 'Settings', key: 'settings' },
    ],
    dashboardStats: [
      { icon: ShoppingCart, label: 'Orders Today', color: '#ef4444' },
      { icon: ConciergeBell, label: 'Requests Today', color: '#f97316' },
      { icon: MessageCircle, label: 'Messages Today', color: '#0ea5e9' },
      { icon: Phone, label: 'Calls Today', color: '#16a34a' },
    ],
  },
};

export const getRoleConfig = (role: string | undefined): RoleConfig => {
  const key = (role || 'management') as RoleKey;
  return ROLE_CONFIG[key] || ROLE_CONFIG.management;
};