import { useState } from 'react'
import { api } from '@/api'
import type { PaymentRowDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Input,
  Modal,
  Panel,
  SearchInput,
  Select,
} from '@/components/ui'
import type { BadgeProps, Column } from '@/components/ui'
import { amountProblem } from '@/domain/form-rules'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { PERMISSIONS } from '@/config/permissions'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDateTime } from '@/utils/format'

const TONE: Record<string, NonNullable<BadgeProps['tone']>> = {
  Paid: 'success',
  Used: 'success',
  Created: 'neutral',
  Failed: 'danger',
  Refunded: 'warning',
}

export default function PaymentsPage() {
  const payments = useApiQuery(['payments'], api.payments.list)
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [refunding, setRefunding] = useState<PaymentRowDto | null>(null)

  const rows = (payments.data ?? [])
    .filter((p) => (status ? p.status === status : true))
    .filter((p) =>
      `${p.id} ${p.user} ${p.reference} ${p.method} ${p.providerPaymentId}`
        .toLowerCase()
        .includes(term.trim().toLowerCase()),
    )

  const columns: Column<PaymentRowDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (p) => <span className={shared.nowrap}>{formatDateTime(p.date)}</span>,
    },
    {
      key: 'user',
      header: 'Paid by',
      minWidth: 130,
      render: (p) => (
        <span>
          {p.user} <span className={shared.muted}>({p.role})</span>
        </span>
      ),
    },
    { key: 'purpose', header: 'For', render: (p) => p.purpose },
    { key: 'method', header: 'Method', render: (p) => p.method },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => formatCurrency(p.amount) },
    {
      key: 'refunded',
      header: 'Refunded',
      align: 'right',
      render: (p) => (p.refunded > 0 ? formatCurrency(p.refunded) : '-'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge tone={TONE[p.status] ?? 'neutral'}>{p.status}</Badge>,
    },
    {
      key: 'ref',
      header: 'Reference',
      render: (p) => <span className={shared.mono}>{p.reference || p.id.slice(0, 8)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) =>
        (p.status === 'Paid' || p.status === 'Used') && p.refunded < p.amount ? (
          <Can permission={PERMISSIONS.paymentRefund}>
            <Button size="sm" variant="secondary" onClick={() => setRefunding(p)}>
              Refund
            </Button>
          </Can>
        ) : null,
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Payments & refunds"
        description="Every online payment taken through the gateway. Cancelled bookings are refunded automatically."
      />
      <Toolbar>
        <SearchInput
          label="Search payments"
          placeholder="Search by name, reference or method"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <Select
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={['Created', 'Paid', 'Used', 'Failed', 'Refunded'].map((s) => ({
            value: s,
            label: s,
          }))}
        />
      </Toolbar>
      <QueryState isLoading={payments.isLoading} error={payments.error}>
        <Panel flush>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(p) => p.id}
            emptyMessage="No payments found."
          />
        </Panel>
      </QueryState>
      <Modal open={refunding !== null} title="Refund payment" onClose={() => setRefunding(null)}>
        {refunding && <RefundForm payment={refunding} onDone={() => setRefunding(null)} />}
      </Modal>
    </div>
  )
}

function RefundForm({ payment, onDone }: { payment: PaymentRowDto; onDone: () => void }) {
  const left = payment.amount - payment.refunded
  const [amount, setAmount] = useState(String(left))
  const problem =
    amountProblem(amount, 'refund amount', left) ??
    (Number(amount) > left ? `You can refund at most ${formatCurrency(left)}.` : undefined)
  const refund = useApiMutation(
    () => api.payments.refund(payment.id, Number(amount) === left ? undefined : Number(amount)),
    {
      meta: { inline: true, success: 'Refund sent.' },
      onSuccess: onDone,
    },
  )
  return (
    <div className={shared.stackTight}>
      <p>
        {payment.user} paid {formatCurrency(payment.amount)} by {payment.method}. Up to{' '}
        <strong>{formatCurrency(left)}</strong> can still be refunded.
      </p>
      <Input
        label="Amount to refund (₹)"
        type="number"
        min={1}
        max={left}
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={problem}
      />
      {refund.isError && <Alert tone="danger">{refund.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button
          variant="danger"
          loading={refund.isPending}
          disabled={problem !== undefined}
          onClick={() => {
            if (window.confirm(`Refund ${formatCurrency(Number(amount))} to ${payment.user}?`))
              refund.mutate(undefined)
          }}
        >
          Send refund
        </Button>
      </div>
    </div>
  )
}
