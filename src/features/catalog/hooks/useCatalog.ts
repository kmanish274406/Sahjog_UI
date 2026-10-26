import { api } from '@/api'
import type { ContentDto } from '@/api/types'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiQuery } from '@/hooks/useApi'

// The public catalogue belongs to one business, so the business is part of every key.
const useTenant = () => useAuthStore((state) => state.tenant)

export const useCategories = () => {
  const tenant = useTenant()
  return useApiQuery(['catalog', tenant, 'categories'], api.catalog.categories)
}

export const useServices = (params: { q?: string; categoryId?: number } = {}) => {
  const tenant = useTenant()
  return useApiQuery(['catalog', tenant, 'services', params], () => api.catalog.services(params))
}

export const useProviders = (serviceId: number) => {
  const tenant = useTenant()
  return useApiQuery(['catalog', tenant, 'providers', serviceId], () => api.catalog.providers(serviceId), {
    enabled: Number.isFinite(serviceId),
  })
}

export const useSettings = () => {
  const tenant = useTenant()
  return useApiQuery(['catalog', tenant, 'settings'], api.catalog.settings)
}

export const usePlans = (kind?: string) => {
  const tenant = useTenant()
  return useApiQuery(['catalog', tenant, 'plans', kind], () => api.catalog.plans(kind), { enabled: kind !== undefined })
}

export interface SlotGroup {
  part: string
  times: string[]
}

/**
 * The texts, time slots and payment labels the server keeps in its content table: nothing the person reads is
 * written into a screen, so Admin can change it. `{name}`, `{amount}` and `{balance}` are filled in with `fill`.
 */
export function useContent() {
  const tenant = useTenant()
  const query = useApiQuery(['catalog', tenant, 'content'], api.catalog.content, { staleTime: 5 * 60_000 })
  const rows: ContentDto[] = query.data ?? []

  const list = (section: string) => rows.filter((r) => r.section === section)
  const row = (section: string, code: string) => rows.find((r) => r.section === section && r.code === code)
  const text = (section: string, code: string, fallback = '') => row(section, code)?.title || fallback

  const slots: SlotGroup[] = []
  for (const r of list('slot')) {
    const group = slots.find((s) => s.part === r.code)
    if (group) group.times.push(r.title)
    else slots.push({ part: r.code, times: [r.title] })
  }

  return { ...query, rows, list, row, text, slots }
}

/** Fills the `{name}` style placeholders of a server text. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
