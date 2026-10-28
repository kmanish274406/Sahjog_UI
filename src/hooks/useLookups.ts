import { api } from '@/api'
import type { LookupLists } from '@/api/types'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiQuery } from '@/hooks/useApi'

/**
 * The small platform lists the console reads from the lookup table instead of hard-coding: stage names, plan kinds, cancellation
 * stages, screen labels. `text(type, code, fallback)` returns the table's label, or the fallback while it loads or if a row is missing.
 */
export function useLookups() {
  const role = useAuthStore((state) => state.user?.role)
  const token = useAuthStore((state) => state.token)
  const lists = useApiQuery<LookupLists>(
    ['lookups', role],
    () => (role === 'super_admin' ? api.platform.lookups() : api.auth.lookups()),
    { enabled: Boolean(token && role), staleTime: 5 * 60_000 },
  )
  const data = lists.data ?? {}
  return {
    loaded: lists.data !== undefined,
    /** Every active row of one list, in the table's order. */
    list: (type: string) => data[type] ?? [],
    /** One label. */
    text: (type: string, code: string, fallback: string) =>
      data[type]?.find((row) => row.code === code)?.label ?? fallback,
  }
}
