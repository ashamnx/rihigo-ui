/**
 * Vendor type definitions
 * Based on API documentation for POST /api/admin/vendors
 */

export interface Vendor {
  id: string;
  business_name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  island_id?: number;
  business_registration_number?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  commission_percentage: number;
  payment_terms?: string;
  logo_url?: string;
  bank_account_details?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface VendorCreateInput {
  business_name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  island_id?: number;
  business_registration_number?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  commission_percentage?: number;
  payment_terms?: string;
}

export interface VendorUpdateInput {
  business_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  island_id?: number;
  business_registration_number?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  commission_percentage?: number;
  payment_terms?: string;
  status?: 'pending' | 'active' | 'suspended' | 'inactive';
}
