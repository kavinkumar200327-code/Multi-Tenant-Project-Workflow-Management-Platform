import api from './axios'
import type {
  Task,
  TaskDependency,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '../types'

export const tasksApi = {
  create: (data: CreateTaskPayload) =>
    api.post<Task>('/tasks/', data).then((r) => r.data),

  listByProject: (projectId: number, filters?: TaskFilters) =>
    api
      .get<Task[]>(`/tasks/project/${projectId}`, { params: filters })
      .then((r) => r.data),

  listByOrg: (
    orgId: number,
    params?: {
      status?: string
      priority?: string
      overdue?: boolean
      search?: string
      offset?: number
      limit?: number
    }
  ) =>
    api
      .get<Task[]>('/tasks/', {
        params: { organization_id: orgId, ...params },
      })
      .then((r) => r.data),

  getById: (taskId: number) =>
    api.get<Task>(`/tasks/${taskId}`).then((r) => r.data),

  update: (taskId: number, data: UpdateTaskPayload) =>
    api.put<Task>(`/tasks/${taskId}`, data).then((r) => r.data),

  delete: (taskId: number) =>
    api.delete(`/tasks/${taskId}`).then((r) => r.data),

  addDependency: (taskId: number, dependsOnTaskId: number) =>
    api
      .post<TaskDependency>(`/tasks/${taskId}/dependencies`, {
        depends_on_task_id: dependsOnTaskId,
      })
      .then((r) => r.data),

  removeDependency: (taskId: number, dependencyId: number) =>
    api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`).then((r) => r.data),
}
