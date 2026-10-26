import { useState } from 'react'
import type { MouseEvent } from 'react'
import { formatCompactCurrency, niceDomain } from './chart-utils'
import styles from './Charts.module.css'

export interface LineSeries {
  name: string
  color: string
  values: number[]
  dashed?: boolean
}

export interface LineChartProps {
  categories: string[]
  series: LineSeries[]
  ariaLabel: string
  formatValue?: (value: number) => string
}

const WIDTH = 600
const HEIGHT = 280
const MARGIN = { top: 12, right: 16, bottom: 28, left: 52 }

export function LineChart({
  categories,
  series,
  ariaLabel,
  formatValue = formatCompactCurrency,
}: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const allValues = series.flatMap((s) => s.values)
  // Lines encode position, not length, so the axis may start above zero to show the gap between series.
  const { low, high, ticks } = niceDomain(Math.min(...allValues), Math.max(...allValues))
  const stepX = plotWidth / Math.max(1, categories.length - 1)

  const x = (index: number) => MARGIN.left + index * stepX
  const y = (value: number) => MARGIN.top + plotHeight - ((value - low) / (high - low)) * plotHeight

  const linePath = (values: number[]) =>
    values.map((value, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(value)}`).join(' ')

  // An area fill implies a zero baseline, so it is only drawn when the axis starts at zero.
  const primary = low === 0 ? series[0] : undefined
  const areaPath = primary
    ? `${linePath(primary.values)} L${x(primary.values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
    : ''

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const index = Math.round((svgX - MARGIN.left) / stepX)
    setHovered(Math.min(categories.length - 1, Math.max(0, index)))
  }

  return (
    <div className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={styles.gridLine}
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className={styles.axisText} x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {categories.map((category, i) => (
          <text
            key={category}
            className={styles.axisText}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor="middle"
          >
            {category}
          </text>
        ))}

        {primary && <path d={areaPath} fill={primary.color} opacity={0.08} />}

        {series.map((s) => (
          <path
            key={s.name}
            d={linePath(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
          />
        ))}

        {hovered !== null && (
          <g>
            <line
              x1={x(hovered)}
              x2={x(hovered)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
              stroke="var(--color-border-strong)"
            />
            {series.map((s) => (
              <circle
                key={s.name}
                cx={x(hovered)}
                cy={y(s.values[hovered]!)}
                r={5}
                fill={s.color}
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>

      {hovered !== null && (
        <div className={styles.tooltip} style={{ left: `${(x(hovered) / WIDTH) * 100}%` }}>
          <div className={styles.tooltipTitle}>{categories[hovered]}</div>
          {series.map((s) => (
            <div key={s.name} className={styles.tooltipRow}>
              <span className={styles.tooltipName}>
                <span className={styles.dot} style={{ background: s.color }} />
                {s.name}
              </span>
              <strong>{formatValue(s.values[hovered]!)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
