import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api'
import type { ContentDto } from '@/api/types'
import { useAuthStore } from '../store/auth.store'
import { LoginPage } from './LoginPage'

const banners: ContentDto[] = [
  {
    id: 1,
    section: 'banner',
    code: 'main',
    title: 'Welcome home',
    text: 'Trusted experts',
    icon: '',
    sortOrder: 1,
    active: true,
  },
  {
    id: 2,
    section: 'banner',
    code: 'quick',
    title: 'Book in minutes',
    text: 'Pick a time',
    icon: '',
    sortOrder: 2,
    active: true,
  },
  {
    id: 3,
    section: 'banner',
    code: 'hidden',
    title: 'Hidden banner',
    text: '',
    icon: '',
    sortOrder: 3,
    active: false,
  },
]

describe('login landing banners', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ user: null })
    vi.spyOn(api.catalog, 'content').mockResolvedValue(banners)
  })

  it('shows active server banners and lets the visitor navigate them', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Welcome home' })).toBeInTheDocument()
    expect(screen.queryByText('Hidden banner')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next banner' }))
    expect(screen.getByRole('heading', { name: 'Book in minutes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()

    unmount()
    queryClient.clear()
  })

  it('offers platform-owner sign-in without prefilled credentials', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.click(await screen.findByRole('button', { name: 'Platform owner' }))
    expect(screen.getByLabelText('Owner email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')

    queryClient.clear()
  })
})
