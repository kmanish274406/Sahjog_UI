import clsx from 'clsx'
import { Bell, ChevronDown, LogOut, Menu, PanelLeft, ShoppingCart, User } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import { Avatar, Dropdown, SearchInput } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { ROLE_LABELS } from '@/domain/constants'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { signOut } from '@/features/auth/utils/session'
import { cartCount, useCartStore } from '@/features/cart/store/cart.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { useUiStore } from '@/store/ui.store'
import { formatRelativeTime } from '@/utils/format'
import styles from './Topbar.module.css'

export function Topbar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen)
  const cartItems = useCartStore((state) => cartCount(state.items))
  const [term, setTerm] = useState('')

  const hasBell = user?.role !== 'super_admin'
  const notices = useApiQuery(['notifications'], api.notifications.list, {
    enabled: hasBell,
    refetchInterval: 30_000,
  })
  const items = notices.data?.items ?? []
  const unreadCount = notices.data?.unread ?? 0
  const markRead = useApiMutation(api.notifications.markRead)

  const isCustomer = user?.role === 'customer'

  const search = (event: FormEvent) => {
    event.preventDefault()
    navigate(`${ROUTES.services}?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={clsx(styles.iconButton, styles.desktopOnly)}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>
      <button
        type="button"
        className={clsx(styles.iconButton, styles.mobileOnly)}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {isCustomer ? (
        <form className={styles.search} role="search" onSubmit={search}>
          <SearchInput
            label="Search services"
            placeholder="Search AC repair, plumber, cleaning…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </form>
      ) : (
        <div className={styles.search} />
      )}

      <div className={styles.actions}>
        {isCustomer && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => navigate(ROUTES.cart)}
            aria-label={`Cart, ${cartItems} items`}
          >
            <ShoppingCart size={20} />
            {cartItems > 0 && <span className={styles.badge}>{cartItems}</span>}
          </button>
        )}

        {hasBell && (
          <Dropdown
            width={380}
            renderTrigger={({ open, toggle }) => (
              <button
                type="button"
                className={styles.iconButton}
                onClick={toggle}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={open}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className={styles.panelHeader}>
                  <strong>Notifications</strong>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      className={styles.muted}
                      onClick={() => markRead.mutate(undefined)}
                      disabled={markRead.isPending}
                    >
                      Mark {unreadCount} as read
                    </button>
                  ) : (
                    <span className={styles.muted}>All caught up</span>
                  )}
                </div>
                {items.length === 0 ? (
                  <p className={styles.muted} style={{ padding: 16 }}>
                    No notifications yet.
                  </p>
                ) : (
                  <ul className={styles.notifications}>
                    {items.slice(0, 8).map((n) => (
                      <li
                        key={n.id}
                        className={clsx(styles.notification, n.unread && styles.unread)}
                      >
                        <p className={styles.notificationTitle}>{n.text}</p>
                        <p className={styles.time}>{formatRelativeTime(n.when)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.panelHeader}>
                  <Link to={ROUTES.notifications} onClick={close}>
                    See all notifications
                  </Link>
                </div>
              </div>
            )}
          </Dropdown>
        )}

        {user && (
          <Dropdown
            width={260}
            renderTrigger={({ open, toggle }) => (
              <button
                type="button"
                className={styles.profileButton}
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
              >
                <Avatar name={user.name} size={34} />
                <span className={clsx(styles.profileText, styles.hideSmall)}>
                  <span className={styles.profileName}>{user.name}</span>
                  <span className={styles.profileRole}>{ROLE_LABELS[user.role]}</span>
                </span>
                <ChevronDown size={16} className={styles.hideSmall} />
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.notificationTitle}>{user.name}</p>
                    <p className={styles.muted}>
                      {user.email ?? user.phone ?? ROLE_LABELS[user.role]}
                    </p>
                  </div>
                </div>
                <ul className={styles.menu} role="menu">
                  {user.role !== 'super_admin' && (
                    <li role="none">
                      <Link
                        to={ROUTES.profile}
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={close}
                      >
                        <User size={16} /> My profile
                      </Link>
                    </li>
                  )}
                  <li role="none" className={styles.divider}>
                    <button
                      type="button"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => {
                        signOut()
                        navigate(ROUTES.login, { replace: true })
                      }}
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </Dropdown>
        )}
      </div>
    </header>
  )
}
