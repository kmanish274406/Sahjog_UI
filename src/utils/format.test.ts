import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatRelativeTime, initials, toIsoDay } from './format'

describe('formatCurrency', () => {
  it('uses Indian digit grouping', () => {
    expect(formatCurrency(1248320)).toBe('₹12,48,320')
  })

  it('shows paise only when there are some', () => {
    expect(formatCurrency(399)).toBe('₹399')
    expect(formatCurrency(399.5)).toBe('₹399.5')
  })
})

describe('formatDate', () => {
  it('keeps a calendar day on the same day', () => {
    expect(formatDate('2026-10-27T00:00:00')).toBe('27 Oct 2026')
  })
})

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-10-27T10:00:00Z')

  it('reads UTC timestamps that carry no zone as UTC', () => {
    expect(formatRelativeTime('2026-10-27T09:48:00', now)).toBe('12 min ago')
  })

  it('says "just now" under a minute', () => {
    expect(formatRelativeTime('2026-10-27T09:59:40', now)).toBe('just now')
  })
})

describe('toIsoDay', () => {
  it('writes the local calendar day', () => {
    expect(toIsoDay(new Date(2026, 9, 5))).toBe('2026-10-05')
  })
})

describe('initials', () => {
  it('takes two letters', () => {
    expect(initials('Rajesh Kumar Singh')).toBe('RK')
  })
})
