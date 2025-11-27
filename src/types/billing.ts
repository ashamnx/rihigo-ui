// Billing Settings Types
import type { PaymentMethod } from './payment';

export interface VendorBillingSettings {
    id: string;
    vendor_id: string;

    // Numbering
    invoice_prefix: string;
    invoice_next_number: number;
    quotation_prefix: string;
    quotation_next_number: number;
    receipt_prefix: string;
    receipt_next_number: number;

    // Defaults
    default_currency: string;
    default_payment_terms_days: number;
    default_quotation_validity_days: number;

    // Tax
    tax_registration_number?: string;
    is_tax_inclusive_pricing: boolean;

    // Content
    invoice_header?: string;
    invoice_footer?: string;
    payment_instructions?: string;

    // Bank
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    bank_swift_code?: string;
    bank_iban?: string;

    // Automation
    auto_generate_invoice_on_booking: boolean;
    auto_send_invoice_on_generation: boolean;
    send_payment_reminders: boolean;
    reminder_days_before_due: number[];

    created_at: string;
    updated_at: string;
}

export interface BillingSettingsInput {
    // Numbering
    invoice_prefix?: string;
    invoice_next_number?: number;
    quotation_prefix?: string;
    quotation_next_number?: number;
    receipt_prefix?: string;
    receipt_next_number?: number;

    // Defaults
    default_currency?: string;
    default_payment_terms_days?: number;
    default_quotation_validity_days?: number;

    // Tax
    tax_registration_number?: string;
    is_tax_inclusive_pricing?: boolean;

    // Content
    invoice_header?: string;
    invoice_footer?: string;
    payment_instructions?: string;

    // Bank
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    bank_swift_code?: string;
    bank_iban?: string;

    // Automation
    auto_generate_invoice_on_booking?: boolean;
    auto_send_invoice_on_generation?: boolean;
    send_payment_reminders?: boolean;
    reminder_days_before_due?: number[];
}

export interface VendorPaymentMethod {
    id: string;
    vendor_id: string;
    method_type: PaymentMethod;
    provider?: string;
    display_name: string;
    is_enabled: boolean;
    is_default: boolean;
    credentials?: Record<string, unknown>; // encrypted in backend
    settings?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodInput {
    method_type: PaymentMethod;
    provider?: string;
    display_name: string;
    is_enabled?: boolean;
    is_default?: boolean;
    credentials?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}

// Common currencies
export const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

// Payment term options
export const PAYMENT_TERMS_OPTIONS = [
    { days: 0, label: 'Due on Receipt' },
    { days: 7, label: 'Net 7' },
    { days: 14, label: 'Net 14' },
    { days: 30, label: 'Net 30' },
    { days: 45, label: 'Net 45' },
    { days: 60, label: 'Net 60' },
];

// Quotation validity options
export const QUOTATION_VALIDITY_OPTIONS = [
    { days: 7, label: '7 days' },
    { days: 14, label: '14 days' },
    { days: 30, label: '30 days' },
    { days: 60, label: '60 days' },
    { days: 90, label: '90 days' },
];

// Reminder day options
export const REMINDER_DAY_OPTIONS = [
    { days: 1, label: '1 day before' },
    { days: 3, label: '3 days before' },
    { days: 7, label: '7 days before' },
    { days: 14, label: '14 days before' },
];

// Payment providers
export const PAYMENT_PROVIDERS: Record<PaymentMethod, { value: string; label: string }[]> = {
    cash: [],
    card: [
        { value: 'stripe', label: 'Stripe' },
        { value: 'square', label: 'Square' },
    ],
    bank_transfer: [
        { value: 'bml', label: 'Bank of Maldives' },
        { value: 'mib', label: 'Maldives Islamic Bank' },
    ],
    online: [
        { value: 'stripe', label: 'Stripe' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'bml', label: 'BML Pay' },
    ],
    wallet: [
        { value: 'fahipay', label: 'FahiPay' },
    ],
    other: [],
};

// Helper to format currency
export const formatCurrency = (amount: number, currency: string): string => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol} ${amount.toFixed(2)}`;
};

// Helper to get currency symbol
export const getCurrencySymbol = (currency: string): string => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    return currencyInfo?.symbol || currency;
};

// Helper to generate next document number
export const generateDocumentNumber = (prefix: string, nextNumber: number): string => {
    const year = new Date().getFullYear();
    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}-${year}-${paddedNumber}`;
};

// Default billing settings
export const DEFAULT_BILLING_SETTINGS: Partial<VendorBillingSettings> = {
    invoice_prefix: 'INV',
    invoice_next_number: 1,
    quotation_prefix: 'QUO',
    quotation_next_number: 1,
    receipt_prefix: 'REC',
    receipt_next_number: 1,
    default_currency: 'USD',
    default_payment_terms_days: 7,
    default_quotation_validity_days: 14,
    is_tax_inclusive_pricing: false,
    auto_generate_invoice_on_booking: false,
    auto_send_invoice_on_generation: false,
    send_payment_reminders: true,
    reminder_days_before_due: [7, 3, 1],
};
