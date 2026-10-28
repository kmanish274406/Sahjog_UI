import { Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { AccessPermissionDto, LookupItemDto, MastersDto, MenuItemDto } from '@/api/types'
import { Button, Checkbox, DataTable, Input, Panel, Select, fullRow } from '@/components/ui'
import type { Column } from '@/components/ui'
import { ICON_NAMES } from '@/config/icons'
import { PERMISSIONS } from '@/config/permissions'
import { useApiMutation } from '@/hooks/useApi'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'
import { ActiveBadge, MasterDialog } from './masters-shared'
import { toNumber } from './masters-utils'

const AUDIENCES = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'technician', label: 'Technician' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Platform owner' },
]

// ---------------------------------------------------------------- menu

export function MenuMaster({ data }: { data: MastersDto }) {
  const [editing, setEditing] = useState<MenuItemDto | 'new' | null>(null)
  const [audience, setAudience] = useState('admin')
  const remove = useApiMutation((id: number) => api.platform.deleteMenuItem(id), {
    meta: { success: 'Menu link deleted.' },
  })
  const rows = data.menu.filter((m) => m.audience === audience)
  const columns: Column<MenuItemDto>[] = [
    { key: 'group', header: 'Group', render: (m) => `${m.groupOrder}. ${m.groupTitle}` },
    { key: 'label', header: 'Label', minWidth: 160, render: (m) => <strong>{m.label}</strong> },
    {
      key: 'route',
      header: 'Route',
      render: (m) => <span className={shared.mono}>{m.route}</span>,
    },
    { key: 'icon', header: 'Icon', render: (m) => m.icon || '-' },
    {
      key: 'access',
      header: 'Needs access id',
      render: (m) => (
        <span className={`${shared.mono} ${shared.small}`}>{m.accessId || 'everyone'}</span>
      ),
    },
    { key: 'order', header: 'Order', render: (m) => m.sortOrder },
    { key: 'status', header: 'Status', render: (m) => <ActiveBadge active={m.active} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Can permission={PERMISSIONS.masterEdit}>
            <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>
              Edit
            </Button>
          </Can>
          <Can permission={PERMISSIONS.masterDelete}>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete the ${m.label} link?`)) remove.mutate(m.id)
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
        title="Menu links"
        actions={
          <div className={shared.row}>
            <Select
              label="Role"
              options={AUDIENCES}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
            <Can permission={PERMISSIONS.masterAdd}>
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus size={14} aria-hidden="true" /> Add link
              </Button>
            </Can>
          </div>
        }
        flush
      >
        <DataTable columns={columns} rows={rows} getRowId={(m) => String(m.id)} />
      </Panel>
      {editing && <MenuForm row={editing} audience={audience} onClose={() => setEditing(null)} />}
    </>
  )
}

function MenuForm({
  row,
  audience,
  onClose,
}: {
  row: MenuItemDto | 'new'
  audience: string
  onClose: () => void
}) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    audience: isNew ? audience : row.audience,
    groupTitle: isNew ? '' : row.groupTitle,
    groupOrder: isNew ? '1' : String(row.groupOrder),
    label: isNew ? '' : row.label,
    route: isNew ? '/' : row.route,
    icon: isNew ? 'CircleDot' : row.icon,
    accessId: isNew ? '' : row.accessId,
    sortOrder: isNew ? '' : String(row.sortOrder),
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        audience: form.audience,
        groupTitle: form.groupTitle.trim(),
        groupOrder: toNumber(form.groupOrder),
        label: form.label.trim(),
        route: form.route.trim(),
        icon: form.icon,
        accessId: form.accessId.trim(),
        sortOrder: toNumber(form.sortOrder),
        active: form.active,
      }
      return isNew ? api.platform.addMenuItem(body) : api.platform.updateMenuItem(row.id, body)
    },
    { meta: { inline: true, success: 'Menu link saved.' }, onSuccess: onClose },
  )
  const set =
    (key: 'groupTitle' | 'groupOrder' | 'label' | 'route' | 'accessId' | 'sortOrder') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })
  return (
    <MasterDialog
      title={isNew ? 'Add menu link' : 'Edit menu link'}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={
        form.label.trim() !== '' && form.groupTitle.trim() !== '' && form.route.startsWith('/')
      }
      onSubmit={() => save.mutate(undefined)}
    >
      <Select
        label="Shown to"
        required
        options={AUDIENCES}
        value={form.audience}
        onChange={(e) => setForm({ ...form, audience: e.target.value })}
      />
      <Input label="Label" required value={form.label} onChange={set('label')} />
      <Input label="Group" required value={form.groupTitle} onChange={set('groupTitle')} />
      <Input
        label="Group order"
        type="number"
        value={form.groupOrder}
        onChange={set('groupOrder')}
      />
      <Input
        label="Route"
        required
        placeholder="/settings"
        hint="A page the console already has."
        value={form.route}
        onChange={set('route')}
      />
      <Select
        label="Icon"
        options={ICON_NAMES.map((n) => ({ value: n, label: n }))}
        value={form.icon}
        onChange={(e) => setForm({ ...form, icon: e.target.value })}
      />
      <Input
        className={fullRow}
        label="Needs access id"
        placeholder="e.g. REPORT_VIEW (several: A,B shows for either)"
        hint="Leave empty for everyone with this role."
        value={form.accessId}
        onChange={set('accessId')}
      />
      <Input
        label="Order in group"
        type="number"
        value={form.sortOrder}
        onChange={set('sortOrder')}
      />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}

// ---------------------------------------------------------------- access ids

export function AccessMaster({ data }: { data: MastersDto }) {
  const [editing, setEditing] = useState<AccessPermissionDto | 'new' | null>(null)
  const columns: Column<AccessPermissionDto>[] = [
    {
      key: 'id',
      header: 'Access id',
      minWidth: 180,
      render: (a) => <strong className={shared.mono}>{a.accessId}</strong>,
    },
    { key: 'module', header: 'Module', render: (a) => a.module },
    { key: 'resource', header: 'Screen', render: (a) => a.resource },
    { key: 'action', header: 'Action', render: (a) => a.action },
    { key: 'label', header: 'Label', render: (a) => a.label },
    {
      key: 'scope',
      header: 'For',
      render: (a) => (a.platformOnly ? 'Platform owner only' : 'Admin and staff'),
    },
    { key: 'status', header: 'Status', render: (a) => <ActiveBadge active={a.active} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <Can permission={PERMISSIONS.masterEdit}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(a)}>
            Edit
          </Button>
        </Can>
      ),
    },
  ]
  return (
    <>
      <Panel
        title="Access ids"
        actions={
          <Can permission={PERMISSIONS.masterAdd}>
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus size={14} aria-hidden="true" /> Add access id
            </Button>
          </Can>
        }
        flush
      >
        <DataTable columns={columns} rows={data.access} getRowId={(a) => a.accessId} />
      </Panel>
      {editing && <AccessForm row={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function AccessForm({ row, onClose }: { row: AccessPermissionDto | 'new'; onClose: () => void }) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    accessId: isNew ? '' : row.accessId,
    module: isNew ? '' : row.module,
    resource: isNew ? '' : row.resource,
    action: isNew ? '' : row.action,
    label: isNew ? '' : row.label,
    platformOnly: isNew ? false : row.platformOnly,
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        module: form.module.trim(),
        resource: form.resource.trim(),
        action: form.action.trim(),
        label: form.label.trim(),
        platformOnly: form.platformOnly,
        active: form.active,
      }
      return isNew
        ? api.platform.addAccess({ ...body, accessId: form.accessId.trim() })
        : api.platform.updateAccess(row.accessId, body)
    },
    { meta: { inline: true, success: 'Access id saved.' }, onSuccess: onClose },
  )
  const set =
    (key: 'accessId' | 'module' | 'resource' | 'action' | 'label') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })
  return (
    <MasterDialog
      title={isNew ? 'Add access id' : 'Edit access id'}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={
        form.module.trim() !== '' &&
        form.resource.trim() !== '' &&
        form.action.trim() !== '' &&
        form.label.trim() !== '' &&
        (!isNew || form.accessId.trim() !== '')
      }
      onSubmit={() => save.mutate(undefined)}
    >
      <Input
        label="Access id"
        required
        disabled={!isNew}
        placeholder="REPORT_EXPORT"
        hint={isNew ? 'Capitals and underscores. It cannot be changed later.' : undefined}
        value={form.accessId}
        onChange={set('accessId')}
      />
      <Input label="Label" required value={form.label} onChange={set('label')} />
      <Input
        label="Module"
        required
        placeholder="Configuration"
        value={form.module}
        onChange={set('module')}
      />
      <Input
        label="Screen"
        required
        placeholder="Reports"
        value={form.resource}
        onChange={set('resource')}
      />
      <Input
        label="Action"
        required
        placeholder="export"
        value={form.action}
        onChange={set('action')}
      />
      <Checkbox
        label="Platform owner only"
        checked={form.platformOnly}
        onChange={(e) => setForm({ ...form, platformOnly: e.target.checked })}
      />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}

// ---------------------------------------------------------------- lookups

export function LookupsMaster({ data }: { data: MastersDto }) {
  const types = [...new Set(data.lookups.map((l) => l.type))]
  const [type, setType] = useState(types[0] ?? 'label')
  const [editing, setEditing] = useState<LookupItemDto | 'new' | null>(null)
  const remove = useApiMutation((id: number) => api.platform.deleteLookup(id), {
    meta: { success: 'Lookup row deleted.' },
  })
  const rows = data.lookups.filter((l) => l.type === type)
  const columns: Column<LookupItemDto>[] = [
    { key: 'code', header: 'Code', render: (l) => <span className={shared.mono}>{l.code}</span> },
    { key: 'label', header: 'Label', minWidth: 200, render: (l) => <strong>{l.label}</strong> },
    { key: 'order', header: 'Order', render: (l) => l.sortOrder },
    { key: 'status', header: 'Status', render: (l) => <ActiveBadge active={l.active} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (l) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Can permission={PERMISSIONS.masterEdit}>
            <Button variant="secondary" size="sm" onClick={() => setEditing(l)}>
              Edit
            </Button>
          </Can>
          <Can permission={PERMISSIONS.masterDelete}>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete ${l.code}?`)) remove.mutate(l.id)
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
        title="Lookups"
        actions={
          <div className={shared.row}>
            <Select
              label="List"
              options={types.map((t) => ({ value: t, label: t }))}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
            <Can permission={PERMISSIONS.masterAdd}>
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus size={14} aria-hidden="true" /> Add row
              </Button>
            </Can>
          </div>
        }
        flush
      >
        <DataTable columns={columns} rows={rows} getRowId={(l) => String(l.id)} />
      </Panel>
      {editing && <LookupForm row={editing} type={type} onClose={() => setEditing(null)} />}
    </>
  )
}

