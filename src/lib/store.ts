import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Activity {
  id: string
  action_type: string
  action_title: string
  created_at: string
}

interface UIState {
  isNotificationOpen: boolean
  setNotificationOpen: (open: boolean) => void
  notifications: Activity[]
  addNotification: (activity: Activity) => void
  setNotifications: (activities: Activity[]) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isNotificationOpen: false,
      setNotificationOpen: (open) => set({ isNotificationOpen: open }),
      notifications: [],
      addNotification: (activity) => 
        set((state) => ({ 
          notifications: [activity, ...state.notifications].slice(0, 10) 
        })),
      setNotifications: (activities) => set({ notifications: activities }),
    }),
    {
      name: 'sanctuary-ui-storage',
    }
  )
)
