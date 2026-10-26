import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ServiceDto } from '@/api/types'
import { servicePath } from '@/config/routes'
import { formatCurrency } from '@/utils/format'
import styles from './ServiceCard.module.css'

export function ServiceCard({ service }: { service: ServiceDto }) {
  return (
    <Link to={servicePath(service.id)} className={styles.card}>
      <div className={styles.top}>
        <span className={styles.emoji} aria-hidden="true">
          {service.emoji}
        </span>
        <div>
          <p className={styles.name}>{service.name}</p>
          <p className={styles.category}>{service.category}</p>
        </div>
      </div>
      <p className={styles.short}>{service.short}</p>
      <div className={styles.foot}>
        <span>
          From <span className={styles.price}>{formatCurrency(service.minPrice)}</span>
        </span>
        {service.reviews > 0 ? (
          <span className={styles.rating}>
            <Star size={14} fill="currentColor" aria-hidden="true" /> {service.rating.toFixed(1)}
            <span className={styles.muted}> ({service.reviews})</span>
          </span>
        ) : (
          <span className={styles.muted}>{service.providers} providers</span>
        )}
      </div>
    </Link>
  )
}
