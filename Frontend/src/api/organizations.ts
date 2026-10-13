import api from './axios'
import type {
  Organization,
  OrganizationMember,
  OrganizationMemberDetail,
  OrgRole,
  CreateOrganizationPayload,
} from '../types'

export const organizationsApi = {
  list: () =>
    api.get<Organization[]>('/organization').then((r) => r.data),

  create: (data: CreateOrganizationPayload) =>
    api.post<Organization>('/organization', data).then((r) => r.data),

  getMyMembership: (orgId: number) =>
    api.get<OrganizationMember>(`/organization/${orgId}/membership`).then((r) => r.data),

  getMembers: (orgId: number) =>
    api.get<OrganizationMemberDetail[]>(`/organization/${orgId}/members`).then((r) => r.data),

  updateMemberRole: (orgId: number, userId: number, role: OrgRole) =>
    api.put<OrganizationMemberDetail>(`/organization/${orgId}/members/${userId}/role`, { role }).then((r) => r.data),
}
