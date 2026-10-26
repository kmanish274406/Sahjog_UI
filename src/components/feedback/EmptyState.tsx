import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
}

/** A calm "nothing here yet" block, with the next step when there is one. */
export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
        padding: '40px 16px',
        textAlign: 'center',
      }}
    >
      {Icon && <Icon size={34} style={{ color: 'var(--color-text-subtle)' }} aria-hidden="true" />}
      <h3 style={{ fontSize: 18 }}>{title}</h3>
      {children && <p style={{ maxWidth: 420, color: 'var(--color-text-muted)' }}>{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
