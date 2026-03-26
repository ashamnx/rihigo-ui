import {
  STANDARD_FIELDS,
  BOOKING_TYPE_PRESETS,
  mergeBookingConfigs,
  getFieldsForConfig,
  type BookingFieldConfig,
  type BookingType,
} from './booking-fields';

describe('STANDARD_FIELDS', () => {
  it('defines expected standard fields', () => {
    const fieldNames = Object.keys(STANDARD_FIELDS);
    expect(fieldNames).toContain('booking_date');
    expect(fieldNames).toContain('check_in_date');
    expect(fieldNames).toContain('check_out_date');
    expect(fieldNames).toContain('number_of_people');
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('phone');
    expect(fieldNames).toContain('nationality');
    expect(fieldNames).toContain('special_requests');
    expect(fieldNames).toContain('notes');
  });

  it('booking_date field is required with type date', () => {
    expect(STANDARD_FIELDS.booking_date.type).toBe('date');
    expect(STANDARD_FIELDS.booking_date.required).toBe(true);
  });

  it('each field has name, type, label, required', () => {
    for (const [key, field] of Object.entries(STANDARD_FIELDS)) {
      expect(field.name).toBe(key);
      expect(field.type).toBeDefined();
      expect(field.label).toBeDefined();
      expect(typeof field.required).toBe('boolean');
    }
  });
});

describe('BOOKING_TYPE_PRESETS', () => {
  it('defines presets for all 6 booking types', () => {
    const types: BookingType[] = ['standard', 'digital_product', 'accommodation', 'transfer', 'tour', 'rental'];
    types.forEach(type => {
      expect(BOOKING_TYPE_PRESETS[type]).toBeDefined();
    });
  });

  it('standard preset includes expected required fields', () => {
    const preset = BOOKING_TYPE_PRESETS.standard;
    expect(preset.required_fields).toContain('booking_date');
    expect(preset.required_fields).toContain('number_of_people');
    expect(preset.required_fields).toContain('name');
    expect(preset.required_fields).toContain('email');
    expect(preset.required_fields).toContain('phone');
  });

  it('digital_product preset hides booking_date and number_of_people', () => {
    const preset = BOOKING_TYPE_PRESETS.digital_product;
    expect(preset.hide_fields).toContain('booking_date');
    expect(preset.hide_fields).toContain('number_of_people');
  });

  it('accommodation preset hides booking_date but requires check_in/check_out', () => {
    const preset = BOOKING_TYPE_PRESETS.accommodation;
    expect(preset.hide_fields).toContain('booking_date');
    expect(preset.required_fields).toContain('check_in_date');
    expect(preset.required_fields).toContain('check_out_date');
  });

  it('transfer preset includes custom pickup/dropoff fields', () => {
    const preset = BOOKING_TYPE_PRESETS.transfer;
    const customNames = preset.custom_fields?.map(f => f.name) || [];
    expect(customNames).toContain('pickup_location');
    expect(customNames).toContain('dropoff_location');
    expect(customNames).toContain('pickup_time');
    expect(customNames).toContain('luggage_count');
  });

  it('tour preset has conditional hotel_name field', () => {
    const preset = BOOKING_TYPE_PRESETS.tour;
    const hotelField = preset.custom_fields?.find(f => f.name === 'hotel_name');
    expect(hotelField).toBeDefined();
    expect(hotelField!.conditional).toEqual({
      field: 'pickup_required',
      value: true,
    });
  });

  it('rental preset includes rental_duration and return_date', () => {
    const preset = BOOKING_TYPE_PRESETS.rental;
    const customNames = preset.custom_fields?.map(f => f.name) || [];
    expect(customNames).toContain('rental_duration');
    expect(customNames).toContain('return_date');
  });
});

