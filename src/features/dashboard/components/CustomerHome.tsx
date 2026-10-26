import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { QueryState } from '@/components/feedback/QueryState'
import { Button, DataTable, Panel } from '@/components/ui'
import type { Column } from '@/components/ui'
import type { BookingDto } from '@/api/types'
import { bookingPath, ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { StageBadge } from '@/features/bookings/components/StageBadge'
import { ServiceCard } from '@/features/catalog/components/ServiceCard'
import { fill, useCategories, useContent, useServices, useSettings } from '@/features/catalog/hooks/useCatalog'
import { isOpen } from '@/domain/stage'
import type { BookingStage } from '@/domain/types'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'
import { formatCurrency, formatDate } from '@/utils/format'
import styles from './CustomerHome.module.css'

export function CustomerHome() {
  const user = useAuthStore((state) => state.user)!
  const content = useContent()
  const categories = useCategories()
  const services = useServices()
  const settings = useSettings()
  const bookings = useApiQuery(['bookings'], api.bookings.list)

  const banner = content.row('banner', 'main')
  const popular = [...(services.data ?? [])].sort((a, b) => b.providers - a.providers || b.reviews - a.reviews).slice(0, 6)
  const upcoming = (bookings.data ?? []).filter((b) => isOpen(b.stage as BookingStage)).slice(0, 4)
  const firstName = user.name.split(' ')[0] ?? user.name
  const offer = content.row('offer', 'first')
  const showOffer = settings.data?.features.coupon && settings.data.couponCode

  const columns: Column<BookingDto>[] = [
    { key: 'id', header: 'Booking', render: (b) => <Link to={bookingPath(b.id)} className={shared.mono}>{b.id}</Link> },
    { key: 'service', header: 'Service', render: (b) => `${b.emoji} ${b.service}` },
    { key: 'when', header: 'When', render: (b) => <span className={shared.nowrap}>{formatDate(b.date)}, {b.time}</span> },
    { key: 'stage', header: 'Status', render: (b) => <StageBadge stage={b.stage} /> },
  ]

  return (
    <div className={shared.stack}>
      <section className={styles.hero}>
        <div>
          <p className={styles.greeting}>{fill(content.text('app', 'greeting', 'Hello, {name}'), { name: firstName })}</p>
          <h1 className={styles.heroTitle} style={{ whiteSpace: 'pre-line' }}>
            {banner?.title ?? content.text('app', 'tagline', 'Trusted professionals for every job at home')}
          </h1>
          <p className={styles.heroText}>{banner?.text || content.text('app', 'ask')}</p>
          <Link to={ROUTES.services}>
            <Button variant="secondary">{content.text('banner', 'button', 'Book a service')}</Button>
          </Link>
        </div>
        {showOffer && offer && (
          <div className={styles.offer}>
            <strong>{fill(offer.title, { amount: formatCurrency(settings.data!.couponAmount) })}</strong>
            <span>{offer.text.replace(/Tap the code to copy\.?/i, '').trim()}</span>
            <code className={styles.code}>{settings.data!.couponCode}</code>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <Panel title="Your upcoming bookings" actions={<Link to={ROUTES.bookings}>View all <ArrowRight size={13} aria-hidden="true" /></Link>} flush>
          <DataTable columns={columns} rows={upcoming} getRowId={(b) => b.id} />
        </Panel>
      )}

      <section>
        <h2 className={styles.sectionTitle}>{content.text('app', 'ask', 'What do you need help with today?')}</h2>
        <QueryState isLoading={categories.isLoading} error={categories.error}>
          <div className={styles.categories}>
            {categories.data?.filter((c) => c.active).map((c) => (
              <Link key={c.id} to={`${ROUTES.services}?category=${c.id}`} className={styles.category}>
                <strong>{c.name}</strong>
                <span>{c.description}</span>
                <span className={styles.count}>{c.serviceCount} services</span>
              </Link>
            ))}
          </div>
        </QueryState>
      </section>

      <section>
        <div className={shared.spread}>
          <h2 className={styles.sectionTitle}>{content.text('app', 'popular-title', 'Popular services')}</h2>
          <Link to={ROUTES.services}>See all services <ArrowRight size={13} aria-hidden="true" /></Link>
        </div>
        <QueryState isLoading={services.isLoading} error={services.error}>
          <div className={shared.grid3}>{popular.map((s) => <ServiceCard key={s.id} service={s} />)}</div>
        </QueryState>
      </section>

      <div className={shared.grid2}>
        <Panel title={content.text('app', 'why-title', 'Why Sahjog')}>
          <ul className={shared.list}>
            {content.list('why').map((w) => (
              <li key={w.id}>
                <strong>{w.title}</strong> <span className={shared.muted}>· {w.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={content.text('app', 'how-title', 'How it works')}>
          <ol className={shared.list}>
            {content.list('how').map((h, index) => (
              <li key={h.id}>
                <strong>{index + 1}. {h.title}</strong>
                <br />
                <span className={shared.muted}>{h.text}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
