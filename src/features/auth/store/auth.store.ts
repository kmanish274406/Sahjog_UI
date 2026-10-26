import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { env } from '@/config/env'
import { queryClient } from '@/lib/query-client'
import type { AuthSession, AuthUser, Role } from '../types/auth.types'

interface AuthState {
  user: AuthUser | null
  /** Short-lived access token. */
  token: string | null
  /** Renews the access token; valid while the person keeps coming back (see env.idleLogoutMinutes). */
  refreshToken: string | null
  /** The business (client) the person signs in to: sent with every call as X-Tenant-Id. */
  tenant: string
  setSession: (session: AuthSession) => void
  setTokens: (token: string, refreshToken: string) => void
  updateUser: (user: Partial<AuthUser>) => void
  setTenant: (tenant: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tenant: env.defaultTenant,
      setSession: ({ user, token, refreshToken }) => {
        // Never let a previous user's cached data show up for the next one.
        queryClient.clear()
        set({ user, token, refreshToken })
      },
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      updateUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
      setTenant: (tenant) => set({ tenant: tenant.trim() || env.defaultTenant }),
      clearSession: () => {
        queryClient.clear()
        set({ user: null, token: null, refreshToken: null })
      },
    }),
    { name: 'sahjog-auth' },
  ),
)

/** The signed-in user's role, or null when signed out. */
export const useRole = (): Role | null => useAuthStore((state) => state.user?.role ?? null)
