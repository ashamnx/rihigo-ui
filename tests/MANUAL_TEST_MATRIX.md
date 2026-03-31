# Rihigo UI — Manual Test Matrix

> Comprehensive checklist for human QA testing of the Rihigo tourism platform.
> Check boxes as you verify each case. Add notes in the `Notes` column if needed.

---

## 1. Authentication & Access Control

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-AUTH-001** | Navigate to `/admin` without signing in | Guest | Redirected to `/auth/sign-in?callbackUrl=...` | |
| - [ ] | **TC-AUTH-002** | Navigate to `/en-US/bookings` without signing in | Guest | Redirected to sign-in with callback | |
| - [ ] | **TC-AUTH-003** | Navigate to `/vendor` without signing in | Guest | Redirected to sign-in | |
| - [ ] | **TC-AUTH-004** | Sign in with Google OAuth | Guest | Redirected to callback URL or homepage | |
| - [ ] | **TC-AUTH-005** | Sign in and access `/admin` as admin role | Admin user | Admin dashboard loads | |
| - [ ] | **TC-AUTH-006** | Sign in and access `/admin` as regular user | Regular user | Redirected to homepage (not admin) | |
| - [ ] | **TC-AUTH-007** | Sign in and access `/vendor` as vendor user | Vendor user | Vendor dashboard loads | |
| - [ ] | **TC-AUTH-008** | Sign in and access `/vendor` as non-vendor | Regular user | Access denied page shown | |
| - [ ] | **TC-AUTH-009** | Session expires during navigation | Logged in user | Redirected to sign-in on next protected page | |
| - [ ] | **TC-AUTH-010** | Sign-in page shows Google button | Guest | "Continue with Google" button visible | |
| - [ ] | **TC-AUTH-011** | Sign-in page shows translated content | Guest, it-IT locale | Italian text displayed | |
| - [ ] | **TC-AUTH-012** | Welcome page loads for new user | First-time user | Welcome/onboarding content shown | |
| - [ ] | **TC-AUTH-013** | Unauthorized page displays correctly | User without access | 403 message with navigation options | |
| - [ ] | **TC-AUTH-014** | Direct URL to protected page preserves callbackUrl | Guest | After sign-in, returned to original URL | |

---

## 2. Admin Panel

### 2.1 Admin Dashboard (`/admin`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-ADM-001** | Load admin dashboard | Admin signed in | Stats cards show counts for Activities, Bookings, Vendors, Users | |
| - [ ] | **TC-ADM-002** | Click quick action buttons | Admin signed in | Navigate to New Activity, New Vendor, New Category, View Bookings | |
| - [ ] | **TC-ADM-003** | Verify stats accuracy | Admin, known data | Counts match database totals | |

### 2.2 Users Management (`/admin/users`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-USR-001** | List all users | Admin | Users listed with name, email, role badges | |
| - [ ] | **TC-USR-002** | Search users by email | Admin | Filtered results shown | |
| - [ ] | **TC-USR-003** | Search users by name | Admin | Filtered results shown | |
| - [ ] | **TC-USR-004** | Filter users by role (admin) | Admin | Only admin users shown | |
| - [ ] | **TC-USR-005** | Filter users by role (user) | Admin | Only regular users shown | |
| - [ ] | **TC-USR-006** | Paginate user list (20/page) | Admin, >20 users | Pagination controls work | |
| - [ ] | **TC-USR-007** | View user detail page | Admin | `/admin/users/[id]` shows profile info | |
| - [ ] | **TC-USR-008** | Update user name | Admin | Name saved successfully | |
| - [ ] | **TC-USR-009** | Update user phone, nationality, DOB | Admin | Fields saved successfully | |
| - [ ] | **TC-USR-010** | Change user role: user to admin | Admin | Role badge updates, confirmation modal shown | |
| - [ ] | **TC-USR-011** | Change user role: admin to user | Admin | Role badge updates | |
| - [ ] | **TC-USR-012** | Delete user with confirmation | Admin | Confirmation modal → user removed from list | |
| - [ ] | **TC-USR-013** | Cancel delete confirmation | Admin | User not deleted, modal closes | |

### 2.3 Activities Management (`/admin/activities`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-ACT-001** | List all activities | Admin | Activities shown in grid/table view | |
| - [ ] | **TC-ACT-002** | Toggle view mode (grid ↔ table) | Admin | View switches correctly | |
| - [ ] | **TC-ACT-003** | Search activities by title | Admin | Filtered results shown | |
| - [ ] | **TC-ACT-004** | Filter by category | Admin | Only matching activities shown | |
| - [ ] | **TC-ACT-005** | Filter by status (published/draft) | Admin | Only matching status shown | |
| - [ ] | **TC-ACT-006** | Create new activity (`/admin/activities/new`) | Admin | Form loads with slug, category, vendor, island, status, SEO fields | |
| - [ ] | **TC-ACT-007** | Submit new activity with required fields | Admin | Activity created, redirected to list | |
| - [ ] | **TC-ACT-008** | Slug auto-generates from title (lowercase + hyphens) | Admin | Slug field auto-populates | |
| - [ ] | **TC-ACT-009** | Edit activity details | Admin | Changes saved successfully | |
| - [ ] | **TC-ACT-010** | Toggle activity status: draft ↔ published | Admin | Status badge updates | |
| - [ ] | **TC-ACT-011** | Access page builder (`/activities/[id]/builder`) | Admin | Builder interface loads | |
| - [ ] | **TC-ACT-012** | Manage packages (`/activities/[id]/packages`) | Admin | Package list/create interface loads | |
| - [ ] | **TC-ACT-013** | Add package with price | Admin | Package appears in list | |
| - [ ] | **TC-ACT-014** | Edit package price | Admin | Price updated | |
| - [ ] | **TC-ACT-015** | Delete package | Admin | Package removed with confirmation | |
| - [ ] | **TC-ACT-016** | Fill SEO metadata (title, description, keywords) | Admin | SEO fields saved | |
| - [ ] | **TC-ACT-017** | Assign vendor to activity | Admin | Vendor linked | |
| - [ ] | **TC-ACT-018** | Assign island/atoll to activity | Admin | Location saved | |

