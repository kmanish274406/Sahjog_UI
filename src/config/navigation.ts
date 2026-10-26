import {
  Bell,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Grid2x2,
  Landmark,
  LayoutDashboard,
  MapPin,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Users,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/features/auth/types/auth.types'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

const dashboard: NavItem = { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard }
const notifications: NavItem = { label: 'Notifications', to: ROUTES.notifications, icon: Bell }

/** What each role's menu offers. The router guards the same pages; hiding a link is only cosmetic. */
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  customer: [
    { title: 'Home', items: [dashboard] },
    {
      title: 'Book a service',
      items: [
        { label: 'All services', to: ROUTES.services, icon: Grid2x2 },
        { label: 'Cart', to: ROUTES.cart, icon: ShoppingCart },
        { label: 'My bookings', to: ROUTES.bookings, icon: CalendarCheck },
      ],
    },
    {
      title: 'My account',
      items: [
        { label: 'Saved addresses', to: ROUTES.addresses, icon: MapPin },
        notifications,
        { label: 'Profile & wallet', to: ROUTES.profile, icon: Wallet },
      ],
    },
  ],
  vendor: [
    { title: 'Business', items: [dashboard] },
    {
      title: 'Work',
      items: [
        { label: 'Orders', to: ROUTES.bookings, icon: ClipboardList },
        { label: 'My services', to: ROUTES.myServices, icon: Package },
        { label: 'My technicians', to: ROUTES.team, icon: UsersRound },
      ],
    },
    {
      title: 'Money & account',
      items: [
        { label: 'Earnings', to: ROUTES.earnings, icon: Wallet },
        { label: 'Subscription', to: ROUTES.plans, icon: CreditCard },
        notifications,
        { label: 'Profile', to: ROUTES.profile, icon: Store },
      ],
    },
  ],
  technician: [
    { title: 'Work', items: [dashboard] },
    {
      title: 'Jobs',
      items: [
        { label: 'Jobs', to: ROUTES.bookings, icon: Wrench },
        { label: 'Earnings', to: ROUTES.earnings, icon: Wallet },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Subscription', to: ROUTES.plans, icon: CreditCard },
        notifications,
        { label: 'Profile', to: ROUTES.profile, icon: Store },
      ],
    },
  ],
  admin: [
    { title: 'Overview', items: [dashboard, { label: 'Reports', to: ROUTES.reports, icon: PieChart }] },
    {
      title: 'Operations',
      items: [
        { label: 'Bookings', to: ROUTES.bookings, icon: ClipboardList },
        { label: 'Vendors & technicians', to: ROUTES.users, icon: Users },
        { label: 'Payments & refunds', to: ROUTES.payments, icon: Receipt },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Categories & services', to: ROUTES.catalog, icon: Grid2x2 },
        { label: 'App texts & slots', to: ROUTES.content, icon: FileText },
        { label: 'Fees & policies', to: ROUTES.settings, icon: Settings },
        { label: 'My business', to: ROUTES.business, icon: Building2 },
        notifications,
      ],
    },
  ],
  super_admin: [
    {
      title: 'Platform',
      items: [{ label: 'Clients', to: ROUTES.clients, icon: Landmark }],
    },
  ],
}
