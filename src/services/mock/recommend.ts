import dayjs from 'dayjs'
import type { Recommendation, RecommendationEffect, RecommendationType } from '../../types/recommend'
import type { ConsumptionRecord, ConsumptionCategory } from '../../types/consumption'
import { generateConsumptionRecords, generateMembers } from './members'

interface WineItem {
  id: string
  name: string
  image: string
  price: number
  description: string
  flavorTags: string[]
  origin: string
  year: number
  type: string
}

interface ActivityItem {
  id: string
  name: string
  image: string
  date: string
  time: string
  location: string
  price: number
  description: string
  capacity: number
  registered: number
  category: string
}

const flavorTags = ['果香浓郁', '口感圆润', '单宁柔和', '酸度清爽', '香气复杂', '回味悠长', '酒体饱满', '优雅细腻', '清新爽口', '醇厚绵密']
const wineTypes = ['红葡萄酒', '白葡萄酒', '香槟', '威士忌', '白兰地', '伏特加', '朗姆酒', '金酒']
const origins = ['法国波尔多', '意大利托斯卡纳', '西班牙里奥哈', '德国摩泽尔', '美国纳帕谷', '智利中央谷地', '澳大利亚巴罗萨', '中国烟台']
const wineNames = [
  '拉菲古堡', '木桐酒庄', '白马庄园', '奥比昂酒庄', '拉图酒庄',
  '玛歌酒庄', '奥松酒庄', '柏图斯', '里鹏酒庄', '金钟酒庄',
  '西施佳雅', '索拉雅', '嘉雅', '天娜', '马赛多',
  ' Vega Sicilia', 'Pingus', 'Dominio de Pingus', 'La Rioja Alta', 'Marques de Riscal',
  'Egon Muller', 'Joh. Jos. Prum', 'Trimbach', 'Domaine Weinbach', 'Zind-Humbrecht',
  'Opus One', 'Screaming Eagle', 'Caymus', 'Silver Oak', 'Stag\'s Leap'
]

const activityNames = [
  '春季品酒会', '红酒文化讲座', '雪茄品鉴之夜', '爵士音乐现场', '米其林私宴',
  '高尔夫邀请赛', '艺术展览开幕', '精品咖啡课程', '瑜伽冥想体验', '美妆沙龙',
  '投资理财分享会', '亲子烘焙活动', '古典音乐会', '摄影工作坊', '茶道体验',
  '游艇出海之旅', '马术体验日', '滑雪度假团', '温泉养生之旅', '美食探索之旅'
]

const activityCategories = ['品鉴活动', '文化讲座', '音乐演出', '美食盛宴', '体育运动', '艺术展览', '课程培训', '休闲度假']

