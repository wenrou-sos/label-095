import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, AlertTriangle, Crown, Star, Clock, DollarSign } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Table from '@/components/ui/Table'
import { getMembersWithRFM, getRFMSummary } from '@/services/mock/members'
import { chartTheme, commonChartOption, getRiskColor } from '@/utils/chartTheme'
import { cn } from '@/lib/utils'
import type { RFMScore, Member, MemberSegment } from '@/types/member'

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

const segmentChartColors: Record<MemberSegment, string> = {
  '高价值会员': '#FFD700',
  '潜力会员': '#1890ff',
  '重要深耕': '#722ed1',
  '重要唤回': '#fa8c16',
  '一般会员': '#8c8c8c',
  '沉睡会员': '#595959',
  '流失会员': '#434343',
  '新会员': '#52c41a',
}

interface RFMAnalysisProps {
  levelFilter?: string
  genderFilter?: string
  ageGroupFilter?: string
  tagFilterIds?: string[]
  tagMatchAll?: boolean
}

export default function RFMAnalysis({ levelFilter, genderFilter, ageGroupFilter, tagFilterIds = [], tagMatchAll = false }: RFMAnalysisProps) {
  const membersWithRFM = useMemo(() => {
    let data = getMembersWithRFM()
    if (levelFilter && levelFilter !== '全部') {
      data = data.filter(m => m.level === levelFilter)
    }
    if (genderFilter && genderFilter !== '全部') {
      data = data.filter(m => m.gender === genderFilter)
    }
    if (ageGroupFilter && ageGroupFilter !== '全部') {
      data = data.filter(m => m.ageGroup === ageGroupFilter)
    }
    if (tagFilterIds.length > 0) {
      data = data.filter(m => {
        if (tagMatchAll) {
          return tagFilterIds.every(tid => m.tags.includes(tid))
        }
        return tagFilterIds.some(tid => m.tags.includes(tid))
      })
    }
    return data
  }, [levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll])

  const rfmSummary = useMemo(() => {
    const summary = getRFMSummary()
    if (membersWithRFM.length === getMembersWithRFM().length) {
      return summary
    }

    const segmentDistribution: Record<string, number> = {}
    let totalScore = 0
    membersWithRFM.forEach(m => {
      segmentDistribution[m.rfm.segment] = (segmentDistribution[m.rfm.segment] || 0) + 1
      totalScore += m.rfm.totalScore
    })

    const allSegments = ['高价值会员', '潜力会员', '重要深耕', '重要唤回', '一般会员', '沉睡会员', '流失会员', '新会员']
    allSegments.forEach(seg => {
      if (!segmentDistribution[seg]) segmentDistribution[seg] = 0
    })

    return {
      totalMembers: membersWithRFM.length,
      avgScore: membersWithRFM.length > 0 ? parseFloat((totalScore / membersWithRFM.length).toFixed(1)) : 0,
      segmentDistribution,
    }
  }, [membersWithRFM])

  const highRiskMembers = useMemo(() => {
    return membersWithRFM
      .filter(m => m.rfm.riskLevel === '极高风险' || m.rfm.riskLevel === '高风险')
      .sort((a, b) => {
        const riskOrder: Record<string, number> = { '极高风险': 0, '高风险': 1, '中风险': 2, '低风险': 3 }
        return riskOrder[a.rfm.riskLevel] - riskOrder[b.rfm.riskLevel] || b.rfm.totalScore - a.rfm.totalScore
      })
      .slice(0, 10)
  }, [membersWithRFM])

  const pieOption = useMemo((): EChartsOption => {
    const data = Object.entries(rfmSummary.segmentDistribution)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))

    return {
      ...commonChartOption(),
      title: {
        text: '会员群体分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '会员群体',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: data.map(item => ({
            ...item,
            itemStyle: {
              color: segmentChartColors[item.name as MemberSegment] || chartTheme.primary,
            },
          })),
        },
      ],
    }
  }, [rfmSummary])

  const heatmapOption = useMemo((): EChartsOption => {
    const rfmList = membersWithRFM.map(m => ({
      recency: m.rfm.lastConsumeDays,
      frequency: m.rfm.consumeFrequency,
      monetary: m.rfm.consumeAmount,
    }))

    const grid = new Map<string, number>()
    rfmList.forEach(rfm => {
      const rScore = rfm.recency <= 7 ? 5 : rfm.recency <= 30 ? 4 : rfm.recency <= 90 ? 3 : rfm.recency <= 180 ? 2 : 1
      const fScore = rfm.frequency <= 1 ? 1 : rfm.frequency <= 3 ? 2 : rfm.frequency <= 5 ? 3 : rfm.frequency <= 10 ? 4 : 5
      const key = `${rScore}-${fScore}`
      grid.set(key, (grid.get(key) || 0) + 1)
    })

    const data: number[][] = []
    for (let r = 1; r <= 5; r++) {
      for (let f = 1; f <= 5; f++) {
        data.push([f - 1, r - 1, grid.get(`${r}-${f}`) || 0])
      }
    }

    return {
      ...commonChartOption(),
      title: {
        text: 'RFM指标分布热力图',
        subtext: '横轴：消费频率评分 纵轴：最近消费评分',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11 },
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [f, r, count] = params.value
          return `最近消费: ${5 - r}分\n消费频率: ${f + 1}分\n会员数: ${count}人`
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '20%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: ['1', '2', '3', '4', '5'],
        name: '消费频率 →',
        nameLocation: 'middle',
        nameGap: 25,
        splitArea: { show: true },
      },
      yAxis: {
        type: 'category',
        data: ['5', '4', '3', '2', '1'],
        name: '← 最近消费',
        nameLocation: 'middle',
        nameGap: 30,
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(d => d[2])),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
        },
      },
      series: [
        {
          name: '会员数量',
          type: 'heatmap',
          data,
          label: {
            show: true,
            fontSize: 12,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }
  }, [membersWithRFM])

  const rfmTrendOption = useMemo((): EChartsOption => {
    const scoreDistribution: Record<number, number> = { 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 }
    membersWithRFM.forEach(m => {
      scoreDistribution[m.rfm.totalScore] = (scoreDistribution[m.rfm.totalScore] || 0) + 1
    })

    return {
      ...commonChartOption(),
      title: {
        text: 'RFM总分分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}分: {c}人',
      },
      xAxis: {
        type: 'category',
        data: Object.keys(scoreDistribution),
        name: 'RFM总分',
      },
      yAxis: {
        type: 'value',
        name: '会员数',
      },
      series: [
        {
          data: Object.values(scoreDistribution),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: chartTheme.primary },
                { offset: 1, color: chartTheme.accent1 },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }
  }, [membersWithRFM])

  const memberTableColumns = [
    { key: 'avatar', label: '', width: 50, render: (row: Member & { rfm: RFMScore }) => <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full" /> },
    { key: 'name', label: '会员姓名' },
    { key: 'level', label: '会员等级', render: (row: Member & { rfm: RFMScore }) => <span className={cn('px-2 py-1 rounded-full text-xs font-medium', row.level === '钻石' ? 'bg-cyan-100 text-cyan-700' : row.level === '金卡' ? 'bg-yellow-100 text-yellow-700' : row.level === '银卡' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-600 border')}>{row.level}</span> },
    { key: 'recency', label: '最近消费(天)', dataIndex: ['rfm', 'lastConsumeDays'] },
    { key: 'frequency', label: '消费频率', dataIndex: ['rfm', 'consumeFrequency'] },
    { key: 'monetary', label: '消费金额(元)', dataIndex: ['rfm', 'consumeAmount'], render: (val: number) => `¥${val.toLocaleString()}` },
    { key: 'totalScore', label: 'RFM评分', dataIndex: ['rfm', 'totalScore'], render: (val: number) => <span className="font-bold text-amber-600">{val}</span> },
    { key: 'segment', label: '会员群体', dataIndex: ['rfm', 'segment'], render: (segment: MemberSegment) => <span className={cn('px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white', segmentColors[segment])}>{segment}</span> },
    { key: 'riskLevel', label: '风险等级', dataIndex: ['rfm', 'riskLevel'], render: (risk: string) => <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${getRiskColor(risk === '极低风险' ? 'critical' : risk === '高风险' ? 'high' : risk === '中风险' ? 'medium' : 'low')}20`, color: getRiskColor(risk === '极低风险' ? 'critical' : risk === '高风险' ? 'high' : risk === '中风险' ? 'medium' : 'low') }}>{risk}</span> },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard title="会员总数" value={rfmSummary.totalMembers.toLocaleString()} icon={<Users className="w-6 h-6" />} trend="+12%" trendUp={true} />
        <MetricCard title="平均RFM评分" value={rfmSummary.avgScore.toString()} icon={<Star className="w-6 h-6" />} trend="优秀" trendUp={true} />
        <MetricCard title="高价值会员" value={rfmSummary.segmentDistribution['高价值会员']?.toLocaleString() || '0'} icon={<Crown className="w-6 h-6" />} trend="占比25%" trendUp={true} />
        <MetricCard title="高风险会员" value={(rfmSummary.segmentDistribution['重要唤回'] + rfmSummary.segmentDistribution['流失会员'] + rfmSummary.segmentDistribution['沉睡会员']).toLocaleString()} icon={<AlertTriangle className="w-6 h-6" />} trend="需关注" trendUp={false} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="会员群体占比分析" subtitle="基于RFM模型的会员细分">
          <ReactECharts option={pieOption} style={{ height: 320 }} />
        </Card>
        <Card title="RFM指标分布热力图" subtitle="最近消费 vs 消费频率">
          <ReactECharts option={heatmapOption} style={{ height: 320 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="RFM总分分布趋势" className="lg:col-span-1">
          <ReactECharts option={rfmTrendOption} style={{ height: 300 }} />
        </Card>
        <Card title="会员群体特征分析" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(rfmSummary.segmentDistribution)
              .filter(([, count]) => count > 0)
              .map(([segment, count]) => {
                const Icon = segmentIcons[segment] || Users
                return (
                  <motion.div
                    key={segment}
                    whileHover={{ scale: 1.02 }}
                    className={cn('p-4 rounded-xl bg-gradient-to-br text-white', segmentColors[segment as MemberSegment])}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5 opacity-80" />
                      <span className="text-xs opacity-80">{((count / rfmSummary.totalMembers) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{count}</div>
                    <div className="text-xs opacity-80">{segment}</div>
                  </motion.div>
                )
              })}
          </div>
        </Card>
      </div>

      <Card title="高风险会员预警" subtitle="需要重点维护的高价值流失风险会员" icon={<AlertTriangle className="w-5 h-5 text-red-500" />}>
        <Table
          columns={memberTableColumns}
          data={highRiskMembers}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card title="会员RFM明细" subtitle="点击表头可排序" icon={<TrendingUp className="w-5 h-5 text-blue-500" />}>
        <Table
          columns={memberTableColumns}
          data={membersWithRFM}
          pagination={{ pageSize: 10 }}
          sortable
        />
      </Card>
    </div>
  )
}
