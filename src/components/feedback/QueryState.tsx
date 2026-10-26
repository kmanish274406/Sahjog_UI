import type { ReactNode } from 'react'
import { Alert, Spinner } from '@/components/ui'
import type { ApiError } from '@/lib/api-error'

export interface QueryStateProps {
  isLoading: boolean
  error: ApiError | null
  children: ReactNode
}

/** Shows a spinner while a page loads and the server's own message if it could not. */
export function QueryState({ isLoading, error, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 56 }}>
        <Spinner />
      </div>
    )
  }
  if (error) {
    return (
      <Alert tone="danger" title="This could not be loaded">
        {error.message}
      </Alert>
    )
  }
  return <>{children}</>
}