### 2.4 Bookings Management (`/admin/bookings`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-BKG-001** | List all bookings | Admin | Bookings shown with customer, activity, status, payment badges | |
| - [ ] | **TC-BKG-002** | Search by booking ID | Admin | Matching booking found | |
| - [ ] | **TC-BKG-003** | Search by customer name | Admin | Matching bookings shown | |
| - [ ] | **TC-BKG-004** | Filter by booking status | Admin | Only matching status shown | |
| - [ ] | **TC-BKG-005** | Paginate booking list (20/page) | Admin, >20 bookings | Pagination works | |
| - [ ] | **TC-BKG-006** | View booking detail (`/admin/bookings/[id]`) | Admin | Full details: customer, activity, dates, payment | |
| - [ ] | **TC-BKG-007** | Update booking status: pending → confirmed | Admin | Status badge updates | |
| - [ ] | **TC-BKG-008** | Update booking status: confirmed → completed | Admin | Status updates | |
| - [ ] | **TC-BKG-009** | Cancel booking: any → cancelled | Admin | Status updates with confirmation | |
| - [ ] | **TC-BKG-010** | Confirm vendor status (confirm) | Admin, pending vendor status | Vendor status changes to confirmed | |
| - [ ] | **TC-BKG-011** | Reject vendor status with notes | Admin | Vendor status changes to rejected | |
| - [ ] | **TC-BKG-012** | Process refund (amount, reason, notes) | Admin, payment_status=paid | Refund processed, payment status updates | |
| - [ ] | **TC-BKG-013** | Refund button hidden when not paid | Admin, payment_status=pending | No refund button shown | |
| - [ ] | **TC-BKG-014** | Refund with invalid amount (> paid) | Admin | Validation error shown | |

### 2.5 Payments Management (`/admin/payments`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-PAY-001** | List all payments | Admin | Payments shown with amount, status, booking ref | |
| - [ ] | **TC-PAY-002** | Search by payment/transaction ID | Admin | Matching payment found | |
| - [ ] | **TC-PAY-003** | Filter by payment status | Admin | Filtered results | |
| - [ ] | **TC-PAY-004** | View payment stats (total, pending, completed, failed) | Admin | Stats cards accurate | |
| - [ ] | **TC-PAY-005** | Sync payment status | Admin | Status refreshed from provider | |
| - [ ] | **TC-PAY-006** | Currency displays correctly (MVR) | Admin | Amount formatted with MVR | |

### 2.6 Vendors Management (`/admin/vendors`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VND-001** | List all vendors | Admin | Vendors shown with status/verified badges | |
| - [ ] | **TC-VND-002** | Create new vendor (`/admin/vendors/new`) | Admin | Form: business_name, email, phone, registration #, contacts, commission | |
| - [ ] | **TC-VND-003** | Submit vendor with required fields | Admin | Vendor created | |
| - [ ] | **TC-VND-004** | Edit vendor (`/admin/vendors/[id]/edit`) | Admin | Fields editable and saved | |
| - [ ] | **TC-VND-005** | Delete vendor with confirmation | Admin | Vendor removed | |
| - [ ] | **TC-VND-006** | Verify vendor (click verify button) | Admin, unverified vendor | Vendor marked as verified | |
| - [ ] | **TC-VND-007** | Update vendor status: pending → active | Admin | Status badge updates | |
| - [ ] | **TC-VND-008** | Suspend vendor | Admin | Status changes to suspended | |
| - [ ] | **TC-VND-009** | View vendor staff (`/vendors/[id]/users`) | Admin | Staff list shown | |
| - [ ] | **TC-VND-010** | Add staff member (email + role) | Admin | Staff member added | |
| - [ ] | **TC-VND-011** | Update staff role | Admin | Role updated | |
| - [ ] | **TC-VND-012** | Remove staff member | Admin | Staff removed with confirmation | |
| - [ ] | **TC-VND-013** | View vendor activity logs | Admin | Logs displayed chronologically | |

