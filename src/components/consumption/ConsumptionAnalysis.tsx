import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { PieChart, TrendingUp, BarChart3, Target, Clock, Calendar } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Table from '@/components/ui/Table'
import { getCategoryBreakdown, getTrendData, getBenchmarkData, getCrossAnalysisData, getConsumptionByTimeSlot, getConsumptionByWeekday, categoryColors } from '@/services/mock/consumption'
import { generateMembers } from '@/services/mock/members'
import { chartTheme, commonChartOption } from '@/utils/chartTheme'
import { cn } from '@/lib/utils'
import type { ConsumptionCategory } from '@/types/consumption'

interface ConsumptionAnalysisProps {
  levelFilter?: string
  genderFilter?: string
  ageGroupFilter?: string
}

export default function ConsumptionAnalysis({ levelFilter, genderFilter, ageGroupFilter }: ConsumptionAnalysisProps) {
  const [granularity, setGranularity] = useState<'month' | 'quarter'>('month')
  const [selectedDimension, setSelectedDimension] = useState<'level' | 'gender' | 'ageGroup'>('level')

  const categoryBreakdown = useMemo(() => getCategoryBreakdown(), [])
  const trendData = useMemo(() => getTrendData(granularity === 'quarter' ? 'month' : 'month'), [granularity])
  const benchmarkData = useMemo(() => getBenchmarkData(), [])
  const crossAnalysisData = useMemo(() => getCrossAnalysisData(), [])
  const timeSlotData = useMemo(() => getConsumptionByTimeSlot(), [])
  const weekdayData = useMemo(() => getConsumptionByWeekday(), [])
  const members = useMemo(() => generateMembers(), [])

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
    return data
  }, [members, levelFilter, genderFilter, ageGroupFilter])

  const totalConsumption = useMemo(() => {
    return categoryBreakdown.reduce((sum, item) => sum + item.value, 0)
  }, [categoryBreakdown])

  const avgConsumptionPerMember = useMemo(() => {
    return totalConsumption / filteredMembers.length
  }, [totalConsumption, filteredMembers.length])

  const pieOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '消费类目占比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '消费金额',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['60%', '55%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n¥{c}\n{d}%',
            fontSize: 11,
          },
          data: categoryBreakdown.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: categoryColors[item.name as ConsumptionCategory] },
          })),
        },
      ],
    }
  }, [categoryBreakdown])

  const trendOption = useMemo((): EChartsOption => {
    const categories = ['餐饮', '酒水', 'SPA', '棋牌', '客房'] as ConsumptionCategory[]
    const dates = trendData.map(d => d.date)

    const quarterlyData = granularity === 'quarter' ? (() => {
      const quarterMap = new Map<string, Record<ConsumptionCategory, number>>()
      trendData.forEach(d => {
        const quarter = d.date.substring(0, 7).replace(/(\d{4})-(\d{2})/, (_, y, m) => {
          const q = Math.ceil(parseInt(m) / 3)
          return `${y}Q${q}`
        })
        if (!quarterMap.has(quarter)) {
          quarterMap.set(quarter, { '餐饮': 0, '酒水': 0, 'SPA': 0, '棋牌': 0, '客房': 0 })
        }
        const qData = quarterMap.get(quarter)!
        categories.forEach(cat => {
          qData[cat] += d.categories[cat]
        })
      })
      return {
        dates: Array.from(quarterMap.keys()),
        series: categories.map(cat => ({
          name: cat,
          type: 'line' as const,
          smooth: true,
          data: Array.from(quarterMap.values()).map(d => parseFloat(d[cat].toFixed(2))),
        })),
      }
    })() : null

    const finalDates = quarterlyData?.dates || dates
    const finalSeries = quarterlyData?.series || categories.map(cat => ({
      name: cat,
      type: 'line' as const,
      smooth: true,
      data: trendData.map(d => parseFloat(d.categories[cat].toFixed(2))),
    }))

    return {
      ...commonChartOption(),
      title: {
        text: `各类目人均消费金额${granularity === 'month' ? '月度' : '季度'}趋势`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`
          })
          return result
        },
      },
      legend: {
        top: 30,
        data: categories,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: finalDates,
      },
      yAxis: {
        type: 'value',
        name: '人均消费(元)',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      series: finalSeries.map(s => ({
        ...s,
        lineStyle: { width: 3 },
        itemStyle: { color: categoryColors[s.name as ConsumptionCategory] },
        areaStyle: {
          opacity: 0.1,
          color: categoryColors[s.name as ConsumptionCategory],
        },
      })),
    }
  }, [trendData, granularity])

  const benchmarkOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '类目消费占比与行业基准对比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['会所数据', '行业平均', '差距'],
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: benchmarkData.categories,
      },
      yAxis: {
        type: 'value',
        name: '占比(%)',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '会所数据',
          type: 'bar',
          data: benchmarkData.clubData,
          itemStyle: { color: chartTheme.primary },
          barWidth: 20,
        },
        {
          name: '行业平均',
          type: 'bar',
          data: benchmarkData.industryAvg,
          itemStyle: { color: chartTheme.accent2 },
          barWidth: 20,
        },
        {
          name: '差距',
          type: 'line',
          data: benchmarkData.gap,
          lineStyle: { width: 3, color: chartTheme.error },
          itemStyle: { color: chartTheme.error },
        },
      ],
    }
  }, [benchmarkData])

  const crossAnalysisOption = useMemo((): EChartsOption => {
    const { categories, matrix } = crossAnalysisData
    return {
      ...commonChartOption(),
      title: {
        text: '消费类目交叉分析热力图',
        subtext: '展示会员同时消费多个类目的概率',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11 },
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [x, y, value] = params.value
          return `${categories[y]} → ${categories[x]}<br/>共同消费率: ${value}%`
        },
      },
      grid: {
        left: '15%',
        right: '10%',
        top: '20%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: categories,
        splitArea: { show: true },
      },
      yAxis: {
        type: 'category',
        data: categories,
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
          color: ['#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f'],
        },
        formatter: '{value}%',
      },
      series: [
        {
          name: '共同消费率',
          type: 'heatmap',
          data: matrix.map((row, i) =>
            row.map((value, j) => [j, i, value])
          ).flat(),
          label: {
            show: true,
            fontSize: 11,
            formatter: (params: any) => `${params.value[2]}%`,
          },
        },
      ],
    }
  }, [crossAnalysisData])

  const timeSlotOption = useMemo((): EChartsOption => {
    const categories = ['餐饮', '酒水', 'SPA', '棋牌', '客房'] as ConsumptionCategory[]
    return {
      ...commonChartOption(),
      title: {
        text: '消费时段分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: categories,
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: timeSlotData.slots,
      },
      yAxis: {
        type: 'value',
        name: '消费金额(元)',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      series: categories.map(cat => ({
        name: cat,
        type: 'bar',
        stack: 'total',
        data: timeSlotData.data[cat],
        itemStyle: { color: categoryColors[cat] },
      })),
    }
  }, [timeSlotData])

  const weekdayOption = useMemo((): EChartsOption => {
    const categories = ['餐饮', '酒水', 'SPA', '棋牌', '客房'] as ConsumptionCategory[]
    return {
      ...commonChartOption(),
      title: {
        text: '周消费分布',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: categories,
        top: 30,
      },
      grid: {
        top: 80,
      },
      xAxis: {
        type: 'category',
        data: weekdayData.weekdays,
      },
      yAxis: {
        type: 'value',
        name: '消费金额(元)',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      series: categories.map(cat => ({
        name: cat,
        type: 'bar',
        data: weekdayData.data[cat],
        itemStyle: { color: categoryColors[cat] },
      })),
    }
  }, [weekdayData])

  const crossAnalysisColumns = [
    { key: 'category', label: '消费类目' },
    { key: 'avgPerPerson', label: '人均消费(元)', render: (val: number) => `¥${val.toLocaleString()}` },
    { key: 'growthRate', label: '同比增长', render: (val: number) => <span className={cn(val >= 0 ? 'text-green-600' : 'text-red-600')}>{val >= 0 ? '+' : ''}{val.toFixed(1)}%</span> },
    { key: 'memberCount', label: '消费会员数' },
    { key: 'avgFrequency', label: '人均消费频次' },
  ]

  const crossAnalysisTableData = useMemo(() => {
    return ['餐饮', '酒水', 'SPA', '棋牌', '客房'].map(cat => ({
      category: cat,
      avgPerPerson: Math.round(totalConsumption / filteredMembers.length * (categoryBreakdown.find(c => c.name === cat)?.percentage || 0) / 100),
      growthRate: (Math.random() - 0.3) * 20,
      memberCount: Math.round(filteredMembers.length * (0.3 + Math.random() * 0.5)),
      avgFrequency: (2 + Math.random() * 8).toFixed(1),
    }))
  }, [totalConsumption, filteredMembers.length, categoryBreakdown])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="总消费金额"
          value={`¥${totalConsumption.toLocaleString()}`}
          icon={<PieChart className="w-6 h-6" />}
          trend="+15.3%"
          trendUp={true}
        />
        <MetricCard
          title="人均消费"
          value={`¥${avgConsumptionPerMember.toFixed(0)}`}
          icon={<Target className="w-6 h-6" />}
          trend="+8.7%"
          trendUp={true}
        />
        <MetricCard
          title="消费类目数"
          value={categoryBreakdown.length.toString()}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="全覆盖"
          trendUp={true}
        />
        <MetricCard
          title="活跃会员数"
          value={filteredMembers.length.toLocaleString()}
          icon={<TrendingUp className="w-6 h-6" />}
          trend="+12.1%"
          trendUp={true}
        />
      </motion.div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">时间粒度:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[{ key: 'month', label: '月度' }, { key: 'quarter', label: '季度' }].map(opt => (
              <button
                key={opt.key}
                onClick={() => setGranularity(opt.key as 'month' | 'quarter')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-all',
                  granularity === opt.key
                    ? 'bg-white text-amber-700 shadow-sm font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">交叉维度:</span>
          <select
            value={selectedDimension}
            onChange={e => setSelectedDimension(e.target.value as 'level' | 'gender' | 'ageGroup')}
            className="px-3 py-1 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="level">会员等级</option>
            <option value="gender">性别</option>
            <option value="ageGroup">年龄段</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="消费类目占比分析" subtitle="各类目消费金额分布">
          <ReactECharts option={pieOption} style={{ height: 320 }} />
        </Card>
        <Card title="消费时段分布" subtitle="各时段消费金额对比">
          <ReactECharts option={timeSlotOption} style={{ height: 320 }} />
        </Card>
      </div>

      <Card title="消费趋势分析" subtitle="各类目人均消费金额变化趋势">
        <ReactECharts option={trendOption} style={{ height: 380 }} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="行业基准对比" subtitle="会所数据与行业平均水平对比">
          <ReactECharts option={benchmarkOption} style={{ height: 350 }} />
        </Card>
        <Card title="周消费分布" subtitle="周一至周日消费金额对比">
          <ReactECharts option={weekdayOption} style={{ height: 350 }} />
        </Card>
      </div>

      <Card title="消费类目交叉分析" subtitle="会员同时消费多个类目的概率">
        <ReactECharts option={crossAnalysisOption} style={{ height: 400 }} />
      </Card>

      <Card title="类目消费明细" subtitle="各类目消费指标详情">
        <Table
          columns={crossAnalysisColumns}
          data={crossAnalysisTableData}
          pagination={{ pageSize: 10 }}
          sortable
        />
      </Card>
    </div>
  )
}
