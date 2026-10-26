import { Check } from 'lucide-react'
import { api } from '@/api'
import type { PlanDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Badge, Button, Panel } from '@/components/ui'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useContent, usePlans, useSettings } from '@/features/catalog/hooks/useCatalog'
import { usePaymentFlow } from '@/features/payments/hooks/usePaymentFlow'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { ApiError } from '@/lib/api-error'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'
import styles from './PlansPage.module.css'

export default function PlansPage() {
  const role = useAuthStore((state) => state.user?.role)
  const kind = role === 'technician' ? 'Technician' : 'Vendor'
  const profile = useApiQuery(['profile'], api.auth.me)
  const plans = usePlans(kind)
  const settings = useSettings()
  const content = useContent()
  const { pay, dialog } = usePaymentFlow()

  const subscribe = useApiMutation(
    async (plan: PlanDto) => {
      let paymentId: string | undefined
      if (settings.data?.onlinePayments) {
        const order = await api.payments.forSubscription(plan.id)
        const outcome = await pay(order)
        if (outcome === 'failed')
          throw new ApiError('The payment did not go through. You have not been charged.')
        if (outcome === 'cancelled')
          throw new ApiError('Payment cancelled. Your plan was not changed.')
        paymentId = order.id
      }
      return api.subscription.subscribe(plan.id, paymentId)
    },
    { meta: { success: 'Plan activated.' } },
  )

  const me = profile.data
  const features = content.list(`plan-${kind.toLowerCase()}`)

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Subscription"
        description={
          kind === 'Vendor'
            ? 'Customers can see and book you while a plan is active.'
            : 'You can take jobs while a plan is active.'
        }
      />
      <QueryState
        isLoading={profile.isLoading || plans.isLoading}
        error={profile.error ?? plans.error}
      >
        {me?.coveredByVendor && (
          <Alert tone="success" title="Covered by your vendor">
            You work under a vendor whose plan covers you, so you do not need your own.
          </Alert>
        )}
        {me && !me.coveredByVendor && (
          <Alert
            tone={me.subscriptionActive ? 'success' : 'warning'}
            title={me.subscriptionActive ? `${me.planName} plan is active` : 'No active plan'}
          >
            {me.subscriptionActive && me.planExpiry
              ? `Valid until ${formatDate(me.planExpiry)}.`
              : 'Choose a plan below to get started.'}
          </Alert>
        )}
        <div className={shared.grid3}>
          {(plans.data ?? []).map((plan) => {
            const current = me?.planId === plan.id && me.subscriptionActive
            return (
              <Panel
                key={plan.id}
                title={plan.name}
                subtitle={`per ${plan.period}`}
                actions={plan.save ? <Badge tone="success">{plan.save}</Badge> : undefined}
              >
                <p className={styles.price}>{formatCurrency(plan.price)}</p>
                <ul className={styles.features}>
                  {features.map((f) => (
                    <li key={f.id}>
                      <Check size={15} aria-hidden="true" /> {f.title}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => subscribe.mutate(plan)}
                  loading={subscribe.isPending && subscribe.variables?.id === plan.id}
                  disabled={subscribe.isPending || me?.coveredByVendor}
                  variant={current ? 'secondary' : 'primary'}
                >
                  {current
                    ? 'Renew this plan'
                    : me?.subscriptionActive
                      ? 'Switch to this plan'
                      : 'Choose plan'}
                </Button>
              </Panel>
            )
          })}
        </div>
        {settings.data?.onlinePayments && settings.data.paymentProvider === 'Test' && (
          <p className={`${shared.muted} ${shared.small}`}>{content.text('app', 'test-payment')}</p>
        )}
      </QueryState>
      {dialog}
    </div>
  )
}
