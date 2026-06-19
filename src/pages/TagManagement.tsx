import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, X, Users, Palette, Check, UserPlus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getAllTags, createTag, updateTag, deleteTag, getMemberTags, addTagToMember, removeTagFromMember } from '@/services/mock/tags'
import { generateMembers } from '@/services/mock/members'
import type { MemberTag } from '@/types/tag'
import type { Member } from '@/types/member'
import { cn } from '@/lib/utils'

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

  const tags = useMemo(() => getAllTags(), [refreshKey])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allMembers = useMemo(() => generateMembers(), [memberRefreshKey])

  const openTagMember = (tag: MemberTag) => {
    setTagMemberDialog(tag)
    setMemberSearch('')
    setMemberRefreshKey(k => k + 1)
  }

  const handleToggleMemberTag = (memberId: string, tagId: string, currentlyHas: boolean) => {
    if (currentlyHas) {
      removeTagFromMember(memberId, tagId)
    } else {
      addTagToMember(memberId, tagId)
    }
    setMemberRefreshKey(k => k + 1)
    setRefreshKey(k => k + 1)
  }

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
    return list
  }, [tagMemberDialog, allMembers, memberSearch])

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
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

              <div className="px-6 py-3 border-b border-gray-100">
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
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2">
                {filteredMembersForTag.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    未找到匹配的会员
                  </div>
                ) : (
                  filteredMembersForTag.slice(0, 200).map((member: Member) => {
                    const memberTags = getMemberTags(member.id)
                    const hasTag = memberTags.includes(tagMemberDialog.id)
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleToggleMemberTag(member.id, tagMemberDialog.id, hasTag)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors mb-1',
                          hasTag ? 'bg-green-50' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                          hasTag ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        )}>
                          {hasTag && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{member.name}</span>
                            <span className="text-xs text-gray-400">{member.id}</span>
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
                      </button>
                    )
                  })
                )}
                {filteredMembersForTag.length > 200 && (
                  <div className="py-3 text-center text-xs text-gray-400">
                    显示前200条，请缩小搜索范围查看更多
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
    </div>
  )
}
