import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  /** Desktop: sidebar shrinks to an icon rail. */
  sidebarCollapsed: boolean
  /** Mobile: sidebar slides over the content. Not persisted. */
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'sahjog-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
