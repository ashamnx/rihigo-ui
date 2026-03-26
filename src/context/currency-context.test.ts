/**
 * Tests for pure functions in currency-context.tsx
 *
 * Since the module also exports Qwik components (component$), which
 * fail in a pure Node environment, we mock the Qwik module to allow
 * importing the pure functions.
 */
vi.mock('@builder.io/qwik', () => ({
  component$: (fn: any) => fn,
  createContextId: (id: string) => id,
  Slot: 'Slot',
  useContextProvider: vi.fn(),
  useSignal: (v: any) => ({ value: v }),
  useVisibleTask$: vi.fn(),
  useContext: vi.fn(),
}));

import {
  formatPrice,
  convertToDisplayCurrency,
  DEFAULT_CURRENCIES,
} from './currency-context';

describe('DEFAULT_CURRENCIES', () => {
  it('contains 9 currencies', () => {
    expect(DEFAULT_CURRENCIES).toHaveLength(9);
  });

  it('USD has exchange rate of 1', () => {
    const usd = DEFAULT_CURRENCIES.find(c => c.code === 'USD');
    expect(usd!.exchange_rate_to_usd).toBe(1);
  });
});

describe('formatPrice', () => {
  const currencies = DEFAULT_CURRENCIES;

  it('formats USD correctly', () => {
    expect(formatPrice(100, 'USD', currencies)).toBe('$100.00');
  });

  it('converts and formats EUR correctly', () => {
    const eur = currencies.find(c => c.code === 'EUR')!;
    const expected = `€${(100 / eur.exchange_rate_to_usd).toFixed(2)}`;
    expect(formatPrice(100, 'EUR', currencies)).toBe(expected);
  });

  it('converts and formats MVR correctly', () => {
    const mvr = currencies.find(c => c.code === 'MVR')!;
    const expected = `Rf${(100 / mvr.exchange_rate_to_usd).toFixed(2)}`;
    expect(formatPrice(100, 'MVR', currencies)).toBe(expected);
  });

  it('returns "Price unavailable" for undefined amount', () => {
    expect(formatPrice(undefined, 'USD', currencies)).toBe('Price unavailable');
  });

  it('returns "Price unavailable" for null amount', () => {
    expect(formatPrice(null, 'USD', currencies)).toBe('Price unavailable');
  });

  it('returns "Price unavailable" for NaN amount', () => {
    expect(formatPrice(NaN, 'USD', currencies)).toBe('Price unavailable');
  });

  it('falls back to USD format for unknown currency code', () => {
    expect(formatPrice(100, 'XYZ', currencies)).toBe('$100.00');
  });

  it('handles zero amount', () => {
    expect(formatPrice(0, 'USD', currencies)).toBe('$0.00');
  });
});

describe('convertToDisplayCurrency', () => {
  const currencies = DEFAULT_CURRENCIES;

  it('returns same amount for USD', () => {
    expect(convertToDisplayCurrency(100, 'USD', currencies)).toBe(100);
  });

  it('converts correctly using exchange rate', () => {
    const eur = currencies.find(c => c.code === 'EUR')!;
    const result = convertToDisplayCurrency(100, 'EUR', currencies);
    expect(result).toBeCloseTo(100 / eur.exchange_rate_to_usd);
  });

  it('returns USD amount for unknown currency', () => {
    expect(convertToDisplayCurrency(100, 'XYZ', currencies)).toBe(100);
  });

  it('handles zero amount', () => {
    expect(convertToDisplayCurrency(0, 'EUR', currencies)).toBe(0);
  });
});
