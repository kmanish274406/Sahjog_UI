import { useState } from 'react'
import { api } from '@/api'
import type { BookingDto } from '@/api/types'
import { Alert, Button, Input, Modal, Panel, Select } from '@/components/ui'
import { canCancel, canReschedule } from '@/domain/stage'
import type { BookingStage } from '@/domain/types'
import { useContent } from '@/features/catalog/hooks/useCatalog'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, toIsoDay } from '@/utils/format'

export interface BookingActionsProps {
  booking: BookingDto
  role: 'customer' | 'vendor' | 'technician' | 'admin'
  /** The signed-in person's id (a technician acts only on a job that is theirs). */
  meId: number
}

/** What the signed-in role may do to this booking right now. The API enforces the same rules. */
export function BookingActions({ booking, role, meId }: BookingActionsProps) {
  if (role === 'customer') return <CustomerActions booking={booking} />
  if (role === 'vendor') return <VendorActions booking={booking} />
  if (role === 'technician') return <TechnicianActions booking={booking} meId={meId} />
  return null
}

// ---------------------------------------------------------------- customer

function CustomerActions({ booking }: { booking: BookingDto }) {
  const stage = booking.stage as BookingStage
  const [dialog, setDialog] = useState<'reschedule' | 'cancel' | null>(null)
  const showOtp = booking.otp && (stage === 'Assigned' || stage === 'InProgress')

  if (!canReschedule(stage) && !canCancel(stage) && !showOtp) return null

  return (
    <Panel title="Manage this booking">
      <div className={shared.stack}>
        {showOtp && (
          <Alert tone="info" title="Your job-closing OTP">
            Give this code to the technician <strong>only when the work is finished</strong>:{' '}
            <strong style={{ fontSize: 20, letterSpacing: 3 }}>{booking.otp}</strong>
          </Alert>
        )}
        <div className={shared.row}>
          {canReschedule(stage) && (
            <Button variant="secondary" onClick={() => setDialog('reschedule')}>
              Reschedule
            </Button>
          )}
          {canCancel(stage) && (
            <Button variant="danger" onClick={() => setDialog('cancel')}>
              Cancel booking
            </Button>
          )}
        </div>
      </div>
      <Modal
        open={dialog === 'reschedule'}
        title="Reschedule booking"
        onClose={() => setDialog(null)}
      >
        <RescheduleForm booking={booking} onDone={() => setDialog(null)} />
      </Modal>
      <Modal open={dialog === 'cancel'} title="Cancel booking" onClose={() => setDialog(null)}>
        <CancelForm booking={booking} onDone={() => setDialog(null)} />
      </Modal>
    </Panel>
  )
}

function RescheduleForm({ booking, onDone }: { booking: BookingDto; onDone: () => void }) {
  const content = useContent()
  const [date, setDate] = useState(booking.date.slice(0, 10))
  const [time, setTime] = useState('')
  const [window_] = useState(() => ({
    today: toIsoDay(new Date()),
    last: toIsoDay(new Date(Date.now() + 60 * 86_400_000)),
  }))
  const save = useApiMutation(() => api.bookings.reschedule(booking.id, date, time), {
    meta: { inline: true, success: 'Booking rescheduled.' },
    onSuccess: onDone,
  })
  const options = content.slots.flatMap((g) =>
    g.times.map((t) => ({ value: t, label: `${g.part} · ${t}` })),
  )

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(undefined)
      }}
    >
      <Input
        label="New day"
        type="date"
        required
        min={window_.today}
        max={window_.last}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Select
        label="New time"
        required
        placeholder="Choose a time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        options={options}
      />
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Keep current time
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!date || !time}>
          Reschedule
        </Button>
      </div>
    </form>
  )
}

