/**
 * Vendor User type definitions
 * For managing users assigned to vendors with roles and permissions
 */

export interface VendorUser {
  id: string;
  vendor_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  permissions: string[];
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface VendorUserCreateInput {
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  permissions: string[];
}

export interface VendorUserUpdateInput {
  role?: 'owner' | 'manager' | 'staff' | 'viewer';
  permissions?: string[];
}

// Available permissions for vendor users
export const VENDOR_PERMISSIONS = {
  MANAGE_BOOKINGS: 'manage_bookings',
  VIEW_REPORTS: 'view_reports',
  MANAGE_ACTIVITIES: 'manage_activities',
  MANAGE_RESOURCES: 'manage_resources',
  MANAGE_GUESTS: 'manage_guests',
  MANAGE_INVOICES: 'manage_invoices',
  MANAGE_PAYMENTS: 'manage_payments',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export type VendorPermission = typeof VENDOR_PERMISSIONS[keyof typeof VENDOR_PERMISSIONS];
