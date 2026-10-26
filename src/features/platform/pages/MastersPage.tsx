import { Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { FeatureDefDto, MastersDto, PaymentMethodDefDto, PlanTemplateDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DataTable,
  FormActions,
  Input,
  Modal,
  Panel,
  Select,
  Tabs,
  fullRow,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { PERMISSIONS } from '@/config/permissions'
import { Can } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'
import { formatCurrency } from '@/utils/format'

type MasterTab = 'features' | 'payments' | 'plans'

const TABS: { id: MasterTab; label: string }[] = [
  { id: 'features', label: 'Features' },
  { id: 'payments', label: 'Payment methods' },
  { id: 'plans', label: 'Subscription plans' },
]

const DESCRIPTIONS: Record<MasterTab, string> = {
  features:
    'The switches you can turn on or off for each client. Turned-off features are hidden from that client.',
  payments:
    'Every payment method the platform supports. Each client’s admin chooses which of these customers see.',
  plans:
    'The subscription plans every new client starts with. Each client’s admin can then change the prices.',
}

const activeBadge = (active: boolean) => (
  <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Hidden'}</Badge>
)

const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

export default function MastersPage() {
  const masters = useApiQuery(['platform', 'masters'], api.platform.masters)
  const [tab, setTab] = useState<MasterTab>('features')

  return (
    <div className={shared.stack}>
      <PageHeader title="Masters" description={DESCRIPTIONS[tab]} />
      <Tabs items={TABS} active={tab} onChange={setTab} label="Master lists" />
      <QueryState isLoading={masters.isLoading} error={masters.error}>
        {masters.data && tab === 'features' && <FeaturesMaster data={masters.data} />}
        {masters.data && tab === 'payments' && <PaymentsMaster data={masters.data} />}
        {masters.data && tab === 'plans' && <PlansMaster data={masters.data} />}
      </QueryState>
    </div>
  )
}

function MasterDialog({
  title,
  onClose,
  error,
  saving,
  valid,
  onSubmit,
  children,
}: {
  title: string
  onClose: () => void
  error?: string
  saving: boolean
  valid: boolean
  onSubmit: () => void
  children: React.ReactNode
}) {
  return (
    <Modal open title={title} onClose={onClose}>
      <form
        className={shared.stackTight}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className={shared.formGrid}>{children}</div>
        {error && <Alert tone="danger">{error}</Alert>}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            Save
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------- features

function FeaturesMaster({ data }: { data: MastersDto }) {
  const [editing, setEditing] = useState<FeatureDefDto | 'new' | null>(null)
  const columns: Column<FeatureDefDto>[] = [
    { key: 'name', header: 'Feature', minWidth: 180, render: (f) => <strong>{f.name}</strong> },
    { key: 'code', header: 'Code', render: (f) => <span className={shared.mono}>{f.code}</span> },
    { key: 'description', header: 'Description', render: (f) => f.description || '-' },
    { key: 'order', header: 'Order', render: (f) => f.sortOrder },
    { key: 'status', header: 'Status', render: (f) => activeBadge(f.active) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (f) => (
        <Can permission={PERMISSIONS.masterEdit}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(f)}>
            Edit
          </Button>
        </Can>
      ),
    },
  ]
  return (
    <>
      <Panel
        title="Features"
        actions={
          <Can permission={PERMISSIONS.masterAdd}>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus size={14} aria-hidden="true" /> Add feature
            </Button>
          </Can>
        }
        flush
      >
        <DataTable columns={columns} rows={data.features} getRowId={(f) => f.code} />
      </Panel>
      {editing && <FeatureForm row={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function FeatureForm({ row, onClose }: { row: FeatureDefDto | 'new'; onClose: () => void }) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    code: isNew ? '' : row.code,
    name: isNew ? '' : row.name,
    description: isNew ? '' : row.description,
    sortOrder: isNew ? '' : String(row.sortOrder),
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: toNumber(form.sortOrder),
        active: form.active,
      }
      return isNew
        ? api.platform.addFeature({ ...body, code: form.code.trim() })
        : api.platform.updateFeature(row.code, body)
    },
    { meta: { inline: true, success: 'Feature saved.' }, onSuccess: onClose },
  )
  const set =
    (key: 'code' | 'name' | 'description' | 'sortOrder') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })
  return (
    <MasterDialog
      title={isNew ? 'Add feature' : 'Edit feature'}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={form.name.trim().length > 0 && (!isNew || form.code.trim().length > 0)}
      onSubmit={() => save.mutate(undefined)}
    >
      <Input label="Name" required value={form.name} onChange={set('name')} />
      <Input
        label="Code"
        required
        disabled={!isNew}
        placeholder="e.g. loyaltyPoints"
        hint={isNew ? 'Letters and digits. It cannot be changed later.' : undefined}
        value={form.code}
        onChange={set('code')}
      />
      <Input
        className={fullRow}
        label="Description"
        value={form.description}
        onChange={set('description')}
      />
      <Input label="Order" type="number" value={form.sortOrder} onChange={set('sortOrder')} />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}

// ---------------------------------------------------------------- payment methods

function PaymentsMaster({ data }: { data: MastersDto }) {
  const [editing, setEditing] = useState<PaymentMethodDefDto | 'new' | null>(null)
  const featureName = (code: string | null) =>
    code ? (data.features.find((f) => f.code === code)?.name ?? code) : 'Always available'
  const columns: Column<PaymentMethodDefDto>[] = [
    { key: 'name', header: 'Method', minWidth: 180, render: (m) => <strong>{m.name}</strong> },
    { key: 'code', header: 'Code', render: (m) => <span className={shared.mono}>{m.code}</span> },
    { key: 'feature', header: 'Needs feature', render: (m) => featureName(m.featureCode) },
    { key: 'order', header: 'Order', render: (m) => m.sortOrder },
    { key: 'status', header: 'Status', render: (m) => activeBadge(m.active) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Can permission={PERMISSIONS.masterEdit}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>
            Edit
          </Button>
        </Can>
      ),
    },
  ]
  return (
    <>
      <Panel
        title="Payment methods"
        actions={
          <Can permission={PERMISSIONS.masterAdd}>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus size={14} aria-hidden="true" /> Add method
            </Button>
          </Can>
        }
        flush
      >
        <DataTable columns={columns} rows={data.paymentMethods} getRowId={(m) => m.code} />
      </Panel>
      {editing && (
        <PaymentForm row={editing} features={data.features} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function PaymentForm({
  row,
  features,
  onClose,
}: {
  row: PaymentMethodDefDto | 'new'
  features: FeatureDefDto[]
  onClose: () => void
}) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    code: isNew ? '' : row.code,
    name: isNew ? '' : row.name,
    sortOrder: isNew ? '' : String(row.sortOrder),
    featureCode: isNew ? '' : (row.featureCode ?? ''),
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        name: form.name.trim(),
        sortOrder: toNumber(form.sortOrder),
        featureCode: form.featureCode,
        active: form.active,
      }
      return isNew
        ? api.platform.addPaymentMethod({ ...body, code: form.code.trim() })
        : api.platform.updatePaymentMethod(row.code, body)
    },
    { meta: { inline: true, success: 'Payment method saved.' }, onSuccess: onClose },
  )
  const set = (key: 'code' | 'name' | 'sortOrder') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })
  return (
    <MasterDialog
      title={isNew ? 'Add payment method' : 'Edit payment method'}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={form.name.trim().length > 0 && (!isNew || form.code.trim().length > 0)}
      onSubmit={() => save.mutate(undefined)}
    >
      <Input label="Name" required value={form.name} onChange={set('name')} />
      <Input
        label="Code"
        required
        disabled={!isNew}
        placeholder="e.g. UPI"
        hint={isNew ? 'It cannot be changed later.' : undefined}
        value={form.code}
        onChange={set('code')}
      />
      <Select
        label="Needs feature"
        placeholder="Always available"
        options={features.map((f) => ({ value: f.code, label: f.name }))}
        value={form.featureCode}
        onChange={(e) => setForm({ ...form, featureCode: e.target.value })}
        hint="The method is hidden for clients that have this feature off."
      />
      <Input label="Order" type="number" value={form.sortOrder} onChange={set('sortOrder')} />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}

