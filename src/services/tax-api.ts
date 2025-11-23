const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface TaxRulesResponse {
    success: boolean;
    data: any[];
    pagination?: {
        page: number;
        page_size: number;
        total_count: number;
        total_pages: number;
    };
}

export const getTaxRules = async (token: string): Promise<TaxRulesResponse> => {
    const response = await fetch(`${API_URL}/api/admin/tax-rules`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch tax rules');
    }

    return response.json();
};

export const createTaxRule = async (data: any, token: string) => {
    const response = await fetch(`${API_URL}/api/admin/tax-rules`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tax rule');
    }

    return response.json();
};

export const updateTaxRule = async (id: string, data: any, token: string) => {
    const response = await fetch(`${API_URL}/api/admin/tax-rules/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tax rule');
    }

    return response.json();
};

export const deleteTaxRule = async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/api/admin/tax-rules/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tax rule');
    }

    return response.json();
};
