import clsx from 'clsx'
import { X } from 'lucide-react'
import { useToastStore } from '@/store/toast.store'
import styles from './Toaster.module.css'

/** Bottom-right messages for the result of an action. Errors are announced at once, the rest politely. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className={styles.region} aria-live="polite">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={clsx(styles.toast, styles[item.tone])}
          role={item.tone === 'danger' ? 'alert' : 'status'}
        >
          <span className={styles.message}>{item.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