function CancelForm({ booking, onDone }: { booking: BookingDto; onDone: () => void }) {
  const quote = useApiQuery(['cancel-quote', booking.id, booking.stage], () =>
    api.bookings.cancelQuote(booking.id),
  )
  const cancel = useApiMutation(() => api.bookings.cancel(booking.id), {
    meta: { inline: true, success: 'Booking cancelled.' },
    onSuccess: onDone,
  })

  return (
    <div className={shared.stackTight}>
      {quote.isLoading && <p className={shared.muted}>Checking the cancellation charge…</p>}
      {quote.data && (
        <Alert
          tone={quote.data.fee > 0 ? 'warning' : 'info'}
          title="What happens if you cancel now"
        >
          {quote.data.fee > 0 ? (
            <>
              A cancellation charge of <strong>{formatCurrency(quote.data.fee)}</strong> (
              {quote.data.percent}%) applies. You get{' '}
              <strong>{formatCurrency(quote.data.refund)}</strong> back.
            </>
          ) : (
            <>
              Cancelling now is free. You get <strong>{formatCurrency(quote.data.refund)}</strong>{' '}
              back.
            </>
          )}
        </Alert>
      )}
      {quote.error && <Alert tone="danger">{quote.error.message}</Alert>}
      {cancel.isError && <Alert tone="danger">{cancel.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Keep booking
        </Button>
        <Button
          variant="danger"
          loading={cancel.isPending}
          disabled={!quote.data}
          onClick={() => cancel.mutate(undefined)}
        >
          Cancel booking
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- vendor

function VendorActions({ booking }: { booking: BookingDto }) {
  const accept = useApiMutation(() => api.bookings.accept(booking.id), {
    meta: { success: 'Order accepted. Assign a technician next.' },
  })
  const reject = useApiMutation(() => api.bookings.reject(booking.id), {
    meta: { success: 'Order rejected.' },
  })
  const [technicianId, setTechnicianId] = useState('')
  const technicians = useApiQuery(['vendor', 'technicians'], api.vendor.technicians, {
    enabled: booking.stage === 'Accepted',
  })
  const assign = useApiMutation(() => api.bookings.assign(booking.id, Number(technicianId)), {
    meta: { success: 'Technician assigned.' },
  })

  if (booking.stage === 'Requested') {
    return (
      <Panel title="Respond to this order">
        <div className={shared.row}>
          <Button
            onClick={() => accept.mutate(undefined)}
            loading={accept.isPending}
            disabled={reject.isPending}
          >
            Accept order
          </Button>
          <Button
            variant="secondary"
            onClick={() => reject.mutate(undefined)}
            loading={reject.isPending}
            disabled={accept.isPending}
          >
            Reject
          </Button>
        </div>
      </Panel>
    )
  }

  if (booking.stage === 'Accepted') {
    const active = (technicians.data ?? []).filter((t) => t.active)
    return (
      <Panel title="Assign a technician" subtitle="Pick someone from your team to do this job.">
        <div className={shared.stackTight}>
          <Select
            label="Technician"
            placeholder={technicians.isLoading ? 'Loading…' : 'Choose a technician'}
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            options={active.map((t) => ({
              value: String(t.id),
              label: `${t.name} · ${t.skill}${t.onJob ? ' (on a job)' : ''}`,
            }))}
          />
          {technicians.data && active.length === 0 && (
            <Alert tone="warning">
              You have no active technicians. Add one under My technicians.
            </Alert>
          )}
          <div className={shared.row}>
            <Button
              onClick={() => assign.mutate(undefined)}
              loading={assign.isPending}
              disabled={!technicianId}
            >
              Assign technician
            </Button>
          </div>
        </div>
      </Panel>
    )
  }

  return null
}

// ---------------------------------------------------------------- technician

function TechnicianActions({ booking, meId }: { booking: BookingDto; meId: number }) {
  const take = useApiMutation(() => api.bookings.take(booking.id), {
    meta: { success: 'Job added to My jobs.' },
  })
  const start = useApiMutation(() => api.bookings.start(booking.id), {
    meta: { success: 'Job started.' },
  })
  const [otp, setOtp] = useState(booking.otp ?? '')
  const complete = useApiMutation(() => api.bookings.complete(booking.id, otp.trim()), {
    meta: { success: 'Job completed. Well done!' },
  })
  const mine = booking.technicianId === meId

  if (booking.independent && booking.stage === 'Requested' && booking.technicianId === null) {
    return (
      <Panel
        title="Open job"
        subtitle="Anyone with an active subscription can take this job. The first to take it gets it."
      >
        <Button onClick={() => take.mutate(undefined)} loading={take.isPending}>
          Take this job
        </Button>
      </Panel>
    )
  }
  if (mine && booking.stage === 'Assigned') {
    return (
      <Panel title="Ready to start?">
        <Button onClick={() => start.mutate(undefined)} loading={start.isPending}>
          Start job
        </Button>
      </Panel>
    )
  }
  if (mine && booking.stage === 'InProgress') {
    return (
      <Panel
        title="Finish the job"
        subtitle="Ask the customer for the OTP shown in their booking once the work is done."
      >
        <form
          className={shared.stackTight}
          onSubmit={(event) => {
            event.preventDefault()
            complete.mutate(undefined)
          }}
        >
          <Input
            label="Customer OTP"
            required
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <div className={shared.row}>
            <Button type="submit" loading={complete.isPending} disabled={otp.length < 4}>
              Complete job
            </Button>
          </div>
        </form>
      </Panel>
    )
  }
  return null
}
