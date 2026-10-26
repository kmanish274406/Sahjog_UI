import clsx from 'clsx'
import type { InputHTMLAttributes, Ref } from 'react'
import styles from './Field.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  ref?: Ref<HTMLInputElement>
}

export function Checkbox({ label, className, ref, ...rest }: CheckboxProps) {
  return (
    <label className={clsx(styles.check, className)}>
      <input type="checkbox" ref={ref} {...rest} />
      <span>{label}</span>
    </label>
  )
}
