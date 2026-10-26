import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './Alert.module.css'

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  children?: ReactNode
  actions?: ReactNode
}

/** An inline message. Danger alerts are announced immediately; the others politely. */
export function Alert({ tone = 'info', title, children, actions }: AlertProps) {
  return (
    <div className={clsx(styles.alert, styles[tone])} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className={styles.body}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children && <div className={styles.text}>{children}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
