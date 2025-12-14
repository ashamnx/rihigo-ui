import type { Booking } from './booking';

export type CustomerPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface CustomerPayment {
    id: string;
    booking_id: string;
    user_id: string;
    transaction_id: string;
    transaction_reference: string;
    amount: number;
    currency: string;
    status: CustomerPaymentStatus;
    provider: string;
    provider_response?: Record<string, unknown>;
    error_message?: string;
    paid_at?: string;
    refunded_at?: string;
    refund_amount?: number;
    refund_reason?: string;
    created_at: string;
    updated_at: string;
    // Related data (when include_booking=true)
    booking?: Booking;
}

export interface CustomerPaymentFilters {
    status?: CustomerPaymentStatus;
    provider?: string;
    booking_id?: string;
    user_id?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    include_booking?: boolean;
}

export const paymentStatusLabels: Record<CustomerPaymentStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

export const paymentStatusColors: Record<CustomerPaymentStatus, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-error',
    cancelled: 'badge-ghost',
    refunded: 'badge-info',
};
