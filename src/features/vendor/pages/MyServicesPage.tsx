import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { assetUrl } from '@/api/http'
import type { SaveVendorServiceRequest, VendorServiceDto } from '@/api/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Input,
  Modal,
  Panel,
  Select,
  Textarea,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { useServices } from '@/features/catalog/hooks/useCatalog'
import { amountProblem, collect, requiredChoiceProblem } from '@/domain/form-rules'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency } from '@/utils/format'

export default function MyServicesPage() {
  const offers = useApiQuery(['vendor', 'services'], api.vendor.services)
  const [editing, setEditing] = useState<VendorServiceDto | 'new' | null>(null)
  const toggle = useApiMutation(
    (o: VendorServiceDto) => api.vendor.updateService(o.id, { active: !o.active }),
    {
      meta: { success: 'Saved.' },
    },
  )
  const remove = useApiMutation((id: number) => api.vendor.deleteService(id), {
    meta: { success: 'Service removed.' },
  })

  const columns: Column<VendorServiceDto>[] = [
    {
      key: 'name',
      header: 'Service',
      minWidth: 200,
      render: (o) => (
        <span className={shared.row} style={{ gap: 10 }}>
          {o.image ? (
            <img
              src={assetUrl(o.image)}
              alt=""
              width={36}
              height={36}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
          ) : (
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              {o.emoji}
            </span>
          )}
          <span>
            <strong>{o.name}</strong>
            <br />
            <span className={`${shared.muted} ${shared.small}`}>{o.category}</span>
          </span>
        </span>
      ),
    },
    { key: 'price', header: 'Price', align: 'right', render: (o) => formatCurrency(o.price) },
    {
      key: 'type',
      header: 'Pricing',
      render: (o) => <Badge tone="neutral">{o.isFixed ? 'Fixed price' : 'Starting price'}</Badge>,
    },
    {
      key: 'active',
      header: 'Visible to customers',
      render: (o) => (
        <Checkbox
          label={o.active ? 'Yes' : 'Hidden'}
          checked={o.active}
          disabled={toggle.isPending}
          onChange={() => toggle.mutate(o)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Edit ${o.name}`}
            onClick={() => setEditing(o)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Remove ${o.name}`}
            onClick={() => {
              if (window.confirm(`Remove ${o.name} from your services?`)) remove.mutate(o.id)
            }}
          >
            <Trash2 size={15} />
          </Button>
        </span>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="My services"
        description="The services you offer and the price you charge for each. Customers see them while your subscription is active."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" /> Add a service
          </Button>
        }
      />
      <QueryState isLoading={offers.isLoading} error={offers.error}>
        <Panel flush>
          {offers.data && offers.data.length === 0 ? (
            <EmptyState
              icon={Package}
              title="You have not listed any service"
              action={<Button onClick={() => setEditing('new')}>Add your first service</Button>}
            >
              Choose from the platform catalogue and set your own price.
            </EmptyState>
          ) : (
            <DataTable columns={columns} rows={offers.data ?? []} getRowId={(o) => String(o.id)} />
          )}
        </Panel>
      </QueryState>
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add a service' : 'Edit service'}
        onClose={() => setEditing(null)}
        wide
      >
        {editing !== null && (
          <OfferForm
            key={editing === 'new' ? 'new' : editing.id}
            editing={editing}
            existing={offers.data ?? []}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function OfferForm({
  editing,
  existing,
  onDone,
}: {
  editing: VendorServiceDto | 'new'
  existing: VendorServiceDto[]
  onDone: () => void
}) {
  const offer = editing === 'new' ? null : editing
  const catalogue = useServices()
  const [serviceItemId, setServiceItemId] = useState(String(offer?.serviceItemId ?? ''))
  const [price, setPrice] = useState(String(offer?.price ?? ''))
  const [description, setDescription] = useState(offer?.description ?? '')
  const [isFixed, setIsFixed] = useState(offer?.isFixed ?? true)
  const [active, setActive] = useState(offer?.active ?? true)
  const [image, setImage] = useState<string | null>(offer?.image ?? null)
  const [showErrors, setShowErrors] = useState(false)
  const errors = collect({
    serviceItemId: requiredChoiceProblem(serviceItemId, 'service'),
    price: amountProblem(price, 'price'),
  })

  const upload = useApiMutation((file: File) => api.uploads.image(file), {
    meta: { inline: true },
    onSuccess: setImage,
  })
  const save = useApiMutation(
    () => {
      const body: SaveVendorServiceRequest = {
        serviceItemId: Number(serviceItemId),
        price: Number(price),
        description,
        isFixed,
        active,
        image,
      }
      return offer ? api.vendor.updateService(offer.id, body) : api.vendor.addService(body)
    },
    { meta: { inline: true, success: 'Service saved.' }, onSuccess: onDone },
  )

  const taken = new Set(existing.map((o) => o.serviceItemId))
  const options = (catalogue.data ?? [])
    .filter((s) => offer?.serviceItemId === s.id || !taken.has(s.id))
    .map((s) => ({ value: String(s.id), label: `${s.emoji} ${s.name} (${s.category})` }))
  const chosen = catalogue.data?.find((s) => String(s.id) === serviceItemId)

  return (
    <form
      className={shared.stackTight}
      onSubmit={(event) => {
        event.preventDefault()
        if (Object.keys(errors).length > 0) return setShowErrors(true)
        save.mutate(undefined)
      }}
    >
      <Select
        label="Service"
        required
        placeholder="Choose from the catalogue"
        disabled={offer !== null}
        value={serviceItemId}
        onChange={(e) => setServiceItemId(e.target.value)}
        error={showErrors ? errors.serviceItemId : undefined}
        options={options}
      />
      <Input
        label="Your price (₹)"
        required
        type="number"
        min={1}
        step="1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={showErrors ? errors.price : undefined}
        hint={
          chosen
            ? `The platform's suggested price is ${formatCurrency(chosen.basePrice)}.`
            : undefined
        }
      />
      <Textarea
        label="Description"
        rows={3}
        maxLength={300}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="What you include, in a sentence or two."
      />
      <div className={shared.fieldGroup}>
        <span className={shared.fieldGroupLabel}>Photo</span>
        {image && (
          <img
            src={assetUrl(image)}
            alt=""
            height={80}
            style={{ width: 'auto', borderRadius: 8, alignSelf: 'flex-start' }}
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload.mutate(file)
          }}
        />
        {upload.isError && (
          <span role="alert" style={{ color: 'var(--color-danger)' }}>
            {upload.error.message}
          </span>
        )}
      </div>
      <div className={shared.row}>
        <Checkbox
          label="Fixed price (no extra charges)"
          checked={isFixed}
          onChange={(e) => setIsFixed(e.target.checked)}
        />
        <Checkbox
          label="Visible to customers"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
      </div>
      {save.isError && (
        <p role="alert" style={{ color: 'var(--color-danger)' }}>
          {save.error.message}
        </p>
      )}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          Save service
        </Button>
      </div>
    </form>
  )
}
