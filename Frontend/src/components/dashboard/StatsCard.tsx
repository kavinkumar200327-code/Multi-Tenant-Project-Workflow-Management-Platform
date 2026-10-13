import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  colorClass?: string
  children?: ReactNode
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  colorClass = 'bg-indigo-600/20 text-indigo-400',
  children,
}: StatsCardProps) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-100">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      {children}
    </div>
  )
}
