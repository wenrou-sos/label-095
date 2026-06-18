import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, X, Users, Palette, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getAllTags, createTag, updateTag, deleteTag } from '@/services/mock/tags'
import type { MemberTag } from '@/types/tag'
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

  const tags = useMemo(() => getAllTags(), [refreshKey])

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
      width: 140,
      render: (_: unknown, row: MemberTag) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
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

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {tag.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="w-3 h-3" />
                {tag.memberCount || 0} 名会员
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
    </div>
  )
}
