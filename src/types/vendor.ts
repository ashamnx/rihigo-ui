/**
 * Vendor type definitions
 */

export interface Vendor {
  id: string;
  business_name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'pending' | 'verified' | 'suspended';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorCreateInput {
  business_name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface VendorUpdateInput {
  business_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'pending' | 'verified' | 'suspended';
}
