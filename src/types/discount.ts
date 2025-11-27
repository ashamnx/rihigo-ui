// Discount & Promotions Types
import type { ServiceType } from './resource';

export type DiscountType = 'percentage' | 'fixed' | 'free_nights' | 'free_service';
export type DiscountStatus = 'active' | 'paused' | 'expired' | 'depleted';

export interface DiscountApplicability {
    service_types?: ServiceType[];
    resource_ids?: string[];
    rate_plans?: string[];
}

export interface DiscountRule {
    id: string;
    vendor_id: string;
    code?: string;
    name: string;
    description?: string;

    // Value
    discount_type: DiscountType;
    discount_value: number;
    max_discount_amount?: number;

    // Applicability
    applies_to?: DiscountApplicability;
    min_nights?: number;
    min_amount?: number;
    min_guests?: number;

    // Validity
    booking_start_date?: string;
    booking_end_date?: string;
    stay_start_date?: string;
    stay_end_date?: string;
    valid_days_of_week?: number[]; // 0-6 (Sunday-Saturday)

    // Limits
    usage_limit?: number;
    usage_per_guest?: number;
    current_usage: number;

    // Stacking
    is_combinable: boolean;
    priority: number;

    // Status
    status: DiscountStatus;
    is_automatic: boolean;

    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface DiscountUsage {
    id: string;
    discount_rule_id: string;
    booking_id: string;
    guest_id?: string;
    discount_amount: number;
    applied_at: string;
    applied_by?: string;
}

export interface DiscountFilters {
    search?: string;
    status?: DiscountStatus;
    discount_type?: DiscountType;
    is_automatic?: boolean;
    has_code?: boolean;
    page?: number;
    limit?: number;
}

export interface DiscountCreateInput {
    code?: string;
    name: string;
    description?: string;

    // Value
    discount_type: DiscountType;
    discount_value: number;
    max_discount_amount?: number;

    // Applicability
    applies_to?: DiscountApplicability;
    min_nights?: number;
    min_amount?: number;
    min_guests?: number;

    // Validity
    booking_start_date?: string;
    booking_end_date?: string;
    stay_start_date?: string;
    stay_end_date?: string;
    valid_days_of_week?: number[];

    // Limits
    usage_limit?: number;
    usage_per_guest?: number;

    // Stacking
    is_combinable?: boolean;
    priority?: number;

    // Status
    is_automatic?: boolean;
}

export interface DiscountUpdateInput extends Partial<DiscountCreateInput> {
    status?: DiscountStatus;
}

// Validation types
export interface DiscountValidationInput {
    code?: string;
    service_type: ServiceType;
    resource_id?: string;
    booking_date: string;
    stay_start_date: string;
    stay_end_date: string;
    nights: number;
    subtotal: number;
    guests: number;
    guest_id?: string;
}

export interface DiscountValidation {
    is_valid: boolean;
    error_message?: string;
    discount_amount?: number;
    discount_rule?: DiscountRule;
}

// Display helpers
export const discountTypeLabels: Record<DiscountType, string> = {
    percentage: 'Percentage Off',
    fixed: 'Fixed Amount Off',
    free_nights: 'Free Nights',
    free_service: 'Free Service',
};

export const discountStatusLabels: Record<DiscountStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    expired: 'Expired',
    depleted: 'Depleted',
};

export const discountStatusColors: Record<DiscountStatus, string> = {
    active: 'badge-success',
    paused: 'badge-warning',
    expired: 'badge-ghost',
    depleted: 'badge-error',
};

export const dayOfWeekLabels: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
};

export const dayOfWeekShortLabels: Record<number, string> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
};

// Helper to format discount value
export const formatDiscountValue = (type: DiscountType, value: number, currency?: string): string => {
    switch (type) {
        case 'percentage':
            return `${value}%`;
        case 'fixed':
            return currency ? `${currency} ${value.toFixed(2)}` : value.toFixed(2);
        case 'free_nights':
            return `${value} night${value > 1 ? 's' : ''} free`;
        case 'free_service':
            return 'Free service';
        default:
            return String(value);
    }
};

// Helper to check if discount is editable
export const isDiscountEditable = (status: DiscountStatus): boolean => {
    return ['active', 'paused'].includes(status);
};

// Helper to calculate discount amount
export const calculateDiscountAmount = (
    type: DiscountType,
    value: number,
    subtotal: number,
    maxAmount?: number
): number => {
    let amount = 0;

    switch (type) {
        case 'percentage':
            amount = subtotal * (value / 100);
            break;
        case 'fixed':
            amount = value;
            break;
        case 'free_nights':
            // Would need nightly rate to calculate
            amount = 0;
            break;
        case 'free_service':
            // Would need service price to calculate
            amount = 0;
            break;
    }

    // Apply max discount cap if set
    if (maxAmount && amount > maxAmount) {
        amount = maxAmount;
    }

    // Don't exceed subtotal
    return Math.min(amount, subtotal);
};

// Helper to check usage limits
export const hasUsageRemaining = (rule: DiscountRule): boolean => {
    if (!rule.usage_limit) return true;
    return rule.current_usage < rule.usage_limit;
};

// Helper to check if discount is within validity period
export const isWithinValidityPeriod = (
    rule: DiscountRule,
    bookingDate: Date,
    stayDate: Date
): boolean => {
    // Check booking window
    if (rule.booking_start_date && bookingDate < new Date(rule.booking_start_date)) {
        return false;
    }
    if (rule.booking_end_date && bookingDate > new Date(rule.booking_end_date)) {
        return false;
    }

    // Check stay dates
    if (rule.stay_start_date && stayDate < new Date(rule.stay_start_date)) {
        return false;
    }
    if (rule.stay_end_date && stayDate > new Date(rule.stay_end_date)) {
        return false;
    }

    // Check day of week
    if (rule.valid_days_of_week && rule.valid_days_of_week.length > 0) {
        if (!rule.valid_days_of_week.includes(stayDate.getDay())) {
            return false;
        }
    }

    return true;
};
