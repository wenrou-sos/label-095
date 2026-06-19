import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, X, Users, Palette, Check, UserPlus, Search, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getAllTags, createTag, updateTag, deleteTag, getMemberTags, addTagToMember, removeTagFromMember } from '@/services/mock/tags'
import { generateMembers } from '@/services/mock/members'
import type { MemberTag } from '@/types/tag'
import type { Member } from '@/types/member'
import { cn } from '@/lib/utils'
import MemberDetailPanel from '@/components/member/MemberDetailPanel'

const presetColors = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#64748B', '#78716C',
]

interface TagFormData {
  id?: string
  name: string
  color: string
  description: string
}

export default function TagManagement() {
  const [selectedMemberDetailId, setSelectedMemberDetailId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<MemberTag | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: '#6366F1',
    description: '',
  })
  const [formError, setFormError] = useState('')
  const [tagMemberDialog, setTagMemberDialog] = useState<MemberTag | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRefreshKey, setMemberRefreshKey] = useState(0)
  const [memberLevelFilter, setMemberLevelFilter] = useState<string>('全部')
  const [memberGenderFilter, setMemberGenderFilter] = useState<string>('全部')
  const [memberAgeFilter, setMemberAgeFilter] = useState<string>('全部')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tags = useMemo(() => getAllTags(), [refreshKey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allMembers = useMemo(() => generateMembers(), [memberRefreshKey])

  const openTagMember = (tag: MemberTag) => {
    setTagMemberDialog(tag)
    setMemberSearch('')
    setMemberLevelFilter('全部')
    setMemberGenderFilter('全部')
    setMemberAgeFilter('全部')
    setSelectedMemberIds(new Set())
    setMemberRefreshKey(k => k + 1)
  }

  useEffect(() => {
    if (tagMemberDialog) {
      setSelectedMemberIds(new Set())
    }
  }, [memberSearch, memberLevelFilter, memberGenderFilter, memberAgeFilter, tagMemberDialog])

  const filteredMembersForTag = useMemo(() => {
    if (!tagMemberDialog) return []
    const search = memberSearch.trim().toLowerCase()
    let list = allMembers
    if (search) {
      list = list.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.id.toLowerCase().includes(search) ||
        m.phone.includes(search)
      )
    }
    if (memberLevelFilter && memberLevelFilter !== '全部') {
      list = list.filter(m => m.level === memberLevelFilter)
    }
    if (memberGenderFilter && memberGenderFilter !== '全部') {
      list = list.filter(m => m.gender === memberGenderFilter)
    }
    if (memberAgeFilter && memberAgeFilter !== '全部') {
      list = list.filter(m => {
        if (memberAgeFilter === '18-25') return m.age >= 18 && m.age <= 25
        if (memberAgeFilter === '26-35') return m.age >= 26 && m.age <= 35
        if (memberAgeFilter === '36-45') return m.age >= 36 && m.age <= 45
        if (memberAgeFilter === '46-55') return m.age >= 46 && m.age <= 55
        if (memberAgeFilter === '55+') return m.age > 55
        return true
      })
    }
    return list
  }, [tagMemberDialog, allMembers, memberSearch, memberLevelFilter, memberGenderFilter, memberAgeFilter])

  const displayedMembers = useMemo(() => filteredMembersForTag.slice(0, 200), [filteredMembersForTag])

  const allDisplayedSelected = useMemo(() => {
    return displayedMembers.length > 0 && displayedMembers.every(m => selectedMemberIds.has(m.id))
  }, [displayedMembers, selectedMemberIds])

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedMemberIds)
    if (allDisplayedSelected) {
      displayedMembers.forEach(m => newSelected.delete(m.id))
    } else {
      displayedMembers.forEach(m => newSelected.add(m.id))
    }
    setSelectedMemberIds(newSelected)
  }

  const toggleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMemberIds)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMemberIds(newSelected)
  }

  const handleBatchAddTag = () => {
    if (!tagMemberDialog || selectedMemberIds.size === 0) return
    const tagId = tagMemberDialog.id
    selectedMemberIds.forEach(memberId => {
      addTagToMember(memberId, tagId)
    })
    setSelectedMemberIds(new Set())
    setMemberRefreshKey(k => k + 1)
    setRefreshKey(k => k + 1)
  }

  const handleBatchRemoveTag = () => {
    if (!tagMemberDialog || selectedMemberIds.size === 0) return
    const tagId = tagMemberDialog.id
    selectedMemberIds.forEach(memberId => {
      removeTagFromMember(memberId, tagId)
    })
    setSelectedMemberIds(new Set())
    setMemberRefreshKey(k => k + 1)
    setRefreshKey(k => k + 1)
  }

  const handleBatchAddAll = () => {
    if (!tagMemberDialog || filteredMembersForTag.length === 0) return
    const tagId = tagMemberDialog.id
    filteredMembersForTag.forEach(member => {
      addTagToMember(member.id, tagId)
    })
    setSelectedMemberIds(new Set())
    setMemberRefreshKey(k => k + 1)
    setRefreshKey(k => k + 1)
  }

  const handleBatchRemoveAll = () => {
    if (!tagMemberDialog || filteredMembersForTag.length === 0) return
    const tagId = tagMemberDialog.id
    filteredMembersForTag.forEach(member => {
      removeTagFromMember(member.id, tagId)
    })
    setSelectedMemberIds(new Set())
    setMemberRefreshKey(k => k + 1)
    setRefreshKey(k => k + 1)
  }

  const taggedMemberCount = useMemo(() => {
    if (!tagMemberDialog) return 0
    return allMembers.filter(m => getMemberTags(m.id).includes(tagMemberDialog.id)).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagMemberDialog, allMembers, memberRefreshKey])

  const openCreate = () => {
    setEditingTag(null)
    setFormData({ name: '', color: '#6366F1', description: '' })
    setFormError('')
    setShowDialog(true)
  }

  const openEdit = (tag: MemberTag) => {
    setEditingTag(tag)
    setFormData({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
    })
    setFormError('')
    setShowDialog(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setFormError('请输入标签名称')
      return
    }

    if (editingTag) {
      updateTag(editingTag.id, {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim(),
      })
    } else {
      createTag({
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim(),
      })
    }

    setShowDialog(false)
    setRefreshKey(k => k + 1)
  }

  const handleDelete = (tagId: string) => {
    deleteTag(tagId)
    setDeleteConfirm(null)
    setRefreshKey(k => k + 1)
  }

  const columns = [
    {
      key: 'color',
      title: '标签',
      dataIndex: 'color' as const,
      width: 180,
      render: (_: unknown, row: MemberTag) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: row.color }}
          >
            <Tag className="w-3 h-3" />
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataIndex: 'description' as const,
    },
    {
      key: 'memberCount',
      title: '会员数',
      dataIndex: 'memberCount' as const,
      width: 120,
      render: (value: unknown) => (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">{value as number}</span>
          <span className="text-xs text-gray-400">人</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as const,
      width: 140,
    },
    {
      key: 'actions',
      title: '操作',
      sortable: false,
      width: 260,
      render: (_: unknown, row: MemberTag) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openTagMember(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors text-xs font-medium"
            title="会员打标"
          >
            <UserPlus className="w-3.5 h-3.5" />
            打标
          </button>
          <button
            onClick={() => openEdit(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-xs font-medium"
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-xs font-medium"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-7 h-7 text-indigo-500" />
              标签管理
            </h1>
            <p className="mt-1 text-gray-500 text-sm">
              创建和管理会员自定义标签，用于精准筛选和分层运营
            </p>
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
            新建标签
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            data={tags}
            rowKey="id"
            pageSize={10}
          />
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tags.map(tag => (
            <motion.div
              key={tag.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  <Tag className="w-3 h-3" />
                  {tag.name}
                </span>
                <span className="text-xs text-gray-400">{tag.createdAt}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                {tag.description || '暂无描述'}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => openTagMember(tag)}
                  className="inline-flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {tag.memberCount || 0} 名会员 · 打标
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTag ? '编辑标签' : '新建标签'}
                </h3>
                <button
                  onClick={() => setShowDialog(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    标签名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="如：红酒爱好者、常带客户"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    maxLength={20}
                  />
                  {formError && (
                    <p className="mt-1 text-xs text-red-500">{formError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    标签颜色
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn(
                          'w-7 h-7 rounded-full transition-all flex items-center justify-center',
                          formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {formData.color === color && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="标签使用场景或说明"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="ghost"
                  onClick={() => setShowDialog(false)}
                >
                  取消
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTag ? '保存修改' : '创建标签'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">确认删除标签</h3>
                  <p className="text-sm text-gray-500">
                    删除后将移除所有会员的该标签
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                  取消
                </Button>
                <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                  确认删除
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tagMemberDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setTagMemberDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tagMemberDialog.color }}
                  >
                    <Tag className="w-3 h-3" />
                    {tagMemberDialog.name}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">会员打标</h3>
                </div>
                <button
                  onClick={() => setTagMemberDialog(null)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-3 border-b border-gray-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="搜索会员姓名、ID或手机号"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">等级:</label>
                    <select
                      value={memberLevelFilter}
                      onChange={e => setMemberLevelFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="全部">全部</option>
                      <option value="普通">普通</option>
                      <option value="银卡">银卡</option>
                      <option value="金卡">金卡</option>
                      <option value="钻石">钻石</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">性别:</label>
                    <select
                      value={memberGenderFilter}
                      onChange={e => setMemberGenderFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="全部">全部</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">年龄:</label>
                    <select
                      value={memberAgeFilter}
                      onChange={e => setMemberAgeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="全部">全部</option>
                      <option value="18-25">18-25岁</option>
                      <option value="26-35">26-35岁</option>
                      <option value="36-45">36-45岁</option>
                      <option value="46-55">46-55岁</option>
                      <option value="55+">55岁以上</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        allDisplayedSelected
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center',
                        allDisplayedSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-400'
                      )}>
                        {allDisplayedSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {allDisplayedSelected ? '取消全选' : '全选当前页'}
                    </button>
                    <span className="text-xs text-gray-500">
                      筛选结果共 {filteredMembersForTag.length} 人
                      {selectedMemberIds.size > 0 && (
                        <span className="text-indigo-600 font-medium ml-1">
                          · 已选 {selectedMemberIds.size} 人
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBatchAddAll}
                      disabled={filteredMembersForTag.length === 0}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      全部打标
                    </button>
                    <button
                      onClick={handleBatchRemoveAll}
                      disabled={filteredMembersForTag.length === 0}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      全部移除
                    </button>
                  </div>
                </div>

                {selectedMemberIds.size > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-lg">
                    <span className="text-xs text-indigo-700">
                      已选中 <strong>{selectedMemberIds.size}</strong> 名会员
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBatchAddTag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        批量打标
                      </button>
                      <button
                        onClick={handleBatchRemoveTag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        批量移除
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2">
                {displayedMembers.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    未找到匹配的会员
                  </div>
                ) : (
                  displayedMembers.map((member: Member) => {
                    const memberTags = getMemberTags(member.id)
                    const hasTag = memberTags.includes(tagMemberDialog.id)
                    const isSelected = selectedMemberIds.has(member.id)
                    return (
                      <div
                        key={member.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors mb-1 cursor-pointer',
                          isSelected ? 'bg-indigo-50 border border-indigo-200' : hasTag ? 'bg-green-50 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
                        )}
                        onClick={() => toggleSelectMember(member.id)}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500'
                            : hasTag
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                        )}>
                          {(isSelected || hasTag) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{member.name}</span>
                            <span className="text-xs text-gray-400">{member.id}</span>
                            {hasTag && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tagMemberDialog.color }}
                              >
                                已打标
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded-full text-xs',
                              member.level === '钻石' ? 'bg-cyan-100 text-cyan-700'
                                : member.level === '金卡' ? 'bg-yellow-100 text-yellow-700'
                                : member.level === '银卡' ? 'bg-gray-100 text-gray-700'
                                : 'bg-gray-50 text-gray-500'
                            )}>
                              {member.level}
                            </span>
                            <span>{member.gender}</span>
                            <span>{member.age}岁</span>
                            <span className="truncate">{member.phone}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMemberDetailId(member.id)
                          }}
                          className="p-1.5 rounded-lg text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-colors flex-shrink-0"
                          title="查看会员详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })
                )}
                {filteredMembersForTag.length > 200 && (
                  <div className="py-3 text-center text-xs text-gray-400">
                    显示前200条，已根据筛选条件选中可操作全部 {filteredMembersForTag.length} 人
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  已打标 {taggedMemberCount} 人 / 共 {allMembers.length} 人
                </span>
                <Button variant="ghost" onClick={() => setTagMemberDialog(null)}>
                  完成
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MemberDetailPanel
        memberId={selectedMemberDetailId}
        onClose={() => setSelectedMemberDetailId(null)}
      />
    </div>
  )
}
