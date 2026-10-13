import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, FolderKanban, KanbanSquare, Trash2, Building2, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { usePermissions } from '../hooks/usePermissions'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/EmptyState'
import { Spinner } from '../components/common/Spinner'
import { Badge } from '../components/common/Badge'
import type { Project } from '../types'

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-slate-600 text-slate-200',
  active: 'bg-green-600/30 text-green-300',
  on_hold: 'bg-yellow-600/30 text-yellow-300',
  completed: 'bg-blue-600/30 text-blue-300',
  archived: 'bg-slate-500/30 text-slate-400',
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStatusFilter = searchParams.get('status') || 'all'

  const { currentOrgId } = useAuthStore()
  const { canCreateProject, canDeleteProject, roleBadge } = usePermissions()
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!currentOrgId) { setLoading(false); return }
    setLoading(true)
    projectsApi
      .listByOrg(currentOrgId)
      .then(setProjects)
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [currentOrgId])

  const counts = useMemo(() => {
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      planning: projects.filter((p) => p.status === 'planning').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      on_hold: projects.filter((p) => p.status === 'on_hold').length,
      archived: projects.filter((p) => p.status === 'archived').length,
    }
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (activeStatusFilter !== 'all' && project.status !== activeStatusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = project.name.toLowerCase().includes(q)
        const matchesDesc = project.description?.toLowerCase().includes(q) ?? false
        if (!matchesName && !matchesDesc) return false
      }
      return true
    })
  }, [projects, activeStatusFilter, searchQuery])

  const handleFilterClick = (status: string) => {
    if (status === 'all') {
      searchParams.delete('status')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ status })
    }
  }


  const onSubmit = async (data: FormValues) => {
    if (!currentOrgId) return
    setIsSubmitting(true)
    try {
      const project = await projectsApi.create(currentOrgId, {
        organization_id: currentOrgId,
        ...data,
      })
      setProjects((prev) => [project, ...prev])
      toast.success(`Project "${project.name}" created!`)
      setShowModal(false)
      reset()
      notificationsApi.list().then(setNotifications).catch(() => {})
    } catch {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      await projectsApi.delete(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.success('Project deleted')
    } catch {}
  }

  if (!currentOrgId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-8">Projects</h1>
        <EmptyState
          icon={Building2}
          title="No organization selected"
          description="Select an organization first to manage its projects."
          action={{ label: 'Go to Organizations', onClick: () => navigate('/organizations') }}
        />
      </div>
    )
  }

  if (loading) return <Spinner fullScreen />

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
            <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${roleBadge.bgColor} ${roleBadge.color} ${roleBadge.borderColor}`}>
              {roleBadge.label} Role
            </span>
          </div>
          <p className="text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} in this organization</p>
        </div>
        {canCreateProject && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {projects.length > 0 && (
        <div className="space-y-4 mb-6">
          {/* Status Tabs and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'active', label: 'Active', count: counts.active },
                { id: 'planning', label: 'Planning', count: counts.planning },
                { id: 'completed', label: 'Completed', count: counts.completed },
                { id: 'on_hold', label: 'On Hold', count: counts.on_hold },
              ].map((tab) => {
                const isActive = activeStatusFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterClick(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="relative min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            canCreateProject
              ? "Create your first project to start managing tasks."
              : "No projects have been created in this organization yet."
          }
          action={
            canCreateProject
              ? { label: 'Create Project', onClick: () => setShowModal(true) }
              : undefined
          }
        />
      ) : filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <Filter size={32} className="mx-auto text-slate-500 mb-2" />
          <h3 className="text-base font-semibold text-slate-200">No matching projects</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No projects matched the selected status "{activeStatusFilter}" or search term.
          </p>
          <button
            onClick={() => {
              handleFilterClick('all')
              setSearchQuery('')
            }}
            className="btn-secondary text-xs mt-4 mx-auto"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (

            <div
              key={project.id}
              className="card hover:border-indigo-500/50 cursor-pointer transition-all group relative"
            >
              <Link to={`/organizations/${currentOrgId}/projects/${project.id}/board`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <FolderKanban size={20} className="text-indigo-400" />
                  </div>
                  <Badge className={STATUS_COLORS[project.status] || 'bg-slate-600 text-slate-200'}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-100 mb-1 group-hover:text-indigo-300 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{project.description}</p>
                )}
                <p className="text-xs text-slate-500">
                  Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                </p>
              </Link>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700">
                <Link
                  to={`/organizations/${currentOrgId}/projects/${project.id}/board`}
                  className="btn-secondary text-xs py-1.5 flex-1 justify-center"
                >
                  <KanbanSquare size={14} /> Board
                </Link>
                {canDeleteProject && (
                  <button
                    onClick={(e) => handleDelete(e, project)}
                    className="p-1.5 rounded-lg hover:bg-red-600/20 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {canCreateProject && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset() }}
          title="Create Project"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input {...register('name')} className="input-field" placeholder="My Awesome Project" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                className="input-field min-h-[80px] resize-y"
                placeholder="What is this project about?"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); reset() }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? <Spinner size={16} /> : null} Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