let winesCache: WineItem[] | null = null
let activitiesCache: ActivityItem[] | null = null
let itemSimilarityCache: Map<string, Map<string, number>> | null = null

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateWines(): WineItem[] {
  if (winesCache) return winesCache

  const wines: WineItem[] = []

  for (let i = 0; i < 30; i++) {
    const selectedTags: string[] = []
    while (selectedTags.length < 3) {
      const tag = randomChoice(flavorTags)
      if (!selectedTags.includes(tag)) selectedTags.push(tag)
    }

    wines.push({
      id: `W${(i + 1).toString().padStart(4, '0')}`,
      name: wineNames[i] || `${randomChoice(origins)}精选`,
      image: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wine%20bottle%20${encodeURIComponent(wineNames[i] || 'wine')}%20on%20dark%20background&image_size=square`,
      price: randomFloat(200, 5000),
      description: `来自${randomChoice(origins)}的精选佳酿，${randomChoice(flavorTags)}，是${randomChoice(['商务宴请', '私人收藏', '送礼佳品', '日常品鉴'])}的理想选择。`,
      flavorTags: selectedTags,
      origin: randomChoice(origins),
      year: randomInt(2010, 2022),
      type: randomChoice(wineTypes)
    })
  }

  winesCache = wines
  return wines
}

function generateActivities(): ActivityItem[] {
  if (activitiesCache) return activitiesCache

  const activities: ActivityItem[] = []

  for (let i = 0; i < 20; i++) {
    const eventDate = dayjs().add(randomInt(7, 90), 'day')
    const capacity = randomInt(20, 100)

    activities.push({
      id: `A${(i + 1).toString().padStart(4, '0')}`,
      name: activityNames[i] || `${activityCategories[i % activityCategories.length]}${i + 1}`,
      image: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20${encodeURIComponent(activityNames[i] || 'event')}%20event%20elegant%20atmosphere&image_size=landscape_16_9`,
      date: eventDate.format('YYYY-MM-DD'),
      time: `${randomInt(14, 20)}:${randomInt(0, 59).toString().padStart(2, '0')}`,
      location: `${randomChoice(['会所宴会厅', '红酒窖', '户外花园', '多功能厅', '私人包间'])}`,
      price: randomFloat(200, 3000),
      description: `${activityNames[i]}将为您带来${randomChoice(['难忘', '精彩', '独特', '奢华', '优雅'])}的体验，${randomChoice(['专业讲师', '知名嘉宾', '顶级厨师', '艺术大师'])}现场助阵。`,
      capacity,
      registered: randomInt(0, capacity),
      category: randomChoice(activityCategories)
    })
  }

  activitiesCache = activities
  return activities
}

function buildUserItemMatrix(): Map<string, Map<string, number>> {
  const records = generateConsumptionRecords()
  const userItems = new Map<string, Map<string, number>>()

  records.forEach(record => {
    if (!userItems.has(record.memberId)) {
      userItems.set(record.memberId, new Map())
    }
    const items = userItems.get(record.memberId)!
    const key = `${record.category}-${record.subCategory}`
    items.set(key, (items.get(key) || 0) + record.amount)
  })

  return userItems
}

function calculateItemSimilarities(): Map<string, Map<string, number>> {
  if (itemSimilarityCache) return itemSimilarityCache

  const userItems = buildUserItemMatrix()
  const itemUsers = new Map<string, Set<string>>()

  userItems.forEach((items, userId) => {
    items.forEach((_, itemKey) => {
      if (!itemUsers.has(itemKey)) {
        itemUsers.set(itemKey, new Set())
      }
      itemUsers.get(itemKey)!.add(userId)
    })
  })

  const similarities = new Map<string, Map<string, number>>()
  const itemKeys = Array.from(itemUsers.keys())

  for (let i = 0; i < itemKeys.length; i++) {
    const itemI = itemKeys[i]
    const usersI = itemUsers.get(itemI)!
    const similaritiesI = new Map<string, number>()

    for (let j = 0; j < itemKeys.length; j++) {
      if (i === j) {
        similaritiesI.set(itemKeys[j], 1.0)
        continue
      }
      const itemJ = itemKeys[j]
      const usersJ = itemUsers.get(itemJ)!

      const intersection = new Set([...usersI].filter(u => usersJ.has(u)))
      const union = new Set([...usersI, ...usersJ])

      const jaccard = union.size > 0 ? intersection.size / union.size : 0
      similaritiesI.set(itemJ, parseFloat(jaccard.toFixed(4)))
    }

    similarities.set(itemI, similaritiesI)
  }

  itemSimilarityCache = similarities
  return similarities
}

function getUserPreferences(memberId: string): Map<string, number> {
  const records = generateConsumptionRecords()
  const preferences = new Map<string, number>()

  const memberRecords = records.filter(r => r.memberId === memberId)
  memberRecords.forEach(record => {
    const key = `${record.category}-${record.subCategory}`
    preferences.set(key, (preferences.get(key) || 0) + record.amount)
  })

  return preferences
}

