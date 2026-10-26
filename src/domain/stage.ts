import type { BadgeProps } from '@/components/ui'
import type { BookingStage } from './types'

type Tone = NonNullable<BadgeProps['tone']>

export function stageTone(stage: BookingStage): Tone {
  switch (stage) {
    case 'Completed':
      return 'success'
    case 'InProgress':
      return 'warning'
    case 'Cancelled':
    case 'Rejected':
      return 'danger'
    case 'Assigned':
      return 'accent'
    default:
      return 'info'
  }
}

/** Still moving: not completed, cancelled or rejected. */
export const isOpen = (stage: BookingStage) =>
  stage !== 'Completed' && stage !== 'Cancelled' && stage !== 'Rejected'

/** The server lets a customer move a booking until the technician starts it. */
export const canReschedule = (stage: BookingStage) =>
  stage === 'Requested' || stage === 'Accepted' || stage === 'Assigned'

export const canCancel = isOpen
