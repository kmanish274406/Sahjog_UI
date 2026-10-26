import clsx from 'clsx'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { CouponResult, PlaceBookingRequest } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Button, Checkbox, Input, Panel, Select, Textarea } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { bookingPath } from '@/config/routes'
import { PlaceSearch } from '@/features/addresses/components/PlaceSearch'
import { fill, useContent, useSettings } from '@/features/catalog/hooks/useCatalog'
import { usePaymentFlow } from '@/features/payments/hooks/usePaymentFlow'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { ApiError } from '@/lib/api-error'
import { toast } from '@/store/toast.store'
import shared from '@/styles/shared.module.css'
import { formatCurrency, toIsoDay } from '@/utils/format'
import { cartSubtotal, useCartStore } from '../store/cart.store'
import styles from './CheckoutPage.module.css'

const NEW_ADDRESS = 'new'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const update = useCartStore((state) => state.update)
  const removeItem = useCartStore((state) => state.remove)

  const profile = useApiQuery(['profile'], api.auth.me)
  const addresses = useApiQuery(['addresses'], api.customer.addresses)
  const settings = useSettings()
  const content = useContent()
  const { pay, dialog } = usePaymentFlow()

  const [addressId, setAddressId] = useState<string>('')
  const [newText, setNewText] = useState('')
  const [newLabel, setNewLabel] = useState('Home')
  const [saveNew, setSaveNew] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [method, setMethod] = useState('')
  const [progress, setProgress] = useState('')
  // A booking can be made for today and up to 60 days ahead; worked out once, not on every render.
  const [window_] = useState(() => ({
    today: toIsoDay(new Date()),
    last: toIsoDay(new Date(Date.now() + 60 * 86_400_000)),
  }))

  const checkCoupon = useApiMutation((code: string) => api.customer.checkCoupon(code), {
    meta: { inline: true },
    onSuccess: setCoupon,
  })

  const selected = addresses.data?.find((a) => String(a.id) === addressId)
  const usingNew = addressId === NEW_ADDRESS || (addresses.data?.length === 0 && !selected)
  const addressText = (selected?.text ?? (usingNew ? newText : '')).trim()

  const place = useApiMutation(
    async () => {
      if (!settings.data) throw new ApiError('Settings are still loading.')
      const online = settings.data.onlinePayments && method !== 'Wallet'
      if (usingNew && saveNew)
        await api.customer.addAddress({ label: newLabel.trim() || 'Home', text: addressText })

      const placed: string[] = []
      for (const [index, item] of items.entries()) {
        setProgress(
          items.length > 1 ? `Booking ${index + 1} of ${items.length}…` : 'Placing your booking…',
        )
        const request: PlaceBookingRequest = {
          vendorServiceId: item.vendorServiceId,
          serviceItemId: item.serviceItemId,
          date: item.date,
          time: item.time,
          qty: item.qty,
          address: addressText,
          notes: item.notes.trim() || undefined,
          // The coupon is for the first booking only; the server refuses it a second time.
          couponCode: index === 0 && coupon?.valid ? couponCode.trim() : undefined,
          payMethod: method,
        }
        if (online) {
          setProgress(
            `Waiting for your payment${items.length > 1 ? ` (${index + 1} of ${items.length})` : ''}…`,
          )
          const order = await api.payments.forBooking(request)
          const outcome = await pay(order)
          if (outcome === 'failed')
            throw new ApiError(
              'The payment did not go through. You have not been charged; please try again.',
            )
          if (outcome === 'cancelled')
            throw new ApiError('Payment cancelled. Nothing was booked for this service.')
          request.paymentId = order.id
        }
        const result = await api.bookings.place(request)
        placed.push(result.booking.id)
        removeItem(item.id)
      }
      return placed
    },
    {
      meta: { inline: true },
      onSuccess: (codes) => {
        toast.success(
          codes.length === 1
            ? `Booking ${codes[0]} confirmed.`
            : `${codes.length} bookings confirmed.`,
        )
        navigate(codes.length === 1 ? bookingPath(codes[0]!) : ROUTES.bookings, { replace: true })
      },
      onSettled: () => setProgress(''),
    },
  )

  if (items.length === 0 && !place.isPending && !place.isSuccess)
    return <Navigate to={ROUTES.cart} replace />

  const fee = settings.data?.platformFee ?? 0
  const subtotal = cartSubtotal(items)
  const discount = coupon?.valid ? coupon.discount : 0
  const total = Math.max(0, subtotal + fee * items.length - discount)

  const methods = Object.entries(settings.data?.paymentMethods ?? {})
    .filter(([, on]) => on)
    .map(([name]) => name)
  const wallet = profile.data?.wallet ?? 0
  const couponAvailable =
    settings.data?.features.coupon && settings.data.couponCode !== '' && !profile.data?.couponUsed

  const slotOptions = content.slots.flatMap((group) =>
    group.times.map((t) => ({ value: t, label: `${group.part} · ${t}` })),
  )
  const missing = items.some((i) => !i.date || !i.time)
    ? 'Choose a day and time for every service.'
    : addressText.length < 8
      ? 'Choose or enter an address.'
      : !method
        ? 'Choose how you want to pay.'
        : ''

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Date, address & payment"
        description="Almost done: tell us when and where, then pay."
      />
      <QueryState
        isLoading={settings.isLoading || profile.isLoading || addresses.isLoading}
        error={settings.error ?? profile.error ?? addresses.error}
      >
        <div className={styles.layout}>
          <div className={shared.stack}>
            <Panel
              title="1. When should the technician come?"
              subtitle={content.text('app', 'slot-note')}
            >
              <div className={shared.stack}>
                {items.map((item) => (
                  <div key={item.id} className={styles.slotRow}>
                    <strong className={styles.slotName}>
                      <span aria-hidden="true">{item.emoji}</span> {item.serviceName}
                      <span className={shared.muted}> × {item.qty}</span>
                    </strong>
                    <Input
                      label="Day"
                      type="date"
                      min={window_.today}
                      max={window_.last}
                      value={item.date}
                      onChange={(e) => update(item.id, { date: e.target.value })}
                    />
                    <Select
                      label="Time"
                      placeholder="Choose a time"
                      value={item.time}
                      onChange={(e) => update(item.id, { time: e.target.value })}
                      options={slotOptions}
                    />
                    <Input
                      label="Notes for the technician"
                      placeholder="Optional"
                      maxLength={300}
                      value={item.notes}
                      onChange={(e) => update(item.id, { notes: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="2. Where?">
              <div className={shared.stackTight}>
                {(addresses.data?.length ?? 0) > 0 && (
                  <Select
                    label="Saved addresses"
                    placeholder="Choose a saved address"
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                    options={[
                      ...(addresses.data ?? []).map((a) => ({
                        value: String(a.id),
                        label: `${a.label}: ${a.text}`,
                      })),
                      { value: NEW_ADDRESS, label: 'Use a different address…' },
                    ]}
                  />
                )}
                {selected && <p className={shared.muted}>{selected.text}</p>}
                {usingNew && (
                  <>
                    <PlaceSearch onPick={setNewText} />
                    <Textarea
                      label="Full address"
                      required
                      rows={3}
                      hint="House number, building, area and city."
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      maxLength={300}
                    />
                    <div className={shared.row}>
                      <Checkbox
                        label="Save this address"
                        checked={saveNew}
                        onChange={(e) => setSaveNew(e.target.checked)}
                      />
                      {saveNew && (
                        <Input
                          label="Label"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          maxLength={40}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </Panel>

            <Panel title="3. Payment">
              <div className={shared.stackTight}>
                {couponAvailable && (
                  <div className={shared.row} style={{ alignItems: 'flex-start' }}>
                    <Input
                      label="Coupon code"
                      hint={fill(content.text('offer', 'first', 'Flat {amount} OFF'), {
                        amount: formatCurrency(settings.data?.couponAmount ?? 0),
                      })}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value)
                        setCoupon(null)
                      }}
                    />
                    <Button
                      variant="secondary"
                      style={{ marginTop: 22 }}
                      loading={checkCoupon.isPending}
                      disabled={!couponCode.trim()}
                      onClick={() => checkCoupon.mutate(couponCode.trim())}
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {coupon && (
                  <Alert tone={coupon.valid ? 'success' : 'danger'}>
                    {coupon.message ||
                      (coupon.valid
                        ? `${formatCurrency(coupon.discount)} off your first booking.`
                        : 'That code cannot be used.')}
                  </Alert>
                )}
                {checkCoupon.isError && <Alert tone="danger">{checkCoupon.error.message}</Alert>}

                <div role="radiogroup" aria-label="Payment method" className={styles.methods}>
                  {methods.map((name) => {
                    const row = content.row('payment', name)
                    const insufficient = name === 'Wallet' && wallet < total
                    return (
                      <label
                        key={name}
                        className={clsx(
                          styles.method,
                          method === name && styles.methodOn,
                          insufficient && styles.methodOff,
                        )}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={name}
                          checked={method === name}
                          disabled={insufficient}
                          onChange={() => setMethod(name)}
                        />
                        <span>
                          <strong>{row?.title || name}</strong>
                          <span className={shared.muted}>
                            {' '}
                            {fill(row?.text ?? '', { balance: formatCurrency(wallet) })}
                            {insufficient && ' (not enough balance)'}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {settings.data?.onlinePayments && settings.data.paymentProvider === 'Test' && (
                  <p className={`${shared.muted} ${shared.small}`}>
                    {content.text('app', 'test-payment')}
                  </p>
                )}
              </div>
            </Panel>
          </div>

          <div className={styles.aside}>
            <Panel title="Order summary">
              <table className={shared.ledger}>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.serviceName} × {i.qty}
                      </td>
                      <td>{formatCurrency(i.price * i.qty)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Platform fee</td>
                    <td>{formatCurrency(fee * items.length)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td>Coupon</td>
                      <td className={shared.positive}>− {formatCurrency(discount)}</td>
                    </tr>
                  )}
                  <tr className={shared.total}>
                    <td>Total</td>
                    <td>{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>
              {place.isError && (
                <div style={{ marginTop: 12 }}>
                  <Alert tone="danger">{place.error.message}</Alert>
                </div>
              )}
              {missing && !place.isPending && (
                <p className={`${shared.muted} ${shared.small}`} style={{ marginTop: 12 }}>
                  {missing}
                </p>
              )}
              <div className={shared.formActions}>
                <Link to={ROUTES.cart}>
                  <Button variant="secondary">Back to cart</Button>
                </Link>
                <Button
                  loading={place.isPending}
                  disabled={missing !== ''}
                  onClick={() => place.mutate(undefined)}
                >
                  {method === 'Wallet' ? 'Confirm booking' : 'Pay & confirm'}
                </Button>
              </div>
              {progress && (
                <p className={shared.muted} role="status">
                  {progress}
                </p>
              )}
            </Panel>
          </div>
        </div>
      </QueryState>
      {dialog}
    </div>
  )
}
