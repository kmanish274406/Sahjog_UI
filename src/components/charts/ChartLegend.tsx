import styles from './Charts.module.css'

export interface LegendItem {
  label: string
  color: string
  dashed?: boolean
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label} className={styles.legendItem}>
          <span
            className={item.dashed ? styles.legendLine : styles.legendSwatch}
            style={{ background: item.dashed ? undefined : item.color, borderColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
