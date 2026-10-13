import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TaskStatusSummary, TaskPrioritySummary } from '../../types'

const STATUS_COLORS_MAP: Record<string, string> = {
  backlog: '#64748b',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  blocked: '#ef4444',
  review: '#8b5cf6',
  done: '#22c55e',
  cancelled: '#6b7280',
}

const PRIORITY_COLORS_MAP: Record<string, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
}

interface StatusChartProps {
  data: TaskStatusSummary[]
}

export function TaskStatusChart({ data }: StatusChartProps) {
  const chartData = data.map((d) => ({
    name: d.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d.count,
    fill: STATUS_COLORS_MAP[d.status] ?? '#6366f1',
  }))

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-slate-200 mb-4">Tasks by Status</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PriorityChartProps {
  data: TaskPrioritySummary[]
}

export function TaskPriorityChart({ data }: PriorityChartProps) {
  const chartData = data.map((d) => ({
    name: d.priority.charAt(0).toUpperCase() + d.priority.slice(1),
    count: d.count,
    fill: PRIORITY_COLORS_MAP[d.priority] ?? '#6366f1',
  }))

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-slate-200 mb-4">Tasks by Priority</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barSize={40}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
