import { Alert } from '@/components/ui/Alert'

/** Shows a failed query or mutation's message, if there is one. */
export function ErrorText({ error }: { error: Error | null | undefined }) {
  if (!error) return null
  return <Alert tone="danger">{error.message}</Alert>
}
