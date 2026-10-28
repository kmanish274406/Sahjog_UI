import { useMemo, useState } from 'react'
import type { AccessPermissionDto } from '@/api/types'
import { Button, SearchInput } from '@/components/ui'
import styles from './AccessMatrix.module.css'

const ACTION_ORDER = ['view', 'add', 'edit', 'delete', 'activate', 'extend', 'refund', 'features']

const actionLabel = (action: string) => action.charAt(0).toUpperCase() + action.slice(1)

interface Row {
  module: string
  resource: string
  cells: Map<string, AccessPermissionDto>
}

/**
 * The Pharmacy-style role matrix: screens down the side, actions across, one checkbox per access id, with select-all by
 * column, screen and module, and a search. Used for the Admin role template and for a client's own staff roles.
 */
export function AccessMatrix({
  catalog,
  granted,
  onChange,
}: {
  catalog: AccessPermissionDto[]
  granted: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [term, setTerm] = useState('')

  const { columns, rows } = useMemo(() => {
    const rank = (a: string) => (ACTION_ORDER.indexOf(a) === -1 ? 99 : ACTION_ORDER.indexOf(a))
    const cols = [...new Set(catalog.map((c) => c.action))].sort((a, b) => rank(a) - rank(b))
    const byResource = new Map<string, Row>()
    for (const item of catalog) {
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
  }, [catalog])

  const needle = term.trim().toLowerCase()
  const shown = rows.filter(
    (r) => !needle || `${r.resource} ${r.module}`.toLowerCase().includes(needle),
  )
  const modules = [...new Set(shown.map((r) => r.module))]

  const setMany = (ids: string[], on: boolean) => {
    const next = new Set(granted)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    onChange(next)
  }
  const idsOf = (list: Row[]) => list.flatMap((r) => [...r.cells.values()].map((c) => c.accessId))
  const allOf = (ids: string[]) => ids.length > 0 && ids.every((id) => granted.has(id))

  return (
    <div>
      <div className={styles.toolbar}>
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
        <span className={styles.summary}>
          {granted.size} of {catalog.length} granted
        </span>
      </div>
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
            {modules.map((module) => {
              const moduleRows = shown.filter((r) => r.module === module)
              const moduleIds = idsOf(moduleRows)
              return (
                <ModuleRows
                  key={module}
                  module={module}
                  rows={moduleRows}
                  moduleIds={moduleIds}
                  columns={columns}
                  granted={granted}
                  setMany={setMany}
                  allOf={allOf}
                />
              )
            })}
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
    </div>
  )
}

function ModuleRows({
  module,
  rows,
  moduleIds,
  columns,
  granted,
  setMany,
  allOf,
}: {
  module: string
  rows: Row[]
  moduleIds: string[]
  columns: string[]
  granted: Set<string>
  setMany: (ids: string[], on: boolean) => void
  allOf: (ids: string[]) => boolean
}) {
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
