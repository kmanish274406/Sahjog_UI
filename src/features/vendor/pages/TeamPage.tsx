import { Plus, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { StaffDto } from '@/api/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Badge, Button, DataTable, Input, Modal, Panel } from '@/components/ui'
import type { Column } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'

export default function TeamPage() {
  const team = useApiQuery(['vendor', 'technicians'], api.vendor.technicians)
  const [adding, setAdding] = useState(false)
  const remove = useApiMutation((id: number) => api.vendor.removeTechnician(id), {
    meta: { success: 'Technician removed from your team.' },
  })

  const columns: Column<StaffDto>[] = [
    {
      key: 'name',
      header: 'Technician',
      minWidth: 180,
      render: (t) => (
        <span>
          <span aria-hidden="true">{t.emoji}</span> <strong>{t.name}</strong>
        </span>
      ),
    },
    { key: 'skill', header: 'Skill', render: (t) => t.skill || '-' },
    {
      key: 'phone',
      header: 'Phone',
      render: (t) => <span className={shared.mono}>{t.phone || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) =>
        !t.active ? (
          <Badge tone="danger">Disabled</Badge>
        ) : t.onJob ? (
          <Badge tone="warning">On a job</Badge>
        ) : (
          <Badge tone="success">Available</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove ${t.name}`}
          disabled={remove.isPending}
          onClick={() => {
            if (window.confirm(`Remove ${t.name} from your team?`)) remove.mutate(t.id)
          }}
        >
          <Trash2 size={15} />
        </Button>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="My technicians"
        description="The people you can assign orders to. They are covered by your subscription."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" /> Add technician
          </Button>
        }
      />
      <QueryState isLoading={team.isLoading} error={team.error}>
        <Panel flush>
          {team.data && team.data.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No technicians yet"
              action={<Button onClick={() => setAdding(true)}>Add your first technician</Button>}
            >
              Add the people who do the work, so you can assign accepted orders to them.
            </EmptyState>
          ) : (
            <DataTable columns={columns} rows={team.data ?? []} getRowId={(t) => String(t.id)} />
          )}
        </Panel>
      </QueryState>
      <Modal open={adding} title="Add a technician" onClose={() => setAdding(false)}>
        {adding && <AddForm onDone={() => setAdding(false)} />}
      </Modal>
    </div>
  )
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [skill, setSkill] = useState('')
  const [phone, setPhone] = useState('')
  const add = useApiMutation(
    () =>
      api.vendor.addTechnician({
        name: name.trim(),
        skill: skill.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    {
      meta: { inline: true, success: 'Technician added.' },
      onSuccess: onDone,
    },
  )

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        add.mutate(undefined)
      }}
    >
      <Input
        label="Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <Input
        label="Skill"
        placeholder="For example AC technician"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        maxLength={80}
      />
      <Input
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      {add.isError && <Alert tone="danger">{add.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={add.isPending} disabled={name.trim().length < 2}>
          Add technician
        </Button>
      </div>
    </form>
  )
}
