import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { CategoryDto, Features, SaveServiceRequest } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Input,
  Modal,
  Panel,
  Select,
  Toggle,
} from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { ROUTES } from '@/config/routes'
import {
  amountProblem,
  collect,
  emailProblem,
  nameProblem,
  optionalPercentProblem,
  passwordProblem,
  requiredChoiceProblem,
} from '@/domain/form-rules'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

export default function ClientDetailPage() {
  const { tenantId } = useParams()
  const id = Number(tenantId)
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [addingService, setAddingService] = useState(false)
  const tenants = useApiQuery(['platform', 'tenants'], api.platform.tenants)
  const tenant = tenants.data?.find((t) => t.id === id)
  const tenantAdmins = useApiQuery(['platform', 'tenant-admins', id], () =>
    api.platform.tenantAdmins(id),
  )
  const tenantCategories = useApiQuery(['platform', 'tenant-categories', id], () =>
    api.platform.tenantCategories(id),
  )
  const masters = useApiQuery(['platform', 'masters'], api.platform.masters)
  const featureDefs = (masters.data?.features ?? []).filter((f) => f.active)

  const setActive = useApiMutation((active: boolean) => api.platform.setTenantActive(id, active), {
    meta: { success: 'Client updated.' },
  })
  const setFeature = useApiMutation(
    (change: Partial<Features>) => api.platform.setFeatures(id, change),
    {
      meta: { success: 'Features saved.' },
    },
  )

  return (
    <div className={shared.stack}>
      <Link to={ROUTES.clients} className={shared.link}>
        <ArrowLeft size={14} aria-hidden="true" /> All clients
      </Link>
      <QueryState isLoading={tenants.isLoading} error={tenants.error}>
        {tenant ? (
          <>
            <PageHeader
              title={tenant.name}
              description={`Business code ${tenant.code}`}
              actions={
                <Badge tone={tenant.isActive ? 'success' : 'danger'}>
                  {tenant.isActive ? 'Active' : 'Switched off'}
                </Badge>
              }
            />
            <Panel title="Owner & admin">
              <DescriptionList
                columns={3}
                items={[
                  { label: 'Owner', value: tenant.ownerName || '-' },
                  { label: 'Email', value: tenant.ownerEmail || '-' },
                  { label: 'Phone', value: tenant.ownerPhone || '-' },
                  {
                    label: 'Admin sign-in',
                    value: <span className={shared.mono}>{tenant.adminEmail}</span>,
                  },
                  { label: 'Business ID', value: tenant.id },
                  { label: 'Created', value: formatDate(tenant.createdAt) },
                ]}
              />
            </Panel>

            <Can permission={PERMISSIONS.clientAdd}>
              <Panel
                title="Additional admin accounts"
                subtitle="Create more username and password sign-ins for this client's Admin app."
                actions={<Button onClick={() => setAddingAdmin(true)}>Create admin login</Button>}
              >
                <div className={shared.stackTight}>
                  {(tenantAdmins.data ?? []).map((admin) => (
                    <div className={shared.row} key={admin.id}>
                      <strong>{admin.name}</strong>
                      <span className={shared.mono}>{admin.email}</span>
                      <span className={shared.muted}>Created {formatDate(admin.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <p className={shared.muted}>
                  Admin accounts sign in with their email address and the password you set.
                </p>
              </Panel>
            </Can>

            <Can permission={PERMISSIONS.clientFeatures}>
              <Panel
                title="Features"
                subtitle="Choose what this business's admin can see and use. A switched-off feature is hidden and refused by the server."
              >
                <div className={shared.stackTight}>
                  {featureDefs.map((f) => (
                    <Toggle
                      key={f.code}
                      label={f.name}
                      description={f.description}
                      checked={tenant.features[f.code] ?? true}
                      onChange={(on) => setFeature.mutate({ [f.code]: on })}
                    />
                  ))}
                </div>
              </Panel>
            </Can>

            <Can permission={PERMISSIONS.clientCatalog}>
              <Panel
                title="Service catalogue"
                subtitle="Add a service to this client's tenant catalogue. Vendors cannot create catalogue services."
                actions={<Button onClick={() => setAddingService(true)}>Add service</Button>}
              >
                <p className={shared.muted}>
                  New services are created only in this client’s catalogue.
                </p>
              </Panel>
            </Can>

            <Can permission={PERMISSIONS.clientActivate}>
              <Panel title="Access">
                <div className={shared.stackTight}>
                  <Alert tone={tenant.isActive ? 'info' : 'warning'}>
                    {tenant.isActive
                      ? 'Switching this client off refuses its admin, vendors, technicians and customers until you switch it on again.'
                      : 'This client is switched off. Nobody from it can sign in or use the apps.'}
                  </Alert>
                  <div className={shared.row}>
                    <Button
                      variant={tenant.isActive ? 'danger' : 'primary'}
                      loading={setActive.isPending}
                      onClick={() => {
                        if (
                          !tenant.isActive ||
                          window.confirm(
                            `Switch off ${tenant.name}? Everyone in it loses access immediately.`,
                          )
                        )
                          setActive.mutate(!tenant.isActive)
                      }}
                    >
                      {tenant.isActive ? 'Switch client off' : 'Switch client on'}
                    </Button>
                  </div>
                </div>
              </Panel>
            </Can>
          </>
        ) : (
          <Alert tone="warning">That client was not found.</Alert>
        )}
      </QueryState>
      <Modal open={addingAdmin} title="Create an admin login" onClose={() => setAddingAdmin(false)}>
        {addingAdmin && <AdminAccountForm tenantId={id} onDone={() => setAddingAdmin(false)} />}
      </Modal>
      <Modal
        open={addingService}
        title="Add a client service"
        onClose={() => setAddingService(false)}
      >
        {addingService && (
          <TenantServiceForm
            tenantId={id}
            categories={tenantCategories.data ?? []}
            onDone={() => setAddingService(false)}
          />
        )}
      </Modal>
    </div>
  )
}

function TenantServiceForm({
  tenantId,
  categories,
  onDone,
}: {
  tenantId: number
  categories: CategoryDto[]
  onDone: () => void
}) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [commission, setCommission] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect({
    categoryId: requiredChoiceProblem(categoryId, 'category'),
    name: nameProblem(name, 'service name'),
    basePrice: amountProblem(basePrice, 'base price'),
    commission: optionalPercentProblem(commission, 'commission'),
  })
  const save = useApiMutation(
    () => {
      const request: SaveServiceRequest = {
        categoryId: Number(categoryId),
        name: name.trim(),
        short: short.trim(),
        basePrice: Number(basePrice),
        commission: commission === '' ? undefined : Number(commission),
      }
      return api.platform.addTenantService(tenantId, request)
    },
    { meta: { inline: true, success: 'Service added to this client.' }, onSuccess: onDone },
  )

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        if (Object.keys(errors).length > 0) return setShowErrors(true)
        save.mutate(undefined)
      }}
    >
      <Select
        label="Category"
        required
        placeholder="Choose a category"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        error={showErrors ? errors.categoryId : undefined}
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.name,
        }))}
      />
      <Input
        label="Service name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={80}
        error={showErrors ? errors.name : undefined}
      />
      <Input
        label="Short description"
        value={short}
        onChange={(event) => setShort(event.target.value)}
        maxLength={120}
      />
      <Input
        label="Base price (₹)"
        required
        type="number"
        min={0}
        value={basePrice}
        onChange={(event) => setBasePrice(event.target.value)}
        error={showErrors ? errors.basePrice : undefined}
      />
      <Input
        label="Commission (%)"
        type="number"
        min={0}
        max={100}
        step="0.5"
        hint="Leave empty to use this client's default."
        value={commission}
        onChange={(event) => setCommission(event.target.value)}
        error={showErrors ? errors.commission : undefined}
      />
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          Add service
        </Button>
      </div>
    </form>
  )
}

function AdminAccountForm({ tenantId, onDone }: { tenantId: number; onDone: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const errors = {
    name: nameProblem(name, 'admin name'),
    email: emailProblem(email),
    password: passwordProblem(password, true),
  }
  const create = useApiMutation(
    () =>
      api.platform.createTenantAdmin(tenantId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    {
      meta: { inline: true, success: 'Admin login created.' },
      onSuccess: onDone,
    },
  )

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        if (Object.values(errors).some(Boolean)) return setShowErrors(true)
        create.mutate(undefined)
      }}
    >
      <Input
        label="Admin name"
        required
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={showErrors ? errors.name : undefined}
      />
      <Input
        label="Username (email)"
        required
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={showErrors ? errors.email : undefined}
      />
      <Input
        label="Password"
        required
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={showErrors ? errors.password : undefined}
      />
      {create.isError && <Alert tone="danger">{create.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Create account
        </Button>
      </div>
    </form>
  )
}
