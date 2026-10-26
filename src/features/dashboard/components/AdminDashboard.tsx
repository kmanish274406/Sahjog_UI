import { CalendarCheck, IndianRupee, Percent, Store, UserRound, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { BarList } from '@/components/charts'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, DataTable, Panel, StatCard } from '@/components/ui'
import { bookingPath, ROUTES } from '@/config/routes'
import { StageBadge } from '@/features/bookings/components/StageBadge'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'

export function AdminDashboard() {
  const summary = useApiQuery(['admin', 'summary'], api.admin.summary)
  const report = useApiQuery(['admin', 'report'], api.admin.report)
  const bookings = useApiQuery(['bookings'], api.bookings.list, { refetchInterval: 30_000 })
  const s = summary.data
  const recent = [...(bookings.data ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  return (
    <div className={shared.stack}>
      <PageHeader title="Dashboard" description="How your business is doing." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        {s && (
          <Grid variant="stats">
            <StatCard
              label="Revenue"
              value={formatCurrency(s.revenue)}
              icon={IndianRupee}
              hint={`${s.bookings} bookings`}
            />
            <StatCard
              label="Commission earned"
              value={formatCurrency(s.commission)}
              icon={Percent}
            />
            <StatCard label="Customers" value={String(s.customers)} icon={UserRound} />
            <StatCard label="Vendors" value={String(s.vendors)} icon={Store} />
            <StatCard label="Technicians" value={String(s.technicians)} icon={Wrench} />
            <StatCard label="Bookings" value={String(s.bookings)} icon={CalendarCheck} />
          </Grid>
        )}
      </QueryState>

      <div className={shared.grid2}>
        <Panel
          title="Revenue by category"
          subtitle="Share of completed bookings"
          actions={
            <Link to={ROUTES.reports}>
              <Button size="sm" variant="secondary">
                Reports
              </Button>
            </Link>
          }
        >
          <QueryState isLoading={report.isLoading} error={report.error}>
            {report.data && report.data.shares.length > 0 ? (
              <BarList
                items={report.data.shares.map((x) => ({ label: x.name, value: x.percent }))}
                formatValue={(v) => formatPercent(v)}
              />
            ) : (
              <p className={shared.muted}>No completed bookings yet.</p>
            )}
          </QueryState>
        </Panel>
        <Panel
          title="Recent bookings"
          actions={
            <Link to={ROUTES.bookings}>
              <Button size="sm" variant="secondary">
                All bookings
              </Button>
            </Link>
          }
          flush
        >
          <DataTable
            rows={recent}
            getRowId={(b) => b.id}
            emptyMessage="No bookings yet."
            columns={[
              {
                key: 'id',
                header: 'Booking',
                render: (b) => (
                  <Link to={bookingPath(b.id)} className={shared.mono}>
                    {b.id}
                  </Link>
                ),
              },
              { key: 'service', header: 'Service', render: (b) => b.service },
              {
                key: 'when',
                header: 'When',
                render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}</span>,
              },
              { key: 'stage', header: 'Status', render: (b) => <StageBadge stage={b.stage} /> },
            ]}
          />
        </Panel>
      </div>
    </div>
  )
}
