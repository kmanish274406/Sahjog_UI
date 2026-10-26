import styles from './Charts.module.css'

export interface BarListItem {
  label: string
  value: number
}

export interface BarListProps {
  items: BarListItem[]
  color?: string
  formatValue?: (value: number) => string
}

/** Horizontal bars for ranked comparisons (sources, regions…). One hue; length carries the value. */
export function BarList({ items, color = 'var(--chart-1)', formatValue = String }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value))

  return (
    <ul className={styles.barList}>
      {items.map((item) => (
        <li key={item.label}>
          <div className={styles.barRowHead}>
            <span>{item.label}</span>
            <span className={styles.barValue}>{formatValue(item.value)}</span>
          </div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
