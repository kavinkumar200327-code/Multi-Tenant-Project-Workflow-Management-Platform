// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

// ─── Organization ─────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer'

export interface Organization {
  id: number
  name: string
  slug: string
  role?: OrgRole
}

export interface OrganizationMember {
  id: number
  organization_id: number
  user_id: number
  role: OrgRole
  status: string
}

export interface OrganizationMemberDetail {
  id: number
  organization_id: number
  user_id: number
  role: OrgRole
  status: string
  user_full_name?: string
  user_email?: string
}

export interface CreateOrganizationPayload {
  name: string
  slug: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

export interface Project {
  id: number
  organization_id: number
  owner_id: number
  name: string
  description: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: string
  status: string
  joined_at: string
}

export interface CreateProjectPayload {
  organization_id: number
  name: string
  description?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: ProjectStatus
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: number
  project_id: number
  created_by_id: number
  assigned_to_id: number | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskDependency {
  id: number
  task_id: number
  depends_on_task_id: number
  created_at: string
}

export interface CreateTaskPayload {
  project_id: number
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to_id?: number
  due_date?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to_id?: number | null
  due_date?: string | null
  position?: number
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to_id?: number
  search?: string
  page?: number
  page_size?: number
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface Comment {
  id: number
  task_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
}

export interface CreateCommentPayload {
  task_id: number
  content: string
}

export interface UpdateCommentPayload {
  content: string
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface Attachment {
  id: number
  task_id: number
  uploaded_by_id: number
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: number
  user_id: number
  organization_id?: number | null
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
  read_at: string | null
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface TaskStatusSummary {
  status: string
  count: number
}

export interface TaskPrioritySummary {
  priority: string
  count: number
}

export interface ProjectSummary {
  total_projects: number
  active_projects: number
  completed_projects: number
}

export interface TaskSummary {
  total_tasks: number
  todo_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

export interface DashboardData {
  project_summary: ProjectSummary
  task_summary: TaskSummary
  tasks_by_status: TaskStatusSummary[]
  tasks_by_priority: TaskPrioritySummary[]
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-600' },
  { id: 'todo', label: 'Todo', color: 'bg-blue-600' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-600' },
  { id: 'review', label: 'Review', color: 'bg-purple-600' },
  { id: 'done', label: 'Done', color: 'bg-green-600' },
]

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ['todo', 'cancelled'],
  todo: ['in_progress', 'backlog', 'cancelled'],
  in_progress: ['review', 'blocked', 'todo'],
  blocked: ['in_progress', 'cancelled'],
  review: ['done', 'in_progress'],
  done: [],
  cancelled: [],
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-600 text-slate-200',
  medium: 'bg-blue-600 text-blue-100',
  high: 'bg-orange-500 text-orange-100',
  urgent: 'bg-red-600 text-red-100',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-slate-600 text-slate-200',
  todo: 'bg-blue-600 text-blue-100',
  in_progress: 'bg-yellow-500 text-yellow-900',
  blocked: 'bg-red-600 text-red-100',
  review: 'bg-purple-600 text-purple-100',
  done: 'bg-green-600 text-green-100',
  cancelled: 'bg-slate-500 text-slate-300',
}
