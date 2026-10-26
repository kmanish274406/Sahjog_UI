import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** A roomy dialog for documents and long forms. */
  wide?: boolean
}

/** Accessible modal built on the native <dialog> element (focus trap + Esc handled by the browser). */
export function Modal({ open, title, onClose, children, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.modal, wide && styles.wide)}
      onClose={onClose}
      aria-label={title}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          ✕
        </Button>
      </header>
      {open && <div className={styles.body}>{children}</div>}
    </dialog>
  )
}
