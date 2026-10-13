import apiClient from './axios'
import type { User } from '@/types'

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  updateProfile: async (
    data: Partial<Pick<User, 'full_name' | 'username' | 'avatar_url'>>,
  ): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data)
    return response.data
  },

  changePassword: async (data: {
    current_password: string
    new_password: string
  }): Promise<void> => {
    await apiClient.post('/users/me/change-password', data)
  },
}
