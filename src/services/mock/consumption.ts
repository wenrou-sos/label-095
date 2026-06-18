import dayjs from 'dayjs'
import type { ConsumptionCategory, CategoryBreakdown, TrendDataPoint, BenchmarkData, ConsumptionRecord } from '../../types/consumption'
import { generateConsumptionRecords, generateMembers } from './members'
import type { MemberLevel, Gender, AgeGroup } from '../../types/member'

export type Granularity = 'day' | 'week' | 'month' | 'quarter'

const categories: ConsumptionCategory[] = ['餐饮', '酒水', 'SPA', '棋牌', '客房']
const categoryColors: Record<ConsumptionCategory, string> = {
  '餐饮': '#FF6B6B',
  '酒水': '#4ECDC4',
  'SPA': '#45B7D1',
  '棋牌': '#96CEB4',
  '客房': '#FFEAA7'
}

interface CrossAnalysisData {
  categories: ConsumptionCategory[]
  matrix: number[][]
  correlation: Record<string, number>
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export function getCategoryBreakdown(): CategoryBreakdown[] {
  const records = generateConsumptionRecords()
  const categoryTotals: Record<ConsumptionCategory, number> = {
    '餐饮': 0,
    '酒水': 0,
    'SPA': 0,
    '棋牌': 0,
    '客房': 0
  }

  records.forEach(record => {
    categoryTotals[record.category] += record.amount
  })

  const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  return categories.map(category => ({
    name: category,
    value: parseFloat(categoryTotals[category].toFixed(2)),
    percentage: parseFloat(((categoryTotals[category] / total) * 100).toFixed(2))
  }))
}

export function getTrendData(granularity: Granularity = 'month'): TrendDataPoint[] {
  const records = generateConsumptionRecords()
  const endDate = dayjs()
  const startDate = endDate.subtract(granularity === 'quarter' ? 8 : 12, 'month')

  const dataMap = new Map<string, Record<ConsumptionCategory, number>>()

  const getPeriodUnit = () => {
    if (granularity === 'day') return 'day' as const
    if (granularity === 'week') return 'week' as const
    if (granularity === 'quarter') return 'month' as const
    return 'month' as const
  }

  let current = startDate.startOf(getPeriodUnit())
  const end = endDate.endOf(getPeriodUnit())

  const formatKey = (date: dayjs.Dayjs) => {
    if (granularity === 'quarter') {
      const year = date.year()
      const quarter = Math.ceil(date.month() / 3)
      return `${year}Q${quarter}`
    }
    if (granularity === 'day') return date.format('YYYY-MM-DD')
    if (granularity === 'week') return date.startOf('week').format('YYYY-MM-DD')
    return date.format('YYYY-MM')
  }

  while (current.isBefore(end) || current.isSame(end, getPeriodUnit())) {
    const key = formatKey(current)
    dataMap.set(key, {
      '餐饮': 0,
      '酒水': 0,
      'SPA': 0,
      '棋牌': 0,
      '客房': 0
    })
    current = current.add(1, getPeriodUnit())
  }

  records.forEach(record => {
    const recordDate = dayjs(record.date)
    if (recordDate.isBefore(startDate) || recordDate.isAfter(endDate)) return

    const key = formatKey(recordDate)

    if (dataMap.has(key)) {
      dataMap.get(key)![record.category] += record.amount
    }
  })

  const quarterlyAggregated = new Map<string, Record<ConsumptionCategory, number>>()
  if (granularity === 'quarter') {
    dataMap.forEach((value, key) => {
      if (!quarterlyAggregated.has(key)) {
        quarterlyAggregated.set(key, { '餐饮': 0, '酒水': 0, 'SPA': 0, '棋牌': 0, '客房': 0 })
      }
      const agg = quarterlyAggregated.get(key)!
      categories.forEach(cat => { agg[cat] += value[cat] })
    })
  }

  const finalMap = granularity === 'quarter' ? quarterlyAggregated : dataMap

  return Array.from(finalMap.entries()).map(([date, categories]) => ({
    date,
    categories: {
      '餐饮': parseFloat(categories['餐饮'].toFixed(2)),
      '酒水': parseFloat(categories['酒水'].toFixed(2)),
      'SPA': parseFloat(categories['SPA'].toFixed(2)),
      '棋牌': parseFloat(categories['棋牌'].toFixed(2)),
      '客房': parseFloat(categories['客房'].toFixed(2))
    }
  }))
}

export function getCrossAnalysisData(): CrossAnalysisData {
  const records = generateConsumptionRecords()
  const memberCategories = new Map<string, Set<ConsumptionCategory>>()

  records.forEach(record => {
    if (!memberCategories.has(record.memberId)) {
      memberCategories.set(record.memberId, new Set())
    }
    memberCategories.get(record.memberId)!.add(record.category)
  })

  const matrix: number[][] = categories.map(() => categories.map(() => 0))
  const categoryCounts: Record<ConsumptionCategory, number> = {
    '餐饮': 0,
    '酒水': 0,
    'SPA': 0,
    '棋牌': 0,
    '客房': 0
  }

  memberCategories.forEach(memberCats => {
    const catArray = Array.from(memberCats)
    catArray.forEach(cat => {
      categoryCounts[cat]++
    })
    for (let i = 0; i < catArray.length; i++) {
      for (let j = 0; j < catArray.length; j++) {
        if (i !== j) {
          const idxI = categories.indexOf(catArray[i])
          const idxJ = categories.indexOf(catArray[j])
          matrix[idxI][idxJ]++
        }
      }
    }
  })

  for (let i = 0; i < categories.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      if (i === j) {
        matrix[i][j] = categoryCounts[categories[i]]
      } else if (categoryCounts[categories[i]] > 0) {
        matrix[i][j] = parseFloat(((matrix[i][j] / categoryCounts[categories[i]]) * 100).toFixed(1))
      }
    }
  }

