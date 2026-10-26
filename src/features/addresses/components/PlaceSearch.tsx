import { LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { Button, Input } from '@/components/ui'
import { useApiMutation, useApiQuery } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from '@/store/toast.store'
import styles from './PlaceSearch.module.css'

export interface PlaceSearchProps {
  /** Called with the full address of the place the person picked or located. */
  onPick: (address: string) => void
}

/**
 * Address search: suggestions come from the API (Google Places, or a built-in list of localities while the
 * server has no Google key), and "Use my location" turns the browser's position into an address.
 */
export function PlaceSearch({ onPick }: PlaceSearchProps) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const query = useDebounce(term.trim(), 350)
  const suggestions = useApiQuery(['places', query], () => api.places.search(query), {
    enabled: query.length >= 3,
    staleTime: 60_000,
  })

  const details = useApiMutation((placeId: string) => api.places.details(placeId), {
    onSuccess: (place) => {
      onPick(place.address)
      setTerm('')
      setOpen(false)
    },
  })
  const locate = useApiMutation(
    (pos: { lat: number; lng: number }) => api.places.reverse(pos.lat, pos.lng),
    {
      onSuccess: (place) => onPick(place.address),
    },
  )

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Your browser cannot share its location.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        locate.mutate({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () =>
        toast.error('Allow location access in your browser, or search for your address instead.'),
      { timeout: 10_000 },
    )
  }

  const items = suggestions.data ?? []

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <Input
          label="Search for your address"
          placeholder="Type an area, landmark or street (3+ letters)"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
          }}
          autoComplete="off"
        />
        <Button variant="secondary" onClick={useMyLocation} loading={locate.isPending}>
          <LocateFixed size={16} aria-hidden="true" /> Use my location
        </Button>
      </div>
      {open && query.length >= 3 && items.length > 0 && (
        <ul className={styles.list} role="listbox">
          {items.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className={styles.option}
                onClick={() => details.mutate(s.placeId)}
                disabled={details.isPending}
              >
                <span className={styles.title}>{s.title}</span>
                <span className={styles.subtitle}>{s.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
