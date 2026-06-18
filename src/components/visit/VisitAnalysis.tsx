import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Table from '@/components/ui/Table'
import { generateMembers, generateConsumptionRecords } from '@/services/mock/members'
import { chartTheme, commonChartOption } from '@/utils/chartTheme'
import { cn } from '@/lib/utils'
import type { MemberLevel } from '@/types/member'

interface VisitAnalysisProps {
  levelFilter?: string
  genderFilter?: string
  ageGroupFilter?: string
  tagFilterIds?: string[]
  tagMatchAll?: boolean
}

export default function VisitAnalysis({ levelFilter, genderFilter, ageGroupFilter, tagFilterIds = [], tagMatchAll = false }: VisitAnalysisProps) {
  const members = useMemo(() => generateMembers(), [])
  const consumptionRecords = useMemo(() => generateConsumptionRecords(), [])

  const filteredMembers = useMemo(() => {
    let data = members
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
  }, [members, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll])

  const filteredRecords = useMemo(() => {
    const memberIds = new Set(filteredMembers.map(m => m.id))
    return consumptionRecords.filter(r => memberIds.has(r.memberId))
  }, [filteredMembers, consumptionRecords])

  const avgVisitsPerMonth = useMemo(() => {
    const totalVisits = filteredMembers.reduce((sum, m) => sum + m.visitCount, 0)
    const avgMemberMonths = 12
    return (totalVisits / filteredMembers.length / avgMemberMonths).toFixed(1)
  }, [filteredMembers])

  const visitDistribution = useMemo(() => {
    const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    filteredMembers.forEach(m => {
      const monthlyVisits = Math.round(m.visitCount / 12)
      const bucket = Math.min(monthlyVisits, 5)
      distribution[bucket]++
    })
    return distribution
  }, [filteredMembers])

  const levelVisitStats = useMemo(() => {
    const levels: MemberLevel[] = ['普通', '银卡', '金卡', '钻石']
    return levels.map(level => {
      const levelMembers = filteredMembers.filter(m => m.level === level)
      const avgVisits = levelMembers.length > 0
        ? levelMembers.reduce((sum, m) => sum + m.visitCount, 0) / levelMembers.length / 12
        : 0
      const avgSpend = levelMembers.length > 0
        ? levelMembers.reduce((sum, m) => sum + m.totalSpend, 0) / levelMembers.length
        : 0
      return {
        level,
        avgMonthlyVisits: parseFloat(avgVisits.toFixed(1)),
        avgAnnualSpend: Math.round(avgSpend),
        memberCount: levelMembers.length,
      }
    })
  }, [filteredMembers])

  const timeDistribution = useMemo(() => {
    const hours: Record<number, number> = {}
    for (let i = 9; i <= 23; i++) {
      hours[i] = 0
    }
    filteredRecords.forEach(r => {
      const hour = parseInt(r.time.split(':')[0])
      if (hours[hour] !== undefined) {
        hours[hour]++
      }
    })
    return hours
  }, [filteredRecords])

  const weekdayDistribution = useMemo(() => {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const weekdayMap: Record<string, number> = {
      '星期一': 0, '星期二': 1, '星期三': 2, '星期四': 3, '星期五': 4, '星期六': 5, '星期日': 6
    }
    const distribution = [0, 0, 0, 0, 0, 0, 0]
    filteredRecords.forEach(r => {
      const idx = weekdayMap[r.weekday] ?? 0
      distribution[idx]++
    })
    return { weekdays, distribution }
  }, [filteredRecords])

  const visitAmountCorrelation = useMemo(() => {
    return filteredMembers.map(m => ({
      monthlyVisits: Math.round(m.visitCount / 12 * 10) / 10,
      totalSpend: Math.round(m.totalSpend),
      level: m.level,
      name: m.name,
    }))
  }, [filteredMembers])

  const correlationCoefficient = useMemo(() => {
    const n = visitAmountCorrelation.length
    const sumX = visitAmountCorrelation.reduce((sum, d) => sum + d.monthlyVisits, 0)
    const sumY = visitAmountCorrelation.reduce((sum, d) => sum + d.totalSpend, 0)
    const sumXY = visitAmountCorrelation.reduce((sum, d) => sum + d.monthlyVisits * d.totalSpend, 0)
    const sumX2 = visitAmountCorrelation.reduce((sum, d) => sum + d.monthlyVisits * d.monthlyVisits, 0)
    const sumY2 = visitAmountCorrelation.reduce((sum, d) => sum + d.totalSpend * d.totalSpend, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    return denominator !== 0 ? parseFloat((numerator / denominator).toFixed(3)) : 0
  }, [visitAmountCorrelation])

  const visitDistributionOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '会员月均到店次数分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const [p] = params
          const label = p.name === '5' ? '5次及以上' : `${p.name}次`
          return `月均${label}: ${p.value}人`
        },
      },
      xAxis: {
        type: 'category',
        data: ['0次', '1次', '2次', '3次', '4次', '5次+'],
        name: '月均到店次数',
      },
      yAxis: {
        type: 'value',
        name: '会员数',
      },
      series: [
        {
          data: Object.values(visitDistribution),
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
            borderRadius: [8, 8, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 12,
          },
          barWidth: '50%',
        },
      ],
    }
  }, [visitDistribution])

  const levelComparisonOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '不同等级会员到店规律对比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            const unit = p.seriesName === '月均到店次数' ? '次' : '元'
            result += `${p.marker} ${p.seriesName}: ${p.value}${unit}<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['月均到店次数', '年均消费金额'],
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: levelVisitStats.map(s => s.level),
      },
      yAxis: [
        {
          type: 'value',
          name: '月均到店次数',
          position: 'left',
        },
        {
          type: 'value',
          name: '年均消费金额(元)',
          position: 'right',
          axisLabel: {
            formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
          },
        },
      ],
      series: [
        {
          name: '月均到店次数',
          type: 'bar',
          data: levelVisitStats.map(s => s.avgMonthlyVisits),
          itemStyle: { color: chartTheme.primary, borderRadius: [8, 8, 0, 0] },
          barWidth: 30,
        },
        {
          name: '年均消费金额',
          type: 'line',
          yAxisIndex: 1,
          data: levelVisitStats.map(s => s.avgAnnualSpend),
          lineStyle: { width: 3, color: chartTheme.accent2 },
          itemStyle: { color: chartTheme.accent2 },
          symbol: 'circle',
          symbolSize: 10,
        },
      ],
    }
  }, [levelVisitStats])

  const timeDistributionOption = useMemo((): EChartsOption => {
    const hours = Object.keys(timeDistribution).map(h => `${parseInt(h)}:00`)
    const values = Object.values(timeDistribution)

    return {
      ...commonChartOption(),
      title: {
        text: '会员到店时间分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}人次',
      },
      xAxis: {
        type: 'category',
        data: hours,
        name: '时间段',
      },
      yAxis: {
        type: 'value',
        name: '到店人次',
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: chartTheme.primary },
          areaStyle: {
            opacity: 0.3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: chartTheme.primary },
                { offset: 1, color: 'transparent' },
              ],
            },
          },
          itemStyle: { color: chartTheme.primary },
        },
      ],
    }
  }, [timeDistribution])

  const weekdayOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '工作日/周末到店分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}人次',
      },
      xAxis: {
        type: 'category',
        data: weekdayDistribution.weekdays,
      },
      yAxis: {
        type: 'value',
        name: '到店人次',
      },
      series: [
        {
          data: weekdayDistribution.distribution,
          type: 'bar',
          itemStyle: {
            color: (params: any) => {
              return params.dataIndex >= 5 ? chartTheme.accent2 : chartTheme.primary
            },
            borderRadius: [8, 8, 0, 0],
          },
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            fontSize: 11,
          },
        },
      ],
    }
  }, [weekdayDistribution])

  const correlationOption = useMemo((): EChartsOption => {
    const levelColors: Record<string, string> = {
      '普通': '#9CA3AF',
      '银卡': '#D1D5DB',
      '金卡': '#F59E0B',
      '钻石': '#06B6D4',
    }

    const sampledData = visitAmountCorrelation.filter((_, i) => i % 5 === 0)

    return {
      ...commonChartOption(),
      title: {
        text: `到店频次与消费金额相关性分析`,
        subtext: `相关系数: ${correlationCoefficient} (${Math.abs(correlationCoefficient) > 0.7 ? '强相关' : Math.abs(correlationCoefficient) > 0.4 ? '中等相关' : '弱相关'})`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.data.name}<br/>月均到店: ${params.data[0]}次<br/>年消费: ¥${params.data[1].toLocaleString()}<br/>会员等级: ${params.data.level}`
        },
      },
      legend: {
        data: ['普通', '银卡', '金卡', '钻石'],
        top: 30,
      },
      grid: {
        top: 90,
      },
      xAxis: {
        type: 'value',
        name: '月均到店次数',
        axisLabel: {
          formatter: '{value}次',
        },
      },
      yAxis: {
        type: 'value',
        name: '年消费金额(元)',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      series: ['普通', '银卡', '金卡', '钻石'].map(level => ({
        name: level,
        type: 'scatter',
        data: sampledData
          .filter(d => d.level === level)
          .map(d => [d.monthlyVisits, d.totalSpend, d.level, d.name]),
        itemStyle: {
          color: levelColors[level],
          opacity: 0.7,
        },
        symbolSize: (data: any) => Math.max(8, Math.min(20, data[1] / 10000)),
      })),
    }
  }, [visitAmountCorrelation, correlationCoefficient])

  const peakHours = useMemo(() => {
    const entries = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1])
    return entries.slice(0, 3).map(([hour, count]) => ({
      time: `${hour}:00-${parseInt(hour) + 1}:00`,
      visits: count,
      percentage: ((count / filteredRecords.length) * 100).toFixed(1),
    }))
  }, [timeDistribution, filteredRecords.length])

  const visitTableColumns = [
    { key: 'level', label: '会员等级', render: (val: string) => <span className={cn('px-2 py-1 rounded-full text-xs font-medium', val === '钻石' ? 'bg-cyan-100 text-cyan-700' : val === '金卡' ? 'bg-yellow-100 text-yellow-700' : val === '银卡' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-600 border')}>{val}</span> },
    { key: 'avgMonthlyVisits', label: '月均到店次数', render: (val: number) => <span className="font-medium">{val}次</span> },
    { key: 'avgAnnualSpend', label: '年均消费金额', render: (val: number) => `¥${val.toLocaleString()}` },
    { key: 'memberCount', label: '会员人数' },
    { key: 'visitsPerSpend', label: '每次到店消费', render: (_: any, row: typeof levelVisitStats[0]) => `¥${Math.round(row.avgAnnualSpend / (row.avgMonthlyVisits * 12)).toLocaleString()}` },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="月均到店次数"
          value={`${avgVisitsPerMonth}次`}
          icon={<Calendar className="w-6 h-6" />}
          trend="+0.8次"
          trendUp={true}
        />
        <MetricCard
          title="总到店人次"
          value={filteredRecords.length.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          trend="+23.5%"
          trendUp={true}
        />
        <MetricCard
          title="高峰时段"
          value={peakHours[0]?.time || '19:00-20:00'}
          icon={<Clock className="w-6 h-6" />}
          trend={`${peakHours[0]?.percentage || '15'}%`}
          trendUp={true}
        />
        <MetricCard
          title="消费相关系数"
          value={correlationCoefficient.toString()}
          icon={<Activity className="w-6 h-6" />}
          trend={Math.abs(correlationCoefficient) > 0.7 ? '强相关' : '中等相关'}
          trendUp={true}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="会员月均到店次数分布" subtitle="会员到店频次分布情况">
          <ReactECharts option={visitDistributionOption} style={{ height: 320 }} />
        </Card>
        <Card title="不同等级会员到店对比" subtitle="各等级会员到店规律差异">
          <ReactECharts option={levelComparisonOption} style={{ height: 320 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="到店时间分布" subtitle="各时段到店人次统计">
          <ReactECharts option={timeDistributionOption} style={{ height: 320 }} />
        </Card>
        <Card title="工作日/周末分布" subtitle="周一至周日到店人次对比">
          <ReactECharts option={weekdayOption} style={{ height: 320 }} />
        </Card>
      </div>

      <Card title="到店频次与消费金额相关性分析" subtitle="散点图展示二者关系">
        <ReactECharts option={correlationOption} style={{ height: 400 }} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {peakHours.map((peak, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-amber-600 font-medium">
                {index === 0 ? '第一高峰' : index === 1 ? '第二高峰' : '第三高峰'}
              </span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {peak.percentage}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">{peak.time}</div>
                <div className="text-sm text-gray-500">{peak.visits.toLocaleString()} 人次</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Card title="各等级会员到店明细" subtitle="点击表头可排序" icon={<BarChart3 className="w-5 h-5 text-blue-500" />}>
        <Table
          columns={visitTableColumns}
          data={levelVisitStats}
          pagination={{ pageSize: 10 }}
          sortable
        />
      </Card>
    </div>
  )
}
