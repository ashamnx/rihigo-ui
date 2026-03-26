import {
  hasPermission,
  mergePermissions,
  DEFAULT_PERMISSIONS,
  type VendorStaff,
  type StaffPermissions,
} from './staff';

const makeStaff = (overrides: Partial<VendorStaff> = {}): VendorStaff => ({
  id: 'staff-1',
  vendor_id: 'vendor-1',
  name: 'John',
  email: 'john@example.com',
  role: 'admin',
  permissions: DEFAULT_PERMISSIONS.admin,
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('hasPermission', () => {
  it('returns true when staff has the permission', () => {
    expect(hasPermission(makeStaff(), 'bookings', 'create')).toBe(true);
  });

  it('returns false when staff lacks the permission', () => {
    const staff = makeStaff({ role: 'view_only', permissions: DEFAULT_PERMISSIONS.view_only });
    expect(hasPermission(staff, 'bookings', 'create')).toBe(false);
  });

  it('returns false when staff is inactive', () => {
    expect(hasPermission(makeStaff({ is_active: false }), 'bookings', 'create')).toBe(false);
  });

  it('returns false for non-existent action', () => {
    expect(hasPermission(makeStaff(), 'bookings', 'nonexistent')).toBe(false);
  });

  it('view_only can view bookings', () => {
    const staff = makeStaff({ permissions: DEFAULT_PERMISSIONS.view_only });
    expect(hasPermission(staff, 'bookings', 'view')).toBe(true);
  });

  it('staff cannot cancel bookings', () => {
    const staff = makeStaff({ permissions: DEFAULT_PERMISSIONS.staff });
    expect(hasPermission(staff, 'bookings', 'cancel')).toBe(false);
  });
});

describe('mergePermissions', () => {
  it('overrides specific permissions while keeping others', () => {
    const result = mergePermissions(DEFAULT_PERMISSIONS.view_only, {
      bookings: { view: true, create: true, edit: false, cancel: false },
    });
    expect(result.bookings.create).toBe(true);
    expect(result.guests.create).toBe(false); // unchanged
  });

  it('returns base unchanged when overrides is empty', () => {
    const result = mergePermissions(DEFAULT_PERMISSIONS.admin, {});
    expect(result).toEqual(DEFAULT_PERMISSIONS.admin);
  });

  it('handles partial overrides for a single category', () => {
    const result = mergePermissions(DEFAULT_PERMISSIONS.staff, {
      finance: { view: true, create_invoices: true, record_payments: true, manage_refunds: true },
    });
    expect(result.finance.manage_refunds).toBe(true);
    expect(result.bookings.cancel).toBe(false); // unchanged
  });
});
