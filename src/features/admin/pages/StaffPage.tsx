import { Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { StaffMemberDto, StaffRoleDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Alert,
  Badge,
  Button,
  DataTable,
  FormActions,
  Input,
  Modal,
  Panel,
  Select,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

/** Staff accounts: people who sign in on the Admin tab and can do only what their role allows. */
export default function StaffPage() {
  const staff = useApiQuery(['admin', 'staff'], api.admin.staff)
  const roles = useApiQuery(['admin', 'roles'], api.admin.roles)
  const [editing, setEditing] = useState<StaffMemberDto | 'new' | null>(null)
  const setActive = useApiMutation(
    (v: { id: number; active: boolean }) => api.admin.updateStaff(v.id, { active: v.active }),
    { meta: { success: 'Staff member updated.' } },
  )

  const columns: Column<StaffMemberDto>[] = [
    { key: 'name', header: 'Name', minWidth: 160, render: (s) => <strong>{s.name}</strong> },
    {
      key: 'email',
      header: 'Email',
      render: (s) => <span className={shared.mono}>{s.email}</span>,
    },
    { key: 'role', header: 'Role', render: (s) => s.roleName },
    { key: 'created', header: 'Added', render: (s) => formatDate(s.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge tone={s.active ? 'success' : 'danger'}>{s.active ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) =>
        s.roleId === null ? null : (
          <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
            <Can permission={PERMISSIONS.staffEdit}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={setActive.isPending}
                onClick={() => setActive.mutate({ id: s.id, active: !s.active })}
              >
                {s.active ? 'Disable' : 'Enable'}
              </Button>
            </Can>
          </span>
        ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Staff"
        description="People who sign in on the Admin tab with their own email and password. Their role decides what they can do."
        actions={
          <Can permission={PERMISSIONS.staffAdd}>
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden="true" /> Add staff
            </Button>
          </Can>
        }
      />
      <QueryState isLoading={staff.isLoading} error={staff.error}>
        {setActive.isError && <Alert tone="danger">{setActive.error.message}</Alert>}
        <Panel flush>
          <DataTable columns={columns} rows={staff.data ?? []} getRowId={(s) => String(s.id)} />
        </Panel>
        {editing && (
          <StaffForm
            row={editing}
            roles={(roles.data?.roles ?? []).filter((r) => r.active)}
            onClose={() => setEditing(null)}
          />
        )}
      </QueryState>
    </div>
  )
}

function StaffForm({
  row,
  roles,
  onClose,
}: {
  row: StaffMemberDto | 'new'
  roles: StaffRoleDto[]
  onClose: () => void
}) {
  const isNew = row === 'new'
  const [name, setName] = useState(isNew ? '' : row.name)
  const [email, setEmail] = useState(isNew ? '' : row.email)
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(isNew || row.roleId === null ? '' : String(row.roleId))
  const save = useApiMutation(
    () => {
      const body = {
        name: name.trim(),
        roleId: roleId === '' ? undefined : Number(roleId),
        password: password || undefined,
      }
      return isNew
        ? api.admin.addStaff({ ...body, email: email.trim() })
        : api.admin.updateStaff(row.id, body)
    },
    { meta: { inline: true, success: 'Staff member saved.' }, onSuccess: onClose },
  )
  const valid =
    name.trim().length >= 2 &&
    roleId !== '' &&
    (!isNew || (email.includes('@') && password.length >= 6))
  return (
    <Modal open title={isNew ? 'Add staff' : `Edit ${row.name}`} onClose={onClose}>
      <form
        className={shared.stackTight}
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <div className={shared.formGrid}>
          <Input
            label="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            required
            type="email"
            disabled={!isNew}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            label="Role"
            required
            placeholder="Choose a role"
            options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          />
          <Input
            label={isNew ? 'Password' : 'New password'}
            required={isNew}
            type="password"
            autoComplete="new-password"
            placeholder={isNew ? 'At least 6 characters' : 'Leave empty to keep it'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
        <FormActions note="They sign in on the Admin tab with this email.">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!valid}>
            Save
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
