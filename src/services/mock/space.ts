import dayjs from 'dayjs'
import type { Space, SpaceUsage, ScheduleRecommendation, UsageComparison, SpaceType } from '../../types/space'
import { generateMembers, generateConsumptionRecords } from './members'
import type { MemberLevel, Gender, AgeGroup } from '../../types/member'
import { getWeekdayName, isWeekend } from '../../utils/date'

const spaceConfigs: Array<{
  type: SpaceType
  count: number
  capacityRange: [number, number]
  baseLocation: string
}> = [
  { type: '餐厅', count: 3, capacityRange: [50, 150], baseLocation: '1楼' },
  { type: '酒吧', count: 2, capacityRange: [30, 80], baseLocation: '2楼' },
  { type: 'SPA中心', count: 4, capacityRange: [10, 30], baseLocation: '3楼' },
  { type: '棋牌室', count: 6, capacityRange: [4, 12], baseLocation: '4楼' },
  { type: '客房', count: 20, capacityRange: [2, 4], baseLocation: '5-8楼' },
  { type: '会议室', count: 3, capacityRange: [20, 100], baseLocation: '9楼' }
]

const spaceDescriptions: Record<SpaceType, string[]> = {
  '餐厅': ['提供精致中餐和西餐', '可容纳大型宴会', '配有私人包间', '环境优雅舒适'],
  '酒吧': ['精选全球名酒', '专业调酒师', '夜间现场音乐', 'VIP专属区域'],
  'SPA中心': ['专业理疗师团队', '进口精油产品', '私密护理空间', '配套桑拿浴室'],
  '棋牌室': ['豪华麻将室', '专业扑克桌', '配套茶点服务', '独立通风系统'],
  '客房': ['豪华装修配置', '24小时管家服务', '迷你吧免费', '智能控制系统'],
  '会议室': ['现代化投影设备', '高速网络接入', '视频会议系统', '茶歇服务']
}

let spacesCache: Space[] | null = null
let usageCache: Map<string, SpaceUsage[]> | null = null

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function generateSpaces(): Space[] {
  if (spacesCache) return spacesCache

  const spaces: Space[] = []
  let idCounter = 1

  for (const config of spaceConfigs) {
    for (let i = 0; i < config.count; i++) {
      const capacity = randomInt(config.capacityRange[0], config.capacityRange[1])
      const description = spaceDescriptions[config.type][i % spaceDescriptions[config.type].length]

      spaces.push({
        id: `S${idCounter.toString().padStart(4, '0')}`,
        name: `${config.type}${config.count > 1 ? ` ${i + 1}号` : ''}`,
        type: config.type,
        capacity,
        location: `${config.baseLocation} ${config.type}区`,
        description
      })
      idCounter++
    }
  }

  spacesCache = spaces
  return spaces
}

function generateUsageRate(hour: number, isWeekendDay: boolean, spaceType: SpaceType): number {
  const hourMultiplier: Record<SpaceType, Record<number, number>> = {
    '餐厅': { 11: 0.6, 12: 0.9, 13: 0.8, 18: 0.7, 19: 0.95, 20: 0.9, 21: 0.6 },
    '酒吧': { 19: 0.3, 20: 0.6, 21: 0.85, 22: 0.95, 23: 0.8 },
    'SPA中心': { 10: 0.4, 14: 0.7, 15: 0.8, 16: 0.85, 19: 0.7, 20: 0.6 },
    '棋牌室': { 14: 0.5, 15: 0.6, 19: 0.7, 20: 0.85, 21: 0.9, 22: 0.8 },
    '客房': { 14: 0.3, 18: 0.5, 20: 0.7, 21: 0.8, 22: 0.85, 23: 0.7 },
    '会议室': { 9: 0.6, 10: 0.8, 11: 0.7, 14: 0.8, 15: 0.85, 16: 0.7, 17: 0.5 }
  }

  const baseRate = hourMultiplier[spaceType][hour] || 0.1
  const weekendBoost = isWeekendDay ? 1.3 : 1
  const randomVariation = randomFloat(0.8, 1.2)

  return Math.min(100, parseFloat((baseRate * weekendBoost * randomVariation * 100).toFixed(1)))
}

