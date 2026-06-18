import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  MapPin,
  Building2,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
}

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '总览仪表盘',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/',
  },
  {
    key: 'rfm',
    label: 'RFM分析',
    icon: <TrendingUp className="h-5 w-5" />,
    path: '/rfm',
  },
  {
    key: 'consumption',
    label: '消费结构',
    icon: <PieChart className="h-5 w-5" />,
    path: '/consumption',
  },
  {
    key: 'behavior',
    label: '到店行为',
    icon: <MapPin className="h-5 w-5" />,
    path: '/behavior',
  },
  {
    key: 'space',
    label: '场地资源',
    icon: <Building2 className="h-5 w-5" />,
    path: '/space',
  },
  {
    key: 'recommend',
    label: '智能推荐',
    icon: <Sparkles className="h-5 w-5" />,
    path: '/recommend',
  },
  {
    key: 'export',
    label: '数据导出',
    icon: <Download className="h-5 w-5" />,
    path: '/export',
  },
  {
    key: 'tags',
    label: '标签管理',
    icon: <Tag className="h-5 w-5" />,
    path: '/tags',
  },
]

export default function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 72 },
  }

  const mobileSidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  }

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 items-center border-b border-gray-200 md:h-20',
          collapsed && !isMobile && 'justify-center'
        )}
      >
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <span className="text-xl font-bold">会</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">会员分析系统</h1>
              <p className="text-xs text-gray-500">Member Analytics</p>
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
            <span className="text-xl font-bold">会</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            onClick={() => {
              if (isMobile) onClose?.()
            }}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                collapsed && !isMobile && 'justify-center px-2',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  )}
                >
                  {item.icon}
                </span>
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!isMobile && (
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>收起侧边栏</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <motion.aside
        initial={false}
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'sticky top-0 hidden h-screen border-r border-gray-200 bg-white md:block',
          className
        )}
      >
        {renderSidebarContent(false)}
      </motion.aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileSidebarVariants}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-xl md:hidden',
                className
              )}
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
