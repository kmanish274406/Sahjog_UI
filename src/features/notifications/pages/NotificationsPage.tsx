import { Bell, X } from 'lucide-react'
import { api } from '@/api'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Panel } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { usePermission } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'
import { formatDateTime } from '@/utils/format'

export default function NotificationsPage() {
  const role = useAuthStore((state) => state.user?.role)
  const can = usePermission()
  const canEdit = role !== 'admin' || can(PERMISSIONS.notificationEdit)
  const notices = useApiQuery(['notifications'], api.notifications.list, {
    refetchInterval: 30_000,
  })
  const markRead = useApiMutation(api.notifications.markRead)
  const dismiss = useApiMutation((id: number) => api.notifications.dismiss(id))
  const clear = useApiMutation(api.notifications.clear, {
    meta: { success: 'Notifications cleared.' },
  })
  const data = notices.data

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Notifications"
        description="Updates about your bookings, payments and account."
        actions={
          canEdit ? (
            <span className={shared.row}>
              <Button
                variant="secondary"
                onClick={() => markRead.mutate(undefined)}
                disabled={!data || data.unread === 0}
                loading={markRead.isPending}
              >
                Mark all as read
              </Button>
              <Button
                variant="secondary"
                onClick={() => clear.mutate(undefined)}
                disabled={!data || data.items.length === 0}
                loading={clear.isPending}
              >
                Clear all
              </Button>
            </span>
          ) : undefined
        }
      />
      <QueryState isLoading={notices.isLoading} error={notices.error}>
        <Panel flush>
          {data && data.items.length === 0 ? (
            <EmptyState icon={Bell} title="You are all caught up">
              New updates will appear here.
            </EmptyState>
          ) : (
            <ul className={shared.list} style={{ gap: 0 }}>
              {data?.items.map((n) => (
                <li
                  key={n.id}
                  className={shared.spread}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    background: n.unread ? 'var(--color-primary-soft)' : undefined,
                  }}
                >
                  <div>
                    <p>
                      {n.text} {n.unread && <Badge tone="accent">New</Badge>}
                    </p>
                    <p className={`${shared.muted} ${shared.small}`}>{formatDateTime(n.when)}</p>
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Dismiss"
                      onClick={() => dismiss.mutate(n.id)}
                      disabled={dismiss.isPending}
                    >
                      <X size={15} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </QueryState>
    </div>
  )
}
