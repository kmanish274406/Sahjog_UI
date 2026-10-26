import clsx from 'clsx'
import { useId } from 'react'
import type { InputHTMLAttributes, Ref } from 'react'
import styles from './Field.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  /** Helper text shown under the field while it has no error. */
  hint?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * `required` only marks the label (and sets aria-required): the form's own schema validates, so the
 * browser's native validation bubbles never appear on top of the inline messages.
 */
export function Input({ label, error, hint, id, className, required, ref, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={inputId} className={clsx(styles.label, required && styles.required)}>
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={clsx(styles.control, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
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
