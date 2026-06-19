import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { GitCompareArrows, Users, ShoppingBag, Clock, DollarSign, TrendingUp, Crown, Tag, Ban } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import { generateMembers, generateConsumptionRecords } from '@/services/mock/members'
import { getAllTags } from '@/services/mock/tags'
import { categoryColors } from '@/services/mock/consumption'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import type { ConsumptionCategory } from '@/types/consumption'

type Dimension = 'level' | 'tag'

interface GroupStats {
  label: string
  color: string
  memberCount: number
  totalSpend: number
  avgSpendPerMember: number
  avgOrderValue: number
  avgVisitCount: number
  avgMonthlyVisits: number
  recordCount: number
  categoryAmount: Record<ConsumptionCategory, number>
  categoryPercentage: Record<ConsumptionCategory, number>
  topCategory: ConsumptionCategory | null
  avgLastVisitDays: number
}

const ALL_CATEGORIES: ConsumptionCategory[] = ['餐饮', '酒水', 'SPA', '棋牌', '客房']

const GROUP_A_COLOR = '#6366F1'
const GROUP_B_COLOR = '#F59E0B'

function computeGroupStats(
  label: string,
  color: string,
  memberIds: string[]
): GroupStats {
  const members = generateMembers()
  const records = generateConsumptionRecords()
  const idSet = new Set(memberIds)
  const groupMembers = members.filter(m => idSet.has(m.id))
  const groupRecords = records.filter(r => idSet.has(r.memberId))

  const memberCount = groupMembers.length
  const totalSpend = groupRecords.reduce((s, r) => s + r.amount, 0)
  const totalVisits = groupMembers.reduce((s, m) => s + m.visitCount, 0)
  const recordCount = groupRecords.length

  const categoryAmount = ALL_CATEGORIES.reduce((acc, c) => {
    acc[c] = 0
    return acc
  }, {} as Record<ConsumptionCategory, number>)

  groupRecords.forEach(r => {
    categoryAmount[r.category] += r.amount
  })

  const categoryPercentage = ALL_CATEGORIES.reduce((acc, c) => {
    acc[c] = totalSpend > 0 ? parseFloat(((categoryAmount[c] / totalSpend) * 100).toFixed(1)) : 0
    return acc
  }, {} as Record<ConsumptionCategory, number>)

  const topCategory = memberCount > 0 && totalSpend > 0
    ? ALL_CATEGORIES.reduce<ConsumptionCategory | null>((top, c) => {
        if (!top || categoryAmount[c] > categoryAmount[top]) return c
        return top
      }, null)
    : null

  const avgLastVisitDays = memberCount > 0
    ? Math.round(groupMembers.reduce((s, m) => s + dayjs().diff(dayjs(m.lastVisit), 'day'), 0) / memberCount)
    : 0

  return {
    label,
    color,
    memberCount,
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    avgSpendPerMember: memberCount > 0 ? Math.round(totalSpend / memberCount) : 0,
    avgOrderValue: recordCount > 0 ? Math.round(totalSpend / recordCount) : 0,
    avgVisitCount: memberCount > 0 ? parseFloat((totalVisits / memberCount).toFixed(1)) : 0,
    avgMonthlyVisits: memberCount > 0 ? parseFloat((totalVisits / memberCount / 12).toFixed(1)) : 0,
    recordCount,
    categoryAmount,
    categoryPercentage,
    topCategory,
    avgLastVisitDays,
  }
}

