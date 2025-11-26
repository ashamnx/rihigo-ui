/**
 * Standard API Response Types
 * Matching the Go backend response structure
 */

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Pagination metadata
 */
export interface PaginationData {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

/**
 * Standard API response structure
 * @template T - The type of data being returned
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  pagination_data?: PaginationData;
  error_message?: string;
  errors?: string[] | Record<string, string> | FieldError[];
  message?: string;
}

/**
 * Paginated API response
 * @template T - The type of data items being returned
 */
export interface PaginatedResponse<T = any> {
  success: boolean;
  data?: T[];
  pagination_data?: PaginationData;
  error_message?: string;
  errors?: string[] | Record<string, string> | FieldError[];
}

/**
 * Type guard to check if response has field errors
 */
export function hasFieldErrors(response: ApiResponse): response is ApiResponse & { errors: FieldError[] } {
  return Array.isArray(response.errors) &&
         response.errors.length > 0 &&
         typeof response.errors[0] === 'object' &&
         'field' in response.errors[0];
}

/**
 * Type guard to check if response has string errors
 */
export function hasStringErrors(response: ApiResponse): response is ApiResponse & { errors: string[] } {
  return Array.isArray(response.errors) &&
         response.errors.length > 0 &&
         typeof response.errors[0] === 'string';
}

/**
 * Type guard to check if response has record errors
 */
export function hasRecordErrors(response: ApiResponse): response is ApiResponse & { errors: Record<string, string> } {
  return typeof response.errors === 'object' &&
         !Array.isArray(response.errors) &&
         response.errors !== null;
}

/**
 * Helper to extract error message from response
 */
export function getErrorMessage(response: ApiResponse): string {
  if (response.error_message) {
    return response.error_message;
  }

  if (hasStringErrors(response)) {
    return response.errors.join(', ');
  }

  if (hasFieldErrors(response)) {
    return response.errors.map(e => `${e.field}: ${e.message}`).join(', ');
  }

  if (hasRecordErrors(response)) {
    return Object.entries(response.errors).map(([field, msg]) => `${field}: ${msg}`).join(', ');
  }

  return 'An unknown error occurred';
}

/**
 * User preferences
 */
export interface UserPreferences {
  currency?: string;
  language?: string;
  notifications?: boolean;
}

/**
 * User profile data from /api/users/me
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'user' | 'admin';
  phone?: string;
  nationality?: string;
  date_of_birth?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at?: string;
}

/**
 * User type for admin user listing
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  phone?: string;
  nationality?: string;
  created_at: string;
  preferences?: UserPreferences;
}
