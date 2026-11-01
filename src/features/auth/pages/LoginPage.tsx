import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { AuthResult, PlatformAuthResult } from '@/api/types'
import { Alert, Button } from '@/components/ui'
import { ArrowLeft, ArrowRight, Building2, HardHat, ShieldCheck, Store } from 'lucide-react'
import { env } from '@/config/env'
import { ROUTES } from '@/config/routes'
import { useContent } from '@/features/catalog/hooks/useCatalog'
import { CustomerEmailSignIn } from '../components/CustomerEmailSignIn'
import { OtpSignIn } from '../components/OtpSignIn'
import { EmailSignIn } from '../components/PasswordSignIn'
import { TechnicianRegisterForm, VendorRegisterForm } from '../components/RegisterForms'
import { useAuthStore } from '../store/auth.store'
import { sessionFromAuth, sessionFromPlatform } from '../utils/session'
import styles from './LoginPage.module.css'

type Who = 'customer' | 'vendor' | 'technician' | 'admin' | 'owner'

const ROLES: { id: Exclude<Who, 'customer'>; label: string; icon: typeof Store; tint: string }[] = [
  { id: 'vendor', label: 'Vendor', icon: Store, tint: styles.tintBlue },
  { id: 'technician', label: 'Technician', icon: HardHat, tint: styles.tintOrange },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, tint: styles.tintPurple },
  { id: 'owner', label: 'Platform owner', icon: Building2, tint: styles.tintNavy },
]

const SUBTITLES: Record<Who, string> = {
  customer: 'Book trusted professionals for every job at home.',
  vendor: 'Manage your services, orders and technicians.',
  technician: 'Take jobs, update their status and track your earnings.',
  admin: 'Manage users, services, fees and reports for your business.',
  owner: 'Create and manage the businesses on the platform.',
}

interface LocationState {
  from?: { pathname: string }
}

// Demo accounts of the seeded database; shown only while developing.
const DEMO = import.meta.env.DEV

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const [who, setWho] = useState<Who | null>(null)
  const [customerMode, setCustomerMode] = useState<'otp' | 'email'>('otp')
  const [registering, setRegistering] = useState(false)
  const [technicianLoginMode, setTechnicianLoginMode] = useState<'password' | 'otp'>(
    DEMO ? 'otp' : 'password',
  )

  const from = (location.state as LocationState | null)?.from?.pathname

  if (user) {
    return (
      <Navigate
        to={user.role === 'super_admin' ? ROUTES.clients : (from ?? ROUTES.dashboard)}
        replace
      />
    )
  }

  const signedIn = (result: AuthResult) => {
    setSession(sessionFromAuth(result))
    const needsPlan =
      ['vendor', 'technician'].includes(result.profile.role.toLowerCase()) &&
      (result.profile.approvalStatus === 'pending' || !result.profile.subscriptionActive)
    navigate(needsPlan ? ROUTES.plans : (from ?? ROUTES.dashboard), { replace: true })
  }
  const ownerSignedIn = (result: PlatformAuthResult) => {
    setSession(sessionFromPlatform(result))
    navigate(ROUTES.clients, { replace: true })
  }
  const change = (next: Who | null) => {
    setWho(next)
    setRegistering(false)
    setTechnicianLoginMode(DEMO ? 'otp' : 'password')
  }

  if (who === null) {
    return <LoginLanding onSelect={change} />
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <div>
          <button type="button" className={styles.back} onClick={() => change(null)}>
            <ArrowLeft size={16} aria-hidden /> Back
          </button>
          <div className={styles.formHead}>
            <div>
              <h1 className={styles.title}>{registering ? 'Create your account' : 'Sign in'}</h1>
              <p className={styles.subtitle}>{SUBTITLES[who]}</p>
            </div>
          </div>

          {who === 'customer' && (
            <>
              {customerMode === 'otp' ? (
                <OtpSignIn
                  askName
                  sendOtp={api.auth.customerSendOtp}
                  verify={(v) => api.auth.customerVerify(v)}
                  onSignedIn={signedIn}
                  defaultPhone={DEMO ? '9876543210' : ''}
                />
              ) : (
                <CustomerEmailSignIn onSignedIn={signedIn} />
              )}
              <p className={styles.switchRow}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomerMode(customerMode === 'otp' ? 'email' : 'otp')}
                >
                  {customerMode === 'otp'
                    ? 'Use email and password instead'
                    : 'Use my mobile number instead'}
                </Button>
              </p>
            </>
          )}

          {who === 'vendor' &&
            (registering ? (
              <VendorRegisterForm onSignedIn={signedIn} />
            ) : (
              <EmailSignIn
                signIn={api.auth.vendorEmailLogin}
                onSignedIn={signedIn}
                emailLabel="Vendor email"
                defaults={
                  DEMO ? { email: 'rajesh@cooltech.in', password: 'Vendor@123' } : undefined
                }
              />
            ))}

          {who === 'technician' &&
            (registering ? (
              <TechnicianRegisterForm onSignedIn={signedIn} />
            ) : technicianLoginMode === 'password' ? (
              <>
                <EmailSignIn
                  signIn={api.auth.technicianLogin}
                  onSignedIn={signedIn}
                  emailLabel="Technician email"
                />
                <p className={styles.switchRow}>
                  <Button variant="ghost" size="sm" onClick={() => setTechnicianLoginMode('otp')}>
                    Use mobile OTP for an existing account
                  </Button>
                </p>
              </>
            ) : (
              <>
                <OtpSignIn
                  sendOtp={api.auth.technicianSendOtp}
                  verify={(v) => api.auth.technicianVerify(v.phone, v.otp)}
                  onSignedIn={signedIn}
                  defaultPhone={DEMO ? '9876500011' : ''}
                />
                <p className={styles.switchRow}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTechnicianLoginMode('password')}
                  >
                    Use email and password
                  </Button>
                </p>
              </>
            ))}

          {who === 'admin' && (
            <EmailSignIn
              signIn={api.auth.adminLogin}
              onSignedIn={signedIn}
              emailLabel="Admin email"
              defaults={DEMO ? { email: 'admin@sahjog.in', password: 'Admin@123' } : undefined}
            />
          )}

          {who === 'owner' && (
            <EmailSignIn
              signIn={api.auth.platformLogin}
              onSignedIn={ownerSignedIn}
              emailLabel="Owner email"
            />
          )}

          {(who === 'vendor' || who === 'technician') && (
            <p className={styles.switchRow}>
              {registering
                ? 'Already registered? '
                : who === 'vendor'
                  ? 'New vendor? '
                  : 'New technician? '}
              <Button variant="ghost" size="sm" onClick={() => setRegistering(!registering)}>
                {registering ? 'Sign in' : 'Register'}
              </Button>
            </p>
          )}
        </div>
      </main>

      {DEMO && (
        <p className={styles.note}>
          Development build: demo account fields are pre-filled. Platform-owner credentials must be
          configured on the API. The OTP is shown on screen while the API's demo mode is on. API:{' '}
          {env.apiUrl}
        </p>
      )}
    </div>
  )
}