export default function GroupComparison() {
  const [dimension, setDimension] = useState<Dimension>('level')
  const [mutexMode, setMutexMode] = useState(true)
  const members = useMemo(() => generateMembers(), [])
  const tags = useMemo(() => getAllTags(), [])

  const levelOptions = useMemo(() => ['钻石', '金卡', '银卡', '普通'], [])
  const tagOptions = useMemo(() => tags, [tags])

  const [groupAValue, setGroupAValue] = useState<string>('钻石')
  const [groupBValue, setGroupBValue] = useState<string>('金卡')

  const resolveMemberIds = (value: string, isGroupB: boolean = false): string[] => {
    let ids: string[]
    if (dimension === 'level') {
      ids = members.filter(m => m.level === value).map(m => m.id)
    } else {
      ids = members.filter(m => m.tags.includes(value)).map(m => m.id)
    }
    if (isGroupB && mutexMode) {
      const aIds = new Set<string>(resolveMemberIds(groupAValue, false))
      ids = ids.filter(id => !aIds.has(id))
    }
    return ids
  }

  const resolveLabel = (value: string): string => {
    if (dimension === 'level') return `${value}会员`
    const tag = tags.find(t => t.id === value)
    return tag ? tag.name : value
  }

  const resolveColor = (value: string): string => {
    if (dimension === 'level') {
      const map: Record<string, string> = {
        '钻石': '#06B6D4', '金卡': '#F59E0B', '银卡': '#9CA3AF', '普通': '#6B7280',
      }
      return map[value] || GROUP_A_COLOR
    }
    const tag = tags.find(t => t.id === value)
    return tag?.color || GROUP_A_COLOR
  }

  const statsA = useMemo(() => {
    return computeGroupStats(resolveLabel(groupAValue), resolveColor(groupAValue), resolveMemberIds(groupAValue, false))
  }, [groupAValue, dimension, members, tags, mutexMode])

  const statsB = useMemo(() => {
    const label = resolveLabel(groupBValue) + (mutexMode && dimension === 'tag' ? '（不含A组）' : '')
    return computeGroupStats(label, resolveColor(groupBValue), resolveMemberIds(groupBValue, true))
  }, [groupBValue, groupAValue, dimension, members, tags, mutexMode])

  const handleDimensionChange = (dim: Dimension) => {
    setDimension(dim)
    if (dim === 'level') {
      setGroupAValue('钻石')
      setGroupBValue('金卡')
    } else {
      setGroupAValue(tagOptions[0]?.id || '')
      setGroupBValue(tagOptions[1]?.id || '')
    }
  }

  const isSameGroup = dimension === 'level'
    ? groupAValue === groupBValue
    : groupAValue === groupBValue

  const metricRows = useMemo(() => {
    const fmt = (a: number, b: number, isCurrency: boolean, unit: string = '') => {
      const diff = a - b
      const pct = b !== 0 ? ((diff / b) * 100) : 0
      return {
        aText: isCurrency ? `¥${a.toLocaleString()}` : `${a}${unit}`,
        bText: isCurrency ? `¥${b.toLocaleString()}` : `${b}${unit}`,
        diff,
        diffText: isCurrency
          ? `${diff >= 0 ? '+' : ''}¥${Math.abs(diff).toLocaleString()}`
          : `${diff >= 0 ? '+' : ''}${Math.abs(diff).toFixed(1)}${unit}`,
        pct: parseFloat(pct.toFixed(1)),
        aHigher: diff > 0,
        bHigher: diff < 0,
      }
    }

    return [
      {
        key: 'avgOrderValue',
        label: '平均客单价',
        icon: <ShoppingBag className="w-4 h-4" />,
        ...fmt(statsA.avgOrderValue, statsB.avgOrderValue, true),
      },
      {
        key: 'avgSpendPerMember',
        label: '人均消费',
        icon: <DollarSign className="w-4 h-4" />,
        ...fmt(statsA.avgSpendPerMember, statsB.avgSpendPerMember, true),
      },
      {
        key: 'avgMonthlyVisits',
        label: '月均到店频次',
        icon: <Clock className="w-4 h-4" />,
        ...fmt(statsA.avgMonthlyVisits, statsB.avgMonthlyVisits, false, '次'),
      },
      {
        key: 'avgVisitCount',
        label: '累计到店次数',
        icon: <TrendingUp className="w-4 h-4" />,
        ...fmt(statsA.avgVisitCount, statsB.avgVisitCount, false, '次'),
      },
      {
        key: 'totalSpend',
        label: '群体累计消费',
        icon: <DollarSign className="w-4 h-4" />,
        ...fmt(statsA.totalSpend, statsB.totalSpend, true),
      },
      {
        key: 'memberCount',
        label: '会员人数',
        icon: <Users className="w-4 h-4" />,
        ...fmt(statsA.memberCount, statsB.memberCount, false, '人'),
      },
      {
        key: 'avgLastVisitDays',
        label: '平均距上次到店',
        icon: <Clock className="w-4 h-4" />,
        ...fmt(statsA.avgLastVisitDays, statsB.avgLastVisitDays, false, '天'),
      },
    ]
  }, [statsA, statsB])

  const categoryCompareOption = useMemo((): EChartsOption => {
    if (statsA.memberCount === 0 && statsB.memberCount === 0) {
      return {
        title: {
          text: '消费类目金额对比',
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 600 },
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'center',
          style: { text: '两个群体均无数据', fontSize: 12, fill: '#9ca3af' },
        },
        series: [],
      }
    }
    return {
      title: {
        text: '消费类目金额对比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`
          })
          return result
        },
      },
      legend: { top: 28, data: [statsA.label, statsB.label] },
      grid: { top: 70, left: '3%', right: '4%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ALL_CATEGORIES,
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '消费金额(元)',
        axisLabel: { formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
      },
      series: [
        {
          name: statsA.label,
          type: 'bar',
          data: ALL_CATEGORIES.map(c => Math.round(statsA.categoryAmount[c])),
          itemStyle: { color: statsA.color, borderRadius: [4, 4, 0, 0] },
          barGap: '10%',
        },
        {
          name: statsB.label,
          type: 'bar',
          data: ALL_CATEGORIES.map(c => Math.round(statsB.categoryAmount[c])),
          itemStyle: { color: statsB.color, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }
  }, [statsA, statsB])

  const buildPieOption = (stats: GroupStats, sideLabel: string): EChartsOption => {
    if (stats.memberCount === 0 || stats.totalSpend === 0) {
      return {
        title: {
          text: sideLabel,
          subtext: `${stats.label}\n暂无消费数据`,
          left: 'center',
          top: '40%',
          textStyle: { fontSize: 13, fontWeight: 600, color: stats.color },
          subtextStyle: { fontSize: 11, color: '#9ca3af', lineHeight: 18 },
        },
        series: [],
      }
    }
    return {
      title: {
        text: sideLabel,
        subtext: stats.label,
        left: 'center',
        textStyle: { fontSize: 13, fontWeight: 600, color: stats.color },
        subtextStyle: { fontSize: 11, color: '#6b7280' },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ¥${params.value.toLocaleString()} (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['62%', '55%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
          data: ALL_CATEGORIES.map(c => ({
            name: c,
            value: Math.round(stats.categoryAmount[c]),
            itemStyle: { color: categoryColors[c] },
          })),
        },
      ],
    }
  }

  const pieOptionA = useMemo(() => buildPieOption(statsA, '群体 A'), [statsA])
  const pieOptionB = useMemo(() => buildPieOption(statsB, '群体 B'), [statsB])

  const summaryInsight = useMemo(() => {
    if (isSameGroup) return null
    if (statsA.memberCount === 0 || statsB.memberCount === 0) return null
    const higherAvgOrder = statsA.avgOrderValue > statsB.avgOrderValue ? statsA : statsB
    const higherVisit = statsA.avgMonthlyVisits > statsB.avgMonthlyVisits ? statsA : statsB
    const lines: string[] = []
    lines.push(`${higherAvgOrder.label} 的平均客单价更高（¥${higherAvgOrder.avgOrderValue.toLocaleString()}），单次消费能力更强。`)
    lines.push(`${higherVisit.label} 的月均到店频次更高（${higherVisit.avgMonthlyVisits}次），活跃度更高。`)
    if (statsA.topCategory && statsB.topCategory) {
      if (statsA.topCategory === statsB.topCategory) {
        lines.push(`两个群体最偏好的消费类目相同，均为「${statsA.topCategory}」。`)
      } else {
        lines.push(`群体偏好差异明显：${statsA.label}偏好「${statsA.topCategory}」，${statsB.label}偏好「${statsB.topCategory}」。`)
      }
    }
    return lines
  }, [statsA, statsB, isSameGroup])

  const renderGroupSelector = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    accent: string
  ) => (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      {dimension === 'level' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {levelOptions.map(opt => (
            <option key={opt} value={opt}>{opt}会员</option>
          ))}
        </select>
      ) : (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white max-w-[160px]"
        >
          {tagOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">群体对比模式</h3>
                <p className="text-xs text-gray-500 mt-0.5">选择两个群体并排对比消费差异，差异一目了然</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDimensionChange('level')}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-all',
                    dimension === 'level' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Crown className="w-3.5 h-3.5" />
                  按等级
                </button>
                <button
                  onClick={() => handleDimensionChange('tag')}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-all',
                    dimension === 'tag' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Tag className="w-3.5 h-3.5" />
                  按标签
                </button>
              </div>
              {dimension === 'tag' && (
                <label className="inline-flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={mutexMode}
                    onChange={e => setMutexMode(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 font-medium">互斥处理</span>
                  <span className="text-gray-400">（B组不含A组）</span>
                </label>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderGroupSelector('群体 A', groupAValue, setGroupAValue, GROUP_A_COLOR)}
            {renderGroupSelector('群体 B', groupBValue, setGroupBValue, GROUP_B_COLOR)}
          </div>

          {isSameGroup && (
            <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              提示：两个群体选择了相同的项，请选择不同的群体以查看差异对比。
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[statsA, statsB].map((stats, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stats.color }}
                  />
                  <h3 className="text-lg font-bold text-gray-900">{stats.label}</h3>
                  <span className="text-xs text-gray-400">群体 {idx === 0 ? 'A' : 'B'}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                  {stats.memberCount} 人
                </span>
              </div>

              {stats.memberCount === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Ban className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-1">该群体暂无会员</div>
                  <div className="text-xs text-gray-400">
                    {mutexMode && dimension === 'tag' && idx === 1
                      ? '互斥模式下，B组已排除所有属于A组的会员，当前没有符合条件的会员'
                      : '当前选择的群体中没有会员数据'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        平均客单价
                      </div>
                      <div className="text-lg font-bold" style={{ color: stats.color }}>
                        ¥{stats.avgOrderValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        月均到店
                      </div>
                      <div className="text-lg font-bold" style={{ color: stats.color }}>
                        {stats.avgMonthlyVisits}<span className="text-xs font-normal text-gray-500 ml-1">次</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        人均消费
                      </div>
                      <div className="text-lg font-bold" style={{ color: stats.color }}>
                        ¥{stats.avgSpendPerMember.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        累计消费
                      </div>
                      <div className="text-lg font-bold" style={{ color: stats.color }}>
                        ¥{stats.totalSpend.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span>偏好类目：</span>
                    {stats.topCategory && (
                      <span
                        className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: categoryColors[stats.topCategory] }}
                      >
                        {stats.topCategory}
                      </span>
                    )}
                    {!stats.topCategory && (
                      <span className="text-gray-400">暂无消费记录</span>
                    )}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <Card title="核心指标差异对比" subtitle="绿色代表群体A更高，橙色代表群体B更高">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">指标</th>
                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: statsA.color }}>
                  {statsA.label}
                </th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">差异</th>
                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: statsB.color }}>
                  {statsB.label}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metricRows.map(row => (
                <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-gray-400">{row.icon}</span>
                      {row.label}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-semibold" style={{ color: row.aHigher ? '#16a34a' : '#6b7280' }}>
                    {row.aText}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      row.diff === 0
                        ? 'bg-gray-100 text-gray-500'
                        : row.aHigher
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                    )}>
                      {row.diff === 0 ? '持平' : (
                        <>
                          {row.aHigher ? '↑' : '↓'} {row.diffText}
                          <span className="opacity-70">({row.pct > 0 ? '+' : ''}{row.pct}%)</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-semibold" style={{ color: row.bHigher ? '#ea580c' : '#6b7280' }}>
                    {row.bText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="群体 A 类目偏好" subtitle="各消费类目金额占比">
          <ReactECharts option={pieOptionA} style={{ height: 300 }} />
        </Card>
        <Card title="群体 B 类目偏好" subtitle="各消费类目金额占比">
          <ReactECharts option={pieOptionB} style={{ height: 300 }} />
        </Card>
      </div>

      <Card title="消费类目金额对比" subtitle="两个群体各消费类目金额并排对比">
        <ReactECharts option={categoryCompareOption} style={{ height: 360 }} />
      </Card>

      {summaryInsight && (
        <Card title="对比洞察" subtitle="基于当前群体对比自动生成的关键发现" icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}>
          <div className="space-y-3">
            {summaryInsight.map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-transparent rounded-xl border border-indigo-100"
              >
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xs">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{line}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
