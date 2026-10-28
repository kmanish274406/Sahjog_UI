import type { ReactNode } from 'react'
import { Alert, Badge, Button, FormActions, Modal } from '@/components/ui'
import shared from '@/styles/shared.module.css'

/** The status pill every master list shows. */
export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Hidden'}</Badge>
}

/** The small add/edit dialog every master list uses. */
export function MasterDialog({
  title,
  onClose,
  error,
  saving,
  valid,
  onSubmit,
  children,
}: {
  title: string
  onClose: () => void
  error?: string
  saving: boolean
  valid: boolean
  onSubmit: () => void
  children: ReactNode
}) {
  return (
    <Modal open title={title} onClose={onClose}>
      <form
        className={shared.stackTight}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className={shared.formGrid}>{children}</div>
        {error && <Alert tone="danger">{error}</Alert>}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            Save
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
