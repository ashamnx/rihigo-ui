import {
  calculateLineTotal,
  isQuotationEditable,
  canSendQuotation,
  canConvertQuotation,
  type QuotationStatus,
} from './quotation';

describe('calculateLineTotal', () => {
  it('calculates quantity * unitPrice', () => {
    expect(calculateLineTotal(3, 100)).toBe(300);
  });

  it('applies percentage discount', () => {
    expect(calculateLineTotal(2, 100, 10)).toBe(180); // 200 - 10%
  });

  it('applies fixed discount amount', () => {
    expect(calculateLineTotal(2, 100, undefined, 30)).toBe(170); // 200 - 30
  });

  it('applies both discounts', () => {
    expect(calculateLineTotal(2, 100, 10, 20)).toBe(160); // 200 - 20(10%) - 20
  });

  it('never returns negative', () => {
    expect(calculateLineTotal(1, 10, 0, 100)).toBe(0);
  });
});

describe('isQuotationEditable', () => {
  it('returns true for draft', () => {
    expect(isQuotationEditable('draft')).toBe(true);
  });

  it.each<QuotationStatus>(['sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'])(
    'returns false for %s',
    (status) => {
      expect(isQuotationEditable(status)).toBe(false);
    }
  );
});

describe('canSendQuotation', () => {
  it('returns true for draft', () => {
    expect(canSendQuotation('draft')).toBe(true);
  });

  it('returns true for sent', () => {
    expect(canSendQuotation('sent')).toBe(true);
  });

  it.each<QuotationStatus>(['viewed', 'accepted', 'rejected', 'expired', 'converted'])(
    'returns false for %s',
    (status) => {
      expect(canSendQuotation(status)).toBe(false);
    }
  );
});

describe('canConvertQuotation', () => {
  it('returns true for accepted only', () => {
    expect(canConvertQuotation('accepted')).toBe(true);
  });

  it.each<QuotationStatus>(['draft', 'sent', 'viewed', 'rejected', 'expired', 'converted'])(
    'returns false for %s',
    (status) => {
      expect(canConvertQuotation(status)).toBe(false);
    }
  );
});
