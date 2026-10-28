import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronsRight,
  CircleDot,
  ClipboardList,
  CreditCard,
  FileText,
  Grid2x2,
  Landmark,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * The icons a menu row may name. The menu table stores a name; only these are bundled, so a new icon needs a line here.
 * A row naming an icon that is not listed gets the dot.
 */
const ICONS: Record<string, LucideIcon> = {
  Bell,
  Building2,
  CalendarCheck,
  ChevronsRight,
  ClipboardList,
  CreditCard,
  FileText,
  Grid2x2,
  Landmark,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Wrench,
}

export const ICON_NAMES = Object.keys(ICONS)

export const iconByName = (name: string): LucideIcon => ICONS[name] ?? CircleDot
