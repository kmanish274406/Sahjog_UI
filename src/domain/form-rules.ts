import { isEmail, normalisePhone } from './validators'

/** Each rule returns a message for the field, or undefined when the value is fine. */
export type Problem = string | undefined

const hasLetter = (text: string) => /\p{L}/u.test(text)

export function nameProblem(value: string, label = 'name', max = 80): Problem {
  const v = value.trim()
  if (v.length < 2 || !hasLetter(v)) return `Enter the ${label} (at least 2 characters).`
  if (v.length > max) return `The ${label} can be at most ${max} characters.`
  return undefined
}

export function emailProblem(value: string): Problem {
  if (value.trim() === '') return 'Enter an email address.'
  if (!isEmail(value)) return 'Enter a valid email address.'
  return undefined
}

/** An optional mobile number: empty is fine, anything typed must be a valid 10-digit number. */
export function optionalPhoneProblem(value: string): Problem {
  if (value.trim() !== '' && !normalisePhone(value))
    return 'Enter a valid 10-digit mobile number, or leave it empty.'
  return undefined
}

export function passwordProblem(value: string, required: boolean): Problem {
  if (value === '') return required ? 'Enter a password.' : undefined
  if (value.length < 6) return 'The password must be at least 6 characters.'
  if (value.length > 100) return 'The password can be at most 100 characters.'
  return undefined
}

export function addressProblem(value: string): Problem {
  const v = value.trim()
  if (v.length < 8) return 'Enter a fuller address with house number, area and city.'
  if (v.length > 300) return 'The address can be at most 300 characters.'
  return undefined
}

/** A money amount in rupees: a positive number with at most two decimals. */
export function amountProblem(value: string, label = 'amount', max = 1_000_000): Problem {
  if (value.trim() === '') return `Enter the ${label}.`
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return `The ${label} must be more than 0.`
  if (n > max) return `The ${label} can be at most ${max.toLocaleString('en-IN')}.`
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return `Use at most two decimal places.`
  return undefined
}

/** A rupee amount that may be zero (fees, discounts, plan prices). */
export function feeProblem(value: string, label = 'amount', max = 1_000_000): Problem {
  if (value.trim() === '') return `Enter the ${label}, or 0 for none.`
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return `The ${label} cannot be negative.`
  if (n > max) return `The ${label} can be at most ${max.toLocaleString('en-IN')}.`
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return 'Use at most two decimal places.'
  return undefined
}

/** An optional percentage from 0 to 100. */
export function optionalPercentProblem(value: string, label = 'percentage'): Problem {
  if (value.trim() === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100) return `The ${label} must be between 0 and 100.`
  return undefined
}

export function requiredChoiceProblem(value: string, label: string): Problem {
  if (value === '') return `Choose a ${label}.`
  return undefined
}

/** Drops the undefined entries, so `Object.keys(result).length` says whether the form is valid. */
export function collect<T extends string>(rules: Record<T, Problem>): Partial<Record<T, string>> {
  const out: Partial<Record<T, string>> = {}
  for (const key of Object.keys(rules) as T[]) {
    const message = rules[key]
    if (message) out[key] = message
  }
  return out
}
