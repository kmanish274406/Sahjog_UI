import { describe, expect, it } from 'vitest'
import {
  isEmail,
  isGstin,
  isPan,
  normaliseEmail,
  normaliseGstin,
  normalisePhone,
} from './validators'

describe('normalisePhone', () => {
  it('accepts a plain 10-digit mobile number', () => {
    expect(normalisePhone('9876543210')).toBe('9876543210')
  })

  it('strips spaces and the +91 prefix', () => {
    expect(normalisePhone('+91 98765 43210')).toBe('9876543210')
    expect(normalisePhone('+91 (987) 654-3210')).toBe('9876543210')
  })

  it('rejects numbers that cannot be Indian mobiles', () => {
    expect(normalisePhone('12345')).toBeNull()
    expect(normalisePhone('1234567890')).toBeNull()
    expect(normalisePhone('919876543210')).toBeNull()
    expect(normalisePhone('00919876543210')).toBeNull()
    expect(normalisePhone('abc 9876543210')).toBeNull()
    expect(normalisePhone('+91 98765 432109')).toBeNull()
    expect(normalisePhone('919876543210')).toBeNull()
  })
})

describe('isEmail', () => {
  it('checks the basic shape', () => {
    expect(isEmail('admin@sahjog.in')).toBe(true)
    expect(isEmail('  ADMIN@SAHJOG.IN  ')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(normaliseEmail('  ADMIN@SAHJOG.IN  ')).toBe('admin@sahjog.in')
  })
})

describe('GSTIN and PAN', () => {
  it('normalizes and checks GSTIN structure and its PAN segment', () => {
    expect(normaliseGstin(' 27aapfu0939f1zv ')).toBe('27AAPFU0939F1ZV')
    expect(isGstin('27AAPFU0939F1ZV')).toBe(true)
    expect(isGstin('27AAPZU0939F1ZV')).toBe(false)
    expect(isGstin('27AAPFU0939F1Z')).toBe(false)
  })

  it('checks PAN shape without claiming issuance verification', () => {
    expect(isPan('AAPFU0939F')).toBe(true)
    expect(isPan('AAQZU0939F')).toBe(false)
  })
})