function generateSpaceUsage(space: Space): SpaceUsage[] {
  const usages: SpaceUsage[] = []
  const endDate = dayjs()
  const startDate = endDate.subtract(3, 'month')

  let current = startDate.startOf('day')
  const end = endDate.endOf('day')

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const weekendFlag = isWeekend(current.toDate())
    const weekdayName = getWeekdayName(current.toDate(), 'zh')

    for (let hour = 9; hour <= 23; hour++) {
      const usageRate = generateUsageRate(hour, weekendFlag, space.type)
      const headcount = Math.floor(space.capacity * (usageRate / 100) * randomFloat(0.8, 1.2))
      const satisfaction = parseFloat((randomFloat(3.5, 5.0)).toFixed(1))

      usages.push({
        spaceId: space.id,
        spaceName: space.name,
        spaceType: space.type,
        date: current.format('YYYY-MM-DD'),
        hour,
        weekday: weekdayName,
        usageRate,
        satisfaction,
        headcount
      })
    }

    current = current.add(1, 'day')
  }

  return usages
}

function getAllUsageData(): Map<string, SpaceUsage[]> {
  if (usageCache) return usageCache

  const spaces = generateSpaces()
  const cache = new Map<string, SpaceUsage[]>()

  for (const space of spaces) {
    cache.set(space.id, generateSpaceUsage(space))
  }

  usageCache = cache
  return cache
}

export function getSpaceList(): Space[] {
  return generateSpaces()
}

export function getSpaceUsageHeatmap(spaceId: string): SpaceUsage[] {
  const allUsage = getAllUsageData()
  return allUsage.get(spaceId) || []
}

export function getUsageComparison(): UsageComparison[] {
  const spaces = generateSpaces()
  const allUsage = getAllUsageData()
  const results: UsageComparison[] = []

  for (const space of spaces) {
    const usages = allUsage.get(space.id) || []

    const weekdayEveningUsages = usages.filter(u => {
      const isWeekday = !isWeekend(u.date)
      const isEvening = u.hour >= 18 && u.hour <= 21
      return isWeekday && isEvening
    })

    const weekendUsages = usages.filter(u => isWeekend(u.date) && u.hour >= 10 && u.hour <= 23)

    const weekdayEveningAvg = weekdayEveningUsages.length > 0
      ? weekdayEveningUsages.reduce((sum, u) => sum + u.usageRate, 0) / weekdayEveningUsages.length
      : 0

    const weekendAvg = weekendUsages.length > 0
      ? weekendUsages.reduce((sum, u) => sum + u.usageRate, 0) / weekendUsages.length
      : 0

    const peakHour = usages.reduce((max, u) => u.usageRate > max.usageRate ? u : max, usages[0])

    results.push({
      space: space.name,
      weekdayEvening: parseFloat(weekdayEveningAvg.toFixed(1)),
      weekend: parseFloat(weekendAvg.toFixed(1)),
      peakHour: peakHour?.hour ?? 12
    })
  }

  return results
}

export function getScheduleRecommendations(): ScheduleRecommendation[] {
  const allUsage = getAllUsageData()
  const allUsages = Array.from(allUsage.values()).flat()

  const shiftPatterns = [
    { shift: '早班(08:00-16:00)', hours: [8, 9, 10, 11, 12, 13, 14, 15], skill: '基础服务' },
    { shift: '中班(12:00-20:00)', hours: [12, 13, 14, 15, 16, 17, 18, 19], skill: '餐饮服务' },
    { shift: '晚班(16:00-24:00)', hours: [16, 17, 18, 19, 20, 21, 22, 23], skill: '高端服务' },
    { shift: '夜班(22:00-06:00)', hours: [22, 23, 0, 1, 2, 3, 4, 5], skill: '安保/后勤' }
  ]

  const recommendations: ScheduleRecommendation[] = []

  for (const pattern of shiftPatterns) {
    const relevantUsages = allUsages.filter(u => pattern.hours.includes(u.hour))
    const avgUsage = relevantUsages.length > 0
      ? relevantUsages.reduce((sum, u) => sum + u.usageRate, 0) / relevantUsages.length
      : 0

    const avgHeadcount = relevantUsages.length > 0
      ? relevantUsages.reduce((sum, u) => sum + u.headcount, 0) / relevantUsages.length
      : 0

    const requiredStaff = Math.max(2, Math.ceil(avgHeadcount / 15 * (avgUsage / 100)))
    const costEstimate = requiredStaff * 200

    recommendations.push({
      shift: pattern.shift,
      requiredStaff,
      suggestedSkill: pattern.skill,
      costEstimate
    })
  }

  return recommendations
}

