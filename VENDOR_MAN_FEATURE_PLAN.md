# Vendor Booking & Guest Management System - Feature Plan

## Executive Summary

Transform the Rihigo platform into a **full-fledged Property Management System (PMS)** that vendors can use as their primary booking and guest management system. The design uses a **service-type agnostic core** with specialized extensions for different verticals.

---

## Phase 1: Core Foundation

### 1.1 Service Type Framework

Create a flexible service type system that allows vendors to define what they offer:

```sql
vendor_service_types
├── id (UUID)
├── vendor_id (FK)
├── service_type (accommodation | tour | transfer | rental | activity)
├── is_primary (boolean)
├── settings (JSONB - type-specific config)
├── is_active (boolean)
└── created_at, updated_at
```

**Benefits:**
- Single vendor can offer multiple service types
- Each service type has its own configuration
- Easy to extend for future service types

---

### 1.2 Property/Resource Management

**Core Entity: `vendor_resources`** (Generic container for rooms, vehicles, equipment, etc.)

```sql
vendor_resources
├── id (UUID)
├── vendor_id (FK)
├── service_type (accommodation | tour | transfer | rental)
├── resource_type (room | vehicle | equipment | boat)
├── name, description
├── code/sku (vendor's internal reference)
├── capacity (max_adults, max_children, max_occupancy)
├── base_price, currency
├── status (available | maintenance | retired)
├── settings (JSONB)
└── created_at, updated_at

vendor_resource_media
├── resource_id (FK)
├── media_type (image | video | document)
├── url, alt_text, sort_order
└── is_primary
```

---

### 1.3 Accommodation-Specific Extensions

**Room Types & Amenities:**

```sql
accommodation_room_types
├── resource_id (FK to vendor_resources)
├── room_type (standard | deluxe | suite | villa | dormitory)
├── bed_configuration (JSONB: [{type: "king", count: 1}])
├── size_sqm
├── floor_level
├── view_type (ocean | garden | pool | city)
└── is_smoking_allowed

resource_amenities
├── id (UUID)
├── resource_id (FK)
├── amenity_id (FK to amenities master table)
├── is_included (boolean)
├── additional_cost (DECIMAL)

amenities (master table)
├── id (UUID)
├── category (room | property | bathroom | entertainment | safety)
├── name, icon
├── translations (JSONB)
```

**Services & Add-ons:**

```sql
vendor_services
├── id (UUID)
├── vendor_id (FK)
├── service_category (food | transport | wellness | activity)
├── name, description
├── pricing_type (per_person | per_unit | per_night | per_booking)
├── price, currency
├── availability (JSONB: schedule, blackout dates)
├── is_active

resource_services (link services to resources)
├── resource_id (FK)
├── service_id (FK)
├── is_mandatory
├── override_price (NULL = use default)
```

---

### 1.4 Universal Guest Management

**Guest Profiles (Service-type agnostic):**

```sql
guests
├── id (UUID)
├── vendor_id (FK) - vendor who created this guest
├── source_type (direct | platform | ota | agent)
├── source_name (agoda | booking.com | direct, etc.)
├── external_reference (OTA booking reference)
│
├── -- Personal Info --
├── first_name, last_name
├── email, phone
├── nationality, country_of_residence
├── date_of_birth
├── gender
├── preferred_language
│
├── -- Identification --
├── id_type (passport | national_id | driver_license)
├── id_number
├── id_expiry_date
├── id_document_url (encrypted storage)
│
├── -- Preferences --
├── preferences (JSONB: dietary, accessibility, room preferences)
├── notes (internal vendor notes)
├── tags (JSONB: ["VIP", "returning", "corporate"])
│
├── -- Statistics --
├── total_bookings, total_spend
├── first_visit_at, last_visit_at
├── loyalty_tier (bronze | silver | gold | platinum)
│
└── created_at, updated_at

guest_history (audit trail)
├── guest_id (FK)
├── action (created | updated | merged | deleted)
├── changed_by (staff_id)
├── changes (JSONB: before/after)
├── created_at
```

---

### 1.5 Enhanced Booking System

**Vendor Bookings (Direct & External):**

