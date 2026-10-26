import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from '@/store/toast.store'
import { ApiError } from './api-error'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Shown as a toast when the change succeeds. */
      success?: string
      /** The form shows the error itself; no toast. */
      inline?: boolean
    }
  }
}

export const queryClient: QueryClient = new QueryClient({
  // The data is tightly linked (a booking changes the wallet, the technician's jobs, the vendor's
  // earnings and every notification), so any successful change refreshes everything on screen.
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.success) toast.success(mutation.meta.success)
      void queryClient.invalidateQueries()
    },
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.inline) toast.error(error.message)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Client errors (4xx) will not succeed on retry.
        if (error instanceof ApiError && error.status && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})
