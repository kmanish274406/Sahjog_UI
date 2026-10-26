import { useMutation, useQuery } from '@tanstack/react-query'
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ApiError } from '@/lib/api-error'

/**
 * Thin wrappers over TanStack Query for the Sahjog API. Every successful change refreshes all
 * queries (see lib/query-client.ts), so pages never have to remember which lists a mutation affects.
 * Pass `meta: { success: 'Saved' }` for a confirmation toast, or `meta: { inline: true }` when the
 * form shows the error itself.
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  fn: () => Promise<T>,
  options: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery<T, ApiError>({ queryKey: key, queryFn: fn, ...options })
}

export function useApiMutation<Input, Output>(
  fn: (input: Input) => Promise<Output>,
  options: Omit<UseMutationOptions<Output, ApiError, Input>, 'mutationFn'> = {},
) {
  return useMutation<Output, ApiError, Input>({ mutationFn: fn, ...options })
}

/** The current time, refreshed every `intervalMs`, for live "x minutes ago" labels. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
