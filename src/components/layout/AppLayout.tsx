import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { api } from '@/api'
import { Alert, Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ChatWidget } from '@/features/chat/ChatWidget'
import { useIdleLogout } from '@/features/auth/hooks/useIdleLogout'
import { useApiQuery } from '@/hooks/useApi'
import { useUiStore } from '@/store/ui.store'
import { formatDate } from '@/utils/format'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './AppLayout.module.css'

/** Tells a vendor or technician where their subscription stands, on every page: without one they cannot take work. */
function SubscriptionBanner() {
  const { data } = useApiQuery(['profile'], api.auth.me)
  const [now] = useState(() => Date.now())
  if (!data || data.coveredByVendor) return null
  if (data.subscriptionActive) {
    const expiry = data.planExpiry ? new Date(data.planExpiry) : null
    const days = expiry ? Math.ceil((expiry.getTime() - now) / 86_400_000) : 99
    if (days > 7) return null
    return (
      <Alert
        tone="warning"
        title="Your subscription ends soon"
        actions={
          <Link to={ROUTES.plans}>
            <Button size="sm">Renew now</Button>
          </Link>
        }
      >
        Your {data.planName} plan ends on {formatDate(data.planExpiry!)}.
      </Alert>
    )
  }
  return (
    <Alert
      tone="danger"
      title="No active subscription"
      actions={
        <Link to={ROUTES.plans}>
          <Button size="sm" variant="danger">
            Choose a plan
          </Button>
        </Link>
      }
    >
      Customers cannot see or book you until a plan is active.
    </Alert>
  )
}

export function AppLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const mobileOpen = useUiStore((state) => state.mobileSidebarOpen)
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen)
  const role = useAuthStore((state) => state.user?.role)
  useIdleLogout()

  return (
    <div className={styles.shell} data-collapsed={collapsed} data-mobile-open={mobileOpen}>
      <Sidebar />
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={() => setMobileOpen(false)}
      />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          <div className={styles.banners}>
            {(role === 'vendor' || role === 'technician') && <SubscriptionBanner />}
          </div>
          <Outlet />
        </main>
        {role !== 'super_admin' && <ChatWidget />}
      </div>
    </div>
  )
}
