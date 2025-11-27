// Quotation Types
import type { Guest } from './guest';
import type { VendorResource, ServiceType } from './resource';

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type ItemType = 'accommodation' | 'service' | 'fee' | 'tax' | 'discount';
export type ItemUnit = 'night' | 'person' | 'unit' | 'trip' | 'hour' | 'item';

export interface QuotationItem {
    id: string;
    quotation_id: string;
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    tax_rate_id?: string;
    tax_amount: number;
    line_total: number;
    sort_order: number;

    // References
    resource_id?: string;
    service_id?: string;
    rate_plan_id?: string;
}

export interface Quotation {
    id: string;
    vendor_id: string;
    quotation_number: string;

    // Customer
    guest_id?: string;
    guest?: Guest;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_company?: string;

    // Dates
    issue_date: string;
    valid_until: string;

    // Service
    service_type?: ServiceType;
    resource_id?: string;
    resource?: VendorResource;
    activity_id?: string;
    start_date?: string;
    end_date?: string;
    adults?: number;
    children?: number;
    infants?: number;

    // Pricing
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    currency: string;

    // Items
    items: QuotationItem[];

    // Status
    status: QuotationStatus;
    sent_at?: string;
    viewed_at?: string;
    responded_at?: string;
    converted_to_booking_id?: string;

    // Content
    notes?: string;
    internal_notes?: string;
    terms_and_conditions?: string;

    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface QuotationFilters {
    search?: string;
    status?: QuotationStatus;
    date_from?: string;
    date_to?: string;
    guest_id?: string;
    page?: number;
    limit?: number;
}

export interface QuotationItemInput {
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    tax_rate_id?: string;
    sort_order?: number;
    resource_id?: string;
    service_id?: string;
    rate_plan_id?: string;
}

export interface QuotationCreateInput {
    // Customer
    guest_id?: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_company?: string;

    // Dates
    issue_date?: string;
    valid_until: string;

    // Service
    service_type?: ServiceType;
    resource_id?: string;
    activity_id?: string;
    start_date?: string;
    end_date?: string;
    adults?: number;
    children?: number;
    infants?: number;

    // Items
    items: QuotationItemInput[];

    // Currency
    currency?: string;

    // Content
    notes?: string;
    internal_notes?: string;
    terms_and_conditions?: string;
}

export interface QuotationUpdateInput extends Partial<QuotationCreateInput> {}

// Display helpers
export const quotationStatusLabels: Record<QuotationStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    converted: 'Converted',
};

export const quotationStatusColors: Record<QuotationStatus, string> = {
    draft: 'badge-ghost',
    sent: 'badge-info',
    viewed: 'badge-primary',
    accepted: 'badge-success',
    rejected: 'badge-error',
    expired: 'badge-warning',
    converted: 'badge-accent',
};

export const itemTypeLabels: Record<ItemType, string> = {
    accommodation: 'Accommodation',
    service: 'Service',
    fee: 'Fee',
    tax: 'Tax',
    discount: 'Discount',
};

export const itemUnitLabels: Record<ItemUnit, string> = {
    night: 'per night',
    person: 'per person',
    unit: 'per unit',
    trip: 'per trip',
    hour: 'per hour',
    item: 'each',
};

// Helper to calculate line total
export const calculateLineTotal = (
    quantity: number,
    unitPrice: number,
    discountPercent?: number,
    discountAmount?: number
): number => {
    let total = quantity * unitPrice;
    if (discountPercent) {
        total -= total * (discountPercent / 100);
    }
    if (discountAmount) {
        total -= discountAmount;
    }
    return Math.max(0, total);
};

// Helper to check if quotation is editable
export const isQuotationEditable = (status: QuotationStatus): boolean => {
    return status === 'draft';
};

// Helper to check if quotation can be sent
export const canSendQuotation = (status: QuotationStatus): boolean => {
    return status === 'draft' || status === 'sent';
};

// Helper to check if quotation can be converted
export const canConvertQuotation = (status: QuotationStatus): boolean => {
    return status === 'accepted';
};
