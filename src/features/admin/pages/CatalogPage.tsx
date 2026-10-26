import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { assetUrl } from '@/api/http'
import type { CategoryDto, ServiceDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import { Alert, Badge, Button, Checkbox, DataTable, Input, Modal, Panel, SearchInput, Select, Tabs, Textarea } from '@/components/ui'
import type { Column } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatPercent } from '@/utils/format'

type Tab = 'services' | 'categories'

export default function CatalogPage() {
  const [tab, setTab] = useState<Tab>('services')
  const [term, setTerm] = useState('')
  const [editingService, setEditingService] = useState<ServiceDto | 'new' | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryDto | 'new' | null>(null)

  const categories = useApiQuery(['admin', 'categories'], api.admin.categories)
  const services = useApiQuery(['admin', 'services'], () => api.admin.services())
  const toggleService = useApiMutation((s: ServiceDto) => api.admin.updateService(s.id, { active: !s.active }), { meta: { success: 'Saved.' } })
  const toggleCategory = useApiMutation((c: CategoryDto) => api.admin.updateCategory(c.id, { name: c.name, active: !c.active }), { meta: { success: 'Saved.' } })

  const serviceColumns: Column<ServiceDto>[] = [
    { key: 'name', header: 'Service', minWidth: 190, render: (s) => <span><span aria-hidden="true">{s.emoji}</span> <strong>{s.name}</strong></span> },
    { key: 'category', header: 'Category', render: (s) => s.category },
    { key: 'price', header: 'Base price', align: 'right', render: (s) => formatCurrency(s.basePrice) },
    { key: 'commission', header: 'Commission', align: 'right', render: (s) => formatPercent(s.commission) },
    { key: 'providers', header: 'Providers', align: 'right', render: (s) => s.providers },
    { key: 'active', header: 'On', render: (s) => <Checkbox label={s.active ? 'Yes' : 'Off'} checked={s.active} disabled={toggleService.isPending} onChange={() => toggleService.mutate(s)} /> },
    { key: 'edit', header: '', align: 'right', render: (s) => <Button size="sm" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => setEditingService(s)}><Pencil size={15} /></Button> },
  ]
  const categoryColumns: Column<CategoryDto>[] = [
    {
      key: 'name',
      header: 'Category',
      minWidth: 200,
      render: (c) => (
        <span className={shared.row} style={{ gap: 10 }}>
          {c.image && <img src={assetUrl(c.image)} alt="" width={32} height={32} style={{ borderRadius: 6, objectFit: 'cover' }} />}
          <strong>{c.name}</strong>
        </span>
      ),
    },
    { key: 'description', header: 'Description', render: (c) => <span className={shared.muted}>{c.description}</span> },
    { key: 'count', header: 'Services', align: 'right', render: (c) => c.serviceCount },
    { key: 'active', header: 'On', render: (c) => <Checkbox label={c.active ? 'Yes' : 'Off'} checked={c.active} disabled={toggleCategory.isPending} onChange={() => toggleCategory.mutate(c)} /> },
    { key: 'edit', header: '', align: 'right', render: (c) => <Button size="sm" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setEditingCategory(c)}><Pencil size={15} /></Button> },
  ]

  const rows = (services.data ?? []).filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(term.trim().toLowerCase()))

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Categories & services"
        description="What customers can book. Switch an item off to hide it from the app."
        actions={
          tab === 'services' ? (
            <Button onClick={() => setEditingService('new')}><Plus size={16} aria-hidden="true" /> Add service</Button>
          ) : (
            <Button onClick={() => setEditingCategory('new')}><Plus size={16} aria-hidden="true" /> Add category</Button>
          )
        }
      />
      <Toolbar>
        <Tabs items={[{ id: 'services', label: 'Services' }, { id: 'categories', label: 'Categories' }]} active={tab} onChange={setTab} label="Catalogue" />
        {tab === 'services' && <SearchInput label="Search services" placeholder="Search services" value={term} onChange={(e) => setTerm(e.target.value)} />}
      </Toolbar>
      {tab === 'services' ? (
        <QueryState isLoading={services.isLoading} error={services.error}>
          <Panel flush><DataTable columns={serviceColumns} rows={rows} getRowId={(s) => String(s.id)} emptyMessage="No services found." /></Panel>
        </QueryState>
      ) : (
        <QueryState isLoading={categories.isLoading} error={categories.error}>
          <Panel flush><DataTable columns={categoryColumns} rows={categories.data ?? []} getRowId={(c) => String(c.id)} /></Panel>
        </QueryState>
      )}

      <Modal open={editingService !== null} title={editingService === 'new' ? 'Add a service' : 'Edit service'} onClose={() => setEditingService(null)}>
        {editingService !== null && <ServiceForm key={editingService === 'new' ? 'new' : editingService.id} editing={editingService} categories={categories.data ?? []} onDone={() => setEditingService(null)} />}
      </Modal>
      <Modal open={editingCategory !== null} title={editingCategory === 'new' ? 'Add a category' : 'Edit category'} onClose={() => setEditingCategory(null)}>
        {editingCategory !== null && <CategoryForm key={editingCategory === 'new' ? 'new' : editingCategory.id} editing={editingCategory} onDone={() => setEditingCategory(null)} />}
      </Modal>
    </div>
  )
}

