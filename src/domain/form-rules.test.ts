import { describe, expect, it } from 'vitest'
import {
  addressProblem,
  amountProblem,
  collect,
  nameProblem,
  optionalPercentProblem,
  optionalPhoneProblem,
  passwordProblem,
} from './form-rules'

describe('form rules', () => {
  it('checks names', () => {
    expect(nameProblem('A')).toBeDefined()
    expect(nameProblem('12')).toBeDefined()
    expect(nameProblem('  Asha  ')).toBeUndefined()
    expect(nameProblem('x'.repeat(81))).toBeDefined()
  })
  it('allows an empty optional phone but not a bad one', () => {
    expect(optionalPhoneProblem('')).toBeUndefined()
    expect(optionalPhoneProblem('12345')).toBeDefined()
    expect(optionalPhoneProblem('+91 98765 43210')).toBeUndefined()
  })
  it('checks passwords', () => {
    expect(passwordProblem('', true)).toBeDefined()
    expect(passwordProblem('', false)).toBeUndefined()
    expect(passwordProblem('12345', false)).toBeDefined()
    expect(passwordProblem('123456', true)).toBeUndefined()
  })
  it('checks addresses', () => {
    expect(addressProblem('Short')).toBeDefined()
    expect(addressProblem('12 MG Road, Pune')).toBeUndefined()
  })
  it('checks amounts', () => {
    expect(amountProblem('')).toBeDefined()
    expect(amountProblem('0')).toBeDefined()
    expect(amountProblem('-5')).toBeDefined()
    expect(amountProblem('10.555')).toBeDefined()
    expect(amountProblem('499.50')).toBeUndefined()
    expect(amountProblem('9999999')).toBeDefined()
  })
  it('checks optional percentages', () => {
    expect(optionalPercentProblem('')).toBeUndefined()
    expect(optionalPercentProblem('101')).toBeDefined()
    expect(optionalPercentProblem('12.5')).toBeUndefined()
  })
  it('collects only the failing fields', () => {
    expect(collect({ a: undefined, b: 'bad' })).toEqual({ b: 'bad' })
  })
})
