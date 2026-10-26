import { ClipboardList, Hourglass, Wallet, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, DataTable, Panel, StatCard } from '@/components/ui'
import { bookingPath, ROUTES } from '@/config/routes'
import { StageBadge } from '@/features/bookings/components/StageBadge'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'

export function VendorDashboard() {
  const profile = useApiQuery(['profile'], api.auth.me)
  const bookings = useApiQuery(['bookings'], api.bookings.list, { refetchInterval: 20_000 })
  const earnings = useApiQuery(['vendor', 'earnings'], api.vendor.earnings)
  const accept = useApiMutation((code: string) => api.bookings.accept(code), { meta: { success: 'Order accepted. Assign a technician next.' } })
  const reject = useApiMutation((code: string) => api.bookings.reject(code), { meta: { success: 'Order rejected.' } })

  const all = bookings.data ?? []
  const fresh = all.filter((b) => b.stage === 'Requested')
  const toAssign = all.filter((b) => b.stage === 'Accepted')
  const active = all.filter((b) => b.stage === 'Assigned' || b.stage === 'InProgress')

  return (
    <div className={shared.stack}>
      <PageHeader title={profile.data?.business || 'Dashboard'} description="Your orders and earnings at a glance." />
      <QueryState isLoading={bookings.isLoading} error={bookings.error}>
        <Grid variant="stats">
          <StatCard label="New requests" value={String(fresh.length)} icon={ClipboardList} hint="waiting for you to respond" />
          <StatCard label="To assign" value={String(toAssign.length)} icon={Hourglass} hint="accepted, no technician yet" />
          <StatCard label="In progress" value={String(active.length)} icon={Wrench} />
          <StatCard label="Net earnings" value={earnings.data ? formatCurrency(earnings.data.netEarnings) : '…'} icon={Wallet} hint={earnings.data ? `${formatCurrency(earnings.data.pendingPayout)} ready for payout` : undefined} />
        </Grid>

        <Panel title="New requests" subtitle="Accept an order to assign it to one of your technicians." actions={<Link to={ROUTES.bookings}><Button size="sm" variant="secondary">All orders</Button></Link>} flush>
          <DataTable
            rows={fresh}
            getRowId={(b) => b.id}
            emptyMessage="No new requests right now."
            columns={[
              { key: 'id', header: 'Order', render: (b) => <Link to={bookingPath(b.id)} className={shared.mono}>{b.id}</Link> },
              { key: 'service', header: 'Service', render: (b) => `${b.emoji} ${b.service}` },
              { key: 'customer', header: 'Customer', render: (b) => b.customer },
              { key: 'when', header: 'When', render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}, {b.time}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (b) => formatCurrency(b.amount) },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (b) => (
                  <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
                    <Button size="sm" onClick={() => accept.mutate(b.id)} disabled={accept.isPending || reject.isPending}>Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => reject.mutate(b.id)} disabled={accept.isPending || reject.isPending}>Reject</Button>
                  </span>
                ),
              },
            ]}
          />
        </Panel>

        <Panel title="Waiting for a technician" flush>
          <DataTable
            rows={toAssign}
            getRowId={(b) => b.id}
            emptyMessage="Nothing waiting to be assigned."
            columns={[
              { key: 'id', header: 'Order', render: (b) => <Link to={bookingPath(b.id)} className={shared.mono}>{b.id}</Link> },
              { key: 'service', header: 'Service', render: (b) => `${b.emoji} ${b.service}` },
              { key: 'when', header: 'When', render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}, {b.time}</span> },
              { key: 'stage', header: 'Status', render: (b) => <StageBadge stage={b.stage} /> },
              { key: 'assign', header: '', align: 'right', render: (b) => <Link to={bookingPath(b.id)}><Button size="sm">Assign</Button></Link> },
            ]}
          />
        </Panel>
      </QueryState>
    </div>
  )
}