### 2.7 Tickets Management (`/admin/tickets`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-TKT-001** | List all tickets | Admin | Tickets with #, subject, status, priority badges | |
| - [ ] | **TC-TKT-002** | Search by ticket #, subject, email | Admin | Matching tickets found | |
| - [ ] | **TC-TKT-003** | Filter by status (open/in_progress/resolved/closed) | Admin | Filtered results | |
| - [ ] | **TC-TKT-004** | Filter by priority (critical/high/medium/low) | Admin | Filtered results | |
| - [ ] | **TC-TKT-005** | Filter by category (booking_issue, refund, etc.) | Admin | Filtered results | |
| - [ ] | **TC-TKT-006** | View stats cards (total, open, in_progress, critical) | Admin | Counts accurate | |
| - [ ] | **TC-TKT-007** | View ticket detail (`/admin/tickets/[id]`) | Admin | Full thread, status, priority shown | |
| - [ ] | **TC-TKT-008** | Update ticket status: open → in_progress | Admin | Status updates | |
| - [ ] | **TC-TKT-009** | Update ticket status: in_progress → resolved | Admin | Status updates | |
| - [ ] | **TC-TKT-010** | Add customer-facing reply | Admin | Message appears in thread | |
| - [ ] | **TC-TKT-011** | Add internal note (is_internal checked) | Admin | Note saved but not visible to customer | |
| - [ ] | **TC-TKT-012** | Assign ticket to admin user | Admin | Assigned_to field updates | |
| - [ ] | **TC-TKT-013** | Assign ticket to vendor | Admin | Assigned vendor updates | |
| - [ ] | **TC-TKT-014** | Update priority and category | Admin | Fields saved | |

### 2.8 Categories Management (`/admin/categories`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-CAT-001** | List all categories | Admin | Categories with name, icon, order, status | |
| - [ ] | **TC-CAT-002** | Create new category | Admin | Name, icon, description, display_order, is_active | |
| - [ ] | **TC-CAT-003** | Edit category | Admin | Changes saved | |
| - [ ] | **TC-CAT-004** | Delete category with confirmation | Admin | Category removed | |
| - [ ] | **TC-CAT-005** | Toggle is_active status | Admin | Badge updates | |

### 2.9 FAQs Management (`/admin/faqs`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-FAQ-001** | List all FAQs | Admin | FAQs with question preview, category, published badge | |
| - [ ] | **TC-FAQ-002** | Create FAQ with en-US translation | Admin | Question + answer saved for English | |
| - [ ] | **TC-FAQ-003** | Create FAQ with both en-US and it-IT | Admin | Both translations saved | |
| - [ ] | **TC-FAQ-004** | Edit FAQ question/answer | Admin | Changes saved | |
| - [ ] | **TC-FAQ-005** | Toggle published status | Admin | Badge updates | |
| - [ ] | **TC-FAQ-006** | Change display order | Admin | Order saved, list re-sorts | |
| - [ ] | **TC-FAQ-007** | Delete FAQ with confirmation | Admin | FAQ removed | |

### 2.10 Media Management (`/admin/media`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-MED-001** | List media in gallery grid | Admin | Images displayed in grid (24/page) | |
| - [ ] | **TC-MED-002** | Search media by filename | Admin | Filtered results | |
| - [ ] | **TC-MED-003** | Filter by owner_type | Admin | Filtered results | |
| - [ ] | **TC-MED-004** | Filter by privacy_level | Admin | Filtered results | |
| - [ ] | **TC-MED-005** | Upload JPEG image | Admin | Presigned URL → upload → record created | |
| - [ ] | **TC-MED-006** | Upload PNG image | Admin | Upload succeeds | |
| - [ ] | **TC-MED-007** | Upload WebP image | Admin | Upload succeeds | |
| - [ ] | **TC-MED-008** | Reject invalid file type (e.g., .exe) | Admin | Error message shown | |
| - [ ] | **TC-MED-009** | Reject file exceeding size limit | Admin | Error: "File too large" | |
| - [ ] | **TC-MED-010** | Delete media with confirmation | Admin | Media removed | |
| - [ ] | **TC-MED-011** | View CDN URL for public media | Admin | URL accessible | |

### 2.11 Notifications (`/admin/notifications`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-NTF-001** | Send notification to specific user | Admin | Notification delivered | |
| - [ ] | **TC-NTF-002** | Broadcast notification to all users | Admin | All users receive notification | |
| - [ ] | **TC-NTF-003** | Send with different types (system, booking, etc.) | Admin | Type badge correct | |
| - [ ] | **TC-NTF-004** | Send with different priorities (low/normal/high/urgent) | Admin | Priority correct | |
| - [ ] | **TC-NTF-005** | Send with action_url | Admin | Notification links to correct URL | |
| - [ ] | **TC-NTF-006** | View notification stats | Admin | Counts update after send | |
| - [ ] | **TC-NTF-007** | Send to non-existent user_id | Admin | Error message shown | |
| - [ ] | **TC-NTF-008** | Submit with missing required fields | Admin | Validation errors shown | |

### 2.12 Tax Rules (`/admin/taxes`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-TAX-001** | List all tax rules | Admin | Rules with name, type, rate, status | |
| - [ ] | **TC-TAX-002** | Create percentage tax rule | Admin | Name, type=percentage, rate=16 | |
| - [ ] | **TC-TAX-003** | Create fixed_per_person tax rule | Admin | Name, type=fixed_per_person, rate=6 | |
| - [ ] | **TC-TAX-004** | Edit tax rule | Admin | Changes saved | |
| - [ ] | **TC-TAX-005** | Toggle tax rule active/inactive | Admin | Status updates | |
| - [ ] | **TC-TAX-006** | Delete tax rule | Admin | Rule removed | |
| - [ ] | **TC-TAX-007** | Validation: rate > 100 for percentage | Admin | Error or capped | |
| - [ ] | **TC-TAX-008** | Validation: empty name | Admin | Required field error | |

