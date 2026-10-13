import { Droppable, Draggable } from '@hello-pangea/dnd'
import type { Task, TaskStatus } from '../../types'
import { PRIORITY_COLORS, STATUS_COLORS } from '../../types'
import { Badge } from '../common/Badge'
import { Calendar, User, Plus, GripVertical } from 'lucide-react'
import { format } from 'date-fns'

interface KanbanColumnProps {
  columnId: TaskStatus
  label: string
  colorClass: string
  tasks: Task[]
  onAddTask?: () => void
  onTaskClick?: (task: Task) => void
}

export function KanbanColumn({
  columnId,
  label,
  colorClass,
  tasks,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className="text-xs text-slate-400 bg-slate-700 rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
            title="Add task"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-24 rounded-xl p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver
                ? 'bg-indigo-600/10 border-2 border-indigo-500/40 border-dashed'
                : 'bg-slate-800/50'
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`bg-slate-700 border border-slate-600 rounded-lg p-3 cursor-pointer transition-all ${
                      dragSnapshot.isDragging
                        ? 'shadow-2xl border-indigo-500 rotate-1 scale-105'
                        : 'hover:border-indigo-500/50 hover:bg-slate-600/80'
                    }`}
                    onClick={() => !dragSnapshot.isDragging && onTaskClick?.(task)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        {...dragProvided.dragHandleProps}
                        className="mt-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <GripVertical size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug">
                            {task.title}
                          </p>
                          <Badge
                            className={`${PRIORITY_COLORS[task.priority]} flex-shrink-0`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          )}
                          {task.assigned_to_id && (
                            <span className="flex items-center gap-1 ml-auto">
                              <User size={11} />#{task.assigned_to_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-xs text-slate-500">
                Drop tasks here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
