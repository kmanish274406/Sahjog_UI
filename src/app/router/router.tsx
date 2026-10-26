import { createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ROUTES } from '@/config/routes'
import type { Role } from '@/features/auth/types/auth.types'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

/** Strip the leading slash: child routes of the layout are relative. */
const rel = (path: string) => path.slice(1)

// Pages are code-split per route; each module exposes its page as the default export.
const page = (
  path: string,
  load: () => Promise<{ default: React.ComponentType }>,
): RouteObject => ({
  path,
  lazy: () => load().then((m) => ({ Component: m.default })),
})

const SIGNED_IN: Role[] = ['customer', 'vendor', 'technician', 'admin', 'super_admin']
const TENANT_ROLES: Role[] = ['customer', 'vendor', 'technician', 'admin']
const PROVIDERS: Role[] = ['vendor', 'technician']

/** Each entry is guarded by the roles that may open its pages; the API checks the same rules. */
const guarded: { roles: Role[]; routes: RouteObject[] }[] = [
  {
    roles: SIGNED_IN,
    routes: [
      {
        index: true,
        lazy: () =>
          import('@/features/dashboard/pages/DashboardPage').then((m) => ({
            Component: m.default,
          })),
      },
    ],
  },
  {
    roles: TENANT_ROLES,
    routes: [
      page(rel(ROUTES.bookings), () => import('@/features/bookings/pages/BookingsPage')),
      page(rel(ROUTES.bookingDetail), () => import('@/features/bookings/pages/BookingDetailPage')),
      page(
        rel(ROUTES.notifications),
        () => import('@/features/notifications/pages/NotificationsPage'),
      ),
    ],
  },
  {
    roles: ['customer', 'vendor', 'technician'],
    routes: [page(rel(ROUTES.profile), () => import('@/features/profile/pages/ProfilePage'))],
  },
  {
    roles: ['customer'],
    routes: [
      page(rel(ROUTES.services), () => import('@/features/catalog/pages/ServicesPage')),
      page(rel(ROUTES.serviceDetail), () => import('@/features/catalog/pages/ServiceDetailPage')),
      page(rel(ROUTES.cart), () => import('@/features/cart/pages/CartPage')),
      page(rel(ROUTES.checkout), () => import('@/features/cart/pages/CheckoutPage')),
      page(rel(ROUTES.addresses), () => import('@/features/addresses/pages/AddressesPage')),
    ],
  },
  {
    roles: ['vendor'],
    routes: [
      page(rel(ROUTES.myServices), () => import('@/features/vendor/pages/MyServicesPage')),
      page(rel(ROUTES.team), () => import('@/features/vendor/pages/TeamPage')),
    ],
  },
  {
    roles: PROVIDERS,
    routes: [
      page(rel(ROUTES.earnings), () => import('@/features/earnings/pages/EarningsPage')),
      page(rel(ROUTES.plans), () => import('@/features/subscription/pages/PlansPage')),
    ],
  },
  {
    roles: ['admin'],
    routes: [
      page(rel(ROUTES.users), () => import('@/features/admin/pages/UsersPage')),
      page(rel(ROUTES.catalog), () => import('@/features/admin/pages/CatalogPage')),
      page(rel(ROUTES.payments), () => import('@/features/admin/pages/PaymentsPage')),
      page(rel(ROUTES.content), () => import('@/features/admin/pages/ContentPage')),
      page(rel(ROUTES.settings), () => import('@/features/admin/pages/SettingsPage')),
      page(rel(ROUTES.reports), () => import('@/features/admin/pages/ReportsPage')),
      page(rel(ROUTES.business), () => import('@/features/admin/pages/BusinessPage')),
    ],
  },
  {
    roles: ['super_admin'],
    routes: [
      page(rel(ROUTES.clients), () => import('@/features/platform/pages/ClientsPage')),
      page(rel(ROUTES.clientDetail), () => import('@/features/platform/pages/ClientDetailPage')),
    ],
  },
]

const appRoutes: RouteObject[] = guarded.map(({ roles, routes }) => ({
  element: <ProtectedRoute allowedRoles={roles} />,
  children: routes,
}))

/** Exported so tests can mount the same route table in a memory router. */
export const routes: RouteObject[] = [
  {
    path: ROUTES.login,
    lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
  },
  {
    element: <ProtectedRoute />,
    children: [{ element: <AppLayout />, children: appRoutes }],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
