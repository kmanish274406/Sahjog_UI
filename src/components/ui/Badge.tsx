import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export interface BadgeProps {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={clsx(styles.badge, styles[tone])}>{children}</span>
}
