import { request } from './http'
import type {
  AddressDto,
  AdminSummaryDto,
  AuthResult,
  BookingDto,
  CancelQuoteDto,
  CategoryDto,
  ContentDto,
  CouponResult,
  CreateTenantRequest,
  CustomerVerifyRequest,
  EarningsDto,
  EmailAuthRequest,
  FeatureDefDto,
  Features,
  MastersDto,
  NoticeListDto,
  PaymentMethodDefDto,
  PlanTemplateDto,
  SaveFeatureDefRequest,
  SavePaymentMethodDefRequest,
  SavePlanTemplateRequest,
  OtpResult,
  PaymentOrderDto,
  PaymentRowDto,
  PlaceBookingRequest,
  PlacedBookingDto,
  PlaceDto,
  PlaceSuggestionDto,
  PlanDto,
  PlatformAuthResult,
  ProfileDto,
  ProviderDto,
  ReportDto,
  RoleAccessDto,
  SaveAddressRequest,
  SaveCategoryRequest,
  SaveContentRequest,
  SaveServiceRequest,
  SaveVendorServiceRequest,
  ServiceDto,
  SettingsDto,
  StaffDto,
  TechnicianRegisterRequest,
  TechnicianSummaryDto,
  TenantCreatedDto,
  TenantDto,
  TenantInfoDto,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  VendorRegisterRequest,
  VendorServiceDto,
} from './types'

const enc = encodeURIComponent
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ?? {} })
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body })
const del = (path: string) => request<boolean>(path, { method: 'DELETE' })

/**
 * The only door the screens use to reach the Sahjog API. One group per area of the API; each call
 * returns the unwrapped data and throws an ApiError carrying the server's own message.
 */
