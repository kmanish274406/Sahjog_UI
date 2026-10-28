import {
  ageFrom,
  isAadhaar,
  isBankAccount,
  isEmail,
  isIfsc,
  normalisePhone,
} from '@/domain/validators'

export interface ProfileFormValues {
  name: string
  phone: string
  email: string
  dateOfBirth: string
  address: string
  business: string
  gst: string
  aadhaar: string
  bankHolder: string
  bankName: string
  bank: string
  ifsc: string
  skill: string
  skills: string
  experience: string
  area: string
}

export type ProfileErrors = Partial<Record<keyof ProfileFormValues, string>>

/**
 * The same rules the API applies, checked before the form is sent so each mistake shows next to its field.
 * The API still checks everything again; this only saves a round trip.
 */
export function validateProfile(
  values: ProfileFormValues,
  role: string | undefined,
): ProfileErrors {
  const errors: ProfileErrors = {}
  const hasLetter = (text: string) => /\p{L}/u.test(text)

  if (values.name.trim().length < 2 || !hasLetter(values.name))
    errors.name = 'Enter your full name.'
  if (!normalisePhone(values.phone)) errors.phone = 'Enter a valid 10-digit mobile number.'
  if (values.email.trim() !== '' && !isEmail(values.email))
    errors.email = 'Enter a valid email address.'

  if (values.dateOfBirth !== '') {
    const age = ageFrom(values.dateOfBirth)
    const minimum = role === 'customer' ? 13 : 18
    if (age === null)
      errors.dateOfBirth = 'Enter a valid date of birth. It cannot be in the future.'
    else if (age < minimum) errors.dateOfBirth = `You must be at least ${minimum} years old.`
    else if (age > 100) errors.dateOfBirth = 'Enter a valid date of birth.'
  }

  const address = values.address.trim()
  if (address !== '' && address.length < 8)
    errors.address = 'Enter a fuller address with house number, area and city.'
  if (address.length > 300) errors.address = 'The address can be at most 300 characters.'
  if (role === 'vendor' && address === '') errors.address = 'Enter your business address.'

  if (role === 'vendor') {
    if (values.business.trim().length < 2) errors.business = 'Enter your business name.'
    const gst = values.gst.trim().toUpperCase()
    if (gst !== '' && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst))
      errors.gst = 'Enter a valid 15-character GST number, or leave it empty.'
  }

  if (role === 'vendor' || role === 'technician') {
    if (values.aadhaar.trim() !== '' && !isAadhaar(values.aadhaar))
      errors.aadhaar = 'Enter a valid 12-digit Aadhaar number. Check the digits against your card.'

    if (values.bank.trim() !== '' && !isBankAccount(values.bank))
      errors.bank = 'Enter a valid account number (9 to 18 digits).'
    if (values.ifsc.trim() !== '' && !isIfsc(values.ifsc))
      errors.ifsc = 'Enter a valid IFSC code, like HDFC0001234.'
    if (values.bankHolder.trim() !== '' && !hasLetter(values.bankHolder))
      errors.bankHolder = 'Enter the name on the account.'
    if (values.bankName.trim() !== '' && !/^[A-Za-z0-9 .,&'()-]+$/.test(values.bankName.trim()))
      errors.bankName = 'Enter a valid bank name.'

    // Bank details are all or nothing: a payout needs the holder, the account and the IFSC together.
    const given = [values.bank, values.ifsc, values.bankHolder].filter((v) => v.trim() !== '')
    if (given.length > 0 && given.length < 3) {
      const message = 'Enter the account holder, account number and IFSC together.'
      if (values.bank.trim() === '') errors.bank ??= message
      if (values.ifsc.trim() === '') errors.ifsc ??= message
      if (values.bankHolder.trim() === '') errors.bankHolder ??= message
    }
  }

  if (role === 'technician') {
    const years = Number(values.experience)
    if (values.experience.trim() === '' || !Number.isInteger(years) || years < 0 || years > 60)
      errors.experience = 'Enter your experience in whole years, from 0 to 60.'
  }
  return errors
}
