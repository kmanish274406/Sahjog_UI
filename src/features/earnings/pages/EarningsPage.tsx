import { BadgeIndianRupee, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { api } from '@/api'
import type { TransactionDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, DataTable, Panel, StatCard } from '@/components/ui'
import type { Column } from '@/components/ui'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'

function useTransactionColumns(role: 'vendor' | 'technician'): Column<TransactionDto>[] {
  return [
    {
      key: 'id',
      header: 'Booking',
      render: (t) => <span className={shared.mono}>{t.bookingId}</span>,
    },
    { key: 'service', header: 'Service', minWidth: 140, render: (t) => t.service },
    { key: 'customer', header: 'Customer', render: (t) => t.customer },
    {
      key: 'date',
      header: 'Date',
      render: (t) => <span className={shared.nowrap}>{formatDate(t.date)}</span>,
    },
    {
      key: 'gross',
      header: role === 'vendor' ? 'Service amount' : 'Job value',
      align: 'right',
      render: (t) => formatCurrency(t.gross),
    },
    ...(role === 'vendor'
      ? [
          {
            key: 'commission',
            header: 'Commission',
            align: 'right' as const,
            render: (t: TransactionDto) => formatCurrency(t.commission),
          },
        ]
      : []),
    {
      key: 'net',
      header: role === 'vendor' ? 'You earn' : 'Your earning',
      align: 'right',
      render: (t) => <strong>{formatCurrency(t.net)}</strong>,
    },
  ]
}

export default function EarningsPage() {
  const role = useAuthStore((state) => state.user?.role)
  return role === 'technician' ? <TechnicianEarnings /> : <VendorEarnings />
}

function VendorEarnings() {
  const earnings = useApiQuery(['vendor', 'earnings'], api.vendor.earnings)
  const payout = useApiMutation(api.vendor.requestPayout, {
    meta: { success: 'Payout requested. It will reach your bank account soon.' },
  })
  const columns = useTransactionColumns('vendor')
  const e = earnings.data

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Earnings"
        description="What your completed orders have earned, after the platform's commission."
        actions={
          <Button
            onClick={() => payout.mutate(undefined)}
            loading={payout.isPending}
            disabled={!e || e.pendingPayout <= 0}
          >
            Request payout{e && e.pendingPayout > 0 ? ` of ${formatCurrency(e.pendingPayout)}` : ''}
          </Button>
        }
      />
      <QueryState isLoading={earnings.isLoading} error={earnings.error}>
        {e && (
          <>
            <Grid variant="stats">
              <StatCard
                label="Net earnings"
                value={formatCurrency(e.netEarnings)}
                icon={Wallet}
                hint={`${e.completedBookings} completed orders`}
              />
              <StatCard
                label="Service earnings"
                value={formatCurrency(e.serviceEarnings)}
                icon={BadgeIndianRupee}
              />
              <StatCard
                label="Platform fee"
                value={formatCurrency(e.platformFee)}
                icon={CheckCircle2}
              />
              <StatCard
                label="Ready for payout"
                value={formatCurrency(e.pendingPayout)}
                icon={Clock}
                hint={`${e.totalBookings} orders in total`}
              />
            </Grid>
            <Panel title="Completed orders" flush>
              <DataTable
                columns={columns}
                rows={e.transactions}
                getRowId={(t) => t.bookingId}
                emptyMessage="No completed orders yet."
              />
            </Panel>
            <Panel title="Payouts" flush>
              <DataTable
                columns={[
                  { key: 'label', header: 'Payout', render: (p) => p.label },
                  { key: 'note', header: 'Note', render: (p) => p.note || '-' },
                  {
                    key: 'amount',
                    header: 'Amount',
                    align: 'right',
                    render: (p) => <strong>{formatCurrency(p.amount)}</strong>,
                  },
                ]}
                rows={e.payouts}
                getRowId={(p) => String(p.id)}
                emptyMessage="No payouts yet."
              />
            </Panel>
          </>
        )}
      </QueryState>
    </div>
  )
}

function TechnicianEarnings() {
  const summary = useApiQuery(['technician', 'summary'], api.technician.summary)
  const columns = useTransactionColumns('technician')
  const s = summary.data

  return (
    <div className={shared.stack}>
      <PageHeader title="Earnings" description="What you have earned from completed jobs." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        {s && (
          <>
            <Grid variant="stats">
              <StatCard
                label="Today"
                value={formatCurrency(s.todayEarnings)}
                icon={BadgeIndianRupee}
                hint={`${s.completedToday} jobs completed today`}
              />
              <StatCard
                label="Total earned"
                value={formatCurrency(s.totalEarnings)}
                icon={Wallet}
                hint={`${s.completedJobs} jobs completed`}
              />
              <StatCard
                label="Pending payout"
                value={formatCurrency(s.pendingPayout)}
                icon={Clock}
              />
            </Grid>
            <Panel title="Completed jobs" flush>
              <DataTable
                columns={columns}
                rows={s.transactions}
                getRowId={(t) => t.bookingId}
                emptyMessage="No completed jobs yet."
              />
            </Panel>
          </>
        )}
      </QueryState>
    </div>
  )
}
