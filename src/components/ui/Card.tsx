import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  icon?: React.ReactNode
  hoverable?: boolean
  className?: string
  onClick?: () => void
}

export default function Card({
  title,
  subtitle,
  children,
  actions,
  icon,
  hoverable = false,
  className,
  onClick,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverable ? { y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' } : {}}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300',
        hoverable && 'cursor-pointer hover:shadow-lg',
        className
      )}
    >
      {(title || subtitle || icon || actions) && (
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5">{icon}</div>}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  )
}
