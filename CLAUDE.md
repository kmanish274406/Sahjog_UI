# CLAUDE.md

Guidance for Claude Code in this folder. `README.md` has the overview; this lists what is easy to get wrong.

Web console for the Sahjog API (`../SahjogApi`), laid out like `D:\SalesTrackCRM\SalesCRMUI`. It is not a git repository yet.

## Commands

```
npm run dev          # http://localhost:5173, API from VITE_API_URL
npm run typecheck    # tsc -b
npm run lint         # oxlint
npm test             # vitest; the end-to-end API test is skipped unless VITE_TEST_API is set
npm run build
npm run format       # prettier (no semicolons, single quotes, width 100)
```

Run `typecheck`, `lint`, `test` and `format:check` before calling a change done.

## Things that are easy to get wrong

- **The API's JSON is camelCase and wrapped** in `{ success, message, data }`. `api/http.ts` unwraps it and throws `ApiError` with the server's `message`; never call `fetch` from a screen. A new endpoint is a line in `api/index.ts` and, if it has a new shape, a type in `api/types.ts` (mirror `SahjogApi.Application/DTOs/Dtos.cs`).
- **Dates.** A booking's day is a calendar date at midnight with no zone: show it with `formatDate` (reads it through UTC). Moments (created, notified) are UTC without a `Z`: `formatDateTime` / `formatRelativeTime` add it. Send a day as `toIsoDay(date)`.
- **Token renewal is single-flight on purpose.** A refresh token works once; a second renewal with it ends the whole session. Do not add another place that calls `/api/auth/refresh`.
- **Mutations:** use `useApiMutation`. `meta: { success: '…' }` shows a toast; `meta: { inline: true }` means the form shows the error itself (otherwise a toast does). Any successful mutation refreshes every query, so do not hand-invalidate.
- **Query keys for public catalogue data include the business** (`useCatalog.ts`), because the same site can be pointed at another business on the sign-in page.
- **Texts, slots and payment labels come from the content table**, not from the screens (`useContent`).
- **Route guards are in `app/router/router.tsx`; the sidebar is not in code.** The menu comes from the API's `MenuItems` table (`GET /api/auth/menu`, drawn in `components/layout/Sidebar.tsx`, icon names mapped in `config/icons.ts`), so a new page needs a route here and a menu row on the Masters screen. Within a role, buttons, tabs, menu links and routes are gated by access ids: wrap an action in `<Can permission={PERMISSIONS.serviceAdd}>` (or use `usePermission()`), and give a menu link or route a `permission` (one id, or an array meaning any). The ids in `config/permissions.ts` must match the API's `AccessCatalog.cs`, and the API refuses what the console hides. The platform owner (`super_admin`) has no `X-Tenant-Id` pages: the API refuses it anywhere but `/api/platform`.
- **Bookings are one screen for four roles** (`features/bookings`): tabs per role in `utils/views.ts`, actions per role in `components/BookingActions.tsx`. The server decides what is allowed; the screen only hides what cannot work.
- **The cart is client-side** (`features/cart/store`): each item becomes its own booking at checkout, one payment per item for online methods.
- **Do not call impure functions (`Date.now()`) while rendering**; oxlint flags it. Compute once in `useState(() => …)`.
- CSS Modules next to the component; design tokens in `styles/tokens.css`; shared layout helpers in `styles/shared.module.css`. Reuse `components/ui` before adding a control.
- `dist/` and `node_modules/` are ignored.
