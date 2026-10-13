import api from './axios'
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '../types'

export const projectsApi = {
  create: (orgId: number, data: CreateProjectPayload) =>
    api.post<Project>(`/projects/${orgId}`, data).then((r) => r.data),

  listByOrg: (orgId: number) =>
    api.get<Project[]>(`/projects/${orgId}`).then((r) => r.data),

  getById: (projectId: number) =>
    api.get<Project>(`/projects/item/${projectId}`).then((r) => r.data),

  update: (projectId: number, data: UpdateProjectPayload) =>
    api.put<Project>(`/projects/item/${projectId}`, data).then((r) => r.data),

  delete: (projectId: number) =>
    api.delete(`/projects/item/${projectId}`).then((r) => r.data),
}
