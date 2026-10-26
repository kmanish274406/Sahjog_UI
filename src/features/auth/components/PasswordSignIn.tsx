import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Input } from '@/components/ui'
import { useApiMutation } from '@/hooks/useApi'
import { emailLoginSchema, vendorLoginSchema } from '../schemas/login.schema'
import type { EmailLoginValues, VendorLoginValues } from '../schemas/login.schema'
import styles from './LoginForm.module.css'

export interface EmailSignInProps<TResult> {
  signIn: (email: string, password: string) => Promise<TResult>
  onSignedIn: (result: TResult) => void
  defaults?: Partial<EmailLoginValues>
  emailLabel?: string
}

/** Email and password: admins and the platform owner. */
export function EmailSignIn<TResult>({
  signIn,
  onSignedIn,
  defaults,
  emailLabel = 'Email',
}: EmailSignInProps<TResult>) {
  const login = useApiMutation((v: EmailLoginValues) => signIn(v.email.trim(), v.password), {
    meta: { inline: true },
    onSuccess: onSignedIn,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: defaults,
  })

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <Input
        label={emailLabel}
        required
        type="email"
        placeholder="you@example.com"
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        required
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {login.isError && (
        <p role="alert" className={styles.error}>
          {login.error.message}
        </p>
      )}
      <Button type="submit" loading={login.isPending}>
        Sign in
      </Button>
    </form>
  )
}

export interface PhoneSignInProps<TResult> {
  signIn: (phone: string, password: string) => Promise<TResult>
  onSignedIn: (result: TResult) => void
  defaults?: Partial<VendorLoginValues>
}

/** Mobile number and password: vendors. */
export function PhoneSignIn<TResult>({ signIn, onSignedIn, defaults }: PhoneSignInProps<TResult>) {
  const login = useApiMutation(
    (v: VendorLoginValues) => signIn(v.phone.replace(/\D/g, '').slice(-10), v.password),
    {
      meta: { inline: true },
      onSuccess: onSignedIn,
    },
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorLoginValues>({
    resolver: zodResolver(vendorLoginSchema),
    defaultValues: defaults,
  })

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <Input
        label="Mobile number"
        required
        placeholder="98765 43210"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        label="Password"
        required
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {login.isError && (
        <p role="alert" className={styles.error}>
          {login.error.message}
        </p>
      )}
      <Button type="submit" loading={login.isPending}>
        Sign in
      </Button>
    </form>
  )
}
