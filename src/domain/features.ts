import type { Features } from '@/api/types'

const disabledByDefault = new Set([
  'wallet',
  'coupon',
  'googleLogin',
  'referral',
  'chatbot',
  'sms',
  'whatsapp',
])

/** Mirrors the API default for a feature with no tenant setting. */
export function isFeatureEnabled(features: Features | undefined, code: string): boolean {
  return features?.[code] ?? !disabledByDefault.has(code)
}