describe('mergeBookingConfigs', () => {
  const base: BookingFieldConfig = {
    required_fields: ['name', 'email'],
    optional_fields: ['phone'],
    hide_fields: ['notes'],
    rename_fields: { name: 'Your Name' },
    custom_fields: [{ name: 'custom1', type: 'text', label: 'Custom 1', required: false }],
    field_order: ['name', 'email'],
    field_groups: [{ title: 'Group 1', fields: ['name'] }],
  };

  it('returns base config when custom is undefined', () => {
    expect(mergeBookingConfigs(base, undefined)).toBe(base);
  });

  it('overrides required_fields when custom provides them', () => {
    const result = mergeBookingConfigs(base, { required_fields: ['phone'] });
    expect(result.required_fields).toEqual(['phone']);
  });

  it('accumulates hide_fields from both base and custom', () => {
    const result = mergeBookingConfigs(base, { hide_fields: ['special_requests'] });
    expect(result.hide_fields).toEqual(['notes', 'special_requests']);
  });

  it('merges rename_fields with custom overriding base', () => {
    const result = mergeBookingConfigs(base, { rename_fields: { email: 'Your Email' } });
    expect(result.rename_fields).toEqual({ name: 'Your Name', email: 'Your Email' });
  });

  it('concatenates custom_fields from both configs', () => {
    const result = mergeBookingConfigs(base, {
      custom_fields: [{ name: 'custom2', type: 'text', label: 'Custom 2', required: false }],
    });
    expect(result.custom_fields).toHaveLength(2);
    expect(result.custom_fields![0].name).toBe('custom1');
    expect(result.custom_fields![1].name).toBe('custom2');
  });

  it('uses custom field_order when provided', () => {
    const result = mergeBookingConfigs(base, { field_order: ['email', 'name'] });
    expect(result.field_order).toEqual(['email', 'name']);
  });

  it('uses base field_order when custom does not provide one', () => {
    const result = mergeBookingConfigs(base, { required_fields: ['name'] });
    expect(result.field_order).toEqual(['name', 'email']);
  });
});

describe('getFieldsForConfig', () => {
  it('returns required standard fields', () => {
    const fields = getFieldsForConfig({ required_fields: ['name', 'email'] });
    expect(fields).toHaveLength(2);
    expect(fields[0].name).toBe('name');
    expect(fields[1].name).toBe('email');
  });

  it('returns optional standard fields with required=false', () => {
    const fields = getFieldsForConfig({
      required_fields: ['name'],
      optional_fields: ['nationality'],
    });
    const nationality = fields.find(f => f.name === 'nationality');
    expect(nationality).toBeDefined();
    expect(nationality!.required).toBe(false);
  });

  it('returns custom fields', () => {
    const fields = getFieldsForConfig({
      custom_fields: [{ name: 'custom1', type: 'text', label: 'Custom', required: true }],
    });
    expect(fields).toHaveLength(1);
    expect(fields[0].name).toBe('custom1');
  });

  it('respects hide_fields', () => {
    const fields = getFieldsForConfig({
      required_fields: ['name', 'email', 'phone'],
      hide_fields: ['email'],
    });
    const names = fields.map(f => f.name);
    expect(names).not.toContain('email');
    expect(names).toContain('name');
    expect(names).toContain('phone');
  });

  it('applies rename_fields to field labels', () => {
    const fields = getFieldsForConfig({
      required_fields: ['name'],
      rename_fields: { name: 'Guest Name' },
    });
    expect(fields[0].label).toBe('Guest Name');
  });

  it('does not duplicate fields across required/optional/custom', () => {
    const fields = getFieldsForConfig({
      required_fields: ['name'],
      optional_fields: ['name'],
      custom_fields: [{ name: 'name', type: 'text', label: 'Name', required: false }],
    });
    expect(fields).toHaveLength(1);
  });

  it('handles empty config', () => {
    const fields = getFieldsForConfig({});
    expect(fields).toHaveLength(0);
  });

  it('standard booking type produces correct fields', () => {
    const fields = getFieldsForConfig(BOOKING_TYPE_PRESETS.standard);
    const names = fields.map(f => f.name);
    expect(names).toContain('booking_date');
    expect(names).toContain('number_of_people');
    expect(names).toContain('name');
    expect(names).toContain('email');
    expect(names).toContain('phone');
    expect(names).toContain('nationality');
    expect(names).toContain('special_requests');
  });

  it('digital_product produces only contact + delivery fields', () => {
    const fields = getFieldsForConfig(BOOKING_TYPE_PRESETS.digital_product);
    const names = fields.map(f => f.name);
    expect(names).toContain('email');
    expect(names).toContain('phone');
    expect(names).toContain('delivery_email');
    expect(names).not.toContain('booking_date');
    expect(names).not.toContain('number_of_people');
  });

  it('accommodation uses check-in/out instead of booking_date', () => {
    const fields = getFieldsForConfig(BOOKING_TYPE_PRESETS.accommodation);
    const names = fields.map(f => f.name);
    expect(names).toContain('check_in_date');
    expect(names).toContain('check_out_date');
    expect(names).not.toContain('booking_date');
  });
});
