// Invoice Types
import type { Guest } from './guest';
import type { VendorBooking } from './booking-vendor';
import type { Payment } from './payment';
import type { ItemType, ItemUnit } from './quotation';

export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void';

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent?: number;
    discount_amount: number;
    tax_rate_id?: string;
    tax_amount: number;
    line_total: number;
    sort_order: number;

    // References
    booking_id?: string;
    resource_id?: string;
    service_id?: string;
}

export interface Invoice {
    id: string;
    vendor_id: string;
    invoice_number: string;

    // References
    booking_id?: string;
    booking?: VendorBooking;
    quotation_id?: string;

    // Billing
    guest_id?: string;
    guest?: Guest;
    billing_name: string;
    billing_email: string;
    billing_phone?: string;
    billing_address?: string;
    billing_company?: string;
    tax_id?: string;

    // Dates
    issue_date: string;
    due_date: string;

    // Amounts
    subtotal: number;
    discount_amount: number;
    taxable_amount: number;
    tax_amount: number;
    total: number;
    currency: string; // Always USD (base currency)
    display_currency?: string; // Display currency
    exchange_rate_at_creation?: number; // Exchange rate at time of invoice creation

    // Payment
    amount_paid: number;
    amount_due: number;

    // Status
    status: InvoiceStatus;

    // Items
    items: InvoiceItem[];

    // Payments
    payments?: Payment[];

    // Content
    notes?: string;
    footer_text?: string;
    payment_instructions?: string;

    // Void info
    voided_at?: string;
    voided_by?: string;
    void_reason?: string;

    // Metadata
    sent_at?: string;
    paid_at?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface InvoiceFilters {
    search?: string;
    status?: InvoiceStatus;
    date_from?: string;
    date_to?: string;
    due_date_from?: string;
    due_date_to?: string;
    guest_id?: string;
    booking_id?: string;
    overdue_only?: boolean;
    page?: number;
    limit?: number;
}

export interface InvoiceItemInput {
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    tax_rate_id?: string;
    sort_order?: number;
    booking_id?: string;
    resource_id?: string;
    service_id?: string;
}

export interface InvoiceCreateInput {
    // References
    booking_id?: string;
    quotation_id?: string;

    // Billing
    guest_id?: string;
    billing_name: string;
    billing_email: string;
    billing_phone?: string;
    billing_address?: string;
    billing_company?: string;
    tax_id?: string;

    // Dates
    issue_date?: string;
    due_date: string;

    // Items
    items: InvoiceItemInput[];

    // Currency
    currency?: string; // Display currency (stored amounts are in USD)
    display_currency?: string; // Alias for currency field

    // Content
    notes?: string;
    footer_text?: string;
    payment_instructions?: string;
}

export interface InvoiceUpdateInput extends Partial<InvoiceCreateInput> {}

export interface InvoiceVoidInput {
    reason: string;
}

// Display helpers
export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    sent: 'Sent',
    partial: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    void: 'Void',
};

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
    draft: 'badge-ghost',
    pending: 'badge-warning',
    sent: 'badge-info',
    partial: 'badge-accent',
    paid: 'badge-success',
    overdue: 'badge-error',
    cancelled: 'badge-neutral',
    void: 'badge-ghost',
};

// Helper to check if invoice is editable
export const isInvoiceEditable = (status: InvoiceStatus): boolean => {
    return status === 'draft';
};

// Helper to check if invoice can be sent
export const canSendInvoice = (status: InvoiceStatus): boolean => {
    return ['draft', 'pending', 'sent', 'partial', 'overdue'].includes(status);
};

// Helper to check if invoice can be voided
export const canVoidInvoice = (status: InvoiceStatus): boolean => {
    return !['void', 'paid'].includes(status);
};

// Helper to check if payment can be recorded
export const canRecordPayment = (status: InvoiceStatus): boolean => {
    return ['pending', 'sent', 'partial', 'overdue'].includes(status);
};

// Helper to check if invoice is overdue
export const isInvoiceOverdue = (dueDate: string, status: InvoiceStatus): boolean => {
    if (['paid', 'void', 'cancelled'].includes(status)) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
};

// Helper to calculate invoice totals from items
export const calculateInvoiceTotals = (items: InvoiceItemInput[]): {
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
} => {
    let subtotal = 0;
    let totalDiscount = 0;
    const totalTax = 0; // Tax would be calculated based on tax_rate_id lookup

    items.forEach(item => {
        const lineSubtotal = item.quantity * item.unit_price;
        let lineDiscount = item.discount_amount || 0;
        if (item.discount_percent) {
            lineDiscount += lineSubtotal * (item.discount_percent / 100);
        }
        subtotal += lineSubtotal;
        totalDiscount += lineDiscount;
    });

    return {
        subtotal,
        discount_amount: totalDiscount,
        tax_amount: totalTax,
        total: subtotal - totalDiscount + totalTax,
    };
};
