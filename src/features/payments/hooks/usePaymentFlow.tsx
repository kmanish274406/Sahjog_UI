import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api'
import type { PaymentOrderDto } from '@/api/types'
import { Alert, Button, Modal } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

export type PaymentOutcome = 'paid' | 'failed' | 'cancelled'

interface Pending {
  order: PaymentOrderDto
  resolve: (outcome: PaymentOutcome) => void
}

const POLL_MS = 2500

/**
 * Takes an online payment. `pay(order)` opens the API's hosted checkout page (Razorpay, or the look-alike Test checkout) in a
 * dialog, asks the server every few seconds whether the order is Paid, and resolves when it is, fails or the person closes it.
 * Render `dialog` once in the page. An order is only ever trusted as Paid because the server says so.
 */
export function usePaymentFlow(): {
  pay: (order: PaymentOrderDto) => Promise<PaymentOutcome>
  dialog: ReactNode
} {
  const [pending, setPending] = useState<Pending | null>(null)
  const [status, setStatus] = useState('Created')
  const settled = useRef(false)

  const finish = useCallback((outcome: PaymentOutcome) => {
    if (settled.current) return
    settled.current = true
    setPending((current) => {
      current?.resolve(outcome)
      return null
    })
  }, [])

  const pay = useCallback(
    (order: PaymentOrderDto) =>
      new Promise<PaymentOutcome>((resolve) => {
        settled.current = false
        setStatus(order.status)
        setPending({ order, resolve })
      }),
    [],
  )

  const orderId = pending?.order.id
  useEffect(() => {
    if (!orderId) return
    let stopped = false
    const poll = async () => {
      try {
        const latest = await api.payments.get(orderId)
        if (stopped) return
        setStatus(latest.status)
        if (latest.status === 'Paid') finish('paid')
        else if (latest.status === 'Failed') finish('failed')
      } catch {
        // A missed poll is harmless; the next one tries again.
      }
    }
    const timer = window.setInterval(poll, POLL_MS)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [orderId, finish])

  const dialog = (
    <Modal
      open={pending !== null}
      title="Complete your payment"
      onClose={() => finish('cancelled')}
      wide
    >
      {pending && (
        <div style={{ display: 'grid', gap: 12 }}>
          <p>
            Pay <strong>{formatCurrency(pending.order.amount)}</strong> by {pending.order.method}.
            This window closes by itself once the payment is received.
          </p>
          {pending.order.provider === 'Test' && (
            <Alert tone="info">
              Test mode: no real money is charged. Use the buttons on the page to approve or fail
              the payment.
            </Alert>
          )}
          <iframe
            title="Payment"
            src={pending.order.checkoutUrl}
            style={{
              width: '100%',
              height: 520,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Status: {status}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={pending.order.checkoutUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  Open in a new tab
                </Button>
              </a>
              <Button variant="ghost" size="sm" onClick={() => finish('cancelled')}>
                Cancel payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )

  return { pay, dialog }
}
