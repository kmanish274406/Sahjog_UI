import { useState } from 'react'
import { buildTicks, formatCompactCurrency, niceCeil } from './chart-utils'
import type { LineSeries } from './LineChart'
import styles from './Charts.module.css'

export type BarSeries = Omit<LineSeries, 'dashed'>

export interface BarChartProps {
  categories: string[]
  series: BarSeries[]
  ariaLabel: string
  formatValue?: (value: number) => string
}

const WIDTH = 600
const HEIGHT = 280
const MARGIN = { top: 12, right: 16, bottom: 28, left: 52 }
const BAR_GAP = 2

export function BarChart({
  categories,
  series,
  ariaLabel,
  formatValue = formatCompactCurrency,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const max = niceCeil(Math.max(...series.flatMap((s) => s.values)))
  const groupWidth = plotWidth / categories.length
  const barWidth = Math.min(28, (groupWidth * 0.6) / series.length - BAR_GAP)
  const clusterWidth = series.length * barWidth + (series.length - 1) * BAR_GAP

  const y = (value: number) => MARGIN.top + plotHeight - (value / max) * plotHeight

  return (
    <div className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHovered(null)}
      >
        {buildTicks(max).map((tick) => (
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

        {categories.map((category, groupIndex) => {
          const groupX = MARGIN.left + groupIndex * groupWidth
          const clusterX = groupX + (groupWidth - clusterWidth) / 2
          return (
            <g key={category} onMouseEnter={() => setHovered(groupIndex)}>
              <rect
                x={groupX}
                y={MARGIN.top}
                width={groupWidth}
                height={plotHeight}
                fill={hovered === groupIndex ? 'var(--color-primary-soft)' : 'transparent'}
                opacity={0.5}
              />
              {series.map((s, seriesIndex) => {
                const value = s.values[groupIndex]!
                return (
                  <rect
                    key={s.name}
                    x={clusterX + seriesIndex * (barWidth + BAR_GAP)}
                    y={y(value)}
                    width={barWidth}
                    height={MARGIN.top + plotHeight - y(value)}
                    rx={3}
                    fill={s.color}
                  />
                )
              })}
              <text
                className={styles.axisText}
                x={groupX + groupWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
              >
                {category}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered !== null && (
        <div
          className={styles.tooltip}
          style={{ left: `${((MARGIN.left + (hovered + 0.5) * groupWidth) / WIDTH) * 100}%` }}
        >
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
