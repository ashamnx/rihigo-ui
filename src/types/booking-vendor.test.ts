import { getNextBookingStatuses, calculateNights, type BookingStatus } from './booking-vendor';

describe('getNextBookingStatuses', () => {
  it('pending can go to confirmed or cancelled', () => {
    expect(getNextBookingStatuses('pending')).toEqual(['confirmed', 'cancelled']);
  });

  it('confirmed can go to checked_in, cancelled, or no_show', () => {
    expect(getNextBookingStatuses('confirmed')).toEqual(['checked_in', 'cancelled', 'no_show']);
  });

  it('checked_in can only go to checked_out', () => {
    expect(getNextBookingStatuses('checked_in')).toEqual(['checked_out']);
  });

  it.each<BookingStatus>(['checked_out', 'cancelled', 'no_show'])(
    '%s returns empty array',
    (status) => {
      expect(getNextBookingStatuses(status)).toEqual([]);
    }
  );
});

describe('calculateNights', () => {
  it('calculates 1 night for consecutive dates', () => {
    expect(calculateNights('2024-07-01', '2024-07-02')).toBe(1);
  });

  it('calculates 7 nights for one week', () => {
    expect(calculateNights('2024-07-01', '2024-07-08')).toBe(7);
  });

  it('handles same day (returns 0)', () => {
    expect(calculateNights('2024-07-01', '2024-07-01')).toBe(0);
  });

  it('handles reversed dates (uses absolute diff)', () => {
    expect(calculateNights('2024-07-08', '2024-07-01')).toBe(7);
  });
});
