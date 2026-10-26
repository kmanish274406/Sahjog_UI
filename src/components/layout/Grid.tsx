import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './Grid.module.css'

export interface GridProps {
  /**
   * stats      – responsive row of KPI cards
   * two        – two equal columns
   * main-side  – wide main column with a narrower side column
   * three      – three equal columns
   */
  variant: 'stats' | 'two' | 'main-side' | 'three'
  children: ReactNode
}

export function Grid({ variant, children }: GridProps) {
  return <div className={clsx(styles.grid, styles[variant.replace('-', '')])}>{children}</div>
}
