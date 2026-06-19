import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import {
  X, User, Phone, Calendar, Crown, Star, Clock, DollarSign,
  ShoppingBag, Tag, TrendingUp, AlertTriangle, Activity, Users
} from 'lucide-react'
import type { EChartsOption } from 'echarts'
import { cn } from '@/lib/utils'
import { chartTheme } from '@/utils/chartTheme'
import dayjs from 'dayjs'
import type { Member, RFMScore, MemberSegment } from '@/types/member'
import type { ConsumptionRecord } from '@/types/consumption'
import type { MemberTag } from '@/types/tag'
import {
  generateMembers, generateRFMScores, getMemberConsumptionHistory
} from '@/services/mock/members'
import { getAllTags, getMemberTags } from '@/services/mock/tags'

interface MemberDetailPanelProps {
  memberId: string | null
  onClose: () => void
}

const segmentIcons: Record<string, React.ElementType> = {
  '高价值会员': Crown,
  '潜力会员': Star,
  '重要深耕': TrendingUp,
  '重要唤回': AlertTriangle,
  '沉睡会员': Clock,
  '流失会员': Users,
}

const segmentColors: Record<MemberSegment, string> = {
  '高价值会员': 'from-yellow-400 to-amber-500',
  '潜力会员': 'from-blue-400 to-cyan-500',
  '重要深耕': 'from-purple-400 to-violet-500',
  '重要唤回': 'from-orange-400 to-red-500',
  '一般会员': 'from-gray-400 to-slate-500',
  '沉睡会员': 'from-slate-400 to-gray-500',
  '流失会员': 'from-gray-500 to-zinc-600',
  '新会员': 'from-green-400 to-emerald-500',
}

const getRiskStyle = (risk: string) => {
  switch (risk) {
    case '极低风险':
    case '低风险':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    case '中风险':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
    case '高风险':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
    case '极高风险':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  }
}

