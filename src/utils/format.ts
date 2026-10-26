const TIME_ZONE = 'Asia/Kolkata'

// Indian digit grouping: ₹1,00,000. Whole rupees unless there are paise to show.
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}%`

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: TIME_ZONE,
})

/**
 * The API sends a booking's day as a calendar date at midnight (no zone). Showing it through UTC keeps it
 * on the same day whatever zone the browser is in.
 */
export function formatDate(value: string | Date): string {
  const text = typeof value === 'string' ? value : value.toISOString()
  const day = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
  return dateFormatter.format(new Date(day))
}

/** Moments (created, paid, notified) are UTC timestamps; shown in India time. */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(toDate(value))
}

/** The server writes UTC times without a "Z"; read them as UTC. */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
}

/** "just now", "12 min ago", "3 hr ago", "Yesterday", otherwise the date. */
export function formatRelativeTime(value: string | Date, now = Date.now()): string {
  const minutes = Math.floor((now - toDate(value).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  if (hours < 48) return 'Yesterday'
  return formatDate(toDate(value))
}

/** A date as the API's booking calendar day: 2026-10-27. */
export function toIsoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "Mr. Ramesh Gupta" -> "RG" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
