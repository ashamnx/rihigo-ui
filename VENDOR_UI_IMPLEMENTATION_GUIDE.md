yes# Vendor Portal UI Implementation Guide

## Executive Summary

This guide provides a comprehensive implementation roadmap for transforming the Rihigo vendor portal into a full Property Management System (PMS). The implementation is organized into logical modules with detailed checklists, component specifications, and API integration points.

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Architecture Overview](#2-architecture-overview)
3. [Implementation Phases](#3-implementation-phases)
4. [Module 1: Navigation & Layout Updates](#module-1-navigation--layout-updates)
5. [Module 2: Guest Management](#module-2-guest-management)
6. [Module 3: Resource Management](#module-3-resource-management)
7. [Module 4: Enhanced Booking System](#module-4-enhanced-booking-system)
8. [Module 5: Finance - Quotations](#module-5-finance---quotations)
9. [Module 6: Finance - Invoices](#module-6-finance---invoices)
10. [Module 7: Finance - Payments & Refunds](#module-7-finance---payments--refunds)
11. [Module 8: Discounts & Promotions](#module-8-discounts--promotions)
12. [Module 9: Tax Configuration](#module-9-tax-configuration)
13. [Module 10: Billing Settings](#module-10-billing-settings)
14. [Module 11: Reports & Analytics](#module-11-reports--analytics)
15. [Module 12: Staff Management](#module-12-staff-management)
16. [Shared Components Library](#shared-components-library)
17. [Type Definitions](#type-definitions)
18. [API Client Extensions](#api-client-extensions)

---

## 1. Current State Assessment

### Existing Features
- [x] Vendor authentication & session management
- [x] Dashboard with basic stats
- [x] Activity CRUD operations
- [x] Activity package management
- [x] API client foundation (`apiClient.vendorPortal`)
- [x] Responsive drawer layout
- [x] Basic vendor profile display

### Missing Features (To Implement)
- [x] Guest profiles & management
- [x] Resource management (rooms, vehicles, equipment)
- [x] Enhanced booking system with multiple sources
- [x] Availability & inventory calendar (booking calendar view)
- [x] Quotations system
- [x] Invoice generation & management
- [x] Payment recording & tracking
- [x] Refund processing
- [ ] Discount/promo code management
- [ ] Tax configuration (TGST, Green Tax, Service Charge)
- [ ] Billing settings
- [ ] Financial reports
- [ ] Staff management

---

## 2. Architecture Overview

### Directory Structure

```
src/
├── routes/vendor/
│   ├── layout.tsx                    # Main vendor layout (update)
│   ├── index.tsx                     # Dashboard (update)
│   │
│   ├── guests/                       # NEW: Guest management
│   │   ├── index.tsx                 # Guest list
│   │   ├── new/index.tsx             # Add guest
│   │   └── [id]/index.tsx            # Edit/view guest
│   │
│   ├── resources/                    # NEW: Resource management
│   │   ├── index.tsx                 # Resource list
│   │   ├── new/index.tsx             # Add resource
│   │   ├── [id]/index.tsx            # Edit resource
│   │   └── [id]/availability/index.tsx
│   │
│   ├── bookings/                     # NEW: Booking management
│   │   ├── index.tsx                 # Booking list
│   │   ├── new/index.tsx             # Create booking
│   │   ├── calendar/index.tsx        # Calendar view
│   │   └── [id]/index.tsx            # Booking details
│   │
│   ├── quotations/                   # NEW: Quotations
│   │   ├── index.tsx                 # Quotation list
│   │   ├── new/index.tsx             # Create quotation
│   │   └── [id]/index.tsx            # View/edit quotation
│   │
│   ├── invoices/                     # NEW: Invoices
│   │   ├── index.tsx                 # Invoice list
│   │   ├── new/index.tsx             # Create invoice
│   │   └── [id]/index.tsx            # View/edit invoice
│   │
│   ├── payments/                     # NEW: Payments
│   │   ├── index.tsx                 # Payment list
│   │   ├── new/index.tsx             # Record payment
│   │   └── [id]/index.tsx            # Payment details
│   │
│   ├── refunds/                      # NEW: Refunds
│   │   ├── index.tsx                 # Refund list
│   │   └── [id]/index.tsx            # Refund details
│   │
│   ├── discounts/                    # NEW: Discounts
│   │   ├── index.tsx                 # Discount list
│   │   ├── new/index.tsx             # Create discount
│   │   └── [id]/index.tsx            # Edit discount
│   │
│   ├── settings/                     # NEW: Vendor settings
│   │   ├── index.tsx                 # Settings overview
│   │   ├── billing/index.tsx         # Billing settings
│   │   ├── taxes/index.tsx           # Tax configuration
│   │   └── payment-methods/index.tsx # Payment methods
│   │
│   ├── reports/                      # NEW: Reports
│   │   ├── index.tsx                 # Reports dashboard
│   │   ├── revenue/index.tsx         # Revenue report
│   │   ├── payments/index.tsx        # Payments report
│   │   ├── occupancy/index.tsx       # Occupancy report
│   │   └── tax/index.tsx             # Tax report
│   │
│   └── staff/                        # NEW: Staff management
│       ├── index.tsx                 # Staff list
│       ├── new/index.tsx             # Add staff
│       └── [id]/index.tsx            # Edit staff
│
├── components/vendor/                # NEW: Vendor components
│   ├── shared/
│   │   ├── PageHeader.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ActionDropdown.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── FilterBar.tsx
│   │
│   ├── guests/
│   │   ├── GuestForm.tsx
│   │   ├── GuestCard.tsx
│   │   └── GuestHistoryTimeline.tsx
│   │
│   ├── bookings/
│   │   ├── BookingForm.tsx
│   │   ├── BookingCard.tsx
│   │   ├── BookingCalendar.tsx
│   │   └── BookingStatusFlow.tsx
│   │
│   ├── resources/
│   │   ├── ResourceForm.tsx
│   │   ├── ResourceCard.tsx
│   │   ├── AvailabilityCalendar.tsx
│   │   └── AmenitySelector.tsx
│   │
│   ├── finance/
│   │   ├── QuotationForm.tsx
│   │   ├── QuotationPreview.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoicePreview.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── RefundForm.tsx
│   │   ├── LineItemEditor.tsx
│   │   └── TaxCalculator.tsx
│   │
│   └── reports/
│       ├── StatCard.tsx
│       ├── RevenueChart.tsx
│       ├── OccupancyChart.tsx
│       └── DataExport.tsx
│
└── types/
    ├── vendor.ts                     # Update with new types
    ├── guest.ts                      # NEW
    ├── resource.ts                   # NEW
    ├── booking-vendor.ts             # NEW
    ├── quotation.ts                  # NEW
    ├── invoice.ts                    # NEW
    ├── payment.ts                    # NEW
    └── discount.ts                   # NEW
```

---

## 3. Implementation Phases

### Phase 1A: Foundation (Week 1-2)
- [x] Update navigation & layout
- [x] Create shared component library
- [x] Define all TypeScript types
- [x] Extend API client

### Phase 1B: Guest & Resource Management (Week 2-3)
- [x] Guest management module
- [x] Resource management module
- [x] Availability calendar

### Phase 1C: Booking Enhancement (Week 3-4)
- [x] Enhanced booking system
- [x] Booking calendar view
- [x] Status workflow

### Phase 1D: Finance Core (Week 4-6)
- [x] Quotations
- [x] Invoices
- [x] Payments
- [x] Refunds

### Phase 1E: Configuration & Reports (Week 6-7)
- [ ] Tax configuration
- [ ] Discount management
- [ ] Billing settings
- [ ] Reports & analytics

### Phase 1F: Staff & Polish (Week 7-8)
- [ ] Staff management
- [ ] UI polish & testing
- [ ] Documentation

---

## Module 1: Navigation & Layout Updates

### File: `src/routes/vendor/layout.tsx`

#### Checklist
- [x] Update navigation menu structure
- [x] Add collapsible menu groups
- [x] Add active state highlighting for nested routes
- [ ] Add notification badge (for pending actions)
- [x] Improve mobile navigation

#### Updated Navigation Structure

```typescript
const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/vendor', icon: HomeIcon },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Bookings', href: '/vendor/bookings', icon: CalendarIcon, badge: pendingCount },
      { name: 'Guests', href: '/vendor/guests', icon: UsersIcon },
      { name: 'Resources', href: '/vendor/resources', icon: BuildingIcon },
      { name: 'Activities', href: '/vendor/activities', icon: TicketIcon },
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Quotations', href: '/vendor/quotations', icon: DocumentTextIcon },
      { name: 'Invoices', href: '/vendor/invoices', icon: ReceiptIcon },
      { name: 'Payments', href: '/vendor/payments', icon: CreditCardIcon },
      { name: 'Refunds', href: '/vendor/refunds', icon: ReceiptRefundIcon },
      { name: 'Discounts', href: '/vendor/discounts', icon: TagIcon },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Reports', href: '/vendor/reports', icon: ChartBarIcon },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Staff', href: '/vendor/staff', icon: UserGroupIcon },
      { name: 'Settings', href: '/vendor/settings', icon: CogIcon },
    ]
  }
];
```

#### Implementation Steps

1. **Update the menu array** in `layout.tsx`:
```typescript
// Replace the existing menu array with navigationGroups
// Add collapsible sections for Finance group
```

2. **Add active route detection**:
```typescript
const isActiveRoute = (href: string) => {
  return currentPath === href || currentPath.startsWith(href + '/');
};
```

3. **Add pending actions count** via routeLoader:
```typescript
export const usePendingCounts = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendorPortal.getDashboardCounts(token);
  });
});
```

---

## Module 2: Guest Management

### Routes
- `/vendor/guests` - List all guests
- `/vendor/guests/new` - Add new guest
- `/vendor/guests/[id]` - View/edit guest details

### Checklist

#### Guest List Page (`/vendor/guests/index.tsx`)
- [x] Create route file with routeLoader for fetching guests
- [x] Implement search functionality (name, email, phone)
- [x] Add filter by source (direct, platform, OTA)
- [x] Add filter by loyalty tier
- [x] Add filter by tags (VIP, returning, corporate)
- [x] Display guest cards/table with key info
- [x] Add pagination
- [x] Add "Add Guest" button
- [ ] Add bulk actions (tag, export)
- [ ] Add merge duplicates feature

#### Guest Form Component (`GuestForm.tsx`)
- [x] Personal info section (name, email, phone, DOB, gender)
- [x] Nationality/residence section
- [x] ID document section (type, number, expiry, upload)
- [x] Preferences section (dietary, accessibility, room prefs)
- [x] Tags selector (multi-select)
- [x] Internal notes field
- [x] Form validation using Modular Forms
- [x] Source type indicator (read-only for imported guests)

#### Guest Detail Page (`/vendor/guests/[id]/index.tsx`)
- [x] Guest profile header with photo placeholder
- [x] Contact information display
- [x] Booking history timeline
- [x] Statistics (total bookings, total spend, visits)
- [x] Loyalty tier display
- [x] Preferences display
- [ ] ID documents (with secure viewing)
- [x] Notes/tags management
- [x] Edit button
- [x] Delete/archive button with confirmation

#### API Client Methods
```typescript
// Add to apiClient.vendorPortal
guests: {
  list: (token: string, filters?: GuestFilters) => Promise<PaginatedResponse<Guest>>,
  get: (id: string, token: string) => Promise<Guest>,
  create: (data: GuestCreateInput, token: string) => Promise<Guest>,
  update: (id: string, data: GuestUpdateInput, token: string) => Promise<Guest>,
  delete: (id: string, token: string) => Promise<void>,
  merge: (primaryId: string, duplicateIds: string[], token: string) => Promise<Guest>,
  getHistory: (id: string, token: string) => Promise<GuestHistory[]>,
}
```

#### Types (`src/types/guest.ts`)
```typescript
export interface Guest {
  id: string;
  vendor_id: string;
  source_type: 'direct' | 'platform' | 'ota' | 'agent';
  source_name?: string;
  external_reference?: string;

  // Personal Info
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  country_of_residence?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  preferred_language?: string;

  // Identification
  id_type?: 'passport' | 'national_id' | 'driver_license';
  id_number?: string;
  id_expiry_date?: string;
  id_document_url?: string;

  // Preferences
  preferences?: GuestPreferences;
  notes?: string;
  tags?: string[];

  // Statistics
  total_bookings: number;
  total_spend: number;
  first_visit_at?: string;
  last_visit_at?: string;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';

  created_at: string;
  updated_at: string;
}

export interface GuestPreferences {
  dietary?: string[];
  accessibility?: string[];
  room?: string[];
  other?: string;
}

export interface GuestFilters {
  search?: string;
  source_type?: string;
  loyalty_tier?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface GuestCreateInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  // ... other fields
}

export interface GuestUpdateInput extends Partial<GuestCreateInput> {}

export interface GuestHistory {
  id: string;
  action: 'created' | 'updated' | 'merged' | 'deleted';
  changed_by: string;
  changes: Record<string, { before: any; after: any }>;
  created_at: string;
}
```

---

## Module 3: Resource Management

### Routes
- `/vendor/resources` - List all resources
- `/vendor/resources/new` - Add new resource
- `/vendor/resources/[id]` - View/edit resource
- `/vendor/resources/[id]/availability` - Manage availability calendar

### Checklist

#### Resource List Page (`/vendor/resources/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by service type (accommodation, transfer, rental)
- [x] Filter by resource type (room, vehicle, equipment, boat)
- [x] Filter by status (available, maintenance, retired)
- [x] Search by name/code
- [x] Display resource cards with:
  - [x] Primary image
  - [x] Name & code
  - [x] Service type badge
  - [x] Capacity info
  - [x] Base price
  - [x] Status badge
  - [x] Amenity icons (top 5)
- [x] Add pagination
- [x] Add "Add Resource" button
- [x] Bulk status update

#### Resource Form Component (`ResourceForm.tsx` / `new/index.tsx`)
- [x] Basic info section (name, description, code)
- [x] Service type selector
- [x] Resource type selector (dynamic based on service type)
- [x] Capacity section (max adults, children, occupancy)
- [x] Pricing section (base price, currency)
- [x] Status selector
- [ ] Media upload section
- [x] **Accommodation-specific fields** (conditional):
  - [x] Room type (standard, deluxe, suite, villa, dormitory)
  - [x] Bed configuration builder
  - [x] Size (sqm)
  - [x] Floor level
  - [x] View type (ocean, garden, pool, city)
  - [x] Smoking allowed toggle
- [ ] Amenities selector (grouped by category)
- [ ] Linked services selector
- [x] Form validation

#### Availability Calendar (`AvailabilityCalendar.tsx` / `[id]/availability/index.tsx`)
- [x] Month view calendar grid
- [x] Date cells showing:
  - [x] Available count
  - [x] Status color coding
  - [x] Price (if override)
- [x] Click date to edit:
  - [x] Status (available, blocked, maintenance)
  - [x] Price override
  - [x] Min/max stay
  - [ ] Notes
- [x] Bulk date selection
- [x] Date range operations
- [x] Navigation (prev/next month)
- [x] Today indicator
- [x] Legend

#### Rate Plans Section
- [ ] List rate plans for resource
- [ ] Create rate plan form:
  - [ ] Name
  - [ ] Discount type/value
  - [ ] Valid date range
  - [ ] Booking window days
  - [ ] Min/max stay
  - [ ] Active toggle

#### API Client Methods
```typescript
resources: {
  list: (token: string, filters?: ResourceFilters) => Promise<PaginatedResponse<VendorResource>>,
  get: (id: string, token: string) => Promise<VendorResource>,
  create: (data: ResourceCreateInput, token: string) => Promise<VendorResource>,
  update: (id: string, data: ResourceUpdateInput, token: string) => Promise<VendorResource>,
  delete: (id: string, token: string) => Promise<void>,

  // Amenities
  getAmenities: (resourceId: string, token: string) => Promise<ResourceAmenity[]>,
  updateAmenities: (resourceId: string, amenities: AmenityInput[], token: string) => Promise<void>,

  // Availability
  getAvailability: (resourceId: string, startDate: string, endDate: string, token: string) => Promise<ResourceAvailability[]>,
  updateAvailability: (resourceId: string, dates: AvailabilityUpdate[], token: string) => Promise<void>,

  // Rate Plans
  getRatePlans: (resourceId: string, token: string) => Promise<RatePlan[]>,
  createRatePlan: (resourceId: string, data: RatePlanInput, token: string) => Promise<RatePlan>,
  updateRatePlan: (resourceId: string, planId: string, data: RatePlanInput, token: string) => Promise<RatePlan>,
  deleteRatePlan: (resourceId: string, planId: string, token: string) => Promise<void>,
}
```

#### Types (`src/types/resource.ts`)
```typescript
export type ServiceType = 'accommodation' | 'tour' | 'transfer' | 'rental' | 'activity';
export type ResourceType = 'room' | 'vehicle' | 'equipment' | 'boat';
export type ResourceStatus = 'available' | 'maintenance' | 'retired';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'villa' | 'dormitory';
export type ViewType = 'ocean' | 'garden' | 'pool' | 'city';

export interface VendorResource {
  id: string;
  vendor_id: string;
  service_type: ServiceType;
  resource_type: ResourceType;
  name: string;
  description?: string;
  code?: string;

  // Capacity
  max_adults: number;
  max_children: number;
  max_occupancy: number;

  // Pricing
  base_price: number;
  currency: string;

  // Status
  status: ResourceStatus;

  // Settings
  settings?: Record<string, any>;

  // Media
  media?: ResourceMedia[];

  // Accommodation-specific
  accommodation_details?: AccommodationDetails;

  // Related
  amenities?: ResourceAmenity[];
  services?: ResourceService[];

  created_at: string;
  updated_at: string;
}

export interface AccommodationDetails {
  room_type: RoomType;
  bed_configuration: BedConfig[];
  size_sqm?: number;
  floor_level?: number;
  view_type?: ViewType;
  is_smoking_allowed: boolean;
}

export interface BedConfig {
  type: 'single' | 'double' | 'queen' | 'king' | 'bunk' | 'sofa';
  count: number;
}

export interface ResourceMedia {
  id: string;
  resource_id: string;
  media_type: 'image' | 'video' | 'document';
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ResourceAmenity {
  id: string;
  resource_id: string;
  amenity_id: string;
  amenity?: Amenity;
  is_included: boolean;
  additional_cost?: number;
}

export interface Amenity {
  id: string;
  category: 'room' | 'property' | 'bathroom' | 'entertainment' | 'safety';
  name: string;
  icon?: string;
}

export interface ResourceAvailability {
  id: string;
  resource_id: string;
  date: string;
  available_count: number;
  status: 'available' | 'blocked' | 'maintenance';
  price_override?: number;
  min_stay?: number;
  max_stay?: number;
  notes?: string;
}

export interface RatePlan {
  id: string;
  resource_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_to: string;
  booking_window_days?: number;
  min_stay?: number;
  max_stay?: number;
  is_active: boolean;
}
```

---

## Module 4: Enhanced Booking System

### Routes
- `/vendor/bookings` - List all bookings
- `/vendor/bookings/new` - Create new booking
- `/vendor/bookings/calendar` - Calendar view
- `/vendor/bookings/[id]` - Booking details

### Checklist

#### Booking List Page (`/vendor/bookings/index.tsx`)
- [x] Create route file with routeLoader
- [ ] Tab navigation: All | Today | Upcoming | Past
- [x] Filter by source (platform, direct, OTA, agent, phone, walk-in)
- [x] Filter by status (pending, confirmed, checked_in, checked_out, cancelled, no_show)
- [x] Filter by payment status
- [x] Filter by date range
- [x] Search by booking number, guest name, email
- [x] Display booking rows with:
  - [x] Booking number
  - [x] Source badge (color-coded)
  - [x] Guest name
  - [x] Resource/activity name
  - [x] Check-in/out dates
  - [x] Status badge
  - [x] Payment status
  - [x] Total amount
  - [x] Actions dropdown
- [x] Quick actions: Check-in, Check-out, Cancel
- [ ] Export bookings
- [x] Add "New Booking" button

#### Booking Calendar Page (`/vendor/bookings/calendar/index.tsx`)
- [x] Month/week view toggle
- [x] Resource-based rows (like a Gantt chart)
- [x] Booking blocks showing:
  - [x] Guest name
  - [x] Status color
  - [x] Duration span
- [ ] Click booking to view details (slide-over)
- [ ] Drag-and-drop to reschedule (optional enhancement)
- [ ] Click empty cell to create booking
- [x] Legend for statuses
- [ ] Resource filter dropdown

#### Booking Form Component (`BookingForm.tsx`)
- [x] Source selection section:
  - [x] Source type (platform, direct, OTA, agent, phone, walk-in)
  - [x] Source name (dropdown for OTA: Agoda, Booking.com, etc.)
  - [x] External booking ID (for OTA bookings)
- [x] Guest selection section:
  - [x] Search existing guest
  - [x] Create new guest inline
  - [x] Display selected guest info
- [x] Service/Resource selection:
  - [x] Service type selector
  - [x] Resource/activity dropdown (filtered by service type)
  - [x] Package selection (if applicable)
- [x] Date section:
  - [x] Check-in / Start date picker
  - [x] Check-out / End date picker
  - [ ] Auto-calculate nights/duration
- [x] Guest count section:
  - [x] Adults (number input)
  - [x] Children (number input)
  - [x] Infants (number input)
- [ ] Add-on services selector:
  - [ ] Available services list
  - [ ] Quantity input
  - [ ] Scheduled time (if applicable)
- [x] Pricing section:
  - [ ] Auto-calculated from resource + add-ons
  - [ ] Apply discount (select from available discounts)
  - [ ] Tax breakdown (TGST, Green Tax, Service Charge)
  - [x] Manual price override (with reason)
  - [x] Total display
- [x] Additional info:
  - [x] Special requests (textarea)
  - [x] Internal notes (textarea)
  - [x] Tags selector
- [x] Status & payment status selectors
- [x] Form validation

#### Booking Detail Page (`/vendor/bookings/[id]/index.tsx`)
- [x] Booking header:
  - [x] Booking number
  - [x] Source badge
  - [x] Status badge with workflow actions
  - [x] Created date
- [x] Guest info card:
  - [x] Guest name (link to guest profile)
  - [x] Contact info
  - [x] Guest count breakdown
  - [ ] Additional guests list
- [x] Booking details card:
  - [x] Resource/activity name
  - [x] Package (if applicable)
  - [x] Check-in/out dates
  - [x] Duration
  - [x] Special requests
- [x] Services card:
  - [x] List of add-on services
  - [x] Quantity, price, status
  - [ ] Add service button
- [x] Financial summary card:
  - [x] Subtotal
  - [x] Discounts applied
  - [x] Tax breakdown
  - [x] Total
  - [x] Amount paid
  - [x] Balance due
  - [x] Payment status badge
- [x] Payment history:
  - [x] List of payments
  - [x] Record payment button
- [x] Related documents:
  - [x] Linked invoices
  - [x] Linked quotation
  - [x] Create invoice button
- [ ] Activity timeline:
  - [ ] Status changes
  - [ ] Payments recorded
  - [ ] Notes added
- [x] Actions sidebar:
  - [x] Edit booking
  - [x] Check-in / Check-out buttons
  - [x] Cancel booking
  - [x] Mark as no-show
  - [x] Create invoice
  - [ ] Send confirmation email
  - [ ] Print confirmation

#### Booking Status Flow Component (`BookingStatusFlow.tsx`)
- [x] Visual status progression:
  `Pending → Confirmed → Checked In → Checked Out`
- [x] Current status highlighted
- [x] Action buttons for next status
- [x] Cancel/No-show branches
- [x] Confirmation modals for status changes

#### API Client Methods
```typescript
bookings: {
  list: (token: string, filters?: BookingFilters) => Promise<PaginatedResponse<VendorBooking>>,
  get: (id: string, token: string) => Promise<VendorBooking>,
  create: (data: BookingCreateInput, token: string) => Promise<VendorBooking>,
  update: (id: string, data: BookingUpdateInput, token: string) => Promise<VendorBooking>,
  updateStatus: (id: string, status: BookingStatus, token: string) => Promise<VendorBooking>,
  cancel: (id: string, reason: string, token: string) => Promise<VendorBooking>,

  // Services
  addService: (bookingId: string, data: BookingServiceInput, token: string) => Promise<BookingService>,
  updateService: (bookingId: string, serviceId: string, data: BookingServiceInput, token: string) => Promise<BookingService>,
  removeService: (bookingId: string, serviceId: string, token: string) => Promise<void>,

  // Calendar
  getCalendar: (startDate: string, endDate: string, token: string) => Promise<CalendarBooking[]>,

  // Guests
  addGuest: (bookingId: string, guestId: string, token: string) => Promise<void>,
  removeGuest: (bookingId: string, guestId: string, token: string) => Promise<void>,
}
```

#### Types (`src/types/booking-vendor.ts`)
```typescript
export type BookingSourceType = 'platform' | 'direct' | 'ota' | 'agent' | 'phone' | 'walk_in';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface VendorBooking {
  id: string;
  vendor_id: string;
  booking_number: string;

  // Source
  source_type: BookingSourceType;
  source_name?: string;
  external_booking_id?: string;

  // Guest
  primary_guest_id: string;
  primary_guest?: Guest;
  additional_guests?: Guest[];
  adults: number;
  children: number;
  infants: number;

  // Resource/Service
  resource_id?: string;
  resource?: VendorResource;
  activity_id?: string;
  activity?: Activity;
  package_id?: string;
  service_type: ServiceType;

  // Dates
  check_in_date: string;
  check_out_date: string;
  nights_count: number;

  // Pricing
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
  commission_amount?: number;
  net_revenue: number;
  pricing_breakdown?: PricingBreakdown;

  // Status
  status: BookingStatus;
  payment_status: PaymentStatus;

  // Additional
  special_requests?: string;
  internal_notes?: string;
  tags?: string[];

  // Services
  services?: BookingService[];

  // Related
  invoices?: Invoice[];
  payments?: Payment[];
  quotation_id?: string;

  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  service?: VendorService;
  quantity: number;
  unit_price: number;
  total_price: number;
  scheduled_at?: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

export interface PricingBreakdown {
  nightly_rates?: { date: string; rate: number }[];
  add_ons?: { name: string; quantity: number; price: number }[];
  discounts?: { name: string; amount: number }[];
  taxes?: { name: string; rate: number; amount: number }[];
}

export interface BookingFilters {
  search?: string;
  source_type?: BookingSourceType;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  resource_id?: string;
  page?: number;
  limit?: number;
}

export interface CalendarBooking {
  id: string;
  booking_number: string;
  guest_name: string;
  resource_id: string;
  resource_name: string;
  check_in_date: string;
  check_out_date: string;
  status: BookingStatus;
}
```

---

## Module 5: Finance - Quotations

### Routes
- `/vendor/quotations` - List all quotations
- `/vendor/quotations/new` - Create new quotation
- `/vendor/quotations/[id]` - View/edit quotation

### Checklist

#### Quotation List Page (`/vendor/quotations/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by status (draft, sent, viewed, accepted, rejected, expired, converted)
- [x] Filter by date range
- [x] Search by quotation number, customer name
- [x] Display quotation rows with:
  - [x] Quotation number
  - [x] Customer name/company
  - [x] Issue date
  - [x] Valid until
  - [x] Total amount
  - [x] Status badge
  - [x] Actions (View, Edit, Send, Convert, Delete)
- [x] Pagination
- [x] "Create Quotation" button
- [x] Quick filters: Active | Expired | Converted

#### Quotation Form Component (`QuotationForm.tsx` / `new/index.tsx`)
- [x] Customer section:
  - [x] Select existing guest OR
  - [x] Manual entry (name, email, phone, company)
- [x] Service details:
  - [x] Service type
  - [x] Resource/activity
  - [x] Start/end dates
  - [x] Guest count
- [x] Line items editor (LineItemEditor component):
  - [x] Add item (accommodation, service, fee, tax, discount)
  - [x] Description
  - [x] Quantity & unit
  - [x] Unit price
  - [x] Discount (optional)
  - [ ] Tax rate
  - [x] Line total (auto-calculated)
  - [ ] Drag to reorder
  - [x] Delete item
- [x] Totals section:
  - [x] Subtotal
  - [x] Discounts
  - [ ] Taxes
  - [x] Total
- [x] Validity:
  - [x] Issue date (auto-set)
  - [x] Valid until (days picker or date picker)
- [x] Notes:
  - [x] Customer-facing notes
  - [x] Internal notes
  - [x] Terms and conditions
- [x] Save as draft / Save & Send

#### Quotation Preview Component (`QuotationPreview.tsx`)
- [ ] Professional quotation layout
- [ ] Vendor header (logo, address, contact)
- [ ] Customer info
- [ ] Quotation number & dates
- [ ] Line items table
- [ ] Totals
- [ ] Notes & terms
- [ ] Accept/Reject buttons (for customer view)
- [ ] Print-friendly styling

#### Quotation Detail Page (`/vendor/quotations/[id]/index.tsx`)
- [x] Quotation header with status
- [x] Customer info card
- [x] Service details card
- [x] Line items table
- [x] Financial summary
- [x] Notes display
- [x] Actions:
  - [x] Edit (if draft)
  - [x] Send to customer
  - [x] Download PDF
  - [x] Convert to booking
  - [ ] Mark as accepted/rejected
  - [x] Duplicate
  - [x] Delete
- [x] Activity timeline

#### API Client Methods
```typescript
quotations: {
  list: (token: string, filters?: QuotationFilters) => Promise<PaginatedResponse<Quotation>>,
  get: (id: string, token: string) => Promise<Quotation>,
  create: (data: QuotationCreateInput, token: string) => Promise<Quotation>,
  update: (id: string, data: QuotationUpdateInput, token: string) => Promise<Quotation>,
  delete: (id: string, token: string) => Promise<void>,
  send: (id: string, token: string) => Promise<Quotation>,
  convert: (id: string, token: string) => Promise<{ booking_id: string }>,
  getPdf: (id: string, token: string) => Promise<Blob>,
}
```

#### Types (`src/types/quotation.ts`)
```typescript
export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type ItemType = 'accommodation' | 'service' | 'fee' | 'tax' | 'discount';
export type ItemUnit = 'night' | 'person' | 'unit' | 'trip' | 'hour' | 'item';

export interface Quotation {
  id: string;
  vendor_id: string;
  quotation_number: string;

  // Customer
  guest_id?: string;
  guest?: Guest;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;

  // Dates
  issue_date: string;
  valid_until: string;

  // Service
  service_type: ServiceType;
  resource_id?: string;
  resource?: VendorResource;
  activity_id?: string;
  start_date?: string;
  end_date?: string;
  adults?: number;
  children?: number;
  infants?: number;

  // Pricing
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  currency: string;

  // Items
  items: QuotationItem[];

  // Status
  status: QuotationStatus;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  converted_to_booking_id?: string;

  // Content
  notes?: string;
  internal_notes?: string;
  terms_and_conditions?: string;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate_id?: string;
  tax_amount: number;
  line_total: number;
  sort_order: number;

  // References
  resource_id?: string;
  service_id?: string;
  rate_plan_id?: string;
}
```

---

## Module 6: Finance - Invoices

### Routes
- `/vendor/invoices` - List all invoices
- `/vendor/invoices/new` - Create new invoice
- `/vendor/invoices/[id]` - View/edit invoice

### Checklist

#### Invoice List Page (`/vendor/invoices/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by status (draft, pending, sent, partial, paid, overdue, cancelled, void)
- [x] Filter by payment status
- [x] Filter by date range (issue date, due date)
- [x] Search by invoice number, customer name
- [x] Display invoice rows with:
  - [x] Invoice number
  - [x] Customer name
  - [x] Issue date
  - [x] Due date
  - [x] Total
  - [x] Amount paid
  - [x] Balance due
  - [x] Status badge
  - [x] Actions dropdown
- [x] Pagination
- [x] "Create Invoice" button
- [x] Quick filters: Due Today | Overdue | Unpaid
- [x] Summary stats (Total Outstanding, Overdue Amount)

#### Invoice Form Component (`InvoiceForm.tsx` / `new/index.tsx`)
- [x] Reference selection:
  - [x] From booking (dropdown)
  - [x] From quotation (dropdown)
  - [x] Manual creation
- [x] Billing info section:
  - [x] Select existing guest OR
  - [x] Manual entry (name, email, phone, company, address, tax ID)
- [x] Dates:
  - [x] Issue date
  - [x] Due date (calculated from payment terms or manual)
- [x] Line items editor (shared LineItemEditor):
  - [x] Same as quotation items
  - [x] Auto-populate from booking/quotation
- [x] Totals section:
  - [x] Subtotal
  - [x] Discounts
  - [x] Taxable amount
  - [x] Tax breakdown by rate
  - [x] Total
- [x] Payment section:
  - [x] Amount paid (read-only, from payments)
  - [x] Balance due
- [x] Notes:
  - [x] Invoice notes
  - [x] Footer text
  - [x] Payment instructions
- [x] Save as draft / Save & Send

#### Invoice Preview Component (`InvoicePreview.tsx` - in detail page)
- [x] Professional invoice layout
- [x] Vendor header (logo, address, tax ID)
- [x] "INVOICE" title with number
- [x] Billing info
- [x] Invoice dates
- [x] Line items table
- [x] Tax breakdown
- [x] Totals section
- [x] Payment info (amount paid, balance)
- [x] Payment instructions
- [x] Footer/terms
- [x] "PAID" watermark (when fully paid)
- [x] "VOID" watermark (when voided)
- [ ] Print-friendly styling

#### Invoice Detail Page (`/vendor/invoices/[id]/index.tsx`)
- [x] Invoice header with status
- [x] Billing info card
- [x] Line items table
- [x] Financial summary
- [x] Payment history card:
  - [x] List of payments
  - [x] Amount, date, method
  - [x] Record payment button
- [x] Related documents:
  - [x] Linked booking
  - [x] Linked quotation
- [x] Notes display
- [x] Actions:
  - [x] Edit (if draft)
  - [x] Send to customer
  - [x] Record payment
  - [x] Download PDF
  - [x] Void (with reason)
  - [x] Duplicate
- [ ] Activity timeline

#### API Client Methods
```typescript
invoices: {
  list: (token: string, filters?: InvoiceFilters) => Promise<PaginatedResponse<Invoice>>,
  get: (id: string, token: string) => Promise<Invoice>,
  create: (data: InvoiceCreateInput, token: string) => Promise<Invoice>,
  update: (id: string, data: InvoiceUpdateInput, token: string) => Promise<Invoice>,
  send: (id: string, token: string) => Promise<Invoice>,
  void: (id: string, reason: string, token: string) => Promise<Invoice>,
  duplicate: (id: string, token: string) => Promise<Invoice>,
  getPdf: (id: string, token: string) => Promise<Blob>,
  createFromBooking: (bookingId: string, token: string) => Promise<Invoice>,
  createFromQuotation: (quotationId: string, token: string) => Promise<Invoice>,
}
```

#### Types (`src/types/invoice.ts`)
```typescript
export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void';

export interface Invoice {
  id: string;
  vendor_id: string;
  invoice_number: string;

  // References
  booking_id?: string;
  booking?: VendorBooking;
  quotation_id?: string;

  // Billing
  guest_id?: string;
  guest?: Guest;
  billing_name: string;
  billing_email: string;
  billing_phone?: string;
  billing_address?: string;
  billing_company?: string;
  tax_id?: string;

  // Dates
  issue_date: string;
  due_date: string;

  // Amounts
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  total: number;
  currency: string;

  // Payment
  amount_paid: number;
  amount_due: number;

  // Status
  status: InvoiceStatus;

  // Items
  items: InvoiceItem[];

  // Payments
  payments?: Payment[];

  // Content
  notes?: string;
  footer_text?: string;
  payment_instructions?: string;

  // Void info
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;

  // Metadata
  sent_at?: string;
  paid_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_price: number;
  discount_percent?: number;
  discount_amount: number;
  tax_rate_id?: string;
  tax_amount: number;
  line_total: number;
  sort_order: number;

  // References
  booking_id?: string;
  resource_id?: string;
  service_id?: string;
}
```

---

## Module 7: Finance - Payments & Refunds

### Routes
- `/vendor/payments` - List all payments
- `/vendor/payments/new` - Record new payment
- `/vendor/payments/[id]` - Payment details
- `/vendor/refunds` - List all refunds
- `/vendor/refunds/[id]` - Refund details

### Checklist

#### Payment List Page (`/vendor/payments/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by status (pending, completed, failed, refunded)
- [x] Filter by method (cash, card, bank_transfer, online)
- [x] Filter by date range
- [x] Search by payment number, guest name
- [x] Display payment rows with:
  - [x] Payment number
  - [x] Guest/payer name
  - [x] Invoice reference (if linked)
  - [x] Amount
  - [x] Method badge
  - [x] Status badge
  - [x] Date
  - [x] Actions
- [x] Pagination
- [x] "Record Payment" button
- [x] Summary stats (Total received today, this week, this month)

#### Payment Form Component (`PaymentForm.tsx` / `new/index.tsx`)
- [x] Reference selection:
  - [x] Invoice (dropdown of unpaid/partial invoices)
  - [x] Booking (dropdown)
  - [x] Unallocated payment
- [x] Payer info:
  - [x] Select existing guest OR
  - [x] Manual entry (name, email)
- [x] Amount section:
  - [x] Amount input
  - [x] Currency (default from invoice or vendor settings)
  - [ ] Exchange rate (if different currency)
- [x] Payment method:
  - [x] Method selector (cash, card, bank_transfer, online)
  - [x] Provider (if online: stripe, bml, etc.)
  - [x] Transaction ID
  - [x] Card details (last 4 digits, brand - optional)
- [x] Payment date
- [ ] Received by (current staff - auto-filled)
- [x] Notes
- [x] Allocation section (if invoice selected):
  - [x] Auto-allocate to invoice
  - [ ] Or split across multiple invoices

#### Payment Detail Page (`/vendor/payments/[id]/index.tsx`)
- [x] Payment header
- [x] Payer info
- [x] Amount & currency
- [x] Method details
- [x] Allocated invoices list
- [ ] Receipt preview (download available, preview not inline)
- [x] Actions:
  - [ ] Allocate to invoice (not yet implemented)
  - [x] Issue refund
  - [x] Print receipt
  - [x] Download PDF
- [x] Activity timeline
- [x] Related documents (invoice, booking links)

#### Refund List Page (`/vendor/refunds/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by status (pending, approved, processing, completed, rejected)
- [x] Filter by reason type
- [x] Filter by date range
- [x] Display refund rows with:
  - [x] Refund number
  - [x] Original payment reference
  - [x] Guest name
  - [x] Amount
  - [x] Reason
  - [x] Status badge
  - [x] Actions
- [x] Pagination

#### Refund Form Component (`RefundForm.tsx` / `new/index.tsx`)
- [x] Original payment selection
- [x] Refund amount (max = original payment)
- [x] Reason:
  - [x] Reason type (cancellation, overcharge, service_issue, duplicate, other)
  - [x] Description
- [x] Refund method:
  - [x] Original method
  - [x] Cash
  - [x] Bank transfer
  - [x] Credit note
- [x] Notes

#### Refund Detail Page (`/vendor/refunds/[id]/index.tsx`)
- [x] Refund header with status
- [x] Original payment info
- [x] Refund details
- [x] Recipient info
- [x] Refund reason section
- [x] Approval workflow:
  - [x] Approve button (with confirmation modal)
  - [x] Reject button (with reason input modal)
  - [x] Process button (after approved)
- [x] Activity timeline
- [x] Related documents (payment, invoice, booking links)
- [x] Status progress indicator
- [x] Approval/Rejection info cards

#### Credit Notes
- [ ] Create credit note from refund (when refund method = credit_note)
- [ ] List credit notes
- [ ] Apply credit note to invoice
- [ ] Track balance remaining

#### API Client Methods
```typescript
payments: {
  list: (token: string, filters?: PaymentFilters) => Promise<PaginatedResponse<Payment>>,
  get: (id: string, token: string) => Promise<Payment>,
  create: (data: PaymentCreateInput, token: string) => Promise<Payment>,
  allocate: (id: string, allocations: AllocationInput[], token: string) => Promise<Payment>,
}

refunds: {
  list: (token: string, filters?: RefundFilters) => Promise<PaginatedResponse<Refund>>,
  get: (id: string, token: string) => Promise<Refund>,
  create: (data: RefundCreateInput, token: string) => Promise<Refund>,
  approve: (id: string, token: string) => Promise<Refund>,
  reject: (id: string, reason: string, token: string) => Promise<Refund>,
  process: (id: string, token: string) => Promise<Refund>,
}

creditNotes: {
  list: (token: string, filters?: CreditNoteFilters) => Promise<PaginatedResponse<CreditNote>>,
  get: (id: string, token: string) => Promise<CreditNote>,
  apply: (id: string, invoiceId: string, amount: number, token: string) => Promise<CreditNote>,
  void: (id: string, token: string) => Promise<CreditNote>,
}
```

#### Types (`src/types/payment.ts`)
```typescript
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online' | 'wallet' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
export type RefundReasonType = 'cancellation' | 'overcharge' | 'service_issue' | 'duplicate' | 'other';
export type RefundMethod = 'original_method' | 'cash' | 'bank_transfer' | 'credit_note';

export interface Payment {
  id: string;
  vendor_id: string;
  payment_number: string;

  // References
  invoice_id?: string;
  invoice?: Invoice;
  booking_id?: string;

  // Payer
  guest_id?: string;
  guest?: Guest;
  payer_name: string;
  payer_email?: string;

  // Amount
  amount: number;
  currency: string;
  exchange_rate?: number;
  amount_in_base_currency: number;

  // Method
  payment_method: PaymentMethod;
  payment_provider?: string;
  transaction_id?: string;
  card_last_four?: string;
  card_brand?: string;

  // Status
  status: PaymentStatus;

  // Details
  payment_date: string;
  received_by?: string;
  notes?: string;

  // Allocations
  allocations?: PaymentAllocation[];

  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  invoice?: Invoice;
  amount: number;
  allocated_at: string;
}

export interface Refund {
  id: string;
  vendor_id: string;
  refund_number: string;

  // References
  payment_id: string;
  payment?: Payment;
  invoice_id?: string;
  booking_id?: string;

  // Recipient
  guest_id?: string;
  guest?: Guest;
  recipient_name: string;

  // Amount
  amount: number;
  currency: string;

  // Reason
  reason_type: RefundReasonType;
  reason_description?: string;

  // Method
  refund_method: RefundMethod;
  refund_provider?: string;
  transaction_id?: string;

  // Status
  status: RefundStatus;

  // Workflow
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  processed_at?: string;
  processed_by?: string;

  created_at: string;
  updated_at: string;
}

export interface CreditNote {
  id: string;
  vendor_id: string;
  credit_note_number: string;

  // References
  invoice_id: string;
  refund_id?: string;
  guest_id: string;
  guest?: Guest;

  // Amount
  amount: number;
  currency: string;
  balance_remaining: number;

  // Dates
  issue_date: string;
  expiry_date?: string;

  // Status
  status: 'active' | 'partially_used' | 'fully_used' | 'expired' | 'voided';

  // Applications
  applications?: CreditNoteApplication[];

  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreditNoteApplication {
  id: string;
  credit_note_id: string;
  invoice_id: string;
  invoice?: Invoice;
  amount: number;
  applied_at: string;
  applied_by: string;
}
```

---

## Module 8: Discounts & Promotions

### Routes
- `/vendor/discounts` - List all discounts
- `/vendor/discounts/new` - Create new discount
- `/vendor/discounts/[id]` - Edit discount

### Checklist

#### Discount List Page (`/vendor/discounts/index.tsx`)
- [x] Create route file with routeLoader
- [x] Filter by status (active, paused, expired, depleted)
- [x] Filter by type (percentage, fixed, free_nights, free_service)
- [x] Filter by automatic vs promo code
- [x] Search by code, name
- [x] Display discount rows with:
  - [x] Name
  - [x] Code (if promo code)
  - [x] Type & value
  - [x] Valid dates
  - [x] Usage (current/limit)
  - [x] Status badge
  - [x] Actions
- [x] Pagination
- [x] "Create Discount" button
- [x] Quick filters: Active | Promo Codes | Automatic

#### Discount Form Component (`/vendor/discounts/new/index.tsx`)
- [x] Basic info:
  - [x] Name
  - [x] Description
  - [x] Is automatic toggle (vs requires code)
  - [x] Promo code input (if not automatic)
- [x] Discount value:
  - [x] Type selector (percentage, fixed, free_nights, free_service)
  - [x] Value input
  - [x] Max discount amount (for percentage)
- [x] Applicability:
  - [x] Service types (multi-select)
  - [x] Specific resources (multi-select, optional)
  - [ ] Specific rate plans (multi-select, optional)
  - [x] Min nights
  - [x] Min amount
  - [x] Min guests
- [x] Validity:
  - [x] Booking window (start/end dates)
  - [x] Stay dates (start/end dates)
  - [x] Valid days of week (checkboxes)
- [x] Limits:
  - [x] Total usage limit
  - [x] Usage per guest limit
- [x] Stacking:
  - [x] Is combinable toggle
  - [x] Priority (for multiple auto discounts)
- [x] Status (active, paused)

#### Discount Detail Page (`/vendor/discounts/[id]/index.tsx`)
- [x] Discount header with status
- [x] Configuration summary
- [x] Usage statistics:
  - [x] Total uses
  - [x] Total discount amount given
  - [ ] Usage chart over time
- [ ] Recent usage list
- [x] Actions:
  - [x] Edit
  - [x] Pause/Activate
  - [x] Duplicate
  - [x] Delete

#### API Client Methods (Already Implemented in `src/utils/api-client.ts`)
```typescript
discounts: {
  list: (token: string, filters?: DiscountFilters) => Promise<PaginatedResponse<DiscountRule>>,
  get: (id: string, token: string) => Promise<DiscountRule>,
  create: (data: DiscountCreateInput, token: string) => Promise<DiscountRule>,
  update: (id: string, data: DiscountUpdateInput, token: string) => Promise<DiscountRule>,
  delete: (id: string, token: string) => Promise<void>,
  validate: (code: string, bookingData: BookingData, token: string) => Promise<DiscountValidation>,
  getUsage: (id: string, token: string) => Promise<DiscountUsage[]>,
}
```

#### Types (Already Implemented in `src/types/discount.ts`)
```typescript
export type DiscountType = 'percentage' | 'fixed' | 'free_nights' | 'free_service';
export type DiscountStatus = 'active' | 'paused' | 'expired' | 'depleted';

export interface DiscountRule {
  id: string;
  vendor_id: string;
  code?: string;
  name: string;
  description?: string;

  // Value
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number;

  // Applicability
  applies_to?: {
    service_types?: ServiceType[];
    resource_ids?: string[];
    rate_plans?: string[];
  };
  min_nights?: number;
  min_amount?: number;
  min_guests?: number;

  // Validity
  booking_start_date?: string;
  booking_end_date?: string;
  stay_start_date?: string;
  stay_end_date?: string;
  valid_days_of_week?: number[]; // 0-6

  // Limits
  usage_limit?: number;
  usage_per_guest?: number;
  current_usage: number;

  // Stacking
  is_combinable: boolean;
  priority: number;

  // Status
  status: DiscountStatus;
  is_automatic: boolean;

  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DiscountUsage {
  id: string;
  discount_rule_id: string;
  booking_id: string;
  guest_id?: string;
  discount_amount: number;
  applied_at: string;
  applied_by?: string;
}

export interface DiscountValidation {
  is_valid: boolean;
  error_message?: string;
  discount_amount?: number;
  discount_rule?: DiscountRule;
}
```

---

## Module 9: Tax Configuration

### Routes
- `/vendor/settings/taxes` - Tax settings page

### Checklist

#### Tax Settings Page (`/vendor/settings/taxes/index.tsx`)
- [x] Create route file with routeLoader
- [x] Display system tax rates (TGST, Green Tax, Service Charge)
- [x] Toggle each tax on/off for vendor
- [x] Override rate option (where allowed)
- [x] Tax exemption rules:
  - [x] List existing exemptions
  - [x] Add new exemption
  - [x] Edit/delete exemption
- [x] Preview tax calculation

#### Tax Rate Card Component (Inline in Tax Settings Page)
- [x] Tax name & code
- [x] Rate display
- [x] Type (percentage, fixed per unit, fixed per booking)
- [x] Applies to (services list)
- [x] Special conditions (e.g., "Foreign tourists only")
- [x] Enable/disable toggle
- [x] Override rate input

#### Tax Exemption Form (Modal in Tax Settings Page)
- [x] Tax rate selector
- [x] Exemption type (guest_nationality, booking_type, promo_code)
- [x] Conditions:
  - [x] Nationalities (multi-select)
  - [x] Booking types
  - [x] Promo codes
- [x] Valid date range
- [x] Active toggle

#### Tax Calculator Component (Tab in Tax Settings Page)
- [x] Test tax calculation
- [x] Input: service type, amount, guest nationality
- [x] Output: breakdown of applicable taxes
- [x] Useful for verification

#### API Client Methods (Already Implemented in `src/utils/api-client.ts`)
```typescript
taxes: {
  getRates: (token: string) => Promise<TaxRate[]>,
  getSettings: (token: string) => Promise<VendorTaxSetting[]>,
  updateSettings: (settings: TaxSettingInput[], token: string) => Promise<VendorTaxSetting[]>,

  // Exemptions
  getExemptions: (token: string) => Promise<TaxExemption[]>,
  createExemption: (data: TaxExemptionInput, token: string) => Promise<TaxExemption>,
  updateExemption: (id: string, data: TaxExemptionInput, token: string) => Promise<TaxExemption>,
  deleteExemption: (id: string, token: string) => Promise<void>,

  // Calculator
  calculate: (data: TaxCalculationInput, token: string) => Promise<TaxCalculationResult>,
}
```

#### Types (Already Implemented in `src/types/tax.ts`)
```typescript
export type TaxRateType = 'percentage' | 'fixed_per_unit' | 'fixed_per_booking';

export interface TaxRate {
  id: string;
  vendor_id?: string; // null = system-wide
  name: string;
  code: string;
  rate: number;
  rate_type: TaxRateType;
  applies_to: ServiceType[];
  applies_to_foreigners_only: boolean;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  is_inclusive: boolean;
  show_on_invoice: boolean;
  sort_order: number;
}

export interface VendorTaxSetting {
  id: string;
  vendor_id: string;
  tax_rate_id: string;
  tax_rate?: TaxRate;
  is_enabled: boolean;
  override_rate?: number;
}

export interface TaxExemption {
  id: string;
  vendor_id: string;
  tax_rate_id: string;
  tax_rate?: TaxRate;
  exemption_type: 'guest_nationality' | 'booking_type' | 'promo_code';
  conditions: {
    nationalities?: string[];
    booking_types?: string[];
    promo_codes?: string[];
  };
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
}

export interface TaxCalculationInput {
  service_type: ServiceType;
  amount: number;
  guest_nationality?: string;
  nights?: number;
  guests?: number;
}

export interface TaxCalculationResult {
  taxes: {
    tax_id: string;
    tax_name: string;
    tax_code: string;
    rate: number;
    rate_type: TaxRateType;
    amount: number;
    is_inclusive: boolean;
  }[];
  total_tax: number;
  total_with_tax: number;
}
```

---

## Module 10: Billing Settings

### Routes
- `/vendor/settings/billing` - Billing settings page
- `/vendor/settings/payment-methods` - Payment methods page

### Checklist

#### Billing Settings Page (`/vendor/settings/billing/index.tsx`)
- [x] Create route file with routeLoader
- [x] Document numbering section:
  - [x] Invoice prefix & next number
  - [x] Quotation prefix & next number
  - [x] Receipt prefix & next number
- [x] Default values:
  - [x] Default currency
  - [x] Payment terms (days)
  - [x] Quotation validity (days)
- [x] Tax info:
  - [x] Tax registration number
  - [x] Tax-inclusive pricing toggle
- [x] Invoice content:
  - [x] Header/company details (rich text or fields)
  - [x] Footer/terms
  - [x] Payment instructions
- [x] Bank details:
  - [x] Bank name
  - [x] Account name
  - [x] Account number
  - [x] SWIFT code
  - [x] IBAN (optional)
- [x] Automation:
  - [x] Auto-generate invoice on booking toggle
  - [x] Auto-send invoice on generation toggle
  - [x] Send payment reminders toggle
  - [x] Reminder days before due (multi-select: 7, 3, 1)
- [x] Save button

#### Payment Methods Page (`/vendor/settings/payment-methods/index.tsx`)
- [x] Create route file with routeLoader
- [x] List configured payment methods
- [x] Add payment method button
- [x] For each method:
  - [x] Method type (cash, card, bank_transfer, online)
  - [x] Provider (if online)
  - [x] Display name
  - [x] Enabled toggle
  - [x] Default toggle
  - [ ] Configure button (for credentials) - Placeholder info shown
- [ ] Reorder methods (drag & drop)

#### Payment Method Form (Modal in Payment Methods Page)
- [x] Method type selector
- [x] Provider selector (conditional)
- [x] Display name
- [ ] Credentials (secure input, masked) - Placeholder for future
- [ ] Provider-specific settings - Placeholder for future

#### API Client Methods (Already Implemented in `src/utils/api-client.ts`)
```typescript
billingSettings: {
  get: (token: string) => Promise<VendorBillingSettings>,
  update: (data: BillingSettingsInput, token: string) => Promise<VendorBillingSettings>,
}

paymentMethods: {
  list: (token: string) => Promise<VendorPaymentMethod[]>,
  create: (data: PaymentMethodInput, token: string) => Promise<VendorPaymentMethod>,
  update: (id: string, data: PaymentMethodInput, token: string) => Promise<VendorPaymentMethod>,
  delete: (id: string, token: string) => Promise<void>,
  setDefault: (id: string, token: string) => Promise<VendorPaymentMethod>,
}
```

#### Types (Already Implemented in `src/types/billing.ts`)
```typescript
export interface VendorBillingSettings {
  id: string;
  vendor_id: string;

  // Numbering
  invoice_prefix: string;
  invoice_next_number: number;
  quotation_prefix: string;
  quotation_next_number: number;
  receipt_prefix: string;
  receipt_next_number: number;

  // Defaults
  default_currency: string;
  default_payment_terms_days: number;
  default_quotation_validity_days: number;

  // Tax
  tax_registration_number?: string;
  is_tax_inclusive_pricing: boolean;

  // Content
  invoice_header?: string;
  invoice_footer?: string;
  payment_instructions?: string;

  // Bank
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_swift_code?: string;
  bank_iban?: string;

  // Automation
  auto_generate_invoice_on_booking: boolean;
  auto_send_invoice_on_generation: boolean;
  send_payment_reminders: boolean;
  reminder_days_before_due: number[];

  created_at: string;
  updated_at: string;
}

export interface VendorPaymentMethod {
  id: string;
  vendor_id: string;
  method_type: PaymentMethod;
  provider?: string;
  display_name: string;
  is_enabled: boolean;
  is_default: boolean;
  credentials?: Record<string, any>; // encrypted in backend
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

---

## Module 11: Reports & Analytics

### Routes
- `/vendor/reports` - Reports dashboard
- `/vendor/reports/revenue` - Revenue report
- `/vendor/reports/payments` - Payments report
- `/vendor/reports/occupancy` - Occupancy report (accommodation)
- `/vendor/reports/tax` - Tax report

### Checklist

#### Reports Dashboard (`/vendor/reports/index.tsx`)
- [x] Create route file with routeLoader
- [x] Key metrics cards:
  - [x] Total revenue (current month vs previous)
  - [x] Total bookings
  - [x] Average booking value
  - [x] Outstanding invoices
- [x] Quick charts:
  - [x] Revenue trend (last 6 months) - bar chart
  - [x] Booking source breakdown (progress bars)
  - [x] Occupancy rate (if accommodation)
- [x] Report links:
  - [x] Revenue Report
  - [x] Payments Report
  - [x] Occupancy Report
  - [x] Tax Report
  - [ ] Guest Analytics (future)

#### Revenue Report Page (`/vendor/reports/revenue/index.tsx`)
- [x] Date range picker (presets + custom)
- [x] Group by selector (day, week, month)
- [ ] Filter by source
- [ ] Filter by service type
- [x] Revenue chart (bar chart with tooltips)
- [x] Summary stats:
  - [x] Total revenue
  - [x] Commission paid
  - [x] Net revenue
  - [x] Average daily revenue
- [x] Revenue breakdown table:
  - [x] By source
  - [x] By resource/activity
  - [x] By service type
- [x] Export button (CSV, PDF dropdown)

#### Payments Report Page (`/vendor/reports/payments/index.tsx`)
- [x] Date range picker
- [ ] Filter by method
- [ ] Filter by status
- [x] Payments summary:
  - [x] Total received
  - [x] By method breakdown (visual + table)
  - [x] Pending payments
  - [x] Failed payments
- [x] Payments list table
- [x] Export button

#### Occupancy Report Page (`/vendor/reports/occupancy/index.tsx`)
- [x] Date range picker
- [x] Filter by resource
- [x] Occupancy metrics:
  - [x] Overall occupancy rate
  - [x] Average daily rate (ADR)
  - [x] Revenue per available room (RevPAR)
- [x] Occupancy calendar heatmap (with legend)
- [x] Resource-by-resource breakdown
- [x] Export button

#### Tax Report Page (`/vendor/reports/tax/index.tsx`)
- [x] Date range picker (monthly/quarterly presets)
- [x] Tax summary:
  - [x] Total taxable amount
  - [x] By tax type breakdown (TGST, Green Tax, Service Charge)
- [x] Tax collected table:
  - [x] Invoice number
  - [x] Date
  - [x] Guest/company
  - [x] Taxable amount
  - [x] Tax breakdown by type
- [x] Totals row
- [x] Export for filing (CSV, PDF)
- [x] Filing reminder info

#### Chart Components (Inline implementations - no external library)
- [x] RevenueChart (bar chart with CSS)
- [x] OccupancyChart (calendar grid with color coding)
- [x] SourceBreakdown (progress bars)
- [x] StatCard (DaisyUI stat component)

#### Types (Already Implemented in `src/types/report.ts`)
- [x] DashboardMetrics, RevenueReportData, PaymentsReportData, OccupancyReportData, TaxReportData
- [x] DateRangePreset helpers and formatters

#### API Client Methods (Already Implemented in `src/utils/api-client.ts`)
```typescript
reports: {
  getDashboard: (token: string) => Promise<DashboardMetrics>,
  getRevenue: (filters: ReportFilters, token: string) => Promise<RevenueReport>,
  getPayments: (filters: ReportFilters, token: string) => Promise<PaymentsReport>,
  getOccupancy: (filters: ReportFilters, token: string) => Promise<OccupancyReport>,
  getTax: (filters: ReportFilters, token: string) => Promise<TaxReport>,
  getGuestAnalytics: (filters: ReportFilters, token: string) => Promise<GuestAnalytics>,
  exportReport: (type: string, filters: ReportFilters, format: 'csv' | 'pdf', token: string) => Promise<Blob>,
}
```

---

## Module 12: Staff Management

### Routes
- `/vendor/staff` - Staff list
- `/vendor/staff/new` - Add staff
- `/vendor/staff/[id]` - Edit staff

### Checklist

#### Staff List Page (`/vendor/staff/index.tsx`)
- [x] Create route file with routeLoader
- [x] Display staff members:
  - [x] Name
  - [x] Email
  - [x] Role badge
  - [x] Status (active/inactive)
  - [x] Last active
  - [x] Actions
- [x] Filter by role
- [x] Filter by status
- [x] Search by name/email
- [x] "Add Staff" button
- [x] Bulk status toggle

#### Staff Form Component (`/vendor/staff/new/index.tsx`)
- [x] Personal info:
  - [x] Name
  - [x] Email
  - [x] Phone
- [x] Role selector:
  - [x] Admin (full access)
  - [x] Manager (most access, no settings)
  - [x] Staff (limited access)
  - [x] View Only (read-only)
- [x] Permissions (granular, based on role):
  - [x] Bookings (view, create, edit, cancel)
  - [x] Guests (view, create, edit, delete)
  - [x] Resources (view, create, edit, delete)
  - [x] Finance (view, create invoices, record payments)
  - [x] Reports (view)
  - [x] Settings (view, edit)
  - [x] Staff (view, manage)
- [x] Status (active/inactive)
- [x] Send invite toggle

#### Staff Detail Page (`/vendor/staff/[id]/index.tsx`)
- [x] Staff info display
- [x] Permissions display
- [x] Activity log:
  - [x] Recent actions
  - [x] Login history
- [x] Actions:
  - [x] Edit
  - [x] Deactivate/Activate
  - [x] Reset password
  - [x] Resend invite
  - [x] Remove

#### API Client Methods
```typescript
staff: {
  list: (token: string) => Promise<VendorStaff[]>,
  get: (id: string, token: string) => Promise<VendorStaff>,
  create: (data: StaffCreateInput, token: string) => Promise<VendorStaff>,
  update: (id: string, data: StaffUpdateInput, token: string) => Promise<VendorStaff>,
  delete: (id: string, token: string) => Promise<void>,
  resendInvite: (id: string, token: string) => Promise<void>,
  getActivityLog: (id: string, token: string) => Promise<StaffActivity[]>,
}
```

#### Types
```typescript
export type StaffRole = 'admin' | 'manager' | 'staff' | 'view_only';

export interface VendorStaff {
  id: string;
  vendor_id: string;
  user_id?: string; // linked user account
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  permissions: StaffPermissions;
  is_active: boolean;
  last_active_at?: string;
  invite_sent_at?: string;
  invite_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffPermissions {
  bookings: { view: boolean; create: boolean; edit: boolean; cancel: boolean };
  guests: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  resources: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  finance: { view: boolean; create_invoices: boolean; record_payments: boolean };
  reports: { view: boolean };
  settings: { view: boolean; edit: boolean };
  staff: { view: boolean; manage: boolean };
}

export interface StaffActivity {
  id: string;
  staff_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}
```

---

## Shared Components Library

### Location: `src/components/vendor/shared/`

### Component Checklist

#### PageHeader.tsx
- [ ] Title prop
- [ ] Subtitle prop (optional)
- [ ] Breadcrumbs (optional)
- [ ] Actions slot (for buttons)
- [ ] Responsive layout

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: JSX.Element;
}
```

#### DataTable.tsx
- [ ] Column definitions prop
- [ ] Data array prop
- [ ] Sorting (click headers)
- [ ] Loading state
- [ ] Empty state
- [ ] Row click handler
- [ ] Checkbox selection (optional)
- [ ] Pagination integration

```typescript
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => JSX.Element;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
}
```

#### StatusBadge.tsx
- [ ] Status prop
- [ ] Color mapping
- [ ] Size variants (sm, md)
- [ ] With icon option

```typescript
type BadgeStatus =
  | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
  | 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  | 'active' | 'paused' | 'expired';

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
  withIcon?: boolean;
}
```

#### ActionDropdown.tsx
- [ ] Actions array prop
- [ ] Icon per action
- [ ] Dividers between groups
- [ ] Disabled state
- [ ] Danger styling for destructive actions

```typescript
interface Action {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
}

interface ActionDropdownProps {
  actions: Action[];
}
```

#### EmptyState.tsx
- [ ] Icon prop
- [ ] Title prop
- [ ] Description prop
- [ ] Action button (optional)

#### ConfirmModal.tsx
- [ ] Title prop
- [ ] Message prop
- [ ] Confirm button text
- [ ] Cancel button text
- [ ] Danger mode (red confirm button)
- [ ] Loading state
- [ ] onConfirm callback
- [ ] onCancel callback

#### FilterBar.tsx
- [ ] Filter definitions prop
- [ ] Values prop
- [ ] onChange callback
- [ ] Reset button
- [ ] Search input integration

```typescript
interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'date' | 'date-range' | 'multi-select';
  options?: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterDefinition[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  searchPlaceholder?: string;
}
```

#### LineItemEditor.tsx
- [ ] Items array prop
- [ ] onChange callback
- [ ] Add item button
- [ ] Item type selector
- [ ] Quantity, unit, price inputs
- [ ] Tax selector
- [ ] Auto-calculate line total
- [ ] Drag to reorder
- [ ] Delete item button
- [ ] Totals display

---

## Type Definitions

### Create/Update Type Files

#### `src/types/guest.ts`
- [ ] Guest interface
- [ ] GuestPreferences interface
- [ ] GuestFilters interface
- [ ] GuestCreateInput interface
- [ ] GuestUpdateInput interface
- [ ] GuestHistory interface

#### `src/types/resource.ts`
- [x] ServiceType type
- [x] ResourceType type
- [x] ResourceStatus type
- [x] VendorResource interface
- [x] AccommodationDetails interface
- [x] BedConfig interface
- [x] ResourceMedia interface
- [x] ResourceAmenity interface
- [x] Amenity interface
- [x] ResourceAvailability interface
- [x] RatePlan interface

#### `src/types/booking-vendor.ts`
- [ ] BookingSourceType type
- [ ] BookingStatus type
- [ ] PaymentStatus type
- [ ] VendorBooking interface
- [ ] BookingService interface
- [ ] PricingBreakdown interface
- [ ] BookingFilters interface
- [ ] CalendarBooking interface

#### `src/types/quotation.ts`
- [x] QuotationStatus type
- [x] ItemType type
- [x] ItemUnit type
- [x] Quotation interface
- [x] QuotationItem interface
- [x] QuotationFilters interface
- [x] QuotationItemInput interface
- [x] QuotationCreateInput interface
- [x] QuotationUpdateInput interface
- [x] Helper functions (calculateLineTotal, isQuotationEditable, etc.)

#### `src/types/invoice.ts`
- [x] InvoiceStatus type
- [x] Invoice interface
- [x] InvoiceItem interface

#### `src/types/payment.ts`
- [x] PaymentMethod type
- [x] PaymentStatus type
- [x] RefundStatus type
- [x] Payment interface
- [x] PaymentAllocation interface
- [x] Refund interface
- [x] CreditNote interface
- [x] CreditNoteApplication interface

#### `src/types/discount.ts`
- [ ] DiscountType type
- [ ] DiscountStatus type
- [ ] DiscountRule interface
- [ ] DiscountUsage interface
- [ ] DiscountValidation interface

#### `src/types/tax.ts` (update or create)
- [ ] TaxRateType type
- [ ] TaxRate interface
- [ ] VendorTaxSetting interface
- [ ] TaxExemption interface
- [ ] TaxCalculationInput interface
- [ ] TaxCalculationResult interface

#### `src/types/billing.ts`
- [ ] VendorBillingSettings interface
- [ ] VendorPaymentMethod interface

#### `src/types/staff.ts`
- [ ] StaffRole type
- [ ] VendorStaff interface
- [ ] StaffPermissions interface
- [ ] StaffActivity interface

---

## API Client Extensions

### File: `src/utils/api-client.ts`

#### Extend vendorPortal object

```typescript
vendorPortal: {
  // Existing methods...

  // Dashboard
  getDashboardCounts: (token: string) => Promise<DashboardCounts>,

  // Guests
  guests: {
    list: (token: string, filters?: GuestFilters) => Promise<PaginatedResponse<Guest>>,
    get: (id: string, token: string) => Promise<Guest>,
    create: (data: GuestCreateInput, token: string) => Promise<Guest>,
    update: (id: string, data: GuestUpdateInput, token: string) => Promise<Guest>,
    delete: (id: string, token: string) => Promise<void>,
    merge: (primaryId: string, duplicateIds: string[], token: string) => Promise<Guest>,
    getHistory: (id: string, token: string) => Promise<GuestHistory[]>,
  },

  // Resources
  resources: {
    list: (token: string, filters?: ResourceFilters) => Promise<PaginatedResponse<VendorResource>>,
    get: (id: string, token: string) => Promise<VendorResource>,
    create: (data: ResourceCreateInput, token: string) => Promise<VendorResource>,
    update: (id: string, data: ResourceUpdateInput, token: string) => Promise<VendorResource>,
    delete: (id: string, token: string) => Promise<void>,
    getAmenities: (resourceId: string, token: string) => Promise<ResourceAmenity[]>,
    updateAmenities: (resourceId: string, amenities: AmenityInput[], token: string) => Promise<void>,
    getAvailability: (resourceId: string, startDate: string, endDate: string, token: string) => Promise<ResourceAvailability[]>,
    updateAvailability: (resourceId: string, dates: AvailabilityUpdate[], token: string) => Promise<void>,
    getRatePlans: (resourceId: string, token: string) => Promise<RatePlan[]>,
    createRatePlan: (resourceId: string, data: RatePlanInput, token: string) => Promise<RatePlan>,
    updateRatePlan: (resourceId: string, planId: string, data: RatePlanInput, token: string) => Promise<RatePlan>,
    deleteRatePlan: (resourceId: string, planId: string, token: string) => Promise<void>,
  },

  // Enhanced Bookings
  bookings: {
    list: (token: string, filters?: BookingFilters) => Promise<PaginatedResponse<VendorBooking>>,
    get: (id: string, token: string) => Promise<VendorBooking>,
    create: (data: BookingCreateInput, token: string) => Promise<VendorBooking>,
    update: (id: string, data: BookingUpdateInput, token: string) => Promise<VendorBooking>,
    updateStatus: (id: string, status: BookingStatus, token: string) => Promise<VendorBooking>,
    cancel: (id: string, reason: string, token: string) => Promise<VendorBooking>,
    addService: (bookingId: string, data: BookingServiceInput, token: string) => Promise<BookingService>,
    updateService: (bookingId: string, serviceId: string, data: BookingServiceInput, token: string) => Promise<BookingService>,
    removeService: (bookingId: string, serviceId: string, token: string) => Promise<void>,
    getCalendar: (startDate: string, endDate: string, token: string) => Promise<CalendarBooking[]>,
  },

  // Quotations
  quotations: {
    list: (token: string, filters?: QuotationFilters) => Promise<PaginatedResponse<Quotation>>,
    get: (id: string, token: string) => Promise<Quotation>,
    create: (data: QuotationCreateInput, token: string) => Promise<Quotation>,
    update: (id: string, data: QuotationUpdateInput, token: string) => Promise<Quotation>,
    delete: (id: string, token: string) => Promise<void>,
    send: (id: string, token: string) => Promise<Quotation>,
    convert: (id: string, token: string) => Promise<{ booking_id: string }>,
    getPdf: (id: string, token: string) => Promise<Blob>,
  },

  // Invoices
  invoices: {
    list: (token: string, filters?: InvoiceFilters) => Promise<PaginatedResponse<Invoice>>,
    get: (id: string, token: string) => Promise<Invoice>,
    create: (data: InvoiceCreateInput, token: string) => Promise<Invoice>,
    update: (id: string, data: InvoiceUpdateInput, token: string) => Promise<Invoice>,
    send: (id: string, token: string) => Promise<Invoice>,
    void: (id: string, reason: string, token: string) => Promise<Invoice>,
    duplicate: (id: string, token: string) => Promise<Invoice>,
    getPdf: (id: string, token: string) => Promise<Blob>,
    createFromBooking: (bookingId: string, token: string) => Promise<Invoice>,
  },

  // Payments
  payments: {
    list: (token: string, filters?: PaymentFilters) => Promise<PaginatedResponse<Payment>>,
    get: (id: string, token: string) => Promise<Payment>,
    create: (data: PaymentCreateInput, token: string) => Promise<Payment>,
    allocate: (id: string, allocations: AllocationInput[], token: string) => Promise<Payment>,
  },

  // Refunds
  refunds: {
    list: (token: string, filters?: RefundFilters) => Promise<PaginatedResponse<Refund>>,
    get: (id: string, token: string) => Promise<Refund>,
    create: (data: RefundCreateInput, token: string) => Promise<Refund>,
    approve: (id: string, token: string) => Promise<Refund>,
    reject: (id: string, reason: string, token: string) => Promise<Refund>,
    process: (id: string, token: string) => Promise<Refund>,
  },

  // Credit Notes
  creditNotes: {
    list: (token: string, filters?: CreditNoteFilters) => Promise<PaginatedResponse<CreditNote>>,
    get: (id: string, token: string) => Promise<CreditNote>,
    apply: (id: string, invoiceId: string, amount: number, token: string) => Promise<CreditNote>,
    void: (id: string, token: string) => Promise<CreditNote>,
  },

  // Discounts
  discounts: {
    list: (token: string, filters?: DiscountFilters) => Promise<PaginatedResponse<DiscountRule>>,
    get: (id: string, token: string) => Promise<DiscountRule>,
    create: (data: DiscountCreateInput, token: string) => Promise<DiscountRule>,
    update: (id: string, data: DiscountUpdateInput, token: string) => Promise<DiscountRule>,
    delete: (id: string, token: string) => Promise<void>,
    validate: (code: string, bookingData: BookingData, token: string) => Promise<DiscountValidation>,
  },

  // Taxes
  taxes: {
    getRates: (token: string) => Promise<TaxRate[]>,
    getSettings: (token: string) => Promise<VendorTaxSetting[]>,
    updateSettings: (settings: TaxSettingInput[], token: string) => Promise<VendorTaxSetting[]>,
    getExemptions: (token: string) => Promise<TaxExemption[]>,
    createExemption: (data: TaxExemptionInput, token: string) => Promise<TaxExemption>,
    updateExemption: (id: string, data: TaxExemptionInput, token: string) => Promise<TaxExemption>,
    deleteExemption: (id: string, token: string) => Promise<void>,
    calculate: (data: TaxCalculationInput, token: string) => Promise<TaxCalculationResult>,
  },

  // Billing Settings
  billingSettings: {
    get: (token: string) => Promise<VendorBillingSettings>,
    update: (data: BillingSettingsInput, token: string) => Promise<VendorBillingSettings>,
  },

  // Payment Methods
  paymentMethods: {
    list: (token: string) => Promise<VendorPaymentMethod[]>,
    create: (data: PaymentMethodInput, token: string) => Promise<VendorPaymentMethod>,
    update: (id: string, data: PaymentMethodInput, token: string) => Promise<VendorPaymentMethod>,
    delete: (id: string, token: string) => Promise<void>,
  },

  // Reports
  reports: {
    getDashboard: (token: string) => Promise<DashboardMetrics>,
    getRevenue: (filters: ReportFilters, token: string) => Promise<RevenueReport>,
    getPayments: (filters: ReportFilters, token: string) => Promise<PaymentsReport>,
    getOccupancy: (filters: ReportFilters, token: string) => Promise<OccupancyReport>,
    getTax: (filters: ReportFilters, token: string) => Promise<TaxReport>,
  },

  // Staff
  staff: {
    list: (token: string) => Promise<VendorStaff[]>,
    get: (id: string, token: string) => Promise<VendorStaff>,
    create: (data: StaffCreateInput, token: string) => Promise<VendorStaff>,
    update: (id: string, data: StaffUpdateInput, token: string) => Promise<VendorStaff>,
    delete: (id: string, token: string) => Promise<void>,
  },
}
```

---

## Implementation Priority Order

### High Priority (Core Business Operations)
1. **Module 1**: Navigation & Layout Updates
2. **Module 4**: Enhanced Booking System
3. **Module 2**: Guest Management
4. **Module 6**: Invoices
5. **Module 7**: Payments

### Medium Priority (Extended Features)
6. **Module 3**: Resource Management
7. **Module 5**: Quotations
8. **Module 9**: Tax Configuration
9. **Module 10**: Billing Settings
10. **Module 8**: Discounts & Promotions

### Lower Priority (Analytics & Admin)
11. **Module 11**: Reports & Analytics
12. **Module 12**: Staff Management

---

## Testing Checklist

### Unit Tests (Vitest)
- [ ] Component rendering tests
- [ ] Form validation tests
- [ ] Utility function tests
- [ ] API client mock tests

### E2E Tests (Playwright)
- [ ] Guest CRUD flow
- [ ] Booking creation flow
- [ ] Invoice generation flow
- [ ] Payment recording flow
- [ ] Report generation flow

### Manual Testing
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Error state handling
- [ ] Loading state handling
- [ ] Empty state handling
- [ ] Permission-based access

---

## Notes

### Dependencies to Consider
- Chart library for reports (e.g., Chart.js, Recharts via Qwik wrapper)
- PDF generation (server-side via API)
- Calendar component (existing or new)
- Rich text editor (for invoice headers/notes)

### API Backend Requirements
Ensure the Go backend implements all endpoints defined in the feature plan before UI integration. Coordinate with backend team on:
- Response formats
- Error handling
- Pagination structure
- File upload endpoints
- PDF generation endpoints

### Accessibility
- Ensure all forms are keyboard navigable
- Add proper ARIA labels
- Test with screen readers
- Maintain color contrast ratios

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-XX-XX | Initial implementation guide |
