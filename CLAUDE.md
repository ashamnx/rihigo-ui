# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Qwik City** application for the Rihigo tourism booking platform, providing a high-performance, resumable web application for booking tours, activities, accommodations, and transfers in the Maldives. The UI communicates with a Go backend API.

## Technology Stack

- **Framework**: Qwik 1.17.2 with QwikCity (file-based routing)
- **Build Tool**: Vite 7.2.2
- **Styling**: Tailwind CSS 4.1.17 + DaisyUI 5.5.5
- **Authentication**: Auth.js (@auth/qwik 0.9.1) with Google OAuth
- **Internationalization**: qwik-speak (supports en-US, it-IT)
- **Forms**: @modular-forms/qwik 0.29.1
- **Testing**: Playwright (E2E), Vitest (unit tests)
- **TypeScript**: 5.4.5 with strict mode enabled

## Development Commands

### Development Server
```bash
npm run dev          # Start dev server with SSR on http://localhost:5173
npm start            # Alias for dev with --open flag
npm run dev.debug    # Start with Node debugger attached
```

### Build & Preview
```bash
npm run build        # Production build (client + server)
npm run build.client # Build client modules only
npm run build.types  # Type check without emitting files
npm preview          # Preview production build locally
```

### Code Quality
```bash
npm run lint         # ESLint check on src/**/*.ts*
npm run fmt          # Format code with Prettier
npm run fmt.check    # Check formatting without modifying
```

### Testing
```bash
# Unit Tests (Vitest)
npm run test.unit       # Run component tests
npm run test.unit.ui    # Run with Vitest UI

# E2E Tests (Playwright)
npm run test.e2e            # Run all E2E tests
npm run test.e2e:headed     # Run with browser visible
npm run test.e2e:ui         # Run with Playwright UI
npm run test.e2e:debug      # Run in debug mode
npm run test.e2e:report     # Show test report
```

### Internationalization
```bash
npm run qwik-speak-extract  # Extract translation strings to i18n/
```

## Architecture

### Directory Structure

```
src/
├── routes/                    # File-based routing (QwikCity)
│   ├── (website)/            # Public website routes
│   │   └── [lang]/        # Language-prefixed routes (en-US, it-IT)
│   │       ├── activities/   # Activity listing & detail pages
│   │       ├── booking/      # Booking flow (requires auth)
│   │       └── bookings/     # Booking management & confirmation
│   ├── admin/                # Admin panel (requires auth + admin role)
│   ├── auth/                 # Authentication pages (login, signup)
│   ├── plugin@auth.ts        # Auth.js configuration
│   └── plugin@speak.ts       # i18n configuration
├── components/
│   ├── page-builder/         # Dynamic activity page components
│   ├── booking/              # Booking form components
│   └── admin/                # Admin panel components
├── services/                 # API client services
├── utils/                    # Utility functions
│   ├── api-client.ts         # Centralized API client
│   └── auth.ts               # Auth helpers
├── types/                    # TypeScript type definitions
└── i18n/                     # Translation files (en-US, it-IT)
```

### Routing Convention

