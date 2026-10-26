import clsx from 'clsx'
import styles from './Tabs.module.css'

export interface TabItem<TId extends string> {
  id: TId
  label: string
}

export interface TabsProps<TId extends string> {
  items: TabItem<TId>[]
  active: TId
  onChange: (id: TId) => void
  label?: string
}

export function Tabs<TId extends string>({ items, active, onChange, label }: TabsProps<TId>) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === active}
          className={clsx(styles.tab, item.id === active && styles.active)}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