  const correlation: Record<string, number> = {}
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const key = `${categories[i]}_${categories[j]}`
      const coOccurrence = matrix[i][j]
      const maxPossible = Math.min(categoryCounts[categories[i]], categoryCounts[categories[j]])
      correlation[key] = maxPossible > 0 ? parseFloat((coOccurrence / maxPossible * 100).toFixed(1)) : 0
    }
  }

  return {
    categories,
    matrix,
    correlation
  }
}

export function getBenchmarkData(): BenchmarkData {
  const clubBreakdown = getCategoryBreakdown()

  const industryBase: Record<ConsumptionCategory, number> = {
    '餐饮': 32,
    '酒水': 28,
    'SPA': 18,
    '棋牌': 14,
    '客房': 8
  }

  const industryAvg = categories.map(cat => industryBase[cat] + randomFloat(-3, 3))
  const clubData = clubBreakdown.map(b => b.percentage)
  const gap = clubData.map((val, idx) => parseFloat((val - industryAvg[idx]).toFixed(2)))

  return {
    categories,
    industryAvg: industryAvg.map(v => parseFloat(v.toFixed(2))),
    clubData,
    gap
  }
}

export function getConsumptionByTimeSlot(): {
  slots: string[]
  data: Record<ConsumptionCategory, number[]>
} {
  const records = generateConsumptionRecords()
  const slots = ['早餐(06-10)', '午餐(10-14)', '下午茶(14-17)', '晚餐(17-21)', '夜宵(21-24)']

  const slotData: Record<ConsumptionCategory, number[]> = {
    '餐饮': [0, 0, 0, 0, 0],
    '酒水': [0, 0, 0, 0, 0],
    'SPA': [0, 0, 0, 0, 0],
    '棋牌': [0, 0, 0, 0, 0],
    '客房': [0, 0, 0, 0, 0]
  }

  records.forEach(record => {
    const hour = parseInt(record.time.split(':')[0])
    let slotIndex = 0
    if (hour >= 6 && hour < 10) slotIndex = 0
    else if (hour >= 10 && hour < 14) slotIndex = 1
    else if (hour >= 14 && hour < 17) slotIndex = 2
    else if (hour >= 17 && hour < 21) slotIndex = 3
    else slotIndex = 4

    slotData[record.category][slotIndex] += record.amount
  })

  Object.keys(slotData).forEach(key => {
    const cat = key as ConsumptionCategory
    slotData[cat] = slotData[cat].map(v => parseFloat(v.toFixed(2)))
  })

  return {
    slots,
    data: slotData
  }
}

