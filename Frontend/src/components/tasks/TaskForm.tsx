import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { TaskStatus, TaskPriority } from '../../types'
import { Spinner } from '../common/Spinner'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  assigned_to_id: z.coerce.number().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormProps {
  defaultValues?: Partial<FormValues>
  defaultStatus?: TaskStatus
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

export function TaskForm({
  defaultValues,
  defaultStatus = 'todo',
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Task',
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: defaultStatus,
      priority: 'medium',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          {...register('title')}
          className="input-field"
          placeholder="Task title"
        />
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
        <textarea
          {...register('description')}
          className="input-field min-h-[80px] resize-y"
          placeholder="Task description (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
          <select {...register('status')} className="input-field">
            <option value="backlog">Backlog</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
          <select {...register('priority')} className="input-field">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
        <input
          {...register('due_date')}
          type="datetime-local"
          className="input-field"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? <Spinner size={16} /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
