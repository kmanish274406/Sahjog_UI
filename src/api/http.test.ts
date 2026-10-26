import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ApiError } from '@/lib/api-error'
import { request } from './http'

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, message: null, data }), { status: 200 })
const fail = (status: number, message: string | null = null) =>
  new Response(JSON.stringify({ success: false, message, data: null }), { status })

function signIn(token = 'old-access', refreshToken = 'old-refresh') {
  useAuthStore.setState({
    user: { id: 1, name: 'Amit', role: 'customer' },
    token,
    refreshToken,
    tenant: '1',
  })
}

describe('request', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    useAuthStore.setState({ user: null, token: null, refreshToken: null, tenant: '1' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the business and the access token, and unwraps the envelope', async () => {
    signIn()
    fetchMock.mockResolvedValueOnce(ok({ hello: 'world' }))

    const data = await request<{ hello: string }>('/api/bookings')

    expect(data).toEqual({ hello: 'world' })
    const headers = fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers['X-Tenant-Id']).toBe('1')
    expect(headers.Authorization).toBe('Bearer old-access')
  })

  it('throws the server message as an ApiError', async () => {
    fetchMock.mockResolvedValueOnce(fail(400, 'Wrong OTP. Demo OTP is 123456.'))

    await expect(
      request('/api/auth/customer/verify', { method: 'POST', body: {}, auth: false }),
    ).rejects.toMatchObject({
      message: 'Wrong OTP. Demo OTP is 123456.',
      status: 400,
    })
  })

  it('renews an expired access token once and repeats the call', async () => {
    signIn()
    fetchMock
      .mockResolvedValueOnce(fail(401, 'Please sign in again.'))
      .mockResolvedValueOnce(ok({ token: 'new-access', refreshToken: 'new-refresh' }))
      .mockResolvedValueOnce(ok([1, 2, 3]))

    const data = await request<number[]>('/api/bookings')

    expect(data).toEqual([1, 2, 3])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/api/auth/refresh')
    expect(JSON.parse(fetchMock.mock.calls[1]![1]!.body as string)).toEqual({
      refreshToken: 'old-refresh',
    })
    const retryHeaders = fetchMock.mock.calls[2]![1]!.headers as Record<string, string>
    expect(retryHeaders.Authorization).toBe('Bearer new-access')
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh')
  })

  it('shares one renewal between calls that expire together', async () => {
    signIn()
    let refreshes = 0
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.includes('/api/auth/refresh')) {
        refreshes += 1
        return ok({ token: 'new-access', refreshToken: 'new-refresh' })
      }
      const auth = (init!.headers as Record<string, string>).Authorization
      return auth === 'Bearer new-access' ? ok('fine') : fail(401)
    })

    const results = await Promise.all([request('/api/a'), request('/api/b'), request('/api/c')])

    expect(results).toEqual(['fine', 'fine', 'fine'])
    // A refresh token works once: a second renewal with it would end the session.
    expect(refreshes).toBe(1)
  })

  it('signs the person out when the session cannot be renewed', async () => {
    signIn()
    fetchMock
      .mockResolvedValueOnce(fail(401))
      .mockResolvedValueOnce(fail(401, 'Your session has ended. Please sign in again.'))

    await expect(request('/api/bookings')).rejects.toBeInstanceOf(ApiError)

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('keeps the session when the renewal fails only because the network is down', async () => {
    signIn()
    fetchMock
      .mockResolvedValueOnce(fail(401))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(request('/api/bookings')).rejects.toThrow('Cannot reach Sahjog')

    expect(useAuthStore.getState().user).not.toBeNull()
  })

  it('does not try to renew a failed sign-in', async () => {
    fetchMock.mockResolvedValueOnce(fail(401, 'Wrong email or password.'))

    await expect(
      request('/api/auth/admin/login', { method: 'POST', body: {}, auth: false }),
    ).rejects.toThrow('Wrong email or password.')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
