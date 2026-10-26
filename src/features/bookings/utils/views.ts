import type { BookingDto } from '@/api/types'
import type { Role } from '@/domain/types'

export interface BookingView {
  id: string
  label: string
  /** Which bookings the tab shows. `me` is the signed-in person's id. */
  filter: (booking: BookingDto, me: number) => boolean
}

const stageIn =
  (...stages: string[]) =>
  (b: BookingDto) =>
    stages.includes(b.stage)

/** The tabs of the bookings screen: each role looks at its bookings in the way it works with them. */
export const VIEWS: Record<Exclude<Role, 'super_admin'>, BookingView[]> = {
  customer: [
    {
      id: 'open',
      label: 'Upcoming',
      filter: stageIn('Requested', 'Accepted', 'Assigned', 'InProgress'),
    },
    { id: 'done', label: 'Completed', filter: stageIn('Completed') },
    { id: 'closed', label: 'Cancelled', filter: stageIn('Cancelled', 'Rejected') },
    { id: 'all', label: 'All', filter: () => true },
  ],
  vendor: [
    { id: 'new', label: 'New requests', filter: stageIn('Requested') },
    { id: 'assign', label: 'To assign', filter: stageIn('Accepted') },
    { id: 'active', label: 'In progress', filter: stageIn('Assigned', 'InProgress') },
    { id: 'done', label: 'Completed', filter: stageIn('Completed') },
    { id: 'closed', label: 'Cancelled', filter: stageIn('Cancelled', 'Rejected') },
  ],
  technician: [
    {
      id: 'open',
      label: 'Open jobs',
      filter: (b) => b.independent && b.stage === 'Requested' && b.technicianId === null,
    },
    {
      id: 'mine',
      label: 'My jobs',
      filter: (b, me) => b.technicianId === me && ['Assigned', 'InProgress'].includes(b.stage),
    },
    {
      id: 'done',
      label: 'Completed',
      filter: (b, me) => b.technicianId === me && b.stage === 'Completed',
    },
    {
      id: 'closed',
      label: 'Cancelled',
      filter: (b, me) => b.technicianId === me && ['Cancelled', 'Rejected'].includes(b.stage),
    },
  ],
  admin: [
    { id: 'all', label: 'All', filter: () => true },
    {
      id: 'active',
      label: 'Active',
      filter: stageIn('Requested', 'Accepted', 'Assigned', 'InProgress'),
    },
    { id: 'done', label: 'Completed', filter: stageIn('Completed') },
    { id: 'closed', label: 'Cancelled', filter: stageIn('Cancelled', 'Rejected') },
  ],
}

export const BOOKINGS_TITLE: Record<
  Exclude<Role, 'super_admin'>,
  { title: string; description: string }
> = {
  customer: { title: 'My bookings', description: 'Track, reschedule or cancel your bookings.' },
  vendor: {
    title: 'Orders',
    description: 'Accept new requests and assign them to your technicians.',
  },
  technician: {
    title: 'Jobs',
    description: 'Take open jobs, start them on site and close them with the customer’s OTP.',
  },
  admin: { title: 'All bookings', description: 'Every booking on the platform.' },
}

/** Matches a booking against what the person typed in the search box. */
export function matchesSearch(booking: BookingDto, term: string): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return true
  return [
    booking.id,
    booking.service,
    booking.customer,
    booking.provider,
    booking.technician ?? '',
    booking.area,
    booking.phone,
  ].some((v) => v.toLowerCase().includes(t))
}
