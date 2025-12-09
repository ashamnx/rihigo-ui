import type {
  Booking,
  CreateBookingInput,
  UpdateBookingStatusInput,
  BookingFilters,
  PaginatedBookingsResponse,
  Invoice,
} from '~/types/booking';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// ====================================
// Helper Functions
// ====================================

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T; success: boolean; message?: string }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json() as { data: T; success: boolean; message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  return data as { data: T; success: boolean; message?: string };
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ====================================
// User Booking APIs
// ====================================

export async function createBooking(
  input: CreateBookingInput,
  token: string
): Promise<Booking> {
  const response = await fetchAPI<Booking>('/api/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getBookingById(
  id: string,
  token: string
): Promise<Booking> {
  const response = await fetchAPI<Booking>(`/api/bookings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function getUserBookings(
  token: string,
  filters: BookingFilters = {}
): Promise<PaginatedBookingsResponse> {
  const queryString = buildQueryString(filters);
  const response = await fetchAPI<Booking[]>(`/api/bookings${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // The API returns paginated response
  return response as any as PaginatedBookingsResponse;
}

export async function cancelBooking(
  id: string,
  token: string
): Promise<Booking> {
  const response = await fetchAPI<Booking>(`/api/bookings/${id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

// ====================================
// Admin Booking APIs
// ====================================

export async function getAllBookings(
  token: string,
  filters: BookingFilters = {}
): Promise<PaginatedBookingsResponse> {
  const queryString = buildQueryString(filters);
  const response = await fetchAPI<Booking[]>(
    `/api/admin/bookings${queryString}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response as any as PaginatedBookingsResponse;
}

export async function updateBookingStatus(
  id: string,
  input: UpdateBookingStatusInput,
  token: string
): Promise<Booking> {
  const response = await fetchAPI<Booking>(
    `/api/admin/bookings/${id}/status`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    }
  );
  return response.data;
}

export async function deleteBooking(
  id: string,
  token: string
): Promise<void> {
  await fetchAPI(`/api/admin/bookings/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ====================================
// Invoice APIs (to be implemented)
// ====================================

export async function getBookingInvoice(
  bookingId: string,
  token: string
): Promise<Invoice> {
  const response = await fetchAPI<Invoice>(
    `/api/bookings/${bookingId}/invoice`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function generateInvoice(
  bookingId: string,
  token: string
): Promise<Invoice> {
  const response = await fetchAPI<Invoice>(
    `/api/admin/bookings/${bookingId}/invoice`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

// ====================================
// Helper: Get Auth Token from Session
// ====================================

export function getAuthTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('authjs.session-token='));

  if (authCookie) {
    return authCookie.split('=')[1];
  }

  return null;
}