```sql
vendor_bookings
├── id (UUID)
├── vendor_id (FK)
├── booking_number (vendor's reference)
├──
├── -- Source --
├── source_type (platform | direct | ota | agent | phone | walk_in)
├── source_name (agoda | booking.com | expedia | direct)
├── external_booking_id (OTA confirmation number)
├──
├── -- Guest --
├── primary_guest_id (FK to guests)
├── guest_count (adults, children, infants)
├──
├── -- Resource/Service --
├── resource_id (FK to vendor_resources, nullable)
├── activity_id (FK to activities, nullable - for platform bookings)
├── package_id (FK, nullable)
├── service_type (accommodation | tour | transfer | rental | activity)
├──
├── -- Dates --
├── check_in_date / start_date
├── check_out_date / end_date
├── nights_count / duration
├──
├── -- Pricing --
├── subtotal, taxes, fees, total
├── currency
├── commission_amount (for OTA bookings)
├── net_revenue
├── pricing_breakdown (JSONB: nightly rates, add-ons)
├──
├── -- Status --
├── status (pending | confirmed | checked_in | checked_out | cancelled | no_show)
├── payment_status (unpaid | partial | paid | refunded)
├──
├── -- Additional --
├── special_requests (TEXT)
├── internal_notes (TEXT)
├── tags (JSONB)
├──
└── created_at, updated_at, created_by

vendor_booking_guests (additional guests beyond primary)
├── booking_id (FK)
├── guest_id (FK)
├── is_primary (boolean)
├── room_assignment (for multi-room bookings)

vendor_booking_services (add-ons attached to booking)
├── booking_id (FK)
├── service_id (FK)
├── quantity
├── unit_price
├── total_price
├── scheduled_at (for scheduled services)
├── status (pending | delivered | cancelled)
```

---

### 1.6 Availability & Inventory Management

```sql
resource_availability
├── id (UUID)
├── resource_id (FK)
├── date
├── available_count (for multi-unit resources)
├── status (available | blocked | maintenance)
├── price_override (DECIMAL, nullable)
├── min_stay, max_stay
├── notes
├──
└── UNIQUE(resource_id, date)

resource_rate_plans
├── id (UUID)
├── resource_id (FK)
├── name (standard | early_bird | last_minute | corporate)
├── discount_type (percentage | fixed)
├── discount_value
├── valid_from, valid_to
├── booking_window_days (book X days in advance)
├── min_stay, max_stay
├── is_active
```

---

### 1.7 Channel Management (OTA Integration Prep)

```sql
vendor_channels
├── id (UUID)
├── vendor_id (FK)
├── channel_type (agoda | booking | expedia | airbnb | direct)
├── channel_credentials (JSONB, encrypted)
├── sync_settings (JSONB: what to sync)
├── last_sync_at
├── status (active | paused | disconnected)
├── commission_rate (DECIMAL)

channel_sync_logs
├── channel_id (FK)
├── sync_type (availability | rates | bookings)
├── direction (inbound | outbound)
├── status (success | failed)
├── details (JSONB)
├── created_at
```

---

## Phase 1: Finance Module

### 1.8 Quotations

```sql
quotations
├── id (UUID)
├── vendor_id (FK)
├── quotation_number (VARCHAR, unique per vendor: QUO-2024-0001)
├──
├── -- Customer --
├── guest_id (FK, nullable - for existing guests)
├── customer_name, customer_email, customer_phone
├── customer_company (for B2B quotes)
├──
├── -- Dates --
├── issue_date
├── valid_until
├──
├── -- Service Details --
├── service_type (accommodation | tour | transfer | rental | activity)
├── resource_id (FK, nullable)
├── activity_id (FK, nullable)
├── start_date, end_date
├── guest_count (adults, children, infants)
├──
├── -- Pricing --
├── subtotal (DECIMAL 12,2)
├── discount_amount (DECIMAL 12,2)
├── tax_amount (DECIMAL 12,2)
├── total (DECIMAL 12,2)
├── currency (VARCHAR 3)
├──
├── -- Status --
├── status (draft | sent | viewed | accepted | rejected | expired | converted)
├── sent_at
├── viewed_at
├── responded_at
├── converted_to_booking_id (FK, nullable)
├──
├── -- Content --
├── notes (TEXT - shown to customer)
├── internal_notes (TEXT - vendor only)
├── terms_and_conditions (TEXT)
├──
├── -- Metadata --
├── created_by (FK to vendor_staff)
├── created_at, updated_at

quotation_items
├── id (UUID)
├── quotation_id (FK)
├── item_type (accommodation | service | fee | tax | discount)
├── description
├── quantity (DECIMAL 10,2)
├── unit (night | person | unit | trip | hour)
├── unit_price (DECIMAL 12,2)
├── discount_percent (DECIMAL 5,2, nullable)
├── discount_amount (DECIMAL 12,2, nullable)
├── tax_rate_id (FK, nullable)
├── tax_amount (DECIMAL 12,2)
├── line_total (DECIMAL 12,2)
├── sort_order
├──
├── -- Reference --
├── resource_id (FK, nullable)
├── service_id (FK, nullable)
├── rate_plan_id (FK, nullable)
```

