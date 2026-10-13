import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrgRole, User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  currentOrgId: number | null
  currentOrgRole: OrgRole | null

  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
  setCurrentOrg: (orgId: number | null) => void
  setCurrentOrgRole: (role: OrgRole | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      currentOrgId: null,
      currentOrgRole: null,

      login: (accessToken, refreshToken, user) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          currentOrgId: null,
          currentOrgRole: null,
        })
      },

      setUser: (user) => set({ user }),

      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),

      setCurrentOrgRole: (role) => set({ currentOrgRole: role }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        currentOrgId: state.currentOrgId,
        currentOrgRole: state.currentOrgRole,
      }),
    },
  ),
)