### 2.13 IMUGA Admin (`/admin/imuga`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-IMG-001** | List declarations | Admin | Declarations with status, group, date | |
| - [ ] | **TC-IMG-002** | Search by declaration # or group name | Admin | Filtered results | |
| - [ ] | **TC-IMG-003** | Filter by status | Admin | Filtered results | |
| - [ ] | **TC-IMG-004** | Create new declaration | Admin | Form loads, save succeeds | |
| - [ ] | **TC-IMG-005** | Add traveler to declaration | Admin | Traveler form loads, save succeeds | |
| - [ ] | **TC-IMG-006** | Update declaration status: draft → ready | Admin | Status updates | |
| - [ ] | **TC-IMG-007** | Delete draft declaration | Admin | Removed with confirmation | |
| - [ ] | **TC-IMG-008** | List IMUGA requests | Admin | Requests with status, requester info | |
| - [ ] | **TC-IMG-009** | Approve pending request | Admin | Status changes to completed | |
| - [ ] | **TC-IMG-010** | Reject request with reason | Admin | Status changes to rejected, reason saved | |
| - [ ] | **TC-IMG-011** | Reject request without reason | Admin | Validation requires reason | |

### 2.14 Islands & Atolls (`/admin/islands`, `/admin/atolls`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-GEO-001** | List atolls | Admin | Atolls displayed | |
| - [ ] | **TC-GEO-002** | List islands | Admin | Islands with atoll, type | |
| - [ ] | **TC-GEO-003** | Filter islands by atoll | Admin | Correct islands shown | |
| - [ ] | **TC-GEO-004** | Filter islands by type (resort/local/uninhabited/airport) | Admin | Filtered results | |

---

## 3. Public Website

### 3.1 Homepage (`/[lang]/`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-HOME-001** | Load homepage (en-US) | None | Hero section, featured activities, FAQs load | |
| - [ ] | **TC-HOME-002** | Load homepage (it-IT) | None | Italian content displayed | |
| - [ ] | **TC-HOME-003** | Root URL `/` redirects to `/en-US/` | None | Redirect works | |
| - [ ] | **TC-HOME-004** | Hero CTA button navigates to activities | None | `/[lang]/activities` loads | |
| - [ ] | **TC-HOME-005** | Language selector switches locale | None | URL changes, content translates | |
| - [ ] | **TC-HOME-006** | Currency selector changes currency | None | Prices update across page | |
| - [ ] | **TC-HOME-007** | Currency persists in localStorage | None | Refresh keeps selected currency | |
| - [ ] | **TC-HOME-008** | Navigation links work (Activities, Profile, Bookings) | Logged in | All links navigate correctly | |

### 3.2 Activities Browse (`/[lang]/activities`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-ACTS-001** | List activities (12/page) | None | Activity cards with image, title, price, location | |
| - [ ] | **TC-ACTS-002** | Filter by category | None | Only matching activities shown | |
| - [ ] | **TC-ACTS-003** | Filter by atoll | None | Only matching activities shown | |
| - [ ] | **TC-ACTS-004** | Filter by island | None | Only matching activities shown | |
| - [ ] | **TC-ACTS-005** | Combine filters (category + atoll) | None | Intersection of filters | |
| - [ ] | **TC-ACTS-006** | Paginate results | >12 activities | Next/prev pages work | |
| - [ ] | **TC-ACTS-007** | Prices displayed in selected currency | Currency = EUR | Euro prices shown | |
| - [ ] | **TC-ACTS-008** | Activity card shows review score (if > 0) | Activity with reviews | Star rating visible | |
| - [ ] | **TC-ACTS-009** | Activity card shows fallback for no image | Activity without images | Emoji/placeholder shown | |
| - [ ] | **TC-ACTS-010** | Click activity card → detail page | None | Navigates to `/activities/[slug]` | |

### 3.3 Activity Detail (`/[lang]/activities/[slug]`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-ACTD-001** | Load activity detail page | None | Hero, overview, packages visible | |
| - [ ] | **TC-ACTD-002** | Translated title/description shown | it-IT locale | Italian content | |
| - [ ] | **TC-ACTD-003** | Packages listed with USD prices | None | Package cards with prices | |
| - [ ] | **TC-ACTD-004** | Prices converted to selected currency | Currency = JPY | Yen prices shown | |
| - [ ] | **TC-ACTD-005** | Select package → navigate to booking | Logged in | Redirects to `/booking/[slug]` | |
| - [ ] | **TC-ACTD-006** | Select package → redirect to sign-in if guest | Guest | Sign-in with callback to booking | |
| - [ ] | **TC-ACTD-007** | Gallery displays multiple images | Activity with images | Gallery component renders | |
| - [ ] | **TC-ACTD-008** | Location shows island & atoll | Activity with location | Location info visible | |
| - [ ] | **TC-ACTD-009** | SEO meta tags present in page source | None | og:title, og:description, canonical, hreflang | |
| - [ ] | **TC-ACTD-010** | Breadcrumb schema in JSON-LD | None | Valid structured data | |

### 3.4 Static Pages

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-PAGE-001** | About Us page loads (`/[lang]/about-us`) | None | Hero, story, values, team sections | |
| - [ ] | **TC-PAGE-002** | FAQ page loads (`/[lang]/faq`) | None | FAQ accordion works | |
| - [ ] | **TC-PAGE-003** | Privacy page loads (`/[lang]/privacy`) | None | Content renders | |
| - [ ] | **TC-PAGE-004** | Terms page loads (`/[lang]/terms`) | None | Content renders | |

