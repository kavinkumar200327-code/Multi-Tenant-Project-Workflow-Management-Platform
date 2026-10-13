import apiClient from './axios'
import type { Attachment } from '@/types'

export const attachmentsApi = {
  getByTask: async (taskId: string): Promise<Attachment[]> => {
    const response = await apiClient.get<Attachment[]>('/attachments/', {
      params: { task_id: taskId },
    })
    return response.data
  },

  upload: async (
    taskId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('task_id', taskId)

    const response = await apiClient.post<Attachment>('/attachments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  },

  delete: async (attachmentId: string): Promise<void> => {
    await apiClient.delete(`/attachments/${attachmentId}`)
  },
}
