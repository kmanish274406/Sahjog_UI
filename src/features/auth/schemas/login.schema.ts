import { z } from 'zod'
import { isEmail, normalisePhone } from '@/domain/validators'

const phone = z
  .string()
  .trim()
  .min(1, 'Mobile number is required')
  .refine((value) => normalisePhone(value) !== null, 'Enter a valid 10-digit mobile number')

const email = z.string().trim().min(1, 'Email is required').refine(isEmail, 'Enter a valid email')

export const phoneSchema = z.object({ phone })
export type PhoneValues = z.infer<typeof phoneSchema>

export const otpSchema = z.object({
  phone,
  otp: z.string().trim().length(6, 'The OTP has 6 digits'),
  name: z.string().trim().max(80).optional(),
})
export type OtpValues = z.infer<typeof otpSchema>

export const emailLoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  name: z.string().trim().max(80).optional(),
})
export type EmailLoginValues = z.infer<typeof emailLoginSchema>

export const vendorLoginSchema = z.object({
  phone,
  password: z.string().min(1, 'Password is required'),
})
export type VendorLoginValues = z.infer<typeof vendorLoginSchema>

export const vendorRegisterSchema = z.object({
  business: z.string().trim().min(2, 'Business name is required').max(120),
  owner: z.string().trim().min(2, 'Owner name is required').max(80),
  phone,
  email,
  gst: z.string().trim().max(20).optional(),
  address: z.string().trim().min(8, 'Enter a fuller address with area and city').max(300),
  categories: z.array(z.string()).min(1, 'Choose at least one category'),
})
export type VendorRegisterValues = z.infer<typeof vendorRegisterSchema>

export const technicianRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone,
  skills: z.array(z.string()).min(1, 'Choose at least one skill'),
  experience: z.coerce.number().int().min(0, 'Enter years of experience').max(60),
  aadhaar: z.string().trim().max(20).optional(),
  address: z.string().trim().min(8, 'Enter a fuller address with area and city').max(300),
})
export type TechnicianRegisterValues = z.infer<typeof technicianRegisterSchema>