export function getConsumptionByWeekday(): {
  weekdays: string[]
  data: Record<ConsumptionCategory, number[]>
} {
  const records = generateConsumptionRecords()
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const weekdayMap: Record<string, number> = {
    '星期一': 0, '星期二': 1, '星期三': 2, '星期四': 3, '星期五': 4, '星期六': 5, '星期日': 6
  }

  const weekdayData: Record<ConsumptionCategory, number[]> = {
    '餐饮': [0, 0, 0, 0, 0, 0, 0],
    '酒水': [0, 0, 0, 0, 0, 0, 0],
    'SPA': [0, 0, 0, 0, 0, 0, 0],
    '棋牌': [0, 0, 0, 0, 0, 0, 0],
    '客房': [0, 0, 0, 0, 0, 0, 0]
  }

  records.forEach(record => {
    const idx = weekdayMap[record.weekday] ?? 0
    weekdayData[record.category][idx] += record.amount
  })

  Object.keys(weekdayData).forEach(key => {
    const cat = key as ConsumptionCategory
    weekdayData[cat] = weekdayData[cat].map(v => parseFloat(v.toFixed(2)))
  })

  return {
    weekdays,
    data: weekdayData
  }
}

export function getPaymentMethodStats(): {
  methods: string[]
  amounts: number[]
  counts: number[]
} {
  const records = generateConsumptionRecords()
  const methodStats = new Map<string, { amount: number; count: number }>()

  records.forEach(record => {
    if (!methodStats.has(record.paymentMethod)) {
      methodStats.set(record.paymentMethod, { amount: 0, count: 0 })
    }
    const stats = methodStats.get(record.paymentMethod)!
    stats.amount += record.amount
    stats.count++
  })

  const methods = Array.from(methodStats.keys())
  const amounts = methods.map(m => parseFloat(methodStats.get(m)!.amount.toFixed(2)))
  const counts = methods.map(m => methodStats.get(m)!.count)

  return { methods, amounts, counts }
}

export { categoryColors }

export function getCrossAnalysisDataByDimension(
  dimension: 'level' | 'gender' | 'ageGroup'
): CrossAnalysisData & {
  dimension: 'level' | 'gender' | 'ageGroup'
  groups: string[]
} {
  const members = generateMembers()
  const records = generateConsumptionRecords()

  const getMemberGroups = (): string[] => {
    switch (dimension) {
      case 'level':
        return ['钻石', '金卡', '银卡', '普通']
      case 'gender':
        return ['男', '女']
      case 'ageGroup':
        return ['18-25', '26-35', '36-45', '46-55', '55+']
      default:
        return []
    }
  }

  const groups = getMemberGroups()

  const getMemberDimensionValue = (memberId: string): string | undefined => {
    const member = members.find(m => m.id === memberId)
    if (!member) return undefined
    switch (dimension) {
      case 'level':
        return member.level
      case 'gender':
        return member.gender
      case 'ageGroup':
        return member.ageGroup
      default:
        return undefined
    }
  }

  const groupCategoryAmount: Record<string, Record<ConsumptionCategory, number>> = {}
  const groupCategoryCount: Record<string, Record<ConsumptionCategory, number>> = {}

  groups.forEach(group => {
    groupCategoryAmount[group] = { '餐饮': 0, '酒水': 0, 'SPA': 0, '棋牌': 0, '客房': 0 }
    groupCategoryCount[group] = { '餐饮': 0, '酒水': 0, 'SPA': 0, '棋牌': 0, '客房': 0 }
  })

  records.forEach(record => {
    const group = getMemberDimensionValue(record.memberId)
    if (!group || !groups.includes(group)) return

    groupCategoryAmount[group][record.category] += record.amount
    groupCategoryCount[group][record.category]++
  })

  const groupTotals = groups.map(group => {
    const total = categories.reduce((sum, cat) => sum + groupCategoryAmount[group][cat], 0)
    return { group, total }
  })

  const maxTotal = Math.max(...groupTotals.map(g => g.total), 1)

  const matrix: number[][] = groups.map((group, i) =>
    categories.map((cat, j) => {
      const amount = groupCategoryAmount[group][cat]
      const percentage = groupTotals[i].total > 0
        ? parseFloat(((amount / groupTotals[i].total * 100).toFixed(1)))
        : 0
      return percentage
    })
  )

  return {
    dimension,
    groups,
    categories,
    matrix,
    correlation: {},
  }
}