---

### 1.9 Invoices

```sql
invoices
├── id (UUID)
├── vendor_id (FK)
├── invoice_number (VARCHAR, unique per vendor: INV-2024-0001)
├──
├── -- References --
├── booking_id (FK, nullable)
├── quotation_id (FK, nullable)
├──
├── -- Customer (Billing) --
├── guest_id (FK, nullable)
├── billing_name
├── billing_email
├── billing_phone
├── billing_address (TEXT)
├── billing_company
├── tax_id (customer's tax/VAT number)
├──
├── -- Dates --
├── issue_date
├── due_date
├──
├── -- Amounts --
├── subtotal (DECIMAL 12,2)
├── discount_amount (DECIMAL 12,2)
├── taxable_amount (DECIMAL 12,2)
├── tax_amount (DECIMAL 12,2)
├── total (DECIMAL 12,2)
├── currency (VARCHAR 3)
├──
├── -- Payment Status --
├── amount_paid (DECIMAL 12,2, default 0)
├── amount_due (DECIMAL 12,2) - computed or stored
├── status (draft | pending | sent | partial | paid | overdue | cancelled | void)
├──
├── -- Content --
├── notes (TEXT)
├── footer_text (TEXT)
├── payment_instructions (TEXT)
├──
├── -- Metadata --
├── sent_at
├── paid_at
├── voided_at
├── voided_by (FK)
├── void_reason (TEXT)
├── created_by (FK to vendor_staff)
├── created_at, updated_at

invoice_items
├── id (UUID)
├── invoice_id (FK)
├── item_type (accommodation | service | fee | adjustment | discount)
├── description
├── quantity (DECIMAL 10,2)
├── unit (night | person | unit | trip | hour | item)
├── unit_price (DECIMAL 12,2)
├── discount_percent (DECIMAL 5,2, nullable)
├── discount_amount (DECIMAL 12,2)
├── tax_rate_id (FK, nullable)
├── tax_amount (DECIMAL 12,2)
├── line_total (DECIMAL 12,2)
├── sort_order
├──
├── -- Reference --
├── booking_id (FK, nullable)
├── resource_id (FK, nullable)
├── service_id (FK, nullable)
```

---

### 1.10 Tax Configuration

```sql
tax_rates
├── id (UUID)
├── vendor_id (FK, nullable - NULL = system-wide)
├── name (VARCHAR: "GST", "TGST", "Service Charge", "Green Tax")
├── code (VARCHAR: "GST", "TGST", "SC", "GT")
├── rate (DECIMAL 5,2: 16.00 for 16%)
├── rate_type (percentage | fixed_per_unit | fixed_per_booking)
├──
├── -- Applicability --
├── applies_to (JSONB: ["accommodation", "tour", "transfer"])
├── applies_to_foreigners_only (boolean - for Green Tax)
├──
├── -- Validity --
├── effective_from (DATE)
├── effective_to (DATE, nullable)
├── is_active (boolean)
├──
├── -- Display --
├── is_inclusive (boolean - price includes tax)
├── show_on_invoice (boolean)
├── sort_order
├──
└── created_at, updated_at

vendor_tax_settings
├── id (UUID)
├── vendor_id (FK)
├── tax_rate_id (FK)
├── is_enabled (boolean)
├── override_rate (DECIMAL 5,2, nullable)
├──
└── UNIQUE(vendor_id, tax_rate_id)

tax_exemptions
├── id (UUID)
├── vendor_id (FK)
├── tax_rate_id (FK)
├── exemption_type (guest_nationality | booking_type | promo_code)
├── conditions (JSONB: {nationalities: ["MV"], booking_types: ["corporate"]})
├── valid_from, valid_to
├── is_active
```

