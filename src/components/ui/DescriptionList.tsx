import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './DescriptionList.module.css'

export interface DescriptionItem {
  label: string
  value: ReactNode
}

export interface DescriptionListProps {
  items: DescriptionItem[]
  /** Items per row on wide screens. */
  columns?: 2 | 3 | 4
  className?: string
}

/** Label / value pairs, the way a record is shown on a detail screen. */
export function DescriptionList({ items, columns = 3, className }: DescriptionListProps) {
  return (
    <dl className={clsx(styles.list, styles[`cols${columns}`], className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value ?? '-'}</dd>
        </div>
      ))}
    </dl>
  )
}
