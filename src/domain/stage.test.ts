import { describe, expect, it } from 'vitest'
import { canCancel, canReschedule, isOpen, stageTone } from './stage'

describe('booking stages', () => {
  it('treats completed, cancelled and rejected bookings as closed', () => {
    expect(isOpen('Requested')).toBe(true)
    expect(isOpen('InProgress')).toBe(true)
    expect(isOpen('Completed')).toBe(false)
    expect(canCancel('Cancelled')).toBe(false)
  })

  it('lets a customer reschedule only until the job starts', () => {
    expect(canReschedule('Assigned')).toBe(true)
    expect(canReschedule('InProgress')).toBe(false)
  })

  it('colours failures red and completion green', () => {
    expect(stageTone('Rejected')).toBe('danger')
    expect(stageTone('Completed')).toBe('success')
  })
})
