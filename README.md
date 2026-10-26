# Sahjog UI

Web console for **Sahjog ("Har Kaam Ka Saathi")**, the local-services marketplace: one site for the
customer, vendor, technician, admin and platform-owner workspaces, on the Sahjog API
(`../SahjogApi`).

React 19 + TypeScript + Vite, laid out like the SalesTrack CRM UI (feature folders, a small design
system in `components/`, TanStack Query for server state, Zustand for client state, React Hook Form
and Zod for forms).

```bash
npm install
cp .env.example .env     # point VITE_API_URL at the API
npm run dev              # http://localhost:5173
npm test                 # unit tests (an end-to-end API test is skipped unless enabled, below)
npm run build
```

## Configuration

| Variable       | Default                 | Meaning                                                                            |
| -------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:5191` | Address of the Sahjog API. For the hosted one: `https://sahjog-api-1.onrender.com` |
| `VITE_TENANT`  | `1`                     | The business (client) the site belongs to. Editable on the sign-in page.           |

Every call carries `X-Tenant-Id`. The hosted API runs on a free tier that sleeps: the first request
after a pause can take a minute (the client waits up to 90 seconds).

## Who sees what

| Role           | Signs in with                       | Workspace                                                                                                  |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Customer       | mobile + OTP, or email + password   | Browse services, cart, checkout (UPI, QR, card, net banking, wallet), bookings, addresses, wallet          |
| Vendor         | mobile + password (or register)     | Orders (accept, reject, assign), my services, my technicians, earnings and payouts, subscription           |
| Technician     | mobile + OTP (or register)          | Open jobs, my jobs (start, close with the customer's OTP), earnings, subscription                          |
| Admin          | email + password                    | Dashboard and reports, vendors and technicians, catalogue, app texts and slots, fees, payments and refunds |
| Platform owner | email + password (no business code) | Clients: create, switch on or off, Wallet / Coupon / Google switches                                       |

Demo accounts of the seeded database (the sign-in page pre-fills them in development): customer
`9876543210` (OTP `123456`), vendor `9876543210` (any password), technician `9876500011` (OTP `123456`),
admin `admin@sahjog.in` / `Admin@123`, platform owner `superadmin@sahjog.in` / `SuperAdmin@123`.

The platform owner exists **only here**: the MAUI app no longer has those screens.

## Architecture

```
src/
├── api/           The only door to the API: http.ts (envelope, tenant header, token renewal), index.ts (one group per area), types.ts (the API's DTOs)
├── app/           Providers, router (role-guarded lazy routes), ProtectedRoute
├── components/    Design system: ui/, layout/, charts/, feedback/ (QueryState, EmptyState, Toaster)
├── config/        env, routes, navigation per role
├── domain/        Pure rules: roles, booking stages, phone and email validation
├── features/      One folder per area: auth, dashboard, catalog, cart, addresses, bookings, vendor,
│                  earnings, subscription, payments, profile, notifications, admin, platform
├── hooks/ lib/ store/ styles/ types/ utils/
└── test/          Test setup
```

- **Sessions.** The API gives a short-lived access token (5 minutes) and a refresh token (works once,
  ends after 15 idle minutes). `api/http.ts` renews on a 401 and repeats the call; calls that expire
  together share one renewal, because a second use of a refresh token ends the session. A network
  failure during renewal does not sign the person out. `useIdleLogout` also signs out after 15
  minutes without input.
- **Roles.** `ProtectedRoute` guards each group of routes by role, and `config/navigation.ts` builds
  each role's menu. Both are a courtesy: the API enforces the rules on every call.
- **Texts come from the server.** Greeting, banners, time slots and payment labels are rows of the
  API's content table (`useContent`), so Admin can change them in "App texts & slots".
- **Online payments.** The server prices the order and the checkout page opens in a dialog
  (`usePaymentFlow`); a payment counts only once the server reports it `Paid`.
- **Every successful change refreshes all queries** (`lib/query-client.ts`), so a booking updates the
  wallet, the vendor's orders and the notification bell without each page remembering what to reload.

## Tests

`npm test` runs the unit tests (formatting, validators, booking stages, the HTTP client's token
renewal). `src/api/api.integration.test.ts` drives one booking through every role and writes data, so
it is skipped unless you ask for it, against a **development** API:

```bash
VITE_API_URL=http://localhost:5191 VITE_TEST_API=1 npx vitest run src/api/api.integration.test.ts
```

## Not in the web console yet

- **Sign in with Google.** The API's flow is built for a phone's browser; the site would need the
  Google client id exposed by the API and the Google script on the sign-in page.
- **Map pin picker.** Address search and "Use my location" work; the draggable map does not.
- **Push notifications.** The bell polls every 30 seconds instead.
