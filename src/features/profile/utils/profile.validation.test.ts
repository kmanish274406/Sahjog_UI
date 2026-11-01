import { describe, expect, it } from 'vitest'
import { validateProfile } from './profile.validation'
import type { ProfileFormValues } from './profile.validation'

const vendorProfile: ProfileFormValues = {
  name: 'Asha Sharma',
  phone: '9876543210',
  email: '',
  dateOfBirth: '',
  address: '12 MG Road, Pune',
  business: 'Asha Services',
  gst: '',
  aadhaar: '',
  bankHolder: '',
  bankName: '',
  bank: '',
  ifsc: '',
  skill: '',
  skills: '',
  experience: '0',
  area: '',
}

describe('profile validation', () => {
  it('keeps optional business GSTIN empty and validates populated values', () => {
    expect(validateProfile(vendorProfile, 'vendor')).toEqual({})
    expect(validateProfile({ ...vendorProfile, gst: '27AAPFU0939F1ZV' }, 'vendor')).toEqual({})
    expect(validateProfile({ ...vendorProfile, gst: 'invalid' }, 'vendor')).toMatchObject({
      gst: expect.any(String),
    })
  })

  it('uses shared email, mobile and integer rules', () => {
    expect(
      validateProfile(
        {
          ...vendorProfile,
          email: 'bad email',
          phone: '98765432109',
        },
        'vendor',
      ),
    ).toMatchObject({
      email: expect.any(String),
      phone: expect.any(String),
    })
    expect(validateProfile({ ...vendorProfile, experience: '2.5' }, 'technician')).toMatchObject({
      experience: expect.any(String),
    })
  })
})
