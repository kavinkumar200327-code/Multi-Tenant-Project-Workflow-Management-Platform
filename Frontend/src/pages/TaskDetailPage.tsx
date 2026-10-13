import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MessageSquare, Paperclip, Calendar, User, Flag, Trash2, Send, Edit2, X, Check, Eye } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { tasksApi } from '../api/tasks'
import { commentsApi } from '../api/comments'
import { usePermissions } from '../hooks/usePermissions'
import type { Task, Comment } from '../types'
import { PRIORITY_COLORS, STATUS_COLORS } from '../types'
import { Badge } from '../components/common/Badge'
import { Spinner } from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { canEditTask, canComment, canUploadAttachment, canDeleteTask, isViewer } = usePermissions()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  const tId = parseInt(taskId ?? '0')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([
        tasksApi.getById(tId),
        commentsApi.listByTask(tId),
      ])
      setTask(t)
      setComments(c)
    } catch {
      toast.error('Failed to load task')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }, [tId, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddComment = async () => {
    if (!canComment) {
      toast.error('Viewers cannot post comments.')
      return
    }
    if (!commentText.trim() || !task) return
    setIsSubmittingComment(true)
    try {
      const comment = await commentsApi.create({ task_id: task.id, content: commentText.trim() })
      setComments((prev) => [...prev, comment])
      setCommentText('')
      toast.success('Comment added')
    } catch {
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editCommentText.trim()) return
    try {
      const updated = await commentsApi.update(commentId, { content: editCommentText.trim() })
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
      setEditingCommentId(null)
      toast.success('Comment updated')
    } catch {}
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return
    try {
      await commentsApi.delete(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('Comment deleted')
    } catch {}
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!canEditTask) {
      toast.error('Viewers cannot change task status.')
      return
    }
    if (!task) return
    try {
      const updated = await tasksApi.update(task.id, { status: newStatus as Task['status'] })
      setTask(updated)
      toast.success(`Status updated to "${newStatus}"`)
    } catch {}
  }

  const handleDeleteTask = async () => {
    if (!task) return
    if (!confirm(`Delete task "${task.title}"?`)) return
    try {
      await tasksApi.delete(task.id)
      toast.success('Task deleted')
      navigate(-1)
    } catch {}
  }

  if (loading) return <Spinner fullScreen />
  if (!task) return null

  const isAuthor = task.created_by_id === user?.id
  const userCanDeleteThisTask = canDeleteTask || isAuthor

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {userCanDeleteThisTask && !isViewer && (
          <button
            onClick={handleDeleteTask}
            className="btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs py-1.5"
          >
            <Trash2 size={14} /> Delete Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-100">{task.title}</h1>
                {task.description && (
                  <p className="text-slate-400 mt-2 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                <Badge className={STATUS_COLORS[task.status]}>{task.status.replace('_', ' ')}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                </span>
              )}
              {task.assigned_to_id && (
                <span className="flex items-center gap-1">
                  <User size={14} />
                  Assigned to #{task.assigned_to_id}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Flag size={14} />
                #{task.id}
              </span>
            </div>

            {/* Status Change */}
            {canEditTask && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 mb-2">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['todo', 'in_progress', 'review', 'done', 'cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={task.status === s}
                      className={`text-xs px-3 py-1 rounded-full transition-all border ${
                        task.status === s
                          ? 'bg-indigo-600 border-indigo-500 text-white cursor-default'
                          : 'border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-300'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-indigo-400" />
              Comments ({comments.length})
            </h2>

            {comments.length === 0 && (
              <p className="text-sm text-slate-500 mb-4">No comments yet.</p>
            )}

            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-300">
                    {comment.user_id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-300">User #{comment.user_id}</span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                      </span>
                      {comment.user_id === user?.id && !isViewer && (
                        <div className="ml-auto flex gap-1">
                          <button
                            onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content) }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="input-field flex-1 text-sm py-1.5"
                          onKeyDown={(e) => e.key === 'Enter' && handleEditComment(comment.id)}
                        />
                        <button onClick={() => handleEditComment(comment.id)} className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCommentId(null)} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            {canComment ? (
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  className="input-field flex-1"
                  placeholder="Write a comment..."
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="btn-primary px-3"
                >
                  {isSubmittingComment ? <Spinner size={16} /> : <Send size={16} />}
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-700 text-xs text-slate-500 flex items-center gap-1.5">
                <Eye size={14} /> Comments are read-only for Viewer role.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Project</dt>
                <dd className="text-slate-200">#{task.project_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created by</dt>
                <dd className="text-slate-200">#{task.created_by_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-200">{format(new Date(task.created_at), 'MMM d, yyyy')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Updated</dt>
                <dd className="text-slate-200">{format(new Date(task.updated_at), 'MMM d, yyyy')}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Paperclip size={16} className="text-indigo-400" />
              Attachments
            </h3>
            <p className="text-xs text-slate-500">No attachments yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}
