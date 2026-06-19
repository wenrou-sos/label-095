import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Users, ShoppingBag, MapPin, Sparkles, Crown, Clock, LayoutGrid, Wine, Calendar, Tag, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import MetricCard from '@/components/ui/MetricCard'
import Button from '@/components/ui/Button'
import FilterBar from '@/components/common/FilterBar'
import DataExport from '@/components/export/DataExport'
import RFMAnalysis from '@/components/rfm/RFMAnalysis'
import ConsumptionAnalysis from '@/components/consumption/ConsumptionAnalysis'
import VisitAnalysis from '@/components/visit/VisitAnalysis'
import SpaceAnalysis from '@/components/space/SpaceAnalysis'
import RecommendAnalysis from '@/components/recommend/RecommendAnalysis'
import AlertManagement from './AlertManagement'
import { generateMembers, getRFMSummary } from '@/services/mock/members'
import { getCategoryBreakdown } from '@/services/mock/consumption'
import { getSpaceTypeSummary } from '@/services/mock/space'
import { getRecommendationSummary } from '@/services/mock/recommend'
import { getUnreadAlertCount, runAlertCheck } from '@/services/mock/alerts'

type TabType = 'overview' | 'rfm' | 'consumption' | 'visit' | 'space' | 'recommend' | 'alerts'

const tabs = [
  { key: 'overview' as TabType, label: '数据概览', icon: LayoutGrid, color: 'from-amber-500 to-orange-500' },
  { key: 'rfm' as TabType, label: 'RFM分析', icon: Crown, color: 'from-yellow-500 to-amber-500' },
  { key: 'consumption' as TabType, label: '消费结构', icon: ShoppingBag, color: 'from-red-500 to-pink-500' },
  { key: 'visit' as TabType, label: '到店行为', icon: Clock, color: 'from-blue-500 to-cyan-500' },
  { key: 'space' as TabType, label: '场地利用', icon: MapPin, color: 'from-green-500 to-emerald-500' },
  { key: 'recommend' as TabType, label: '智能推荐', icon: Sparkles, color: 'from-purple-500 to-violet-500' },
  { key: 'alerts' as TabType, label: '预警管理', icon: Bell, color: 'from-rose-500 to-red-500' },
]

