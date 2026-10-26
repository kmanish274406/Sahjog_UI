import { useState } from 'react'
import { api } from '@/api'
import type { PlanDto, SettingsDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Button, Input, Panel, Toggle } from '@/components/ui'
import { CANCEL_STAGE_LABELS } from '@/domain/constants'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'

export default function SettingsPage() {
  // Admin edits the live settings, so they are read fresh rather than from the customers' cached copy.
  const settings = useApiQuery(['admin', 'settings'], api.catalog.settings, { staleTime: 0 })
  const plans = useApiQuery(['admin', 'plans'], () => api.catalog.plans(), { staleTime: 0 })

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
        {settings.data && (
          <>
            <FeesForm settings={settings.data} />
            <CancellationForm settings={settings.data} />
            <PaymentMethodsForm settings={settings.data} />
            {settings.data.features.coupon && <CouponForm settings={settings.data} />}
          </>
        )}
        {plans.data && <PlansForm plans={plans.data} />}
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

function FeesForm({ settings }: { settings: SettingsDto }) {
  const [fee, setFee] = useState(String(settings.platformFee))
  const [commission, setCommission] = useState(String(settings.defaultCommission))
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
            hint="Taken from the vendor on a completed job, unless a service has its own."
          />
        </div>
        <SaveRow
          pending={save.isPending}
          error={save.error?.message}
          disabled={fee === '' || commission === ''}
        />
      </form>
    </Panel>
  )
}

function CancellationForm({ settings }: { settings: SettingsDto }) {
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
          {CANCEL_STAGE_LABELS.map((label, i) => (
            <Input
              key={label}
              label={label}
              type="number"
              min={0}
              max={100}
              step="1"
              value={values[i]}
              onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
              hint="% kept"
            />
          ))}
        </div>
        <SaveRow pending={save.isPending} error={save.error?.message} disabled={invalid} />
      </form>
    </Panel>
  )
}

const METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI',
  QR: 'Scan a UPI QR code',
  Card: 'Credit / debit card',
  'Net Banking': 'Net banking',
  Wallet: 'Sahjog wallet',
}

function PaymentMethodsForm({ settings }: { settings: SettingsDto }) {
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
            <Toggle
              key={name}
              label={METHOD_LABELS[name] ?? name}
              checked={methods[name] === true}
              onChange={(on) => setMethods({ ...methods, [name]: on })}
            />
          ))}
        </div>
        <SaveRow
          pending={save.isPending}
          error={save.error?.message}
          disabled={!Object.values(methods).some(Boolean)}
        />
      </form>
    </Panel>
  )
}

function CouponForm({ settings }: { settings: SettingsDto }) {
  const [code, setCode] = useState(settings.couponCode)
  const [amount, setAmount] = useState(String(settings.couponAmount))
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
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={30}
          />
          <Input
            label="Discount (₹)"
            type="number"
            min={0}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <SaveRow pending={save.isPending} error={save.error?.message} />
      </form>
    </Panel>
  )
}

function PlansForm({ plans }: { plans: PlanDto[] }) {
  const [prices, setPrices] = useState(
    Object.fromEntries(plans.map((p) => [p.id, String(p.price)])),
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
          save.mutate(undefined)
        }}
      >
        {['Vendor', 'Technician'].map((kind) => (
          <div key={kind} style={{ marginBottom: 16 }}>
            <p className={shared.sectionTitle}>{kind} plans</p>
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
                    hint={p.save || undefined}
                  />
                ))}
            </div>
          </div>
        ))}
        <SaveRow
          pending={save.isPending}
          error={save.error?.message}
          label="Save subscription fees"
          disabled={Object.values(prices).some((v) => v === '')}
        />
      </form>
    </Panel>
  )
}
