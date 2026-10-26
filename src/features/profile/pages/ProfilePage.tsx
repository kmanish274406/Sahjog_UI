import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { ProfileDto, UpdateProfileRequest } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Badge, Button, DescriptionList, Input, Panel, Textarea, Toggle } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'

export default function ProfilePage() {
  const profile = useApiQuery(['profile'], api.auth.me)
  return (
    <div className={shared.stack}>
      <PageHeader title="Profile" description="Your details and preferences." />
      <QueryState isLoading={profile.isLoading} error={profile.error}>
        {profile.data && <ProfileForms profile={profile.data} />}
      </QueryState>
    </div>
  )
}

function ProfileForms({ profile }: { profile: ProfileDto }) {
  const role = useAuthStore((state) => state.user?.role)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email ?? '',
    business: profile.business,
    gst: profile.gst,
    address: profile.address,
    bank: profile.bank,
    ifsc: profile.ifsc,
    skill: profile.skill,
    skills: profile.skills,
    experience: String(profile.experience),
    area: profile.area,
  })
  const [notify, setNotify] = useState(profile.notify)
  const [available, setAvailable] = useState(profile.available)
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: event.target.value })

  const save = useApiMutation(
    () => {
      const body: UpdateProfileRequest = { name: form.name, phone: form.phone, email: form.email, notify }
      if (role === 'vendor') Object.assign(body, { business: form.business, gst: form.gst, address: form.address, bank: form.bank, ifsc: form.ifsc })
      if (role === 'technician') Object.assign(body, { skill: form.skill, skills: form.skills, experience: Number(form.experience) || 0, area: form.area, available })
      return api.auth.updateMe(body)
    },
    {
      meta: { inline: true, success: 'Profile saved.' },
      onSuccess: (saved) => updateUser({ name: saved.business && role === 'vendor' ? saved.business : saved.name, phone: saved.phone, email: saved.email ?? undefined }),
    },
  )

  return (
    <>
      {role === 'customer' && (
        <Panel title="Sahjog wallet">
          <div className={shared.spread}>
            <div>
              <p className={shared.muted}>Balance</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600 }}>{formatCurrency(profile.wallet)}</p>
            </div>
            <p className={`${shared.muted} ${shared.small}`} style={{ maxWidth: 360 }}>
              Pay for bookings from your wallet at checkout. Refunds for cancelled bookings can come back here.
            </p>
          </div>
        </Panel>
      )}

      {(role === 'vendor' || role === 'technician') && (
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
                { label: 'Status', value: <Badge tone={profile.subscriptionActive ? 'success' : 'danger'}>{profile.subscriptionActive ? 'Active' : 'Inactive'}</Badge> },
                { label: 'Valid until', value: profile.planExpiry ? formatDate(profile.planExpiry) : '-' },
              ]}
            />
          )}
        </Panel>
      )}

      <form
        className={shared.stack}
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate(undefined)
        }}
      >
        <Panel title="Your details">
          <div className={shared.formGrid}>
            <Input label={role === 'vendor' ? 'Owner name' : 'Name'} required value={form.name} onChange={set('name')} maxLength={80} />
            <Input label="Mobile number" required type="tel" inputMode="numeric" value={form.phone} onChange={set('phone')} />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            {role === 'vendor' && (
              <>
                <Input label="Business name" required value={form.business} onChange={set('business')} maxLength={120} />
                <Input label="GST number" value={form.gst} onChange={set('gst')} maxLength={20} />
                <Input label="Bank account" hint="Where payouts are sent." value={form.bank} onChange={set('bank')} />
                <Input label="IFSC" value={form.ifsc} onChange={set('ifsc')} maxLength={20} />
                <Textarea label="Address" className={shared.full} rows={2} value={form.address} onChange={set('address')} maxLength={300} />
              </>
            )}
            {role === 'technician' && (
              <>
                <Input label="Main skill" value={form.skill} onChange={set('skill')} maxLength={80} />
                <Input label="All skills" hint="Separated by commas." value={form.skills} onChange={set('skills')} />
                <Input label="Years of experience" type="number" min={0} max={60} value={form.experience} onChange={set('experience')} />
                <Input label="Area you work in" value={form.area} onChange={set('area')} maxLength={120} />
              </>
            )}
          </div>
        </Panel>

        <Panel title="Preferences">
          <div className={shared.stackTight}>
            <Toggle label="Notifications" description="Alerts for new bookings, status changes and payments." checked={notify} onChange={setNotify} />
            {role === 'technician' && <Toggle label="Available for jobs" description="Turn off when you cannot take new jobs." checked={available} onChange={setAvailable} />}
          </div>
        </Panel>

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