export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [levelFilter, setLevelFilter] = useState('全部')
  const [genderFilter, setGenderFilter] = useState('全部')
  const [ageGroupFilter, setAgeGroupFilter] = useState('全部')
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([])
  const [tagMatchAll, setTagMatchAll] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadAlertCount, setUnreadAlertCount] = useState(0)

  const refreshAlertCount = useCallback(() => {
    setUnreadAlertCount(getUnreadAlertCount())
  }, [])

  useEffect(() => {
    runAlertCheck()
    refreshAlertCount()
    const timer = setInterval(() => {
      runAlertCheck()
      refreshAlertCount()
    }, 60000)
    return () => clearInterval(timer)
  }, [refreshAlertCount])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    runAlertCheck()
    refreshAlertCount()
  }, [refreshAlertCount])

  const handleTagFilterChange = (ids: string[], matchAll: boolean) => {
    setTagFilterIds(ids)
    setTagMatchAll(matchAll)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const overviewMetrics = useMemo(() => {
    const members = generateMembers()
    const consumption = getCategoryBreakdown()
    const rfmSummary = getRFMSummary()
    const spaceSummary = getSpaceTypeSummary()
    const recSummary = getRecommendationSummary()

    const totalSpend = consumption.reduce((sum, c) => sum + c.value, 0)
    const avgUsage = spaceSummary.reduce((sum, s) => sum + s.avgUsageRate, 0) / spaceSummary.length

    return {
      totalMembers: members.length,
      totalSpend,
      avgSpendPerMember: totalSpend / members.length,
      avgRFMScore: rfmSummary.avgScore,
      highValueCount: rfmSummary.segmentDistribution['高价值会员'] || 0,
      avgSpaceUsage: avgUsage,
      totalRecommendations: recSummary.totalWineRecommended + recSummary.totalActivityRecommended,
      avgMatchScore: recSummary.avgMatchScore,
    }
  }, [refreshKey])

  const renderOverview = () => (
    <div className="space-y-6">
      <motion.div
        key={refreshKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="会员总数"
          value={overviewMetrics.totalMembers.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          trend="+12.5%"
          trendUp={true}
        />
        <MetricCard
          title="总消费金额"
          value={`¥${overviewMetrics.totalSpend.toLocaleString()}`}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend="+15.3%"
          trendUp={true}
        />
        <MetricCard
          title="平均RFM评分"
          value={overviewMetrics.avgRFMScore.toString()}
          icon={<Crown className="w-6 h-6" />}
          trend="优秀"
          trendUp={true}
        />
        <MetricCard
          title="场地平均使用率"
          value={`${overviewMetrics.avgSpaceUsage.toFixed(1)}%`}
          icon={<MapPin className="w-6 h-6" />}
          trend={overviewMetrics.avgSpaceUsage >= 60 ? '良好' : '待提升'}
          trendUp={overviewMetrics.avgSpaceUsage >= 60}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="高价值会员数"
          value={overviewMetrics.highValueCount.toLocaleString()}
          icon={<BarChart3 className="w-6 h-6" />}
          trend={`占比 ${((overviewMetrics.highValueCount / overviewMetrics.totalMembers) * 100).toFixed(1)}%`}
          trendUp={true}
        />
        <MetricCard
          title="人均消费"
          value={`¥${overviewMetrics.avgSpendPerMember.toFixed(0)}`}
          icon={<Wine className="w-6 h-6" />}
          trend="+8.7%"
          trendUp={true}
        />
        <MetricCard
          title="累计推荐数"
          value={overviewMetrics.totalRecommendations.toLocaleString()}
          icon={<Sparkles className="w-6 h-6" />}
          trend={`匹配度 ${(overviewMetrics.avgMatchScore * 100).toFixed(0)}%`}
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabs.filter(t => t.key !== 'overview').map((tab) => (
          <motion.div
            key={tab.key}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group cursor-pointer"
            onClick={() => setActiveTab(tab.key)}
          >
            <Card hoverable className="h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', tab.color)}>
                  <tab.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
                  查看详情 <span>→</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{tab.label}</h3>
              <p className="text-sm text-gray-500">
                {tab.key === 'rfm' && '基于RFM模型的会员价值分析，识别高价值和流失风险会员'}
                {tab.key === 'consumption' && '消费类目占比、趋势分析及行业基准对比'}
                {tab.key === 'visit' && '会员到店频次、时间分布及消费相关性分析'}
                {tab.key === 'space' && '场地使用率热力图、对比分析及排班建议'}
                {tab.key === 'recommend' && '基于协同过滤的个性化酒款和活动推荐'}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card title="快速洞察" subtitle="系统自动发现的关键业务洞察" icon={<Sparkles className="w-5 h-5 text-purple-500" />}>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-transparent rounded-xl border border-amber-100"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">高价值会员增长显著</div>
              <div className="text-sm text-gray-600">本月新增钻石会员12人，高价值会员占比达到25%，建议增加专属服务投入。</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">沉睡会员需要关注</div>
              <div className="text-sm text-gray-600">有86名会员超过90天未到店消费，建议启动召回营销活动。</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Wine className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">酒水消费增长强劲</div>
              <div className="text-sm text-gray-600">高端酒款推荐转化率达到12%，建议增加酒款品鉴活动。</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">周末场地需求旺盛</div>
              <div className="text-sm text-gray-600">周末场地平均使用率达到78%，建议在周末增加服务人员配置。</div>
            </div>
          </motion.div>
        </div>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'rfm':
        return <RFMAnalysis key={`rfm-${refreshKey}`} levelFilter={levelFilter} genderFilter={genderFilter} ageGroupFilter={ageGroupFilter} tagFilterIds={tagFilterIds} tagMatchAll={tagMatchAll} />
      case 'consumption':
        return <ConsumptionAnalysis key={`consumption-${refreshKey}`} levelFilter={levelFilter} genderFilter={genderFilter} ageGroupFilter={ageGroupFilter} tagFilterIds={tagFilterIds} tagMatchAll={tagMatchAll} />
      case 'visit':
        return <VisitAnalysis key={`visit-${refreshKey}`} levelFilter={levelFilter} genderFilter={genderFilter} ageGroupFilter={ageGroupFilter} tagFilterIds={tagFilterIds} tagMatchAll={tagMatchAll} />
      case 'space':
        return <SpaceAnalysis key={`space-${refreshKey}`} levelFilter={levelFilter} genderFilter={genderFilter} ageGroupFilter={ageGroupFilter} tagFilterIds={tagFilterIds} tagMatchAll={tagMatchAll} />
      case 'recommend':
        return <RecommendAnalysis key={`recommend-${refreshKey}`} levelFilter={levelFilter} genderFilter={genderFilter} ageGroupFilter={ageGroupFilter} tagFilterIds={tagFilterIds} tagMatchAll={tagMatchAll} />
      case 'alerts':
        return <AlertManagement key={`alerts-${refreshKey}`} onUnreadChange={setUnreadAlertCount} />
      default:
        return renderOverview()
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">会所会员消费行为分析看板</h1>
            <p className="mt-1 text-gray-500">全面洞察会员消费行为，助力精细化运营决策</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('alerts')
                refreshAlertCount()
              }}
              className="relative"
            >
              <Bell className={cn('w-4 h-4', unreadAlertCount > 0 ? 'text-red-500' : '')} />
              <span className="hidden md:inline ml-1.5">预警</span>
              {unreadAlertCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
                >
                  {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
                </motion.span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Tag className="w-4 h-4" />}
              onClick={() => navigate('/tags')}
            >
              标签管理
            </Button>
            <DataExport />
          </div>
        </div>

        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 scrollbar-hide">
          {tabs.map(tab => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {activeTab !== 'overview' && activeTab !== 'alerts' && (
          <FilterBar
            levelFilter={levelFilter}
            genderFilter={genderFilter}
            ageGroupFilter={ageGroupFilter}
            tagFilterIds={tagFilterIds}
            tagMatchAll={tagMatchAll}
            refreshKey={refreshKey}
            onLevelFilterChange={setLevelFilter}
            onGenderFilterChange={setGenderFilter}
            onAgeGroupFilterChange={setAgeGroupFilter}
            onTagFilterChange={handleTagFilterChange}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