function LoginLanding({ onSelect }: { onSelect: (role: Who) => void }) {
  const content = useContent()
  const [activeBanner, setActiveBanner] = useState(0)
  const banners = content
    .list('banner')
    .filter((row) => row.active && row.code !== 'button')
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const bannerIndex = banners.length ? activeBanner % banners.length : 0
  const banner = banners[bannerIndex]

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <img className={styles.logo} src="/sahjog-logo.png" alt="Sahjog" />
        <section
          className={styles.banner}
          role="region"
          aria-label="Sahjog highlights"
          aria-roledescription="carousel"
        >
          <img className={styles.bannerArt} src="/hero-home.svg" alt="" />
          <div className={styles.bannerCopy} aria-live="polite" aria-atomic="true">
            <h1 className={styles.bannerTitle}>
              {banner?.title ??
                content.text('app', 'tagline', 'Trusted professionals for every job at home')}
            </h1>
            <p className={styles.bannerText}>
              {banner?.text ||
                content.text('app', 'ask', 'Book trusted professionals for your home.')}
            </p>
          </div>
          {banners.length > 1 && (
            <div className={styles.carouselControls} role="group" aria-label="Banner controls">
              <button
                type="button"
                className={styles.carouselArrow}
                aria-label="Previous banner"
                onClick={() => setActiveBanner((bannerIndex - 1 + banners.length) % banners.length)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <div className={styles.carouselDots}>
                {banners.map((row, index) => (
                  <button
                    key={row.id}
                    type="button"
                    className={styles.carouselDot}
                    aria-label={`Show banner ${index + 1} of ${banners.length}`}
                    aria-pressed={index === bannerIndex}
                    onClick={() => setActiveBanner(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.carouselArrow}
                aria-label="Next banner"
                onClick={() => setActiveBanner((bannerIndex + 1) % banners.length)}
              >
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
        {content.error && (
          <Alert tone="warning" title="Banner content could not be loaded">
            {content.error.message}
          </Alert>
        )}
        <button type="button" className={styles.start} onClick={() => onSelect('customer')}>
          Get Started
        </button>
        <p className={styles.or}>Working with Sahjog?</p>
        <div className={styles.roles}>
          {ROLES.map(({ id, label, icon: Icon, tint }) => (
            <button key={id} type="button" className={styles.role} onClick={() => onSelect(id)}>
              <span className={`${styles.badge} ${tint}`}>
                <Icon size={22} aria-hidden />
              </span>
              {label}
            </button>
          ))}
        </div>
      </main>
      <p className={styles.legal}>© 2026 Sahjog. All rights reserved.</p>
    </div>
  )
}
