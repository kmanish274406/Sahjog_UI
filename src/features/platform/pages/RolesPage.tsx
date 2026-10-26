import { ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '@/api'
import type { AccessPermissionDto, RoleAccessDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, Button, Panel, SearchInput } from '@/components/ui'
import { PERMISSIONS } from '@/config/permissions'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { Can } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'
import styles from './RolesPage.module.css'

const ACTION_ORDER = ['view', 'add', 'edit', 'delete', 'activate', 'extend', 'refund', 'features']

const actionLabel = (action: string) => action.charAt(0).toUpperCase() + action.slice(1)

interface Row {
  module: string
  resource: string
  cells: Map<string, AccessPermissionDto>
}

/** Super admin: choose which buttons and actions a client's Admin keeps. The platform owner always has all of them. */
export default function RolesPage() {
  const role = useApiQuery(['platform', 'adminRole'], api.platform.adminRole)
  return (
    <div className={shared.stack}>
      <PageHeader
        title="Roles & access"
        description="Pick the buttons and actions each role can use. The platform owner always has everything; an Admin has only what is ticked here."
      />
      <QueryState isLoading={role.isLoading} error={role.error}>
        {role.data && <AdminRoleMatrix data={role.data} />}
      </QueryState>
    </div>
  )
}

function AdminRoleMatrix({ data }: { data: RoleAccessDto }) {
  const [granted, setGranted] = useState(() => new Set(data.accessIds))
  const [term, setTerm] = useState('')

  const save = useApiMutation(() => api.platform.saveAdminRole([...granted]), {
    meta: { inline: true, success: 'Permissions saved.' },
  })

  const { columns, rows } = useMemo(() => {
    const cols = [...new Set(data.catalog.map((c) => c.action))].sort(
      (a, b) =>
        (ACTION_ORDER.indexOf(a) === -1 ? 99 : ACTION_ORDER.indexOf(a)) -
        (ACTION_ORDER.indexOf(b) === -1 ? 99 : ACTION_ORDER.indexOf(b)),
    )
    const byResource = new Map<string, Row>()
    for (const item of data.catalog) {
      const key = `${item.module}|${item.resource}`
      const row = byResource.get(key) ?? {
        module: item.module,
        resource: item.resource,
        cells: new Map(),
      }
      row.cells.set(item.action, item)
      byResource.set(key, row)
    }
    return { columns: cols, rows: [...byResource.values()] }
  }, [data.catalog])

  const needle = term.trim().toLowerCase()
  const shown = rows.filter(
    (r) => !needle || `${r.resource} ${r.module}`.toLowerCase().includes(needle),
  )
  const modules = [...new Set(shown.map((r) => r.module))]

  const setMany = (ids: string[], on: boolean) =>
    setGranted((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  const idsOf = (list: Row[]) => list.flatMap((r) => [...r.cells.values()].map((c) => c.accessId))
  const allOf = (ids: string[]) => ids.length > 0 && ids.every((id) => granted.has(id))
  const changed =
    granted.size !== data.accessIds.length || data.accessIds.some((id) => !granted.has(id))

  return (
    <>
      <Alert tone="info">
        These apply to every client&apos;s Admin. The platform owner has all {data.catalog.length}{' '}
        business permissions plus the platform ones (clients, masters and this screen).
      </Alert>
      <Panel
        title="Admin"
        subtitle={`${granted.size} of ${data.catalog.length} permissions granted`}
        actions={
          <div className={shared.row}>
            <SearchInput
              label="Search screens"
              placeholder="Search a screen"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={() => setMany(idsOf(shown), true)}>
              Select all
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMany(idsOf(shown), false)}>
              Clear all
            </Button>
          </div>
        }
        flush
      >
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.screen}>Screen</th>
                {columns.map((action) => {
                  const ids = rows.flatMap((r) => r.cells.get(action)?.accessId ?? [])
                  return (
                    <th key={action} className={styles.action}>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={allOf(ids)}
                          onChange={(e) => setMany(ids, e.target.checked)}
                          aria-label={`${actionLabel(action)} on every screen`}
                        />
                        {actionLabel(action)}
                      </label>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <ModuleRows
                  key={module}
                  module={module}
                  rows={shown.filter((r) => r.module === module)}
                  columns={columns}
                  granted={granted}
                  setMany={setMany}
                  idsOf={idsOf}
                  allOf={allOf}
                />
              ))}
              {modules.length === 0 && (
                <tr>
                  <td className={styles.empty} colSpan={columns.length + 1}>
                    No screen matches &quot;{term}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <Can permission={PERMISSIONS.roleEdit}>
        <div className={shared.formActions}>
          <Button
            variant="secondary"
            disabled={!changed}
            onClick={() => setGranted(new Set(data.accessIds))}
          >
            Reset
          </Button>
          <Button
            loading={save.isPending}
            disabled={!changed}
            onClick={() => save.mutate(undefined)}
          >
            <ShieldCheck size={16} aria-hidden="true" /> Save permissions
          </Button>
        </div>
      </Can>
    </>
  )
}

function ModuleRows({
  module,
  rows,
  columns,
  granted,
  setMany,
  idsOf,
  allOf,
}: {
  module: string
  rows: Row[]
  columns: string[]
  granted: Set<string>
  setMany: (ids: string[], on: boolean) => void
  idsOf: (rows: Row[]) => string[]
  allOf: (ids: string[]) => boolean
}) {
  const moduleIds = idsOf(rows)
  return (
    <>
      <tr className={styles.group}>
        <td colSpan={columns.length + 1}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={allOf(moduleIds)}
              onChange={(e) => setMany(moduleIds, e.target.checked)}
              aria-label={`Every permission under ${module}`}
            />
            <strong>{module}</strong>
            <span className={styles.count}>
              {moduleIds.filter((id) => granted.has(id)).length} / {moduleIds.length}
            </span>
          </label>
        </td>
      </tr>
      {rows.map((row) => {
        const rowIds = [...row.cells.values()].map((c) => c.accessId)
        return (
          <tr key={row.resource}>
            <td className={styles.screen}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={allOf(rowIds)}
                  onChange={(e) => setMany(rowIds, e.target.checked)}
                  aria-label={`Every permission on ${row.resource}`}
                />
                {row.resource}
              </label>
            </td>
            {columns.map((action) => {
              const item = row.cells.get(action)
              return (
                <td key={action} className={styles.action}>
                  {item ? (
                    <input
                      type="checkbox"
                      checked={granted.has(item.accessId)}
                      onChange={(e) => setMany([item.accessId], e.target.checked)}
                      title={item.label}
                      aria-label={item.label}
                    />
                  ) : (
                    <span className={styles.na}>–</span>
                  )}
                </td>
              )
            })}
          </tr>
        )
      })}
    </>
  )
}
