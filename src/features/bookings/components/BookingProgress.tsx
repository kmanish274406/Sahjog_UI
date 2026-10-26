import clsx from 'clsx'
import { Check } from 'lucide-react'
import { STAGE_FLOW, STAGE_LABELS } from '@/domain/constants'
import type { BookingStage } from '@/domain/types'
import styles from './BookingProgress.module.css'

/** The path a booking follows. A cancelled or rejected booking stops where it ended and says so. */
export function BookingProgress({ stage }: { stage: BookingStage }) {
  const failed = stage === 'Cancelled' || stage === 'Rejected'
  const reached = failed ? -1 : STAGE_FLOW.indexOf(stage)

  return (
    <ol className={styles.steps} aria-label="Booking progress">
      {STAGE_FLOW.map((step, index) => {
        const done = index < reached || (index === reached && stage === 'Completed')
        const now = index === reached && !done
        return (
          <li key={step} className={clsx(styles.step, done && styles.done, now && styles.now, failed && styles.muted)} aria-current={now ? 'step' : undefined}>
            <span className={styles.dot}>{done ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
            <span className={styles.label}>{STAGE_LABELS[step]}</span>
          </li>
        )
      })}
      {failed && (
        <li className={clsx(styles.step, styles.failed)}>
          <span className={styles.dot}>!</span>
          <span className={styles.label}>{STAGE_LABELS[stage]}</span>
        </li>
      )}
    </ol>
  )
}
