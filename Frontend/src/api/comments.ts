import api from './axios'
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '../types'

export const commentsApi = {
  create: (data: CreateCommentPayload) =>
    api.post<Comment>('/comments/', data).then((r) => r.data),

  listByTask: (taskId: number) =>
    api.get<Comment[]>(`/comments/task/${taskId}`).then((r) => r.data),

  update: (commentId: number, data: UpdateCommentPayload) =>
    api.put<Comment>(`/comments/${commentId}`, data).then((r) => r.data),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
}
