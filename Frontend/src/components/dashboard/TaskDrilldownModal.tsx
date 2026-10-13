import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Calendar,
  AlertTriangle,
  Search,
  ExternalLink,
  KanbanSquare,
  CheckCircle2,
  Clock,
  ListTodo,
} from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import { Modal } from '../common/Modal'
import { Spinner } from '../common/Spinner'
import { Badge } from '../common/Badge'
import { tasksApi } from '../../api/tasks'
import type { Task } from '../../types'

export type DrilldownFilterType = 'all' | 'status' | 'priority' | 'overdue'

export interface DrilldownFilter {
  type: DrilldownFilterType
  value?: string
  label?: string
}

interface TaskDrilldownModalProps {
  isOpen: boolean
  onClose: () => void
  initialFilter: DrilldownFilter
  orgId: number
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-slate-600/30 text-slate-300 border-slate-600/40',
  todo: 'bg-blue-600/30 text-blue-300 border-blue-600/40',
  in_progress: 'bg-yellow-600/30 text-yellow-300 border-yellow-600/40',
  review: 'bg-purple-600/30 text-purple-300 border-purple-600/40',
  done: 'bg-green-600/30 text-green-300 border-green-600/40',
  completed: 'bg-green-600/30 text-green-300 border-green-600/40',
  blocked: 'bg-red-600/30 text-red-300 border-red-600/40',
  cancelled: 'bg-slate-600/30 text-slate-400 border-slate-600/40',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-600/30 text-slate-300',
  medium: 'bg-blue-600/30 text-blue-300',
  high: 'bg-orange-600/30 text-orange-300',
  urgent: 'bg-red-600/30 text-red-300',
}

export function TaskDrilldownModal({
  isOpen,
  onClose,
  initialFilter,
  orgId,
}: TaskDrilldownModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')

  // Initialize active tab when modal opens with initialFilter
  useEffect(() => {
    if (isOpen) {
      if (initialFilter.type === 'overdue') {
        setActiveTab('overdue')
      } else if (initialFilter.type === 'status' && initialFilter.value) {
        const val = initialFilter.value.toLowerCase()
        setActiveTab(val === 'done' ? 'completed' : val)
      } else if (initialFilter.type === 'priority' && initialFilter.value) {
        setActiveTab(`priority_${initialFilter.value.toLowerCase()}`)
      } else {
        setActiveTab('all')
      }
      setSearch('')
    }
  }, [isOpen, initialFilter])

  // Load all tasks for the organization
  useEffect(() => {
    if (!isOpen || !orgId) return
    setLoading(true)
    tasksApi
      .listByOrg(orgId, { limit: 200 })
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [isOpen, orgId])

  const isOverdue = (task: Task) => {
    if (!task.due_date) return false
    if (task.status === 'done' || task.status === 'completed') return false
    return isPast(parseISO(task.due_date))
  }

  // Calculate counts for badges
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
      review: tasks.filter((t) => t.status === 'review').length,
      overdue: tasks.filter(isOverdue).length,
    }
  }, [tasks])

  // Filter tasks based on activeTab and search term
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab matching
      if (activeTab === 'overdue') {
        if (!isOverdue(task)) return false
      } else if (activeTab === 'completed') {
        if (task.status !== 'completed' && task.status !== 'done') return false
      } else if (activeTab.startsWith('priority_')) {
        const p = activeTab.replace('priority_', '')
        if (task.priority !== p) return false
      } else if (activeTab !== 'all') {
        if (task.status !== activeTab) return false
      }

      // Search matching
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(q)
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false
        const matchesProject = task.project_name?.toLowerCase().includes(q) ?? false
        if (!matchesTitle && !matchesDesc && !matchesProject) return false
      }

      return true
    })
  }, [tasks, activeTab, search])

  const tabs = [
    { id: 'all', label: 'All Tasks', count: counts.all },
    { id: 'todo', label: 'Todo', count: counts.todo },
    { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'review', label: 'Review', count: counts.review },
    { id: 'overdue', label: 'Overdue', count: counts.overdue, isAlert: counts.overdue > 0 },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tasks Explorer"
      size="2xl"
    >
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-700/80 scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.isAlert
                      ? 'bg-red-500/20 text-red-300 font-bold'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description or project..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-700 rounded-xl bg-slate-800/40">
            {activeTab === 'overdue' ? (
              <>
                <CheckCircle2 size={36} className="mx-auto text-green-400 mb-2" />
                <h4 className="text-base font-semibold text-slate-200">No Overdue Tasks!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  All active tasks in this organization are on track or already completed.
                </p>
              </>
            ) : (
              <>
                <ListTodo size={36} className="mx-auto text-slate-500 mb-2" />
                <h4 className="text-base font-semibold text-slate-200">No tasks match this filter</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {search ? 'Try adjusting your search query.' : 'There are no tasks under this category yet.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task)
              return (
                <div
                  key={task.id}
                  className="p-3.5 bg-slate-750/70 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-750 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/tasks/${task.id}`}
                        onClick={onClose}
                        className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors text-sm hover:underline truncate"
                      >
                        {task.title}
                      </Link>
                      <Badge className={STATUS_COLORS[task.status] || 'bg-slate-600 text-slate-200'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={PRIORITY_COLORS[task.priority] || 'bg-slate-600 text-slate-200'}>
                        {task.priority}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                      {task.project_name && (
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <FolderKanban size={13} className="text-indigo-400" />
                          {task.project_name}
                        </span>
                      )}

                      {task.due_date && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            overdue ? 'text-red-400' : 'text-slate-400'
                          }`}
                        >
                          {overdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                          Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
                    <Link
                      to={`/organizations/${orgId}/projects/${task.project_id}/board`}
                      onClick={onClose}
                      className="btn-secondary text-xs py-1.5 px-2.5 gap-1.5"
                      title="View Kanban Board"
                    >
                      <KanbanSquare size={13} />
                      <span className="hidden sm:inline">Board</span>
                    </Link>
                    <Link
                      to={`/tasks/${task.id}`}
                      onClick={onClose}
                      className="btn-primary text-xs py-1.5 px-2.5 gap-1.5"
                      title="Open Task Details"
                    >
                      <span>Details</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-200">{tasks.length}</strong> total tasks
          </span>
          <button onClick={onClose} className="btn-secondary text-xs py-1 px-3">
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
