import { component$, Slot } from "@builder.io/qwik";
import { Nav } from "~/components/nav/nav";
import { routeLoader$, routeAction$, type RequestHandler } from "@builder.io/qwik-city";
import { CurrencyProvider, DEFAULT_CURRENCIES, type CurrencyData } from "~/context/currency-context";
import { ToastProvider } from "~/context/toast-context";
import { ToastContainer } from "~/components/toast/ToastContainer";
import { NotificationProvider } from "~/context/notification-context";
import type { Notification } from "~/types/notification";

// Set cache headers based on authentication status
// Authenticated pages must not be cached to prevent user data leakage
export const onRequest: RequestHandler = (event) => {
  const session = event.sharedMap.get('session');

  // Tell CDN to vary cache by Cookie so authenticated users get different response
  event.headers.set('Vary', 'Cookie');

  if (session?.user) {
    // Authenticated: prevent caching to avoid showing wrong user's profile
    event.headers.set('Cache-Control', 'private, no-store');
  } else {
    // Public: allow caching for better performance
    event.cacheControl({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 60 * 60,
    });
  }
};

// Fetch currencies with exchange rates
export const useCurrencyData = routeLoader$(async () => {
  // Note: Page-level caching is handled by onRequest based on auth status

  // Try to fetch from API, fallback to defaults
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiUrl}/api/currencies`);

    if (response.ok) {
      const result = await response.json() as { success: boolean; data: any[] };
      if (result.success && Array.isArray(result.data)) {
        // Map API response to our format with exchange rates
        const currencies: CurrencyData[] = result.data.map((c: any) => ({
          code: c.code,
          symbol: c.symbol,
          // Use exchange rate from API if available, otherwise find from defaults
          exchange_rate_to_usd: c.exchange_rate_to_usd ||
            DEFAULT_CURRENCIES.find(dc => dc.code === c.code)?.exchange_rate_to_usd ||
            1,
        }));

        return {
          data: currencies,
          success: true,
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch currencies from API:', error);
  }

  // Fallback to default currencies
  return {
    data: DEFAULT_CURRENCIES,
    success: true,
  };
});

// Get session token and API URL for notification context
export const useSessionData = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string; user?: any } | null;
  return {
    token: session?.accessToken || null,
    isAuthenticated: !!session?.user,
    apiUrl: process.env.API_URL || 'http://localhost:8080',
  };
});

// Load initial notifications
export const useInitialNotifications = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string } | null;
  if (!session?.accessToken) {
    return { notifications: [], unreadCount: 0 };
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8080';
  const token = session.accessToken;

  try {
    const [notificationsRes, countRes] = await Promise.all([
      fetch(`${apiUrl}/api/notifications?page=1&page_size=20`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiUrl}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const notificationsData = await notificationsRes.json() as {
      success: boolean;
      data?: Notification[];
    };
    const countData = await countRes.json() as {
      success: boolean;
      data?: { count: number };
    };

    return {
      notifications: notificationsData.success ? notificationsData.data || [] : [],
      unreadCount: countData.success && countData.data ? countData.data.count : 0,
    };
  } catch (error) {
    console.error('Failed to fetch initial notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }
});

// Mark notification as read action
export const useMarkNotificationRead = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string } | null;
  if (!session?.accessToken) {
    return { success: false, error: 'Unauthorized' };
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8080';
  try {
    const response = await fetch(`${apiUrl}/api/notifications/${data.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const result = await response.json() as { success: boolean };
    return { success: result.success };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
});

// Mark all notifications as read action
export const useMarkAllNotificationsRead = routeAction$(async (_, requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string } | null;
  if (!session?.accessToken) {
    return { success: false, error: 'Unauthorized' };
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8080';
  try {
    const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const result = await response.json() as { success: boolean };
    return { success: result.success };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
});

// Delete notification action
export const useDeleteNotification = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string } | null;
  if (!session?.accessToken) {
    return { success: false, error: 'Unauthorized' };
  }

  const apiUrl = process.env.API_URL || 'http://localhost:8080';
  try {
    const response = await fetch(`${apiUrl}/api/notifications/${data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const result = await response.json() as { success: boolean };
    return { success: result.success };
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
});

export default component$(() => {
  const currencyData = useCurrencyData();
  const sessionData = useSessionData();
  const initialNotifications = useInitialNotifications();
  const markReadAction = useMarkNotificationRead();
  const markAllReadAction = useMarkAllNotificationsRead();
  const deleteAction = useDeleteNotification();

  return (
    <CurrencyProvider currencies={currencyData.value.data}>
      <ToastProvider>
        <NotificationProvider
          token={sessionData.value.token || undefined}
          apiUrl={sessionData.value.apiUrl}
          initialNotifications={initialNotifications.value.notifications}
          initialUnreadCount={initialNotifications.value.unreadCount}
          markReadAction={markReadAction}
          markAllReadAction={markAllReadAction}
          deleteAction={deleteAction}
        >
          <Nav>
            <Slot />
          </Nav>
          <ToastContainer />
        </NotificationProvider>
      </ToastProvider>
    </CurrencyProvider>
  );
});
