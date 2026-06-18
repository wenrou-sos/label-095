import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, RefreshCw, User, Users, Calendar, ChevronDown, Tag, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { useFilterStore } from '@/store/useFilterStore'
import { getAllTags } from '@/services/mock/tags'
import type { MemberTag } from '@/types/tag'

interface FilterBarProps {
  className?: string
  levelFilter: string
  genderFilter: string
  ageGroupFilter: string
  tagFilterIds: string[]
  tagMatchAll: boolean
  refreshKey: number
  onLevelFilterChange: (value: string) => void
  onGenderFilterChange: (value: string) => void
  onAgeGroupFilterChange: (value: string) => void
  onTagFilterChange: (tagIds: string[], matchAll: boolean) => void
  onRefresh: () => void
}

export default function FilterBar({
  className,
  levelFilter,
  genderFilter,
  ageGroupFilter,
  tagFilterIds,
  tagMatchAll,
  refreshKey,
  onLevelFilterChange,
  onGenderFilterChange,
  onAgeGroupFilterChange,
  onTagFilterChange,
  onRefresh,
}: FilterBarProps) {
  const { resetFilters } = useFilterStore()
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tags: MemberTag[] = useMemo(() => getAllTags(), [refreshKey])

  const hasActiveFilters = useMemo(() => {
    return levelFilter !== '全部' || genderFilter !== '全部' || ageGroupFilter !== '全部' || tagFilterIds.length > 0
  }, [levelFilter, genderFilter, ageGroupFilter, tagFilterIds])

  const toggleTag = (tagId: string) => {
    if (tagFilterIds.includes(tagId)) {
      onTagFilterChange(tagFilterIds.filter(id => id !== tagId), tagMatchAll)
    } else {
      onTagFilterChange([...tagFilterIds, tagId], tagMatchAll)
    }
  }

  const clearTags = () => {
    onTagFilterChange([], tagMatchAll)
  }

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

        <div className="flex items-center gap-2 relative">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">标签:</span>
          <button
            onClick={() => setShowTagDropdown(v => !v)}
            className="relative appearance-none pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer hover:bg-gray-100 transition-colors min-w-[140px] text-left"
          >
            <span className={cn('truncate block', tagFilterIds.length === 0 && 'text-gray-400')}>
              {tagFilterIds.length > 0 ? `已选 ${tagFilterIds.length} 个标签` : '选择标签'}
            </span>
            <ChevronDown className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform',
              showTagDropdown && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showTagDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTagDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 top-full mt-2 z-20 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">选择会员标签</span>
                    {tagFilterIds.length > 0 && (
                      <button
                        onClick={clearTags}
                        className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" />
                        清空
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2">
                    {tags.map(tag => {
                      const selected = tagFilterIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                            selected ? 'bg-amber-50' : 'hover:bg-gray-50'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                            selected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                          )}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            <Tag className="w-3 h-3" />
                            {tag.name}
                          </span>
                          <span className="flex-1 text-xs text-gray-500 truncate">
                            {tag.description}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {tag.memberCount || 0}人
                          </span>
                        </button>
                      )
                    })}
                    {tags.length === 0 && (
                      <div className="py-8 text-center text-sm text-gray-400">
                        暂无标签，请到标签管理页面创建
                      </div>
                    )}
                  </div>

                  {tagFilterIds.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tagMatchAll}
                          onChange={e => onTagFilterChange(tagFilterIds, e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs text-gray-600">
                          必须同时满足所有选中标签（默认：满足任意一个）
                        </span>
                      </label>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
              onTagFilterChange([], false)
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
          {tagFilterIds.length > 0 && tags.filter(t => tagFilterIds.includes(t.id)).map(tag => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs rounded-full text-white flex items-center gap-1"
              style={{ backgroundColor: tag.color }}
            >
              {tagMatchAll && tagFilterIds.length > 1 && '全匹配 '}
              <Tag className="w-3 h-3" />
              {tag.name}
              <button
                onClick={() => toggleTag(tag.id)}
                className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
