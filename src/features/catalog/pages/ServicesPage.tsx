import { Grid2x2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toolbar } from '@/components/layout/Toolbar'
import { Select, SearchInput } from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import shared from '@/styles/shared.module.css'
import { ServiceCard } from '../components/ServiceCard'
import { useCategories, useServices } from '../hooks/useCatalog'

export default function ServicesPage() {
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const q = useDebounce(term.trim(), 300)
  const categoryId = Number(params.get('category')) || undefined

  const categories = useCategories()
  const services = useServices({ q: q || undefined, categoryId })

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('category', value)
    else next.delete('category')
    setParams(next, { replace: true })
  }

  return (
    <div className={shared.stack}>
      <PageHeader
        title="All services"
        description="Compare providers and fixed prices, then book in a few taps."
      />
      <Toolbar>
        <SearchInput
          label="Search services"
          placeholder="Search by service or category"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <Select
          label="Category"
          placeholder="All categories"
          value={categoryId ? String(categoryId) : ''}
          onChange={(e) => setCategory(e.target.value)}
          options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
        />
      </Toolbar>
      <QueryState isLoading={services.isLoading} error={services.error}>
        {services.data && services.data.length === 0 ? (
          <EmptyState icon={Grid2x2} title="No services match your search">
            Try a different word or choose another category.
          </EmptyState>
        ) : (
          <div className={shared.grid3}>
            {services.data?.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