function getRecommendationReason(itemKey: string, matchScore: number): string {
  const reasons = [
    `根据您的消费历史，我们为您精选了这款${itemKey.split('-')[0]}相关的推荐`,
    `与您经常消费的项目高度匹配，匹配度${(matchScore * 100).toFixed(0)}%`,
    `基于相似会员的消费偏好，这款产品可能符合您的口味`,
    `您之前对同类产品有较高的消费频次，相信您会喜欢`
  ]
  return randomChoice(reasons)
}

function getSimilarFeedback(itemKey: string): string {
  const feedbacks = [
    '与您消费习惯相似的会员中有85%选择了这款产品',
    '类似偏好的会员回购率达到72%',
    '90%的高价值会员对此评价优秀',
    '该品类是您所在会员群体的热门选择'
  ]
  return randomChoice(feedbacks)
}

export function getWineRecommendations(memberId: string): Recommendation[] {
  const wines = generateWines()
  const similarities = calculateItemSimilarities()
  const userPreferences = getUserPreferences(memberId)

  if (userPreferences.size === 0) {
    return wines.slice(0, 10).map((wine, index) => ({
      id: `R-${wine.id}`,
      memberId,
      type: 'wine' as RecommendationType,
      itemName: wine.name,
      itemImage: wine.image,
      price: wine.price,
      matchScore: parseFloat((0.5 + Math.random() * 0.3).toFixed(2)),
      reason: getRecommendationReason('酒水-红酒', 0.6),
      similarFeedback: getSimilarFeedback('酒水-红酒'),
      clickCount: randomInt(0, 100),
      convertCount: randomInt(0, 20),
      createDate: dayjs().format('YYYY-MM-DD')
    }))
  }

  const scoredWines: Array<{ wine: WineItem; score: number }> = []

  wines.forEach(wine => {
    let totalScore = 0
    let weightSum = 0

    userPreferences.forEach((prefValue, userItem) => {
      const wineKey = `酒水-${wine.type}`
      const itemSim = similarities.get(userItem)?.get(wineKey) || similarities.get(userItem)?.get('酒水-红酒') || 0.1
      totalScore += itemSim * prefValue
      weightSum += prefValue
    })

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0.5
    const normalizedScore = Math.min(1, Math.max(0.3, finalScore / 10000 + 0.5))

    scoredWines.push({ wine, score: parseFloat(normalizedScore.toFixed(2)) })
  })

  scoredWines.sort((a, b) => b.score - a.score)

  return scoredWines.slice(0, 10).map(({ wine, score }) => ({
    id: `R-${wine.id}`,
    memberId,
    type: 'wine' as RecommendationType,
    itemName: wine.name,
    itemImage: wine.image,
    price: wine.price,
    matchScore: score,
    reason: getRecommendationReason('酒水-红酒', score),
    similarFeedback: getSimilarFeedback('酒水-红酒'),
    clickCount: randomInt(0, 100),
    convertCount: randomInt(0, Math.floor(score * 30)),
    createDate: dayjs().format('YYYY-MM-DD')
  }))
}

export function getActivityRecommendations(memberId: string): Recommendation[] {
  const activities = generateActivities()
  const userPreferences = getUserPreferences(memberId)

  const categoryMapping: Record<ConsumptionCategory, string[]> = {
    '餐饮': ['美食盛宴', '品鉴活动'],
    '酒水': ['品鉴活动', '音乐演出'],
    'SPA': ['休闲度假', '课程培训'],
    '棋牌': ['品鉴活动', '休闲度假'],
    '客房': ['休闲度假', '美食盛宴']
  }

  const preferredCategories = new Set<string>()
  userPreferences.forEach((_, key) => {
    const category = key.split('-')[0] as ConsumptionCategory
    categoryMapping[category]?.forEach(cat => preferredCategories.add(cat))
  })

  const scoredActivities: Array<{ activity: ActivityItem; score: number }> = []

  activities.forEach(activity => {
    let score = 0.5
    if (preferredCategories.has(activity.category)) {
      score = 0.75
    }
    if (activity.registered / activity.capacity > 0.7) {
      score += 0.1
    }
    score = Math.min(1, score + randomFloat(-0.1, 0.1))

    scoredActivities.push({ activity, score: parseFloat(score.toFixed(2)) })
  })

  scoredActivities.sort((a, b) => b.score - a.score)

  return scoredActivities.slice(0, 8).map(({ activity, score }) => ({
    id: `R-${activity.id}`,
    memberId,
    type: 'activity' as RecommendationType,
    itemName: activity.name,
    itemImage: activity.image,
    price: activity.price,
    matchScore: score,
    reason: getRecommendationReason('活动', score),
    similarFeedback: getSimilarFeedback('活动'),
    clickCount: randomInt(0, 200),
    convertCount: randomInt(0, Math.floor(score * 50)),
    createDate: dayjs().format('YYYY-MM-DD')
  }))
}

