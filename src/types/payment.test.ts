import { canApproveRefund, canProcessRefund, canApplyCreditNote, type RefundStatus, type CreditNoteStatus } from './payment';

describe('canApproveRefund', () => {
  it('returns true for pending', () => {
    expect(canApproveRefund('pending')).toBe(true);
  });

  it.each<RefundStatus>(['approved', 'processing', 'completed', 'rejected'])(
    'returns false for %s',
    (status) => {
      expect(canApproveRefund(status)).toBe(false);
    }
  );
});

describe('canProcessRefund', () => {
  it('returns true for approved', () => {
    expect(canProcessRefund('approved')).toBe(true);
  });

  it.each<RefundStatus>(['pending', 'processing', 'completed', 'rejected'])(
    'returns false for %s',
    (status) => {
      expect(canProcessRefund(status)).toBe(false);
    }
  );
});

describe('canApplyCreditNote', () => {
  it('returns true for active status', () => {
    expect(canApplyCreditNote('active', 100)).toBe(true);
  });

  it('returns true for partially_used with positive balance', () => {
    expect(canApplyCreditNote('partially_used', 50)).toBe(true);
  });

  it('returns false for partially_used with zero balance', () => {
    expect(canApplyCreditNote('partially_used', 0)).toBe(false);
  });

  it.each<CreditNoteStatus>(['fully_used', 'expired', 'voided'])(
    'returns false for %s',
    (status) => {
      expect(canApplyCreditNote(status, 100)).toBe(false);
    }
  );
});
