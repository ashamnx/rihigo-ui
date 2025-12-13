/**
 * Vendor Staff type definitions
 * For managing staff assigned to vendors with roles
 * Based on API: GET/POST /api/admin/vendors/{id}/staff
 */
import { UserProfile } from "~/types/api";

export interface VendorStaffPermissions {
  can_manage_activities: boolean;
  can_manage_bookings: boolean;
  can_manage_guests: boolean;
  can_manage_resources: boolean;
  can_view_reports: boolean;
  can_manage_finance: boolean;
  can_manage_staff: boolean;
  can_manage_settings: boolean;
}

export interface VendorStaff {
  user: UserProfile;
  id: string;
  vendor_id: string;
  user_id: string;
  user_name?: string;
  role: 'owner' | 'manager' | 'staff';
  permissions?: VendorStaffPermissions;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VendorStaffCreateInput {
  user_email: string;
  role: 'owner' | 'manager' | 'staff';
  permissions?: Partial<VendorStaffPermissions>;
}

/**
 * Vendor Staff Update Input
 */
export interface VendorStaffUpdateInput {
  role?: 'owner' | 'manager' | 'staff';
  permissions?: Partial<VendorStaffPermissions>;
  is_active?: boolean;
}

/**
 * Vendor Activity Log type definitions
 * Based on API: GET /api/admin/vendors/{id}/logs
 */
export interface VendorLog {
  id: string;
  vendor_id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  performed_by: string;
  created_at: string;
}

// Legacy alias for backward compatibility
export type VendorUser = VendorStaff;

export interface VendorUserCreateInput {
  user_email: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface VendorUserUpdateInput {
  role?: 'owner' | 'manager' | 'staff';
  permissions?: Partial<VendorStaffPermissions>;
  is_active?: boolean;
}

// Available roles for vendor staff
export const VENDOR_STAFF_ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full access to all features' },
  { id: 'manager', label: 'Manager', description: 'Manage day-to-day operations' },
  { id: 'staff', label: 'Staff', description: 'Limited access based on role' },
] as const;

export type VendorStaffRole = 'owner' | 'manager' | 'staff';
