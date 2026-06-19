import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle, AlertCircle,
  Power, Clock, Check, Zap, Activity,
  Gauge
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import MetricCard from '@/components/ui/MetricCard'
import {
  getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule,
  toggleAlertRuleEnabled, getAlertRecords, runAlertCheck,
  markAlertRead, markAllAlertsRead, resolveAlert, getUnreadAlertCount
} from '@/services/mock/alerts'
import type { AlertRule, AlertRecord, AlertMetricType, AlertConditionOperator, AlertStatus } from '@/types/alert'
import { ALERT_METRICS } from '@/types/alert'
import type { MemberLevel } from '@/types/member'
import type { ConsumptionCategory } from '@/types/consumption'
import { getAllTags } from '@/services/mock/tags'
import { cn } from '@/lib/utils'

interface RuleFormData {
  id?: string
  name: string
  metricType: AlertMetricType
  operator: AlertConditionOperator
  threshold: number
  filterValue?: string
  filterLabel?: string
  consecutiveDays?: number
  level: AlertRule['level']
  enabled: boolean
}

const OPERATOR_OPTIONS: { value: AlertConditionOperator; label: string }[] = [
  { value: '>', label: '大于 (>)' },
  { value: '>=', label: '大于等于 (≥)' },
  { value: '<', label: '小于 (<)' },
  { value: '<=', label: '小于等于 (≤)' },
  { value: '==', label: '等于 (=)' },
]

const LEVEL_OPTIONS: { value: AlertRule['level']; label: string; color: string; bg: string }[] = [
  { value: 'critical', label: '严重', color: 'text-red-700', bg: 'bg-red-100' },
  { value: 'warning', label: '警告', color: 'text-amber-700', bg: 'bg-amber-100' },
  { value: 'info', label: '提示', color: 'text-blue-700', bg: 'bg-blue-100' },
]

const STATUS_OPTIONS: { value: AlertStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'text-gray-700' },
  { value: 'unread', label: '未读', color: 'text-red-600' },
  { value: 'read', label: '已读', color: 'text-amber-600' },
  { value: 'resolved', label: '已处理', color: 'text-green-600' },
]

const operatorTextMap: Record<AlertConditionOperator, string> = {
  '>': '>', '>=': '≥', '<': '<', '<=': '≤', '==': '='
}

