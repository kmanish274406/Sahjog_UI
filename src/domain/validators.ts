/** Reduces "+91 98765 43210" and the like to the 10 digits the API expects, or returns null. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  return /^[6-9]\d{9}$/.test(ten) ? ten : null
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

// The Verhoeff check-digit tables Aadhaar numbers use (the API checks the same way).
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

/** A 12-digit Aadhaar number (spaces allowed) that does not start with 0 or 1 and has a valid check digit. */
export function isAadhaar(raw: string): boolean {
  const v = raw.replace(/[\s-]/g, '')
  if (!/^[2-9]\d{11}$/.test(v)) return false
  let check = 0
  const digits = [...v].reverse()
  digits.forEach((d, i) => {
    check = VERHOEFF_D[check]![VERHOEFF_P[i % 8]![Number(d)]!]!
  })
  return check === 0
}

export const isIfsc = (value: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase())

export const isBankAccount = (value: string) => /^\d{9,18}$/.test(value.replace(/\s/g, ''))

/** Whole years between a yyyy-MM-dd date and today, or null when it is not a date. */
export function ageFrom(dateOfBirth: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null
  const born = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(born.getTime()) || born > today) return null
  let age = today.getFullYear() - born.getFullYear()
  const birthdayPassed =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate())
  if (!birthdayPassed) age -= 1
  return age
}

/** An image file the API will take: JPG, PNG or WEBP, at most `maxMb` MB. Returns a message, or null when it is fine. */
export function imageProblem(file: File, maxMb: number): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Choose a JPG, PNG or WEBP image.'
  if (file.size > maxMb * 1_000_000) return `The image must be smaller than ${maxMb} MB.`
  return null
}
