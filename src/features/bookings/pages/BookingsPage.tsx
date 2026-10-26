import { CalendarX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { BookingDto } from '@/api/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import { Button, DataTable, Panel, SearchInput, Tabs } from '@/components/ui'
import type { Column } from '@/components/ui'
import { bookingPath, ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'
import { StageBadge } from '../components/StageBadge'
import { BOOKINGS_TITLE, matchesSearch, VIEWS } from '../utils/views'

/** Bookings for every role: a customer's bookings, a vendor's orders, a technician's jobs, or all of them for Admin. */
export default function BookingsPage() {
  const user = useAuthStore((state) => state.user)!
  const role = user.role === 'super_admin' ? 'admin' : user.role
  const views = VIEWS[role]
  const [view, setView] = useState(views[0]!.id)
  const [term, setTerm] = useState('')

  const bookings = useApiQuery(['bookings'], api.bookings.list, { refetchInterval: 20_000 })
  const accept = useApiMutation((code: string) => api.bookings.accept(code), {
    meta: { success: 'Order accepted. Assign a technician next.' },
  })
  const reject = useApiMutation((code: string) => api.bookings.reject(code), {
    meta: { success: 'Order rejected.' },
  })
  const take = useApiMutation((code: string) => api.bookings.take(code), {
    meta: { success: 'Job added to My jobs.' },
  })

  const current = views.find((v) => v.id === view) ?? views[0]!
  const all = bookings.data ?? []
  const rows = all
    .filter((b) => current.filter(b, user.id) && matchesSearch(b, term))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const columns: Column<BookingDto>[] = [
    {
      key: 'id',
      header: 'Booking',
      render: (b) => (
        <Link to={bookingPath(b.id)} className={shared.mono}>
          {b.id}
        </Link>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      minWidth: 190,
      render: (b) => (
        <span>
          <span aria-hidden="true">{b.emoji}</span> {b.service}
        </span>
      ),
    },
    ...(role === 'customer'
      ? [
          {
            key: 'provider',
            header: 'Provider',
            render: (b: BookingDto) =>
              b.technician ? `${b.provider} · ${b.technician}` : b.provider,
          },
        ]
      : [
          {
            key: 'customer',
            header: 'Customer',
            minWidth: 130,
            render: (b: BookingDto) => b.customer,
          },
        ]),
    ...(role === 'admin'
      ? [
          {
            key: 'provider',
            header: 'Provider',
            render: (b: BookingDto) => b.provider || 'Open job',
          },
        ]
      : []),
    {
      key: 'when',
      header: 'When',
      render: (b) => (
        <span className={shared.nowrap}>
          {formatDate(b.date)}
          <br />
          <span className={` ${shared.small}`}>{b.time}</span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: role === 'customer' ? 'Total' : 'Amount',
      align: 'right',
      render: (b) => formatCurrency(role === 'customer' ? b.total : b.amount),
    },
    { key: 'stage', header: 'Status', render: (b) => <StageBadge stage={b.stage} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          {role === 'vendor' && b.stage === 'Requested' && (
            <>
              <Button
                size="sm"
                onClick={() => accept.mutate(b.id)}
                disabled={accept.isPending || reject.isPending}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => reject.mutate(b.id)}
                disabled={accept.isPending || reject.isPending}
              >
                Reject
              </Button>
            </>
          )}
          {role === 'vendor' && b.stage === 'Accepted' && (
            <Link to={bookingPath(b.id)}>
              <Button size="sm">Assign technician</Button>
            </Link>
          )}
          {role === 'technician' &&
            b.independent &&
            b.stage === 'Requested' &&
            b.technicianId === null && (
              <Button size="sm" onClick={() => take.mutate(b.id)} disabled={take.isPending}>
                Take job
              </Button>
            )}
          <Link to={bookingPath(b.id)}>
            <Button size="sm" variant="secondary">
              View
            </Button>
          </Link>
        </span>
      ),
    },
  ]

  const counts = Object.fromEntries(
    views.map((v) => [v.id, all.filter((b) => v.filter(b, user.id)).length]),
  )
  const tabs = views.map((v) => ({ id: v.id, label: `${v.label} (${counts[v.id]})` }))
  const text = BOOKINGS_TITLE[role]

  return (
    <div className={shared.stack}>
      <PageHeader
        title={text.title}
        description={text.description}
        actions={
          role === 'customer' ? (
            <Link to={ROUTES.services}>
              <Button>Book a service</Button>
            </Link>
          ) : undefined
        }
      />
      <Tabs items={tabs} active={current.id} onChange={setView} label="Show" />
      <QueryState isLoading={bookings.isLoading} error={bookings.error}>
        <Panel flush>
          <Toolbar>
            <SearchInput
              label="Search bookings"
              placeholder="Search by booking, service or name"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </Toolbar>
          {rows.length === 0 ? (
            <EmptyState icon={CalendarX} title="Nothing here">
              {term
                ? 'No booking matches your search.'
                : 'There are no bookings in this list right now.'}
            </EmptyState>
          ) : (
            <DataTable columns={columns} rows={rows} getRowId={(b) => b.id} />
          )}
        </Panel>
      </QueryState>
    </div>
  )
}
