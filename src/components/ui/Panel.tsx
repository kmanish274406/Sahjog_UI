import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './Panel.module.css'

export interface PanelProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  /** Remove body padding — use for tables that should run edge to edge. */
  flush?: boolean
  className?: string
  children: ReactNode
}

export function Panel({
  title,
  subtitle,
  actions,
  flush = false,
  className,
  children,
}: PanelProps) {
  return (
    <section className={clsx(styles.panel, className)}>
      {(title || actions) && (
        <header className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={clsx(styles.body, flush && styles.flush)}>{children}</div>
    </section>
  )
}
