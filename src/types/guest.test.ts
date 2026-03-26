import { getGuestFullName, type Guest } from './guest';

const makeGuest = (first: string, last: string): Guest => ({
  id: 'g-1',
  vendor_id: 'v-1',
  source_type: 'direct',
  first_name: first,
  last_name: last,
  total_bookings: 0,
  total_spend: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
});

describe('getGuestFullName', () => {
  it('combines first and last name', () => {
    expect(getGuestFullName(makeGuest('John', 'Doe'))).toBe('John Doe');
  });

  it('trims outer whitespace', () => {
    // The function does `${first} ${last}`.trim() - trims only outer whitespace
    expect(getGuestFullName(makeGuest(' Alice ', ' Smith '))).toBe('Alice   Smith');
  });

  it('handles empty last name', () => {
    expect(getGuestFullName(makeGuest('Madonna', ''))).toBe('Madonna');
  });
});
