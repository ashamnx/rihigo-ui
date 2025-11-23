# Booking System Authentication

## Overview

The booking system requires users to be authenticated before they can create booking requests. This document explains how authentication is implemented and enforced.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User navigates to booking page                          │
│     /en-US/booking/sunset-fishing-tour?package=xyz          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Server-Side Authentication Check                        │
│     (routeLoader$ in index.tsx)                             │
├─────────────────────────────────────────────────────────────┤
│  - Checks session from requestEvent.sharedMap               │
│  - If NOT authenticated:                                    │
│    → Redirects to login with callbackUrl                    │
│  - If authenticated:                                        │
│    → Loads activity data and renders form                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. User fills booking form                                 │
│     - Dynamic fields based on activity type                 │
│     - Auto-filled: name, email from session                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User submits booking                                    │
│     - Form data sent to routeAction$ (useCreateBooking)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Backend Authentication Check                            │
│     (routeAction$ in index.tsx)                             │
├─────────────────────────────────────────────────────────────┤
│  - Re-validates session exists                              │
│  - Extracts accessToken from session.user.accessToken       │
│  - If NOT authenticated:                                    │
│    → Returns error: "You must be logged in"                 │
│  - If authenticated:                                        │
│    → Continues to API call                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. API Request to Backend                                  │
│     POST /api/bookings                                      │
├─────────────────────────────────────────────────────────────┤
│  Headers:                                                   │
│    - Authorization: Bearer <accessToken>                    │
│    - Content-Type: application/json                         │
│                                                             │
│  Body: { activity_id, package_id, customer_info, ... }     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Backend Validates Token                                 │
│     (API middleware: auth.go)                               │
├─────────────────────────────────────────────────────────────┤
│  - Validates JWT token                                      │
│  - Extracts user ID and email from token claims             │
│  - If invalid:                                              │
│    → Returns 401 Unauthorized                               │
│  - If valid:                                                │
│    → Creates booking in database                            │
│    → Returns booking confirmation                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Success Response                                        │
│     - Redirects to: /bookings/{id}/confirmation             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Server-Side Page Access Control

**File:** `ui/src/routes/(website)/[...lang]/booking/[slug]/index.tsx`

```typescript
export const useActivityData = routeLoader$(async (requestEvent) => {
    const session = requestEvent.sharedMap.get('session');

    // Server-side authentication check
    if (!session || !session.user) {
        const callbackUrl = encodeURIComponent(
            requestEvent.url.pathname + requestEvent.url.search
        );
        throw requestEvent.redirect(
            302,
            `/${lang}/auth/sign-in?callbackUrl=${callbackUrl}`
        );
    }

    // ... load activity data
});
```

**Benefits:**
- ✅ Works on server-side (SSR)
- ✅ Works with disabled JavaScript
- ✅ Preserves the original URL as callbackUrl
- ✅ Fast redirect (302)
- ✅ No flash of unauthenticated content

### 2. Booking Creation Authentication

**File:** `ui/src/routes/(website)/[...lang]/booking/[slug]/index.tsx`

```typescript
export const useCreateBooking = routeAction$(async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get('session');

    // Validate authentication
    if (!session || !session.user) {
        return {
            success: false,
            error: 'You must be logged in to book an activity'
        };
    }

    // Extract access token
    const token = session.user.accessToken || '';

    // Call API with Bearer token
    const booking = await createBooking({
        activity_id: data.activity_id,
        package_id: data.package_id,
        // ... other fields
    }, token);

    return { success: true, data: booking };
});
```

**Security Features:**
- ✅ Double-checks authentication before API call
- ✅ Prevents unauthorized booking attempts
- ✅ Returns clear error message
- ✅ Extracts and validates access token

### 3. API Request with Bearer Token

**File:** `ui/src/services/booking-api.ts`

```typescript
export async function createBooking(
    input: CreateBookingInput,
    token: string
): Promise<Booking> {
    const response = await fetchAPI<Booking>('/api/bookings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });
    return response.data;
}
```

**Security:**
- ✅ Sends JWT token in Authorization header
- ✅ Uses standard Bearer token format
- ✅ Backend can validate token independently
- ✅ Stateless authentication

### 4. Form Auto-Fill from Session

**File:** `ui/src/routes/(website)/[...lang]/booking/[slug]/index.tsx`

```typescript
// Initialize form values with defaults
if (session.value?.user) {
    formValues.full_name = formValues.full_name || session.value.user.name || '';
    formValues.email = formValues.email || session.value.user.email || '';
}
```

**User Experience:**
- ✅ Pre-fills name and email from user profile
- ✅ Reduces form friction
- ✅ Ensures consistent customer information
- ✅ User can still override if needed

## Backend Authentication (Go API)

### JWT Token Validation Middleware

**File:** `api/internal/middleware/auth.go`

The backend validates the JWT token on every booking request:

1. **Extract Token** from `Authorization: Bearer <token>` header
2. **Verify Signature** using AUTH_SECRET
3. **Check Expiration** - reject if expired
4. **Extract Claims** - get user ID and email
5. **Inject into Context** - make user info available to handlers
6. **Return 401** if any validation fails

### Protected Booking Endpoints

```go
// api/internal/handlers/booking.go

func CreateBooking(w http.ResponseWriter, r *http.Request) {
    // Get user from context (set by auth middleware)
    userID := r.Context().Value("user_id").(string)
    userEmail := r.Context().Value("user_email").(string)

    // Create booking with authenticated user's ID
    booking := &models.Booking{
        UserID: userID,
        // ... other fields
    }

    // Save to database
}
```

## Security Considerations

### ✅ What's Protected

1. **Page Access** - Unauthenticated users cannot view booking page
2. **Form Submission** - Server validates session before processing
3. **API Calls** - Backend validates JWT token independently
4. **User Association** - Bookings are linked to authenticated user ID
5. **Token Expiration** - JWT tokens have expiration time
6. **Server-Side Validation** - No client-side only checks

### ⚠️ Important Notes

1. **Token Storage**: Access tokens are stored in the session (managed by Auth.js)
2. **HTTPS Required**: In production, always use HTTPS to protect tokens in transit
3. **Token Refresh**: Auth.js handles token refresh automatically
4. **Session Timeout**: Users need to re-authenticate when session expires
5. **CSRF Protection**: Qwik City forms have built-in CSRF protection

## Testing Authentication

### Test Scenario 1: Unauthenticated Access

```bash
# Navigate to booking page without login
curl -I http://localhost:5176/en-US/booking/sunset-fishing-tour

# Expected: 302 Redirect to /en-US/auth/sign-in?callbackUrl=...
```

### Test Scenario 2: Authenticated Booking

```bash
# 1. Login and get session cookie
# 2. Navigate to booking page
curl -b cookies.txt http://localhost:5176/en-US/booking/sunset-fishing-tour

# Expected: 200 OK with booking form
```

### Test Scenario 3: API Call Without Token

```bash
# Try to create booking without token
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"activity_id":"xyz","customer_info":{}}'

# Expected: 401 Unauthorized
```

### Test Scenario 4: API Call With Valid Token

```bash
# Create booking with valid JWT token
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-jwt-token>" \
  -d '{"activity_id":"xyz","customer_info":{"full_name":"John Doe"}}'

# Expected: 201 Created with booking data
```

## Error Handling

### Frontend Error Messages

```typescript
// User not logged in (shouldn't happen due to redirect)
{
    success: false,
    error: 'You must be logged in to book an activity'
}

// Token expired or invalid
{
    success: false,
    error: 'Failed to create booking'  // Generic error from API
}

// Network or API error
{
    success: false,
    error: 'Failed to create booking'
}
```

### Backend Error Responses

```json
// 401 Unauthorized - No token or invalid token
{
    "error": "Unauthorized",
    "message": "Invalid or expired token"
}

// 403 Forbidden - Valid token but insufficient permissions
{
    "error": "Forbidden",
    "message": "You don't have permission to access this resource"
}

// 422 Unprocessable Entity - Invalid booking data
{
    "error": "Validation failed",
    "message": "Invalid activity_id"
}
```

## User Flow Examples

### Happy Path

1. User clicks "Book Now" on activity page
2. Redirected to `/booking/activity-slug?package=xyz`
3. System checks: User is logged in ✅
4. Booking form displayed with pre-filled name/email
5. User fills additional fields (date, people, etc.)
6. User clicks "Confirm Booking"
7. System validates session ✅
8. System calls API with Bearer token
9. Backend validates token ✅
10. Booking created successfully
11. User redirected to confirmation page

### Login Required Path

1. User clicks "Book Now" (not logged in)
2. Redirected to `/auth/sign-in?callbackUrl=/booking/activity-slug%3Fpackage%3Dxyz`
3. User logs in with Google/Facebook/Email
4. Auth.js redirects back to `/booking/activity-slug?package=xyz`
5. Booking form displayed
6. Continue from step 5 in Happy Path

### Session Expired Path

1. User starts filling booking form
2. Session expires (after 30 days)
3. User clicks "Confirm Booking"
4. Backend returns 401 Unauthorized
5. Frontend shows error: "Your session has expired. Please log in again."
6. User clicks login link
7. User logs in
8. Redirected back to booking page
9. User re-fills form and submits successfully

## Summary

The booking system has **multi-layer authentication**:

1. **🔒 Server-Side Page Protection** - Redirect before page loads
2. **🔒 Server-Side Form Validation** - Check session before API call
3. **🔒 API Token Validation** - Backend validates JWT independently
4. **🔒 User Association** - Bookings linked to authenticated user

This ensures that **only authenticated users can create bookings**, and all booking requests are properly authenticated and authorized.