---

### 1.11 Discounts & Promotions

```sql
discount_rules
├── id (UUID)
├── vendor_id (FK)
├── code (VARCHAR, nullable - for promo codes)
├── name
├── description
├──
├── -- Discount Value --
├── discount_type (percentage | fixed | free_nights | free_service)
├── discount_value (DECIMAL 10,2)
├── max_discount_amount (DECIMAL 10,2, nullable - cap for percentage)
├──
├── -- Applicability --
├── applies_to (JSONB: {service_types: [], resource_ids: [], rate_plans: []})
├── min_nights (INT, nullable)
├── min_amount (DECIMAL 10,2, nullable)
├── min_guests (INT, nullable)
├──
├── -- Booking Window --
├── booking_start_date, booking_end_date (when booking must be made)
├── stay_start_date, stay_end_date (when stay must occur)
├── valid_days_of_week (JSONB: [0,1,2,3,4,5,6])
├──
├── -- Limits --
├── usage_limit (INT, nullable - total uses)
├── usage_per_guest (INT, nullable)
├── current_usage (INT, default 0)
├──
├── -- Stacking --
├── is_combinable (boolean - can combine with other discounts)
├── priority (INT - higher = applied first)
├──
├── -- Status --
├── status (active | paused | expired | depleted)
├── is_automatic (boolean - auto-apply vs code required)
├──
└── created_at, updated_at, created_by

discount_usage
├── id (UUID)
├── discount_rule_id (FK)
├── booking_id (FK)
├── guest_id (FK, nullable)
├── discount_amount (DECIMAL 12,2)
├── applied_at
├── applied_by (FK to vendor_staff, nullable)
```

---

### 1.12 Payments

```sql
payments
├── id (UUID)
├── vendor_id (FK)
├── payment_number (VARCHAR: PAY-2024-0001)
├──
├── -- Reference --
├── invoice_id (FK, nullable)
├── booking_id (FK, nullable)
├──
├── -- Customer --
├── guest_id (FK, nullable)
├── payer_name
├── payer_email
├──
├── -- Amount --
├── amount (DECIMAL 12,2)
├── currency (VARCHAR 3)
├── exchange_rate (DECIMAL 10,6, nullable - if different from invoice currency)
├── amount_in_base_currency (DECIMAL 12,2)
├──
├── -- Method --
├── payment_method (cash | card | bank_transfer | online | wallet | other)
├── payment_provider (stripe | bml | mib | paypal, nullable)
├── transaction_id (VARCHAR - provider's reference)
├──
├── -- Status --
├── status (pending | completed | failed | refunded | partially_refunded)
├──
├── -- Details --
├── payment_date
├── received_by (FK to vendor_staff, nullable)
├── notes
├──
├── -- Card Details (if applicable, PCI compliant - don't store full card) --
├── card_last_four (VARCHAR 4, nullable)
├── card_brand (VARCHAR, nullable)
├──
└── created_at, updated_at

payment_allocations
├── id (UUID)
├── payment_id (FK)
├── invoice_id (FK)
├── amount (DECIMAL 12,2)
├── allocated_at
├──
└── -- Allows splitting one payment across multiple invoices
```

---

### 1.13 Refunds

