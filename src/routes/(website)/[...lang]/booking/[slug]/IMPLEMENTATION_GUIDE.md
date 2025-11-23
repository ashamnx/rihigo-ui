# Dynamic Booking Form Implementation Guide

## Overview

The booking system now supports **dynamic form fields** based on activity type. Different activities (eSIM, ferry, hotel, tours) show different booking forms tailored to their specific needs.

## How It Works

### 1. Database Configuration

Each activity has a `booking_type` and `booking_field_config`:

```sql
-- Example: Ferry Transfer Activity
UPDATE activities SET
  booking_type = 'transfer',
  booking_field_config = '{
    "required_fields": ["booking_date", "number_of_people", "full_name", "email", "phone"],
    "custom_fields": [
      {
        "name": "pickup_location",
        "type": "text",
        "label": "Pickup Location",
        "required": true
      },
      {
        "name": "dropoff_location",
        "type": "text",
        "label": "Drop-off Location",
        "required": true
      }
    ]
  }'
WHERE slug = 'male-airport-transfer';
```

### 2. Activity Types

The system supports these booking types:

#### `standard` - Traditional Tours & Activities
**Fields:**
- Booking date
- Number of people
- Full name, email, phone
- Nationality (optional)
- Special requests (optional)

**Use cases:** Snorkeling, diving, city tours, fishing trips

---

#### `digital_product` - eSIM, Tickets, Vouchers
**Fields:**
- Email
- Phone
- Device type (for eSIM)
- Delivery email

**Hides:** Booking date, number of people

**Use cases:** eSIM cards, event tickets, gift vouchers

---

#### `accommodation` - Hotels & Resorts
**Fields:**
- Check-in date
- Check-out date
- Number of guests
- Room preferences
- Bed type selection
- Early check-in request

**Hides:** Single booking date (replaced with check-in/out)

**Use cases:** Hotel rooms, villas, guesthouses

---

#### `transfer` - Transportation Services
**Fields:**
- Booking date & time
- Number of passengers
- Pickup location
- Drop-off location
- Pickup time
- Luggage count
- Flight number (optional)

**Use cases:** Airport transfers, ferry tickets, speedboat transfers

---

#### `tour` - Guided Tours with Pickup
**Fields:**
- Booking date
- Number of people
- Pickup required (checkbox)
- Hotel name (conditional on pickup)
- Experience level
- Equipment rental

**Use cases:** Island tours, diving trips, fishing expeditions

---

#### `rental` - Equipment & Vehicle Rental
**Fields:**
- Rental start date/time
- Rental duration
- Expected return date/time
- Quantity

**Use cases:** Jet ski rental, bicycle rental, camera equipment

## Implementation Steps

### Step 1: Update Activity in Admin Panel

When creating/editing an activity, set the `booking_type`:

```typescript
// In admin activity form
<select name="booking_type">
  <option value="standard">Standard Tour/Activity</option>
  <option value="digital_product">Digital Product (eSIM, Tickets)</option>
  <option value="accommodation">Accommodation</option>
  <option value="transfer">Transfer/Transportation</option>
  <option value="tour">Guided Tour</option>
  <option value="rental">Rental Service</option>
</select>
```

### Step 2: Configure Custom Fields (Optional)

Add activity-specific fields:

```json
{
  "custom_fields": [
    {
      "name": "dietary_requirements",
      "type": "textarea",
      "label": "Dietary Requirements",
      "placeholder": "Any allergies or special dietary needs?",
      "required": false,
      "helpText": "We accommodate vegetarian, vegan, halal, and other dietary preferences"
    },
    {
      "name": "experience_level",
      "type": "select",
      "label": "Diving Experience",
      "required": true,
      "options": ["Beginner (0-10 dives)", "Intermediate (11-50 dives)", "Advanced (50+ dives)", "Professional"]
    }
  ]
}
```

### Step 3: Booking Form Renders Automatically

The booking page will automatically:

1. Read `activity.booking_type` and `activity.booking_field_config`
2. Load the appropriate preset from `BOOKING_TYPE_PRESETS`
3. Merge custom fields from the activity
4. Render the dynamic form with proper validation

### Step 4: Form Submission

All field values (standard + custom) are sent to the backend:

```json
{
  "activity_id": "uuid",
  "booking_date": "2025-11-25",
  "number_of_people": 2,
  "customer_info": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+9601234567",
    "custom_fields": {
      "dietary_requirements": "Vegetarian",
      "experience_level": "Intermediate (11-50 dives)"
    }
  }
}
```

## Example Configurations

### Example 1: eSIM Product

```typescript
const esimActivity = {
  booking_type: 'digital_product',
  booking_field_config: {
    required_fields: ['email', 'phone'],
    hide_fields: ['booking_date', 'number_of_people'],
    custom_fields: [
      {
        name: 'device_type',
        type: 'select',
        label: 'Device Type',
        required: true,
        options: ['iPhone', 'Samsung', 'Google Pixel', 'Other Android']
      },
      {
        name: 'esim_compatibility_confirmed',
        type: 'checkbox',
        label: 'I confirm my device supports eSIM',
        required: true
      }
    ]
  }
};
```

