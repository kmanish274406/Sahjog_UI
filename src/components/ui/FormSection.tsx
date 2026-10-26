import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import styles from './FormSection.module.css'

export interface FormSectionProps {
  title: string
  /** One sentence telling the person what this group of fields is for. */
  description?: string
  /** How many equal columns the fields use on a wide screen. Default 2. */
  columns?: 1 | 2 | 3 | 4
  /** Put the title above the fields instead of beside them: for dialogs and other narrow spaces. */
  stacked?: boolean
  className?: string
  children: ReactNode
}

/**
 * One block of a long form, laid out like a paper register: the title and guidance sit in a left
 * column, the fields in an aligned grid on the right, and a hairline separates it from the next
 * block. Fields always line up on the same columns, whatever their type.
 */
export function FormSection({
  title,
  description,
  columns = 2,
  stacked = false,
  className,
  children,
}: FormSectionProps) {
  return (
    <section className={clsx(styles.section, stacked && styles.stacked, className)}>
      <header className={styles.head}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.fields} style={{ '--cols': columns } as CSSProperties}>
        {children}
      </div>
    </section>
  )
}

export interface FormActionsProps {
  /** Keep the buttons in view at the bottom of the screen while a long form scrolls. */
  sticky?: boolean
  /** Left-aligned note, e.g. "Fields marked * are required". */
  note?: ReactNode
  children: ReactNode
}

export function FormActions({ sticky = false, note, children }: FormActionsProps) {
  return (
    <div className={clsx(styles.actions, sticky && styles.sticky)}>
      {note && <p className={styles.note}>{note}</p>}
      <div className={styles.buttons}>{children}</div>
    </div>
  )
}
