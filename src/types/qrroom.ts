// src/types/qrroom.ts

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type CallStatus = 'ringing' | 'answered' | 'missed' | 'ended';
export type Priority = 'normal' | 'urgent';

export type QrTabKey = 'orders' | 'requests' | 'messages' | 'calls' | 'reviews';

export interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  room_number: string;
  guest_name: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  total_amount: number;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  room_number: string;
  guest_name: string;
  request_type: string;
  description?: string;
  priority: Priority;
  status: RequestStatus;
  created_at: string;
}

export interface ChatThread {
  room_number: string;
  guest_name: string;
  last_text: string;
  last_time: string;
  last_sender: 'guest' | 'staff';
  unread: number;
}

export interface ChatMessage {
  id: number;
  sender: 'guest' | 'staff';
  text?: string;
  image_url?: string;
  video_url?: string;
  staff_name?: string;
  time: string;
}

export interface CallHistory {
  id: string;
  room_number: string;
  guest_name: string;
  status: CallStatus;
  answered_by?: string;
  created_at: string;
}

export interface Review {
  id: string;
  guest_name: string;
  room_number: string;
  rating: number;
  text: string;
  platform: 'google' | 'tripadvisor' | 'booking' | 'direct';
  photo_url?: string;
  created_at: string;
}

// Status colors
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending:    '#f59e0b',
  confirmed:  '#2563eb',
  preparing:  '#7c3aed',
  delivered:  '#16a34a',
  cancelled:  '#dc2626',
};

export const REQUEST_STATUS_COLOR: Record<RequestStatus, string> = {
  pending:     '#f59e0b',
  in_progress: '#2563eb',
  completed:   '#16a34a',
  cancelled:   '#dc2626',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  preparing:  'Preparing',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};