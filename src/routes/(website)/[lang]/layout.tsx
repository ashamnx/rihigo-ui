import { component$, Slot } from "@builder.io/qwik";
import { Nav } from "~/components/nav/nav";
import { routeLoader$ } from "@builder.io/qwik-city";
import { CurrencyProvider, DEFAULT_CURRENCIES, type CurrencyData } from "~/context/currency-context";

// Fetch currencies with exchange rates
export const useCurrencyData = routeLoader$(async (requestEvent) => {
  requestEvent.cacheControl({
    maxAge: 60,
    sMaxAge: 3600,
    staleWhileRevalidate: 60 * 60 * 24 * 4, // 4 days
  });

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

export default component$(() => {
  const currencyData = useCurrencyData();

  return (
    <CurrencyProvider currencies={currencyData.value.data}>
      <Nav>
        <Slot />
      </Nav>
    </CurrencyProvider>
  );
});