export function getSpaceTypeSummary(): {
  type: SpaceType
  count: number
  totalCapacity: number
  avgUsageRate: number
  avgSatisfaction: number
}[] {
  const spaces = generateSpaces()
  const allUsage = getAllUsageData()
  const typeMap = new Map<SpaceType, { count: number; totalCapacity: number; usages: SpaceUsage[] }>()

  for (const space of spaces) {
    if (!typeMap.has(space.type)) {
      typeMap.set(space.type, { count: 0, totalCapacity: 0, usages: [] })
    }
    const data = typeMap.get(space.type)!
    data.count++
    data.totalCapacity += space.capacity
    data.usages.push(...(allUsage.get(space.id) || []))
  }

  return Array.from(typeMap.entries()).map(([type, data]) => {
    const avgUsageRate = data.usages.length > 0
      ? data.usages.reduce((sum, u) => sum + u.usageRate, 0) / data.usages.length
      : 0
    const avgSatisfaction = data.usages.length > 0
      ? data.usages.reduce((sum, u) => sum + u.satisfaction, 0) / data.usages.length
      : 0

    return {
      type,
      count: data.count,
      totalCapacity: data.totalCapacity,
      avgUsageRate: parseFloat(avgUsageRate.toFixed(1)),
      avgSatisfaction: parseFloat(avgSatisfaction.toFixed(2))
    }
  })
}

export function getHourlyUsageTrend(spaceId: string): {
  hours: number[]
  weekdayAvg: number[]
  weekendAvg: number[]
} {
  const usages = getSpaceUsageHeatmap(spaceId)
  const hours = Array.from({ length: 15 }, (_, i) => i + 9)

  const weekdayData = new Map<number, number[]>()
  const weekendData = new Map<number, number[]>()

  hours.forEach(h => {
    weekdayData.set(h, [])
    weekendData.set(h, [])
  })

  usages.forEach(u => {
    const weekendFlag = isWeekend(u.date)
    const target = weekendFlag ? weekendData : weekdayData
    target.get(u.hour)?.push(u.usageRate)
  })

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return {
    hours,
    weekdayAvg: hours.map(h => parseFloat(avg(weekdayData.get(h) || []).toFixed(1))),
    weekendAvg: hours.map(h => parseFloat(avg(weekendData.get(h) || []).toFixed(1)))
  }
}

const spaceTypeCategoryMap: Record<SpaceType, string[]> = {
  '餐厅': ['餐饮'],
  '酒吧': ['酒水'],
  'SPA中心': ['SPA'],
  '棋牌室': ['棋牌'],
  '客房': ['客房'],
  '会议室': ['餐饮', '酒水'],
}

function getFilteredMemberIds(
  levelFilter?: string,
  genderFilter?: string,
  ageGroupFilter?: string,
  tagFilterIds?: string[],
  tagMatchAll: boolean = false
): Set<string> | null {
  const hasLevelFilter = levelFilter && levelFilter !== '全部'
  const hasGenderFilter = genderFilter && genderFilter !== '全部'
  const hasAgeGroupFilter = ageGroupFilter && ageGroupFilter !== '全部'
  const hasTagFilter = tagFilterIds && tagFilterIds.length > 0

  if (!hasLevelFilter && !hasGenderFilter && !hasAgeGroupFilter && !hasTagFilter) return null

  const members = generateMembers()
  return new Set(
    members
      .filter(m => {
        if (hasLevelFilter && m.level !== levelFilter) return false
        if (hasGenderFilter && m.gender !== genderFilter) return false
        if (hasAgeGroupFilter && m.ageGroup !== ageGroupFilter) return false
        if (hasTagFilter) {
          if (tagMatchAll) {
            if (!tagFilterIds!.every(tid => m.tags.includes(tid))) return false
          } else {
            if (!tagFilterIds!.some(tid => m.tags.includes(tid))) return false
          }
        }
        return true
      })
      .map(m => m.id)
  )
}