### 3.5 User Profile (`/[lang]/profile`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-PROF-001** | Profile page loads | Logged in | Name, email, phone, creation date | |
| - [ ] | **TC-PROF-002** | Recent bookings section shows 3 most recent | Logged in, has bookings | Booking cards displayed | |
| - [ ] | **TC-PROF-003** | "View All Bookings" navigates to bookings list | Logged in | Navigates correctly | |
| - [ ] | **TC-PROF-004** | Toggle email notification preference | Logged in | Preference saved | |
| - [ ] | **TC-PROF-005** | Toggle SMS notification preference | Logged in | Preference saved | |
| - [ ] | **TC-PROF-006** | Set quiet hours | Logged in | Start/end times saved | |
| - [ ] | **TC-PROF-007** | Profile redirects to sign-in if guest | Guest | Redirect works | |

### 3.6 My Bookings (`/[lang]/bookings`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-MYBK-001** | List user bookings (10/page) | Logged in | Booking cards with status, payment badges | |
| - [ ] | **TC-MYBK-002** | Filter by status: Confirmed | Logged in | Only confirmed shown | |
| - [ ] | **TC-MYBK-003** | Filter by status: Pending | Logged in | Only pending shown | |
| - [ ] | **TC-MYBK-004** | Filter by status: Cancelled | Logged in | Only cancelled shown | |
| - [ ] | **TC-MYBK-005** | View booking detail → confirmation page | Logged in | Navigates to `/bookings/[id]/confirmation` | |
| - [ ] | **TC-MYBK-006** | Cancel booking with confirmation | Logged in, pending booking | Status changes to cancelled | |
| - [ ] | **TC-MYBK-007** | Paginate bookings | Logged in, >10 bookings | Pagination works | |
| - [ ] | **TC-MYBK-008** | Empty state when no bookings | Logged in, new user | "No bookings" message + CTA | |

---

## 4. Booking Flow

### 4.1 Booking Form (`/[lang]/booking/[slug]`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-BOOK-001** | Booking form loads with selected activity | Logged in | Activity + package displayed | |
| - [ ] | **TC-BOOK-002** | Calendar widget for date selection | Logged in | Calendar opens, dates selectable | |
| - [ ] | **TC-BOOK-003** | Select future date | Logged in | Date accepted | |
| - [ ] | **TC-BOOK-004** | Attempt past date | Logged in | Date rejected or disabled | |
| - [ ] | **TC-BOOK-005** | Set number of people (min 1) | Logged in | Value accepted | |
| - [ ] | **TC-BOOK-006** | Fill guest info: name, email, phone | Logged in | Fields accept input | |
| - [ ] | **TC-BOOK-007** | Email validation on guest email | Logged in | Invalid email shows error | |
| - [ ] | **TC-BOOK-008** | Submit with missing required fields | Logged in | Validation errors shown | |
| - [ ] | **TC-BOOK-009** | Submit booking successfully | Logged in, all fields filled | Redirected to confirmation page | |
| - [ ] | **TC-BOOK-010** | Add special requests | Logged in | Text saved with booking | |
| - [ ] | **TC-BOOK-011** | Display currency in selected currency | Logged in, EUR selected | Prices in EUR | |

### 4.2 Dynamic Booking Types

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-BTYP-001** | Standard booking: shows date + people + guest fields | Standard activity | All expected fields present | |
| - [ ] | **TC-BTYP-002** | Accommodation: check-in/check-out dates (no booking_date) | Accommodation activity | Date pair shown, no single date | |
| - [ ] | **TC-BTYP-003** | Digital product: email/phone only (no dates/people) | Digital product activity | Minimal fields shown | |
| - [ ] | **TC-BTYP-004** | Transfer: pickup/dropoff locations, time, luggage | Transfer activity | Custom fields visible | |
| - [ ] | **TC-BTYP-005** | Tour: conditional hotel_name when pickup_required=true | Tour activity | Hotel field shows/hides dynamically | |
| - [ ] | **TC-BTYP-006** | Rental: duration + return date fields | Rental activity | Custom fields visible | |

### 4.3 Booking Confirmation (`/[lang]/bookings/[id]/confirmation`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-CONF-001** | Confirmed booking shows green checkmark | Booking confirmed | "Booking Confirmed!" message | |
| - [ ] | **TC-CONF-002** | Pending booking shows amber clock | Booking pending vendor | "Booking Submitted!" message | |
| - [ ] | **TC-CONF-003** | Rejected booking shows red X | Booking rejected | "Booking Not Available" message | |
| - [ ] | **TC-CONF-004** | "Pay Now" button visible when confirmed & unpaid | Confirmed, unpaid | Button navigates to payment | |
| - [ ] | **TC-CONF-005** | Payment details shown when paid | Paid booking | Payment info displayed | |
| - [ ] | **TC-CONF-006** | Booking summary correct (activity, date, people, price) | Any booking | All details match | |

---

