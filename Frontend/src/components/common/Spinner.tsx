import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
  fullScreen?: boolean
}

export function Spinner({ size = 24, className = '', fullScreen = false }: SpinnerProps) {
  const icon = (
    <Loader2
      size={size}
      className={`animate-spin text-indigo-400 ${className}`}
    />
  )

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        {icon}
      </div>
    )
  }

  return icon
}
