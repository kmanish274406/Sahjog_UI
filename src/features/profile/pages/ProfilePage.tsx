import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { ProfileDto, UpdateProfileRequest } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Input,
  Panel,
  Textarea,
  Toggle,
} from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'
import { AadhaarImage } from '../components/AadhaarImage'
import { PhotoPicker } from '../components/PhotoPicker'
import { validateProfile } from '../utils/profile.validation'
import type { ProfileFormValues } from '../utils/profile.validation'

/** Today as yyyy-MM-dd, the latest date of birth the date field accepts. */
const today = () => new Date().toISOString().slice(0, 10)

/** 234567890123 becomes "2345 6789 0123" while typing. */
const groupAadhaar = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

export default function ProfilePage() {
  const profile = useApiQuery(['profile'], api.auth.me)
  return (
    <div className={shared.stack}>
      <PageHeader
        title="Profile"
        description="Your details and preferences. Click Save changes to update them."
      />
      <QueryState isLoading={profile.isLoading} error={profile.error}>
        {profile.data && <ProfileForms profile={profile.data} />}
      </QueryState>
    </div>
  )
}

function ProfileForms({ profile }: { profile: ProfileDto }) {
  const role = useAuthStore((state) => state.user?.role)
  const updateUser = useAuthStore((state) => state.updateUser)
  const providerRole = role === 'vendor' || role === 'technician'
  const [form, setForm] = useState<ProfileFormValues>({
    name: profile.name,
    phone: profile.phone,
    email: profile.email ?? '',
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    business: profile.business,
    gst: profile.gst,
    aadhaar: groupAadhaar(profile.aadhaar),
    bankHolder: profile.bankHolder,
    bankName: profile.bankName,
    bank: profile.bank,
    ifsc: profile.ifsc,
    skill: profile.skill,
    skills: profile.skills,
    experience: String(profile.experience),
    area: profile.area,
  })
  const [notify, setNotify] = useState(profile.notify)
  const [available, setAvailable] = useState(profile.available)
  // Mistakes are shown once the person has tried to save, then follow every keystroke.
  const [showErrors, setShowErrors] = useState(false)
  const errors = validateProfile(form, role)
  const problem = (key: keyof ProfileFormValues) => (showErrors ? errors[key] : undefined)

  const set =
    (key: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value })

  const save = useApiMutation(
    () => {
      const body: UpdateProfileRequest = {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth,
        notify,
      }
      if (role === 'customer') body.address = form.address.trim()
      if (role === 'vendor')
        Object.assign(body, {
          business: form.business.trim(),
          gst: form.gst.trim().toUpperCase(),
          address: form.address.trim(),
        })
      if (role === 'technician')
        Object.assign(body, {
          skill: form.skill,
          skills: form.skills,
          experience: Number(form.experience) || 0,
          area: form.area,
          address: form.address.trim(),
          available,
        })
      if (providerRole)
        Object.assign(body, {
          aadhaar: form.aadhaar.replace(/\s/g, ''),
          bankHolder: form.bankHolder.trim(),
          bankName: form.bankName.trim(),
          bank: form.bank.replace(/\s/g, ''),
          ifsc: form.ifsc.trim().toUpperCase(),
        })
      return api.auth.updateMe(body)
    },
    {
      meta: { inline: true, success: 'Profile saved.' },
      onSuccess: (saved) => {
        setShowErrors(false)
        updateUser({
          name: saved.business && role === 'vendor' ? saved.business : saved.name,
          phone: saved.phone,
          email: saved.email ?? undefined,
        })
      },
    },
  )
  const uploadPhoto = useApiMutation((file: File) => api.auth.uploadPhoto(file), {
    meta: { success: 'Photo updated.' },
  })
  const uploadAadhaar = useApiMutation((file: File) => api.auth.uploadAadhaarPhoto(file), {
    meta: { success: 'Aadhaar card image saved.' },
  })

  return (
    <>
      <Panel title="Your photo">
        <PhotoPicker
          name={profile.name}
          photo={profile.photo}
          busy={uploadPhoto.isPending}
          onPick={(file) => uploadPhoto.mutate(file)}
        />
        {uploadPhoto.isError && <Alert tone="danger">{uploadPhoto.error.message}</Alert>}
      </Panel>

      {role === 'customer' && (
        <Panel title="Sahjog wallet">
          <div className={shared.spread}>
            <div>
              <p className={shared.muted}>Balance</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600 }}>
                {formatCurrency(profile.wallet)}
              </p>
            </div>
            <p className={`${shared.muted} ${shared.small}`} style={{ maxWidth: 360 }}>
              Pay for bookings from your wallet at checkout. Refunds for cancelled bookings can come
              back here.
            </p>
          </div>
        </Panel>
      )}

      {providerRole && (
        <Panel
          title="Subscription"
          actions={
            <Link to={ROUTES.plans}>
              <Button size="sm" variant="secondary">
                {profile.subscriptionActive ? 'Manage plan' : 'Choose a plan'}
              </Button>
            </Link>
          }
        >
          {profile.coveredByVendor ? (
            <Alert tone="success">You work under a vendor whose plan covers you.</Alert>
          ) : (
            <DescriptionList
              columns={3}
              items={[
                { label: 'Plan', value: profile.planName ?? 'No plan' },
                {
                  label: 'Status',
                  value: (
                    <Badge tone={profile.subscriptionActive ? 'success' : 'danger'}>
                      {profile.subscriptionActive ? 'Active' : 'Inactive'}
                    </Badge>
                  ),
                },
                {
                  label: 'Valid until',
                  value: profile.planExpiry ? formatDate(profile.planExpiry) : '-',
                },
              ]}
            />
          )}
        </Panel>
      )}

      <form
        className={shared.stack}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (Object.keys(errors).length > 0) {
            setShowErrors(true)
            return
          }
          save.mutate(undefined)
        }}
      >
        <Panel title="Personal details">
          <div className={shared.formGrid}>
            <Input
              label={role === 'vendor' ? 'Owner name' : 'Full name'}
              required
              value={form.name}
              onChange={set('name')}
              maxLength={80}
              autoComplete="name"
              error={problem('name')}
            />
            <Input
              label="Mobile number"
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              error={problem('phone')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={problem('email')}
            />
            <Input
              label="Date of birth"
              type="date"
              max={today()}
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
              hint={role === 'customer' ? undefined : 'You must be at least 18.'}
              error={problem('dateOfBirth')}
            />
            {role !== 'vendor' && (
              <Textarea
                label="Address"
                className={shared.full}
                rows={2}
                value={form.address}
                onChange={set('address')}
                maxLength={300}
                placeholder="House / flat no., street, area, city"
                error={problem('address')}
              />
            )}
          </div>
        </Panel>

        {role === 'vendor' && (
          <Panel title="Business">
            <div className={shared.formGrid}>
              <Input
                label="Business name"
                required
                value={form.business}
                onChange={set('business')}
                maxLength={120}
                error={problem('business')}
              />
              <Input
                label="GST number"
                value={form.gst}
                onChange={set('gst')}
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                error={problem('gst')}
              />
              <Textarea
                label="Business address"
                required
                className={shared.full}
                rows={2}
                value={form.address}
                onChange={set('address')}
                maxLength={300}
                error={problem('address')}
              />
            </div>
          </Panel>
        )}

        {role === 'technician' && (
          <Panel title="Work">
            <div className={shared.formGrid}>
              <Input label="Main skill" value={form.skill} onChange={set('skill')} maxLength={80} />
              <Input
                label="All skills"
                hint="Separated by commas."
                value={form.skills}
                onChange={set('skills')}
              />
              <Input
                label="Years of experience"
                type="number"
                min={0}
                max={60}
                value={form.experience}
                onChange={set('experience')}
                error={problem('experience')}
              />
              <Input
                label="Area you work in"
                value={form.area}
                onChange={set('area')}
                maxLength={120}
              />
            </div>
          </Panel>
        )}

        {providerRole && (
          <>
            <Panel title="Identity (Aadhaar)">
              <div className={shared.formGrid}>
                <Input
                  label="Aadhaar number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="1234 5678 9012"
                  value={form.aadhaar}
                  onChange={(event) =>
                    setForm({ ...form, aadhaar: groupAadhaar(event.target.value) })
                  }
                  hint="12 digits. Used only to verify who you are."
                  error={problem('aadhaar')}
                />
                <AadhaarImage
                  uploaded={profile.hasAadhaarPhoto}
                  busy={uploadAadhaar.isPending}
                  onPick={(file) => uploadAadhaar.mutate(file)}
                />
              </div>
              {uploadAadhaar.isError && <Alert tone="danger">{uploadAadhaar.error.message}</Alert>}
            </Panel>

            <Panel title="Bank details">
              <div className={shared.formGrid}>
                <Input
                  label="Account holder name"
                  autoComplete="off"
                  value={form.bankHolder}
                  onChange={set('bankHolder')}
                  maxLength={80}
                  hint="As printed on the account."
                  error={problem('bankHolder')}
                />
                <Input
                  label="Bank name"
                  value={form.bankName}
                  onChange={set('bankName')}
                  maxLength={80}
                  error={problem('bankName')}
                />
                <Input
                  label="Account number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.bank}
                  onChange={set('bank')}
                  hint="Where payouts are sent."
                  error={problem('bank')}
                />
                <Input
                  label="IFSC"
                  value={form.ifsc}
                  onChange={(event) => setForm({ ...form, ifsc: event.target.value.toUpperCase() })}
                  maxLength={11}
                  placeholder="HDFC0001234"
                  error={problem('ifsc')}
                />
              </div>
            </Panel>
          </>
        )}

        <Panel title="Preferences">
          <div className={shared.stackTight}>
            <Toggle
              label="Notifications"
              description="Alerts for new bookings, status changes and payments."
              checked={notify}
              onChange={setNotify}
            />
            {role === 'technician' && (
              <Toggle
                label="Available for jobs"
                description="Turn off when you cannot take new jobs."
                checked={available}
                onChange={setAvailable}
              />
            )}
          </div>
        </Panel>

        {showErrors && Object.keys(errors).length > 0 && (
          <Alert tone="danger">Please fix the highlighted fields, then save again.</Alert>
        )}
        {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
        <div className={shared.row}>
          <Button type="submit" loading={save.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  )
}
