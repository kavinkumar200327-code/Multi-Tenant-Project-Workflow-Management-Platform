import { create } from 'zustand'
import type { Organization, Membership } from '@/types'

interface OrgState {
  organizations: Organization[]
  currentOrg: Organization | null
  myMembership: Membership | null
  isLoading: boolean

  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrg: (org: Organization | null) => void
  setMyMembership: (membership: Membership | null) => void
  addOrganization: (org: Organization) => void
  updateOrganization: (org: Organization) => void
  removeOrganization: (orgId: number | string) => void
  setLoading: (loading: boolean) => void
}

export const useOrgStore = create<OrgState>((set) => ({
  organizations: [],
  currentOrg: null,
  myMembership: null,
  isLoading: false,

  setOrganizations: (organizations) => set({ organizations }),

  setCurrentOrg: (currentOrg) => set({ currentOrg }),

  setMyMembership: (myMembership) => set({ myMembership }),

  addOrganization: (org) =>
    set((state) => ({ organizations: [...state.organizations, org] })),

  updateOrganization: (org) =>
    set((state) => ({
      organizations: state.organizations.map((o) => (o.id === org.id ? org : o)),
      currentOrg: state.currentOrg?.id === org.id ? org : state.currentOrg,
    })),

  removeOrganization: (orgId) =>
    set((state) => ({
      organizations: state.organizations.filter((o) => String(o.id) !== String(orgId)),
      currentOrg: String(state.currentOrg?.id) === String(orgId) ? null : state.currentOrg,
    })),

  setLoading: (isLoading) => set({ isLoading }),
}))
