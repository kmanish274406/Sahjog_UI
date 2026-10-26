import clsx from 'clsx'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { env } from '@/config/env'
import { usePermission } from '@/hooks/usePermission'
import { NAV_BY_ROLE } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { ROLE_LABELS } from '@/domain/constants'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const mobileOpen = useUiStore((state) => state.mobileSidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen)

  const can = usePermission()

  const groups = (user ? NAV_BY_ROLE[user.role] : [])
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside
      className={clsx(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.open)}
      aria-label="Sidebar"
    >
      <div className={styles.header}>
        <span className={styles.mark} aria-hidden="true">
          S
        </span>
        <span className={styles.brand}>
          <span className={styles.brandName}>{env.appName}</span>
          <span className={styles.brandSub}>{env.tagline}</span>
        </span>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav aria-label="Main navigation" className={styles.nav}>
        {groups.map((group) => (
          <div key={group.title} className={styles.group}>
            <p className={styles.groupTitle}>{group.title}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === ROUTES.dashboard}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={19} className={styles.icon} aria-hidden="true" />
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {user && (
        <div className={styles.footer}>
          <Avatar name={user.name} size={34} />
          <div className={styles.footerText}>
            <span className={styles.footerName}>{user.name}</span>
            <span className={styles.footerRole}>{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
