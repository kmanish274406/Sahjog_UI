import { useState } from 'react'
import type { AuthResult, OtpResult } from '@/api/types'
import { Alert, Button, Input } from '@/components/ui'
import { normalisePhone } from '@/domain/validators'
import { useApiMutation } from '@/hooks/useApi'
import styles from './LoginForm.module.css'

export interface OtpSignInProps {
  sendOtp: (phone: string) => Promise<OtpResult>
  verify: (input: { phone: string; otp: string; name?: string }) => Promise<AuthResult>
  /** Customers can give a name the first time they sign in. */
  askName?: boolean
  onSignedIn: (result: AuthResult) => void
  defaultPhone?: string
}

/** Mobile number, then the 6-digit code sent to it. */
export function OtpSignIn({
  sendOtp,
  verify,
  askName = false,
  onSignedIn,
  defaultPhone = '',
}: OtpSignInProps) {
  const [phone, setPhone] = useState(defaultPhone)
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState<OtpResult | null>(null)
  const [phoneError, setPhoneError] = useState<string>()

  const send = useApiMutation(sendOtp, { meta: { inline: true }, onSuccess: setSent })
  const signIn = useApiMutation(verify, { meta: { inline: true }, onSuccess: onSignedIn })

  const clean = normalisePhone(phone)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!clean) {
      setPhoneError('Enter a valid 10-digit mobile number')
      return
    }
    setPhoneError(undefined)
    if (!sent) send.mutate(clean)
    else if (otp.trim().length === 6)
      signIn.mutate({ phone: clean, otp: otp.trim(), name: name.trim() || undefined })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Input
        label="Mobile number"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="98765 43210"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value)
          setSent(null)
          setOtp('')
        }}
        error={phoneError}
      />
      {sent && (
        <>
          <Alert tone="info">
            {sent.message}
            {sent.demoOtp && (
              <>
                {' '}
                Demo OTP: <strong>{sent.demoOtp}</strong>
              </>
            )}
          </Alert>
          {askName && (
            <Input
              label="Full name"
              placeholder="e.g. Anita Sharma"
              hint="Only needed the first time you sign in."
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
          <Input
            label="Verification code"
            required
            placeholder="6-digit OTP"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
          />
        </>
      )}
      {(send.isError || signIn.isError) && (
        <p role="alert" className={styles.error}>
          {(send.error ?? signIn.error)?.message}
        </p>
      )}
      <div className={styles.actions}>
        <Button
          type="submit"
          loading={send.isPending || signIn.isPending}
          disabled={sent !== null && otp.length !== 6}
        >
          {sent ? 'Verify and sign in' : 'Send OTP'}
        </Button>
        {sent && (
          <Button
            variant="ghost"
            onClick={() => clean && send.mutate(clean)}
            disabled={send.isPending}
          >
            Resend OTP
          </Button>
        )}
      </div>
    </form>
  )
}
