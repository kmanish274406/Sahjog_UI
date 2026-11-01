import { useState } from 'react'
import { api } from '@/api'
import type { StaffDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Modal,
  Panel,
  SearchInput,
  Select,
  Tabs,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { PERMISSIONS } from '@/config/permissions'
import { Can } from '@/hooks/Can'
import shared from '@/styles/shared.module.css'
import { formatDate } from '@/utils/format'

type Kind = 'Customer' | 'Vendor' | 'Technician'

export default function UsersPage() {
  const [kind, setKind] = useState<Kind>('Vendor')
  const [term, setTerm] = useState('')
  const [extending, setExtending] = useState<StaffDto | null>(null)
  const users = useApiQuery(['admin', 'users', kind], () => api.admin.users(kind))
  const setActive = useApiMutation(
    (v: { id: number; active: boolean }) => api.admin.setUserActive(v.id, v.active),
    {
      meta: { success: 'Account updated.' },
    },
  )
  const setApproval = useApiMutation(
    (input: { id: number; approved: boolean }) =>
      api.admin.setUserApproval(input.id, input.approved),
    {
      meta: {
        success: 'Account review saved.',
      },
    },
  )

  const rows = (users.data ?? []).filter((u) =>
    `${u.name} ${u.business} ${u.skill} ${u.phone} ${u.email}`
      .toLowerCase()
      .includes(term.trim().toLowerCase()),
  )

  const columns: Column<StaffDto>[] = [
    {
      key: 'name',
      header: kind === 'Vendor' ? 'Business' : kind === 'Technician' ? 'Technician' : 'Customer',
      minWidth: 180,
      render: (u) => (
        <span>
          <span aria-hidden="true">{u.emoji}</span>{' '}
          <strong>{kind === 'Vendor' ? u.business || u.name : u.name}</strong>
          {kind === 'Vendor' && u.business && u.business !== u.name && (
            <small className={shared.muted}>Owner: {u.name}</small>
          )}
        </span>
      ),
    },
    ...(kind !== 'Customer'
      ? [
          {
            key: 'skill',
            header: kind === 'Vendor' ? 'Offers' : 'Skill',
            render: (u: StaffDto) => u.skill || '-',
          },
        ]
      : []),
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className={shared.mono}>{u.phone || '-'}</span>,
    },
    ...(kind !== 'Customer'
      ? [
          { key: 'plan', header: 'Plan', render: (u: StaffDto) => u.plan },
          {
            key: 'expiry',
            header: 'Plan ends',
            render: (u: StaffDto) => (
              <span className={shared.nowrap}>
                {u.subscriptionActive ? (
                  formatDate(u.expiry)
                ) : (
                  <Badge tone="warning">Inactive</Badge>
                )}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Account',
      render: (u) => (
        <Badge tone={u.active ? 'success' : 'danger'}>{u.active ? 'Enabled' : 'Disabled'}</Badge>
      ),
    },
    ...(kind !== 'Customer'
      ? [
          {
            key: 'approval',
            header: 'Review',
            render: (u: StaffDto) => {
              const status = u.approvalStatus
              const tone =
                status === 'approved'
                  ? 'success'
                  : status === 'rejected'
                    ? 'danger'
                    : status === 'pending'
                      ? 'warning'
                      : 'neutral'
              const label = status
                ? status === 'pending'
                  ? 'Pending approval'
                  : status[0]!.toUpperCase() + status.slice(1)
                : 'Not provided'
              return <Badge tone={tone}>{label}</Badge>
            },
          },
        ]
      : []),
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          {kind !== 'Customer' && (
            <Can permission={PERMISSIONS.userExtend}>
              <Button size="sm" variant="secondary" onClick={() => setExtending(u)}>
                Extend plan
              </Button>
            </Can>
          )}
          <Can permission={PERMISSIONS.userEdit}>
            <>
              {kind !== 'Customer' && u.approvalStatus === 'pending' && (
                <>
                  <Button
                    size="sm"
                    disabled={setApproval.isPending}
                    onClick={() => setApproval.mutate({ id: u.id, approved: true })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={setApproval.isPending}
                    onClick={() => setApproval.mutate({ id: u.id, approved: false })}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant={u.active ? 'danger' : 'primary'}
                disabled={setActive.isPending}
                onClick={() => {
                  if (
                    !u.active ||
                    window.confirm(
                      `Disable ${u.business || u.name}? They cannot sign in until you enable the account again.`,
                    )
                  ) {
                    setActive.mutate({ id: u.id, active: !u.active })
                  }
                }}
              >
                {u.active ? 'Disable' : 'Enable'}
              </Button>
            </>
          </Can>
        </span>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="User accounts"
        description="Review vendors and technicians, manage customer access, approve provider accounts and extend provider subscriptions."
      />
      <Toolbar>
        <Tabs
          items={[
            { id: 'Customer', label: 'Customers' },
            { id: 'Vendor', label: 'Vendors' },
            { id: 'Technician', label: 'Technicians' },
          ]}
          active={kind}
          onChange={setKind}
          label="Account type"
        />
        <SearchInput
          label="Search accounts"
          placeholder="Search by name, business, email or phone"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </Toolbar>
      <QueryState isLoading={users.isLoading} error={users.error}>
        {setApproval.isError && <Alert tone="danger">{setApproval.error.message}</Alert>}
        {setActive.isError && <Alert tone="danger">{setActive.error.message}</Alert>}
        <Panel flush>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(u) => String(u.id)}
            emptyMessage="No accounts found."
          />
        </Panel>
      </QueryState>
      <Modal
        open={extending !== null}
        title="Extend subscription"
        onClose={() => setExtending(null)}
      >
        {extending && <ExtendForm user={extending} onDone={() => setExtending(null)} />}
      </Modal>
    </div>
  )
}

function ExtendForm({ user, onDone }: { user: StaffDto; onDone: () => void }) {
  const [months, setMonths] = useState('1')
  const extend = useApiMutation(() => api.admin.extendPlan(user.id, Number(months)), {
    meta: { inline: true, success: 'Plan extended.' },
    onSuccess: onDone,
  })
  return (
    <div className={shared.stackTight}>
      <p>
        Give <strong>{user.name}</strong> more time on their plan, for example after a payment made
        outside the app.
      </p>
      <Select
        label="Extend by"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
        options={[1, 2, 3, 6, 12].map((m) => ({
          value: String(m),
          label: `${m} ${m === 1 ? 'month' : 'months'}`,
        }))}
      />
      {extend.isError && <Alert tone="danger">{extend.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button loading={extend.isPending} onClick={() => extend.mutate(undefined)}>
          Extend plan
        </Button>
      </div>
    </div>
  )
}
