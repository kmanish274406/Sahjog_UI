import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { api } from '@/api'
import type { AuthResult } from '@/api/types'
import { Button, Input, Textarea } from '@/components/ui'
import { Checkbox } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { normalisePhone } from '@/domain/validators'
import { technicianRegisterSchema, vendorRegisterSchema } from '../schemas/login.schema'
import type { TechnicianRegisterValues, VendorRegisterValues } from '../schemas/login.schema'
import styles from './LoginForm.module.css'

function CategoryChecks({
  value,
  onChange,
  label,
  error,
}: {
  value: string[]
  onChange: (next: string[]) => void
  label: string
  error?: string
}) {
  // The sign-in page is public, so the categories come from the public catalogue.
  const { data = [] } = useApiQuery(['catalog', 'categories'], api.catalog.categories)
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name])
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.checks}>
        {data.map((category) => (
          <Checkbox key={category.id} label={category.name} checked={value.includes(category.name)} onChange={() => toggle(category.name)} />
        ))}
      </div>
      {error && (
        <span role="alert" style={{ color: 'var(--color-danger)', fontSize: 12 }}>
          {error}
        </span>
      )}
    </div>
  )
}

/** A vendor registers their business and is signed in straight away. */
export function VendorRegisterForm({ onSignedIn }: { onSignedIn: (result: AuthResult) => void }) {
  const register_ = useApiMutation(
    (v: VendorRegisterValues) =>
      api.auth.vendorRegister({ ...v, phone: normalisePhone(v.phone) ?? v.phone, gst: v.gst || undefined }),
    { meta: { inline: true }, onSuccess: onSignedIn },
  )
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorRegisterValues>({ resolver: zodResolver(vendorRegisterSchema), defaultValues: { categories: [] } })

  return (
    <form className={styles.form} onSubmit={handleSubmit((values) => register_.mutate(values))} noValidate>
      <Input label="Business name" required error={errors.business?.message} {...register('business')} />
      <Input label="Owner name" required autoComplete="name" error={errors.owner?.message} {...register('owner')} />
      <Input label="Mobile number" required type="tel" inputMode="numeric" error={errors.phone?.message} {...register('phone')} />
      <Input label="Email" required type="email" error={errors.email?.message} {...register('email')} />
      <Input label="GST number" hint="Optional." error={errors.gst?.message} {...register('gst')} />
      <Textarea label="Business address" required rows={2} error={errors.address?.message} {...register('address')} />
      <Controller
        control={control}
        name="categories"
        render={({ field }) => (
          <CategoryChecks label="Services you offer" value={field.value} onChange={field.onChange} error={errors.categories?.message} />
        )}
      />
      {register_.isError && (
        <p role="alert" className={styles.error}>
          {register_.error.message}
        </p>
      )}
      <Button type="submit" loading={register_.isPending}>
        Register my business
      </Button>
    </form>
  )
}

/** A technician registers and is signed in straight away. */
export function TechnicianRegisterForm({ onSignedIn }: { onSignedIn: (result: AuthResult) => void }) {
  const register_ = useApiMutation(
    (v: TechnicianRegisterValues) =>
      api.auth.technicianRegister({ ...v, phone: normalisePhone(v.phone) ?? v.phone, aadhaar: v.aadhaar || undefined }),
    { meta: { inline: true }, onSuccess: onSignedIn },
  )
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(technicianRegisterSchema), defaultValues: { skills: [] as string[], experience: 0 } })

  return (
    <form className={styles.form} onSubmit={handleSubmit((values) => register_.mutate(values as TechnicianRegisterValues))} noValidate>
      <Input label="Full name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Mobile number" required type="tel" inputMode="numeric" error={errors.phone?.message} {...register('phone')} />
      <Controller
        control={control}
        name="skills"
        render={({ field }) => (
          <CategoryChecks label="Your skills" value={field.value} onChange={field.onChange} error={errors.skills?.message} />
        )}
      />
      <Input label="Years of experience" required type="number" min={0} max={60} error={errors.experience?.message} {...register('experience')} />
      <Input label="Aadhaar number" hint="Optional." error={errors.aadhaar?.message} {...register('aadhaar')} />
      <Textarea label="Address" required rows={2} error={errors.address?.message} {...register('address')} />
      {register_.isError && (
        <p role="alert" className={styles.error}>
          {register_.error.message}
        </p>
      )}
      <Button type="submit" loading={register_.isPending}>
        Register as a technician
      </Button>
    </form>
  )
}
