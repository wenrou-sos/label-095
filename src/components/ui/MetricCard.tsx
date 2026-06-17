import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

interface TrendData {
  value: number
  label: string
}

interface MetricCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  icon: React.ReactNode
  iconBg?: string
  trend?: TrendData | string
  trendUp?: boolean
  yoy?: TrendData
  mom?: TrendData
  className?: string
}

export default function MetricCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconBg = 'from-indigo-500 to-purple-600',
  trend,
  trendUp,
  yoy,
  mom,
  className,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)
  const isNumericValue = typeof value === 'number'

  useEffect(() => {
    if (!isNumericValue) return
    const startValue = prevValue.current
    const endValue = value as number
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(Math.round(currentValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value, isNumericValue])

  const renderTrend = (data: TrendData, label: string) => {
    if (!data) return null

    const isPositive = data.value > 0
    const isNeutral = data.value === 0

    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-gray-500">{label}</span>
        {isNeutral ? (
          <Minus className="h-3 w-3 text-gray-400" />
        ) : isPositive ? (
          <TrendingUp className="h-3 w-3 text-emerald-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span
          className={cn(
            'font-medium',
            isNeutral
              ? 'text-gray-500'
              : isPositive
              ? 'text-emerald-600'
              : 'text-red-600'
          )}
        >
          {isPositive ? '+' : ''}
          {data.value.toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderSimpleTrend = (text: string, isUp: boolean) => {
    return (
      <div className="flex items-center gap-1 text-xs">
        {isUp ? (
          <TrendingUp className="h-3 w-3 text-emerald-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span
          className={cn(
            'font-medium',
            isUp ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {text}
        </span>
      </div>
    )
  }

  const displayContent = isNumericValue
    ? formatNumber(displayValue)
    : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <motion.p
            key={value}
            initial={{ scale: 0.95, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900"
          >
            {prefix && <span className="text-xl">{prefix}</span>}
            {displayContent}
            {suffix && <span className="text-xl">{suffix}</span>}
          </motion.p>
          <div className="mt-3 space-y-1">
            {yoy && renderTrend(yoy, '同比')}
            {mom && renderTrend(mom, '环比')}
            {trend && typeof trend === 'object' && renderTrend(trend, '趋势')}
            {trend && typeof trend === 'string' && renderSimpleTrend(trend, trendUp ?? true)}
          </div>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
