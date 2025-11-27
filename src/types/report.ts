// Report Types
import type { ServiceType } from './resource';
import type { PaymentMethod } from './payment';

// Common filter types
export interface ReportFilters {
    from_date?: string;
    to_date?: string;
    group_by?: 'day' | 'week' | 'month';
    resource_id?: string;
    service_type?: ServiceType;
    payment_method?: PaymentMethod;
}

// Dashboard metrics
export interface DashboardMetrics {
    revenue: {
        current_month: number;
        previous_month: number;
        change_percentage: number;
    };
    bookings: {
        current_month: number;
        previous_month: number;
        change_percentage: number;
    };
    average_booking_value: number;
    outstanding_invoices: {
        count: number;
        total: number;
    };
    occupancy_rate?: number;
    revenue_trend: {
        period: string;
        amount: number;
    }[];
    booking_sources: {
        source: string;
        count: number;
        percentage: number;
    }[];
}

// Revenue report
export interface RevenueReportData {
    summary: {
        total_revenue: number;
        commission_paid: number;
        net_revenue: number;
        average_daily_revenue: number;
        total_bookings: number;
    };
    trend: {
        period: string;
        revenue: number;
        bookings: number;
    }[];
    by_source: {
        source: string;
        revenue: number;
        bookings: number;
        percentage: number;
    }[];
    by_resource: {
        resource_id: string;
        resource_name: string;
        revenue: number;
        bookings: number;
    }[];
    by_service_type: {
        service_type: ServiceType;
        revenue: number;
        bookings: number;
        percentage: number;
    }[];
}

// Payments report
export interface PaymentsReportData {
    summary: {
        total_received: number;
        pending: number;
        failed: number;
        refunded: number;
    };
    by_method: {
        method: PaymentMethod;
        amount: number;
        count: number;
        percentage: number;
    }[];
    recent_payments: {
        id: string;
        date: string;
        amount: number;
        method: PaymentMethod;
        status: string;
        guest_name: string;
        booking_ref?: string;
    }[];
}

// Occupancy report
export interface OccupancyReportData {
    summary: {
        overall_occupancy_rate: number;
        average_daily_rate: number;
        rev_par: number;
        total_room_nights: number;
        occupied_nights: number;
    };
    by_date: {
        date: string;
        occupancy_rate: number;
        available: number;
        occupied: number;
    }[];
    by_resource: {
        resource_id: string;
        resource_name: string;
        occupancy_rate: number;
        adr: number;
        revenue: number;
    }[];
}

// Tax report
export interface TaxReportData {
    summary: {
        total_taxable_amount: number;
        total_tax_collected: number;
    };
    by_tax_type: {
        tax_code: string;
        tax_name: string;
        taxable_amount: number;
        tax_amount: number;
    }[];
    invoices: {
        invoice_number: string;
        date: string;
        guest_name: string;
        company_name?: string;
        taxable_amount: number;
        taxes: {
            code: string;
            amount: number;
        }[];
        total_tax: number;
    }[];
}

// Date range presets
export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
];

// Helper to get date range from preset
export const getDateRangeFromPreset = (preset: DateRangePreset): { from: string; to: string } => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
        case 'today':
            return { from: formatDate(today), to: formatDate(today) };
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { from: formatDate(yesterday), to: formatDate(yesterday) };
        }
        case 'this_week': {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return { from: formatDate(startOfWeek), to: formatDate(today) };
        }
        case 'last_week': {
            const startOfLastWeek = new Date(today);
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            return { from: formatDate(startOfLastWeek), to: formatDate(endOfLastWeek) };
        }
        case 'this_month': {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: formatDate(startOfMonth), to: formatDate(today) };
        }
        case 'last_month': {
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return { from: formatDate(startOfLastMonth), to: formatDate(endOfLastMonth) };
        }
        case 'this_quarter': {
            const quarter = Math.floor(today.getMonth() / 3);
            const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
            return { from: formatDate(startOfQuarter), to: formatDate(today) };
        }
        case 'last_quarter': {
            const currentQuarter = Math.floor(today.getMonth() / 3);
            const startOfLastQuarter = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
            const endOfLastQuarter = new Date(today.getFullYear(), currentQuarter * 3, 0);
            return { from: formatDate(startOfLastQuarter), to: formatDate(endOfLastQuarter) };
        }
        case 'this_year': {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            return { from: formatDate(startOfYear), to: formatDate(today) };
        }
        case 'last_year': {
            const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
            return { from: formatDate(startOfLastYear), to: formatDate(endOfLastYear) };
        }
        default:
            return { from: formatDate(today), to: formatDate(today) };
    }
};

// Format currency for reports
export const formatReportCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
};

// Calculate change percentage
export const calculateChangePercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Group by options
export const GROUP_BY_OPTIONS: { value: string; label: string }[] = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
];