// ---------------------------------------------------------------- plan templates

function PlansMaster({ data }: { data: MastersDto }) {
  const [editing, setEditing] = useState<PlanTemplateDto | 'new' | null>(null)
  const remove = useApiMutation((id: number) => api.platform.deletePlanTemplate(id), {
    meta: { success: 'Plan deleted.' },
  })
  const columns: Column<PlanTemplateDto>[] = [
    { key: 'kind', header: 'For', render: (p) => <Badge tone="info">{p.kind}</Badge> },
    { key: 'name', header: 'Plan', minWidth: 140, render: (p) => <strong>{p.name}</strong> },
    { key: 'period', header: 'Period', render: (p) => `${p.months} mo (${p.period})` },
    { key: 'price', header: 'Price', render: (p) => formatCurrency(p.price) },
    { key: 'save', header: 'Badge', render: (p) => p.save || '-' },
    { key: 'status', header: 'Status', render: (p) => activeBadge(p.active) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className={shared.row}>
          <Can permission={PERMISSIONS.masterEdit}>
            <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>
              Edit
            </Button>
          </Can>
          <Can permission={PERMISSIONS.masterDelete}>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete the ${p.kind} ${p.name} plan? Existing clients keep theirs.`,
                  )
                )
                  remove.mutate(p.id)
              }}
            >
              Delete
            </Button>
          </Can>
        </span>
      ),
    },
  ]
  return (
    <>
      <Panel
        title="Subscription plans"
        actions={
          <Can permission={PERMISSIONS.masterAdd}>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus size={14} aria-hidden="true" /> Add plan
            </Button>
          </Can>
        }
        flush
      >
        <DataTable columns={columns} rows={data.planTemplates} getRowId={(p) => String(p.id)} />
      </Panel>
      {editing && <PlanForm row={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function PlanForm({ row, onClose }: { row: PlanTemplateDto | 'new'; onClose: () => void }) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    kind: isNew ? 'Vendor' : row.kind,
    name: isNew ? '' : row.name,
    period: isNew ? '' : row.period,
    months: isNew ? '1' : String(row.months),
    price: isNew ? '' : String(row.price),
    save: isNew ? '' : row.save,
    sortOrder: isNew ? '' : String(row.sortOrder),
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        kind: form.kind,
        name: form.name.trim(),
        period: form.period.trim(),
        months: toNumber(form.months),
        price: toNumber(form.price),
        save: form.save.trim(),
        sortOrder: toNumber(form.sortOrder),
        active: form.active,
      }
      return isNew
        ? api.platform.addPlanTemplate(body)
        : api.platform.updatePlanTemplate(row.id, body)
    },
    { meta: { inline: true, success: 'Plan saved.' }, onSuccess: onClose },
  )
  const set =
    (key: 'name' | 'period' | 'months' | 'price' | 'save' | 'sortOrder') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })
  return (
    <MasterDialog
      title={isNew ? 'Add plan' : 'Edit plan'}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={
        form.name.trim().length > 0 &&
        form.period.trim().length > 0 &&
        Number(form.months) >= 1 &&
        Number(form.price) > 0
      }
      onSubmit={() => save.mutate(undefined)}
    >
      <Select
        label="For"
        required
        options={[
          { value: 'Vendor', label: 'Vendor' },
          { value: 'Technician', label: 'Technician' },
        ]}
        value={form.kind}
        onChange={(e) => setForm({ ...form, kind: e.target.value })}
      />
      <Input
        label="Name"
        required
        placeholder="e.g. Monthly"
        value={form.name}
        onChange={set('name')}
      />
      <Input
        label="Period label"
        required
        placeholder="e.g. month"
        value={form.period}
        onChange={set('period')}
      />
      <Input
        label="Months"
        required
        type="number"
        min={1}
        value={form.months}
        onChange={set('months')}
      />
      <Input
        label="Price (₹)"
        required
        type="number"
        min={1}
        value={form.price}
        onChange={set('price')}
      />
      <Input label="Badge" placeholder="e.g. Save 10%" value={form.save} onChange={set('save')} />
      <Input label="Order" type="number" value={form.sortOrder} onChange={set('sortOrder')} />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}
