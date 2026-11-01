import { useState } from 'react'
import { api } from '@/api'
import type { PlanDto, SettingsDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Button, Input, Panel, Tabs, Toggle } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { CANCEL_STAGE_LABELS } from '@/domain/constants'
import { collect, feeProblem, optionalPercentProblem } from '@/domain/form-rules'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { useLookups } from '@/hooks/useLookups'
import { usePermission } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'

type SettingsTab = 'fees' | 'cancellation' | 'payments' | 'coupon' | 'referral' | 'plans'

/** Tab ids with their fallback names; the names are read from the lookup table (label rows `settings.tab.<id>`). */
const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'fees', label: 'Fees & commission' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'payments', label: 'Payment methods' },
  { id: 'coupon', label: 'Coupon' },
  { id: 'referral', label: 'Refer & earn' },
  { id: 'plans', label: 'Subscriptions' },
]

export default function SettingsPage() {
  // Admin edits the live settings, so they are read fresh rather than from the customers' cached copy.
  const settings = useApiQuery(['admin', 'settings'], api.catalog.settings, { staleTime: 0 })
  const plans = useApiQuery(['admin', 'plans'], () => api.catalog.plans(), { staleTime: 0 })
  const [tab, setTab] = useState<SettingsTab>('fees')

  // The platform owner decides which of these the business's admin gets.
  const features = settings.data?.features
  // A tab also needs the person's own permission, on top of the owner's switch for the business.
  const can = usePermission()
  const allowed: Record<SettingsTab, boolean> = {
    fees: can(PERMISSIONS.feesView) || can(PERMISSIONS.feesEdit),
    cancellation: can(PERMISSIONS.feesView) || can(PERMISSIONS.feesEdit),
    payments:
      (can(PERMISSIONS.paymentMethodView) || can(PERMISSIONS.paymentMethodEdit)) &&
      (features?.paymentMethods ?? false),
    coupon:
      (can(PERMISSIONS.couponView) || can(PERMISSIONS.couponEdit)) && (features?.coupon ?? false),
    referral:
      (can(PERMISSIONS.referralView) || can(PERMISSIONS.referralEdit)) &&
      (features?.referral ?? false),
    plans:
      (can(PERMISSIONS.planView) || can(PERMISSIONS.planEdit)) &&
      (features?.subscriptions ?? false),
  }
  const lookups = useLookups()
  const tabs = TABS.filter((t) => allowed[t.id]).map((t) => ({
    ...t,
    label: lookups.text('label', `settings.tab.${t.id}`, t.label),
  }))
  const current = allowed[tab] ? tab : (tabs[0]?.id ?? null)

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Fees & policies"
        description="What customers pay, what is kept on a cancellation and how you get paid."
      />
      <QueryState
        isLoading={settings.isLoading || plans.isLoading}
        error={settings.error ?? plans.error}
      >
        {tabs.length > 0 && (
          <Tabs items={tabs} active={current!} onChange={setTab} label="Settings" />
        )}
        {tabs.length === 0 && (
          <Alert tone="info">
            {can.loaded
              ? 'No settings are available with your current permissions and enabled features.'
              : 'Checking your settings permissions…'}
          </Alert>
        )}
        {/* Every form stays mounted so unsaved edits survive a switch of tab. */}
        {settings.data && current && (
          <>
            {allowed.fees && (
              <div hidden={current !== 'fees'}>
                <FeesForm settings={settings.data} canEdit={can(PERMISSIONS.feesEdit)} />
              </div>
            )}
            {allowed.cancellation && (
              <div hidden={current !== 'cancellation'}>
                <CancellationForm settings={settings.data} canEdit={can(PERMISSIONS.feesEdit)} />
              </div>
            )}
            {allowed.payments && (
              <div hidden={current !== 'payments'}>
                <PaymentMethodsForm
                  settings={settings.data}
                  canEdit={can(PERMISSIONS.paymentMethodEdit)}
                />
              </div>
            )}
            {allowed.coupon && (
              <div hidden={current !== 'coupon'}>
                <CouponForm settings={settings.data} canEdit={can(PERMISSIONS.couponEdit)} />
              </div>
            )}
            {allowed.referral && (
              <div hidden={current !== 'referral'}>
                <ReferralForm settings={settings.data} canEdit={can(PERMISSIONS.referralEdit)} />
              </div>
            )}
          </>
        )}
        {plans.data && allowed.plans && (
          <div hidden={current !== 'plans'}>
            <PlansForm plans={plans.data} canEdit={can(PERMISSIONS.planEdit)} />
          </div>
        )}
      </QueryState>
    </div>
  )
}

