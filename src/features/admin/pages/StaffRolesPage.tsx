import { Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { StaffRoleDto, StaffRolesDto } from '@/api/types'
import { AccessMatrix } from '@/components/access/AccessMatrix'
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
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'

/** A client's own roles for its staff: name them and tick what each may do (never more than the Admin role has). */
export default function StaffRolesPage() {
  const data = useApiQuery(['admin', 'roles'], api.admin.roles)
  const [editing, setEditing] = useState<StaffRoleDto | 'new' | null>(null)
  const remove = useApiMutation((id: number) => api.admin.deleteRole(id), {
    meta: { success: 'Role deleted.' },
  })

  const columns: Column<StaffRoleDto>[] = [
    { key: 'name', header: 'Role', minWidth: 160, render: (r) => <strong>{r.name}</strong> },
    {
      key: 'description',
      header: 'Description',
      render: (r) => <span className={shared.muted}>{r.description || '-'}</span>,
    },
    { key: 'perms', header: 'Permissions', render: (r) => r.accessIds.length },
    { key: 'staff', header: 'Staff', render: (r) => r.staffCount },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Off'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Can permission={PERMISSIONS.roleEdit}>
            <Button variant="secondary" size="sm" onClick={() => setEditing(r)}>
              Edit
            </Button>
          </Can>
          <Can permission={PERMISSIONS.roleDelete}>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete the ${r.name} role?`)) remove.mutate(r.id)
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
    <div className={shared.stack}>
      <PageHeader
        title="Roles"
        description="Create roles for your staff and choose what each can do."
        actions={
          <Can permission={PERMISSIONS.roleAdd}>
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden="true" /> New role
            </Button>
          </Can>
        }
      />
      <QueryState isLoading={data.isLoading} error={data.error}>
        {remove.isError && <Alert tone="danger">{remove.error.message}</Alert>}
        <Panel flush>
          <DataTable
            columns={columns}
            rows={data.data?.roles ?? []}
            getRowId={(r) => String(r.id)}
            emptyMessage="No roles yet. Create one, then give it to a staff member."
          />
        </Panel>
        {editing && data.data && (
          <RoleForm row={editing} catalog={data.data} onClose={() => setEditing(null)} />
        )}
      </QueryState>
    </div>
  )
}

function RoleForm({
  row,
  catalog,
  onClose,
}: {
  row: StaffRoleDto | 'new'
  catalog: StaffRolesDto
  onClose: () => void
}) {
  const isNew = row === 'new'
  const [name, setName] = useState(isNew ? '' : row.name)
  const [description, setDescription] = useState(isNew ? '' : row.description)
  const [active, setActive] = useState(isNew ? true : row.active)
  const [granted, setGranted] = useState(() => new Set(isNew ? [] : row.accessIds))
  const save = useApiMutation(
    () => {
      const body = {
        name: name.trim(),
        description: description.trim(),
        active,
        accessIds: [...granted],
      }
      return isNew ? api.admin.addRole(body) : api.admin.updateRole(row.id, body)
    },
    { meta: { inline: true, success: 'Role saved.' }, onSuccess: onClose },
  )
  return (
    <Modal open wide title={isNew ? 'New role' : `Edit ${row.name}`} onClose={onClose}>
      <form
        className={shared.stackTight}
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Role name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Checkbox label="Active" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </div>
        <Panel title="Permissions" flush>
          <AccessMatrix catalog={catalog.catalog} granted={granted} onChange={setGranted} />
        </Panel>
        {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={name.trim().length < 2}>
            Save role
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
