import { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { Wine, Calendar, TrendingUp, BarChart3, MousePointerClick, ShoppingCart, Star, Users, ArrowRight, Sparkles } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Table from '@/components/ui/Table'
import { getWineRecommendations, getActivityRecommendations, getRecommendationEffect, getRecommendationSummary, getRecommendationSummaryFiltered, getRecommendationEffectFiltered, getWineList, getActivityList } from '@/services/mock/recommend'
import { generateMembers } from '@/services/mock/members'
import { chartTheme, commonChartOption } from '@/utils/chartTheme'
import { cn } from '@/lib/utils'

interface RecommendAnalysisProps {
  levelFilter?: string
  genderFilter?: string
  ageGroupFilter?: string
  tagFilterIds?: string[]
  tagMatchAll?: boolean
}

export default function RecommendAnalysis({ levelFilter, genderFilter, ageGroupFilter, tagFilterIds = [], tagMatchAll = false }: RecommendAnalysisProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('M0001')
  const [activeTab, setActiveTab] = useState<'wine' | 'activity'>('wine')

  const members = useMemo(() => generateMembers(), [])
  const wineList = useMemo(() => getWineList(), [])
  const activityList = useMemo(() => getActivityList(), [])

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

  const filteredMemberIds = useMemo(() => filteredMembers.map(m => m.id), [filteredMembers])

  const isFiltered = filteredMembers.length !== members.length

  const effectiveMemberId = useMemo(() => {
    if (filteredMembers.length === 0) return ''
    if (filteredMembers.find(m => m.id === selectedMemberId)) return selectedMemberId
    return filteredMembers[0].id
  }, [filteredMembers, selectedMemberId])

  useEffect(() => {
    if (effectiveMemberId !== selectedMemberId) {
      setSelectedMemberId(effectiveMemberId)
    }
  }, [effectiveMemberId, selectedMemberId])

  const selectedMember = useMemo(() => {
    return filteredMembers.find(m => m.id === effectiveMemberId) || filteredMembers[0] || null
  }, [filteredMembers, effectiveMemberId])

  const recommendationSummary = useMemo(() => {
    if (!isFiltered) return getRecommendationSummary()
    return getRecommendationSummaryFiltered(filteredMemberIds)
  }, [isFiltered, filteredMemberIds])

  const recommendationEffect = useMemo(() => {
    if (!isFiltered) return getRecommendationEffect()
    return getRecommendationEffectFiltered(filteredMemberIds)
  }, [isFiltered, filteredMemberIds])

  const wineRecommendations = useMemo(() => getWineRecommendations(effectiveMemberId), [effectiveMemberId])
  const activityRecommendations = useMemo(() => getActivityRecommendations(effectiveMemberId), [effectiveMemberId])

  const effectTrendOption = useMemo((): EChartsOption => {
    const dates = recommendationEffect.map(e => e.date.substring(5))
    return {
      ...commonChartOption(),
      title: {
        text: '推荐效果趋势',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((p: any) => {
            const unit = p.seriesName.includes('率') ? '%' : ''
            result += `${p.marker} ${p.seriesName}: ${p.value}${unit}<br/>`
          })
          return result
        },
      },
      legend: {
        data: ['展示量', '点击量', '转化量', '点击率(%)', '转化率(%)'],
        top: 30,
      },
      grid: {
        top: 90,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          position: 'left',
        },
        {
          type: 'value',
          name: '百分比(%)',
          position: 'right',
          max: 20,
        },
      ],
      series: [
        {
          name: '展示量',
          type: 'bar',
          data: recommendationEffect.map(e => e.impressions),
          itemStyle: { color: chartTheme.primary, borderRadius: [4, 4, 0, 0] },
          barWidth: 15,
        },
        {
          name: '点击量',
          type: 'bar',
          data: recommendationEffect.map(e => e.clicks),
          itemStyle: { color: chartTheme.accent1, borderRadius: [4, 4, 0, 0] },
          barWidth: 15,
        },
        {
          name: '转化量',
          type: 'bar',
          data: recommendationEffect.map(e => e.conversions),
          itemStyle: { color: chartTheme.accent2, borderRadius: [4, 4, 0, 0] },
          barWidth: 15,
        },
        {
          name: '点击率(%)',
          type: 'line',
          yAxisIndex: 1,
          data: recommendationEffect.map(e => e.ctr),
          lineStyle: { width: 3, color: chartTheme.info },
          itemStyle: { color: chartTheme.info },
          smooth: true,
        },
        {
          name: '转化率(%)',
          type: 'line',
          yAxisIndex: 1,
          data: recommendationEffect.map(e => e.conversionRate),
          lineStyle: { width: 3, color: chartTheme.success },
          itemStyle: { color: chartTheme.success },
          smooth: true,
        },
      ],
    }
  }, [recommendationEffect])

  const typeDistributionOption = useMemo((): EChartsOption => {
    return {
      ...commonChartOption(),
      title: {
        text: '推荐类型效果对比',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '推荐转化',
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
            formatter: '{b}\n{c}次\n{d}%',
            fontSize: 11,
          },
          data: [
            { value: recommendationSummary.totalWineRecommended, name: '酒款推荐', itemStyle: { color: chartTheme.primary } },
            { value: recommendationSummary.totalActivityRecommended, name: '活动推荐', itemStyle: { color: chartTheme.accent1 } },
          ],
        },
      ],
    }
  }, [recommendationSummary])

  const currentRecommendations = activeTab === 'wine' ? wineRecommendations : activityRecommendations

  const recommendationColumns = [
    { key: 'itemImage', label: '', width: 60, render: (_: any, row: typeof wineRecommendations[0]) => <img src={row.itemImage} alt={row.itemName} className="w-12 h-12 rounded-lg object-cover" /> },
    { key: 'itemName', label: '推荐内容', render: (val: string) => <span className="font-medium">{val}</span> },
    { key: 'price', label: '价格', render: (val: number) => `¥${val.toLocaleString()}` },
    { key: 'matchScore', label: '匹配度', render: (val: number) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${val * 100}%` }} />
        </div>
        <span className="text-sm font-medium text-amber-600">{(val * 100).toFixed(0)}%</span>
      </div>
    )},
    { key: 'reason', label: '推荐理由', render: (val: string) => <span className="text-sm text-gray-600">{val}</span> },
    { key: 'similarFeedback', label: '相似会员反馈', render: (val: string) => <span className="text-xs text-gray-500">{val}</span> },
    { key: 'clickCount', label: '点击量', render: (val: number) => <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{val}</span> },
    { key: 'convertCount', label: '转化量', render: (val: number) => <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{val}</span> },
  ]

  const effectColumns = [
    { key: 'date', label: '日期', render: (val: string) => val.substring(5) },
    { key: 'impressions', label: '展示量', render: (val: number) => val.toLocaleString() },
    { key: 'clicks', label: '点击量', render: (val: number) => <span className="text-blue-600">{val.toLocaleString()}</span> },
    { key: 'conversions', label: '转化量', render: (val: number) => <span className="text-green-600">{val.toLocaleString()}</span> },
    { key: 'ctr', label: '点击率', render: (val: number) => <span className="font-medium">{val}%</span> },
    { key: 'conversionRate', label: '转化率', render: (val: number) => <span className="font-medium text-green-600">{val}%</span> },
  ]

  const topItems = useMemo(() => {
    const allItems = [...wineRecommendations, ...activityRecommendations]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)
    return allItems
  }, [wineRecommendations, activityRecommendations])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="累计推荐酒款"
          value={recommendationSummary.totalWineRecommended.toLocaleString()}
          icon={<Wine className="w-6 h-6" />}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="累计推荐活动"
          value={recommendationSummary.totalActivityRecommended.toLocaleString()}
          icon={<Calendar className="w-6 h-6" />}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          title="平均匹配度"
          value={`${(recommendationSummary.avgMatchScore * 100).toFixed(0)}%`}
          icon={<Star className="w-6 h-6" />}
          trend="优秀"
          trendUp={true}
        />
        <MetricCard
          title="总点击率"
          value={`${recommendationSummary.overallCTR}%`}
          icon={<MousePointerClick className="w-6 h-6" />}
          trend="+2.3%"
          trendUp={true}
        />
      </motion.div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">选择会员查看个性化推荐:</span>
          <select
            value={selectedMemberId}
            onChange={e => setSelectedMemberId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {filteredMembers.slice(0, 50).map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.level})
              </option>
            ))}
          </select>
          {selectedMember && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
              <img src={selectedMember.avatar} alt={selectedMember.name} className="w-6 h-6 rounded-full" />
              <span className="text-sm text-amber-700 font-medium">{selectedMember.name}</span>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{selectedMember.level}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="推荐效果趋势" subtitle="近30天推荐数据变化" className="lg:col-span-2">
          <ReactECharts option={effectTrendOption} style={{ height: 350 }} />
        </Card>
        <Card title="推荐类型分布" subtitle="酒款 vs 活动推荐效果">
          <ReactECharts option={typeDistributionOption} style={{ height: 350 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {topItems.map((item, index) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.03, y: -4 }}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="relative">
              <img
                src={item.itemImage}
                alt={item.itemName}
                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                TOP{index + 1}
              </div>
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs">
                {(item.matchScore * 100).toFixed(0)}%匹配
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">{item.itemName}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 font-bold">¥{item.price.toLocaleString()}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <MousePointerClick className="w-3 h-3" />{item.clickCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ShoppingCart className="w-3 h-3" />{item.convertCount}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Card title="个性化推荐详情" subtitle={`为 ${selectedMember?.name || '会员'} 推荐的内容`}>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('wine')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'wine'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Wine className="w-4 h-4" />
            酒款推荐
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Calendar className="w-4 h-4" />
            活动推荐
          </button>
        </div>
        <Table
          columns={recommendationColumns}
          data={currentRecommendations}
          pagination={{ pageSize: 5 }}
          sortable
        />
      </Card>

      <Card title="推荐效果明细" subtitle="近30天每日推荐效果数据" icon={<BarChart3 className="w-5 h-5 text-blue-500" />}>
        <Table
          columns={effectColumns}
          data={recommendationEffect}
          pagination={{ pageSize: 10 }}
          sortable
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="新酒款上市" subtitle="近期上架的精选酒款" icon={<Wine className="w-5 h-5 text-purple-500" />}>
          <div className="space-y-3">
            {wineList.slice(0, 5).map((wine, index) => (
              <motion.div
                key={wine.id}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <img src={wine.image} alt={wine.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800 truncate">{wine.name}</h4>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">NEW</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{wine.origin} · {wine.year}年 · {wine.type}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {wine.flavorTags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">¥{wine.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">瓶</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card title="热门活动推荐" subtitle="近期人气活动" icon={<Calendar className="w-5 h-5 text-green-500" />}>
          <div className="space-y-3">
            {activityList.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <img src={activity.image} alt={activity.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800 truncate">{activity.name}</h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{activity.category}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    <Calendar className="w-3 h-3 inline mr-1" />{activity.date} {activity.time}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{activity.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">¥{activity.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">
                    {activity.registered}/{activity.capacity}人报名
                  </div>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${(activity.registered / activity.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
