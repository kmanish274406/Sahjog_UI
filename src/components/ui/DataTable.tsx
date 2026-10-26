import type { ReactNode } from 'react'
import { Spinner } from './Spinner'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Narrowest the column may get (px). Keeps names from wrapping to four lines when the table is crowded. */
  minWidth?: number
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  /** Extra class for a row, e.g. to paint a blocked deal red. */
  rowClassName?: (row: T) => string | undefined
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  emptyMessage = 'No records found.',
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={styles.state}>
        <Spinner />
      </div>
    )
  }

  if (rows.length === 0) {
    return <div className={styles.state}>{emptyMessage}</div>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ textAlign: column.align ?? 'left', minWidth: column.minWidth }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className={rowClassName?.(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-align={column.align ?? 'left'}
                  style={{ textAlign: column.align ?? 'left' }}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
