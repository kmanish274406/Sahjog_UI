import { describe, expect, it } from 'vitest'
import {
  addressProblem,
  amountProblem,
  collect,
  emailProblem,
  integerProblem,
  landmarkProblem,
  nameProblem,
  optionalPercentProblem,
  optionalPhoneProblem,
  phoneProblem,
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
  it('requires a valid Indian mobile when the field is required', () => {
    expect(phoneProblem('')).toBeDefined()
    expect(phoneProblem('9876543210')).toBeUndefined()
    expect(phoneProblem('+91 98765 43210')).toBeUndefined()
    expect(phoneProblem('98765432109')).toBeDefined()
  })
  it('validates required emails and their API length limit', () => {
    expect(emailProblem('')).toBeDefined()
    expect(emailProblem(' admin@example.com ')).toBeUndefined()
    expect(emailProblem(`${'a'.repeat(193)}@example.com`)).toBeDefined()
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
  it('allows optional landmarks within the API limit', () => {
    expect(landmarkProblem('')).toBeUndefined()
    expect(landmarkProblem('Near the main gate')).toBeUndefined()
    expect(landmarkProblem('x'.repeat(121))).toBeDefined()
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
    expect(optionalPercentProblem('12.555')).toBeDefined()
  })
  it('checks whole-number bounds', () => {
    expect(integerProblem('0', 'experience', 0, 60)).toBeUndefined()
    expect(integerProblem('2.5', 'experience', 0, 60)).toBeDefined()
    expect(integerProblem('61', 'experience', 0, 60)).toBeDefined()
    expect(integerProblem('', 'experience', 0, 60, false)).toBeUndefined()
  })
  it('collects only the failing fields', () => {
    expect(collect({ a: undefined, b: 'bad' })).toEqual({ b: 'bad' })
  })
})
