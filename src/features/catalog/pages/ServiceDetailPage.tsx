import { ArrowLeft, Check, Clock, ShieldCheck, Star, UserCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ProviderDto, ServiceDto } from '@/api/types'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, DataTable, Panel } from '@/components/ui'
import type { Column } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useCartStore } from '@/features/cart/store/cart.store'
import { toast } from '@/store/toast.store'
import shared from '@/styles/shared.module.css'
import { formatCurrency } from '@/utils/format'
import { useContent, useProviders, useServices } from '../hooks/useCatalog'

const FEATURE_ICONS = [Clock, UserCheck, ShieldCheck]

export default function ServiceDetailPage() {
  const { serviceId } = useParams()
  const id = Number(serviceId)
  const navigate = useNavigate()
  const add = useCartStore((state) => state.add)
  const content = useContent()

  const services = useServices()
  const providers = useProviders(id)
  const service = services.data?.find((s) => s.id === id)

  const addToCart = (provider: ProviderDto | null, then: 'stay' | 'checkout') => {
    if (!service) return
    add({
      serviceItemId: service.id,
      vendorServiceId: provider?.vendorServiceId,
      serviceName: service.name,
      emoji: service.emoji,
      providerName: provider?.name ?? 'Any available technician',
      price: provider?.price ?? service.basePrice,
    })
    if (then === 'checkout') navigate(ROUTES.cart)
    else toast.success(`${service.name} added to your cart.`)
  }

  const columns: Column<ProviderDto | null>[] = [
    {
      key: 'name',
      header: 'Provider',
      render: (p) => (
        <span>
          <span aria-hidden="true">{p?.emoji ?? '🛠️'}</span> <strong>{p?.name ?? 'Any available technician'}</strong>
          {!p && <span className={shared.muted}> (an open job any technician can take)</span>}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (p) =>
        p && p.reviews > 0 ? (
          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
            <Star size={13} fill="currentColor" aria-hidden="true" /> {p.rating.toFixed(1)}{' '}
            <span className={shared.muted}>({p.reviews})</span>
          </span>
        ) : (
          <span className={shared.muted}>New</span>
        ),
    },
    { key: 'distance', header: 'Distance', render: (p) => (p ? `${p.distanceKm.toFixed(1)} km` : '-') },
    { key: 'price', header: 'Price', align: 'right', render: (p) => <strong>{formatCurrency(p?.price ?? service?.basePrice ?? 0)}</strong> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className={shared.row} style={{ justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => addToCart(p, 'stay')}>
            Add to cart
          </Button>
          <Button size="sm" onClick={() => addToCart(p, 'checkout')}>
            Book now
          </Button>
        </span>
      ),
    },
  ]

  const rows: (ProviderDto | null)[] = [...(providers.data ?? []), null]

  return (
    <div className={shared.stack}>
      <Link to={ROUTES.services} className={shared.link}>
        <ArrowLeft size={14} aria-hidden="true" /> All services
      </Link>
      <QueryState isLoading={services.isLoading} error={services.error}>
        {service ? (
          <>
            <ServiceHeader service={service} />
            <div className={shared.grid3}>
              {content.list('feature').map((f, index) => {
                const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]!
                return (
                  <div key={f.id} className={shared.callout} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Icon size={22} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                    <strong style={{ whiteSpace: 'pre-line' }}>{f.title}</strong>
                  </div>
                )
              })}
            </div>
            {service.includes.length > 0 && (
              <Panel title="What is included">
                <ul className={shared.list}>
                  {service.includes.map((item) => (
                    <li key={item} className={shared.row} style={{ gap: 8 }}>
                      <Check size={16} style={{ color: 'var(--color-success)' }} aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <Panel title="Choose a provider" subtitle="Each provider sets their own price. Their ratings come from completed jobs." flush>
              <QueryState isLoading={providers.isLoading} error={providers.error}>
                <DataTable columns={columns} rows={rows} getRowId={(p) => String(p?.vendorServiceId ?? 'open')} />
              </QueryState>
            </Panel>
          </>
        ) : (
          <Panel>That service is not available right now.</Panel>
        )}
      </QueryState>
    </div>
  )
}

function ServiceHeader({ service }: { service: ServiceDto }) {
  return (
    <PageHeader
      title={`${service.emoji} ${service.name}`}
      description={service.short}
      actions={
        <span className={shared.row}>
          <Badge tone="info">{service.category}</Badge>
          <Badge tone="neutral">From {formatCurrency(service.minPrice)}</Badge>
        </span>
      }
    />
  )
}
