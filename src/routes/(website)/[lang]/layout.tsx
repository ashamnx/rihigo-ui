import { component$, Slot } from "@builder.io/qwik";
import { Nav } from "~/components/nav/nav";
import { routeLoader$, type RequestHandler } from "@builder.io/qwik-city";
import { CurrencyProvider, DEFAULT_CURRENCIES, type CurrencyData } from "~/context/currency-context";
import { ToastProvider } from "~/context/toast-context";
import { ToastContainer } from "~/components/toast/ToastContainer";
import { NotificationProvider } from "~/context/notification-context";

// Set cache headers based on authentication status
// Authenticated pages must not be cached to prevent user data leakage
export const onRequest: RequestHandler = (event) => {
  const session = event.sharedMap.get('session');
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
export const useCurrencyData = routeLoader$(async (requestEvent) => {
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

// Get session token for notification context
export const useSessionData = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session') as { accessToken?: string; user?: any } | null;
  return {
    token: session?.accessToken || null,
    isAuthenticated: !!session?.user,
  };
});

export default component$(() => {
  const currencyData = useCurrencyData();
  const sessionData = useSessionData();

  return (
    <CurrencyProvider currencies={currencyData.value.data}>
      <ToastProvider>
        <NotificationProvider token={sessionData.value.token || undefined}>
          <Nav>
            <Slot />
          </Nav>
          <ToastContainer />
        </NotificationProvider>
      </ToastProvider>
    </CurrencyProvider>
  );
});
