import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toIsoDay } from '@/utils/format'

/** One service in the cart. Each item becomes its own booking at checkout, with its own day and time. */
export interface CartItem {
  id: string
  serviceItemId: number
  /** The provider's offer; empty for an open job that any technician can take. */
  vendorServiceId?: number
  serviceName: string
  emoji: string
  providerName: string
  price: number
  qty: number
  /** Calendar day, 2026-10-27. */
  date: string
  time: string
  notes: string
}

export type NewCartItem = Omit<CartItem, 'id' | 'qty' | 'date' | 'time' | 'notes'> &
  Partial<Pick<CartItem, 'qty' | 'date' | 'time' | 'notes'>>

interface CartState {
  items: CartItem[]
  add: (item: NewCartItem) => void
  update: (id: string, patch: Partial<Pick<CartItem, 'qty' | 'date' | 'time' | 'notes'>>) => void
  remove: (id: string) => void
  clear: () => void
}

let counter = 0

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          // The same service from the same provider is one line: adding it again adds a unit.
          const same = state.items.find(
            (i) =>
              i.serviceItemId === item.serviceItemId && i.vendorServiceId === item.vendorServiceId,
          )
          if (same) {
            return {
              items: state.items.map((i) =>
                i === same ? { ...i, qty: Math.min(5, i.qty + (item.qty ?? 1)) } : i,
              ),
            }
          }
          const entry: CartItem = {
            ...item,
            id: `${Date.now()}-${counter++}`,
            qty: item.qty ?? 1,
            date: item.date ?? toIsoDay(new Date()),
            time: item.time ?? '',
            notes: item.notes ?? '',
          }
          return { items: [...state.items, entry] }
        }),
      update: (id, patch) =>
        set((state) => ({ items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'sahjog-cart' },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((total, item) => total + item.qty, 0)
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.price * item.qty, 0)