export function getRecommendationEffect(): RecommendationEffect[] {
  const effects: RecommendationEffect[] = []
  const endDate = dayjs()
  const startDate = endDate.subtract(30, 'day')

  let current = startDate
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const impressions = randomInt(500, 2000)
    const ctr = randomFloat(0.05, 0.15)
    const conversionRate = randomFloat(0.02, 0.08)
    const clicks = Math.floor(impressions * ctr)
    const conversions = Math.floor(clicks * conversionRate)

    effects.push({
      date: current.format('YYYY-MM-DD'),
      impressions,
      clicks,
      conversions,
      ctr: parseFloat((ctr * 100).toFixed(2)),
      conversionRate: parseFloat((conversionRate * 100).toFixed(2))
    })

    current = current.add(1, 'day')
  }

  return effects
}

export function getWineList(): WineItem[] {
  return generateWines()
}

export function getActivityList(): ActivityItem[] {
  return generateActivities()
}

export function getRecommendationSummary(): {
  totalWineRecommended: number
  totalActivityRecommended: number
  avgMatchScore: number
  totalClicks: number
  totalConversions: number
  overallCTR: number
  overallConversionRate: number
} {
  const members = generateMembers()
  return getRecommendationSummaryFiltered(members.map(m => m.id))
}

export function getRecommendationSummaryFiltered(memberIds: string[]): {
  totalWineRecommended: number
  totalActivityRecommended: number
  avgMatchScore: number
  totalClicks: number
  totalConversions: number
  overallCTR: number
  overallConversionRate: number
} {
  const sampleMembers = memberIds.length > 100 ? memberIds.slice(0, 100) : memberIds

  let totalMatchScore = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalImpressions = 0
  let wineCount = 0
  let activityCount = 0

  sampleMembers.forEach(memberId => {
    const wineRecs = getWineRecommendations(memberId)
    const activityRecs = getActivityRecommendations(memberId)

    wineCount += wineRecs.length
    activityCount += activityRecs.length

    ;[...wineRecs, ...activityRecs].forEach(rec => {
      totalMatchScore += rec.matchScore
      totalClicks += rec.clickCount
      totalConversions += rec.convertCount
      totalImpressions += 100
    })
  })

  const totalRecs = wineCount + activityCount

  return {
    totalWineRecommended: wineCount,
    totalActivityRecommended: activityCount,
    avgMatchScore: totalRecs > 0 ? parseFloat((totalMatchScore / totalRecs).toFixed(2)) : 0,
    totalClicks,
    totalConversions,
    overallCTR: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    overallConversionRate: totalClicks > 0 ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2)) : 0,
  }
}

export function getRecommendationEffectFiltered(memberIds: string[]): RecommendationEffect[] {
  const allEffects = getRecommendationEffect()
  const ratio = memberIds.length / generateMembers().length

  return allEffects.map(e => {
    const impressions = Math.max(1, Math.round(e.impressions * ratio))
    const clicks = Math.max(0, Math.round(e.clicks * ratio))
    const conversions = Math.max(0, Math.round(e.conversions * ratio))
    const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0
    const conversionRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0

    return {
      date: e.date,
      impressions,
      clicks,
      conversions,
      ctr,
      conversionRate,
    }
  })
}
