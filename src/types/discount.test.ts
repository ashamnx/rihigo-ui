import {
  formatDiscountValue,
  isDiscountEditable,
  calculateDiscountAmount,
  hasUsageRemaining,
  isWithinValidityPeriod,
  type DiscountRule,
} from './discount';

const makeRule = (overrides: Partial<DiscountRule> = {}): DiscountRule => ({
  id: 'disc-1',
  vendor_id: 'vendor-1',
  name: 'Test Discount',
  discount_type: 'percentage',
  discount_value: 10,
  current_usage: 0,
  is_combinable: true,
  priority: 1,
  status: 'active',
  is_automatic: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('formatDiscountValue', () => {
  it('formats percentage as "10%"', () => {
    expect(formatDiscountValue('percentage', 10)).toBe('10%');
  });

  it('formats fixed with currency', () => {
    expect(formatDiscountValue('fixed', 50, 'USD')).toBe('USD 50.00');
  });

  it('formats fixed without currency', () => {
    expect(formatDiscountValue('fixed', 50)).toBe('50.00');
  });

  it('formats free_nights singular', () => {
    expect(formatDiscountValue('free_nights', 1)).toBe('1 night free');
  });

  it('formats free_nights plural', () => {
    expect(formatDiscountValue('free_nights', 3)).toBe('3 nights free');
  });

  it('formats free_service', () => {
    expect(formatDiscountValue('free_service', 1)).toBe('Free service');
  });
});

describe('isDiscountEditable', () => {
  it('returns true for active status', () => {
    expect(isDiscountEditable('active')).toBe(true);
  });

  it('returns true for paused status', () => {
    expect(isDiscountEditable('paused')).toBe(true);
  });

  it('returns false for expired status', () => {
    expect(isDiscountEditable('expired')).toBe(false);
  });

  it('returns false for depleted status', () => {
    expect(isDiscountEditable('depleted')).toBe(false);
  });
});

describe('calculateDiscountAmount', () => {
  it('calculates percentage discount', () => {
    expect(calculateDiscountAmount('percentage', 10, 1000)).toBe(100);
  });

  it('calculates fixed discount', () => {
    expect(calculateDiscountAmount('fixed', 50, 1000)).toBe(50);
  });

  it('caps discount at maxAmount', () => {
    expect(calculateDiscountAmount('percentage', 50, 1000, 200)).toBe(200);
  });

  it('does not exceed subtotal', () => {
    expect(calculateDiscountAmount('fixed', 1500, 1000)).toBe(1000);
  });

  it('returns 0 for free_nights type', () => {
    expect(calculateDiscountAmount('free_nights', 2, 1000)).toBe(0);
  });

  it('returns 0 for free_service type', () => {
    expect(calculateDiscountAmount('free_service', 1, 1000)).toBe(0);
  });
});

describe('hasUsageRemaining', () => {
  it('returns true when no usage_limit', () => {
    expect(hasUsageRemaining(makeRule({ usage_limit: undefined }))).toBe(true);
  });

  it('returns true when usage < limit', () => {
    expect(hasUsageRemaining(makeRule({ usage_limit: 100, current_usage: 50 }))).toBe(true);
  });

  it('returns false when usage >= limit', () => {
    expect(hasUsageRemaining(makeRule({ usage_limit: 100, current_usage: 100 }))).toBe(false);
    expect(hasUsageRemaining(makeRule({ usage_limit: 100, current_usage: 101 }))).toBe(false);
  });
});

describe('isWithinValidityPeriod', () => {
  const bookingDate = new Date('2024-06-15');
  const stayDate = new Date('2024-07-01');

  it('returns true when within all date ranges', () => {
    const rule = makeRule({
      booking_start_date: '2024-01-01',
      booking_end_date: '2024-12-31',
      stay_start_date: '2024-01-01',
      stay_end_date: '2024-12-31',
    });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(true);
  });

  it('returns false when before booking_start_date', () => {
    const rule = makeRule({ booking_start_date: '2024-07-01' });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(false);
  });

  it('returns false when after booking_end_date', () => {
    const rule = makeRule({ booking_end_date: '2024-06-01' });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(false);
  });

  it('returns false when stay date before stay_start_date', () => {
    const rule = makeRule({ stay_start_date: '2024-08-01' });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(false);
  });

  it('returns false when stay date after stay_end_date', () => {
    const rule = makeRule({ stay_end_date: '2024-06-01' });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(false);
  });

  it('returns false when day of week not in valid_days_of_week', () => {
    // 2024-07-01 is a Monday (day 1)
    const rule = makeRule({ valid_days_of_week: [0, 6] }); // Only Sun and Sat
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(false);
  });

  it('returns true when valid_days_of_week is empty', () => {
    const rule = makeRule({ valid_days_of_week: [] });
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(true);
  });

  it('returns true when no date constraints', () => {
    const rule = makeRule();
    expect(isWithinValidityPeriod(rule, bookingDate, stayDate)).toBe(true);
  });
});
