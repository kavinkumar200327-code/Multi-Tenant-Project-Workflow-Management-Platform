import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Check, Clock, Tag } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import type { Notification } from '../types'
import { EmptyState } from '../components/common/EmptyState'
import { Spinner } from '../components/common/Spinner'
import { Modal } from '../components/common/Modal'

const TYPE_ICONS: Record<string, string> = {
  organization_created: '🏢',
  project_created: '📁',
  task_assigned: '📋',
  task_status_changed: '🔄',
  comment_added: '💬',
  mention: '@',
  project_member_added: '👥',
  task_overdue: '⏰',
  system: '📢',
  general: '🔔',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const { currentOrgId } = useAuthStore()
  const { setNotifications: storeSet, markRead, markAllRead } = useNotificationStore()

  useEffect(() => {
    setLoading(true)
    notificationsApi
      .list(currentOrgId)
      .then((data) => {
        setNotifications(data)
        storeSet(data)
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }, [currentOrgId, storeSet])

  const handleNotificationClick = (n: Notification) => {
    setSelectedNotification(n)
    if (!n.is_read) {
      handleMarkRead(n)
    }
  }

  const handleMarkRead = async (n: Notification) => {
    if (n.is_read) return
    try {
      await notificationsApi.markRead(n.id)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
        ),
      )
      markRead(n.id)
    } catch {}
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead(currentOrgId)
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: now })))
      markAllRead()
      toast.success('All notifications marked as read')
    } catch {
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <Spinner fullScreen />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
          <p className="text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary"
          >
            {markingAll ? <Spinner size={16} /> : <CheckCheck size={16} />}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`card p-4 cursor-pointer transition-all border hover:scale-[1.01] ${
                n.is_read
                  ? 'opacity-70 border-slate-700 hover:border-slate-600'
                  : 'border-indigo-500/40 bg-indigo-600/5 hover:bg-indigo-600/10 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">
                  {TYPE_ICONS[n.notification_type] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-slate-300' : 'text-slate-100 font-semibold'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {format(new Date(n.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                )}
                {n.is_read && <Check size={14} className="text-slate-600 flex-shrink-0 mt-0.5" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Details Modal */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title="Notification Details"
          size="md"
        >
          <div className="space-y-4">
            {/* Header / Type badge & Title */}
            <div className="flex items-start gap-3.5 p-4 bg-slate-900/60 rounded-xl border border-slate-700/60">
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                {TYPE_ICONS[selectedNotification.notification_type] ?? '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-100 leading-snug">
                  {selectedNotification.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 flex-wrap">
                  <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-medium">
                    {selectedNotification.notification_type.replace(/_/g, ' ')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    {format(new Date(selectedNotification.created_at), 'PPP p')}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Message
              </label>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/40">
                <span className="text-slate-500 block mb-1">Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check size={14} /> Read
                </span>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/40">
                <span className="text-slate-500 block mb-1">Received Time</span>
                <span className="text-slate-300 font-medium">
                  {format(new Date(selectedNotification.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="btn-secondary px-6"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
