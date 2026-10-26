import { CheckCircle2, ClipboardList, Hammer, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, DataTable, Panel, StatCard, Toggle } from '@/components/ui'
import { bookingPath, ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { StageBadge } from '@/features/bookings/components/StageBadge'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'

export function TechnicianDashboard() {
  const me = useAuthStore((state) => state.user)!
  const summary = useApiQuery(['technician', 'summary'], api.technician.summary)
  const profile = useApiQuery(['profile'], api.auth.me)
  const bookings = useApiQuery(['bookings'], api.bookings.list, { refetchInterval: 20_000 })
  const take = useApiMutation((code: string) => api.bookings.take(code), { meta: { success: 'Job added to My jobs.' } })
  const setAvailable = useApiMutation((available: boolean) => api.auth.updateMe({ available }), { meta: { success: 'Availability updated.' } })

  const all = bookings.data ?? []
  const open = all.filter((b) => b.independent && b.stage === 'Requested' && b.technicianId === null)
  const mine = all.filter((b) => b.technicianId === me.id && (b.stage === 'Assigned' || b.stage === 'InProgress'))
  const s = summary.data

  return (
    <div className={shared.stack}>
      <PageHeader title={`Hello, ${me.name.split(' ')[0]}`} description="Your jobs and earnings today." />
      {profile.data && (
        <Panel>
          <Toggle
            label="Available for jobs"
            description="Turn off when you cannot take new jobs."
            checked={profile.data.available}
            onChange={(value) => setAvailable.mutate(value)}
          />
        </Panel>
      )}
      <QueryState isLoading={summary.isLoading || bookings.isLoading} error={summary.error ?? bookings.error}>
        {s && (
          <Grid variant="stats">
            <StatCard label="Jobs today" value={String(s.todayJobs)} icon={ClipboardList} />
            <StatCard label="In progress" value={String(s.inProgress)} icon={Hammer} />
            <StatCard label="Completed today" value={String(s.completedToday)} icon={CheckCircle2} hint={formatCurrency(s.todayEarnings)} />
            <StatCard label="Total earned" value={formatCurrency(s.totalEarnings)} icon={Wallet} hint={`${formatCurrency(s.pendingPayout)} pending payout`} />
          </Grid>
        )}

        <Panel title="My jobs" actions={<Link to={ROUTES.bookings}><Button size="sm" variant="secondary">All jobs</Button></Link>} flush>
          <DataTable
            rows={mine}
            getRowId={(b) => b.id}
            emptyMessage="No jobs assigned to you right now."
            columns={[
              { key: 'id', header: 'Job', render: (b) => <Link to={bookingPath(b.id)} className={shared.mono}>{b.id}</Link> },
              { key: 'service', header: 'Service', render: (b) => `${b.emoji} ${b.service}` },
              { key: 'customer', header: 'Customer', render: (b) => b.customer },
              { key: 'address', header: 'Area', render: (b) => b.area || b.address },
              { key: 'when', header: 'When', render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}, {b.time}</span> },
              { key: 'stage', header: 'Status', render: (b) => <StageBadge stage={b.stage} /> },
            ]}
          />
        </Panel>

        <Panel title="Open jobs" subtitle="Direct customer jobs: the first technician to take one gets it." flush>
          <DataTable
            rows={open}
            getRowId={(b) => b.id}
            emptyMessage="No open jobs right now. New ones appear here as customers post them."
            columns={[
              { key: 'id', header: 'Job', render: (b) => <Link to={bookingPath(b.id)} className={shared.mono}>{b.id}</Link> },
              { key: 'service', header: 'Service', render: (b) => `${b.emoji} ${b.service}` },
              { key: 'area', header: 'Area', render: (b) => b.area || b.address },
              { key: 'when', header: 'When', render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}, {b.time}</span> },
              { key: 'earn', header: 'Pays', align: 'right', render: (b) => formatCurrency(b.techEarning || b.amount) },
              { key: 'take', header: '', align: 'right', render: (b) => <Button size="sm" onClick={() => take.mutate(b.id)} disabled={take.isPending}>Take job</Button> },
            ]}
          />
        </Panel>
      </QueryState>
    </div>
  )
}
