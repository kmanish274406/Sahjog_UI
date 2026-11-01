import clsx from 'clsx'
import { useEffect, useId, useRef } from 'react'
import type { InputHTMLAttributes, Ref } from 'react'
import { limitPhoneInput } from '@/domain/validators'
import fieldStyles from './Field.module.css'
import styles from './IndianPhoneInput.module.css'

export interface IndianPhoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

/** Indian mobile input with a fixed +91 context; the value contains only the national number. */
export function IndianPhoneInput({
  label,
  error,
  hint,
  id,
  className,
  required,
  ref,
  value,
  onChange,
  type = 'tel',
  inputMode = 'numeric',
  ...rest
}: IndianPhoneInputProps) {
  const generatedId = useId()
  const lastAcceptedValue = useRef(String(value ?? ''))
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  useEffect(() => {
    if (value !== undefined) lastAcceptedValue.current = String(value)
  }, [value])

  return (
    <div className={clsx(fieldStyles.field, className)}>
      <label
        htmlFor={inputId}
        className={clsx(fieldStyles.label, required && fieldStyles.required)}
      >
        {label}
      </label>
      <div className={clsx(styles.wrap, error && styles.invalid)}>
        <span className={styles.country} aria-label="India">
          🇮🇳 <span>+91</span>
        </span>
        <input
          {...rest}
          id={inputId}
          ref={ref}
          type={type}
          inputMode={inputMode}
          className={fieldStyles.control}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          value={value}
          onChange={(event) => {
            const raw = event.currentTarget.value
            const limited = limitPhoneInput(raw)
            if (limited === null) {
              event.currentTarget.value = lastAcceptedValue.current
              return
            }
            if (limited !== raw) event.currentTarget.value = limited
            lastAcceptedValue.current = limited
            onChange?.(event)
          }}
          maxLength={rest.maxLength ?? 20}
        />
      </div>
      {hint && !error && (
        <span id={hintId} className={fieldStyles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className={fieldStyles.error}>
          {error}
        </span>
      )}
    </div>
  )
}
