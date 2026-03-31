import type { Booking } from './booking';

export type CustomerPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface CustomerPayment {
    id: string;
    payment_number: string;
    booking_id: string;
    user_id: string;
    amount: number;
    currency: string;
    amount_usd: number;
    exchange_rate: number;
    payment_provider: string;
    provider_transaction_id?: string;
    provider_response?: Record<string, unknown>;
    status: CustomerPaymentStatus;
    payment_url?: string;
    redirect_url?: string;
    failure_reason?: string;
    paid_at?: string;
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
