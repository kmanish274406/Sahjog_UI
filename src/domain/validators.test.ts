import { describe, expect, it } from 'vitest'
import { isEmail, normalisePhone } from './validators'

describe('normalisePhone', () => {
  it('accepts a plain 10-digit mobile number', () => {
    expect(normalisePhone('9876543210')).toBe('9876543210')
  })

  it('strips spaces and the +91 prefix', () => {
    expect(normalisePhone('+91 98765 43210')).toBe('9876543210')
  })

  it('rejects numbers that cannot be Indian mobiles', () => {
    expect(normalisePhone('12345')).toBeNull()
    expect(normalisePhone('1234567890')).toBeNull()
  })
})

describe('isEmail', () => {
  it('checks the basic shape', () => {
    expect(isEmail('admin@sahjog.in')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
  })
})
