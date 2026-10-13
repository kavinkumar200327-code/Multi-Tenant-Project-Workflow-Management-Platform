import api from './axios'
import type { Notification } from '../types'

export const notificationsApi = {
  list: (organizationId?: number | null, unreadOnly?: boolean) =>
    api
      .get<Notification[]>('/notifications/', {
        params: {
          ...(organizationId ? { organization_id: organizationId } : {}),
          ...(unreadOnly ? { unread_only: true } : {}),
        },
      })
      .then((r) => r.data),

  markRead: (notificationId: number) =>
    api
      .patch<Notification>(`/notifications/${notificationId}/read`)
      .then((r) => r.data),

  markAllRead: (organizationId?: number | null) =>
    api
      .patch('/notifications/read-all', null, {
        params: organizationId ? { organization_id: organizationId } : undefined,
      })
      .then((r) => r.data),
}
