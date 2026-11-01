import { ageFrom, isAadhaar, isBankAccount, isGstin, isIfsc } from '@/domain/validators'
import {
  addressProblem,
  emailProblem,
  integerProblem,
  nameProblem,
  phoneProblem,
} from '@/domain/form-rules'

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

  const nameError = nameProblem(values.name, 'full name')
  if (nameError) errors.name = nameError
  const phoneError = phoneProblem(values.phone)
  if (phoneError) errors.phone = phoneError
  if (values.email.trim() !== '') {
    const emailError = emailProblem(values.email)
    if (emailError) errors.email = emailError
  }

  if (values.dateOfBirth !== '') {
    const age = ageFrom(values.dateOfBirth)
    const minimum = role === 'customer' ? 13 : 18
    if (age === null)
      errors.dateOfBirth = 'Enter a valid date of birth. It cannot be in the future.'
    else if (age < minimum) errors.dateOfBirth = `You must be at least ${minimum} years old.`
    else if (age > 100) errors.dateOfBirth = 'Enter a valid date of birth.'
  }

  const address = values.address.trim()
  if (address !== '') {
    const addressError = addressProblem(address)
    if (addressError) errors.address = addressError
  }
  if (role === 'vendor' && address === '') errors.address = 'Enter your business address.'

  if (role === 'vendor') {
    const businessError = nameProblem(values.business, 'business name', 120)
    if (businessError) errors.business = businessError
    if (values.gst.trim() !== '' && !isGstin(values.gst))
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
    const experienceError = integerProblem(values.experience, 'experience', 0, 60)
    if (experienceError) errors.experience = experienceError
  }
  return errors
}