export default function MemberDetailPanel({ memberId, onClose }: MemberDetailPanelProps) {
  const memberData = useMemo(() => {
    if (!memberId) return null
    const members = generateMembers()
    const rfmScores = generateRFMScores()
    const member = members.find(m => m.id === memberId)
    if (!member) return null
    const rfm = rfmScores.find(r => r.memberId === memberId)
    const history = getMemberConsumptionHistory(memberId)
    const tagIds = getMemberTags(memberId)
    const allTags = getAllTags()
    const tags = tagIds.map(tid => allTags.find(t => t.id === tid)).filter(Boolean) as MemberTag[]
    return { member, rfm, history, tags }
  }, [memberId])

  const member = memberData?.member
  const rfm = memberData?.rfm
  const history = memberData?.history || []
  const tags = memberData?.tags || []

  const spendingTrendOption = useMemo((): EChartsOption => {
    if (!memberId || history.length === 0) {
      return {
        ...chartTheme,
        title: { text: '暂无消费数据', left: 'center', top: 'center', textStyle: { fontSize: 12, color: '#9ca3af' } },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      }
    }

    const monthlyMap = new Map<string, number>()
    history.forEach(rec => {
      const ym = dayjs(rec.date).format('YYYY-MM')
      monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + rec.amount)
    })

    const sortedKeys = Array.from(monthlyMap.keys()).sort().slice(-12)
    const values = sortedKeys.map(k => Math.round(monthlyMap.get(k) || 0))
    const labels = sortedKeys.map(k => k.substring(5))

    return {
      grid: { left: 40, right: 20, top: 30, bottom: 25 },
      title: {
        text: '近12月消费趋势 (元)',
        left: 'left',
        textStyle: { fontSize: 12, fontWeight: 600, color: '#374151' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => `${params[0].axisValue}月: ¥${params[0].value.toLocaleString()}`,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 10, color: '#6b7280' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: '#6b7280', formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: chartTheme.primary },
          itemStyle: { color: chartTheme.primary },
          areaStyle: {
            opacity: 0.2,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: chartTheme.primary },
                { offset: 1, color: 'transparent' },
              ],
            },
          },
        },
      ],
    }
  }, [history, memberId])

  const categoryPieOption = useMemo((): EChartsOption => {
    if (!memberId || history.length === 0) {
      return {
        title: { text: '暂无消费数据', left: 'center', top: 'center', textStyle: { fontSize: 12, color: '#9ca3af' } },
        series: [],
      }
    }

    const catMap = new Map<string, number>()
    history.forEach(rec => {
      catMap.set(rec.category, (catMap.get(rec.category) || 0) + rec.amount)
    })

    const colorMap: Record<string, string> = {
      '餐饮': '#F97316', '酒水': '#8B5CF6', 'SPA': '#10B981',
      '棋牌': '#3B82F6', '客房': '#EF4444',
    }

    return {
      grid: { top: 30 },
      title: {
        text: '消费类目占比',
        left: 'left',
        textStyle: { fontSize: 12, fontWeight: 600, color: '#374151' },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ¥${params.value.toLocaleString()} (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        right: 5,
        top: 25,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10, color: '#6b7280' },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '58%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: Array.from(catMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value),
            itemStyle: { color: colorMap[name] || chartTheme.primary },
          })),
        },
      ],
    }
  }, [history, memberId])

  const totalSpend = history.reduce((s, r) => s + r.amount, 0)
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => {
      const dateDiff = dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      if (dateDiff !== 0) return dateDiff
      return b.time.localeCompare(a.time)
    }),
    [history]
  )
  const recentRecords = sortedHistory.slice(0, 8)
  const lastConsumeDate = sortedHistory.length > 0
    ? sortedHistory[0].date
    : member?.joinDate || ''
  const daysSinceLastVisit = lastConsumeDate
    ? dayjs().diff(dayjs(lastConsumeDate), 'day')
    : 0
  const visitCount = member?.visitCount || 0
  const avgPerVisit = visitCount > 0
    ? Math.round(totalSpend / visitCount)
    : 0

  if (!member || !memberId) {
    return null
  }

  return (
    <AnimatePresence>
      {memberId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md flex-shrink-0 ring-2 ring-white">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{member.name}</h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      member.level === '钻石' ? 'bg-cyan-100 text-cyan-700'
                        : member.level === '金卡' ? 'bg-yellow-100 text-yellow-700'
                        : member.level === '银卡' ? 'bg-gray-200 text-gray-700'
                        : 'bg-white text-gray-600 border border-gray-200'
                    )}>
                      {member.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{member.id}</span>
                    <span>·</span>
                    <span>{member.gender} {member.age}岁</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-5 bg-gray-50 border-b border-gray-100">
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    累计消费
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ¥{(rfm?.consumeAmount || member.totalSpend).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    到店次数
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {visitCount}
                    <span className="text-xs font-normal text-gray-500 ml-1">次</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    距上次到店
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {daysSinceLastVisit}
                    <span className="text-xs font-normal text-gray-500 ml-1">天前</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    次均消费
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ¥{avgPerVisit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  RFM 综合评分
                </h4>
                {rfm && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-medium bg-gradient-to-r',
                            segmentColors[rfm.segment as MemberSegment] || 'from-gray-400 to-slate-500'
                          )}>
                            {(() => {
                              const Icon = segmentIcons[rfm.segment] || Users
                              return <Icon className="w-3 h-3" />
                            })()}
                            {rfm.segment}
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getRiskStyle(rfm.riskLevel).bg,
                            getRiskStyle(rfm.riskLevel).text,
                            getRiskStyle(rfm.riskLevel).border,
                          )}>
                            {rfm.riskLevel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">{rfm.totalScore}</div>
                        <div className="text-[10px] text-gray-500">总分 15</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '最近消费 (R)', score: rfm.recency, desc: `${rfm.lastConsumeDays}天` },
                        { label: '到店频次 (F)', score: rfm.frequency, desc: `${visitCount}次` },
                        { label: '消费金额 (M)', score: rfm.monetary, desc: `¥${(rfm.consumeAmount / 1000).toFixed(1)}k` },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <div className="text-[10px] text-gray-500 mb-0.5">{item.label}</div>
                          <div className="text-lg font-bold text-indigo-600 leading-none">{item.score}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" />
                  基本信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>入会 {member.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>最近到店: {lastConsumeDate || member.lastVisit} ({daysSinceLastVisit}天前)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    会员标签
                  </div>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium"
                          style={{ backgroundColor: t.color }}
                        >
                          <Tag className="w-3 h-3" />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">暂无标签</div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  消费分析
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <ReactECharts option={spendingTrendOption} style={{ height: 160 }} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <ReactECharts option={categoryPieOption} style={{ height: 180 }} />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  最近消费记录
                  <span className="text-xs font-normal text-gray-500 ml-1">（共 {history.length} 条，按时间倒序）</span>
                </h4>
                {recentRecords.length > 0 ? (
                  <div className="space-y-2">
                    {recentRecords.map(rec => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">{rec.category}</span>
                            <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                              {rec.subCategory}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{rec.date}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{rec.time}</span>
                            <span className="ml-1 truncate">· {rec.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-bold text-gray-900">
                            ¥{rec.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400">{rec.weekday}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    暂无消费记录
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-gray-500">
                到店 {visitCount} 次 · 消费记录 {history.length} 条 · 累计 ¥{totalSpend.toLocaleString()}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
