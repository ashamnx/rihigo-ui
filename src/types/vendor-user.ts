/**
 * Vendor Staff type definitions
 * For managing staff assigned to vendors with roles
 * Based on API: GET/POST /api/admin/vendors/{id}/staff
 */

export interface VendorStaff {
  id: string;
  vendor_id: string;
  user_id: string;
  user_email: string;
  role: 'owner' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface VendorStaffCreateInput {
  user_email: string;
  role: 'owner' | 'manager' | 'staff';
}

/**
 * Vendor Activity Log type definitions
 * Based on API: GET /api/admin/vendors/{id}/logs
 */
export interface VendorLog {
  id: string;
  vendor_id: string;
  action: string;
  details: Record<string, unknown>;
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
}

// Available roles for vendor staff
export const VENDOR_STAFF_ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full access to all features' },
  { id: 'manager', label: 'Manager', description: 'Manage day-to-day operations' },
  { id: 'staff', label: 'Staff', description: 'Limited access based on role' },
] as const;

export type VendorStaffRole = 'owner' | 'manager' | 'staff';
