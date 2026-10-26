import clsx from 'clsx'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  /** Percentage; values above 100 are drawn full and marked as exceeded. */
  value: number
  label?: string
  showValue?: boolean
}

export function ProgressBar({ value, label, showValue = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const exceeded = value > 100

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={clsx(styles.fill, exceeded && styles.exceeded)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue && <span className={styles.value}>{Math.round(value)}%</span>}
    </div>
  )
}
