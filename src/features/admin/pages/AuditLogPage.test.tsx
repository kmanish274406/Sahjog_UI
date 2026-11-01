import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api'
import AuditLogPage from './AuditLogPage'

describe('tenant audit log', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the user and action for tenant activity', async () => {
    vi.spyOn(api.admin, 'auditLogs').mockResolvedValue([
      {
        id: 1,
        actorUserId: 7,
        actorName: 'Business Admin',
        actorRole: 'Admin',
        httpMethod: 'PUT',
        path: '/api/admin/settings',
        statusCode: 200,
        createdAt: '2026-11-01T10:00:00',
      },
    ])
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AuditLogPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Business Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin #7')).toBeInTheDocument()
    expect(screen.getByText('/api/admin/settings')).toBeInTheDocument()
    queryClient.clear()
  })
})
