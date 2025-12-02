import type { BookingTax } from './tax';

export interface Booking {
  id: string;
  user_id: string;
  activity_id: string;
  package_id?: string;
  booking_date: string;
  number_of_people: number;
  subtotal: number;
  tax_amount: number;
  total_price: number;
  currency: string; // Always USD (base currency)
  display_currency?: string; // User's preferred display currency
  exchange_rate_at_booking?: number; // Exchange rate at time of booking
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  taxes?: BookingTax[];
  customer_info: CustomerInfo;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  activity?: {
    id: string;
    title: string;
    slug: string;
    images?: string[];
  };
  package?: {
    id: string;
    name: string;
  };
}

export interface CustomerInfo {
  full_name: string;
  email: string;
  phone: string;
  nationality?: string;
  special_requests?: string;
}

export interface CreateBookingInput {
  activity_id: string;
  package_id?: string;
  booking_date: string;
  number_of_people: number;
  customer_info: CustomerInfo;
  payment_method: string;
  notes?: string;
  display_currency?: string; // User's preferred display currency
}

export interface UpdateBookingStatusInput {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'refunded';
}

export interface BookingFilters {
  status?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedBookingsResponse {
  data: Booking[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  amount: number;
  currency: string; // Always USD (base currency)
  display_currency?: string; // Display currency
  exchange_rate_at_creation?: number; // Exchange rate at time of invoice creation
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  issued_at: string;
  due_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}
