import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { DescriptionList, Panel } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import type { BookingStage } from '@/domain/types'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { BookingActions } from '../components/BookingActions'
import { BookingProgress } from '../components/BookingProgress'
import { StageBadge } from '../components/StageBadge'

export default function BookingDetailPage() {
  const { code = '' } = useParams()
  const user = useAuthStore((state) => state.user)!
  const role = user.role === 'super_admin' ? 'admin' : user.role
  const booking = useApiQuery(['bookings', code], () => api.bookings.get(code), {
    refetchInterval: 15_000,
  })
  const b = booking.data

  return (
    <div className={shared.stack}>
      <Link to={ROUTES.bookings} className={shared.link}>
        <ArrowLeft size={14} aria-hidden="true" /> Back to bookings
      </Link>
      <QueryState isLoading={booking.isLoading} error={booking.error}>
        {b && (
          <>
            <PageHeader
              title={`${b.emoji} ${b.service}`}
              description={`Booking ${b.id} · placed ${formatDateTime(b.createdAt)}`}
              actions={<StageBadge stage={b.stage} />}
            />
            <Panel>
              <BookingProgress stage={b.stage as BookingStage} />
            </Panel>

            <BookingActions booking={b} role={role} meId={user.id} />

            <div className={shared.grid2}>
              <Panel title="Details">
                <DescriptionList
                  columns={2}
                  items={[
                    { label: 'Day', value: formatDate(b.date) },
                    { label: 'Time', value: b.time },
                    { label: 'Address', value: b.address },
                    { label: 'Notes', value: b.notes || '-' },
                    ...(role !== 'customer'
                      ? [
                          {
                            label: 'Customer',
                            value: `${b.customer}${b.phone ? ` · ${b.phone}` : ''}`,
                          },
                        ]
                      : []),
                    { label: 'Provider', value: b.provider || 'Open job' },
                    { label: 'Technician', value: b.technician ?? 'Not assigned yet' },
                    { label: 'Distance', value: b.distance || '-' },
                  ]}
                />
              </Panel>

              <Panel title="Payment">
                <table className={shared.ledger}>
                  <tbody>
                    <tr>
                      <td>Service</td>
                      <td>{formatCurrency(b.amount)}</td>
                    </tr>
                    <tr>
                      <td>Platform fee</td>
                      <td>{formatCurrency(b.fee)}</td>
                    </tr>
                    {b.discount > 0 && (
                      <tr>
                        <td>Coupon</td>
                        <td className={shared.positive}>− {formatCurrency(b.discount)}</td>
                      </tr>
                    )}
                    <tr className={shared.total}>
                      <td>Total</td>
                      <td>{formatCurrency(b.total)}</td>
                    </tr>
                    {b.cancelFee > 0 && (
                      <tr>
                        <td>Cancellation charge</td>
                        <td className={shared.negative}>{formatCurrency(b.cancelFee)}</td>
                      </tr>
                    )}
                    {(role === 'vendor' || role === 'admin') && b.stage === 'Completed' && (
                      <tr>
                        <td>Platform commission</td>
                        <td>{formatCurrency(b.commission)}</td>
                      </tr>
                    )}
                    {role === 'technician' && b.stage === 'Completed' && (
                      <tr>
                        <td>Your earning</td>
                        <td className={shared.positive}>{formatCurrency(b.techEarning)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className={`${shared.muted} ${shared.small}`} style={{ marginTop: 8 }}>
                  Paid with {b.paidWith || '-'}.
                </p>
              </Panel>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
