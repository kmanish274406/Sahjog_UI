import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Input } from '@/components/ui'
import { normaliseEmail } from '@/domain/validators'
import { useApiMutation } from '@/hooks/useApi'
import { emailLoginSchema } from '../schemas/login.schema'
import type { EmailLoginValues } from '../schemas/login.schema'
import styles from './LoginForm.module.css'

export interface EmailSignInProps<TResult> {
  signIn: (email: string, password: string) => Promise<TResult>
  onSignedIn: (result: TResult) => void
  defaults?: Partial<EmailLoginValues>
  emailLabel?: string
}

/** Email and password sign-in shared by vendors, technicians, admins and the platform owner. */
export function EmailSignIn<TResult>({
  signIn,
  onSignedIn,
  defaults,
  emailLabel = 'Email',
}: EmailSignInProps<TResult>) {
  const login = useApiMutation(
    (v: EmailLoginValues) => signIn(normaliseEmail(v.email), v.password),
    {
      meta: { inline: true },
      onSuccess: onSignedIn,
    },
  )
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
