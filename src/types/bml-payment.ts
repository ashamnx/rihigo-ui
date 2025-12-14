// BML Payment Gateway Types

export type BMLPaymentStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'refunded';

export type BMLRefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Request to initiate payment
export interface BMLPaymentInitiateInput {
    booking_id: string;
    amount: number;
    currency: string;
    callback_url: string;
    cancel_url?: string;
    metadata?: Record<string, unknown>;
}

// Response from initiate payment
export interface BMLPaymentInitiateResponse {
    payment_id: string;
    redirect_url: string;
    transaction_reference: string;
    expires_at: string;
}

// Payment status response
export interface BMLPaymentStatusResponse {
    id: string;
    booking_id: string;
    status: BMLPaymentStatus;
    amount: number;
    currency: string;
    transaction_reference: string;
    bml_transaction_id?: string;
    paid_at?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

// Refund request
export interface BMLRefundInput {
    amount: number;
    reason?: string;
    notes?: string;
}

// Refund response
export interface BMLRefundResponse {
    id: string;
    payment_id: string;
    amount: number;
    status: BMLRefundStatus;
    refund_reference: string;
    created_at: string;
}

// Webhook payload from BML
export interface BMLWebhookPayload {
    event_type: 'payment.completed' | 'payment.failed' | 'refund.completed';
    transaction_id: string;
    transaction_reference: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
    signature: string;
}

// Display helpers
export const bmlPaymentStatusLabels: Record<BMLPaymentStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

export const bmlPaymentStatusColors: Record<BMLPaymentStatus, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-error',
    cancelled: 'badge-ghost',
    refunded: 'badge-accent',
};

export const bmlRefundStatusLabels: Record<BMLRefundStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
};

export const bmlRefundStatusColors: Record<BMLRefundStatus, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-error',
};
