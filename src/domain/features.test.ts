import { describe, expect, it } from 'vitest'
import { isFeatureEnabled } from './features'

describe('isFeatureEnabled', () => {
  it('defaults optional customer features to off', () => {
    for (const code of ['wallet', 'coupon', 'googleLogin', 'referral']) {
      expect(isFeatureEnabled(undefined, code)).toBe(false)
      expect(isFeatureEnabled({}, code)).toBe(false)
    }
  })

  it('honors an explicit tenant switch and defaults other features to on', () => {
    expect(isFeatureEnabled({ wallet: true }, 'wallet')).toBe(true)
    expect(isFeatureEnabled({ chatbot: false }, 'chatbot')).toBe(false)
    expect(isFeatureEnabled(undefined, 'subscriptions')).toBe(true)
  })
})
