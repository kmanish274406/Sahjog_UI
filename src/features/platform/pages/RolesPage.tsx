import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { RoleAccessDto } from '@/api/types'
import { AccessMatrix } from '@/components/access/AccessMatrix'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Button, Panel } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'

/** Super admin: choose which buttons and actions a client's Admin keeps. The platform owner always has everything. */
export default function RolesPage() {
  const role = useApiQuery(['platform', 'adminRole'], api.platform.adminRole)
  return (
    <div className={shared.stack}>
      <PageHeader
        title="Admin permissions"
        description="What a client's Admin can use. Each client's own staff roles can hold only what is ticked here; the platform owner always has everything."
      />
      <QueryState isLoading={role.isLoading} error={role.error}>
        {role.data && <AdminRoleMatrix data={role.data} />}
      </QueryState>
    </div>
  )
}

function AdminRoleMatrix({ data }: { data: RoleAccessDto }) {
  const [granted, setGranted] = useState(() => new Set(data.accessIds))
  const save = useApiMutation(() => api.platform.saveAdminRole([...granted]), {
    meta: { inline: true, success: 'Permissions saved.' },
  })
  const changed =
    granted.size !== data.accessIds.length || data.accessIds.some((id) => !granted.has(id))

  return (
    <>
      <Alert tone="info">
        These apply to every client&apos;s Admin. Changing them takes effect within a few minutes.
      </Alert>
      <Panel title="Admin" flush>
        <AccessMatrix catalog={data.catalog} granted={granted} onChange={setGranted} />
      </Panel>
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <Can permission={PERMISSIONS.adminRoleEdit}>
        <div className={shared.formActions}>
          <Button
            variant="secondary"
            disabled={!changed}
            onClick={() => setGranted(new Set(data.accessIds))}
          >
            Reset
          </Button>
          <Button
            loading={save.isPending}
            disabled={!changed}
            onClick={() => save.mutate(undefined)}
          >
            <ShieldCheck size={16} aria-hidden="true" /> Save permissions
          </Button>
        </div>
      </Can>
    </>
  )
}
