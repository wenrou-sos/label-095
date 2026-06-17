import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
  outline:
    'border-2 border-gray-300 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 active:bg-indigo-50',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
  danger:
    'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 active:bg-red-700',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      className,
      onAnimationStart,
      ...props
    },
    ref
  ) => {
    const motionProps = {
      ref,
      whileTap: { scale: 0.97 },
      whileHover: !disabled && !loading ? { y: -1 } : {},
      disabled: disabled || loading,
      className: cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className
      ),
      ...props,
    } as any

    return (
      <motion.button {...motionProps}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