function ServiceForm({ editing, categories, onDone }: { editing: ServiceDto | 'new'; categories: CategoryDto[]; onDone: () => void }) {
  const s = editing === 'new' ? null : editing
  const [categoryId, setCategoryId] = useState(String(s?.categoryId ?? ''))
  const [name, setName] = useState(s?.name ?? '')
  const [short, setShort] = useState(s?.short ?? '')
  const [emoji, setEmoji] = useState(s?.emoji ?? '🛠️')
  const [basePrice, setBasePrice] = useState(String(s?.basePrice ?? ''))
  const [commission, setCommission] = useState(String(s?.commission ?? ''))
  const [active, setActive] = useState(s?.active ?? true)
  const save = useApiMutation(
    () => {
      const body = { categoryId: Number(categoryId), name, short, emoji, basePrice: Number(basePrice), commission: commission === '' ? undefined : Number(commission), active }
      return s ? api.admin.updateService(s.id, body) : api.admin.addService(body)
    },
    { meta: { inline: true, success: 'Service saved.' }, onSuccess: onDone },
  )
  return (
    <form className={shared.stackTight} onSubmit={(e) => { e.preventDefault(); save.mutate(undefined) }}>
      <Select label="Category" required placeholder="Choose a category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
      <div className={shared.formGrid}>
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Input label="Icon (emoji)" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} />
      </div>
      <Input label="Short description" value={short} onChange={(e) => setShort(e.target.value)} maxLength={120} />
      <div className={shared.formGrid}>
        <Input label="Base price (₹)" required type="number" min={1} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
        <Input label="Commission (%)" type="number" min={0} max={100} step="0.5" hint="Leave empty to use the default." value={commission} onChange={(e) => setCommission(e.target.value)} />
      </div>
      <Checkbox label="Visible to customers" checked={active} onChange={(e) => setActive(e.target.checked)} />
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={save.isPending} disabled={!categoryId || name.trim().length < 2 || !(Number(basePrice) > 0)}>Save service</Button>
      </div>
    </form>
  )
}

function CategoryForm({ editing, onDone }: { editing: CategoryDto | 'new'; onDone: () => void }) {
  const c = editing === 'new' ? null : editing
  const [name, setName] = useState(c?.name ?? '')
  const [description, setDescription] = useState(c?.description ?? '')
  const [image, setImage] = useState<string | null>(c?.image ?? null)
  const [active, setActive] = useState(c?.active ?? true)
  const upload = useApiMutation((file: File) => api.uploads.image(file), { meta: { inline: true }, onSuccess: setImage })
  const save = useApiMutation(
    () => {
      const body = { name, description, image, active }
      return c ? api.admin.updateCategory(c.id, body) : api.admin.addCategory(body)
    },
    { meta: { inline: true, success: 'Category saved.' }, onSuccess: onDone },
  )
  return (
    <form className={shared.stackTight} onSubmit={(e) => { e.preventDefault(); save.mutate(undefined) }}>
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      <div className={shared.fieldGroup}>
        <span className={shared.fieldGroupLabel}>Image</span>
        {image && <img src={assetUrl(image)} alt="" height={70} style={{ width: 'auto', borderRadius: 8, alignSelf: 'flex-start' }} />}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f) }} />
        {upload.isError && <Badge tone="danger">{upload.error.message}</Badge>}
      </div>
      <Checkbox label="Visible to customers" checked={active} onChange={(e) => setActive(e.target.checked)} />
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={save.isPending} disabled={name.trim().length < 2}>Save category</Button>
      </div>
    </form>
  )
}
