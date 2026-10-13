import apiClient from './axios'
import type { Attachment } from '../types'

export const attachmentsApi = {
  getByTask: async (taskId: number | string): Promise<Attachment[]> => {
    const response = await apiClient.get<Attachment[]>('/attachments/', {
      params: { task_id: taskId },
    })
    return response.data
  },

  upload: async (
    taskId: number | string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('task_id', String(taskId))

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

  delete: async (attachmentId: number | string): Promise<void> => {
    await apiClient.delete(`/attachments/${attachmentId}`)
  },

  download: async (attachmentId: number | string, fileName: string): Promise<void> => {
    const response = await apiClient.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

