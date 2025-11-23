import type {RequestEventAction, RequestEventLoader} from '@builder.io/qwik-city';
import type {ApiResponse, PaginatedResponse} from '~/types/api';
import { Activity, Currency } from "~/types/activity";

/**
 * API client utility for making requests to the Go API
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Get JWT token from request event (session)
 * Auth.js stores the JWT token in the session cookie
 */
async function getAuthToken(requestEvent: RequestEventLoader | RequestEventAction): Promise<string | null> {
    try {
        const session: any | null = requestEvent.sharedMap.get('session');
        const sessionToken = session.accessToken;

        if (!sessionToken) {
            return null;
        }

        // The session token IS the JWT - return it directly
        return sessionToken;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Make an API request
 */
async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log('Making API request:', url, options);
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            console.log(response);
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('API response:', data);

        // API returns success field, just return as-is
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            error_message: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * API client methods
 */
export const apiClient = {
    /**
     * Health check
     */
    async health(): Promise<ApiResponse> {
        return apiRequest('/health');
    },

    /**
     * Activities
     */
    activities: {
        async list(page = 1, pageSize = 20): Promise<PaginatedResponse<Activity[]>> {
            return apiRequest(`/api/activities?page=${page}&page_size=${pageSize}`);
        },

        async getTop(lang = 'en'): Promise<ApiResponse<Activity[]>> {
            return apiRequest(`/api/activities/top?lang=${lang}`);
        },

        async listAdmin(page = 1, pageSize = 20, token: string, status?: string): Promise<PaginatedResponse> {
            const statusParam = status ? `&status=${status}` : '';
            return apiRequest(`/api/admin/activities?page=${page}&page_size=${pageSize}${statusParam}`, {}, token);
        },

        async getByIdAdmin(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/activities/${id}`, {}, token);
        },

        async getById(id: string): Promise<ApiResponse> {
            return apiRequest(`/api/activities/${id}`);
        },

        async create(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/admin/activities', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async update(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/activities/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/activities/${id}`, {
                method: 'DELETE',
            }, token);
        },

        // Activity packages
        packages: {
            async list(activityId: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/packages`, {}, token);
            },

            async create(activityId: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/packages`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(activityId: string, packageId: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/packages/${packageId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(activityId: string, packageId: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/packages/${packageId}`, {
                    method: 'DELETE',
                }, token);
            },
        },

        // Activity page layout
        layout: {
            async get(activityId: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/layout`, {}, token);
            },

            async save(activityId: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/activities/${activityId}/layout`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },
    },

    /**
     * Categories
     */
    categories: {
        async list(): Promise<ApiResponse> {
            return apiRequest('/api/categories');
        },

        async listAll(token: string): Promise<ApiResponse> {
            return apiRequest('/api/admin/categories', {}, token);
        },

        async getById(id: string): Promise<ApiResponse> {
            return apiRequest(`/api/categories/${id}`);
        },

        async create(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/admin/categories', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async update(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/categories/${id}`, {
                method: 'DELETE',
            }, token);
        },
    },

    /**
     * FAQs
     */
    faqs: {
        async list(page = 1, pageSize = 20): Promise<PaginatedResponse> {
            return apiRequest(`/api/faqs?page=${page}&page_size=${pageSize}`);
        },

        async listAdmin(token: string, page = 1, pageSize = 20): Promise<PaginatedResponse> {
            return apiRequest(`/api/admin/faqs?page=${page}&page_size=${pageSize}`, {}, token);
        },

        async getById(id: string): Promise<ApiResponse> {
            return apiRequest(`/api/faqs/${id}`);
        },

        async create(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/admin/faqs', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async update(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/faqs/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/faqs/${id}`, {
                method: 'DELETE',
            }, token);
        },
    },

    /**
     * Users
     */
    users: {
        async create(data: any): Promise<ApiResponse> {
            return apiRequest('/api/users', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        async getProfile(token: string): Promise<ApiResponse> {
            return apiRequest('/api/users/me', {}, token);
        },

        async updateProfile(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async getByEmail(email: string): Promise<ApiResponse> {
            return apiRequest(`/api/users/by-email?email=${encodeURIComponent(email)}`);
        },

        async list(page = 1, pageSize = 20, token: string): Promise<PaginatedResponse> {
            return apiRequest(`/api/admin/users?page=${page}&page_size=${pageSize}`, {}, token);
        },

        async getById(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/users/${id}`, {}, token);
        },

        async update(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/users/${id}`, {
                method: 'DELETE',
            }, token);
        },
    },

    /**
     * Bookings
     */
    bookings: {
        async create(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/bookings', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async list(page = 1, pageSize = 20, token: string): Promise<PaginatedResponse> {
            return apiRequest(`/api/bookings?page=${page}&page_size=${pageSize}`, {}, token);
        },

        async getById(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/bookings/${id}`, {}, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/bookings/${id}`, {
                method: 'DELETE',
            }, token);
        },

        async updateStatus(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/bookings/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },
    },
    currency: {
        async listAll(): Promise<ApiResponse<Currency[]>> {
            return apiRequest('/api/currencies');
        },
    }
};

/**
 * Helper to make authenticated API requests from route loaders/actions
 */
export async function authenticatedRequest<T = any>(
    requestEvent: RequestEventLoader | RequestEventAction,
    apiCall: (token: string) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
    const token = await getAuthToken(requestEvent);

    if (!token) {
        return {
            success: false,
            error_message: 'Authentication required',
        };
    }

    return apiCall(token);
}
