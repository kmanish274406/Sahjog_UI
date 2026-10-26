import { useEffect } from 'react'
import { env } from '@/config/env'
import { toast } from '@/store/toast.store'
import { signOut } from '../utils/session'

const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

/**
 * Signs the person out after `minutes` without a click, key press or scroll, the same limit the API puts on
 * a refresh token. A hidden tab is judged by the clock, not by timers, because browsers slow those down.
 */
export function useIdleLogout(minutes: number = env.idleLogoutMinutes) {
  useEffect(() => {
    const limit = minutes * 60_000
    let lastActive = Date.now()
    const touch = () => {
      lastActive = Date.now()
    }
    const check = () => {
      if (Date.now() - lastActive < limit) return
      toast.info(`You were signed out after ${minutes} minutes of inactivity.`)
      signOut()
    }

    for (const name of EVENTS) window.addEventListener(name, touch, { passive: true })
    document.addEventListener('visibilitychange', check)
    const timer = window.setInterval(check, 15_000)
    return () => {
      for (const name of EVENTS) window.removeEventListener(name, touch)
      document.removeEventListener('visibilitychange', check)
      window.clearInterval(timer)
    }
  }, [minutes])
}
