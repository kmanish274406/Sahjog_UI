import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { AuthResult, PlatformAuthResult } from '@/api/types'
import { ArrowLeft, Building2, HardHat, ShieldCheck, Store } from 'lucide-react'
import { Button } from '@/components/ui'
import { env } from '@/config/env'
import { ROUTES } from '@/config/routes'
import { CustomerEmailSignIn } from '../components/CustomerEmailSignIn'
import { OtpSignIn } from '../components/OtpSignIn'
import { EmailSignIn, PhoneSignIn } from '../components/PasswordSignIn'
import { TechnicianRegisterForm, VendorRegisterForm } from '../components/RegisterForms'
import { useAuthStore } from '../store/auth.store'
import { sessionFromAuth, sessionFromPlatform } from '../utils/session'
import styles from './LoginPage.module.css'

type Who = 'customer' | 'vendor' | 'technician' | 'admin' | 'owner'

const ROLES: { id: Exclude<Who, 'customer'>; label: string; icon: typeof Store; tint: string }[] = [
  { id: 'vendor', label: 'Vendor', icon: Store, tint: styles.tintBlue },
  { id: 'technician', label: 'Technician', icon: HardHat, tint: styles.tintOrange },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, tint: styles.tintPurple },
  { id: 'owner', label: 'Owner', icon: Building2, tint: styles.tintNavy },
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
    navigate(from ?? ROUTES.dashboard, { replace: true })
  }
  const ownerSignedIn = (result: PlatformAuthResult) => {
    setSession(sessionFromPlatform(result))
    navigate(ROUTES.clients, { replace: true })
  }
  const change = (next: Who | null) => {
    setWho(next)
    setRegistering(false)
  }

  if (who === null) {
    return (
      <div className={styles.page}>
        <main className={styles.shell}>
          <img className={styles.logo} src="/sahjog-logo.png" alt="Sahjog" />
          <img className={styles.hero} src="/hero-home.svg" alt="" />
          <button type="button" className={styles.start} onClick={() => change('customer')}>
            Get Started
          </button>
          <p className={styles.or}>Working with Sahjog?</p>
          <div className={styles.roles}>
            {ROLES.map(({ id, label, icon: Icon, tint }) => (
              <button key={id} type="button" className={styles.role} onClick={() => change(id)}>
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
              <PhoneSignIn
                signIn={api.auth.vendorLogin}
                onSignedIn={signedIn}
                defaults={DEMO ? { phone: '9876543210', password: 'Vendor@123' } : undefined}
              />
            ))}

          {who === 'technician' &&
            (registering ? (
              <TechnicianRegisterForm onSignedIn={signedIn} />
            ) : (
              <OtpSignIn
                sendOtp={api.auth.technicianSendOtp}
                verify={(v) => api.auth.technicianVerify(v.phone, v.otp)}
                onSignedIn={signedIn}
                defaultPhone={DEMO ? '9876500011' : ''}
              />
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
          Development build: the fields are pre-filled with the demo accounts. The OTP is shown on
          screen while the API's demo mode is on. API: {env.apiUrl}
        </p>
      )}
    </div>
  )
}
