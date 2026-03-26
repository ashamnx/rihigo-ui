import {
  isInvoiceEditable,
  canSendInvoice,
  canVoidInvoice,
  canRecordPayment,
  isInvoiceOverdue,
  calculateInvoiceTotals,
  type InvoiceStatus,
  type InvoiceItemInput,
} from './invoice';

describe('isInvoiceEditable', () => {
  it('returns true for draft', () => {
    expect(isInvoiceEditable('draft')).toBe(true);
  });

  it.each<InvoiceStatus>(['pending', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'void'])(
    'returns false for %s',
    (status) => {
      expect(isInvoiceEditable(status)).toBe(false);
    }
  );
});

describe('canSendInvoice', () => {
  it.each<InvoiceStatus>(['draft', 'pending', 'sent', 'partial', 'overdue'])(
    'returns true for %s',
    (status) => {
      expect(canSendInvoice(status)).toBe(true);
    }
  );

  it.each<InvoiceStatus>(['paid', 'cancelled', 'void'])(
    'returns false for %s',
    (status) => {
      expect(canSendInvoice(status)).toBe(false);
    }
  );
});

describe('canVoidInvoice', () => {
  it.each<InvoiceStatus>(['draft', 'pending', 'sent', 'partial', 'overdue', 'cancelled'])(
    'returns true for %s',
    (status) => {
      expect(canVoidInvoice(status)).toBe(true);
    }
  );

  it('returns false for void', () => {
    expect(canVoidInvoice('void')).toBe(false);
  });

  it('returns false for paid', () => {
    expect(canVoidInvoice('paid')).toBe(false);
  });
});

describe('canRecordPayment', () => {
  it.each<InvoiceStatus>(['pending', 'sent', 'partial', 'overdue'])(
    'returns true for %s',
    (status) => {
      expect(canRecordPayment(status)).toBe(true);
    }
  );

  it.each<InvoiceStatus>(['draft', 'paid', 'cancelled', 'void'])(
    'returns false for %s',
    (status) => {
      expect(canRecordPayment(status)).toBe(false);
    }
  );
});

describe('isInvoiceOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when due date is past and status is open', () => {
    expect(isInvoiceOverdue('2024-06-10', 'pending')).toBe(true);
  });

  it('returns false when status is paid', () => {
    expect(isInvoiceOverdue('2024-06-10', 'paid')).toBe(false);
  });

  it('returns false when status is void', () => {
    expect(isInvoiceOverdue('2024-06-10', 'void')).toBe(false);
  });

  it('returns false when status is cancelled', () => {
    expect(isInvoiceOverdue('2024-06-10', 'cancelled')).toBe(false);
  });

  it('returns false when due date is in future', () => {
    expect(isInvoiceOverdue('2024-06-20', 'pending')).toBe(false);
  });
});

describe('calculateInvoiceTotals', () => {
  it('calculates subtotal from quantity * unit_price', () => {
    const items: InvoiceItemInput[] = [
      { item_type: 'service', description: 'Room', quantity: 2, unit: 'night', unit_price: 100, discount_amount: 0 },
    ];
    const result = calculateInvoiceTotals(items);
    expect(result.subtotal).toBe(200);
  });

  it('applies discount_percent to each line', () => {
    const items: InvoiceItemInput[] = [
      { item_type: 'service', description: 'Room', quantity: 2, unit: 'night', unit_price: 100, discount_percent: 10, discount_amount: 0 },
    ];
    const result = calculateInvoiceTotals(items);
    expect(result.discount_amount).toBe(20); // 200 * 10%
  });

  it('applies discount_amount to each line', () => {
    const items: InvoiceItemInput[] = [
      { item_type: 'service', description: 'Room', quantity: 1, unit: 'night', unit_price: 100, discount_amount: 15 },
    ];
    const result = calculateInvoiceTotals(items);
    expect(result.discount_amount).toBe(15);
  });

  it('applies both discount types together', () => {
    const items: InvoiceItemInput[] = [
      { item_type: 'service', description: 'Room', quantity: 2, unit: 'night', unit_price: 100, discount_percent: 10, discount_amount: 5 },
    ];
    const result = calculateInvoiceTotals(items);
    expect(result.discount_amount).toBe(25); // (200 * 10%) + 5
  });

  it('returns correct total (subtotal - discount + tax)', () => {
    const items: InvoiceItemInput[] = [
      { item_type: 'service', description: 'Room', quantity: 3, unit: 'night', unit_price: 100, discount_amount: 50 },
    ];
    const result = calculateInvoiceTotals(items);
    expect(result.subtotal).toBe(300);
    expect(result.discount_amount).toBe(50);
    expect(result.total).toBe(250); // 300 - 50 + 0 tax
  });

  it('handles empty items array', () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.discount_amount).toBe(0);
    expect(result.total).toBe(0);
  });
});
