import { Calendar, User, Flag } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Task } from '../../types'
import { PRIORITY_COLORS, STATUS_COLORS } from '../../types'
import { Badge } from '../common/Badge'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'done' &&
    task.status !== 'cancelled'

  return (
    <div
      className="bg-slate-700 border border-slate-600 rounded-lg p-3 cursor-pointer hover:border-indigo-500 hover:bg-slate-600/70 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
          {task.title}
        </p>
        <Badge className={`${PRIORITY_COLORS[task.priority]} flex-shrink-0 ml-1`}>
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
        {task.due_date && (
          <span
            className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}
          >
            <Calendar size={12} />
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        {task.assigned_to_id && (
          <span className="flex items-center gap-1">
            <User size={12} />
            #{task.assigned_to_id}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Flag size={12} />
          <Badge className={STATUS_COLORS[task.status]}>{task.status.replace('_', ' ')}</Badge>
        </span>
      </div>
    </div>
  )
}
