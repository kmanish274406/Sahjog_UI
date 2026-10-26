import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import type { ContentDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import {
  Alert,
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
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { PERMISSIONS } from '@/config/permissions'
import { Can } from '@/hooks/usePermission'
import shared from '@/styles/shared.module.css'

const SECTION_LABELS: Record<string, string> = {
  app: 'App texts',
  banner: 'Home banners',
  feature: 'Service promises',
  offer: 'Offer line',
  why: 'Why Sahjog',
  how: 'How it works',
  slot: 'Time slots',
  payment: 'Payment methods',
  'plan-vendor': 'Vendor plan features',
  'plan-technician': 'Technician plan features',
}

export default function ContentPage() {
  const rows = useApiQuery(['admin', 'content'], api.admin.content)
  const [section, setSection] = useState('')
  const [editing, setEditing] = useState<ContentDto | 'new' | null>(null)
  const toggle = useApiMutation(
    (c: ContentDto) => api.admin.updateContent(c.id, { active: !c.active }),
    { meta: { success: 'Saved.' } },
  )
  const remove = useApiMutation((id: number) => api.admin.deleteContent(id), {
    meta: { success: 'Text removed.' },
  })

  const sections = [...new Set((rows.data ?? []).map((r) => r.section))]
  const shown = (rows.data ?? []).filter((r) => !section || r.section === section)

  const columns: Column<ContentDto>[] = [
    {
      key: 'section',
      header: 'Section',
      render: (c) => <Badge tone="info">{SECTION_LABELS[c.section] ?? c.section}</Badge>,
    },
    { key: 'code', header: 'Code', render: (c) => <span className={shared.mono}>{c.code}</span> },
    {
      key: 'title',
      header: 'Text',
      minWidth: 200,
      render: (c) => <span style={{ whiteSpace: 'pre-line' }}>{c.title}</span>,
    },
    {
      key: 'text',
      header: 'Detail',
      render: (c) => <span className={shared.muted}>{c.text}</span>,
    },
    {
      key: 'active',
      header: 'Shown',
      render: (c) => (
        <Checkbox
          label={c.active ? 'Yes' : 'Off'}
          checked={c.active}
          disabled={toggle.isPending}
          onChange={() => toggle.mutate(c)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Can permission={PERMISSIONS.contentEdit}>
            <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(c)}>
              <Pencil size={15} />
            </Button>
          </Can>
          <Can permission={PERMISSIONS.contentDelete}>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Delete"
              onClick={() => {
                if (window.confirm('Remove this text from the apps?')) remove.mutate(c.id)
              }}
            >
              <Trash2 size={15} />
            </Button>
          </Can>
        </span>
      ),
    },
  ]

  return (
    <div className={shared.stack}>
      <PageHeader
        title="App texts & slots"
        description="Everything customers read in the apps comes from here: the greeting, banners, time slots and payment labels."
        actions={
          <Can permission={PERMISSIONS.contentAdd}>
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden="true" /> Add text
            </Button>
          </Can>
        }
      />
      <Toolbar>
        <Select
          label="Section"
          placeholder="All sections"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          options={sections.map((s) => ({ value: s, label: SECTION_LABELS[s] ?? s }))}
        />
      </Toolbar>
      <QueryState isLoading={rows.isLoading} error={rows.error}>
        <Panel flush>
          <DataTable columns={columns} rows={shown} getRowId={(c) => String(c.id)} />
        </Panel>
      </QueryState>
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add text' : 'Edit text'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ContentForm
            key={editing === 'new' ? 'new' : editing.id}
            editing={editing}
            sections={sections}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function ContentForm({
  editing,
  sections,
  onDone,
}: {
  editing: ContentDto | 'new'
  sections: string[]
  onDone: () => void
}) {
  const c = editing === 'new' ? null : editing
  const [section, setSection] = useState(c?.section ?? sections[0] ?? 'app')
  const [code, setCode] = useState(c?.code ?? '')
  const [title, setTitle] = useState(c?.title ?? '')
  const [text, setText] = useState(c?.text ?? '')
  const [icon, setIcon] = useState(c?.icon ?? '')
  const [sortOrder, setSortOrder] = useState(String(c?.sortOrder ?? ''))
  const [active, setActive] = useState(c?.active ?? true)
  const save = useApiMutation(
    () => {
      const body = {
        section,
        code,
        title,
        text,
        icon,
        sortOrder: sortOrder === '' ? undefined : Number(sortOrder),
        active,
      }
      return c ? api.admin.updateContent(c.id, body) : api.admin.addContent(body)
    },
    { meta: { inline: true, success: 'Text saved.' }, onSuccess: onDone },
  )
  return (
    <form
      className={shared.stackTight}
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined)
      }}
    >
      <div className={shared.formGrid}>
        <Select
          label="Section"
          required
          value={section}
          onChange={(e) => setSection(e.target.value)}
          options={[...new Set([...sections, section])].map((s) => ({
            value: s,
            label: SECTION_LABELS[s] ?? s,
          }))}
        />
        <Input
          label="Code"
          required
          hint="What the app looks the text up by."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={60}
        />
      </div>
      <Textarea
        label="Text"
        required
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={500}
        hint="Use {name}, {amount} or {balance} where the app fills a value in."
      />
      <Input
        label="Detail"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
      />
      <div className={shared.formGrid}>
        <Input
          label="Icon name"
          hint="For example Shield, Clock or Wallet."
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={60}
        />
        <Input
          label="Order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>
      <Checkbox
        label="Shown in the apps"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
      />
      {save.isError && <Alert tone="danger">{save.error.message}</Alert>}
      <div className={shared.formActions}>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!code.trim() || !title.trim()}>
          Save text
        </Button>
      </div>
    </form>
  )
}
