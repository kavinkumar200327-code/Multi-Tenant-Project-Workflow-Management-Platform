import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { organizationsApi } from '../../api/organizations'
import { notificationsApi } from '../../api/notifications'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'

export function Layout() {
  const { currentOrgId, setCurrentOrg, setCurrentOrgRole, isAuthenticated } = useAuthStore()
  const setNotifications = useNotificationStore((s) => s.setNotifications)

  useEffect(() => {
    if (!isAuthenticated) return

    // Sync active organization and user role
    organizationsApi
      .list()
      .then((orgs) => {
        if (orgs.length > 0) {
          const activeOrg = orgs.find((o) => o.id === currentOrgId) || orgs[0]
          setCurrentOrg(activeOrg.id)
          setCurrentOrgRole(activeOrg.role || 'viewer')
        }
      })
      .catch(() => {})

    // Load initial notifications for sidebar unread badge
    notificationsApi
      .list(currentOrgId)
      .then((data) => {
        setNotifications(data)
      })
      .catch(() => {})
  }, [isAuthenticated, currentOrgId, setCurrentOrg, setCurrentOrgRole, setNotifications])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