function LookupForm({
  row,
  type,
  onClose,
}: {
  row: LookupItemDto | 'new'
  type: string
  onClose: () => void
}) {
  const isNew = row === 'new'
  const [form, setForm] = useState({
    code: isNew ? '' : row.code,
    label: isNew ? '' : row.label,
    sortOrder: isNew ? '' : String(row.sortOrder),
    active: isNew ? true : row.active,
  })
  const save = useApiMutation(
    () => {
      const body = {
        label: form.label.trim(),
        sortOrder: toNumber(form.sortOrder),
        active: form.active,
      }
      return isNew
        ? api.platform.addLookup({ ...body, type, code: form.code.trim() })
        : api.platform.updateLookup(row.id, body)
    },
    { meta: { inline: true, success: 'Lookup row saved.' }, onSuccess: onClose },
  )
  return (
    <MasterDialog
      title={isNew ? `Add to ${type}` : `Edit ${row.code}`}
      onClose={onClose}
      error={save.error?.message}
      saving={save.isPending}
      valid={form.label.trim() !== '' && (!isNew || form.code.trim() !== '')}
      onSubmit={() => save.mutate(undefined)}
    >
      <Input
        label="Code"
        required
        disabled={!isNew}
        hint={
          isNew ? 'What the console looks the label up by. It cannot be changed later.' : undefined
        }
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
      />
      <Input
        label="Label"
        required
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
      />
      <Input
        label="Order"
        type="number"
        value={form.sortOrder}
        onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
      />
      <Checkbox
        label="Active"
        checked={form.active}
        onChange={(e) => setForm({ ...form, active: e.target.checked })}
      />
    </MasterDialog>
  )
}
