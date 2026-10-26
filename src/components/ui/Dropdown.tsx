import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import styles from './Dropdown.module.css'

export interface DropdownProps {
  renderTrigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: number
}

export function Dropdown({ renderTrigger, children, align = 'right', width = 280 }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  useClickOutside(containerRef, close, open)

  return (
    <div ref={containerRef} className={styles.container}>
      {renderTrigger({ open, toggle })}
      {open && (
        <div className={clsx(styles.panel, styles[align])} style={{ width }}>
          {children(close)}
        </div>
      )}
    </div>
  )
}
