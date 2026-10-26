import type { ReactNode } from 'react'
import styles from './Toolbar.module.css'

/** Row of filters / search above a table. Children are laid out with wrapping. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>
}
