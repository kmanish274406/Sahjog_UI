import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { PermissionRule } from '@/config/permissions'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Role } from '@/features/auth/types/auth.types'
import { usePermission } from '@/hooks/usePermission'

export interface ProtectedRouteProps {
  /** When set, only these roles may open the nested routes. */
  allowedRoles?: Role[]
  /** When set, the person's role must also hold this permission. */
  permission?: PermissionRule
}

/**
 * Route guard: needs a session, and (optionally) one of the roles. The role check runs on the route,
 * so typing a URL by hand gets a person nowhere they do not belong. This is a courtesy for the
 * screen: the API enforces the real rules on every call.
 */
export function ProtectedRoute({ allowedRoles, permission }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  const can = usePermission()

  if (!user || !token) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  // Wait for the role's access ids before deciding, so a person is not bounced from a page they may open.
  if (permission && !can.loaded) return null
  if (permission && !can(permission)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
