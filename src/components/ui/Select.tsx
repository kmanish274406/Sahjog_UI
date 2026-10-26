import clsx from 'clsx'
import { useId } from 'react'
import type { Ref, SelectHTMLAttributes } from 'react'
import type { SelectOption } from '@/types/common'
import styles from './Field.module.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  /** Helper text shown under the field while it has no error. */
  hint?: string
  placeholder?: string
  ref?: Ref<HTMLSelectElement>
}

export function Select({
  label,
  options,
  error,
  hint,
  placeholder,
  id,
  className,
  required,
  ref,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={selectId} className={clsx(styles.label, required && styles.required)}>
        {label}
      </label>
      <select
        id={selectId}
        ref={ref}
        className={clsx(styles.control, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  )
}
