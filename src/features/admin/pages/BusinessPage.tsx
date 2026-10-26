import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, DescriptionList, Panel } from '@/components/ui'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

/** A client's own record: who owns it, the code customers use, and which optional features the platform owner allows. */
export default function BusinessPage() {
  const tenant = useApiQuery(['admin', 'tenant'], api.tenant.mine)
  const t = tenant.data

  return (
    <div className={shared.stack}>
      <PageHeader title="My business" description="Your business on the Sahjog platform." />
      <QueryState isLoading={tenant.isLoading} error={tenant.error}>
        {t && (
          <>
            <Panel title={t.name} actions={<Badge tone={t.isActive ? 'success' : 'danger'}>{t.isActive ? 'Active' : 'Switched off'}</Badge>}>
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
            <Panel title="Features" subtitle="Set by the platform owner. A switched-off feature is hidden in the apps and refused by the server.">
              <ul className={shared.list}>
                {[
                  { label: 'Sahjog wallet', on: t.features.wallet },
                  { label: 'Coupons', on: t.features.coupon },
                  { label: 'Sign in with Google', on: t.features.googleLogin },
                ].map((f) => (
                  <li key={f.label} className={shared.spread}>
                    <span>{f.label}</span>
                    <Badge tone={f.on ? 'success' : 'neutral'}>{f.on ? 'On' : 'Off'}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </QueryState>
    </div>
  )
}
