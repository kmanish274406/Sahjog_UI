import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook point for an error-reporting service (Sentry, Datadog, ...).
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 48, textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p style={{ margin: '8px 0 16px' }}>An unexpected error occurred. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      )
    }
    return this.props.children
  }
}
