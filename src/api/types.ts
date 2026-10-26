// Request and response shapes of the Sahjog API (see SahjogApi.Application/DTOs/Dtos.cs).
// Dates travel as ISO strings and money as plain numbers in rupees.

export interface ApiEnvelope<T> {
  success: boolean
  message: string | null
  data: T | null
}

// ---------------------------------------------------------------- tenants and the platform owner

/** Feature code to on/off. The codes come from the feature master (wallet, coupon, googleLogin, paymentMethods, subscriptions, ...). */
export type Features = Record<string, boolean>

export interface FeatureDefDto {
  code: string
  name: string
  description: string
  sortOrder: number
  active: boolean
}

export interface PaymentMethodDefDto {
  code: string
  name: string
  sortOrder: number
  active: boolean
  featureCode: string | null
}

export interface PlanTemplateDto {
  id: number
  kind: string
  name: string
  period: string
  months: number
  price: number
  save: string
  sortOrder: number
  active: boolean
}

export interface AccessPermissionDto {
  accessId: string
  module: string
  resource: string
  action: string
  label: string
  sortOrder: number
  platformOnly: boolean
}

/** The access ids an Admin can be given, and the ones the Admin role holds now. */
export interface RoleAccessDto {
  catalog: AccessPermissionDto[]
  accessIds: string[]
}

export interface MastersDto {
  features: FeatureDefDto[]
  paymentMethods: PaymentMethodDefDto[]
  planTemplates: PlanTemplateDto[]
}

export type SaveFeatureDefRequest = Partial<Omit<FeatureDefDto, 'active'>> & { active?: boolean }
export type SavePaymentMethodDefRequest = Partial<PaymentMethodDefDto>
export type SavePlanTemplateRequest = Partial<Omit<PlanTemplateDto, 'id'>>

export interface TenantDto {
  id: number
  code: string
  name: string
  isActive: boolean
}

export interface TenantInfoDto extends TenantDto {
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  adminEmail: string
  createdAt: string
  features: Features
  /** Names of the switches, sent on the admin's own business record. */
  featureDefs?: FeatureDefDto[] | null
}

export interface CreateTenantRequest {
  name: string
  code: string
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
  demoData?: boolean
  adminPassword?: string
}

export interface TenantCreatedDto {
  tenant: TenantDto
  adminEmail: string
  adminPassword: string
}

export interface PlatformAuthResult {
  token: string
  name: string
  email: string
  refreshToken: string
}

// ---------------------------------------------------------------- auth

export interface ProfileDto {
  id: number
  role: string
  name: string
  phone: string
  email: string | null
  emoji: string
  isActive: boolean
  wallet: number
  couponUsed: boolean
  business: string
  gst: string
  address: string
  bank: string
  ifsc: string
  rating: number
  reviews: number
  vendorId: number | null
  skill: string
  skills: string
  experience: number
  area: string
  available: boolean
  notify: boolean
  planId: number | null
  planName: string | null
  planPeriod: string | null
  planPrice: number
  planSave: string | null
  planExpiry: string | null
  subscriptionActive: boolean
  coveredByVendor: boolean
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
  email?: string
  business?: string
  gst?: string
  address?: string
  bank?: string
  ifsc?: string
  skill?: string
  skills?: string
  experience?: number
  area?: string
  notify?: boolean
  available?: boolean
}

export interface AuthResult {
  token: string
  profile: ProfileDto
  refreshToken: string
}

export interface RefreshResult {
  token: string
  refreshToken: string
}

export interface OtpResult {
  message: string
  demoOtp: string | null
}

export interface CustomerVerifyRequest {
  phone: string
  otp: string
  name?: string
  signUp?: boolean
}

export interface EmailAuthRequest {
  email: string
  password: string
  name?: string
  signUp?: boolean
}

export interface VendorRegisterRequest {
  business: string
  owner: string
  phone: string
  email: string
  gst?: string
  address: string
  categories: string[]
}

export interface TechnicianRegisterRequest {
  name: string
  phone: string
  skills: string[]
  experience: number
  aadhaar?: string
  address: string
}

// ---------------------------------------------------------------- catalogue

export interface CategoryDto {
  id: number
  name: string
  description: string
  image: string | null
  active: boolean
  serviceCount: number
}

export interface ServiceDto {
  id: number
  categoryId: number
  category: string
  name: string
  short: string
  emoji: string
  basePrice: number
  commission: number
  active: boolean
  includes: string[]
  providers: number
  minPrice: number
  rating: number
  reviews: number
}

export interface ProviderDto {
  vendorId: number
  vendorServiceId: number
  name: string
  rating: number
  reviews: number
  price: number
  distanceKm: number
  emoji: string
}

export interface SaveCategoryRequest {
  name: string
  description?: string
  image?: string | null
  active?: boolean
}

export interface SaveServiceRequest {
  categoryId?: number
  name?: string
  short?: string
  emoji?: string
  basePrice?: number
  commission?: number
  active?: boolean
}

