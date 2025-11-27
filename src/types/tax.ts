// Tax Configuration Types
import type { ServiceType } from './resource';

// Legacy types (keep for backwards compatibility)
export interface TaxRule {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed_per_person';
  booking_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRuleInput {
  name: string;
  rate: number;
  type: 'percentage' | 'fixed_per_person';
  booking_type?: string;
}

export interface BookingTax {
  id: string;
  booking_id: string;
  tax_rule_id?: string;
  name: string;
  rate: number;
  amount: number;
  created_at: string;
}

// New Vendor Tax Types
export type TaxRateType = 'percentage' | 'fixed_per_unit' | 'fixed_per_booking';

export interface TaxRate {
    id: string;
    vendor_id?: string; // null = system-wide
    name: string;
    code: string;
    rate: number;
    rate_type: TaxRateType;
    applies_to: ServiceType[];
    applies_to_foreigners_only: boolean;
    effective_from: string;
    effective_to?: string;
    is_active: boolean;
    is_inclusive: boolean;
    show_on_invoice: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface VendorTaxSetting {
    id: string;
    vendor_id: string;
    tax_rate_id: string;
    tax_rate?: TaxRate;
    is_enabled: boolean;
    override_rate?: number;
}

export type TaxExemptionType = 'guest_nationality' | 'booking_type' | 'promo_code';

export interface TaxExemptionConditions {
    nationalities?: string[];
    booking_types?: string[];
    promo_codes?: string[];
}

export interface TaxExemption {
    id: string;
    vendor_id: string;
    tax_rate_id: string;
    tax_rate?: TaxRate;
    exemption_type: TaxExemptionType;
    conditions: TaxExemptionConditions;
    valid_from?: string;
    valid_to?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TaxExemptionInput {
    tax_rate_id: string;
    exemption_type: TaxExemptionType;
    conditions: TaxExemptionConditions;
    valid_from?: string;
    valid_to?: string;
    is_active?: boolean;
}

export interface TaxSettingInput {
    tax_rate_id: string;
    is_enabled: boolean;
    override_rate?: number;
}

export interface TaxCalculationInput {
    service_type: ServiceType;
    amount: number;
    guest_nationality?: string;
    is_foreigner?: boolean;
    nights?: number;
    guests?: number;
    promo_code?: string;
}

export interface TaxCalculationItem {
    tax_id: string;
    tax_name: string;
    tax_code: string;
    rate: number;
    rate_type: TaxRateType;
    amount: number;
    is_inclusive: boolean;
}

export interface TaxCalculationResult {
    taxes: TaxCalculationItem[];
    total_tax: number;
    total_with_tax: number;
    taxable_amount: number;
}

// Maldives-specific tax rates (for reference)
export const MALDIVES_TAX_RATES = {
    TGST: {
        name: 'Tourism Goods and Services Tax',
        code: 'TGST',
        rate: 16,
        rate_type: 'percentage' as TaxRateType,
    },
    GREEN_TAX: {
        name: 'Green Tax',
        code: 'GT',
        rate: 6,
        rate_type: 'fixed_per_unit' as TaxRateType, // Per night
    },
    SERVICE_CHARGE: {
        name: 'Service Charge',
        code: 'SC',
        rate: 10,
        rate_type: 'percentage' as TaxRateType,
    },
};

// Display helpers
export const taxRateTypeLabels: Record<TaxRateType, string> = {
    percentage: 'Percentage',
    fixed_per_unit: 'Fixed Per Unit',
    fixed_per_booking: 'Fixed Per Booking',
};

export const taxExemptionTypeLabels: Record<TaxExemptionType, string> = {
    guest_nationality: 'Guest Nationality',
    booking_type: 'Booking Type',
    promo_code: 'Promo Code',
};

// Helper to format tax rate display
export const formatTaxRate = (rate: number, rateType: TaxRateType, currency?: string): string => {
    switch (rateType) {
        case 'percentage':
            return `${rate}%`;
        case 'fixed_per_unit':
            return currency ? `${currency} ${rate}/night` : `${rate}/night`;
        case 'fixed_per_booking':
            return currency ? `${currency} ${rate}` : String(rate);
        default:
            return String(rate);
    }
};

// Helper to calculate tax amount
export const calculateTaxAmount = (
    taxRate: TaxRate,
    amount: number,
    nights: number = 1,
    guests: number = 1,
    overrideRate?: number
): number => {
    const rate = overrideRate ?? taxRate.rate;

    switch (taxRate.rate_type) {
        case 'percentage':
            return amount * (rate / 100);
        case 'fixed_per_unit':
            // For accommodation: per night per guest (like Green Tax)
            return rate * nights * guests;
        case 'fixed_per_booking':
            return rate;
        default:
            return 0;
    }
};

// Helper to check if tax applies
export const doesTaxApply = (
    taxRate: TaxRate,
    serviceType: ServiceType,
    isForeigner: boolean = true
): boolean => {
    // Check service type
    if (!taxRate.applies_to.includes(serviceType)) {
        return false;
    }

    // Check foreigner-only taxes
    if (taxRate.applies_to_foreigners_only && !isForeigner) {
        return false;
    }

    // Check if active and within effective dates
    if (!taxRate.is_active) {
        return false;
    }

    const now = new Date();
    if (taxRate.effective_from && new Date(taxRate.effective_from) > now) {
        return false;
    }
    if (taxRate.effective_to && new Date(taxRate.effective_to) < now) {
        return false;
    }

    return true;
};

// Helper to check if exemption applies
export const doesExemptionApply = (
    exemption: TaxExemption,
    nationality?: string,
    bookingType?: string,
    promoCode?: string
): boolean => {
    if (!exemption.is_active) return false;

    // Check validity dates
    const now = new Date();
    if (exemption.valid_from && new Date(exemption.valid_from) > now) {
        return false;
    }
    if (exemption.valid_to && new Date(exemption.valid_to) < now) {
        return false;
    }

    // Check conditions based on exemption type
    switch (exemption.exemption_type) {
        case 'guest_nationality':
            return !!nationality &&
                   !!exemption.conditions.nationalities &&
                   exemption.conditions.nationalities.includes(nationality);
        case 'booking_type':
            return !!bookingType &&
                   !!exemption.conditions.booking_types &&
                   exemption.conditions.booking_types.includes(bookingType);
        case 'promo_code':
            return !!promoCode &&
                   !!exemption.conditions.promo_codes &&
                   exemption.conditions.promo_codes.includes(promoCode);
        default:
            return false;
    }
};
