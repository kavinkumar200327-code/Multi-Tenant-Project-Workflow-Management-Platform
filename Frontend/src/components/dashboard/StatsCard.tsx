import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  colorClass?: string
  children?: ReactNode
  onClick?: () => void
  to?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  colorClass = 'bg-indigo-600/20 text-indigo-400',
  children,
  onClick,
  to,
}: StatsCardProps) {
  const isClickable = Boolean(onClick || to)

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
            {isClickable && (
              <ArrowUpRight
                size={14}
                className="text-slate-500 opacity-60 group-hover:opacity-100 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              />
            )}
          </div>
          <p className="text-3xl font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      {children}
      {isClickable && (
        <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-400 transition-colors font-medium">
          <span>Click to explore</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>
      )}
    </>
  )

  const baseClasses = `card flex flex-col gap-3 transition-all duration-200 select-none ${
    isClickable
      ? 'cursor-pointer hover:border-indigo-500/60 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 group'
      : ''
  }`

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        className={baseClasses}
      >
        {content}
      </div>
    )
  }

  return <div className={baseClasses}>{content}</div>
}

