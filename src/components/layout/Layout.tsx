import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface LayoutProps {
  className?: string
}

export default function Layout({ className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className={cn('flex min-h-screen bg-gray-50', className)}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col md:pb-0 pb-20">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
        />

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>

        <MobileNav className="md:hidden" />
      </div>
    </div>
  )
}