## 5. Payment Flow — BML Gateway

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-BPAY-001** | Payment page loads with booking summary | Confirmed booking, unpaid | Amount, security badge shown | |
| - [ ] | **TC-BPAY-002** | Click "Complete Payment" → redirect to BML | Confirmed booking | Browser navigates to BML gateway | |
| - [ ] | **TC-BPAY-003** | Successful payment → callback with CONFIRMED | Complete BML flow | Green checkmark, "Payment Successful!" | |
| - [ ] | **TC-BPAY-004** | Failed payment → callback with DECLINED | Decline at BML | Red X, "Payment Failed" | |
| - [ ] | **TC-BPAY-005** | Cancelled payment → callback with CANCELLED | Cancel at BML | Error message with retry option | |
| - [ ] | **TC-BPAY-006** | Auto-redirect to confirmation after 5 seconds | Successful payment | Countdown + redirect | |
| - [ ] | **TC-BPAY-007** | Already-paid booking redirects from payment page | Paid booking | Redirected to confirmation | |
| - [ ] | **TC-BPAY-008** | Non-confirmed booking cannot access payment page | Pending booking | Error or redirect | |
| - [ ] | **TC-BPAY-009** | BML webhook updates payment status | Backend receives webhook | Booking payment_status updates | |
| - [ ] | **TC-BPAY-010** | Payment with missing transactionId in callback | Error scenario | Graceful error handling | |

---

## 6. IMUGA Immigration Form

### 6.1 Public IMUGA Submission (`/[lang]/imuga`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-IMUG-001** | IMUGA form loads | None (public) | Multi-step form visible | |
| - [ ] | **TC-IMUG-002** | Fill requester info (name, email, phone) | None | Fields accept input | |
| - [ ] | **TC-IMUG-003** | Fill group info (name) | None | Field saved | |
| - [ ] | **TC-IMUG-004** | Fill accommodation (name, island, atoll) | None | Fields saved | |
| - [ ] | **TC-IMUG-005** | Fill travel dates (arrival, departure, flight) | None | Dates accepted | |
| - [ ] | **TC-IMUG-006** | Add traveler with all required fields | None | Traveler added to list | |
| - [ ] | **TC-IMUG-007** | Add multiple travelers (3+) | None | All travelers listed | |
| - [ ] | **TC-IMUG-008** | Upload passport image | None | Image uploaded and previewed | |
| - [ ] | **TC-IMUG-009** | AI passport extractor auto-fills fields | Upload passport image | Name, passport #, DOB, nationality populated | |
| - [ ] | **TC-IMUG-010** | Draft auto-saves to localStorage | Fill partial form | "Load Draft" option on return | |
| - [ ] | **TC-IMUG-011** | Load draft from localStorage | Previous partial submission | Form populated from draft | |
| - [ ] | **TC-IMUG-012** | Submit form → success with request number | Complete form | REQ-YYYY-NNNNN displayed | |
| - [ ] | **TC-IMUG-013** | Submit with missing required fields | Incomplete form | Validation errors shown | |
| - [ ] | **TC-IMUG-014** | Country selector with search | None | Searchable dropdown works | |
| - [ ] | **TC-IMUG-015** | Phone country code selector | None | Code prefix selectable | |

### 6.2 IMUGA Status Check (`/[lang]/imuga/[requestNumber]`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-IMST-001** | Check pending request status | Valid request # | "Pending" badge, request details | |
| - [ ] | **TC-IMST-002** | Check completed request | Approved request | "Completed" badge, traveler table | |
| - [ ] | **TC-IMST-003** | Check rejected request | Rejected request | "Rejected" badge with reason | |
| - [ ] | **TC-IMST-004** | Invalid request number | Bad request # | Error message | |

---

## 7. Support & Tickets

### 7.1 Support Hub (`/[lang]/support`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-SUP-001** | Support hub loads (guest view) | Guest | FAQ search, "Contact Support", "Track Ticket" | |
| - [ ] | **TC-SUP-002** | Support hub loads (logged-in view) | Logged in | "View My Tickets", "Create New Ticket" | |
| - [ ] | **TC-SUP-003** | Search FAQs | None | Results filter in real-time | |
| - [ ] | **TC-SUP-004** | Filter FAQs by category | None | Filtered results | |
| - [ ] | **TC-SUP-005** | Expand/collapse FAQ accordion | None | Smooth toggle | |

### 7.2 Guest Ticket (`/[lang]/support/new`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-GTKT-001** | Guest ticket form loads | None (public) | Name, email, subject, description, category | |
| - [ ] | **TC-GTKT-002** | Submit guest ticket | Fill all fields | Success page with ticket number | |
| - [ ] | **TC-GTKT-003** | Submit with invalid email | None | Validation error | |
| - [ ] | **TC-GTKT-004** | Submit with missing required fields | None | Validation errors | |

### 7.3 User Tickets (`/[lang]/support/tickets`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-UTKT-001** | List user tickets | Logged in | Tickets with #, status, category | |
| - [ ] | **TC-UTKT-002** | Create new ticket | Logged in | Subject, description, category | |
| - [ ] | **TC-UTKT-003** | View ticket detail with message thread | Logged in | Messages displayed chronologically | |
| - [ ] | **TC-UTKT-004** | Reply to ticket | Logged in | Message added to thread | |
| - [ ] | **TC-UTKT-005** | Filter tickets by status | Logged in | Filtered results | |

---

## 8. Vendor Portal

### 8.1 Vendor Dashboard (`/vendor`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VDSH-001** | Vendor dashboard loads | Vendor signed in | Profile card, stats, quick links | |
| - [ ] | **TC-VDSH-002** | Stats show activity/booking/revenue counts | Vendor | Accurate numbers | |

