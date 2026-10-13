import { create } from 'zustand'
import type { Notification } from '../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number

  setNotifications: (n: Notification[]) => void
  markRead: (id: number) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),

  markRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
    )
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.is_read).length,
    })
  },

  markAllRead: () => {
    const now = new Date().toISOString()
    const updated = get().notifications.map((n) => ({
      ...n,
      is_read: true,
      read_at: now,
    }))
    set({ notifications: updated, unreadCount: 0 })
  },
}))