export default function AlertManagement({ onUnreadChange }: { onUnreadChange?: (count: number) => void }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'rules' | 'records'>('rules')
  const [recordStatusFilter, setRecordStatusFilter] = useState<AlertStatus | 'all'>('all')
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [showResolveDialog, setShowResolveDialog] = useState<AlertRecord | null>(null)
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    metricType: 'member_inactive_days',
    operator: '>=',
    threshold: 30,
    level: 'warning',
    enabled: true,
  })

  const rules = useMemo(() => getAlertRules(), [refreshKey])
  const allRecords = useMemo(() => getAlertRecords(recordStatusFilter), [recordStatusFilter, refreshKey])
  const tags = useMemo(() => getAllTags(), [])

  const selectedMetric = useMemo(() =>
    ALERT_METRICS.find(m => m.type === formData.metricType),
  [formData.metricType])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => {
    const all = getAlertRecords('all')
    return {
      unread: all.filter(r => r.status === 'unread').length,
      read: all.filter(r => r.status === 'read').length,
      resolved: all.filter(r => r.status === 'resolved').length,
      activeRules: rules.filter(r => r.enabled).length,
    }
  }, [refreshKey, rules])

  const openCreate = () => {
    const defaultMetric = ALERT_METRICS[0]
    setFormData({
      name: '',
      metricType: defaultMetric.type,
      operator: defaultMetric.defaultOperator,
      threshold: defaultMetric.exampleThreshold,
      level: 'warning',
      enabled: true,
    })
    setEditingRule(null)
    setFormError('')
    setShowRuleDialog(true)
  }

  const openEdit = (rule: AlertRule) => {
    setFormData({
      id: rule.id,
      name: rule.name,
      metricType: rule.metricType,
      operator: rule.operator,
      threshold: rule.threshold,
      filterValue: rule.filterValue,
      filterLabel: rule.filterLabel,
      consecutiveDays: rule.consecutiveDays,
      level: rule.level,
      enabled: rule.enabled,
    })
    setEditingRule(rule)
    setFormError('')
    setShowRuleDialog(true)
  }

  const handleRunCheck = () => {
    runAlertCheck()
    setRefreshKey(k => k + 1)
    if (onUnreadChange) onUnreadChange(getUnreadAlertCount())
  }

  const validateForm = (): string => {
    if (!formData.name.trim()) return '请输入规则名称'
    if (!formData.metricType) return '请选择预警指标'
    if (isNaN(formData.threshold) || formData.threshold < 0) return '请输入有效的阈值'
    if (formData.consecutiveDays !== undefined && (isNaN(formData.consecutiveDays) || formData.consecutiveDays < 1)) return '连续天数必须是大于等于1的正整数'
    if (formData.metricType === 'member_inactive_days' && !formData.filterValue) return '请选择会员等级'
    if (formData.metricType === 'space_usage_rate' && !formData.filterValue) return '请选择场地类型'
    if (formData.metricType === 'tag_member_count' && !formData.filterValue) return '请选择标签'
    return ''
  }

  const handleSubmit = () => {
    const err = validateForm()
    if (err) {
      setFormError(err)
      return
    }
    if (editingRule) {
      updateAlertRule(editingRule.id, {
        name: formData.name,
        metricType: formData.metricType,
        operator: formData.operator,
        threshold: Number(formData.threshold),
        filterValue: formData.filterValue,
        filterLabel: formData.filterLabel,
        consecutiveDays: formData.consecutiveDays,
        level: formData.level,
        enabled: formData.enabled,
      })
    } else {
      createAlertRule({
        name: formData.name,
        metricType: formData.metricType,
        operator: formData.operator,
        threshold: Number(formData.threshold),
        filterValue: formData.filterValue,
        filterLabel: formData.filterLabel,
        consecutiveDays: formData.consecutiveDays,
        level: formData.level,
        enabled: formData.enabled,
      })
    }
    setShowRuleDialog(false)
    setRefreshKey(k => k + 1)
    if (onUnreadChange) onUnreadChange(getUnreadAlertCount())
  }

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteAlertRule(deleteConfirm)
      setDeleteConfirm(null)
      setRefreshKey(k => k + 1)
    }
  }

  const handleToggle = (id: string) => {
    toggleAlertRuleEnabled(id)
    setRefreshKey(k => k + 1)
  }

  const handleMarkRead = (id: string) => {
    markAlertRead(id)
    setRefreshKey(k => k + 1)
    if (onUnreadChange) onUnreadChange(getUnreadAlertCount())
  }

  const handleMarkAllRead = () => {
    markAllAlertsRead()
    setRefreshKey(k => k + 1)
    if (onUnreadChange) onUnreadChange(0)
  }

  const handleResolve = () => {
    if (showResolveDialog) {
      resolveAlert(showResolveDialog.id, resolveNote.trim() || undefined)
      setShowResolveDialog(null)
      setResolveNote('')
      setRefreshKey(k => k + 1)
      if (onUnreadChange) onUnreadChange(getUnreadAlertCount())
    }
  }

  const onMetricTypeChange = (type: AlertMetricType) => {
    const metric = ALERT_METRICS.find(m => m.type === type)!
    setFormData(d => ({
      ...d,
      metricType: type,
      operator: metric.defaultOperator,
      threshold: metric.exampleThreshold,
      filterValue: metric.applicableFilters?.[0],
      filterLabel: metric.applicableFilters?.[0],
    }))
  }

  const filterOptions = useMemo(() => {
    if (formData.metricType === 'member_inactive_days') {
      const levels: MemberLevel[] = ['钻石', '金卡', '银卡', '普通']
      return [{ value: '全部', label: '全部等级' }, ...levels.map(l => ({ value: l, label: `${l}会员` }))]
    }
    if (formData.metricType === 'space_usage_rate') {
      const spaces: ConsumptionCategory[] = ['餐饮', '酒水', 'SPA', '棋牌', '客房']
      return spaces.map(s => ({ value: s, label: `${s}场地` }))
    }
    if (formData.metricType === 'tag_member_count') {
      return tags.map(t => ({ value: t.id, label: t.name }))
    }
    return []
  }, [formData.metricType, tags])

  const getLevelBadge = (level: AlertRule['level']) => {
    const opt = LEVEL_OPTIONS.find(o => o.value === level)!
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', opt.bg, opt.color)}>
        {level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : level === 'warning' ? <AlertCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
        {opt.label}
      </span>
    )
  }

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'unread':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><Bell className="w-3 h-3" />未读</span>
      case 'read':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />已读</span>
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />已处理</span>
    }
  }

  const renderFilterOptions = () => {
    if (filterOptions.length === 0) return null
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">适用范围</label>
        <select
          value={formData.filterValue || ''}
          onChange={e => {
            const opt = filterOptions.find(o => o.value === e.target.value)
            setFormData(d => ({ ...d, filterValue: e.target.value, filterLabel: opt?.label }))
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">请选择</option>
          {filterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  const ruleTableColumns = [
    { key: 'name', title: '规则名称', sortable: true, width: 200, render: (v: string, r: AlertRule) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">{v}</span>
        {!r.enabled && <span className="text-xs text-gray-400">已停用</span>}
      </div>
    ) },
    { key: 'metricType', title: '预警指标', sortable: false, width: 140, render: (v: AlertMetricType) => (
      <span className="text-xs text-gray-600">{ALERT_METRICS.find(m => m.type === v)?.name || v}</span>
    ) },
    { key: 'condition', title: '触发条件', sortable: false, width: 140, render: (_: unknown, r: AlertRule) => {
      const m = ALERT_METRICS.find(x => x.type === r.metricType)
      return (
        <div className="text-xs text-gray-700">
          <span className="font-medium">{operatorTextMap[r.operator]} {r.threshold}</span>
          <span className="text-gray-500 ml-1">{m?.unit}</span>
          {r.consecutiveDays ? <span className="text-gray-500 ml-1">连续 {r.consecutiveDays} 天</span> : null}
        </div>
      )
    } },
    { key: 'filterLabel', title: '适用范围', sortable: false, width: 100, render: (v?: string) => (
      <span className="text-xs text-gray-500">{v || '全局'}</span>
    ) },
    { key: 'level', title: '级别', sortable: false, width: 80, render: (v: AlertRule['level']) => getLevelBadge(v) },
    { key: 'enabled', title: '状态', sortable: false, width: 80, render: (v: boolean) => (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', v ? 'text-green-600' : 'text-gray-400')}>
        <span className={cn('w-2 h-2 rounded-full', v ? 'bg-green-500' : 'bg-gray-300')} />
        {v ? '运行中' : '已停止'}
      </span>
    ) },
    { key: 'lastTriggeredAt', title: '最近触发', sortable: false, width: 120, render: (v?: string) => (
      <span className="text-xs text-gray-500">{v || '—'}</span>
    ) },
    { key: 'actions', title: '操作', sortable: false, width: 180, render: (_: unknown, row: AlertRule) => (
      <div className="flex items-center gap-1">
        <button onClick={() => handleToggle(row.id)} className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
          row.enabled ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'
        )} title={row.enabled ? '停用' : '启用'}>
          <Power className="w-3.5 h-3.5" />
          {row.enabled ? '停用' : '启用'}
        </button>
        <button onClick={() => openEdit(row)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" title="编辑">
          <Edit2 className="w-3.5 h-3.5" />
          编辑
        </button>
        <button onClick={() => setDeleteConfirm(row.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors" title="删除">
          <Trash2 className="w-3.5 h-3.5" />
          删除
        </button>
      </div>
    ) },
  ]

  const recordTableColumns = [
    { key: 'level', title: '级别', sortable: false, width: 80, render: (v: AlertRule['level']) => getLevelBadge(v) },
    { key: 'ruleName', title: '规则名称', sortable: false, width: 160, render: (v: string) => (
      <span className="text-sm font-medium text-gray-800">{v}</span>
    ) },
    { key: 'message', title: '告警详情', sortable: false, width: 320, render: (v: string, r: AlertRecord) => (
      <div>
        <div className="text-sm text-gray-700 line-clamp-1">{v}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          当前值: {r.value} / 阈值: {r.threshold}
        </div>
      </div>
    ) },
    { key: 'triggeredAt', title: '触发时间', sortable: true, width: 140, render: (v: string) => (
      <div className="text-xs text-gray-600">
        <div className="font-medium">{v.split(' ')[0]}</div>
        <div className="text-gray-400">{v.split(' ')[1]}</div>
      </div>
    ) },
    { key: 'status', title: '状态', sortable: false, width: 80, render: (v: AlertStatus) => getStatusBadge(v) },
    { key: 'actions', title: '操作', sortable: false, width: 200, render: (_: unknown, row: AlertRecord) => (
      <div className="flex items-center gap-1">
        {row.status === 'unread' && (
          <button onClick={() => handleMarkRead(row.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
            <Check className="w-3.5 h-3.5" />
            标已读
          </button>
        )}
        {row.status !== 'resolved' && (
          <button onClick={() => {
            setShowResolveDialog(row)
            setResolveNote('')
          }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" />
            处理
          </button>
        )}
      </div>
    ) },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="未读预警"
          value={stats.unread.toString()}
          icon={<Bell className={cn('w-6 h-6', stats.unread > 0 ? 'text-red-600' : '')} />}
          trend={stats.unread > 0 ? '需关注' : '无'}
          trendUp={stats.unread === 0}
        />
        <MetricCard
          title="已读待处理"
          value={stats.read.toString()}
          icon={<Clock className="w-6 h-6" />}
          trend="处理中"
          trendUp={true}
        />
        <MetricCard
          title="本月已处理"
          value={stats.resolved.toString()}
          icon={<CheckCircle className="w-6 h-6" />}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="运行中规则"
          value={`${stats.activeRules}/${rules.length}`}
          icon={<Zap className="w-6 h-6" />}
          trend="自动检测中"
          trendUp={true}
        />
      </motion.div>

      <Card>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'rules' as const, label: '预警规则', icon: <Gauge className="w-4 h-4" /> },
              { key: 'records' as const, label: '告警记录', icon: <Bell className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'records' && (
              <>
                <select
                  value={recordStatusFilter}
                  onChange={e => setRecordStatusFilter(e.target.value as typeof recordStatusFilter)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {stats.unread > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                    <Check className="w-4 h-4" />
                    全部标已读
                  </Button>
                )}
              </>
            )}
            <Button variant="secondary" size="sm" onClick={handleRunCheck}>
              <Activity className="w-4 h-4" />
              立即检测
            </Button>
            {activeTab === 'rules' && (
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4" />
                新建规则
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'rules' ? (
          rules.length > 0 ? (
            <Table
              data={rules}
              columns={ruleTableColumns as any}
            />
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Gauge className="w-12 h-12 text-gray-300 mb-3" />
              <div className="text-base font-medium text-gray-700">暂无预警规则</div>
              <div className="text-sm text-gray-500 mt-1">点击「新建规则」开始设置关键指标监控</div>
            </div>
          )
        ) : (
          allRecords.length > 0 ? (
            <Table
              data={allRecords}
              columns={recordTableColumns as any}
            />
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <div className="text-base font-medium text-gray-700">暂无告警记录</div>
              <div className="text-sm text-gray-500 mt-1">检测到阈值触发时会自动生成告警</div>
            </div>
          )
        )}
      </Card>

      <AnimatePresence>
        {showRuleDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRuleDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                  {editingRule ? '编辑预警规则' : '新建预警规则'}
                </h3>
                <button onClick={() => setShowRuleDialog(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {formError && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{formError}</div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">规则名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                    placeholder="如：钻石会员流失预警"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">预警指标</label>
                  <select
                    value={formData.metricType}
                    onChange={e => onMetricTypeChange(e.target.value as AlertMetricType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ALERT_METRICS.map(m => (
                      <option key={m.type} value={m.type}>{m.name}（{m.description}）</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">比较条件</label>
                    <select
                      value={formData.operator}
                      onChange={e => setFormData(d => ({ ...d, operator: e.target.value as AlertConditionOperator }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {OPERATOR_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      阈值 {selectedMetric ? `（${selectedMetric.unit}）` : ''}
                    </label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={e => setFormData(d => ({ ...d, threshold: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    连续天数（可选，不填则满足条件立即触发）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.consecutiveDays ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value)
                      setFormData(d => ({ ...d, consecutiveDays: val }))
                    }}
                    placeholder="如：7 表示需连续7天都满足条件才触发"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {renderFilterOptions()}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">告警级别</label>
                  <div className="flex items-center gap-2">
                    {LEVEL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(d => ({ ...d, level: opt.value }))}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-colors flex items-center justify-center gap-1',
                          formData.level === opt.value
                            ? `${opt.bg} ${opt.color} border-current`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {opt.value === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                         opt.value === 'warning' ? <AlertCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={e => setFormData(d => ({ ...d, enabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  保存后立即启用
                </label>
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowRuleDialog(false)}>取消</Button>
                <Button variant="primary" onClick={handleSubmit}>
                  {editingRule ? '保存修改' : '创建规则'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showResolveDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResolveDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  标记为已处理
                </h3>
                <button onClick={() => setShowResolveDialog(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  {getLevelBadge(showResolveDialog.level)}
                  <div className="text-sm text-gray-800 mt-2">{showResolveDialog.ruleName}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{showResolveDialog.message}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">处理备注（可选）</label>
                  <textarea
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    placeholder="输入处理措施说明..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowResolveDialog(null)}>取消</Button>
                <Button variant="primary" onClick={handleResolve}>
                  <Check className="w-4 h-4" />
                  确认处理
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">删除预警规则</h3>
                <p className="text-sm text-gray-500 mt-1">删除后将不再触发相关告警，确定继续？</p>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>取消</Button>
                <Button variant="danger" onClick={handleDelete}>确认删除</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