```sql
refunds
├── id (UUID)
├── vendor_id (FK)
├── refund_number (VARCHAR: REF-2024-0001)
├──
├── -- Reference --
├── payment_id (FK - original payment)
├── invoice_id (FK, nullable)
├── booking_id (FK, nullable)
├──
├── -- Customer --
├── guest_id (FK, nullable)
├── recipient_name
├──
├── -- Amount --
├── amount (DECIMAL 12,2)
├── currency (VARCHAR 3)
├──
├── -- Reason --
├── reason_type (cancellation | overcharge | service_issue | duplicate | other)
├── reason_description (TEXT)
├──
├── -- Method --
├── refund_method (original_method | cash | bank_transfer | credit_note)
├── refund_provider (stripe | bml, nullable)
├── transaction_id (VARCHAR - provider's reference)
├──
├── -- Status --
├── status (pending | approved | processing | completed | rejected)
├──
├── -- Approval --
├── requested_by (FK to vendor_staff)
├── approved_by (FK to vendor_staff, nullable)
├── approved_at
├── rejection_reason (TEXT, nullable)
├──
├── -- Completion --
├── processed_at
├── processed_by (FK)
├──
└── created_at, updated_at

credit_notes
├── id (UUID)
├── vendor_id (FK)
├── credit_note_number (VARCHAR: CN-2024-0001)
├──
├── -- Reference --
├── invoice_id (FK - original invoice)
├── refund_id (FK, nullable)
├── guest_id (FK)
├──
├── -- Amount --
├── amount (DECIMAL 12,2)
├── currency (VARCHAR 3)
├── balance_remaining (DECIMAL 12,2)
├──
├── -- Validity --
├── issue_date
├── expiry_date (nullable)
├──
├── -- Status --
├── status (active | partially_used | fully_used | expired | voided)
├──
├── -- Usage --
├── notes
├── created_by (FK)
├──
└── created_at, updated_at

credit_note_applications
├── id (UUID)
├── credit_note_id (FK)
├── invoice_id (FK) - invoice where credit was applied
├── amount (DECIMAL 12,2)
├── applied_at
├── applied_by (FK)
```

---

### 1.14 Billing Configuration

```sql
vendor_billing_settings
├── id (UUID)
├── vendor_id (FK, UNIQUE)
├──
├── -- Numbering --
├── invoice_prefix (VARCHAR: "INV")
├── invoice_next_number (INT)
├── quotation_prefix (VARCHAR: "QUO")
├── quotation_next_number (INT)
├── receipt_prefix (VARCHAR: "REC")
├── receipt_next_number (INT)
├──
├── -- Defaults --
├── default_currency (VARCHAR 3: "USD", "MVR")
├── default_payment_terms_days (INT: 7, 14, 30)
├── default_quotation_validity_days (INT: 14)
├──
├── -- Tax --
├── tax_registration_number (VARCHAR - vendor's tax ID)
├── is_tax_inclusive_pricing (boolean)
├──
├── -- Invoice Content --
├── invoice_header (TEXT - company details for invoice)
├── invoice_footer (TEXT - standard terms)
├── payment_instructions (TEXT)
├──
├── -- Bank Details (for bank transfer payments) --
├── bank_name
├── bank_account_name
├── bank_account_number
├── bank_swift_code
├── bank_iban (nullable)
├──
├── -- Automation --
├── auto_generate_invoice_on_booking (boolean)
├── auto_send_invoice_on_generation (boolean)
├── send_payment_reminders (boolean)
├── reminder_days_before_due (JSONB: [7, 3, 1])
├──
└── created_at, updated_at

vendor_payment_methods
├── id (UUID)
├── vendor_id (FK)
├── method_type (cash | card | bank_transfer | online)
├── provider (stripe | bml | mib, nullable)
├── display_name
├── is_enabled (boolean)
├── is_default (boolean)
├── credentials (JSONB, encrypted - API keys, etc.)
├── settings (JSONB - provider-specific config)
├──
└── created_at, updated_at
```

---

### 1.15 Financial Ledger (Double-Entry Accounting Prep)

```sql
ledger_accounts
├── id (UUID)
├── vendor_id (FK)
├── account_code (VARCHAR: "1000", "4000")
├── account_name (VARCHAR: "Cash", "Revenue")
├── account_type (asset | liability | equity | revenue | expense)
├── parent_account_id (FK, nullable - for hierarchy)
├── is_system_account (boolean - auto-created accounts)
├── is_active
├──
└── created_at, updated_at

ledger_entries
├── id (UUID)
├── vendor_id (FK)
├── entry_date
├──
├── -- Reference --
├── reference_type (invoice | payment | refund | adjustment)
├── reference_id (UUID)
├──
├── -- Entry --
├── account_id (FK)
├── debit (DECIMAL 12,2)
├── credit (DECIMAL 12,2)
├── currency (VARCHAR 3)
├──
├── description
├──
└── created_at, created_by
```

