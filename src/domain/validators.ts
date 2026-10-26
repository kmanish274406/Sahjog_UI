/** Reduces "+91 98765 43210" and the like to the 10 digits the API expects, or returns null. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  return /^[6-9]\d{9}$/.test(ten) ? ten : null
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
