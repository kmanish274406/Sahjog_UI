import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '@/api'
import type { AuthResult } from '@/api/types'
import { Button, Input } from '@/components/ui'
import { useApiMutation } from '@/hooks/useApi'
import { emailLoginSchema } from '../schemas/login.schema'
import type { EmailLoginValues } from '../schemas/login.schema'
import styles from './LoginForm.module.css'

/** Customers can also use an email and password; "Create account" signs a new one up. */
export function CustomerEmailSignIn({ onSignedIn }: { onSignedIn: (result: AuthResult) => void }) {
  const [signUp, setSignUp] = useState(false)
  const login = useApiMutation(
    (v: EmailLoginValues) => api.auth.customerEmail({ ...v, email: v.email.trim(), signUp }),
    {
      meta: { inline: true },
      onSuccess: onSignedIn,
    },
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({ resolver: zodResolver(emailLoginSchema) })

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      {signUp && (
        <Input
          label="Full name"
          placeholder="e.g. Anita Sharma"
          autoComplete="name"
          {...register('name')}
        />
      )}
      <Input
        label="Email address"
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
        placeholder={signUp ? 'Choose a password' : 'Enter your password'}
        autoComplete={signUp ? 'new-password' : 'current-password'}
        error={errors.password?.message}
        {...register('password')}
      />
      {login.isError && (
        <p role="alert" className={styles.error}>
          {login.error.message}
        </p>
      )}
      <Button type="submit" loading={login.isPending}>
        {signUp ? 'Create account' : 'Sign in'}
      </Button>
      <p className={styles.switch}>
        {signUp ? 'Already have an account? ' : 'New to Sahjog? '}
        <Button variant="ghost" size="sm" onClick={() => setSignUp(!signUp)}>
          {signUp ? 'Sign in' : 'Create an account'}
        </Button>
      </p>
    </form>
  )
}