function getSpaceTypeUsageWeight(
  spaceType: SpaceType,
  memberIds: Set<string> | null
): number {
  if (!memberIds) return 1

  const records = generateConsumptionRecords()
  const relatedCategories = spaceTypeCategoryMap[spaceType]

  const filteredRecords = records.filter(
    r => memberIds.has(r.memberId) && relatedCategories.includes(r.category)
  )
  const totalRecords = records.filter(
    r => relatedCategories.includes(r.category)
  )

  if (totalRecords.length === 0) return 1
  return filteredRecords.length / totalRecords.length
}

export function getUsageComparisonFiltered(
  levelFilter?: string,
  genderFilter?: string,
  ageGroupFilter?: string,
  tagFilterIds?: string[],
  tagMatchAll?: boolean
): UsageComparison[] {
  const base = getUsageComparison()
  const memberIds = getFilteredMemberIds(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll)

  if (!memberIds) return base

  return base.map(item => {
    const space = generateSpaces().find(s => s.name === item.space)
    if (!space) return item

    const weight = getSpaceTypeUsageWeight(space.type, memberIds)

    return {
      ...item,
      weekdayEvening: parseFloat((item.weekdayEvening * weight).toFixed(1)),
      weekend: parseFloat((item.weekend * weight).toFixed(1)),
    }
  })
}

export function getSpaceTypeSummaryFiltered(
  levelFilter?: string,
  genderFilter?: string,
  ageGroupFilter?: string,
  tagFilterIds?: string[],
  tagMatchAll?: boolean
): {
  type: SpaceType
  count: number
  totalCapacity: number
  avgUsageRate: number
  avgSatisfaction: number
}[] {
  const base = getSpaceTypeSummary()
  const memberIds = getFilteredMemberIds(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll)

  if (!memberIds) return base

  return base.map(item => {
    const weight = getSpaceTypeUsageWeight(item.type, memberIds)
    const satisfactionShift = memberIds.size < 250 ? 0.15 : -0.05

    return {
      ...item,
      avgUsageRate: parseFloat(Math.min(100, item.avgUsageRate * weight).toFixed(1)),
      avgSatisfaction: parseFloat(Math.min(5, Math.max(3, item.avgSatisfaction + satisfactionShift)).toFixed(2)),
    }
  })
}

export function getHourlyUsageTrendFiltered(
  spaceId: string,
  levelFilter?: string,
  genderFilter?: string,
  ageGroupFilter?: string,
  tagFilterIds?: string[],
  tagMatchAll?: boolean
): {
  hours: number[]
  weekdayAvg: number[]
  weekendAvg: number[]
} {
  const base = getHourlyUsageTrend(spaceId)
  const memberIds = getFilteredMemberIds(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll)

  if (!memberIds) return base

  const space = generateSpaces().find(s => s.id === spaceId)
  if (!space) return base

  const weight = getSpaceTypeUsageWeight(space.type, memberIds)

  return {
    hours: base.hours,
    weekdayAvg: base.weekdayAvg.map(v => parseFloat(Math.min(100, v * weight).toFixed(1))),
    weekendAvg: base.weekendAvg.map(v => parseFloat(Math.min(100, v * weight).toFixed(1))),
  }
}

export function getScheduleRecommendationsFiltered(
  levelFilter?: string,
  genderFilter?: string,
  ageGroupFilter?: string,
  tagFilterIds?: string[],
  tagMatchAll?: boolean
): ScheduleRecommendation[] {
  const base = getScheduleRecommendations()
  const memberIds = getFilteredMemberIds(levelFilter, genderFilter, ageGroupFilter, tagFilterIds, tagMatchAll)

  if (!memberIds) return base

  const ratio = memberIds.size / generateMembers().length

  return base.map(item => ({
    ...item,
    requiredStaff: Math.max(1, Math.round(item.requiredStaff * ratio)),
    costEstimate: Math.max(200, Math.round(item.costEstimate * ratio)),
  }))
}
