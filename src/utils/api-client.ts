import type {RequestEventAction, RequestEventLoader} from '@builder.io/qwik-city';
import type {ApiResponse, PaginatedResponse} from '~/types/api';
import type { Activity, Currency } from "~/types/activity";
import type {
    Ticket,
    TicketMessage,
    TicketSummary,
    TicketFilters,
    CreateTicketInput,
    GuestCreateTicketInput,
    UpdateTicketInput,
    UpdateTicketStatusInput,
    AssignTicketInput,
    AddTicketMessageInput,
    GuestAddMessageInput,
} from '~/types/ticket';
import type {
    ImugaDeclaration,
    ImugaTraveler,
    ImugaRequest,
    CreateImugaRequestInput,
    CreateDeclarationInput,
    UpdateDeclarationInput,
    AddTravelerInput,
    ProcessRequestInput,
    DeclarationFilters,
    RequestFilters,
    ImugaDeclarationStatus,
    ImugaExportData,
    ValidationResult,
} from '~/types/imuga';
import type {
    Notification,
    NotificationFilters,
    NotificationPreferences,
    NotificationStats,
    PushDevice,
    RegisterDeviceRequest,
    CreateNotificationRequest,
    BroadcastNotificationRequest,
    BroadcastResponse,
    UnreadCountResponse,
} from '~/types/notification';

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
        console.log('Making API request:', url, options, headers);
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            console.log(response);
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json() as ApiResponse<T>;
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
    },

    /**
     * Support - Public/Guest Routes (No Auth Required)
     */
    support: {
        /**
         * Guest creates a ticket
         */
        async createTicket(data: GuestCreateTicketInput): Promise<ApiResponse<Ticket>> {
            return apiRequest('/api/support/tickets', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        /**
         * Guest views ticket by ticket number (requires email query param)
         */
        async getTicket(ticketNumber: string, email: string): Promise<ApiResponse<Ticket>> {
            return apiRequest(`/api/support/tickets/${ticketNumber}?email=${encodeURIComponent(email)}`);
        },

        /**
         * Guest adds message to ticket
         */
        async addMessage(ticketNumber: string, data: GuestAddMessageInput): Promise<ApiResponse<TicketMessage>> {
            return apiRequest(`/api/support/tickets/${ticketNumber}/messages`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
    },

    /**
     * Tickets - User Routes (Auth Required)
     */
    tickets: {
        /**
         * User creates a ticket
         */
        async create(data: CreateTicketInput, token: string): Promise<ApiResponse<Ticket>> {
            return apiRequest('/api/tickets', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * User lists their tickets
         */
        async list(token: string, filters?: {
            page?: number;
            page_size?: number;
            status?: string;
        }): Promise<ApiResponse<Ticket[]>> {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.page_size) params.append('page_size', filters.page_size.toString());
            if (filters?.status) params.append('status', filters.status);
            const queryString = params.toString();
            return apiRequest(`/api/tickets${queryString ? '?' + queryString : ''}`, {}, token);
        },

        /**
         * User views their ticket
         */
        async getById(id: string, token: string): Promise<ApiResponse<Ticket>> {
            return apiRequest(`/api/tickets/${id}`, {}, token);
        },

        /**
         * User adds message to their ticket
         */
        async addMessage(id: string, data: AddTicketMessageInput, token: string): Promise<ApiResponse<TicketMessage>> {
            return apiRequest(`/api/tickets/${id}/messages`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },
    },

    /**
     * Islands
     */
    islands: {
        async list(atollId?: number, type?: string): Promise<ApiResponse> {
            const params = new URLSearchParams();
            if (atollId) params.append('atoll_id', atollId.toString());
            if (type) params.append('type', type);
            const queryString = params.toString();
            return apiRequest(`/api/islands${queryString ? '?' + queryString : ''}`);
        },
    },

    /**
     * Notifications - User Routes (Auth Required)
     */
    notifications: {
        /**
         * List user's notifications with pagination and filtering
         */
        async list(token: string, filters?: NotificationFilters): Promise<ApiResponse<Notification[]>> {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.page_size) params.append('page_size', filters.page_size.toString());
            if (filters?.type) params.append('type', filters.type);
            if (filters?.is_read !== undefined) params.append('is_read', String(filters.is_read));
            const queryString = params.toString();
            return apiRequest(`/api/notifications${queryString ? '?' + queryString : ''}`, {}, token);
        },

        /**
         * Get count of unread notifications (for badge display)
         */
        async getUnreadCount(token: string): Promise<ApiResponse<UnreadCountResponse>> {
            return apiRequest('/api/notifications/unread-count', {}, token);
        },

        /**
         * Get a specific notification
         */
        async getById(id: string, token: string): Promise<ApiResponse<Notification>> {
            return apiRequest(`/api/notifications/${id}`, {}, token);
        },

        /**
         * Mark a notification as read
         */
        async markAsRead(id: string, token: string): Promise<ApiResponse<{ message: string }>> {
            return apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' }, token);
        },

        /**
         * Mark all notifications as read
         */
        async markAllAsRead(token: string): Promise<ApiResponse<{ message: string }>> {
            return apiRequest('/api/notifications/read-all', { method: 'PUT' }, token);
        },

        /**
         * Delete a notification
         */
        async delete(id: string, token: string): Promise<ApiResponse<{ message: string }>> {
            return apiRequest(`/api/notifications/${id}`, { method: 'DELETE' }, token);
        },

        /**
         * Notification Preferences
         */
        preferences: {
            /**
             * Get user's notification preferences
             */
            async get(token: string): Promise<ApiResponse<NotificationPreferences>> {
                return apiRequest('/api/notifications/preferences', {}, token);
            },

            /**
             * Update user's notification preferences
             */
            async update(data: Partial<NotificationPreferences>, token: string): Promise<ApiResponse<NotificationPreferences>> {
                return apiRequest('/api/notifications/preferences', {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },

        /**
         * Push Device Management
         */
        devices: {
            /**
             * Register a device for push notifications (FCM)
             */
            async register(data: RegisterDeviceRequest, token: string): Promise<ApiResponse<PushDevice>> {
                return apiRequest('/api/notifications/devices', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Unregister a device from push notifications
             */
            async unregister(deviceToken: string, token: string): Promise<ApiResponse<{ message: string }>> {
                return apiRequest(`/api/notifications/devices/${encodeURIComponent(deviceToken)}`, {
                    method: 'DELETE',
                }, token);
            },
        },

        /**
         * Telegram Integration
         */
        telegram: {
            /**
             * Link Telegram account for notifications
             */
            async link(chatId: string, token: string): Promise<ApiResponse<{ message: string }>> {
                return apiRequest('/api/notifications/telegram/link', {
                    method: 'POST',
                    body: JSON.stringify({ chat_id: chatId }),
                }, token);
            },
        },
    },

    /**
     * Vendors (Admin only)
     */
    vendors: {
        async list(page = 1, pageSize = 20, token: string): Promise<PaginatedResponse> {
            return apiRequest(`/api/admin/vendors?page=${page}&page_size=${pageSize}`, {}, token);
        },

        async getById(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${id}`, {}, token);
        },

        async create(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/admin/vendors', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async update(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async delete(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${id}`, {
                method: 'DELETE',
            }, token);
        },

        // Verify vendor
        async verify(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${id}/verify`, {
                method: 'POST',
            }, token);
        },

        // Update vendor status
        async updateStatus(id: string, status: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }, token);
        },

        // Vendor Staff Management
        async getStaff(vendorId: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/staff`, {}, token);
        },

        async addStaff(vendorId: string, data: { user_email: string; role: string }, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/staff`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        // Vendor Activity Logs
        async getLogs(vendorId: string, token: string, page = 1, pageSize = 20): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/logs?page=${page}&page_size=${pageSize}`, {}, token);
        },

        // Legacy user management methods (kept for backward compatibility, but use staff methods instead)
        async getUsers(vendorId: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/staff`, {}, token);
        },

        async addUser(vendorId: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/staff`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async updateUser(vendorId: string, userId: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async removeUser(vendorId: string, userId: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/admin/vendors/${vendorId}/users/${userId}`, {
                method: 'DELETE',
            }, token);
        },
    },

    /**
     * Admin Users
     */
    admin: {
        users: {
            async list(page = 1, pageSize = 20, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/users?page=${page}&page_size=${pageSize}`, {}, token);
            },
        },
        /**
         * Admin Notifications Management
         */
        notifications: {
            /**
             * Create a notification for a specific user
             */
            async create(data: CreateNotificationRequest, token: string): Promise<ApiResponse<Notification>> {
                return apiRequest('/api/admin/notifications', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Broadcast notification to multiple users or all users
             */
            async broadcast(data: BroadcastNotificationRequest, token: string): Promise<ApiResponse<BroadcastResponse>> {
                return apiRequest('/api/admin/notifications/broadcast', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Get notification delivery statistics
             */
            async getStats(token: string, userId?: string): Promise<ApiResponse<NotificationStats>> {
                const params = new URLSearchParams();
                if (userId) params.append('user_id', userId);
                const queryString = params.toString();
                return apiRequest(`/api/admin/notifications/stats${queryString ? '?' + queryString : ''}`, {}, token);
            },
        },
        bookings: {
            async list(token: string, filters?: {
                page?: number;
                page_size?: number;
                status?: string;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.page_size) params.append('page_size', filters.page_size.toString());
                if (filters?.status) params.append('status', filters.status);
                const queryString = params.toString();
                return apiRequest(`/api/admin/bookings${queryString ? '?' + queryString : ''}`, {}, token);
            },
            async updateStatus(id: string, data: { status: string; payment_status?: string }, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/admin/bookings/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },
        tickets: {
            /**
             * List all tickets with filters
             */
            async list(token: string, filters?: TicketFilters): Promise<ApiResponse<Ticket[]>> {
                const params = new URLSearchParams();
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.page_size) params.append('page_size', filters.page_size.toString());
                if (filters?.status) params.append('status', filters.status);
                if (filters?.priority) params.append('priority', filters.priority);
                if (filters?.category) params.append('category', filters.category);
                if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
                if (filters?.assigned_vendor_id) params.append('assigned_vendor_id', filters.assigned_vendor_id);
                if (filters?.search) params.append('search', filters.search);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                const queryString = params.toString();
                return apiRequest(`/api/admin/tickets${queryString ? '?' + queryString : ''}`, {}, token);
            },

            /**
             * Get ticket statistics
             */
            async getSummary(token: string): Promise<ApiResponse<TicketSummary>> {
                return apiRequest('/api/admin/tickets/summary', {}, token);
            },

            /**
             * View any ticket
             */
            async getById(id: string, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/admin/tickets/${id}`, {}, token);
            },

            /**
             * Update ticket (priority, category)
             */
            async update(id: string, data: UpdateTicketInput, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/admin/tickets/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Assign ticket to admin or vendor
             */
            async assign(id: string, data: AssignTicketInput, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/admin/tickets/${id}/assign`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Add message (can be internal)
             */
            async addMessage(id: string, data: AddTicketMessageInput, token: string): Promise<ApiResponse<TicketMessage>> {
                return apiRequest(`/api/admin/tickets/${id}/messages`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Update ticket status
             */
            async updateStatus(id: string, data: UpdateTicketStatusInput, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/admin/tickets/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },
    },

    /**
     * Vendor Portal (Vendor-specific routes)
     */
    vendorPortal: {
        // Vendor Profile
        async getProfile(token: string): Promise<ApiResponse> {
            return apiRequest('/api/vendor/profile', {}, token);
        },

        // Vendor Activities
        async getActivities(token: string, filters?: { status?: string; page?: number; page_size?: number }): Promise<ApiResponse> {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.page_size) params.append('page_size', filters.page_size.toString());
            const queryString = params.toString();
            return apiRequest(`/api/vendor/activities${queryString ? '?' + queryString : ''}`, {}, token);
        },

        async getActivityById(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${id}`, {}, token);
        },

        async createActivity(data: any, token: string): Promise<ApiResponse> {
            return apiRequest('/api/vendor/activities', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async updateActivity(id: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async deleteActivity(id: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${id}`, {
                method: 'DELETE',
            }, token);
        },

        // Vendor Activity Packages
        async getActivityPackages(activityId: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${activityId}/packages`, {}, token);
        },

        async createActivityPackage(activityId: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${activityId}/packages`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        async updateActivityPackage(activityId: string, packageId: string, data: any, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${activityId}/packages/${packageId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        async deleteActivityPackage(activityId: string, packageId: string, token: string): Promise<ApiResponse> {
            return apiRequest(`/api/vendor/activities/${activityId}/packages/${packageId}`, {
                method: 'DELETE',
            }, token);
        },

        // Vendor Bookings
        bookings: {
            async list(token: string, filters?: {
                search?: string;
                source_type?: string;
                status?: string;
                payment_status?: string;
                date_from?: string;
                date_to?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.source_type) params.append('source_type', filters.source_type);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.payment_status) params.append('payment_status', filters.payment_status);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/bookings${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/bookings', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async updateStatus(id: string, data: { status: string; notes?: string }, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async confirm(id: string, data: { notes?: string }, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/${id}/confirm`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async getCalendar(startDate: string, endDate: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/bookings/calendar?start_date=${startDate}&end_date=${endDate}`, {}, token);
            },
        },

        // Vendor Staff
        staff: {
            async list(token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/staff', {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/staff/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/staff', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/staff/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/staff/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async toggleStatus(id: string, isActive: boolean, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/staff/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ is_active: isActive }),
                }, token);
            },
        },

        // Keep backward compatibility
        async getStaff(token: string): Promise<ApiResponse> {
            return apiRequest('/api/vendor/staff', {}, token);
        },

        // Vendor Reports
        async getBookingReports(token: string, filters?: { from_date?: string; to_date?: string }): Promise<ApiResponse> {
            const params = new URLSearchParams();
            if (filters?.from_date) params.append('from_date', filters.from_date);
            if (filters?.to_date) params.append('to_date', filters.to_date);
            const queryString = params.toString();
            return apiRequest(`/api/vendor/reports/bookings${queryString ? '?' + queryString : ''}`, {}, token);
        },

        // Guest Management
        guests: {
            async list(token: string, filters?: {
                search?: string;
                source_type?: string;
                loyalty_tier?: string;
                tags?: string[];
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.source_type) params.append('source_type', filters.source_type);
                if (filters?.loyalty_tier) params.append('loyalty_tier', filters.loyalty_tier);
                if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/guests${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/guests/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/guests', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/guests/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/guests/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async merge(primaryId: string, duplicateIds: string[], token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/guests/${primaryId}/merge`, {
                    method: 'POST',
                    body: JSON.stringify({ duplicate_ids: duplicateIds }),
                }, token);
            },

            async getHistory(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/guests/${id}/history`, {}, token);
            },
        },

        // Resource Management
        resources: {
            async list(token: string, filters?: {
                search?: string;
                service_type?: string;
                resource_type?: string;
                status?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.service_type) params.append('service_type', filters.service_type);
                if (filters?.resource_type) params.append('resource_type', filters.resource_type);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/resources${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/resources/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/resources', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/resources/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/resources/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async getAvailability(resourceId: string, startDate: string, endDate: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/resources/${resourceId}/availability?start_date=${startDate}&end_date=${endDate}`, {}, token);
            },

            async updateAvailability(resourceId: string, dates: any[], token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/resources/${resourceId}/availability`, {
                    method: 'PUT',
                    body: JSON.stringify({ dates }),
                }, token);
            },
        },

        // Quotations
        quotations: {
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                date_from?: string;
                date_to?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/quotations${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/quotations/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/quotations', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/quotations/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/quotations/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async send(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/quotations/${id}/send`, {
                    method: 'POST',
                }, token);
            },

            async convert(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/quotations/${id}/convert`, {
                    method: 'POST',
                }, token);
            },
        },

        // Invoices
        invoices: {
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                date_from?: string;
                date_to?: string;
                overdue_only?: boolean;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                if (filters?.overdue_only) params.append('overdue_only', 'true');
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/invoices${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/invoices/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/invoices', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/invoices/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async send(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/invoices/${id}/send`, {
                    method: 'POST',
                }, token);
            },

            async void(id: string, reason: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/invoices/${id}/void`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                }, token);
            },

            async createFromBooking(bookingId: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/invoices/from-booking/${bookingId}`, {
                    method: 'POST',
                }, token);
            },
        },

        // Payments
        payments: {
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                payment_method?: string;
                date_from?: string;
                date_to?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.payment_method) params.append('payment_method', filters.payment_method);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/payments${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/payments/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/payments', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async allocate(id: string, allocations: { invoice_id: string; amount: number }[], token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/payments/${id}/allocate`, {
                    method: 'POST',
                    body: JSON.stringify({ allocations }),
                }, token);
            },
        },

        // Refunds
        refunds: {
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                reason_type?: string;
                date_from?: string;
                date_to?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.reason_type) params.append('reason_type', filters.reason_type);
                if (filters?.date_from) params.append('date_from', filters.date_from);
                if (filters?.date_to) params.append('date_to', filters.date_to);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/refunds${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/refunds/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/refunds', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async approve(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/refunds/${id}/approve`, {
                    method: 'POST',
                }, token);
            },

            async reject(id: string, reason: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/refunds/${id}/reject`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                }, token);
            },

            async process(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/refunds/${id}/process`, {
                    method: 'POST',
                }, token);
            },
        },

        // Discounts
        discounts: {
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                discount_type?: string;
                is_automatic?: boolean;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.discount_type) params.append('discount_type', filters.discount_type);
                if (filters?.is_automatic !== undefined) params.append('is_automatic', String(filters.is_automatic));
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/discounts${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async get(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/discounts/${id}`, {}, token);
            },

            async create(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/discounts', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            async update(id: string, data: any, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/discounts/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },

            async delete(id: string, token: string): Promise<ApiResponse> {
                return apiRequest(`/api/vendor/discounts/${id}`, {
                    method: 'DELETE',
                }, token);
            },

            async validate(code: string, bookingData: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/discounts/validate', {
                    method: 'POST',
                    body: JSON.stringify({ code, ...bookingData }),
                }, token);
            },
        },

        // Billing Settings
        billingSettings: {
            async get(token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/billing-settings', {}, token);
            },

            async update(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/billing-settings', {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },

        // Tax Settings
        taxes: {
            async getRates(token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/tax-rates', {}, token);
            },

            async getSettings(token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/tax-settings', {}, token);
            },

            async updateSettings(settings: any[], token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/tax-settings', {
                    method: 'PUT',
                    body: JSON.stringify({ settings }),
                }, token);
            },

            async calculate(data: any, token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/tax/calculate', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },
        },

        // Reports
        reports: {
            async getDashboard(token: string): Promise<ApiResponse> {
                return apiRequest('/api/vendor/dashboard/overview', {}, token);
            },

            async getRevenue(filters: { from_date?: string; to_date?: string; group_by?: string }, token: string): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters.from_date) params.append('from_date', filters.from_date);
                if (filters.to_date) params.append('to_date', filters.to_date);
                if (filters.group_by) params.append('group_by', filters.group_by);
                const queryString = params.toString();
                return apiRequest(`/api/vendor/reports/revenue${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async getPaymentsReport(filters: { from_date?: string; to_date?: string }, token: string): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters.from_date) params.append('from_date', filters.from_date);
                if (filters.to_date) params.append('to_date', filters.to_date);
                const queryString = params.toString();
                return apiRequest(`/api/vendor/reports/payments${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async getOccupancy(filters: { from_date?: string; to_date?: string; resource_id?: string }, token: string): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters.from_date) params.append('from_date', filters.from_date);
                if (filters.to_date) params.append('to_date', filters.to_date);
                if (filters.resource_id) params.append('resource_id', filters.resource_id);
                const queryString = params.toString();
                return apiRequest(`/api/vendor/reports/occupancy${queryString ? '?' + queryString : ''}`, {}, token);
            },

            async getTax(filters: { from_date?: string; to_date?: string }, token: string): Promise<ApiResponse> {
                const params = new URLSearchParams();
                if (filters.from_date) params.append('from_date', filters.from_date);
                if (filters.to_date) params.append('to_date', filters.to_date);
                const queryString = params.toString();
                return apiRequest(`/api/vendor/reports/tax${queryString ? '?' + queryString : ''}`, {}, token);
            },
        },

        // Vendor Tickets
        tickets: {
            /**
             * List tickets related to vendor (assigned + created by vendor)
             */
            async list(token: string, filters?: {
                search?: string;
                status?: string;
                page?: number;
                limit?: number;
            }): Promise<ApiResponse<Ticket[]>> {
                const params = new URLSearchParams();
                if (filters?.search) params.append('search', filters.search);
                if (filters?.status) params.append('status', filters.status);
                if (filters?.page) params.append('page', filters.page.toString());
                if (filters?.limit) params.append('limit', filters.limit.toString());
                const queryString = params.toString();
                return apiRequest(`/api/vendor/tickets${queryString ? '?' + queryString : ''}`, {}, token);
            },

            /**
             * Create ticket for platform issues
             */
            async create(data: CreateTicketInput, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest('/api/vendor/tickets', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * View assigned ticket
             */
            async getById(id: string, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/vendor/tickets/${id}`, {}, token);
            },

            /**
             * Add message to ticket
             */
            async addMessage(id: string, data: AddTicketMessageInput, token: string): Promise<ApiResponse<TicketMessage>> {
                return apiRequest(`/api/vendor/tickets/${id}/messages`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                }, token);
            },

            /**
             * Update status (in_progress/resolved only)
             */
            async updateStatus(id: string, data: UpdateTicketStatusInput, token: string): Promise<ApiResponse<Ticket>> {
                return apiRequest(`/api/vendor/tickets/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }, token);
            },
        },
    },

    /**
     * IMUGA - Public Routes (No Auth Required)
     */
    imugaPublic: {
        /**
         * Submit IMUGA declaration request (public)
         */
        async createRequest(data: CreateImugaRequestInput): Promise<ApiResponse<ImugaRequest>> {
            return apiRequest('/api/imuga-requests', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        /**
         * Check request status by request number (public)
         */
        async getRequestStatus(requestNumber: string): Promise<ApiResponse<ImugaRequest>> {
            return apiRequest(`/api/imuga-requests/${requestNumber}`);
        },
    },

    /**
     * IMUGA Admin - Declarations
     */
    imugaDeclarations: {
        /**
         * List declarations with filters
         */
        async list(token: string, filters?: DeclarationFilters): Promise<ApiResponse<ImugaDeclaration[]>> {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.page_size) params.append('page_size', filters.page_size.toString());
            if (filters?.status) params.append('status', filters.status);
            if (filters?.search) params.append('search', filters.search);
            if (filters?.date_from) params.append('date_from', filters.date_from);
            if (filters?.date_to) params.append('date_to', filters.date_to);
            const queryString = params.toString();
            return apiRequest(`/api/admin/imuga/declarations${queryString ? '?' + queryString : ''}`, {}, token);
        },

        /**
         * Create new declaration
         */
        async create(data: CreateDeclarationInput, token: string): Promise<ApiResponse<ImugaDeclaration>> {
            return apiRequest('/api/admin/imuga/declarations', {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * Get declaration by ID (includes travelers)
         */
        async getById(id: string, token: string): Promise<ApiResponse<ImugaDeclaration>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}`, {}, token);
        },

        /**
         * Update declaration
         */
        async update(id: string, data: UpdateDeclarationInput, token: string): Promise<ApiResponse<ImugaDeclaration>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * Delete declaration
         */
        async delete(id: string, token: string): Promise<ApiResponse<void>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}`, {
                method: 'DELETE',
            }, token);
        },

        /**
         * Update declaration status
         */
        async updateStatus(id: string, status: ImugaDeclarationStatus, token: string): Promise<ApiResponse<ImugaDeclaration>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }, token);
        },

        /**
         * Validate declaration (check all required fields before submission)
         */
        async validate(id: string, token: string): Promise<ApiResponse<ValidationResult>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}/validate`, {}, token);
        },

        /**
         * Export declaration for Chrome plugin
         */
        async export(id: string, token: string): Promise<ApiResponse<ImugaExportData>> {
            return apiRequest(`/api/admin/imuga/declarations/${id}/export`, {}, token);
        },
    },

    /**
     * IMUGA Admin - Travelers
     */
    imugaTravelers: {
        /**
         * List travelers for a declaration
         */
        async list(declarationId: string, token: string): Promise<ApiResponse<ImugaTraveler[]>> {
            return apiRequest(`/api/admin/imuga/declarations/${declarationId}/travelers`, {}, token);
        },

        /**
         * Add traveler to declaration
         */
        async add(declarationId: string, data: AddTravelerInput, token: string): Promise<ApiResponse<ImugaTraveler>> {
            return apiRequest(`/api/admin/imuga/declarations/${declarationId}/travelers`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * Reorder travelers
         */
        async reorder(declarationId: string, orderedIds: string[], token: string): Promise<ApiResponse<void>> {
            return apiRequest(`/api/admin/imuga/declarations/${declarationId}/travelers/reorder`, {
                method: 'PUT',
                body: JSON.stringify({ ordered_ids: orderedIds }),
            }, token);
        },

        /**
         * Get traveler by ID
         */
        async getById(travelerId: string, token: string): Promise<ApiResponse<ImugaTraveler>> {
            return apiRequest(`/api/admin/imuga/travelers/${travelerId}`, {}, token);
        },

        /**
         * Update traveler
         */
        async update(travelerId: string, data: Partial<AddTravelerInput>, token: string): Promise<ApiResponse<ImugaTraveler>> {
            return apiRequest(`/api/admin/imuga/travelers/${travelerId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * Delete traveler
         */
        async delete(travelerId: string, token: string): Promise<ApiResponse<void>> {
            return apiRequest(`/api/admin/imuga/travelers/${travelerId}`, {
                method: 'DELETE',
            }, token);
        },
    },

    /**
     * IMUGA Admin - Requests (Public Submissions)
     */
    imugaRequests: {
        /**
         * List requests with filters
         */
        async list(token: string, filters?: RequestFilters): Promise<ApiResponse<ImugaRequest[]>> {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.page_size) params.append('page_size', filters.page_size.toString());
            if (filters?.status) params.append('status', filters.status);
            if (filters?.search) params.append('search', filters.search);
            if (filters?.date_from) params.append('date_from', filters.date_from);
            if (filters?.date_to) params.append('date_to', filters.date_to);
            const queryString = params.toString();
            return apiRequest(`/api/admin/imuga/requests${queryString ? '?' + queryString : ''}`, {}, token);
        },

        /**
         * Get request by ID (includes travelers data)
         */
        async getById(id: string, token: string): Promise<ApiResponse<ImugaRequest>> {
            return apiRequest(`/api/admin/imuga/requests/${id}`, {}, token);
        },

        /**
         * Process request (approve/reject)
         */
        async process(id: string, data: ProcessRequestInput, token: string): Promise<ApiResponse<ImugaRequest>> {
            return apiRequest(`/api/admin/imuga/requests/${id}/process`, {
                method: 'POST',
                body: JSON.stringify(data),
            }, token);
        },

        /**
         * Convert request to declaration
         */
        async convert(id: string, token: string): Promise<ApiResponse<ImugaDeclaration>> {
            return apiRequest(`/api/admin/imuga/requests/${id}/convert`, {
                method: 'POST',
            }, token);
        },
    },
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
