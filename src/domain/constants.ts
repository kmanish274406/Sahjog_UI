import type { BookingStage, Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  technician: 'Technician',
  admin: 'Admin',
  super_admin: 'Platform owner',
}

/** The API names a role in PascalCase. */
export function roleFromApi(role: string): Role {
  switch (role.toLowerCase()) {
    case 'vendor':
      return 'vendor'
    case 'technician':
      return 'technician'
    case 'admin':
      return 'admin'
    case 'superadmin':
      return 'super_admin'
    default:
      return 'customer'
  }
}

export const STAGE_LABELS: Record<BookingStage, string> = {
  Requested: 'Requested',
  Accepted: 'Accepted',
  Assigned: 'Technician assigned',
  InProgress: 'In progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Rejected: 'Rejected',
}

/** The order a booking moves through, for the progress steps on the booking screen. */
export const STAGE_FLOW: BookingStage[] = ['Requested', 'Accepted', 'Assigned', 'InProgress', 'Completed']

export const PAYMENT_METHODS = ['UPI', 'QR', 'Card', 'Net Banking', 'Wallet'] as const

/** Payment methods that go through the gateway before the booking exists. */
export const ONLINE_METHODS = ['UPI', 'QR', 'Card', 'Net Banking'] as const

export const CANCEL_STAGE_LABELS = [
  'Before a technician is assigned',
  'After a technician is assigned',
  'Before the job starts',
  'After the job starts',
  'Late cancellation',
] as const
