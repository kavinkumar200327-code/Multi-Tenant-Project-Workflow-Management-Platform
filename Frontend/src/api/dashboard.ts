import api from './axios'
import type { DashboardData } from '../types'

export const dashboardApi = {
  get: (orgId: number) =>
    api.get<DashboardData>(`/dashboard/${orgId}`).then((r) => r.data),
}