function SaveRow({
  pending,
  error,
  label = 'Save changes',
  disabled,
}: {
  pending: boolean
  error?: string
  label?: string
  disabled?: boolean
}) {
  return (
    <>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className={shared.formActions}>
        <Button type="submit" loading={pending} disabled={disabled}>
          {label}
        </Button>
      </div>
    </>
  )
}

function FeesForm({ settings, canEdit }: { settings: SettingsDto; canEdit: boolean }) {
  const [fee, setFee] = useState(String(settings.platformFee))
  const [commission, setCommission] = useState(String(settings.defaultCommission))
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect({
    fee: feeProblem(fee, 'platform fee', 10_000),
    commission:
      commission.trim() === ''
        ? 'Enter the default commission.'
        : optionalPercentProblem(commission),
  })
  const save = useApiMutation(
    () =>
      api.admin.updateSettings({ platformFee: Number(fee), defaultCommission: Number(commission) }),
    {
      meta: { inline: true, success: 'Fees saved.' },
    },
  )
  return (
    <Panel title="Platform fee & commission">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (Object.keys(errors).length > 0) return setShowErrors(true)
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Platform fee per booking (₹)"
            type="number"
            min={0}
            step="1"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            disabled={!canEdit}
            error={showErrors ? errors.fee : undefined}
            hint="Added to every booking and paid by the customer."
          />
          <Input
            label="Default commission (%)"
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            disabled={!canEdit}
            error={showErrors ? errors.commission : undefined}
            hint="Taken from the vendor on a completed job, unless a service has its own."
          />
        </div>
        {canEdit && <SaveRow pending={save.isPending} error={save.error?.message} />}
      </form>
    </Panel>
  )
}

function CancellationForm({ settings, canEdit }: { settings: SettingsDto; canEdit: boolean }) {
  const lookups = useLookups()
  const [values, setValues] = useState(
    CANCEL_STAGE_LABELS.map((_, i) => String(settings.cancelPercents[i] ?? 0)),
  )
  const save = useApiMutation(
    () => api.admin.updateSettings({ cancelPercents: values.map(Number) }),
    {
      meta: { inline: true, success: 'Cancellation charges saved.' },
    },
  )
  const invalid = values.some((v) => v === '' || Number(v) < 0 || Number(v) > 100)
  return (
    <Panel
      title="Cancellation charges"
      subtitle="The percentage of the booking amount kept when a customer cancels, by how far the job has got."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          {CANCEL_STAGE_LABELS.map((fallback, i) => (
            <Input
              key={fallback}
              label={lookups.text('cancelStage', String(i), fallback)}
              type="number"
              min={0}
              max={100}
              step="1"
              value={values[i]}
              onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
              disabled={!canEdit}
              hint="% kept"
            />
          ))}
        </div>
        {canEdit && (
          <SaveRow pending={save.isPending} error={save.error?.message} disabled={invalid} />
        )}
      </form>
    </Panel>
  )
}

