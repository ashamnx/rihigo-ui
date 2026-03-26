import {
  formatTaxRate,
  calculateTaxAmount,
  doesTaxApply,
  doesExemptionApply,
  MALDIVES_TAX_RATES,
  type TaxRate,
  type TaxExemption,
} from './tax';

const makeTaxRate = (overrides: Partial<TaxRate> = {}): TaxRate => ({
  id: 'tax-1',
  name: 'TGST',
  code: 'TGST',
  rate: 16,
  rate_type: 'percentage',
  applies_to: {},
  applies_to_foreigners_only: false,
  effective_from: '2020-01-01',
  is_active: true,
  is_inclusive: false,
  show_on_invoice: true,
  sort_order: 1,
  ...overrides,
});

const makeExemption = (overrides: Partial<TaxExemption> = {}): TaxExemption => ({
  id: 'ex-1',
  vendor_id: 'vendor-1',
  tax_rate_id: 'tax-1',
  exemption_type: 'guest_nationality',
  conditions: { nationalities: ['MV'] },
  is_active: true,
  ...overrides,
});

describe('MALDIVES_TAX_RATES', () => {
  it('defines TGST at 16%', () => {
    expect(MALDIVES_TAX_RATES.TGST.rate).toBe(16);
    expect(MALDIVES_TAX_RATES.TGST.rate_type).toBe('percentage');
  });

  it('defines Green Tax as fixed per unit', () => {
    expect(MALDIVES_TAX_RATES.GREEN_TAX.rate).toBe(6);
    expect(MALDIVES_TAX_RATES.GREEN_TAX.rate_type).toBe('fixed_per_unit');
  });

  it('defines Service Charge at 10%', () => {
    expect(MALDIVES_TAX_RATES.SERVICE_CHARGE.rate).toBe(10);
  });
});

describe('formatTaxRate', () => {
  it('formats percentage rate as "16%"', () => {
    expect(formatTaxRate(16, 'percentage')).toBe('16%');
  });

  it('formats fixed_per_unit with currency', () => {
    expect(formatTaxRate(6, 'fixed_per_unit', 'USD')).toBe('USD 6/night');
  });

  it('formats fixed_per_unit without currency', () => {
    expect(formatTaxRate(6, 'fixed_per_unit')).toBe('6/night');
  });

  it('formats fixed_per_booking with currency', () => {
    expect(formatTaxRate(50, 'fixed_per_booking', 'USD')).toBe('USD 50');
  });

  it('formats fixed_per_booking without currency', () => {
    expect(formatTaxRate(50, 'fixed_per_booking')).toBe('50');
  });
});

describe('calculateTaxAmount', () => {
  it('calculates percentage tax correctly', () => {
    const tax = makeTaxRate({ rate: 16, rate_type: 'percentage' });
    expect(calculateTaxAmount(tax, 1000)).toBe(160);
  });

  it('calculates fixed_per_night tax', () => {
    const tax = makeTaxRate({ rate: 6, rate_type: 'fixed_per_night' });
    expect(calculateTaxAmount(tax, 1000, 5)).toBe(30);
  });

  it('calculates fixed_per_person tax', () => {
    const tax = makeTaxRate({ rate: 10, rate_type: 'fixed_per_person' });
    expect(calculateTaxAmount(tax, 1000, 1, 3)).toBe(30);
  });

  it('calculates fixed_per_booking tax', () => {
    const tax = makeTaxRate({ rate: 25, rate_type: 'fixed_per_booking' });
    expect(calculateTaxAmount(tax, 1000)).toBe(25);
  });

  it('uses overrideRate when provided', () => {
    const tax = makeTaxRate({ rate: 16, rate_type: 'percentage' });
    expect(calculateTaxAmount(tax, 1000, 1, 1, 20)).toBe(200);
  });

  it('returns 0 for unknown rate_type', () => {
    const tax = makeTaxRate({ rate_type: 'unknown' as any });
    expect(calculateTaxAmount(tax, 1000)).toBe(0);
  });
});

describe('doesTaxApply', () => {
  it('returns true when all conditions met', () => {
    const tax = makeTaxRate({
      is_active: true,
      effective_from: '2020-01-01',
      applies_to: { service_types: ['accommodation'] },
    });
    expect(doesTaxApply(tax, 'accommodation', true)).toBe(true);
  });

  it('returns false when service type does not match', () => {
    const tax = makeTaxRate({
      applies_to: { service_types: ['accommodation'] },
    });
    expect(doesTaxApply(tax, 'transfer', true)).toBe(false);
  });

  it('returns true when no service_types restriction', () => {
    const tax = makeTaxRate({ applies_to: {} });
    expect(doesTaxApply(tax, 'transfer')).toBe(true);
  });

  it('returns false for foreigner-only tax when not foreigner', () => {
    const tax = makeTaxRate({ applies_to_foreigners_only: true });
    expect(doesTaxApply(tax, 'accommodation', false)).toBe(false);
  });

  it('returns true for foreigner-only tax when foreigner', () => {
    const tax = makeTaxRate({ applies_to_foreigners_only: true });
    expect(doesTaxApply(tax, 'accommodation', true)).toBe(true);
  });

  it('returns false when tax is not active', () => {
    const tax = makeTaxRate({ is_active: false });
    expect(doesTaxApply(tax, 'accommodation')).toBe(false);
  });

  it('returns false when before effective_from date', () => {
    const tax = makeTaxRate({ effective_from: '2099-01-01' });
    expect(doesTaxApply(tax, 'accommodation')).toBe(false);
  });

  it('returns false when after effective_to date', () => {
    const tax = makeTaxRate({ effective_to: '2020-01-01' });
    expect(doesTaxApply(tax, 'accommodation')).toBe(false);
  });
});

describe('doesExemptionApply', () => {
  it('returns false for inactive exemption', () => {
    expect(doesExemptionApply(makeExemption({ is_active: false }), 'MV')).toBe(false);
  });

  it('matches nationality exemption when nationality in list', () => {
    const ex = makeExemption({
      exemption_type: 'guest_nationality',
      conditions: { nationalities: ['MV', 'IN'] },
    });
    expect(doesExemptionApply(ex, 'MV')).toBe(true);
  });

  it('does not match nationality exemption when not in list', () => {
    const ex = makeExemption({
      exemption_type: 'guest_nationality',
      conditions: { nationalities: ['MV'] },
    });
    expect(doesExemptionApply(ex, 'US')).toBe(false);
  });

  it('matches booking_type exemption', () => {
    const ex = makeExemption({
      exemption_type: 'booking_type',
      conditions: { booking_types: ['standard', 'tour'] },
    });
    expect(doesExemptionApply(ex, undefined, 'standard')).toBe(true);
  });

  it('matches promo_code exemption', () => {
    const ex = makeExemption({
      exemption_type: 'promo_code',
      conditions: { promo_codes: ['NOTAX2024'] },
    });
    expect(doesExemptionApply(ex, undefined, undefined, 'NOTAX2024')).toBe(true);
  });

  it('returns false for unknown exemption type', () => {
    const ex = makeExemption({ exemption_type: 'unknown' as any });
    expect(doesExemptionApply(ex, 'MV')).toBe(false);
  });

  it('returns false when before valid_from', () => {
    const ex = makeExemption({ valid_from: '2099-01-01' });
    expect(doesExemptionApply(ex, 'MV')).toBe(false);
  });

  it('returns false when after valid_to', () => {
    const ex = makeExemption({ valid_to: '2020-01-01' });
    expect(doesExemptionApply(ex, 'MV')).toBe(false);
  });
});
