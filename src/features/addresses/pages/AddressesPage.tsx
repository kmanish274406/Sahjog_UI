import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { AddressDto } from '@/api/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Input, Modal, Panel, Textarea } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { PlaceSearch } from '../components/PlaceSearch'

export default function AddressesPage() {
  const addresses = useApiQuery(['addresses'], api.customer.addresses)
  const [editing, setEditing] = useState<AddressDto | 'new' | null>(null)
  const remove = useApiMutation((id: number) => api.customer.deleteAddress(id), { meta: { success: 'Address removed.' } })

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Saved addresses"
        description="Pick one of these at checkout instead of typing it again."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" /> Add address
          </Button>
        }
      />
      <QueryState isLoading={addresses.isLoading} error={addresses.error}>
        {addresses.data && addresses.data.length === 0 ? (
          <Panel>
            <EmptyState icon={MapPin} title="No saved addresses yet" action={<Button onClick={() => setEditing('new')}>Add your first address</Button>}>
              Save your home or office so booking takes one less step.
            </EmptyState>
          </Panel>
        ) : (
          <div className={shared.grid3}>
            {addresses.data?.map((address) => (
              <Panel
                key={address.id}
                title={address.label}
                actions={
                  <span className={shared.row}>
                    <Button size="sm" variant="ghost" aria-label={`Edit ${address.label}`} onClick={() => setEditing(address)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${address.label}`}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Remove "${address.label}"?`)) remove.mutate(address.id)
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </span>
                }
              >
                <p>{address.text}</p>
              </Panel>
            ))}
          </div>
        )}
      </QueryState>
      <AddressModal editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function AddressModal({ editing, onClose }: { editing: AddressDto | 'new' | null; onClose: () => void }) {
  return (
    <Modal open={editing !== null} title={editing === 'new' ? 'Add an address' : 'Edit address'} onClose={onClose} wide>
      {editing !== null && <AddressForm key={editing === 'new' ? 'new' : editing.id} editing={editing} onDone={onClose} />}
    </Modal>
  )
}

function AddressForm({ editing, onDone }: { editing: AddressDto | 'new'; onDone: () => void }) {
  const existing = editing === 'new' ? null : editing
  const [label, setLabel] = useState(existing?.label ?? 'Home')
  const [text, setText] = useState(existing?.text ?? '')
  const save = useApiMutation(
    () => (existing ? api.customer.updateAddress(existing.id, { label, text }) : api.customer.addAddress({ label, text })),
    { meta: { inline: true, success: 'Address saved.' }, onSuccess: onDone },
  )

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(undefined)
      }}
    >
      <PlaceSearch onPick={setText} />
      <Input label="Label" required hint="For example Home, Office or Mom's place." value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
      <Textarea
        label="Full address"
        required
        rows={3}
        hint="House number, building, area and city."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
      />
      {save.isError && (
        <p role="alert" style={{ color: 'var(--color-danger)' }}>
          {save.error.message}
        </p>
      )}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!label.trim() || text.trim().length < 8}>
          Save address
        </Button>
      </div>
    </form>
  )
}
