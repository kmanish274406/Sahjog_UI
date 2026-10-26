import { describe, expect, it } from 'vitest'
import { sessionFromAuth, sessionFromPlatform } from '@/features/auth/utils/session'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { api } from './index'
import { env } from '@/config/env'

/**
 * Drives one booking through every role against a running API (seeded demo tenant, Test payment gateway).
 * Skipped unless VITE_TEST_API is set, because it writes data. Use a development database:
 *   VITE_API_URL=http://localhost:5191 VITE_TEST_API=1 npx vitest run src/api/api.integration.test.ts
 */
const live = Boolean(import.meta.env.VITE_TEST_API)

describe.skipIf(!live)('Sahjog API, end to end', () => {
  const as = (session: ReturnType<typeof sessionFromAuth>) =>
    useAuthStore.getState().setSession(session)

  it('takes a booking from request to completion through every role', async () => {
    useAuthStore.setState({ tenant: '1' })

    // --- customer: browse, then book and pay through the gateway
    const otp = await api.auth.customerSendOtp('9876543210')
    expect(otp.message).toContain('OTP')
    const customerSignIn = await api.auth.customerVerify({ phone: '9876543210', otp: '123456' })
    as(sessionFromAuth(customerSignIn))
    expect(customerSignIn.refreshToken.length).toBeGreaterThan(20)

    const [categories, services, settings, content] = await Promise.all([
      api.catalog.categories(),
      api.catalog.services(),
      api.catalog.settings(),
      api.catalog.content(),
    ])
    expect(categories.length).toBeGreaterThan(0)
    expect(settings.onlinePayments).toBe(true)
    expect(content.some((c) => c.section === 'slot')).toBe(true)

    const service = services.find((s) => s.providers > 0)!
    const providers = await api.catalog.providers(service.id)
    const provider = providers[0]!
    const slot = content.find((c) => c.section === 'slot')!.title

    // A date that is always inside the allowed window and never "today" (so no slot has already started).
    const day = new Date(Date.now() + 3 * 86_400_000)
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    const request = {
      vendorServiceId: provider.vendorServiceId,
      serviceItemId: service.id,
      date,
      time: slot,
      qty: 1,
      address: '12 MG Road, Indiranagar, Bengaluru',
      payMethod: 'UPI',
    }
    const order = await api.payments.forBooking(request)
    expect(order.checkoutUrl).toContain('/pay/')
    const simulated = await fetch(`${env.apiUrl}/pay/${order.id}/simulate?ok=true`, {
      method: 'POST',
    })
    expect(simulated.ok).toBe(true)
    expect((await api.payments.get(order.id)).status).toBe('Paid')

    const placed = await api.bookings.place({ ...request, paymentId: order.id })
    const code = placed.booking.id
    expect(placed.booking.stage).toBe('Requested')

    // --- vendor: accept, then assign a technician
    const vendorSignIn = await api.auth.vendorLogin('9876543210', 'anything')
    as(sessionFromAuth(vendorSignIn))
    const incoming = (await api.bookings.list()).find((b) => b.id === code)
    expect(incoming).toBeDefined()
    expect((await api.bookings.accept(code)).stage).toBe('Accepted')
    const team = (await api.vendor.technicians()).filter((t) => t.active && t.phone)
    expect(team.length).toBeGreaterThan(0)
    const tech = team[0]!
    expect((await api.bookings.assign(code, tech.id)).stage).toBe('Assigned')
    expect((await api.vendor.earnings()).totalBookings).toBeGreaterThan(0)

    // --- customer: sees the cancellation charge while the job is only assigned
    as(sessionFromAuth(customerSignIn))
    const quote = await api.bookings.cancelQuote(code)
    expect(quote.refund).toBeGreaterThanOrEqual(0)

    // --- technician: start, then complete with the customer's OTP
    await api.auth.technicianSendOtp(tech.phone)
    const technicianSignIn = await api.auth.technicianVerify(tech.phone, '123456')
    as(sessionFromAuth(technicianSignIn))
    expect((await api.bookings.start(code)).stage).toBe('InProgress')

    // The job-closing OTP is shown to the customer once the job has started.
    as(sessionFromAuth(customerSignIn))
    const closingOtp = (await api.bookings.get(code)).otp
    expect(closingOtp).toBeTruthy()

    as(sessionFromAuth(technicianSignIn))
    await expect(api.bookings.complete(code, '000000')).rejects.toThrow(/OTP/i)
    expect((await api.bookings.complete(code, closingOtp!)).stage).toBe('Completed')
    expect((await api.technician.summary()).completedJobs).toBeGreaterThan(0)

    // --- admin: reads the business and the payment
    const adminSignIn = await api.auth.adminLogin('admin@sahjog.in', 'Admin@123')
    as(sessionFromAuth(adminSignIn))
    const [summary, report, payments, users, tenant] = await Promise.all([
      api.admin.summary(),
      api.admin.report(),
      api.payments.list(),
      api.admin.users('Vendor'),
      api.tenant.mine(),
    ])
    expect(summary.bookings).toBeGreaterThan(0)
    expect(report.totalBookings).toBeGreaterThan(0)
    expect(payments.some((p) => p.id === order.id)).toBe(true)
    expect(users.length).toBeGreaterThan(0)
    expect(tenant.code).toBeTruthy()
  }, 60_000)

  it('keeps the platform owner signed in by renewing the token', async () => {
    const owner = await api.auth.platformLogin('superadmin@sahjog.in', 'SuperAdmin@123')
    useAuthStore.getState().setSession(sessionFromPlatform(owner))
    expect((await api.platform.tenants()).length).toBeGreaterThan(0)

    // Make the access token unusable: the client renews it by itself and repeats the call.
    useAuthStore.getState().setTokens('not-a-valid-token', owner.refreshToken)
    expect((await api.platform.tenants()).length).toBeGreaterThan(0)
    expect(useAuthStore.getState().refreshToken).not.toBe(owner.refreshToken)
  })

  it('refuses a customer the admin screens', async () => {
    const result = await api.auth.customerVerify({ phone: '9876543210', otp: '123456' })
    useAuthStore.getState().setSession(sessionFromAuth(result))
    await expect(api.admin.summary()).rejects.toMatchObject({ status: 403 })
  })
})