QwikCity uses file-based routing:
- `index.tsx` = page component
- `layout.tsx` = layout wrapper for nested routes
- `plugin@*.ts` = global middleware/plugins
- `(folder)/` = route grouping (doesn't affect URL)
- `[param]/` = dynamic route segment
- `[...param]/` = catch-all route segment

### Authentication Flow

**Multi-layer authentication** implemented using Auth.js:

1. **Server-Side Page Protection**: `routeLoader$` checks session before rendering
2. **API Token Validation**: Backend validates JWT tokens independently
3. **Token Storage**: Access tokens stored in session via Auth.js
4. **Auto-refresh**: JWT tokens refresh automatically on expiration

Example authentication check:
```typescript
export const useData = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session');
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(302, `/auth/sign-in?callbackUrl=${callbackUrl}`);
  }
  // ... authenticated logic
});
```

See `BOOKING_AUTHENTICATION.md` for complete authentication documentation.

### API Communication

**Backend API**: Go API running on `http://localhost:8080` (configurable via `API_URL` env var)

**Client Pattern**:
- Use `apiClient` from `~/utils/api-client.ts` for all API calls
- API methods handle Bearer token authentication automatically
- Use `authenticatedRequest()` helper in route loaders/actions

Example:
```typescript
import { apiClient } from '~/utils/api-client';

export const useActivities = routeLoader$(async (requestEvent) => {
  const token = await getAuthToken(requestEvent);
  return await apiClient.activities.list(1, 20);
});
```

### Dynamic Booking System

The booking system supports **dynamic form fields** based on activity type:

**Booking Types**:
- `standard` - Traditional tours/activities
- `digital_product` - eSIM, tickets, vouchers
- `accommodation` - Hotels, resorts
- `transfer` - Transportation services
- `tour` - Guided tours with pickup
- `rental` - Equipment/vehicle rental

Each activity has:
- `booking_type`: Determines which preset form to use
- `booking_field_config`: Custom fields and validation rules

See `src/routes/(website)/[lang]/booking/[slug]/IMPLEMENTATION_GUIDE.md` for detailed documentation.

### Page Builder System

Activities use a **component-based page builder** system located in `src/components/page-builder/`:

**Available Components**:
- `ActivityHeroComponent` - Hero section with images
- `OverviewComponent` - Activity overview and description
- `HighlightsComponent` - Key highlights
- `ItineraryComponent` - Day-by-day itinerary
- `InclusionsComponent` - What's included/excluded
- `PricingComponent` - Package pricing
- `FAQComponent` - Frequently asked questions
- `GalleryComponent` - Photo gallery

Components are rendered dynamically via `PageRenderer.tsx` based on activity layout configuration stored in the database.

### Internationalization (i18n)

**Configuration**: `src/i18n/config.ts`
**Supported Languages**:
- `en-US` (default) - English (USD, America/Los_Angeles)
- `it-IT` - Italian (EUR, Europe/Rome)

**Translation Assets**:
- `app` - Global UI strings
- `auth` - Authentication pages
- `home` - Homepage
- `profile` - User profile

Routes are language-prefixed: `/en-US/activities`, `/it-IT/activities`

Use `inlineTranslate()` for translations in components.

### State Management

Qwik uses **signals** for reactive state:
- `useSignal()` - Reactive primitive values
- `useStore()` - Reactive objects
- `useResource$()` - Async data loading
- `routeLoader$()` - SSR data loading
- `routeAction$()` - Form actions

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
```typescript
"paths": {
  "~/*": ["./src/*"]
}
```

Always use `~/` prefix for imports: `import { apiClient } from '~/utils/api-client'`

## Environment Variables

Required variables (see `.env.example`):
```bash
# API Backend
API_URL=http://localhost:8080

# Auth.js
AUTH_SECRET=<secret>
AUTH_GOOGLE_ID=<google-oauth-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-secret>
```

## Important Conventions

### ESLint Configuration

- TypeScript strict mode enabled
- Unused imports marked as errors (`@typescript-eslint/no-unused-vars`)
- Type imports enforced (`@typescript-eslint/consistent-type-imports`)
- Console logs allowed (useful for debugging)

### Qwik-Specific Patterns

1. **Use `$` suffix** for functions that need optimization boundaries (lazy loading)
2. **Server functions** (`routeLoader$`, `routeAction$`) run only on server
3. **Component functions** start with capital letter and use `component$`
4. **No `useEffect`** - Use `useVisibleTask$()` or `useTask$()` instead

### Admin Panel Access

Admin routes (`/admin/*`) require authentication. Admin panel includes:
- Activity management (CRUD, packages, page builder)
- Booking management
- Category/FAQ management
- User management
- Tax configuration

## Common Gotchas

1. **SSR Context**: Remember that code runs both server and client. Use `isServer` checks when needed.
2. **Auth Token**: Always extract token from session in `routeAction$`, not from client state
3. **Dynamic Routes**: Language param `[lang]` is a catch-all, handle it correctly in loaders
4. **API Errors**: Backend returns `{ success: boolean, error_message?: string }` format
5. **Qwik Optimizer**: Don't destructure props in component functions - breaks reactivity

## Testing Guidelines

### Unit Tests
- Located in `tests/` directory
- Run with `npm run test.unit`
- Test component rendering and logic in isolation

### E2E Tests
- Located in `tests/` directory
- Configured in `playwright.config.ts`
- Test full user flows including authentication

## Related Documentation

- **Authentication**: See `BOOKING_AUTHENTICATION.md`
- **Booking System**: See `src/routes/(website)/[lang]/booking/[slug]/IMPLEMENTATION_GUIDE.md`
- **Qwik Docs**: https://qwik.dev/
- **QwikCity Routing**: https://qwik.dev/qwikcity/routing/overview/
- Always use Modular Forms for forms
- Always add head to new pages
- dont use import.meta.env to access env variables. instead use qwik recommended way.
- Always wireup navigation when adding new pages

# Access API Docs
GET http://localhost:8080/api/docs
To resolve "$ref": "./components/schemas/user.yaml#/UpdateUserInput":

# Get just the UpdateUserInput schema
curl http://localhost:8080/api/docs/components/schemas/user?ref=UpdateUserInput

Usage examples:

| $ref                                            | API Endpoint
|
|-------------------------------------------------|----------------------------
---------------------------|
| ./components/schemas/user.yaml#/UpdateUserInput |
/api/docs/components/schemas/user?ref=UpdateUserInput |
| ./components/schemas/vendor.yaml#/Vendor        |
/api/docs/components/schemas/vendor?ref=Vendor        |
| ./paths/vendor/profile.yaml#/vendor-profile     |
/api/docs/paths/vendor/profile?ref=vendor-profile     |

Discovery endpoint:
# See all available modules and how to use them
curl http://localhost:8080/api/docs/modules


