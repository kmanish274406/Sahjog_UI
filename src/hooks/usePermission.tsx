import { api } from '@/api'
import type { PermissionRule } from '@/config/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiQuery } from '@/hooks/useApi'

/**
 * The access ids the signed-in role holds, loaded from the API (the platform owner's from /api/platform, everyone else's from /api/auth).
 * `loaded` is false until they arrive: a button is hidden, never shown, while the grants are still unknown.
 */
export function usePermission() {
  const role = useAuthStore((state) => state.user?.role)
  const token = useAuthStore((state) => state.token)
  const access = useApiQuery(
    ['access', role],
    () => (role === 'super_admin' ? api.platform.access() : api.auth.access()),
    { enabled: Boolean(token && role), staleTime: 60_000 },
  )
  const granted = new Set(access.data ?? [])
  const can = (rule: PermissionRule) =>
    (Array.isArray(rule) ? rule : [rule]).some((id) => granted.has(id))
  return Object.assign(can, { loaded: access.data !== undefined })
}
