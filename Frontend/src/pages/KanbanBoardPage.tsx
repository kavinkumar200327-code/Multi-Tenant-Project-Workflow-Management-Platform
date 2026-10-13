import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus, Search, Filter, ChevronLeft, Eye, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { usePermissions } from '../hooks/usePermissions'
import type { Task, TaskStatus, Project } from '../types'
import { KANBAN_COLUMNS, VALID_TRANSITIONS } from '../types'
import { KanbanColumn } from '../components/tasks/KanbanColumn'
import { Modal } from '../components/common/Modal'
import { TaskForm } from '../components/tasks/TaskForm'
import { Spinner } from '../components/common/Spinner'

export default function KanbanBoardPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>()
  const navigate = useNavigate()
  const { canCreateTask, canMoveKanban, isViewer, roleBadge } = usePermissions()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingToStatus, setAddingToStatus] = useState<TaskStatus>('todo')
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const pId = parseInt(projectId ?? '0')

  const fetchTasks = useCallback(async () => {
    if (!pId) return
    setLoading(true)
    try {
      const [proj, taskList] = await Promise.all([
        projectsApi.getById(pId),
        tasksApi.listByProject(pId),
      ])
      setProject(proj)
      setTasks(taskList)
    } catch {
      toast.error('Failed to load board data')
    } finally {
      setLoading(false)
    }
  }, [pId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const getColumnTasks = (status: TaskStatus) => {
    return tasks.filter((t) => {
      const matchStatus = t.status === status
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchPriority = !priorityFilter || t.priority === priorityFilter
      return matchStatus && matchSearch && matchPriority
    })
  }

  const onDragEnd = async (result: DropResult) => {
    if (!canMoveKanban) {
      toast.error('Viewers cannot move or reorder tasks.')
      return
    }

    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const taskId = parseInt(draggableId)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newStatus = destination.droppableId as TaskStatus
    const validTargets = VALID_TRANSITIONS[task.status]

    if (!validTargets.includes(newStatus) && task.status !== newStatus) {
      toast.error(`Cannot move task from "${task.status}" to "${newStatus}"`)
      return
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    )

    try {
      await tasksApi.update(taskId, { status: newStatus })
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)),
      )
      toast.error('Failed to update task status')
    }
  }

  const handleAddTask = (status: TaskStatus) => {
    if (!canCreateTask) {
      toast.error('Your role does not have permission to create tasks.')
      return
    }
    setAddingToStatus(status)
    setShowAddModal(true)
  }

  const handleCreateTask = async (values: {
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
  }) => {
    setIsCreating(true)
    try {
      const task = await tasksApi.create({
        project_id: pId,
        title: values.title,
        description: values.description,
        status: values.status as TaskStatus,
        priority: values.priority as 'low' | 'medium' | 'high' | 'urgent',
        due_date: values.due_date,
      })
      setTasks((prev) => [...prev, task])
      setShowAddModal(false)
      toast.success('Task created!')
    } catch {
    } finally {
      setIsCreating(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.id}`)
  }

  if (loading) return <Spinner fullScreen />

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-3 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{project?.name}</h1>
              <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${roleBadge.bgColor} ${roleBadge.color} ${roleBadge.borderColor}`}>
                {roleBadge.label}
              </span>
            </div>
            <p className="text-slate-400 mt-1">{project?.description}</p>
          </div>
          {canCreateTask && (
            <button onClick={() => handleAddTask('todo')} className="btn-primary">
              <Plus size={18} /> Add Task
            </button>
          )}
        </div>

        {/* Read-Only Notice for Viewers */}
        {isViewer && (
          <div className="mt-4 p-3 bg-slate-900/80 border border-slate-700 rounded-xl flex items-center gap-3 text-slate-300 text-sm">
            <Eye size={18} className="text-indigo-400 flex-shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> You are viewing this board with <strong>Viewer</strong> role permissions. Task creation, status updates, and dragging are disabled.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Search tasks..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field w-36"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                label={col.label}
                colorClass={col.color}
                tasks={getColumnTasks(col.id)}
                onAddTask={canCreateTask ? () => handleAddTask(col.id) : undefined}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Add Task Modal */}
      {canCreateTask && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create Task"
          size="md"
        >
          <TaskForm
            defaultStatus={addingToStatus}
            onSubmit={handleCreateTask}
            onCancel={() => setShowAddModal(false)}
            isLoading={isCreating}
          />
        </Modal>
      )}
    </div>
  )
}
