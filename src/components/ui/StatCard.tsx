import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from './StatCard.module.css'

export interface StatCardProps {
  label: string
  value: string
  icon?: LucideIcon
  /** Change versus the previous period, e.g. "+12.4%". */
  delta?: { text: string; trend: 'up' | 'down' }
  hint?: string
}

export function StatCard({ label, value, icon: Icon, delta, hint }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {Icon && <Icon size={18} className={styles.icon} aria-hidden="true" />}
      </div>
      <p className={styles.value}>{value}</p>
      <p className={styles.footer}>
        {delta && (
          <span className={clsx(styles.delta, delta.trend === 'up' ? styles.up : styles.down)}>
            {delta.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta.text}
          </span>
        )}
        {hint && <span className={styles.hint}>{hint}</span>}
      </p>
    </div>
  )
}
