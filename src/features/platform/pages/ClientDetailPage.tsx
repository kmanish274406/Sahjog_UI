import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Features } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Badge, Button, DescriptionList, Panel, Toggle } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { ROUTES } from '@/config/routes'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

export default function ClientDetailPage() {
  const { tenantId } = useParams()
  const id = Number(tenantId)
  const tenants = useApiQuery(['platform', 'tenants'], api.platform.tenants)
  const tenant = tenants.data?.find((t) => t.id === id)
  const masters = useApiQuery(['platform', 'masters'], api.platform.masters)
  const featureDefs = (masters.data?.features ?? []).filter((f) => f.active)

  const setActive = useApiMutation((active: boolean) => api.platform.setTenantActive(id, active), {
    meta: { success: 'Client updated.' },
  })
  const setFeature = useApiMutation(
    (change: Partial<Features>) => api.platform.setFeatures(id, change),
    {
      meta: { success: 'Features saved.' },
    },
  )

  return (
    <div className={shared.stack}>
      <Link to={ROUTES.clients} className={shared.link}>
        <ArrowLeft size={14} aria-hidden="true" /> All clients
      </Link>
      <QueryState isLoading={tenants.isLoading} error={tenants.error}>
        {tenant ? (
          <>
            <PageHeader
              title={tenant.name}
              description={`Business code ${tenant.code}`}
              actions={
                <Badge tone={tenant.isActive ? 'success' : 'danger'}>
                  {tenant.isActive ? 'Active' : 'Switched off'}
                </Badge>
              }
            />
            <Panel title="Owner & admin">
              <DescriptionList
                columns={3}
                items={[
                  { label: 'Owner', value: tenant.ownerName || '-' },
                  { label: 'Email', value: tenant.ownerEmail || '-' },
                  { label: 'Phone', value: tenant.ownerPhone || '-' },
                  {
                    label: 'Admin sign-in',
                    value: <span className={shared.mono}>{tenant.adminEmail}</span>,
                  },
                  { label: 'Business ID', value: tenant.id },
                  { label: 'Created', value: formatDate(tenant.createdAt) },
                ]}
              />
            </Panel>

            <Can permission={PERMISSIONS.clientFeatures}>
              <Panel
                title="Features"
                subtitle="Choose what this business's admin can see and use. A switched-off feature is hidden and refused by the server."
              >
                <div className={shared.stackTight}>
                  {featureDefs.map((f) => (
                    <Toggle
                      key={f.code}
                      label={f.name}
                      description={f.description}
                      checked={tenant.features[f.code] ?? true}
                      onChange={(on) => setFeature.mutate({ [f.code]: on })}
                    />
                  ))}
                </div>
              </Panel>
            </Can>

            <Can permission={PERMISSIONS.clientActivate}>
              <Panel title="Access">
                <div className={shared.stackTight}>
                  <Alert tone={tenant.isActive ? 'info' : 'warning'}>
                    {tenant.isActive
                      ? 'Switching this client off refuses its admin, vendors, technicians and customers until you switch it on again.'
                      : 'This client is switched off. Nobody from it can sign in or use the apps.'}
                  </Alert>
                  <div className={shared.row}>
                    <Button
                      variant={tenant.isActive ? 'danger' : 'primary'}
                      loading={setActive.isPending}
                      onClick={() => {
                        if (
                          !tenant.isActive ||
                          window.confirm(
                            `Switch off ${tenant.name}? Everyone in it loses access immediately.`,
                          )
                        )
                          setActive.mutate(!tenant.isActive)
                      }}
                    >
                      {tenant.isActive ? 'Switch client off' : 'Switch client on'}
                    </Button>
                  </div>
                </div>
              </Panel>
            </Can>
          </>
        ) : (
          <Alert tone="warning">That client was not found.</Alert>
        )}
      </QueryState>
    </div>
  )
}
