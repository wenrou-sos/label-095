import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  MapPin,
  Building2,
  Sparkles,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
}

interface MobileNavProps {
  className?: string
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    label: '总览',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/',
  },
  {
    key: 'rfm',
    label: 'RFM',
    icon: <TrendingUp className="h-5 w-5" />,
    path: '/rfm',
  },
  {
    key: 'consumption',
    label: '消费',
    icon: <PieChart className="h-5 w-5" />,
    path: '/consumption',
  },
  {
    key: 'behavior',
    label: '到店',
    icon: <MapPin className="h-5 w-5" />,
    path: '/behavior',
  },
  {
    key: 'space',
    label: '场地',
    icon: <Building2 className="h-5 w-5" />,
    path: '/space',
  },
  {
    key: 'recommend',
    label: '推荐',
    icon: <Sparkles className="h-5 w-5" />,
    path: '/recommend',
  },
  {
    key: 'export',
    label: '导出',
    icon: <Download className="h-5 w-5" />,
    path: '/export',
  },
]

export default function MobileNav({ className }: MobileNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'relative',
                    isActive &&
                      'text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  )}
                >
                  {item.icon}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -inset-1.5 -z-10 rounded-xl bg-indigo-50"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'transition-colors',
                    isActive && 'font-semibold text-indigo-600'
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
