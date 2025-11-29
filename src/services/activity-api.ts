import type {
  Activity,
  ActivityFilters,
  ActivityListResponse,
  APIResponse,
  CreateActivityInput,
  UpdateActivityInput,
  CreatePackageInput,
  UpdatePackageInput,
  CreatePackagePriceInput,
  BulkTranslationsInput,
  Atoll,
  Island,
  IslandFilters,
  ActivityPackage,
  ActivityCategory,
} from '~/types/activity';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ====================================
// Helper Functions
// ====================================

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
    })) as { error?: string };
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<APIResponse<T>>;
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
// Public Activity APIs
// ====================================

export async function getActivities(
  filters: ActivityFilters = {}
): Promise<ActivityListResponse> {
  const queryString = buildQueryString(filters);
  const response = await fetchAPI<Activity[]>(
    `/api/activities${queryString}`
  );

  // The API returns paginated response
  return response as any as ActivityListResponse;
}

export async function getActivityById(
  id: string,
  lang: string = 'en'
): Promise<Activity> {
  const response = await fetchAPI<Activity>(
    `/api/activities/${id}?lang=${lang}`
  );
  return response.data;
}

export async function getActivityBySlug(
  slug: string,
  lang: string = 'en'
): Promise<Activity> {
  const response = await fetchAPI<Activity>(
    `/api/activities/slug/${slug}?lang=${lang}`
  );
  return response.data;
}

// ====================================
// Geography APIs
// ====================================

export async function getAtolls(): Promise<Atoll[]> {
  const response = await fetchAPI<Atoll[]>('/api/atolls');
  return response.data;
}

export async function getIslands(
  filters: IslandFilters = {}
): Promise<Island[]> {
  const queryString = buildQueryString(filters);
  const response = await fetchAPI<Island[]>(`/api/islands${queryString}`);
  return response.data;
}

// ====================================
// Category APIs
// ====================================

export async function getCategories(): Promise<ActivityCategory[]> {
  const response = await fetchAPI<ActivityCategory[]>('/api/activities/categories');
  return response.data;
}

// ====================================
// Admin Activity APIs
// ====================================

export async function createActivity(
  input: CreateActivityInput,
  token: string
): Promise<Activity> {
  const response = await fetchAPI<Activity>('/api/admin/activities', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateActivity(
  id: string,
  input: UpdateActivityInput,
  token: string
): Promise<Activity> {
  const response = await fetchAPI<Activity>(`/api/admin/activities/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteActivity(
  id: string,
  token: string
): Promise<void> {
  await fetch(`${API_BASE_URL}/api/admin/activities/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ====================================
// Admin Package APIs
// ====================================

export async function createPackage(
  input: CreatePackageInput,
  token: string
): Promise<ActivityPackage> {
  const response = await fetchAPI<ActivityPackage>('/api/admin/packages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updatePackage(
  id: string,
  input: UpdatePackageInput,
  token: string
): Promise<ActivityPackage> {
  const response = await fetchAPI<ActivityPackage>(
    `/api/admin/packages/${id}`,
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

export async function deletePackage(
  id: string,
  token: string
): Promise<void> {
  await fetch(`${API_BASE_URL}/api/admin/packages/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ====================================
// Admin Package Price APIs
// ====================================

export async function createPackagePrice(
  input: CreatePackagePriceInput,
  token: string
): Promise<void> {
  await fetchAPI('/api/admin/package-prices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

// ====================================
// Admin Translation APIs
// ====================================

export async function createBulkTranslations(
  input: BulkTranslationsInput,
  token: string
): Promise<void> {
  await fetchAPI('/api/admin/translations/bulk', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

// ====================================
// Helper: Get Auth Token
// ====================================

export function getAuthToken(): string | null {
  // This depends on your auth implementation
  // For Auth.js, you might need to use the session
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}
