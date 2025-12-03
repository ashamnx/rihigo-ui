import {
  component$,
  createContextId,
  type Signal,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  useContext
} from "@builder.io/qwik";

// Currency data with exchange rates
export interface CurrencyData {
  code: string;
  symbol: string;
  exchange_rate_to_usd: number; // Rate FROM this currency TO USD (e.g., EUR=0.92 means 1 EUR = 0.92 USD)
}

// Default currencies with approximate exchange rates (updated from API when available)
export const DEFAULT_CURRENCIES: CurrencyData[] = [
  { code: "USD", symbol: "$", exchange_rate_to_usd: 1 },
  { code: "EUR", symbol: "€", exchange_rate_to_usd: 0.92 },
  { code: "GBP", symbol: "£", exchange_rate_to_usd: 0.79 },
  { code: "CNY", symbol: "¥", exchange_rate_to_usd: 7.24 },
  { code: "MVR", symbol: "Rf", exchange_rate_to_usd: 15.42 },
  { code: "RUB", symbol: "₽", exchange_rate_to_usd: 92 },
  { code: "AED", symbol: "د.إ", exchange_rate_to_usd: 3.67 },
  { code: "INR", symbol: "₹", exchange_rate_to_usd: 83.12 },
  { code: "JPY", symbol: "¥", exchange_rate_to_usd: 149.5 },
];

const STORAGE_KEY = "rihigo_preferred_currency";
const DEFAULT_CURRENCY = "USD";

export interface CurrencyContextType {
  selectedCurrency: Signal<string>;
  currencies: Signal<CurrencyData[]>;
}

export const CurrencyContext = createContextId<CurrencyContextType>("currency-context");

/**
 * Format a USD amount to the selected display currency
 * @param amountUsd - Amount in USD (base currency)
 * @param currencyCode - Target currency code
 * @param currencies - Available currencies with exchange rates
 * @returns Formatted price string
 */
export function formatPrice(
  amountUsd: number | undefined | null,
  currencyCode: string,
  currencies: CurrencyData[]
): string {
  if (amountUsd === undefined || amountUsd === null || isNaN(amountUsd)) {
    return "Price unavailable";
  }

  const currency = currencies.find(c => c.code === currencyCode);
  if (!currency) {
    // Fallback to USD if currency not found
    return `$${amountUsd.toFixed(2)}`;
  }

  // Convert USD to display currency
  // Formula: display_amount = usd_amount / exchange_rate_to_usd
  const displayAmount = amountUsd / currency.exchange_rate_to_usd;

  // Format based on currency
  return `${currency.symbol}${displayAmount.toFixed(2)}`;
}

/**
 * Get price in selected currency (number only, no formatting)
 */
export function convertToDisplayCurrency(
  amountUsd: number,
  currencyCode: string,
  currencies: CurrencyData[]
): number {
  const currency = currencies.find(c => c.code === currencyCode);
  if (!currency) {
    return amountUsd;
  }
  return amountUsd / currency.exchange_rate_to_usd;
}

/**
 * Currency Provider Component
 * Wraps the app and provides currency context with localStorage persistence
 */
export const CurrencyProvider = component$<{ currencies?: CurrencyData[] }>(({ currencies: initialCurrencies }) => {
  const selectedCurrency = useSignal(DEFAULT_CURRENCY);
  const currencies = useSignal<CurrencyData[]>(initialCurrencies || DEFAULT_CURRENCIES);

  // Load from localStorage on client
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && currencies.value.some(c => c.code === stored)) {
      selectedCurrency.value = stored;
    }
  });

  // Save to localStorage when currency changes
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => selectedCurrency.value);
    localStorage.setItem(STORAGE_KEY, selectedCurrency.value);
  });

  useContextProvider(CurrencyContext, {
    selectedCurrency,
    currencies,
  });

  return <Slot />;
});

/**
 * Hook to use currency context
 */
export function useCurrency() {
  return useContext(CurrencyContext);
}

/**
 * Hook to format a price using the current currency context
 * Note: Not currently used but exported for future use cases
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useFormatPrice() {
  const { selectedCurrency, currencies } = useCurrency();

  return (amountUsd: number | undefined | null): string => {
    return formatPrice(amountUsd, selectedCurrency.value, currencies.value);
  };
}
