export const ROUTES = {
  login: '/login',
  dashboard: '/',
  // Everyone's bookings: a customer's bookings, a vendor's orders, a technician's jobs, all bookings for Admin.
  bookings: '/bookings',
  bookingDetail: '/bookings/:code',
  // Customer
  services: '/services',
  serviceDetail: '/services/:serviceId',
  cart: '/cart',
  checkout: '/checkout',
  addresses: '/addresses',
  // Vendor
  myServices: '/my-services',
  team: '/team',
  earnings: '/earnings',
  plans: '/plans',
  // Admin
  users: '/users',
  catalog: '/catalog',
  payments: '/payments',
  content: '/content',
  settings: '/settings',
  reports: '/reports',
  business: '/business',
  // Platform owner
  clients: '/clients',
  clientDetail: '/clients/:tenantId',
  masters: '/masters',
  roles: '/roles',
  // Everyone
  notifications: '/notifications',
  profile: '/profile',
} as const

export const bookingPath = (code: string) => `${ROUTES.bookings}/${encodeURIComponent(code)}`
export const servicePath = (serviceId: number) => `${ROUTES.services}/${serviceId}`
export const clientPath = (tenantId: number) => `${ROUTES.clients}/${tenantId}`
