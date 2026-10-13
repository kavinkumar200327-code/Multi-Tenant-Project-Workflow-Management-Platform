import { useEffect, useState } from 'react'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ListTodo,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { dashboardApi } from '../api/dashboard'
import type { DashboardData } from '../types'
import { StatsCard } from '../components/dashboard/StatsCard'
import { TaskStatusChart, TaskPriorityChart } from '../components/dashboard/Charts'
import {
  TaskDrilldownModal,
  type DrilldownFilter,
} from '../components/dashboard/TaskDrilldownModal'
import { Spinner } from '../components/common/Spinner'
import { EmptyState } from '../components/common/EmptyState'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { currentOrgId, user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Drilldown modal state
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [drilldownFilter, setDrilldownFilter] = useState<DrilldownFilter>({ type: 'all' })

  const openTaskDrilldown = (filter: DrilldownFilter) => {
    setDrilldownFilter(filter)
    setDrilldownOpen(true)
  }

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

      {/* Project & High-Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Projects"
          value={ps.total_projects}
          icon={FolderKanban}
          colorClass="bg-indigo-600/20 text-indigo-400"
          to="/projects"
        />
        <StatsCard
          title="Active Projects"
          value={ps.active_projects}
          icon={TrendingUp}
          colorClass="bg-green-600/20 text-green-400"
          to="/projects?status=active"
        />
        <StatsCard
          title="Completed Projects"
          value={ps.completed_projects}
          icon={CheckCircle2}
          colorClass="bg-blue-600/20 text-blue-400"
          to="/projects?status=completed"
        />
        <StatsCard
          title="Overdue Tasks"
          value={ts.overdue_tasks}
          icon={AlertTriangle}
          colorClass="bg-red-600/20 text-red-400"
          onClick={() => openTaskDrilldown({ type: 'overdue' })}
        />
      </div>

      {/* Task Breakdown Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openTaskDrilldown({ type: 'all' })}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openTaskDrilldown({ type: 'all' })}
          className="card text-center cursor-pointer hover:border-indigo-500/60 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all group select-none"
        >
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
              {ts.total_tasks}
            </p>
            <ArrowUpRight size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Total Tasks</p>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-700/50 pt-1.5 group-hover:text-indigo-400 transition-colors">
            Click to view all
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => openTaskDrilldown({ type: 'status', value: 'todo' })}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openTaskDrilldown({ type: 'status', value: 'todo' })}
          className="card text-center cursor-pointer hover:border-blue-500/60 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all group select-none"
        >
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
              {ts.todo_tasks}
            </p>
            <ArrowUpRight size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Todo</p>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-700/50 pt-1.5 group-hover:text-blue-400 transition-colors">
            Click to view tasks
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => openTaskDrilldown({ type: 'status', value: 'in_progress' })}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openTaskDrilldown({ type: 'status', value: 'in_progress' })}
          className="card text-center cursor-pointer hover:border-yellow-500/60 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all group select-none"
        >
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
              {ts.in_progress_tasks}
            </p>
            <ArrowUpRight size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">In Progress</p>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-700/50 pt-1.5 group-hover:text-yellow-400 transition-colors">
            Click to view tasks
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => openTaskDrilldown({ type: 'status', value: 'completed' })}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openTaskDrilldown({ type: 'status', value: 'completed' })}
          className="card text-center cursor-pointer hover:border-green-500/60 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all group select-none"
        >
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
              {ts.completed_tasks}
            </p>
            <ArrowUpRight size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-green-400 transition-all" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Completed</p>
          <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-700/50 pt-1.5 group-hover:text-green-400 transition-colors">
            Click to view tasks
          </p>
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks_by_status.length > 0 ? (
          <TaskStatusChart
            data={tasks_by_status}
            onStatusClick={(status) => openTaskDrilldown({ type: 'status', value: status })}
          />
        ) : (
          <div className="card flex items-center justify-center text-slate-400 text-sm min-h-[300px]">
            No task status data yet
          </div>
        )}
        {tasks_by_priority.length > 0 ? (
          <TaskPriorityChart
            data={tasks_by_priority}
            onPriorityClick={(priority) => openTaskDrilldown({ type: 'priority', value: priority })}
          />
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
          <button
            onClick={() => openTaskDrilldown({ type: 'all' })}
            className="btn-secondary"
          >
            <ListTodo size={16} /> Explore All Tasks
          </button>
          <Link to="/organizations" className="btn-secondary">
            <Building2 size={16} /> Manage Org
          </Link>
          <Link to="/notifications" className="btn-secondary">
            <Clock size={16} /> Notifications
          </Link>
        </div>
      </div>

      {/* Interactive Task Drilldown Modal */}
      {currentOrgId && (
        <TaskDrilldownModal
          isOpen={drilldownOpen}
          onClose={() => setDrilldownOpen(false)}
          initialFilter={drilldownFilter}
          orgId={currentOrgId}
        />
      )}
    </div>
  )
}

