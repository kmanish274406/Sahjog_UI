import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import styles from './SearchInput.module.css'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function SearchInput({ label, ...rest }: SearchInputProps) {
  return (
    <label className={styles.wrapper}>
      <span className={styles.srOnly}>{label}</span>
      <Search size={16} className={styles.icon} aria-hidden="true" />
      <input type="search" className={styles.input} {...rest} />
    </label>
  )
}