---

## API Endpoints

### Guest Management
```
POST   /api/vendor/guests                    - Create guest
GET    /api/vendor/guests                    - List guests (search, filter)
GET    /api/vendor/guests/:id                - Get guest details
PUT    /api/vendor/guests/:id                - Update guest
DELETE /api/vendor/guests/:id                - Archive guest
POST   /api/vendor/guests/:id/merge          - Merge duplicate guests
GET    /api/vendor/guests/:id/history        - Guest stay history
```

### Resource Management
```
POST   /api/vendor/resources                 - Create resource (room/vehicle/etc)
GET    /api/vendor/resources                 - List resources
GET    /api/vendor/resources/:id             - Get resource details
PUT    /api/vendor/resources/:id             - Update resource
DELETE /api/vendor/resources/:id             - Retire resource

POST   /api/vendor/resources/:id/amenities   - Add amenities
GET    /api/vendor/resources/:id/availability - Get availability calendar
PUT    /api/vendor/resources/:id/availability - Bulk update availability
```

### Booking Management
```
POST   /api/vendor/bookings                  - Create booking (any source)
GET    /api/vendor/bookings                  - List bookings (filters)
GET    /api/vendor/bookings/:id              - Get booking details
PUT    /api/vendor/bookings/:id              - Update booking
PUT    /api/vendor/bookings/:id/status       - Update status (check-in/out)
POST   /api/vendor/bookings/:id/services     - Add services to booking
GET    /api/vendor/bookings/calendar         - Calendar view
```

### Quotations
```
POST   /api/vendor/quotations                 - Create quotation
GET    /api/vendor/quotations                 - List quotations
GET    /api/vendor/quotations/:id             - Get quotation
PUT    /api/vendor/quotations/:id             - Update quotation
POST   /api/vendor/quotations/:id/send        - Send to customer
POST   /api/vendor/quotations/:id/convert     - Convert to booking
DELETE /api/vendor/quotations/:id             - Delete draft
GET    /api/vendor/quotations/:id/pdf         - Download PDF
```

### Invoices
```
POST   /api/vendor/invoices                   - Create invoice
GET    /api/vendor/invoices                   - List invoices
GET    /api/vendor/invoices/:id               - Get invoice
PUT    /api/vendor/invoices/:id               - Update draft invoice
POST   /api/vendor/invoices/:id/send          - Send to customer
POST   /api/vendor/invoices/:id/void          - Void invoice
POST   /api/vendor/invoices/:id/duplicate     - Duplicate invoice
GET    /api/vendor/invoices/:id/pdf           - Download PDF
POST   /api/vendor/invoices/from-booking/:id  - Generate from booking
```

### Payments
```
POST   /api/vendor/payments                   - Record payment
GET    /api/vendor/payments                   - List payments
GET    /api/vendor/payments/:id               - Get payment details
POST   /api/vendor/payments/:id/allocate      - Allocate to invoices
```

### Refunds
```
POST   /api/vendor/refunds                    - Request refund
GET    /api/vendor/refunds                    - List refunds
GET    /api/vendor/refunds/:id                - Get refund details
POST   /api/vendor/refunds/:id/approve        - Approve refund
POST   /api/vendor/refunds/:id/process        - Process refund
POST   /api/vendor/refunds/:id/reject         - Reject refund
```

### Credit Notes
```
POST   /api/vendor/credit-notes               - Create credit note
GET    /api/vendor/credit-notes               - List credit notes
GET    /api/vendor/credit-notes/:id           - Get credit note
POST   /api/vendor/credit-notes/:id/apply     - Apply to invoice
POST   /api/vendor/credit-notes/:id/void      - Void credit note
```

### Discounts
```
POST   /api/vendor/discounts                  - Create discount rule
GET    /api/vendor/discounts                  - List discount rules
GET    /api/vendor/discounts/:id              - Get discount rule
PUT    /api/vendor/discounts/:id              - Update discount rule
DELETE /api/vendor/discounts/:id              - Delete discount rule
POST   /api/vendor/discounts/validate         - Validate promo code
GET    /api/vendor/discounts/:id/usage        - Get usage stats
```

