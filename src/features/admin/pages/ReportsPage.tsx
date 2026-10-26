import { api } from '@/api'
import { BarList } from '@/components/charts'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Panel, StatCard } from '@/components/ui'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatPercent } from '@/utils/format'

export default function ReportsPage() {
  const summary = useApiQuery(['admin', 'summary'], api.admin.summary)
  const report = useApiQuery(['admin', 'report'], api.admin.report)
  const r = report.data
  const s = summary.data

  return (
    <div className={shared.stack}>
      <PageHeader title="Reports" description="Where the revenue comes from." />
      <QueryState isLoading={report.isLoading || summary.isLoading} error={report.error ?? summary.error}>
        {r && s && (
          <>
            <Grid variant="stats">
              <StatCard label="Total revenue" value={formatCurrency(r.totalRevenue)} hint={`${r.totalBookings} completed bookings`} />
              <StatCard label="Commission earned" value={formatCurrency(s.commission)} />
              <StatCard label="Average booking" value={formatCurrency(r.totalBookings ? r.totalRevenue / r.totalBookings : 0)} />
            </Grid>
            <div className={shared.grid2}>
              <Panel title="Share by category">
                {r.shares.length > 0 ? <BarList items={r.shares.map((x) => ({ label: x.name, value: x.percent }))} formatValue={formatPercent} /> : <p className={shared.muted}>No completed bookings yet.</p>}
              </Panel>
              <Panel title="Category table" flush>
                <DataTable
                  rows={r.shares}
                  getRowId={(x) => x.name}
                  emptyMessage="No completed bookings yet."
                  columns={[
                    { key: 'name', header: 'Category', render: (x) => x.name },
                    { key: 'percent', header: 'Share', align: 'right', render: (x) => formatPercent(x.percent) },
                    { key: 'revenue', header: 'Revenue', align: 'right', render: (x) => formatCurrency((r.totalRevenue * x.percent) / 100) },
                  ]}
                />
              </Panel>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
