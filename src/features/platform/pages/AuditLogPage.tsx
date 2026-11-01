import { api } from '@/api'
import type { PlatformAuditLogDto } from '@/api/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryState } from '@/components/feedback/QueryState'
import { DataTable, Badge, Panel } from '@/components/ui'
import type { Column } from '@/components/ui'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatDateTime } from '@/utils/format'

export default function AuditLogPage() {
  const logs = useApiQuery(['platform', 'audit-logs'], () => api.platform.auditLogs())
  const columns: Column<PlatformAuditLogDto>[] = [
    {
      key: 'when',
      header: 'When',
      minWidth: 180,
      render: (entry) => <span className={shared.nowrap}>{formatDateTime(entry.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      minWidth: 180,
      render: (entry) => (
        <span>
          <strong>{entry.actorName}</strong>
          <br />
          <span className={`${shared.muted} ${shared.small}`}>
            {entry.platformAdminId === null
              ? 'Platform API key'
              : `Owner #${entry.platformAdminId}`}
          </span>
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (entry) => (
        <span>
          <Badge tone="neutral">{entry.httpMethod}</Badge>
          <br />
          <span className={shared.mono}>{entry.path}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Result',
      align: 'right',
      render: (entry) => (
        <Badge tone={entry.statusCode < 400 ? 'success' : 'danger'}>{entry.statusCode}</Badge>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Platform audit log"
        description="Successful platform changes, recorded with the actor, route and result."
      />
      <QueryState isLoading={logs.isLoading} error={logs.error}>
        <Panel flush>
          <DataTable
            columns={columns}
            rows={logs.data ?? []}
            getRowId={(entry) => String(entry.id)}
            emptyMessage="No platform changes have been recorded yet."
          />
        </Panel>
      </QueryState>
    </div>
  )
}
