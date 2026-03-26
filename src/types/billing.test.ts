import {
  formatCurrency,
  getCurrencySymbol,
  generateDocumentNumber,
  CURRENCIES,
} from './billing';

describe('formatCurrency', () => {
  it('formats USD with $ symbol', () => {
    expect(formatCurrency(100, 'USD')).toBe('$ 100.00');
  });

  it('formats MVR with Rf symbol', () => {
    expect(formatCurrency(100, 'MVR')).toBe('Rf 100.00');
  });

  it('formats EUR with euro symbol', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€ 100.00');
  });

  it('falls back to currency code for unknown', () => {
    expect(formatCurrency(100, 'XYZ')).toBe('XYZ 100.00');
  });
});

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('returns Rf for MVR', () => {
    expect(getCurrencySymbol('MVR')).toBe('Rf');
  });

  it('returns currency code for unknown', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
});

describe('generateDocumentNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates correct format: PREFIX-YEAR-0001', () => {
    expect(generateDocumentNumber('INV', 1)).toBe('INV-2024-0001');
  });

  it('pads number to 4 digits', () => {
    expect(generateDocumentNumber('QUO', 42)).toBe('QUO-2024-0042');
  });

  it('handles large numbers', () => {
    expect(generateDocumentNumber('REC', 12345)).toBe('REC-2024-12345');
  });
});

describe('CURRENCIES', () => {
  it('contains 10 currencies', () => {
    expect(CURRENCIES).toHaveLength(10);
  });

  it('includes USD, EUR, MVR', () => {
    const codes = CURRENCIES.map(c => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('MVR');
  });
});
