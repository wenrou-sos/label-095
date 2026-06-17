import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/useUserStore'

interface HeaderProps {
  className?: string
  onMenuClick?: () => void
  onRefresh?: () => void
}

export default function Header({ className, onMenuClick, onRefresh }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user, logout } = useUserStore()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleLogout = () => {
    logout()
    setIsDropdownOpen(false)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm md:h-20',
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <span className="text-xl font-bold">会</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 md:text-xl">
                会员消费行为分析系统
              </h1>
              <p className="text-xs text-gray-500">Member Behavior Analytics</p>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 lg:flex">
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            title="刷新数据"
          >
            <RefreshCw
              className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
            />
          </button>

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            title="通知"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || '管理员'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || '系统管理员'}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'hidden h-4 w-4 text-gray-400 transition-transform sm:block',
                  isDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                >
                  <div className="border-b border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || '管理员'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'admin@example.com'}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      个人中心
                    </button>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4" />
                      系统设置
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center border-t border-gray-100 py-1 text-xs text-gray-500 lg:hidden">
        {formatTime(currentTime)}
      </div>
    </header>
  )
}
