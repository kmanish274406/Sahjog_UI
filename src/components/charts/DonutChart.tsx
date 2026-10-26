import { useState } from 'react'
import styles from './Charts.module.css'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  slices: DonutSlice[]
  centerLabel: string
  centerCaption: string
  ariaLabel: string
  formatValue?: (value: number) => string
}

const SIZE = 168
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

export function DonutChart({
  slices,
  centerLabel,
  centerCaption,
  ariaLabel,
  formatValue = String,
}: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  const arcs = slices.map((slice, index) => {
    const before = slices.slice(0, index).reduce((sum, s) => sum + s.value, 0)
    return {
      slice,
      length: (slice.value / total) * CIRCUMFERENCE,
      offset: (before / total) * CIRCUMFERENCE,
    }
  })

  return (
    <div className={styles.donut}>
      <svg
        className={styles.donutSvg}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={ariaLabel}
      >
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map(({ slice, length, offset: start }, index) => (
            <circle
              key={slice.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(0, length - GAP)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-start}
              opacity={active === null || active === index ? 1 : 0.35}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </g>
        <text className={styles.donutTotal} x="50%" y="48%" textAnchor="middle">
          {centerLabel}
        </text>
        <text className={styles.donutCaption} x="50%" y="62%" textAnchor="middle">
          {centerCaption}
        </text>
      </svg>

      <ul className={styles.donutList}>
        {slices.map((slice, index) => (
          <li
            key={slice.label}
            className={styles.donutRow}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            <span className={styles.donutLabel}>
              <span className={styles.legendSwatch} style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className={styles.donutValue}>
              {formatValue(slice.value)}
              <span className={styles.donutPercent}>
                {Math.round((slice.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
