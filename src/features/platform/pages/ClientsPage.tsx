import { Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { CreateTenantRequest, TenantCreatedDto, TenantInfoDto } from '@/api/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { Grid } from '@/components/layout/Grid'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DataTable,
  DescriptionList,
  Input,
  Modal,
  Panel,
  SearchInput,
  StatCard,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { clientPath } from '@/config/routes'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { isEmail, normalisePhone } from '@/domain/validators'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

export default function ClientsPage() {
  const tenants = useApiQuery(['platform', 'tenants'], api.platform.tenants)
  const [term, setTerm] = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<TenantCreatedDto | null>(null)

  const all = tenants.data ?? []
  const rows = all.filter((t) =>
    `${t.name} ${t.code} ${t.ownerName} ${t.ownerEmail}`
      .toLowerCase()
      .includes(term.trim().toLowerCase()),
  )

  const columns: Column<TenantInfoDto>[] = [
    {
      key: 'name',
      header: 'Client',
      minWidth: 180,
      render: (t) => (
        <Link to={clientPath(t.id)}>
          <strong>{t.name}</strong>
        </Link>
      ),
    },
    { key: 'code', header: 'Code', render: (t) => <span className={shared.mono}>{t.code}</span> },
    {
      key: 'owner',
      header: 'Owner',
      render: (t) => (
        <span>
          {t.ownerName || '-'}
          <br />
          <span className={`${shared.muted} ${shared.small}`}>{t.ownerEmail}</span>
        </span>
      ),
    },
    {
      key: 'admin',
      header: 'Admin sign-in',
      render: (t) => <span className={shared.mono}>{t.adminEmail}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (t) => <span className={shared.nowrap}>{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge tone={t.isActive ? 'success' : 'danger'}>{t.isActive ? 'Active' : 'Off'}</Badge>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Clients"
        description="Each client is one business with its own catalogue, plans, fees and admin. Share the business code and admin login with the client."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> New client
          </Button>
        }
      />
      <QueryState isLoading={tenants.isLoading} error={tenants.error}>
        <Grid variant="stats">
          <StatCard label="Clients" value={String(all.length)} icon={Landmark} />
          <StatCard label="Active" value={String(all.filter((t) => t.isActive).length)} />
          <StatCard label="Switched off" value={String(all.filter((t) => !t.isActive).length)} />
        </Grid>
        <Toolbar>
          <SearchInput
            label="Search clients"
            placeholder="Search by name, code or owner"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </Toolbar>
        <Panel flush>
          {all.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="No clients yet"
              action={<Button onClick={() => setCreating(true)}>Create the first client</Button>}
            >
              A client gets its own catalogue, plans, settings and an admin login.
            </EmptyState>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              getRowId={(t) => String(t.id)}
              emptyMessage="No client matches your search."
            />
          )}
        </Panel>
      </QueryState>

      <Modal open={creating} title="New client" onClose={() => setCreating(false)} wide>
        {creating && <CreateForm onDone={() => setCreating(false)} onCreated={setCreated} />}
      </Modal>
      <Modal open={created !== null} title="Client created" onClose={() => setCreated(null)}>
        {created && (
          <div className={shared.stackTight}>
            <Alert tone="success">
              {created.tenant.name} is ready. Give the client these details now: the password is not
              shown again.
            </Alert>
            <DescriptionList
              columns={2}
              items={[
                {
                  label: 'Business code',
                  value: <span className={shared.mono}>{created.tenant.code}</span>,
                },
                {
                  label: 'Admin email',
                  value: <span className={shared.mono}>{created.adminEmail}</span>,
                },
                {
                  label: 'Admin password',
                  value: <span className={shared.mono}>{created.adminPassword}</span>,
                },
              ]}
            />
            <div className={shared.formActions}>
              <Button onClick={() => setCreated(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CreateForm({
  onDone,
  onCreated,
}: {
  onDone: () => void
  onCreated: (created: TenantCreatedDto) => void
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    adminPassword: '',
  })
  const [demoData, setDemoData] = useState(false)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const create = useApiMutation(
    () => {
      const body: CreateTenantRequest = {
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerPhone: normalisePhone(form.ownerPhone) ?? form.ownerPhone.trim(),
        demoData,
        adminPassword: form.adminPassword || undefined,
      }
      return api.platform.createTenant(body)
    },
    {
      meta: { inline: true },
      onSuccess: (result) => {
        onDone()
        onCreated(result)
      },
    },
  )

  const valid =
    form.name.trim().length >= 2 &&
    /^[a-z0-9-]{2,30}$/.test(form.code.trim().toLowerCase()) &&
    form.ownerName.trim().length >= 2 &&
    isEmail(form.ownerEmail) &&
    normalisePhone(form.ownerPhone) !== null

  return (
    <form
      className={shared.stackTight}
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate(undefined)
      }}
    >
      <div className={shared.formGrid}>
        <Input
          label="Business name"
          required
          value={form.name}
          onChange={set('name')}
          maxLength={80}
        />
        <Input
          label="Business code"
          required
          hint="Letters, numbers and dashes. The admin signs in as admin@code.in."
          value={form.code}
          onChange={set('code')}
          maxLength={30}
        />
        <Input label="Owner name" required value={form.ownerName} onChange={set('ownerName')} />
        <Input
          label="Owner email"
          required
          type="email"
          hint="One business per owner."
          value={form.ownerEmail}
          onChange={set('ownerEmail')}
        />
        <Input
          label="Owner mobile"
          required
          type="tel"
          inputMode="numeric"
          value={form.ownerPhone}
          onChange={set('ownerPhone')}
        />
        <Input
          label="Admin password"
          type="password"
          autoComplete="new-password"
          hint="Leave empty to use the default."
          value={form.adminPassword}
          onChange={set('adminPassword')}
        />
      </div>
      <Checkbox
        label="Fill with sample vendors, technicians and bookings (for demos)"
        checked={demoData}
        onChange={(e) => setDemoData(e.target.checked)}
      />
      {create.isError && <Alert tone="danger">{create.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending} disabled={!valid}>
          Create client
        </Button>
      </div>
    </form>
  )
}
