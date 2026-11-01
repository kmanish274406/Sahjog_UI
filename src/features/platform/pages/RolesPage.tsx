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

const REQUIRED_PLATFORM_PERMISSIONS = [
  PERMISSIONS.clientView,
  PERMISSIONS.adminRoleView,
  PERMISSIONS.adminRoleEdit,
]

/** Configure the platform owner's access and the permissions available to client admins. */
export default function RolesPage() {
  const role = useApiQuery(['platform', 'adminRole'], api.platform.adminRole)
  const platformRole = useApiQuery(['platform', 'superAdminRole'], api.platform.superAdminRole)
  return (
    <div className={shared.stack}>
      <PageHeader
        title="Access permissions"
        description="Control the platform owner's access, then choose which menus and actions each client's Admin can use."
      />
      <QueryState isLoading={platformRole.isLoading} error={platformRole.error}>
        {platformRole.data && <SuperAdminRoleMatrix data={platformRole.data} />}
      </QueryState>
      <QueryState isLoading={role.isLoading} error={role.error}>
        {role.data && <AdminRoleMatrix data={role.data} />}
      </QueryState>
    </div>
  )
}

function SuperAdminRoleMatrix({ data }: { data: RoleAccessDto }) {
  const [granted, setGranted] = useState(() => new Set(data.accessIds))
  const save = useApiMutation(() => api.platform.saveSuperAdminRole([...granted]), {
    meta: { inline: true, success: 'Platform owner permissions saved.' },
  })
  const changed =
    granted.size !== data.accessIds.length || data.accessIds.some((id) => !granted.has(id))

  return (
    <>
      <Alert tone="info">
        Optional features such as wallet, chatbot and coupons are enabled separately for each client
        on its Features panel. A disabled feature stays unavailable even if an Admin action
        permission is granted.
      </Alert>
      <Panel title="Platform owner" flush>
        <AccessMatrix
          catalog={data.catalog}
          granted={granted}
          onChange={setGranted}
          lockedAccessIds={REQUIRED_PLATFORM_PERMISSIONS}
        />
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
            <ShieldCheck size={16} aria-hidden="true" /> Save platform permissions
          </Button>
        </div>
      </Can>
    </>
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
        These control each client Admin&apos;s menus and actions. Feature switches are an additional
        gate, so disabled features stay hidden and unavailable.
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
