import styles from './Avatar.module.css'

const TONES = ['#1d3557', '#2f6aa3', '#2a7d74', '#8a3a66', '#a66a2a', '#4a5568']

function hash(value: string): number {
  let total = 0
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) >>> 0
  return total
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export interface AvatarProps {
  name: string
  size?: number
  /** A picture to show instead of the initials. */
  src?: string
}

export function Avatar({ name, size = 32, src }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={styles.avatar}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    )
  }
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: TONES[hash(name) % TONES.length],
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
