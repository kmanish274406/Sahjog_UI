import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'

export function NotFoundPage() {
  return (
    <div role="alert" style={{ padding: 64, textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ margin: '8px 0 20px', color: 'var(--color-text-muted)' }}>
        The page you are looking for does not exist or has moved.
      </p>
      <Link to={ROUTES.dashboard}>
        <Button>Go to the dashboard</Button>
      </Link>
    </div>
  )
}
