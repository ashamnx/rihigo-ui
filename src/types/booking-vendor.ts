// Vendor Booking Types
import type { Guest } from './guest';
import type { VendorResource, VendorService, ServiceType } from './resource';
import type { Activity } from './activity';
import type { Invoice } from './invoice';
import type { Payment } from './payment';

export type BookingSourceType = 'platform' | 'direct' | 'ota' | 'agent' | 'phone' | 'walk_in';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type BookingServiceStatus = 'pending' | 'delivered' | 'cancelled';

export interface PricingBreakdown {
    nightly_rates?: { date: string; rate: number }[];
    add_ons?: { name: string; quantity: number; price: number }[];
    discounts?: { name: string; amount: number }[];
    taxes?: { name: string; rate: number; amount: number }[];
}

export interface BookingService {
    id: string;
    booking_id: string;
    service_id: string;
    service?: VendorService;
    quantity: number;
    unit_price: number;
    total_price: number;
    scheduled_at?: string;
    status: BookingServiceStatus;
}

export interface VendorBooking {
    id: string;
    vendor_id: string;
    booking_number: string;

    // Source
    source_type: BookingSourceType;
    source_name?: string;
    external_booking_id?: string;

    // Guest
    primary_guest_id: string;
    primary_guest?: Guest;
    additional_guests?: Guest[];
    adults: number;
    children: number;
    infants: number;

    // Resource/Service
    resource_id?: string;
    resource?: VendorResource;
    activity_id?: string;
    activity?: Activity;
    package_id?: string;
    service_type: ServiceType;

    // Dates
    check_in_date: string;
    check_out_date: string;
    nights_count: number;

    // Pricing
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    commission_amount?: number;
    net_revenue: number;
    pricing_breakdown?: PricingBreakdown;

    // Status
    status: BookingStatus;
    payment_status: PaymentStatus;

    // Additional
    special_requests?: string;
    internal_notes?: string;
    tags?: string[];

    // Services
    services?: BookingService[];

    // Related
    invoices?: Invoice[];
    payments?: Payment[];
    quotation_id?: string;

    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface BookingFilters {
    search?: string;
    source_type?: BookingSourceType;
    status?: BookingStatus;
    payment_status?: PaymentStatus;
    date_from?: string;
    date_to?: string;
    resource_id?: string;
    activity_id?: string;
    guest_id?: string;
    page?: number;
    limit?: number;
}

export interface CalendarBooking {
    id: string;
    booking_number: string;
    guest_name: string;
    resource_id: string;
    resource_name: string;
    check_in_date: string;
    check_out_date: string;
    status: BookingStatus;
}

export interface BookingCreateInput {
    // Source
    source_type: BookingSourceType;
    source_name?: string;
    external_booking_id?: string;

    // Guest
    primary_guest_id: string;
    additional_guest_ids?: string[];
    adults: number;
    children: number;
    infants: number;

    // Resource/Service
    resource_id?: string;
    activity_id?: string;
    package_id?: string;
    service_type: ServiceType;

    // Dates
    check_in_date: string;
    check_out_date: string;

    // Pricing (optional - can be auto-calculated)
    subtotal?: number;
    taxes?: number;
    fees?: number;
    total?: number;
    currency?: string;
    commission_amount?: number;
    pricing_breakdown?: PricingBreakdown;

    // Status
    status?: BookingStatus;
    payment_status?: PaymentStatus;

    // Additional
    special_requests?: string;
    internal_notes?: string;
    tags?: string[];

    // Services
    services?: BookingServiceInput[];
}

export interface BookingUpdateInput extends Partial<BookingCreateInput> {}

export interface BookingServiceInput {
    service_id: string;
    quantity: number;
    unit_price?: number;
    scheduled_at?: string;
}

export interface BookingStatusUpdateInput {
    status: BookingStatus;
    notes?: string;
}

// Display helpers
export const bookingSourceLabels: Record<BookingSourceType, string> = {
    platform: 'Platform',
    direct: 'Direct',
    ota: 'OTA',
    agent: 'Agent',
    phone: 'Phone',
    walk_in: 'Walk-in',
};

export const bookingStatusLabels: Record<BookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    refunded: 'Refunded',
};

export const bookingSourceColors: Record<BookingSourceType, string> = {
    platform: 'badge-primary',
    direct: 'badge-success',
    ota: 'badge-warning',
    agent: 'badge-info',
    phone: 'badge-secondary',
    walk_in: 'badge-accent',
};

export const bookingStatusColors: Record<BookingStatus, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    checked_in: 'badge-success',
    checked_out: 'badge-neutral',
    cancelled: 'badge-error',
    no_show: 'badge-ghost',
};

export const paymentStatusColors: Record<PaymentStatus, string> = {
    unpaid: 'badge-error',
    partial: 'badge-warning',
    paid: 'badge-success',
    refunded: 'badge-info',
};

// Status flow helpers
export const getNextBookingStatuses = (currentStatus: BookingStatus): BookingStatus[] => {
    switch (currentStatus) {
        case 'pending':
            return ['confirmed', 'cancelled'];
        case 'confirmed':
            return ['checked_in', 'cancelled', 'no_show'];
        case 'checked_in':
            return ['checked_out'];
        case 'checked_out':
        case 'cancelled':
        case 'no_show':
            return [];
        default:
            return [];
    }
};

// Calculate nights between dates
export const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
