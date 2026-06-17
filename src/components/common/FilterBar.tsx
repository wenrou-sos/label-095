import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Filter, RefreshCw, Search, User, Users, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { useFilterStore } from '@/store/useFilterStore'

interface FilterBarProps {
  className?: string
  levelFilter: string
  genderFilter: string
  ageGroupFilter: string
  onLevelFilterChange: (value: string) => void
  onGenderFilterChange: (value: string) => void
  onAgeGroupFilterChange: (value: string) => void
  onRefresh: () => void
}

export default function FilterBar({
  className,
  levelFilter,
  genderFilter,
  ageGroupFilter,
  onLevelFilterChange,
  onGenderFilterChange,
  onAgeGroupFilterChange,
  onRefresh,
}: FilterBarProps) {
  const { resetFilters } = useFilterStore()

  const hasActiveFilters = useMemo(() => {
    return levelFilter !== '全部' || genderFilter !== '全部' || ageGroupFilter !== '全部'
  }, [levelFilter, genderFilter, ageGroupFilter])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-4 h-4" />
          <span>筛选条件</span>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">会员等级:</span>
          <div className="relative">
            <select
              value={levelFilter}
              onChange={e => onLevelFilterChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
            >
              <option value="全部">全部等级</option>
              <option value="钻石">钻石会员</option>
              <option value="金卡">金卡会员</option>
              <option value="银卡">银卡会员</option>
              <option value="普通">普通会员</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">性别:</span>
          <div className="relative">
            <select
              value={genderFilter}
              onChange={e => onGenderFilterChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
            >
              <option value="全部">全部</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">年龄段:</span>
          <div className="relative">
            <select
              value={ageGroupFilter}
              onChange={e => onAgeGroupFilterChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
            >
              <option value="全部">全部年龄段</option>
              <option value="18-25">18-25岁</option>
              <option value="26-35">26-35岁</option>
              <option value="36-45">36-45岁</option>
              <option value="46-55">46-55岁</option>
              <option value="55+">55岁以上</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1" />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onLevelFilterChange('全部')
              onGenderFilterChange('全部')
              onAgeGroupFilterChange('全部')
              resetFilters()
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            重置筛选
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </Button>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">当前筛选:</span>
          {levelFilter !== '全部' && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
              会员等级: {levelFilter}
            </span>
          )}
          {genderFilter !== '全部' && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
              性别: {genderFilter}
            </span>
          )}
          {ageGroupFilter !== '全部' && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
              年龄段: {ageGroupFilter}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