export interface SettingsDto {
  platformFee: number
  defaultCommission: number
  cancelPercents: number[]
  paymentMethods: Record<string, boolean>
  /** Payment method code to the name the master gives it. */
  paymentMethodLabels?: Record<string, string>
  onlinePayments: boolean
  paymentProvider: string
  couponCode: string
  couponAmount: number
  features: Features
}

export interface UpdateSettingsRequest {
  platformFee?: number
  defaultCommission?: number
  cancelPercents?: number[]
  paymentMethods?: Record<string, boolean>
  couponCode?: string
  couponAmount?: number
}

export interface ContentDto {
  id: number
  section: string
  code: string
  title: string
  text: string
  icon: string
  sortOrder: number
  active: boolean
}

export interface SaveContentRequest {
  section?: string
  code?: string
  title?: string
  text?: string
  icon?: string
  sortOrder?: number
  active?: boolean
}

export interface PlanDto {
  id: number
  kind: string
  name: string
  period: string
  months: number
  price: number
  save: string
}

// ---------------------------------------------------------------- payments

export interface PaymentOrderDto {
  id: string
  amount: number
  method: string
  provider: string
  /** Created, Paid, Used, Failed or Refunded. */
  status: string
  checkoutUrl: string
  reference: string
}

export interface PaymentRowDto {
  id: string
  date: string
  user: string
  role: string
  purpose: string
  method: string
  amount: number
  refunded: number
  status: string
  reference: string
  provider: string
  providerPaymentId: string
  note: string
}

// ---------------------------------------------------------------- customer

export interface AddressDto {
  id: number
  label: string
  text: string
}

export interface SaveAddressRequest {
  label: string
  text: string
}

export interface PlaceSuggestionDto {
  placeId: string
  title: string
  subtitle: string
}

export interface PlaceDto {
  placeId: string
  address: string
  lat: number
  lng: number
}

export interface CouponResult {
  valid: boolean
  discount: number
  message: string
}

// ---------------------------------------------------------------- bookings

export interface PlaceBookingRequest {
  vendorServiceId?: number
  serviceItemId?: number
  date: string
  time: string
  qty: number
  address: string
  notes?: string
  couponCode?: string
  payMethod: string
  paymentId?: string
}

export interface BookingDto {
  id: string
  service: string
  provider: string
  emoji: string
  customer: string
  phone: string
  address: string
  area: string
  notes: string
  distance: string
  date: string
  time: string
  amount: number
  fee: number
  discount: number
  total: number
  cancelFee: number
  commission: number
  techEarning: number
  paidWith: string
  stage: string
  vendorId: number | null
  technicianId: number | null
  technician: string | null
  independent: boolean
  otp: string | null
  createdAt: string
}

export interface PlacedBookingDto {
  booking: BookingDto
  wallet: number
  couponUsed: boolean
}

export interface CancelQuoteDto {
  percent: number
  fee: number
  refund: number
}

// ---------------------------------------------------------------- vendor and technician

export interface VendorServiceDto {
  id: number
  serviceItemId: number
  name: string
  category: string
  description: string
  price: number
  isFixed: boolean
  active: boolean
  emoji: string
  image: string | null
}

export interface SaveVendorServiceRequest {
  serviceItemId?: number
  name?: string
  description?: string
  price?: number
  isFixed?: boolean
  active?: boolean
  image?: string | null
}

export interface StaffDto {
  id: number
  role: string
  name: string
  skill: string
  emoji: string
  phone: string
  active: boolean
  onJob: boolean
  plan: string
  expiry: string
  subscriptionActive: boolean
}

export interface TransactionDto {
  bookingId: string
  service: string
  customer: string
  date: string
  gross: number
  commission: number
  net: number
}

export interface PayoutDto {
  id: number
  label: string
  note: string
  amount: number
}

export interface EarningsDto {
  totalBookings: number
  completedBookings: number
  serviceEarnings: number
  platformFee: number
  netEarnings: number
  pendingPayout: number
  transactions: TransactionDto[]
  payouts: PayoutDto[]
}

export interface TechnicianSummaryDto {
  todayJobs: number
  inProgress: number
  completedToday: number
  todayEarnings: number
  totalEarnings: number
  pendingPayout: number
  completedJobs: number
  transactions: TransactionDto[]
}

// ---------------------------------------------------------------- admin

export interface AdminSummaryDto {
  customers: number
  vendors: number
  technicians: number
  bookings: number
  revenue: number
  commission: number
}

export interface CategoryShareDto {
  name: string
  percent: number
}

export interface ReportDto {
  totalBookings: number
  totalRevenue: number
  shares: CategoryShareDto[]
}

// ---------------------------------------------------------------- notifications

export interface NoticeDto {
  id: number
  text: string
  when: string
  unread: boolean
}

export interface NoticeListDto {
  unread: number
  items: NoticeDto[]
}
