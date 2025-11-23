// Dynamic booking field configuration types

export type FieldType = 'text' | 'number' | 'date' | 'time' | 'datetime' | 'select' | 'checkbox' | 'textarea' | 'tel' | 'email';

export type BookingType = 'standard' | 'digital_product' | 'accommodation' | 'transfer' | 'tour' | 'rental';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
}

export interface ConditionalDisplay {
  field: string;
  value: any;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface BookingFieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  conditional?: ConditionalDisplay;
  defaultValue?: any;
  helpText?: string;
  gridColumns?: number; // For layout: 1 = full width, 2 = half width, etc.
}

export interface BookingFieldConfig {
  // Standard fields to always include
  required_fields?: string[];

  // Optional standard fields
  optional_fields?: string[];

  // Fields to hide completely
  hide_fields?: string[];

  // Rename standard field labels
  rename_fields?: Record<string, string>;

  // Custom fields specific to this activity type
  custom_fields?: BookingFieldDefinition[];

  // Field ordering
  field_order?: string[];

  // Grouping for better UX
  field_groups?: FieldGroup[];
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Standard field definitions (these can be overridden)
export const STANDARD_FIELDS: Record<string, BookingFieldDefinition> = {
  booking_date: {
    name: 'booking_date',
    type: 'date',
    label: 'Select Date',
    required: true,
    gridColumns: 1,
  },
  check_in_date: {
    name: 'check_in_date',
    type: 'date',
    label: 'Check-in Date',
    required: true,
    gridColumns: 2,
  },
  check_out_date: {
    name: 'check_out_date',
    type: 'date',
    label: 'Check-out Date',
    required: true,
    gridColumns: 2,
  },
  number_of_people: {
    name: 'number_of_people',
    type: 'number',
    label: 'Number of People',
    required: true,
    validation: { min: 1 },
    gridColumns: 1,
  },
  full_name: {
    name: 'full_name',
    type: 'text',
    label: 'Full Name',
    required: true,
    gridColumns: 2,
  },
  email: {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    gridColumns: 2,
  },
  phone: {
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: '+1234567890',
    required: true,
    gridColumns: 2,
  },
  nationality: {
    name: 'nationality',
    type: 'text',
    label: 'Nationality',
    required: false,
    gridColumns: 2,
  },
  special_requests: {
    name: 'special_requests',
    type: 'textarea',
    label: 'Special Requests',
    placeholder: 'Any dietary restrictions, accessibility needs, etc.',
    required: false,
    gridColumns: 1,
  },
  notes: {
    name: 'notes',
    type: 'textarea',
    label: 'Additional Notes',
    required: false,
    gridColumns: 1,
  },
};

// Preset configurations for common booking types
export const BOOKING_TYPE_PRESETS: Record<BookingType, BookingFieldConfig> = {
  standard: {
    required_fields: ['booking_date', 'number_of_people', 'full_name', 'email', 'phone'],
    optional_fields: ['nationality', 'special_requests'],
    field_groups: [
      {
        title: 'Booking Details',
        fields: ['booking_date', 'number_of_people'],
      },
      {
        title: 'Guest Information',
        fields: ['full_name', 'email', 'phone', 'nationality'],
      },
      {
        title: 'Additional Information',
        fields: ['special_requests'],
      },
    ],
  },

  digital_product: {
    required_fields: ['email', 'phone'],
    hide_fields: ['booking_date', 'number_of_people'],
    custom_fields: [
      {
        name: 'delivery_email',
        type: 'email',
        label: 'Delivery Email (if different)',
        required: false,
        gridColumns: 1,
      },
    ],
    field_groups: [
      {
        title: 'Contact Information',
        fields: ['email', 'phone', 'delivery_email'],
      },
    ],
  },

  accommodation: {
    required_fields: ['check_in_date', 'check_out_date', 'number_of_people', 'full_name', 'email', 'phone'],
    hide_fields: ['booking_date'],
    optional_fields: ['special_requests'],
    field_groups: [
      {
        title: 'Stay Details',
        fields: ['check_in_date', 'check_out_date', 'number_of_people'],
      },
      {
        title: 'Guest Information',
        fields: ['full_name', 'email', 'phone'],
      },
      {
        title: 'Special Requests',
        fields: ['special_requests'],
      },
    ],
  },

  transfer: {
    required_fields: ['booking_date', 'number_of_people', 'full_name', 'email', 'phone'],
    custom_fields: [
      {
        name: 'pickup_location',
        type: 'text',
        label: 'Pickup Location',
        placeholder: 'Hotel name or address',
        required: true,
        gridColumns: 2,
      },
      {
        name: 'dropoff_location',
        type: 'text',
        label: 'Drop-off Location',
        placeholder: 'Destination',
        required: true,
        gridColumns: 2,
      },
      {
        name: 'pickup_time',
        type: 'time',
        label: 'Preferred Pickup Time',
        required: true,
        gridColumns: 2,
      },
      {
        name: 'luggage_count',
        type: 'number',
        label: 'Number of Luggage Pieces',
        required: false,
        validation: { min: 0, max: 20 },
        gridColumns: 2,
      },
    ],
    field_groups: [
      {
        title: 'Transfer Details',
        fields: ['booking_date', 'pickup_time', 'pickup_location', 'dropoff_location'],
      },
      {
        title: 'Passenger Information',
        fields: ['number_of_people', 'luggage_count', 'full_name', 'email', 'phone'],
      },
    ],
  },

  tour: {
    required_fields: ['booking_date', 'number_of_people', 'full_name', 'email', 'phone'],
    optional_fields: ['special_requests'],
    custom_fields: [
      {
        name: 'pickup_required',
        type: 'checkbox',
        label: 'Require hotel pickup?',
        required: false,
        gridColumns: 1,
      },
      {
        name: 'hotel_name',
        type: 'text',
        label: 'Hotel Name',
        placeholder: 'Your hotel name',
        required: false,
        conditional: {
          field: 'pickup_required',
          value: true,
        },
        gridColumns: 1,
      },
    ],
    field_groups: [
      {
        title: 'Tour Details',
        fields: ['booking_date', 'number_of_people'],
      },
      {
        title: 'Guest Information',
        fields: ['full_name', 'email', 'phone'],
      },
      {
        title: 'Pickup Information',
        fields: ['pickup_required', 'hotel_name'],
      },
      {
        title: 'Additional Information',
        fields: ['special_requests'],
      },
    ],
  },

  rental: {
    required_fields: ['booking_date', 'full_name', 'email', 'phone'],
    custom_fields: [
      {
        name: 'rental_duration',
        type: 'number',
        label: 'Rental Duration (hours)',
        required: true,
        validation: { min: 1, max: 72 },
        gridColumns: 2,
      },
      {
        name: 'return_date',
        type: 'datetime',
        label: 'Expected Return Date & Time',
        required: true,
        gridColumns: 2,
      },
    ],
    field_groups: [
      {
        title: 'Rental Details',
        fields: ['booking_date', 'rental_duration', 'return_date'],
      },
      {
        title: 'Renter Information',
        fields: ['full_name', 'email', 'phone'],
      },
    ],
  },
};

// Helper to merge configurations
export function mergeBookingConfigs(
  baseConfig: BookingFieldConfig,
  customConfig?: Partial<BookingFieldConfig>
): BookingFieldConfig {
  if (!customConfig) return baseConfig;

  return {
    required_fields: customConfig.required_fields ?? baseConfig.required_fields,
    optional_fields: customConfig.optional_fields ?? baseConfig.optional_fields,
    hide_fields: [...(baseConfig.hide_fields || []), ...(customConfig.hide_fields || [])],
    rename_fields: { ...baseConfig.rename_fields, ...customConfig.rename_fields },
    custom_fields: [...(baseConfig.custom_fields || []), ...(customConfig.custom_fields || [])],
    field_order: customConfig.field_order ?? baseConfig.field_order,
    field_groups: customConfig.field_groups ?? baseConfig.field_groups,
  };
}

// Helper to get all fields for a configuration
export function getFieldsForConfig(config: BookingFieldConfig): BookingFieldDefinition[] {
  const fields: BookingFieldDefinition[] = [];
  const allFieldNames = new Set<string>();

  // Add required standard fields
  config.required_fields?.forEach(fieldName => {
    if (!config.hide_fields?.includes(fieldName) && STANDARD_FIELDS[fieldName]) {
      const field = { ...STANDARD_FIELDS[fieldName] };
      if (config.rename_fields?.[fieldName]) {
        field.label = config.rename_fields[fieldName];
      }
      fields.push(field);
      allFieldNames.add(fieldName);
    }
  });

  // Add optional standard fields
  config.optional_fields?.forEach(fieldName => {
    if (!config.hide_fields?.includes(fieldName) && STANDARD_FIELDS[fieldName] && !allFieldNames.has(fieldName)) {
      const field = { ...STANDARD_FIELDS[fieldName], required: false };
      if (config.rename_fields?.[fieldName]) {
        field.label = config.rename_fields[fieldName];
      }
      fields.push(field);
      allFieldNames.add(fieldName);
    }
  });

  // Add custom fields
  config.custom_fields?.forEach(field => {
    if (!allFieldNames.has(field.name)) {
      fields.push(field);
      allFieldNames.add(field.name);
    }
  });

  return fields;
}
