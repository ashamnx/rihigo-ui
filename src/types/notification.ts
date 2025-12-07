/**
 * Notification System Types
 * Comprehensive type definitions for the multi-channel notification system
 */

// ============================================================================
// Notification Types & Enums
// ============================================================================

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'ticket_reply'
  | 'system_announcement'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'telegram' | 'in_app';

export type DevicePlatform = 'web' | 'ios' | 'android';

// ============================================================================
// Core Notification Interface
// ============================================================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Notification Preferences
// ============================================================================

export interface NotificationTypePreference {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  telegram?: boolean;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  telegram_enabled: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  type_preferences?: Record<NotificationType, NotificationTypePreference>;
}

// ============================================================================
// Push Device Registration
// ============================================================================

export interface PushDevice {
  id: string;
  token: string;
  platform: DevicePlatform;
  device_id?: string;
  device_name?: string;
  created_at: string;
}

export interface RegisterDeviceRequest {
  token: string;
  platform: DevicePlatform;
  device_id?: string;
  device_name?: string;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type WebSocketMessageType =
  | 'notification'
  | 'unread_count'
  | 'ping'
  | 'pong'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: Notification | { count: number } | { message: string } | null;
}

// ============================================================================
// Toast System Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 5000
  dismissible?: boolean;
  action?: ToastAction;
}

// ============================================================================
// Admin Notification Types
// ============================================================================

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
}

export interface BroadcastNotificationRequest {
  type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  user_ids?: string[]; // Empty = all users
}

export interface BroadcastResponse {
  count: number;
  message: string;
}

// ============================================================================
// Notification Statistics (Admin)
// ============================================================================

export interface ChannelStats {
  sent: number;
  delivered: number;
  failed: number;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_read: number;
  by_channel: Record<NotificationChannel, number>;
  by_type: Record<NotificationType, number>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface NotificationListResponse {
  notifications: Notification[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface TelegramLinkResponse {
  link_url: string;
  expires_at: string;
}

// ============================================================================
// Notification Filter Types
// ============================================================================

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  type?: NotificationType;
  is_read?: boolean;
}
