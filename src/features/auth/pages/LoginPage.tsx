import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { AuthResult, PlatformAuthResult } from '@/api/types'
import { Button, Tabs } from '@/components/ui'
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

const TABS: { id: Who; label: string }[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'technician', label: 'Technician' },
  { id: 'admin', label: 'Admin' },
  { id: 'owner', label: 'Owner' },
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
  const [who, setWho] = useState<Who>('customer')
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
  const change = (next: Who) => {
    setWho(next)
    setRegistering(false)
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <span className={styles.logoCard}>
            <img className={styles.logo} src="/sahjog-logo.png" alt="Sahjog" />
          </span>
        </div>
        <div>
          <p className={styles.tagline}>Har kaam ka saathi, one tap away.</p>
          <p className={styles.taglineSub}>
            Customers book verified professionals, vendors run their orders and teams, technicians
            take jobs, and every business is managed from one console.
          </p>
        </div>
        <p className={styles.legal}>© 2026 Sahjog. All rights reserved.</p>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formWrap}>
          <p className={styles.eyebrow}>{registering ? 'Get started' : 'Welcome back'}</p>
          <h1 className={styles.title}>{registering ? 'Create your account' : 'Sign in'}</h1>
          <p className={styles.subtitle}>{SUBTITLES[who]}</p>

          <div className={styles.tabs}>
            <Tabs
              items={TABS}
              active={who}
              onChange={change}
              label="Sign in as"
              variant="segmented"
            />
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

        {DEMO && (
          <p className={styles.note}>
            Development build: the fields are pre-filled with the demo accounts. The OTP is shown on
            screen while the API's demo mode is on. API: {env.apiUrl}
          </p>
        )}
      </main>
    </div>
  )
}
