import clsx from 'clsx'
import { Children } from 'react'
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
  const count = Children.count(children)
  const variantClass =
    variant === 'stats' && count === 3
      ? styles.statsThree
      : variant === 'stats' && count === 6
        ? styles.statsSix
        : styles[variant.replace('-', '')]
  return <div className={clsx(styles.grid, variantClass)}>{children}</div>
}
