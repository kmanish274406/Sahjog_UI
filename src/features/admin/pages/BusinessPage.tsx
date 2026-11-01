import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, DescriptionList, Panel } from '@/components/ui'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

/** A client's own record: who owns it, the code customers use, and the features enabled by the platform owner. */
export default function BusinessPage() {
  const tenant = useApiQuery(['admin', 'tenant'], api.tenant.mine)
  const t = tenant.data
  const enabledFeatures =
    t?.featureDefs?.filter((feature) => t.features[feature.code] === true) ?? []

  return (
    <div className={shared.stack}>
      <PageHeader title="My business" description="Your business on the Sahjog platform." />
      <QueryState isLoading={tenant.isLoading} error={tenant.error}>
        {t && (
          <>
            <Panel
              title={t.name}
              actions={
                <Badge tone={t.isActive ? 'success' : 'danger'}>
                  {t.isActive ? 'Active' : 'Switched off'}
                </Badge>
              }
            >
              <DescriptionList
                columns={3}
                items={[
                  { label: 'Business code', value: <span className={shared.mono}>{t.code}</span> },
                  { label: 'Business ID', value: t.id },
                  { label: 'Created', value: formatDate(t.createdAt) },
                  { label: 'Owner', value: t.ownerName || '-' },
                  { label: 'Owner email', value: t.ownerEmail || '-' },
                  { label: 'Owner phone', value: t.ownerPhone || '-' },
                  { label: 'Admin sign-in', value: t.adminEmail },
                ]}
              />
            </Panel>
            {enabledFeatures.length > 0 && (
              <Panel
                title="Features"
                subtitle="Features enabled for this business by the platform owner."
              >
                <ul className={shared.list}>
                  {enabledFeatures.map((feature) => (
                    <li key={feature.code} className={shared.spread}>
                      <span>{feature.name}</span>
                      <Badge tone="success">On</Badge>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}