### Example 2: Ferry Transfer

```typescript
const ferryActivity = {
  booking_type: 'transfer',
  booking_field_config: {
    required_fields: ['booking_date', 'number_of_people', 'full_name', 'email', 'phone'],
    custom_fields: [
      {
        name: 'departure_island',
        type: 'select',
        label: 'Departure Island',
        required: true,
        options: ['Malé', 'Hulhumalé', 'Maafushi', 'Thulusdhoo']
      },
      {
        name: 'arrival_island',
        type: 'select',
        label: 'Arrival Island',
        required: true,
        options: ['Malé', 'Hulhumalé', 'Maafushi', 'Thulusdhoo']
      },
      {
        name: 'luggage_count',
        type: 'number',
        label: 'Number of Luggage Pieces',
        validation: { min: 0, max: 10 }
      }
    ],
    field_groups: [
      {
        title: 'Transfer Details',
        fields: ['departure_island', 'arrival_island', 'booking_date', 'number_of_people']
      },
      {
        title: 'Passenger Information',
        fields: ['full_name', 'email', 'phone', 'luggage_count']
      }
    ]
  }
};
```

### Example 3: Diving Trip with Conditional Fields

```typescript
const divingActivity = {
  booking_type: 'tour',
  booking_field_config: {
    required_fields: ['booking_date', 'number_of_people', 'full_name', 'email', 'phone'],
    custom_fields: [
      {
        name: 'certification_level',
        type: 'select',
        label: 'Diving Certification',
        required: true,
        options: ['PADI Open Water', 'PADI Advanced', 'SSI', 'Other', 'Not Certified']
      },
      {
        name: 'need_equipment',
        type: 'checkbox',
        label: 'Need to rent diving equipment?',
        required: false
      },
      {
        name: 'equipment_size',
        type: 'select',
        label: 'Wetsuit Size',
        required: false,
        conditional: {
          field: 'need_equipment',
          value: true
        },
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: 'medical_conditions',
        type: 'textarea',
        label: 'Any Medical Conditions We Should Know?',
        helpText: 'Include any conditions that may affect diving (asthma, heart conditions, etc.)',
        required: false
      }
    ]
  }
};
```

## Field Types Reference

| Type | HTML Input | Use Case |
|------|-----------|----------|
| `text` | `<input type="text">` | Names, addresses, general text |
| `email` | `<input type="email">` | Email addresses |
| `tel` | `<input type="tel">` | Phone numbers |
| `number` | `<input type="number">` | Quantities, counts, ages |
| `date` | `<input type="date">` | Single day selection |
| `time` | `<input type="time">` | Time selection |
| `datetime` | `<input type="datetime-local">` | Date and time together |
| `select` | `<select>` | Dropdown choices |
| `checkbox` | `<input type="checkbox">` | Yes/no, opt-in fields |
| `textarea` | `<textarea>` | Long text, descriptions |

## Validation

Fields support built-in validation:

```typescript
{
  name: 'age',
  type: 'number',
  label: 'Age',
  required: true,
  validation: {
    min: 18,
    max: 99
  }
}
```

```typescript
{
  name: 'passport_number',
  type: 'text',
  label: 'Passport Number',
  required: true,
  validation: {
    pattern: '[A-Z]{1,2}[0-9]{6,9}',
    minLength: 6,
    maxLength: 12
  }
}
```

## Backend Changes Required

### 1. Update Activity Model (Go)

```go
type Activity struct {
    // ... existing fields
    BookingType        string                 `json:"booking_type"`
    BookingFieldConfig map[string]interface{} `json:"booking_field_config"`
}
```

### 2. Update Booking Input to Accept Custom Fields

```go
type CreateBookingInput struct {
    ActivityID     string                 `json:"activity_id"`
    PackageID      string                 `json:"package_id"`
    BookingDate    time.Time              `json:"booking_date"`
    NumberOfPeople int                    `json:"number_of_people"`
    CustomerInfo   CustomerInfo           `json:"customer_info"`
    CustomFields   map[string]interface{} `json:"custom_fields"` // NEW
    PaymentMethod  string                 `json:"payment_method"`
}
```

### 3. Store Custom Fields in Database

Custom field responses are stored in the `customer_info` JSONB column or a separate `custom_field_responses` column.

## Migration Path

1. **Run migration 009** to add booking configuration columns
2. **Update API** to return booking_type and booking_field_config with activities
3. **Replace booking form** with dynamic version
4. **Configure activities** in admin panel with appropriate booking types
5. **Test each booking type** thoroughly

## Benefits

✅ **Flexibility**: Add new activity types without code changes
✅ **Consistency**: All booking forms follow same patterns
✅ **Validation**: Built-in field validation
✅ **User Experience**: Only show relevant fields
✅ **Scalability**: Easy to add new field types
✅ **Maintainability**: Configuration over code

## Next Steps

1. Update the booking page to use `DynamicFormField` component
2. Create admin UI for configuring booking fields
3. Add field validation messages
4. Implement conditional field logic
5. Add field grouping support
6. Create field preview in admin panel
