import { useEffect, useState } from 'react'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  Building2,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { dashboardApi } from '../api/dashboard'
import type { DashboardData } from '../types'
import { StatsCard } from '../components/dashboard/StatsCard'
import { TaskStatusChart, TaskPriorityChart } from '../components/dashboard/Charts'
import { Spinner } from '../components/common/Spinner'
import { EmptyState } from '../components/common/EmptyState'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { currentOrgId, user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentOrgId) {
      setLoading(false)
      return
    }

    setLoading(true)
    dashboardApi
      .get(currentOrgId)
      .then(setData)
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [currentOrgId])

  if (loading) return <Spinner fullScreen />

  if (!currentOrgId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400 mb-8">Welcome back, {user?.full_name}!</p>
        <EmptyState
          icon={Building2}
          title="No organization selected"
          description="Create or join an organization to view your dashboard."
          action={{
            label: 'Go to Organizations',
            onClick: () => (window.location.href = '/organizations'),
          }}
        />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-8">Dashboard</h1>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load dashboard"
          description={error ?? 'Something went wrong. Please refresh the page.'}
        />
      </div>
    )
  }

  const { project_summary: ps, task_summary: ts, tasks_by_status, tasks_by_priority } = data

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.full_name}!</p>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Projects"
          value={ps.total_projects}
          icon={FolderKanban}
          colorClass="bg-indigo-600/20 text-indigo-400"
        />
        <StatsCard
          title="Active Projects"
          value={ps.active_projects}
          icon={TrendingUp}
          colorClass="bg-green-600/20 text-green-400"
        />
        <StatsCard
          title="Completed Projects"
          value={ps.completed_projects}
          icon={CheckCircle2}
          colorClass="bg-blue-600/20 text-blue-400"
        />
        <StatsCard
          title="Overdue Tasks"
          value={ts.overdue_tasks}
          icon={AlertTriangle}
          colorClass="bg-red-600/20 text-red-400"
        />
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{ts.total_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">Total Tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-400">{ts.todo_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">Todo</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-400">{ts.in_progress_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">In Progress</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{ts.completed_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">Completed</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks_by_status.length > 0 ? (
          <TaskStatusChart data={tasks_by_status} />
        ) : (
          <div className="card flex items-center justify-center text-slate-400 text-sm min-h-[300px]">
            No task status data yet
          </div>
        )}
        {tasks_by_priority.length > 0 ? (
          <TaskPriorityChart data={tasks_by_priority} />
        ) : (
          <div className="card flex items-center justify-center text-slate-400 text-sm min-h-[300px]">
            No task priority data yet
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 card">
        <h3 className="text-base font-semibold text-slate-200 mb-4">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <Link to="/projects" className="btn-secondary">
            <FolderKanban size={16} /> View Projects
          </Link>
          <Link to="/organizations" className="btn-secondary">
            <Building2 size={16} /> Manage Org
          </Link>
          <Link to="/notifications" className="btn-secondary">
            <Clock size={16} /> Notifications
          </Link>
        </div>
      </div>
    </div>
  )
}
