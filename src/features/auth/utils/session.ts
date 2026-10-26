import { api } from '@/api'
import type { AuthResult, PlatformAuthResult } from '@/api/types'
import { roleFromApi } from '@/domain/constants'
import { useCartStore } from '@/features/cart/store/cart.store'
import { useAuthStore } from '../store/auth.store'
import type { AuthSession } from '../types/auth.types'

/** What the app keeps about a signed-in person, from the API's sign-in answer. */
export function sessionFromAuth(result: AuthResult): AuthSession {
  const { profile } = result
  return {
    token: result.token,
    refreshToken: result.refreshToken,
    user: {
      id: profile.id,
      name:
        profile.business && roleFromApi(profile.role) === 'vendor'
          ? profile.business
          : profile.name,
      role: roleFromApi(profile.role),
      phone: profile.phone || undefined,
      email: profile.email ?? undefined,
    },
  }
}

export function sessionFromPlatform(result: PlatformAuthResult): AuthSession {
  return {
    token: result.token,
    refreshToken: result.refreshToken,
    user: { id: 0, name: result.name, role: 'super_admin', email: result.email },
  }
}

/** Ends the session on the server (without waiting for it) and forgets everything held for this person. */
export function signOut(): void {
  const { refreshToken, clearSession } = useAuthStore.getState()
  if (refreshToken) void api.auth.logout(refreshToken).catch(() => undefined)
  useCartStore.getState().clear()
  clearSession()
}
