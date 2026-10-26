import { Avatar } from './Avatar'
import styles from './PersonCell.module.css'

export interface PersonCellProps {
  name: string
  subtitle?: string
  size?: number
}

/** Avatar with name and optional secondary line — used in tables and lists. */
export function PersonCell({ name, subtitle, size = 32 }: PersonCellProps) {
  return (
    <span className={styles.cell}>
      <Avatar name={name} size={size} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </span>
  )
}