export const api = {
  auth: {
    access: () => request<string[]>('/api/auth/access'),
    customerSendOtp: (phone: string) =>
      request<OtpResult>('/api/auth/customer/send-otp', {
        method: 'POST',
        body: { phone },
        auth: false,
      }),
    customerVerify: (r: CustomerVerifyRequest) =>
      request<AuthResult>('/api/auth/customer/verify', { method: 'POST', body: r, auth: false }),
    customerEmail: (r: EmailAuthRequest) =>
      request<AuthResult>('/api/auth/customer/email', { method: 'POST', body: r, auth: false }),
    vendorLogin: (phone: string, password: string) =>
      request<AuthResult>('/api/auth/vendor/login', {
        method: 'POST',
        body: { phone, password },
        auth: false,
      }),
    vendorRegister: (r: VendorRegisterRequest) =>
      request<AuthResult>('/api/auth/vendor/register', { method: 'POST', body: r, auth: false }),
    technicianSendOtp: (phone: string) =>
      request<OtpResult>('/api/auth/technician/send-otp', {
        method: 'POST',
        body: { phone },
        auth: false,
      }),
    technicianVerify: (phone: string, otp: string) =>
      request<AuthResult>('/api/auth/technician/verify', {
        method: 'POST',
        body: { phone, otp },
        auth: false,
      }),
    technicianRegister: (r: TechnicianRegisterRequest) =>
      request<AuthResult>('/api/auth/technician/register', {
        method: 'POST',
        body: r,
        auth: false,
      }),
    adminLogin: (email: string, password: string) =>
      request<AuthResult>('/api/auth/admin/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      }),
    platformLogin: (email: string, password: string) =>
      request<PlatformAuthResult>('/api/platform/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      }),
    logout: (refreshToken: string) =>
      request<boolean>('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
    me: () => request<ProfileDto>('/api/auth/me'),
    updateMe: (r: UpdateProfileRequest) => put<ProfileDto>('/api/auth/me', r),
  },

  tenant: {
    current: () => request<TenantDto>('/api/tenant', { auth: false }),
    mine: () => request<TenantInfoDto>('/api/admin/tenant'),
  },

  catalog: {
    categories: () => request<CategoryDto[]>('/api/catalog/categories'),
    services: (params: { q?: string; categoryId?: number } = {}) =>
      request<ServiceDto[]>('/api/catalog/services', { query: params }),
    providers: (serviceId: number) =>
      request<ProviderDto[]>(`/api/catalog/services/${serviceId}/providers`),
    settings: () => request<SettingsDto>('/api/catalog/settings'),
    plans: (kind?: string) => request<PlanDto[]>('/api/catalog/plans', { query: { kind } }),
    content: () => request<ContentDto[]>('/api/catalog/content'),
  },

  customer: {
    addresses: () => request<AddressDto[]>('/api/customer/addresses'),
    addAddress: (r: SaveAddressRequest) => post<AddressDto>('/api/customer/addresses', r),
    updateAddress: (id: number, r: SaveAddressRequest) =>
      put<AddressDto>(`/api/customer/addresses/${id}`, r),
    deleteAddress: (id: number) => del(`/api/customer/addresses/${id}`),
    checkCoupon: (code: string) => post<CouponResult>('/api/customer/coupon', { code }),
  },

  places: {
    search: (q: string) => request<PlaceSuggestionDto[]>('/api/places/search', { query: { q } }),
    details: (id: string) => request<PlaceDto>('/api/places/details', { query: { id } }),
    reverse: (lat: number, lng: number) =>
      request<PlaceDto>('/api/places/reverse', { query: { lat, lng } }),
  },

  bookings: {
    list: () => request<BookingDto[]>('/api/bookings'),
    get: (code: string) => request<BookingDto>(`/api/bookings/${enc(code)}`),
    place: (r: PlaceBookingRequest) => post<PlacedBookingDto>('/api/bookings', r),
    cancelQuote: (code: string) =>
      request<CancelQuoteDto>(`/api/bookings/${enc(code)}/cancel-quote`),
    cancel: (code: string) => post<BookingDto>(`/api/bookings/${enc(code)}/cancel`),
    reschedule: (code: string, date: string, time: string) =>
      post<BookingDto>(`/api/bookings/${enc(code)}/reschedule`, { date, time }),
    accept: (code: string) => post<BookingDto>(`/api/bookings/${enc(code)}/accept`),
    reject: (code: string) => post<BookingDto>(`/api/bookings/${enc(code)}/reject`),
    assign: (code: string, technicianId: number) =>
      post<BookingDto>(`/api/bookings/${enc(code)}/assign`, { technicianId }),
    take: (code: string) => post<BookingDto>(`/api/bookings/${enc(code)}/take`),
    start: (code: string) => post<BookingDto>(`/api/bookings/${enc(code)}/start`),
    complete: (code: string, otp: string) =>
      post<BookingDto>(`/api/bookings/${enc(code)}/complete`, { otp }),
  },

  payments: {
    forBooking: (r: PlaceBookingRequest) => post<PaymentOrderDto>('/api/payments/booking', r),
    forSubscription: (planId: number) =>
      post<PaymentOrderDto>('/api/payments/subscription', { planId }),
    get: (id: string) => request<PaymentOrderDto>(`/api/payments/${enc(id)}`),
    list: () => request<PaymentRowDto[]>('/api/payments'),
    refund: (id: string, amount?: number) =>
      post<PaymentRowDto>(`/api/payments/${enc(id)}/refund`, { amount }),
  },

  vendor: {
    services: () => request<VendorServiceDto[]>('/api/vendor/services'),
    addService: (r: SaveVendorServiceRequest) => post<VendorServiceDto>('/api/vendor/services', r),
    updateService: (id: number, r: SaveVendorServiceRequest) =>
      put<VendorServiceDto>(`/api/vendor/services/${id}`, r),
    deleteService: (id: number) => del(`/api/vendor/services/${id}`),
    technicians: () => request<StaffDto[]>('/api/vendor/technicians'),
    addTechnician: (r: { name: string; skill?: string; phone?: string }) =>
      post<StaffDto>('/api/vendor/technicians', r),
    removeTechnician: (id: number) => del(`/api/vendor/technicians/${id}`),
    earnings: () => request<EarningsDto>('/api/vendor/earnings'),
    requestPayout: () => post<EarningsDto>('/api/vendor/payouts'),
  },

  technician: {
    summary: () => request<TechnicianSummaryDto>('/api/technician/summary'),
  },

  subscription: {
    subscribe: (planId: number, paymentId?: string) =>
      post<ProfileDto>('/api/subscription', { planId, paymentId }),
  },

  notifications: {
    list: () => request<NoticeListDto>('/api/notifications'),
    markRead: () => post<boolean>('/api/notifications/read'),
    dismiss: (id: number) => del(`/api/notifications/${id}`),
    clear: () => del('/api/notifications'),
  },

  uploads: {
    image: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<string>('/api/uploads', { method: 'POST', form })
    },
  },

  admin: {
    summary: () => request<AdminSummaryDto>('/api/admin/summary'),
    report: () => request<ReportDto>('/api/admin/report'),
    users: (role?: 'Vendor' | 'Technician') =>
      request<StaffDto[]>('/api/admin/users', { query: { role } }),
    setUserActive: (id: number, active: boolean) =>
      put<StaffDto>(`/api/admin/users/${id}/active`, { active }),
    extendPlan: (id: number, months: number) =>
      post<StaffDto>(`/api/admin/users/${id}/extend`, { months }),
    categories: () => request<CategoryDto[]>('/api/admin/categories'),
    addCategory: (r: SaveCategoryRequest) => post<CategoryDto>('/api/admin/categories', r),
    updateCategory: (id: number, r: SaveCategoryRequest) =>
      put<CategoryDto>(`/api/admin/categories/${id}`, r),
    services: (q?: string) => request<ServiceDto[]>('/api/admin/services', { query: { q } }),
    addService: (r: SaveServiceRequest) => post<ServiceDto>('/api/admin/services', r),
    updateService: (id: number, r: SaveServiceRequest) =>
      put<ServiceDto>(`/api/admin/services/${id}`, r),
    content: () => request<ContentDto[]>('/api/admin/content'),
    addContent: (r: SaveContentRequest) => post<ContentDto>('/api/admin/content', r),
    updateContent: (id: number, r: SaveContentRequest) =>
      put<ContentDto>(`/api/admin/content/${id}`, r),
    deleteContent: (id: number) => del(`/api/admin/content/${id}`),
    updateSettings: (r: UpdateSettingsRequest) => put<SettingsDto>('/api/admin/settings', r),
    updatePlans: (rows: { planId: number; price: number }[]) =>
      put<PlanDto[]>('/api/admin/plans', rows),
  },

  platform: {
    access: () => request<string[]>('/api/platform/access'),
    adminRole: () => request<RoleAccessDto>('/api/platform/roles/admin'),
    saveAdminRole: (accessIds: string[]) =>
      put<RoleAccessDto>('/api/platform/roles/admin', { accessIds }),
    tenants: () => request<TenantInfoDto[]>('/api/platform/tenants'),
    createTenant: (r: CreateTenantRequest) => post<TenantCreatedDto>('/api/platform/tenants', r),
    setTenantActive: (id: number, active: boolean) =>
      put<TenantInfoDto>(`/api/platform/tenants/${id}/active`, { active }),
    setFeatures: (id: number, features: Partial<Features>) =>
      put<Features>(`/api/platform/tenants/${id}/features`, features),
    masters: () => request<MastersDto>('/api/platform/masters'),
    addFeature: (r: SaveFeatureDefRequest) =>
      post<FeatureDefDto>('/api/platform/masters/features', r),
    updateFeature: (code: string, r: SaveFeatureDefRequest) =>
      put<FeatureDefDto>(`/api/platform/masters/features/${encodeURIComponent(code)}`, r),
    addPaymentMethod: (r: SavePaymentMethodDefRequest) =>
      post<PaymentMethodDefDto>('/api/platform/masters/payment-methods', r),
    updatePaymentMethod: (code: string, r: SavePaymentMethodDefRequest) =>
      put<PaymentMethodDefDto>(
        `/api/platform/masters/payment-methods/${encodeURIComponent(code)}`,
        r,
      ),
    addPlanTemplate: (r: SavePlanTemplateRequest) =>
      post<PlanTemplateDto>('/api/platform/masters/plans', r),
    updatePlanTemplate: (id: number, r: SavePlanTemplateRequest) =>
      put<PlanTemplateDto>(`/api/platform/masters/plans/${id}`, r),
    deletePlanTemplate: (id: number) => del(`/api/platform/masters/plans/${id}`),
  },
}
