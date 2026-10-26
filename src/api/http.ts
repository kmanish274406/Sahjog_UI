import { env } from '@/config/env'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ApiError } from '@/lib/api-error'
import type { ApiEnvelope, RefreshResult } from './types'

type QueryValue = string | number | boolean | undefined | null

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  /** Sign-in and renewal calls carry no access token. Default true. */
  auth?: boolean
  /** A multipart upload instead of JSON. */
  form?: FormData
}

/** What to say when the server answered without its usual message (a proxy, or a crash before the API's own handler). */
function plain(status: number): string {
  if (status === 401) return 'Please sign in again.'
  if (status === 403) return 'You do not have access to this.'
  if (status === 404) return 'That was not found.'
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.'
  return 'Something went wrong. Please try again.'
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(env.apiUrl + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

/** One call, no renewal. Returns the unwrapped data. */
async function send<T>(path: string, options: RequestOptions): Promise<{ data: T; message: string | null }> {
  const { token, tenant } = useAuthStore.getState()
  const headers: Record<string, string> = { 'X-Tenant-Id': tenant }
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (options.form) body = options.form
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), env.requestTimeoutMs)
  let res: Response
  try {
    res = await fetch(buildUrl(path, options.query), {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server is taking too long to answer. Check your connection and try again.')
    }
    throw new ApiError('Cannot reach Sahjog right now. Check your internet connection and try again.')
  } finally {
    window.clearTimeout(timer)
  }

  const text = await res.text()
  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = text ? (JSON.parse(text) as ApiEnvelope<T>) : null
  } catch {
    envelope = null
  }
  if (!res.ok || !envelope || !envelope.success) {
    throw new ApiError(envelope?.message ?? plain(res.status), res.status)
  }
  return { data: envelope.data as T, message: envelope.message }
}

let renewing: Promise<boolean> | null = null

/**
 * Swaps the refresh token for a new access token. Calls made together share one renewal: a refresh
 * token works once, so a second renewal with the same token would end the session.
 */
function renewSession(): Promise<boolean> {
  renewing ??= (async () => {
    const { refreshToken, setTokens } = useAuthStore.getState()
    if (!refreshToken) return false
    try {
      const { data } = await send<RefreshResult>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      })
      setTokens(data.token, data.refreshToken)
      return true
    } catch (error) {
      // A network blip must not sign the person out; only an answer from the server means the session is over.
      if (error instanceof ApiError && error.status === 401) return false
      throw error
    }
  })().finally(() => {
    renewing = null
  })
  return renewing
}

/**
 * Calls the API and returns the data of its { success, message, data } envelope. When the access
 * token has expired (401 with a session), it is renewed once and the call repeated; if the session
 * cannot be renewed the person is signed out.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const usedToken = useAuthStore.getState().token
  try {
    return (await send<T>(path, options)).data
  } catch (error) {
    const expired = error instanceof ApiError && error.status === 401 && options.auth !== false && usedToken !== null
    if (!expired) throw error
    // Another call may already have renewed the token while this one was in flight.
    const renewed = useAuthStore.getState().token !== usedToken || (await renewSession())
    if (!renewed) {
      useAuthStore.getState().clearSession()
      throw new ApiError('Your session has ended. Please sign in again.', 401)
    }
    return (await send<T>(path, options)).data
  }
}

/** An image the API serves ("/uploads/…") is loaded from the API; anything else is used as it is. */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return path.startsWith('/') ? env.apiUrl + path : path
}
