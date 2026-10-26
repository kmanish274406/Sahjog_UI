import clsx from 'clsx'
import { useId } from 'react'
import type { Ref, TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  rows = 3,
  required,
  ref,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`

  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={fieldId} className={clsx(styles.label, required && styles.required)}>
        {label}
      </label>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        className={clsx(styles.control, styles.textarea, error && styles.invalid)}
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
