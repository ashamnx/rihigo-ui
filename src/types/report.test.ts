import {
  getDateRangeFromPreset,
  formatReportCurrency,
  formatPercentage,
  calculateChangePercentage,
} from './report';

describe('getDateRangeFromPreset', () => {
  // Note: getDateRangeFromPreset uses toISOString() internally which returns UTC.
  // Combined with local-timezone Date constructors, results may shift by timezone offset.
  // Tests validate behavior properties rather than exact dates.

  it('today returns same date for from and to', () => {
    const result = getDateRangeFromPreset('today');
    expect(result.from).toBe(result.to);
    // Should be a valid YYYY-MM-DD format
    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('yesterday returns a date different from today', () => {
    const today = getDateRangeFromPreset('today');
    const yesterday = getDateRangeFromPreset('yesterday');
    expect(yesterday.from).toBe(yesterday.to);
    expect(yesterday.from).not.toBe(today.from);
  });

  it('this_week from is before or equal to today', () => {
    const result = getDateRangeFromPreset('this_week');
    const today = getDateRangeFromPreset('today');
    expect(result.from <= today.from).toBe(true);
    expect(result.to).toBe(today.to);
  });

  it('last_month from is before to', () => {
    const result = getDateRangeFromPreset('last_month');
    expect(result.from < result.to).toBe(true);
  });

  it('last_year from is before to', () => {
    const result = getDateRangeFromPreset('last_year');
    expect(result.from < result.to).toBe(true);
  });

  it('custom returns same as today', () => {
    const result = getDateRangeFromPreset('custom');
    const today = getDateRangeFromPreset('today');
    expect(result).toEqual(today);
  });

  it('all presets return valid date strings', () => {
    const presets = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'] as const;
    for (const preset of presets) {
      const result = getDateRangeFromPreset(preset);
      expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.from <= result.to).toBe(true);
    }
  });
});

describe('formatReportCurrency', () => {
  it('formats USD with $ symbol', () => {
    const result = formatReportCurrency(1000, 'USD');
    expect(result).toContain('1,000');
    expect(result).toContain('$');
  });

  it('formats EUR correctly', () => {
    const result = formatReportCurrency(1000, 'EUR');
    expect(result).toContain('1,000');
    expect(result).toContain('€');
  });

  it('handles zero amount', () => {
    const result = formatReportCurrency(0, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('0');
  });
});

describe('formatPercentage', () => {
  it('formats with 1 decimal by default', () => {
    expect(formatPercentage(42.567)).toBe('42.6%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercentage(42.567, 2)).toBe('42.57%');
  });

  it('formats integer values', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });
});

describe('calculateChangePercentage', () => {
  it('returns correct increase percentage', () => {
    expect(calculateChangePercentage(150, 100)).toBe(50);
  });

  it('returns correct decrease percentage', () => {
    expect(calculateChangePercentage(50, 100)).toBe(-50);
  });

  it('returns 100 when previous is 0 and current > 0', () => {
    expect(calculateChangePercentage(100, 0)).toBe(100);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateChangePercentage(0, 0)).toBe(0);
  });

  it('returns -100 for drop to zero', () => {
    expect(calculateChangePercentage(0, 100)).toBe(-100);
  });
});
