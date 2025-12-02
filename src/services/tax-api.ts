import type { ApiResponse } from '~/types/api';
import type {
    TaxRule,
    CreateTaxRuleInput,
    UpdateTaxRuleInput,
    TaxRate,
    CreateVendorTaxRateInput,
    UpdateVendorTaxRateInput,
} from '~/types/tax';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface ApiResponseData<T> {
    success?: boolean;
    data?: T;
    pagination_data?: {
        page: number;
        page_size: number;
        total_count: number;
        total_pages: number;
    };
    message?: string;
    error?: string;
}

async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit,
    token?: string
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options?.headers,
        },
    });

    const data = await response.json() as ApiResponseData<T>;

    if (!response.ok) {
        return {
            success: false,
            error_message: data.message || data.error || `HTTP ${response.status}`,
        };
    }

    return {
        success: true,
        data: data.data,
        pagination_data: data.pagination_data,
        message: data.message,
    };
}

// ====================================
// Admin Tax Rules (Legacy API)
// /api/admin/tax-rules
// ====================================

export const getTaxRules = async (token: string): Promise<ApiResponse<TaxRule[]>> => {
    return apiRequest<TaxRule[]>('/api/admin/tax-rules', {}, token);
};

export const getTaxRuleById = async (id: string, token: string): Promise<ApiResponse<TaxRule>> => {
    return apiRequest<TaxRule>(`/api/admin/tax-rules/${id}`, {}, token);
};

export const createTaxRule = async (
    data: CreateTaxRuleInput,
    token: string
): Promise<ApiResponse<TaxRule>> => {
    return apiRequest<TaxRule>('/api/admin/tax-rules', {
        method: 'POST',
        body: JSON.stringify(data),
    }, token);
};

export const updateTaxRule = async (
    id: string,
    data: UpdateTaxRuleInput,
    token: string
): Promise<ApiResponse<TaxRule>> => {
    return apiRequest<TaxRule>(`/api/admin/tax-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, token);
};

export const deleteTaxRule = async (id: string, token: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/api/admin/tax-rules/${id}`, {
        method: 'DELETE',
    }, token);
};

export const toggleTaxRuleStatus = async (
    id: string,
    isActive: boolean,
    token: string
): Promise<ApiResponse<TaxRule>> => {
    return apiRequest<TaxRule>(`/api/admin/tax-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    }, token);
};

// ====================================
// Vendor Tax Rates (New API)
// /api/vendor/tax-rates
// ====================================

export const getVendorTaxRates = async (token: string): Promise<ApiResponse<TaxRate[]>> => {
    return apiRequest<TaxRate[]>('/api/vendor/tax-rates', {}, token);
};

export const getVendorTaxRateById = async (id: string, token: string): Promise<ApiResponse<TaxRate>> => {
    return apiRequest<TaxRate>(`/api/vendor/tax-rates/${id}`, {}, token);
};

export const createVendorTaxRate = async (
    data: CreateVendorTaxRateInput,
    token: string
): Promise<ApiResponse<TaxRate>> => {
    return apiRequest<TaxRate>('/api/vendor/tax-rates', {
        method: 'POST',
        body: JSON.stringify(data),
    }, token);
};

export const updateVendorTaxRate = async (
    id: string,
    data: UpdateVendorTaxRateInput,
    token: string
): Promise<ApiResponse<TaxRate>> => {
    return apiRequest<TaxRate>(`/api/vendor/tax-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, token);
};

export const deleteVendorTaxRate = async (id: string, token: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/api/vendor/tax-rates/${id}`, {
        method: 'DELETE',
    }, token);
};
