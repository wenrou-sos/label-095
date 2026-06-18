import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { LayoutGrid, Users, TrendingUp, BarChart3, Clock, Calendar, AlertCircle, UserPlus } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Table from '@/components/ui/Table'
import { getSpaceList, getUsageComparison, getScheduleRecommendations, getSpaceTypeSummary, getHourlyUsageTrend, getUsageComparisonFiltered, getSpaceTypeSummaryFiltered, getHourlyUsageTrendFiltered, getScheduleRecommendationsFiltered } from '@/services/mock/space'
import { chartTheme, commonChartOption } from '@/utils/chartTheme'
import { cn } from '@/lib/utils'
import type { SpaceType } from '@/types/space'

interface SpaceAnalysisProps {
  levelFilter?: string
  genderFilter?: string
  ageGroupFilter?: string
  tagFilterIds?: string[]
  tagMatchAll?: boolean
}

export default function SpaceAnalysis({ levelFilter, genderFilter, ageGroupFilter, tagFilterIds = [], tagMatchAll = false }: SpaceAnalysisProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('S0001')

  const hasFilter = useMemo(() =>
    (levelFilter && levelFilter !== '全部') ||
    (genderFilter && genderFilter !== '全部') ||
    (ageGroupFilter && ageGroupFilter !== '全部') ||
    tagFilterIds.length > 0,
    [levelFilter, genderFilter, ageGroupFilter, tagFilterIds]
  )

  const spaces = useMemo(() => getSpaceList(), [])
  const usageComparison = useMemo(
    () => hasFilter ? getUsageComparisonFiltered(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll) : getUsageComparison(),
    [hasFilter, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll]
  )
  const scheduleRecommendations = useMemo(
    () => hasFilter ? getScheduleRecommendationsFiltered(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll) : getScheduleRecommendations(),
    [hasFilter, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll]
  )
  const spaceTypeSummary = useMemo(
    () => hasFilter ? getSpaceTypeSummaryFiltered(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll) : getSpaceTypeSummary(),
    [hasFilter, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll]
  )
  const hourlyUsageTrend = useMemo(
    () => hasFilter ? getHourlyUsageTrendFiltered(selectedSpaceId, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll) : getHourlyUsageTrend(selectedSpaceId),
    [hasFilter, selectedSpaceId, levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll]
  )

  const selectedSpace = useMemo(() => spaces.find(s => s.id === selectedSpaceId) || spaces[0], [spaces, selectedSpaceId])

  const avgWeekdayUsage = useMemo(() => {
    return spaceTypeSummary.reduce((sum, s) => sum + s.avgUsageRate, 0) / spaceTypeSummary.length
  }, [spaceTypeSummary])

  const avgSatisfaction = useMemo(() => {
    return spaceTypeSummary.reduce((sum, s) => sum + s.avgSatisfaction, 0) / spaceTypeSummary.length
  }, [spaceTypeSummary])

  const totalCapacity = useMemo(() => {
    return spaceTypeSummary.reduce((sum, s) => sum + s.totalCapacity, 0)
  }, [spaceTypeSummary])

  const usageComparisonOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '工作日晚间 vs 周末场地使用率对比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['工作日晚间(18-21点)', '周末全天'],
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: usageComparison.map(u => u.space),
        axisLabel: {
          rotate: 30,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: '使用率(%)',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '工作日晚间(18-21点)',
          type: 'bar',
          data: usageComparison.map(u => u.weekdayEvening),
          itemStyle: { color: chartTheme.primary, borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
        {
          name: '周末全天',
          type: 'bar',
          data: usageComparison.map(u => u.weekend),
          itemStyle: { color: chartTheme.accent2, borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
      ],
    }
  }, [usageComparison])

  const heatmapOption = useMemo((): EChartsOption => {
    const hours = hourlyUsageTrend.hours
    const data: number[][] = []

    hours.forEach((hour, idx) => {
      data.push([idx, 0, hourlyUsageTrend.weekdayAvg[idx]])
      data.push([idx, 1, hourlyUsageTrend.weekendAvg[idx]])
    })

    return {
      ...commonChartOption(),
      title: {
        text: `${selectedSpace?.name || '场地'} - 时段使用率热力图`,
        subtext: '工作日 vs 周末各时段使用情况',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11 },
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [x, y, value] = params.value
          const dayType = y === 0 ? '工作日' : '周末'
          return `${dayType} ${hours[x]}:00-${hours[x] + 1}:00<br/>使用率: ${value}%`
        },
      },
      grid: {
        left: '12%',
        right: '5%',
        top: '20%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: hours.map(h => `${h}:00`),
        splitArea: { show: true },
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: ['工作日', '周末'],
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
        },
        formatter: '{value}%',
      },
      series: [
        {
          name: '使用率',
          type: 'heatmap',
          data,
          label: {
            show: true,
            fontSize: 11,
            formatter: (params: any) => `${params.value[2]}%`,
          },
        },
      ],
    }
  }, [hourlyUsageTrend, selectedSpace])

  const spaceTypeOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '各类型场地综合指标',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            const unit = p.seriesName === '平均使用率' ? '%' : p.seriesName === '平均满意度' ? '分' : '人'
            result += `${p.marker} ${p.seriesName}: ${p.value}${unit}<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['平均使用率', '平均满意度', '总容量'],
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: spaceTypeSummary.map(s => s.type),
      },
      yAxis: [
        {
          type: 'value',
          name: '百分比/评分',
          position: 'left',
          max: 100,
        },
        {
          type: 'value',
          name: '容量(人)',
          position: 'right',
        },
      ],
      series: [
        {
          name: '平均使用率',
          type: 'bar',
          data: spaceTypeSummary.map(s => s.avgUsageRate),
          itemStyle: { color: chartTheme.primary, borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
        {
          name: '平均满意度',
          type: 'bar',
          data: spaceTypeSummary.map(s => s.avgSatisfaction * 20),
          itemStyle: { color: chartTheme.accent1, borderRadius: [4, 4, 0, 0] },
          barWidth: 20,
        },
        {
          name: '总容量',
          type: 'line',
          yAxisIndex: 1,
          data: spaceTypeSummary.map(s => s.totalCapacity),
          lineStyle: { width: 3, color: chartTheme.accent2 },
          itemStyle: { color: chartTheme.accent2 },
          symbol: 'circle',
          symbolSize: 10,
        },
      ],
    }
  }, [spaceTypeSummary])

  const satisfactionUsageCorrelation = useMemo((): EChartsOption => {
    const typeColors: Record<SpaceType, string> = {
      '餐厅': '#FF6B6B',
      '酒吧': '#4ECDC4',
      'SPA中心': '#45B7D1',
      '棋牌室': '#96CEB4',
      '客房': '#FFEAA7',
      '会议室': '#DDA0DD',
    }

    return {
      ...commonChartOption(),
      title: {
        text: '场地使用率与会员满意度关联分析',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.data.name}<br/>使用率: ${params.data[0]}%<br/>满意度: ${params.data[1]}分`
        },
      },
      legend: {
        data: spaceTypeSummary.map(s => s.type),
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'value',
        name: '使用率(%)',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'value',
        name: '满意度(分)',
        min: 3,
        max: 5,
      },
      series: spaceTypeSummary.map(space => ({
        name: space.type,
        type: 'scatter',
        data: [[space.avgUsageRate, space.avgSatisfaction, space.type, space.type]],
        itemStyle: {
          color: typeColors[space.type],
          opacity: 0.8,
        },
        symbolSize: 20 + space.count * 2,
      })),
    }
  }, [spaceTypeSummary])

  const scheduleColumns = [
    { key: 'shift', label: '班次' },
    { key: 'requiredStaff', label: '建议人数', render: (val: number) => <span className="font-medium text-amber-600">{val}人</span> },
    { key: 'suggestedSkill', label: '技能要求', render: (val: string) => <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{val}</span> },
    { key: 'costEstimate', label: '预估成本', render: (val: number) => `¥${val.toLocaleString()}/天` },
  ]

  const spaceColumns = [
    { key: 'type', label: '场地类型' },
    { key: 'count', label: '场地数量', render: (val: number) => `${val}个` },
    { key: 'totalCapacity', label: '总容量', render: (val: number) => `${val}人` },
    { key: 'avgUsageRate', label: '平均使用率', render: (val: number) => <span className={cn(val >= 70 ? 'text-green-600' : val >= 50 ? 'text-yellow-600' : 'text-red-600')}>{val}%</span> },
    { key: 'avgSatisfaction', label: '平均满意度', render: (val: number) => <span className="font-medium">{val}分</span> },
  ]

  const highUsageSpaces = useMemo(() => {
    return spaceTypeSummary
      .filter(s => s.avgUsageRate >= 70)
      .map(s => ({
        ...s,
        recommendation: s.avgUsageRate >= 85 ? '建议扩容' : '建议增加维护频次',
      }))
  }, [spaceTypeSummary])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="场地总数"
          value={spaces.length.toString()}
          icon={<LayoutGrid className="w-6 h-6" />}
          trend="6类场地"
          trendUp={true}
        />
        <MetricCard
          title="总容纳人数"
          value={totalCapacity.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          trend="单次最大"
          trendUp={true}
        />
        <MetricCard
          title="平均使用率"
          value={`${avgWeekdayUsage.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={avgWeekdayUsage >= 60 ? '良好' : '待提升'}
          trendUp={avgWeekdayUsage >= 60}
        />
        <MetricCard
          title="平均满意度"
          value={avgSatisfaction.toFixed(2)}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="优秀"
          trendUp={true}
        />
      </motion.div>

      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-600">选择场地查看详细热力图:</span>
        <select
          value={selectedSpaceId}
          onChange={e => setSelectedSpaceId(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {spaces.map(space => (
            <option key={space.id} value={space.id}>
              {space.name} ({space.type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="工作日晚间 vs 周末使用率对比" subtitle="各场地在不同时段的使用情况">
          <ReactECharts option={usageComparisonOption} style={{ height: 350 }} />
        </Card>
        <Card title="场地时段使用率热力图" subtitle="点击上方下拉框切换场地">
          <ReactECharts option={heatmapOption} style={{ height: 350 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="各类型场地综合指标" subtitle="使用率、满意度、容量对比">
          <ReactECharts option={spaceTypeOption} style={{ height: 350 }} />
        </Card>
        <Card title="使用率与满意度关联分析" subtitle="气泡大小代表场地数量">
          <ReactECharts option={satisfactionUsageCorrelation} style={{ height: 350 }} />
        </Card>
      </div>

      {highUsageSpaces.length > 0 && (
        <Card title="高利用率场地预警" subtitle="使用率超过70%的场地需要关注" icon={<AlertCircle className="w-5 h-5 text-orange-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highUsageSpaces.map((space, index) => (
              <motion.div
                key={space.type}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'p-4 rounded-xl border',
                  space.avgUsageRate >= 85
                    ? 'bg-red-50 border-red-200'
                    : 'bg-orange-50 border-orange-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{space.type}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    space.avgUsageRate >= 85
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  )}>
                    {space.avgUsageRate}%
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  平均满意度: {space.avgSatisfaction}分
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <AlertCircle className={cn('w-4 h-4', space.avgUsageRate >= 85 ? 'text-red-500' : 'text-orange-500')} />
                  <span className={space.avgUsageRate >= 85 ? 'text-red-700' : 'text-orange-700'}>
                    {space.recommendation}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      <Card title="服务人员排班优化建议" subtitle="基于使用率预测的人员配置方案" icon={<UserPlus className="w-5 h-5 text-green-500" />}>
        <Table
          columns={scheduleColumns}
          data={scheduleRecommendations}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="各类型场地明细" subtitle="点击表头可排序" icon={<BarChart3 className="w-5 h-5 text-blue-500" />}>
        <Table
          columns={spaceColumns}
          data={spaceTypeSummary}
          pagination={{ pageSize: 10 }}
          sortable
        />
      </Card>
    </div>
  )
}
