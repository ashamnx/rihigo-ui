// Payment & Refund Types
import type { Guest } from './guest';
import type { Invoice } from './invoice';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online' | 'wallet' | 'other';
export type PaymentStatusType = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
export type RefundReasonType = 'cancellation' | 'overcharge' | 'service_issue' | 'duplicate' | 'other';
export type RefundMethod = 'original_method' | 'cash' | 'bank_transfer' | 'credit_note';
export type CreditNoteStatus = 'active' | 'partially_used' | 'fully_used' | 'expired' | 'voided';

export interface PaymentAllocation {
    id: string;
    payment_id: string;
    invoice_id: string;
    invoice?: Invoice;
    amount: number;
    allocated_at: string;
}

export interface Payment {
    id: string;
    vendor_id: string;
    payment_number: string;

    // References
    invoice_id?: string;
    invoice?: Invoice;
    booking_id?: string;

    // Payer
    guest_id?: string;
    guest?: Guest;
    payer_name: string;
    payer_email?: string;

    // Amount
    amount: number;
    currency: string;
    exchange_rate?: number;
    amount_in_base_currency: number;

    // Method
    payment_method: PaymentMethod;
    payment_provider?: string;
    transaction_id?: string;
    card_last_four?: string;
    card_brand?: string;

    // Status
    status: PaymentStatusType;

    // Details
    payment_date: string;
    received_by?: string;
    notes?: string;

    // Allocations
    allocations?: PaymentAllocation[];

    created_at: string;
    updated_at: string;
}

export interface PaymentFilters {
    search?: string;
    status?: PaymentStatusType;
    payment_method?: PaymentMethod;
    date_from?: string;
    date_to?: string;
    guest_id?: string;
    invoice_id?: string;
    page?: number;
    limit?: number;
}

export interface PaymentCreateInput {
    // References
    invoice_id?: string;
    booking_id?: string;

    // Payer
    guest_id?: string;
    payer_name: string;
    payer_email?: string;

    // Amount
    amount: number;
    currency?: string;
    exchange_rate?: number;

    // Method
    payment_method: PaymentMethod;
    payment_provider?: string;
    transaction_id?: string;
    card_last_four?: string;
    card_brand?: string;

    // Details
    payment_date?: string;
    notes?: string;

    // Auto-allocate to invoice
    auto_allocate?: boolean;
}

export interface AllocationInput {
    invoice_id: string;
    amount: number;
}

// Refund Types
export interface Refund {
    id: string;
    vendor_id: string;
    refund_number: string;

    // References
    payment_id: string;
    payment?: Payment;
    invoice_id?: string;
    booking_id?: string;

    // Recipient
    guest_id?: string;
    guest?: Guest;
    recipient_name: string;

    // Amount
    amount: number;
    currency: string;

    // Reason
    reason_type: RefundReasonType;
    reason_description?: string;

    // Method
    refund_method: RefundMethod;
    refund_provider?: string;
    transaction_id?: string;

    // Status
    status: RefundStatus;

    // Workflow
    requested_by: string;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    processed_at?: string;
    processed_by?: string;

    created_at: string;
    updated_at: string;
}

export interface RefundFilters {
    search?: string;
    status?: RefundStatus;
    reason_type?: RefundReasonType;
    date_from?: string;
    date_to?: string;
    payment_id?: string;
    page?: number;
    limit?: number;
}

export interface RefundCreateInput {
    payment_id: string;
    amount: number;
    reason_type: RefundReasonType;
    reason_description?: string;
    refund_method: RefundMethod;
    recipient_name?: string;
    notes?: string;
}

// Credit Note Types
export interface CreditNoteApplication {
    id: string;
    credit_note_id: string;
    invoice_id: string;
    invoice?: Invoice;
    amount: number;
    applied_at: string;
    applied_by: string;
}

export interface CreditNote {
    id: string;
    vendor_id: string;
    credit_note_number: string;

    // References
    invoice_id: string;
    original_invoice?: Invoice;
    refund_id?: string;
    guest_id: string;
    guest?: Guest;

    // Amount
    amount: number;
    currency: string;
    balance_remaining: number;

    // Dates
    issue_date: string;
    expiry_date?: string;

    // Status
    status: CreditNoteStatus;

    // Applications
    applications?: CreditNoteApplication[];

    notes?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreditNoteFilters {
    search?: string;
    status?: CreditNoteStatus;
    guest_id?: string;
    has_balance?: boolean;
    page?: number;
    limit?: number;
}

export interface CreditNoteApplyInput {
    invoice_id: string;
    amount: number;
}

// Display helpers
export const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    online: 'Online Payment',
    wallet: 'Wallet',
    other: 'Other',
};

export const paymentMethodIcons: Record<PaymentMethod, string> = {
    cash: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    card: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
    bank_transfer: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    online: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    wallet: 'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3',
    other: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export const paymentStatusLabels: Record<PaymentStatusType, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    partially_refunded: 'Partially Refunded',
};

export const paymentStatusColors: Record<PaymentStatusType, string> = {
    pending: 'badge-warning',
    completed: 'badge-success',
    failed: 'badge-error',
    refunded: 'badge-info',
    partially_refunded: 'badge-accent',
};

export const refundStatusLabels: Record<RefundStatus, string> = {
    pending: 'Pending Approval',
    approved: 'Approved',
    processing: 'Processing',
    completed: 'Completed',
    rejected: 'Rejected',
};

export const refundStatusColors: Record<RefundStatus, string> = {
    pending: 'badge-warning',
    approved: 'badge-info',
    processing: 'badge-primary',
    completed: 'badge-success',
    rejected: 'badge-error',
};

export const refundReasonLabels: Record<RefundReasonType, string> = {
    cancellation: 'Booking Cancellation',
    overcharge: 'Overcharge',
    service_issue: 'Service Issue',
    duplicate: 'Duplicate Payment',
    other: 'Other',
};

export const refundMethodLabels: Record<RefundMethod, string> = {
    original_method: 'Original Payment Method',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    credit_note: 'Credit Note',
};

export const creditNoteStatusLabels: Record<CreditNoteStatus, string> = {
    active: 'Active',
    partially_used: 'Partially Used',
    fully_used: 'Fully Used',
    expired: 'Expired',
    voided: 'Voided',
};

export const creditNoteStatusColors: Record<CreditNoteStatus, string> = {
    active: 'badge-success',
    partially_used: 'badge-warning',
    fully_used: 'badge-neutral',
    expired: 'badge-ghost',
    voided: 'badge-error',
};

// Helper to check if refund can be approved
export const canApproveRefund = (status: RefundStatus): boolean => {
    return status === 'pending';
};

// Helper to check if refund can be processed
export const canProcessRefund = (status: RefundStatus): boolean => {
    return status === 'approved';
};

// Helper to check if credit note can be applied
export const canApplyCreditNote = (status: CreditNoteStatus, balance: number): boolean => {
    return status === 'active' || (status === 'partially_used' && balance > 0);
};