### Tax
```
GET    /api/vendor/tax-rates                  - List available tax rates
PUT    /api/vendor/tax-settings               - Configure vendor tax settings
POST   /api/vendor/tax/calculate              - Calculate tax for items
```

### Billing Settings
```
GET    /api/vendor/billing-settings           - Get billing configuration
PUT    /api/vendor/billing-settings           - Update billing configuration
GET    /api/vendor/payment-methods            - List payment methods
POST   /api/vendor/payment-methods            - Add payment method
PUT    /api/vendor/payment-methods/:id        - Update payment method
DELETE /api/vendor/payment-methods/:id        - Remove payment method
```

### Financial Reports
```
GET    /api/vendor/reports/revenue            - Revenue report
GET    /api/vendor/reports/payments           - Payments report
GET    /api/vendor/reports/outstanding        - Outstanding invoices
GET    /api/vendor/reports/tax                - Tax report (for filing)
GET    /api/vendor/reports/aging              - Accounts receivable aging
GET    /api/vendor/reports/profit-loss        - P&L statement
```

### Dashboard
```
GET    /api/vendor/dashboard/overview         - Key metrics
GET    /api/vendor/reports/occupancy          - Occupancy report
GET    /api/vendor/reports/guests             - Guest analytics
```

---

## Data Model Relationships

```
Vendor (1)
├── VendorServiceTypes (M) - what services they offer
├── VendorResources (M) - rooms, vehicles, equipment
│   ├── ResourceAmenities (M)
│   ├── ResourceServices (M)
│   ├── ResourceAvailability (M)
│   └── ResourceRatePlans (M)
├── VendorServices (M) - add-on services
├── Guests (M) - guest profiles
├── VendorBookings (M)
│   ├── BookingGuests (M)
│   └── BookingServices (M)
├── VendorChannels (M) - OTA connections
├── Activities (M) - platform activities (existing)
│
├── ── FINANCE ──
├── VendorBillingSettings (1)
├── VendorPaymentMethods (M)
├── VendorTaxSettings (M)
├── TaxExemptions (M)
├── DiscountRules (M)
├── Quotations (M)
│   └── QuotationItems (M)
├── Invoices (M)
│   └── InvoiceItems (M)
├── Payments (M)
│   └── PaymentAllocations (M)
├── Refunds (M)
├── CreditNotes (M)
│   └── CreditNoteApplications (M)
└── LedgerEntries (M)
```

---

## Maldives-Specific Tax Implementation

| Tax | Rate | Type | Applies To | Notes |
|-----|------|------|------------|-------|
| TGST | 16% | Percentage | All tourism services | Tourism GST |
| Green Tax | $6/night | Fixed per unit | Accommodation only | Foreign tourists only |
| Service Charge | 10% | Percentage | All services | Often included in price |

---

## Future Phase Extensions

### Phase 2: Tour & Activity Enhancement
- Itinerary builder
- Guide assignment
- Group management
- Equipment tracking
- Tour scheduling calendar

### Phase 3: Transfer Services
- Vehicle fleet management
- Driver assignment & scheduling
- Route management
- Real-time tracking integration
- Multi-leg transfers

### Phase 4: Rental Services
- Equipment inventory
- Rental periods & returns
- Damage tracking
- Deposit management
- Late return handling

### Phase 5: Channel Manager Integration
- Two-way sync with OTAs
- Rate parity management
- Automated availability updates
- Booking import/export

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate `vendor_bookings` table** | Keeps platform bookings clean; vendors may have thousands of external bookings |
| **Generic `vendor_resources`** | Single table handles rooms, vehicles, equipment with service_type differentiation |
| **`guests` table owned by vendor** | Each vendor maintains their own guest database; privacy separation |
| **`source_type` on bookings** | Critical for revenue tracking and channel performance analysis |
| **JSONB for flexible fields** | Bed config, preferences, pricing breakdown vary by service type |
| **Availability per-date rows** | Enables complex pricing, restrictions, and multi-unit inventory |