### 8.2 Vendor Activities (`/vendor/activities`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VACT-001** | List vendor activities | Vendor | Activities with status, category, price | |
| - [ ] | **TC-VACT-002** | Create new activity | Vendor | Form loads, submission succeeds | |
| - [ ] | **TC-VACT-003** | Edit activity | Vendor | Changes saved | |
| - [ ] | **TC-VACT-004** | Toggle published/draft status | Vendor | Status updates | |
| - [ ] | **TC-VACT-005** | Delete activity | Vendor | Removed with confirmation | |
| - [ ] | **TC-VACT-006** | Manage packages | Vendor | Add/edit/delete packages | |
| - [ ] | **TC-VACT-007** | Search activities | Vendor | Filtered results | |

### 8.3 Vendor Bookings (`/vendor/bookings`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VBKG-001** | List vendor bookings | Vendor | Bookings with guest, status, payment | |
| - [ ] | **TC-VBKG-002** | Filter by booking status | Vendor | Filtered results | |
| - [ ] | **TC-VBKG-003** | Filter by payment status | Vendor | Filtered results | |
| - [ ] | **TC-VBKG-004** | Filter by date range | Vendor | Filtered results | |
| - [ ] | **TC-VBKG-005** | Confirm pending booking | Vendor | Status → confirmed | |
| - [ ] | **TC-VBKG-006** | Reject pending booking | Vendor | Status → rejected | |
| - [ ] | **TC-VBKG-007** | Create manual booking | Vendor | Booking created | |
| - [ ] | **TC-VBKG-008** | View booking calendar | Vendor | Calendar view loads | |

### 8.4 Vendor Financial (`/vendor/quotations`, `/vendor/invoices`, `/vendor/payments`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VFIN-001** | List quotations | Vendor | Quotations with status, customer, total | |
| - [ ] | **TC-VFIN-002** | Create quotation | Vendor | Form with items, customer, dates | |
| - [ ] | **TC-VFIN-003** | Send quotation | Vendor, draft quotation | Status → sent | |
| - [ ] | **TC-VFIN-004** | Convert accepted quotation to booking | Vendor, accepted | Booking created | |
| - [ ] | **TC-VFIN-005** | List invoices | Vendor | Invoices with status, amounts | |
| - [ ] | **TC-VFIN-006** | Create invoice | Vendor | Form with line items | |
| - [ ] | **TC-VFIN-007** | Send invoice | Vendor, draft invoice | Status → sent | |
| - [ ] | **TC-VFIN-008** | Record payment against invoice | Vendor, pending invoice | Amount recorded | |
| - [ ] | **TC-VFIN-009** | Void invoice | Vendor | Status → void with reason | |
| - [ ] | **TC-VFIN-010** | List payments | Vendor | Payments with method, amount, status | |
| - [ ] | **TC-VFIN-011** | Record new payment | Vendor | Payment created | |
| - [ ] | **TC-VFIN-012** | Process refund | Vendor | Refund workflow: pending → approved → completed | |
| - [ ] | **TC-VFIN-013** | Manage discounts | Vendor | Create/edit/pause/expire discounts | |

### 8.5 Vendor Resources & Guests

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VRES-001** | List resources | Vendor | Resources with type, status, capacity | |
| - [ ] | **TC-VRES-002** | Create resource (room/vehicle/boat/equipment) | Vendor | Resource created | |
| - [ ] | **TC-VRES-003** | Set resource availability | Vendor | Calendar availability set | |
| - [ ] | **TC-VRES-004** | List guests | Vendor | Guests with name, contact, loyalty | |
| - [ ] | **TC-VRES-005** | Create guest | Vendor | Guest created | |
| - [ ] | **TC-VRES-006** | View guest history | Vendor | Booking history shown | |

### 8.6 Vendor Reports (`/vendor/reports`)

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VRPT-001** | Revenue report loads | Vendor | Summary, trends, by-source breakdown | |
| - [ ] | **TC-VRPT-002** | Occupancy report loads | Vendor | Occupancy rates, by-resource | |
| - [ ] | **TC-VRPT-003** | Payment report loads | Vendor | By-method breakdown, recent payments | |
| - [ ] | **TC-VRPT-004** | Tax report loads | Vendor | By-tax-type, invoice details | |
| - [ ] | **TC-VRPT-005** | Date range filter works | Vendor | Reports refresh for selected range | |

### 8.7 Vendor Settings

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-VSET-001** | Billing settings page | Vendor | Invoice prefix, numbering, payment terms | |
| - [ ] | **TC-VSET-002** | Update billing settings | Vendor | Changes saved | |
| - [ ] | **TC-VSET-003** | Payment methods page | Vendor | List/add/edit payment methods | |
| - [ ] | **TC-VSET-004** | Tax settings page | Vendor | Configure vendor tax rates | |

---

## 9. Multi-Language & Currency

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-I18N-001** | Switch language en-US → it-IT | Any page | URL updates, content translates | |
| - [ ] | **TC-I18N-002** | Switch language it-IT → en-US | Italian page | URL updates, English content | |
| - [ ] | **TC-I18N-003** | Activity translations display correctly | Activity with translations | Translated title/description | |
| - [ ] | **TC-I18N-004** | Fallback to slug when no translation | Activity without translation | Slug displayed as title | |
| - [ ] | **TC-I18N-005** | FAQ translations display correctly | FAQ with both languages | Correct language shown | |
| - [ ] | **TC-CUR-001** | Switch currency to EUR | Any page with prices | Prices converted to EUR | |
| - [ ] | **TC-CUR-002** | Switch currency to MVR | Any page with prices | Prices converted to MVR (Rf symbol) | |
| - [ ] | **TC-CUR-003** | Switch currency to JPY | Any page with prices | Prices converted to JPY (¥ symbol) | |
| - [ ] | **TC-CUR-004** | Currency persists across page navigation | Select EUR, navigate | EUR still selected | |
| - [ ] | **TC-CUR-005** | Currency persists after page refresh | Select EUR, refresh | EUR restored from localStorage | |
| - [ ] | **TC-CUR-006** | Unknown currency falls back to USD | Edge case | $ format displayed | |
| - [ ] | **TC-CUR-007** | Price shows "Price unavailable" for null/undefined | Missing price data | Graceful fallback | |

