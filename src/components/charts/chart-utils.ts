/** Round a maximum up to a "nice" axis bound (1, 2, 5 × 10ⁿ). */
export function niceCeil(max: number): number {
  if (max <= 0) return 1
  const exponent = 10 ** Math.floor(Math.log10(max))
  const fraction = max / exponent
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * exponent
}

export function buildTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i)
}

/** Axis bounds and ticks that snap to a round step and fit the data tightly. */
export function niceDomain(min: number, max: number, count = 4) {
  const step = niceCeil((max - min || max || 1) / count)
  const low = Math.floor(min / step) * step
  const high = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let tick = low; tick <= high + step / 2; tick += step) ticks.push(tick)
  return { low, high, ticks }
}

const trim = (value: number) => String(Number(value.toFixed(2)))

/** Rupee amounts in the Indian compact style: ₹45K, ₹1.2L, ₹3.5Cr. */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 10_000_000) return `${sign}₹${trim(abs / 10_000_000)}Cr`
  if (abs >= 100_000) return `${sign}₹${trim(abs / 100_000)}L`
  if (abs >= 1000) return `${sign}₹${trim(abs / 1000)}K`
  return `${sign}₹${trim(abs)}`
}