function PaymentMethodsForm({ settings, canEdit }: { settings: SettingsDto; canEdit: boolean }) {
  const [methods, setMethods] = useState(settings.paymentMethods)
  const save = useApiMutation(() => api.admin.updateSettings({ paymentMethods: methods }), {
    meta: { inline: true, success: 'Payment methods saved.' },
  })
  return (
    <Panel
      title="Payment methods"
      subtitle={`Online payments run through the ${settings.paymentProvider || 'built-in'} gateway${settings.paymentProvider === 'Test' ? ' (test mode: no real money moves)' : ''}.`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <div className={shared.stackTight}>
          {Object.keys(methods).map((name) => (
            <div key={name} className={shared.spread}>
              <span>{settings.paymentMethodLabels?.[name] ?? name}</span>
              {canEdit ? (
                <Toggle
                  label={settings.paymentMethodLabels?.[name] ?? name}
                  checked={methods[name] === true}
                  onChange={(on) => setMethods({ ...methods, [name]: on })}
                />
              ) : (
                <span>{methods[name] ? 'On' : 'Off'}</span>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <SaveRow
            pending={save.isPending}
            error={save.error?.message}
            disabled={!Object.values(methods).some(Boolean)}
          />
        )}
      </form>
    </Panel>
  )
}

function CouponForm({ settings, canEdit }: { settings: SettingsDto; canEdit: boolean }) {
  const [code, setCode] = useState(settings.couponCode)
  const [amount, setAmount] = useState(String(settings.couponAmount))
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect({
    code:
      code.trim() !== '' && !/^[A-Z0-9_-]{3,30}$/.test(code.trim())
        ? 'Use 3 to 30 letters, digits, - or _ (no spaces), or leave empty to switch it off.'
        : undefined,
    amount:
      code.trim() !== '' && !(Number(amount) > 0)
        ? 'Enter a discount above 0, or clear the code.'
        : feeProblem(amount, 'discount', 100_000),
  })
  const save = useApiMutation(
    () => api.admin.updateSettings({ couponCode: code.trim(), couponAmount: Number(amount) }),
    {
      meta: { inline: true, success: 'Coupon saved.' },
    },
  )
  return (
    <Panel
      title="First-booking coupon"
      subtitle="Customers type this code in the cart. Leave the code empty to switch the coupon off."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (Object.keys(errors).length > 0) return setShowErrors(true)
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={!canEdit}
            maxLength={30}
            error={showErrors ? errors.code : undefined}
          />
          <Input
            label="Discount (₹)"
            type="number"
            min={0}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canEdit}
            error={showErrors ? errors.amount : undefined}
          />
        </div>
        {canEdit && <SaveRow pending={save.isPending} error={save.error?.message} />}
      </form>
    </Panel>
  )
}

function ReferralForm({ settings, canEdit }: { settings: SettingsDto; canEdit: boolean }) {
  const [referrerReward, setReferrerReward] = useState(String(settings.referrerReward))
  const [refereeReward, setRefereeReward] = useState(String(settings.refereeReward))
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect({
    referrerReward: feeProblem(referrerReward, 'referrer reward', 5_000),
    refereeReward: feeProblem(refereeReward, 'new-customer reward', 5_000),
  })
  const save = useApiMutation(
    () =>
      api.admin.updateSettings({
        referrerReward: Number(referrerReward),
        refereeReward: Number(refereeReward),
      }),
    {
      meta: { inline: true, success: 'Referral rewards saved.' },
    },
  )
  return (
    <Panel
      title="Refer & earn"
      subtitle="Wallet rewards paid to the referrer and new customer after the new customer's first completed booking. Set either reward to 0 to disable that payout."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (Object.keys(errors).length > 0) return setShowErrors(true)
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Reward for referrer (₹)"
            type="number"
            min={0}
            max={5_000}
            step="0.01"
            value={referrerReward}
            onChange={(e) => setReferrerReward(e.target.value)}
            disabled={!canEdit}
            error={showErrors ? errors.referrerReward : undefined}
          />
          <Input
            label="Reward for new customer (₹)"
            type="number"
            min={0}
            max={5_000}
            step="0.01"
            value={refereeReward}
            onChange={(e) => setRefereeReward(e.target.value)}
            disabled={!canEdit}
            error={showErrors ? errors.refereeReward : undefined}
          />
        </div>
        {canEdit && <SaveRow pending={save.isPending} error={save.error?.message} />}
      </form>
    </Panel>
  )
}

function PlansForm({ plans, canEdit }: { plans: PlanDto[]; canEdit: boolean }) {
  const lookups = useLookups()
  // The plan kinds come from the lookup table; the fallback keeps the page working until it loads.
  const kinds = lookups.list('planKind').length
    ? lookups.list('planKind')
    : [
        { code: 'Vendor', label: 'Vendor' },
        { code: 'Technician', label: 'Technician' },
      ]
  const [prices, setPrices] = useState(
    Object.fromEntries(plans.map((p) => [p.id, String(p.price)])),
  )
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect(
    Object.fromEntries(plans.map((p) => [p.id, feeProblem(prices[p.id] ?? '', 'fee', 100_000)])),
  )
  const save = useApiMutation(
    () => api.admin.updatePlans(plans.map((p) => ({ planId: p.id, price: Number(prices[p.id]) }))),
    {
      meta: { inline: true, success: 'Subscription fees saved.' },
    },
  )
  return (
    <Panel title="Subscription fees" subtitle="What vendors and technicians pay to stay listed.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (Object.keys(errors).length > 0) return setShowErrors(true)
          save.mutate(undefined)
        }}
      >
        {kinds.map(({ code: kind, label }) => (
          <div key={kind} style={{ marginBottom: 16 }}>
            <p className={shared.sectionTitle}>{label} plans</p>
            <div className={shared.grid3}>
              {plans
                .filter((p) => p.kind === kind)
                .map((p) => (
                  <Input
                    key={p.id}
                    label={`${p.name} (per ${p.period})`}
                    type="number"
                    min={0}
                    step="1"
                    value={prices[p.id]}
                    onChange={(e) => setPrices({ ...prices, [p.id]: e.target.value })}
                    disabled={!canEdit}
                    error={showErrors ? errors[p.id] : undefined}
                    hint={p.save || undefined}
                  />
                ))}
            </div>
          </div>
        ))}
        {canEdit && (
          <SaveRow
            pending={save.isPending}
            error={save.error?.message}
            label="Save subscription fees"
          />
        )}
      </form>
    </Panel>
  )
}