---

## 10. Notifications

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-NOTIF-001** | Notification bell shows unread count | Logged in, has unread | Badge with count | |
| - [ ] | **TC-NOTIF-002** | Notification dropdown shows recent items | Logged in | Preview list | |
| - [ ] | **TC-NOTIF-003** | Notifications page loads with full list | Logged in | All notifications, filters | |
| - [ ] | **TC-NOTIF-004** | Filter by type (Bookings, Payments, etc.) | Logged in | Filtered results | |
| - [ ] | **TC-NOTIF-005** | Filter by Unread | Logged in | Only unread shown | |
| - [ ] | **TC-NOTIF-006** | Click notification marks as read | Logged in | Unread count decreases | |
| - [ ] | **TC-NOTIF-007** | Notification with action_url navigates | Logged in | Clicks through to URL | |
| - [ ] | **TC-NOTIF-008** | Empty state when no notifications | New user | "No notifications" message | |
| - [ ] | **TC-NOTIF-009** | Real-time notification via WebSocket | Logged in, admin sends notification | Notification appears without refresh | |

---

## 11. Responsive & Mobile

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-MOB-001** | Homepage renders on mobile (320px) | Mobile viewport | No horizontal scroll, content stacks | |
| - [ ] | **TC-MOB-002** | Mobile navigation menu toggles | Mobile viewport | Hamburger menu opens/closes | |
| - [ ] | **TC-MOB-003** | Activity grid → single column on mobile | Mobile viewport | Cards stack vertically | |
| - [ ] | **TC-MOB-004** | Booking form usable on mobile | Mobile viewport | All fields accessible, keyboard works | |
| - [ ] | **TC-MOB-005** | Tables scroll horizontally on mobile | Mobile viewport | Data tables scrollable | |
| - [ ] | **TC-MOB-006** | Modals/dialogs work on mobile | Mobile viewport | Modal content visible, scrollable | |
| - [ ] | **TC-MOB-007** | Tablet layout (768px) | Tablet viewport | 2-column layouts work | |
| - [ ] | **TC-MOB-008** | Touch interactions (no hover states) | Touch device | All actions accessible | |

---

## 12. Edge Cases & Error Handling

| # | Test Case | Precondition | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| - [ ] | **TC-ERR-001** | Navigate to non-existent route | None | 404 page displayed | |
| - [ ] | **TC-ERR-002** | API server down during page load | API offline | Error state shown, not blank page | |
| - [ ] | **TC-ERR-003** | Submit form during network failure | None | Error message, data not lost | |
| - [ ] | **TC-ERR-004** | Double-click form submit button | None | Only one submission processed | |
| - [ ] | **TC-ERR-005** | Browser back button during booking flow | Mid-booking | Form state preserved or graceful handling | |
| - [ ] | **TC-ERR-006** | Session timeout during long form fill | Booking/IMUGA form | Redirect to sign-in, form state recoverable | |
| - [ ] | **TC-ERR-007** | Activity with no packages (booking disabled) | Edge case | No "Book Now" button, informational message | |
| - [ ] | **TC-ERR-008** | Activity with no images | Edge case | Fallback image/placeholder shown | |
| - [ ] | **TC-ERR-009** | Very long activity title/description | Edge case | Text truncated, no layout break | |
| - [ ] | **TC-ERR-010** | Special characters in search queries | Admin lists | No XSS, results filtered correctly | |
| - [ ] | **TC-ERR-011** | Empty list states on all list pages | No data | "No items found" message on each | |
| - [ ] | **TC-ERR-012** | Pagination with page=0 or negative | URL manipulation | Defaults to page 1 | |
| - [ ] | **TC-ERR-013** | Large file upload (>10MB image) | Media upload | "File too large" error | |
| - [ ] | **TC-ERR-014** | Invalid file type upload | Media upload | "Unsupported file type" error | |
| - [ ] | **TC-ERR-015** | Concurrent booking for same slot | Two users | One succeeds, other gets error | |
| - [ ] | **TC-ERR-016** | Stale data after admin changes | User viewing while admin edits | Refresh shows updated data | |
| - [ ] | **TC-ERR-017** | Multiple currency switches rapid-fire | None | No race conditions, final currency applied | |

---

## Test Execution Notes

### Environment Setup
- **Dev server:** `npm run dev` → `http://localhost:5173`
- **API backend:** `http://localhost:8080`
- **Test accounts needed:** Admin user, Regular user, Vendor user, Guest (no account)

### Test Data Requirements
- At least 5 activities (various types: standard, accommodation, tour, transfer, rental, digital_product)
- At least 3 bookings (pending, confirmed, completed)
- At least 2 vendors (one verified, one pending)
- At least 5 FAQs (both languages)
- At least 1 IMUGA request (pending)
- At least 3 support tickets (various statuses)

### Browser Matrix
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Chrome (Pixel 5 emulation)
- Mobile Safari (iPhone 12 emulation)
