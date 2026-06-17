export interface RFMValues {
  recency: number
  frequency: number
  monetary: number
}

export interface RFMScore {
  rScore: number
  fScore: number
  mScore: number
  totalScore: number
}

export type MemberSegment =
  | 'champion'
  | 'loyal_customer'
  | 'potential_loyalist'
  | 'new_customer'
  | 'promising'
  | 'need_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'can_not_lose'
  | 'hibernating'
  | 'lost'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RFMBucket {
  min: number
  max: number
  score: number
}

export function calculateRFMScore(
  rfm: RFMValues,
  rBuckets?: RFMBucket[],
  fBuckets?: RFMBucket[],
  mBuckets?: RFMBucket[]
): RFMScore {
  const defaultRBuckets: RFMBucket[] = [
    { min: 0, max: 7, score: 5 },
    { min: 8, max: 30, score: 4 },
    { min: 31, max: 90, score: 3 },
    { min: 91, max: 180, score: 2 },
    { min: 181, max: Infinity, score: 1 },
  ]

  const defaultFBuckets: RFMBucket[] = [
    { min: 0, max: 1, score: 1 },
    { min: 2, max: 3, score: 2 },
    { min: 4, max: 5, score: 3 },
    { min: 6, max: 10, score: 4 },
    { min: 11, max: Infinity, score: 5 },
  ]

  const defaultMBuckets: RFMBucket[] = [
    { min: 0, max: 500, score: 1 },
    { min: 501, max: 2000, score: 2 },
    { min: 2001, max: 5000, score: 3 },
    { min: 5001, max: 10000, score: 4 },
    { min: 10001, max: Infinity, score: 5 },
  ]

  const rB = rBuckets || defaultRBuckets
  const fB = fBuckets || defaultFBuckets
  const mB = mBuckets || defaultMBuckets

  const getScore = (value: number, buckets: RFMBucket[]): number => {
    for (const bucket of buckets) {
      if (value >= bucket.min && value <= bucket.max) {
        return bucket.score
      }
    }
    return 1
  }

  const rScore = getScore(rfm.recency, rB)
  const fScore = getScore(rfm.frequency, fB)
  const mScore = getScore(rfm.monetary, mB)

  return {
    rScore,
    fScore,
    mScore,
    totalScore: rScore + fScore + mScore,
  }
}

export function classifyMemberSegment(rfmScore: RFMScore): MemberSegment {
  const { rScore, fScore, mScore } = rfmScore
  const totalScore = rScore + fScore + mScore

  if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
    return 'champion'
  }
  if (rScore >= 3 && fScore >= 4 && mScore >= 4) {
    return 'loyal_customer'
  }
  if (rScore >= 4 && fScore >= 2 && fScore <= 4 && mScore >= 3) {
    return 'potential_loyalist'
  }
  if (rScore >= 4 && fScore <= 2 && mScore <= 2) {
    return 'new_customer'
  }
  if (rScore >= 4 && fScore >= 3 && mScore <= 3) {
    return 'promising'
  }
  if (rScore === 3 && fScore >= 3 && mScore >= 3) {
    return 'need_attention'
  }
  if (rScore === 3 && (fScore <= 2 || mScore <= 2)) {
    return 'about_to_sleep'
  }
  if (rScore === 2 && fScore >= 2 && mScore >= 2) {
    return 'at_risk'
  }
  if (rScore <= 2 && fScore >= 4 && mScore >= 4) {
    return 'can_not_lose'
  }
  if (rScore === 2 && fScore <= 2 && mScore <= 2) {
    return 'hibernating'
  }
  if (totalScore <= 4) {
    return 'lost'
  }

  if (rScore >= 4) {
    return 'promising'
  }
  if (rScore >= 3) {
    return 'need_attention'
  }
  if (rScore >= 2) {
    return 'hibernating'
  }

  return 'lost'
}

export function calculateRiskLevel(rfmScore: RFMScore): RiskLevel {
  const { rScore, fScore, totalScore } = rfmScore

  if (rScore === 1 || (rScore <= 2 && fScore <= 2) || totalScore <= 4) {
    return 'critical'
  }
  if (rScore === 2 && (fScore >= 3 || totalScore >= 8)) {
    return 'high'
  }
  if (rScore === 3 && (fScore <= 2 || totalScore <= 8)) {
    return 'medium'
  }
  if (rScore === 3 && fScore >= 3) {
    return 'medium'
  }

  return 'low'
}

export interface SegmentDescription {
  name: string
  description: string
  characteristics: string[]
  marketingStrategy: string
}

export function getSegmentDescription(segment: MemberSegment): SegmentDescription {
  const descriptions: Record<MemberSegment, SegmentDescription> = {
    champion: {
      name: '冠军会员',
      description: '最近购买、购买频率高、消费金额大的核心优质客户',
      characteristics: ['高价值', '高活跃', '高消费', '忠诚度高'],
      marketingStrategy: 'VIP专属服务、新品优先体验、个性化推荐',
    },
    loyal_customer: {
      name: '忠诚会员',
      description: '购买频率高、消费金额大的稳定客户',
      characteristics: ['消费稳定', '频率高', '价值高'],
      marketingStrategy: '会员积分计划、专属优惠、品牌互动',
    },
    potential_loyalist: {
      name: '潜力会员',
      description: '最近有购买，有发展为忠诚客户潜力的新用户',
      characteristics: ['近期活跃', '消费潜力大', '需要培养'],
      marketingStrategy: '首单优惠、会员权益引导、品类拓展推荐',
    },
    new_customer: {
      name: '新会员',
      description: '最近刚购买的新用户，购买次数和金额较低',
      characteristics: ['新用户', '首次购买', '待开发'],
      marketingStrategy: '欢迎礼包、售后跟进、复购激励',
    },
    promising: {
      name: '有望会员',
      description: '最近有购买，购买频率中等的潜在客户',
      characteristics: ['近期活跃', '频率中等', '有潜力'],
      marketingStrategy: '个性化推荐、限时优惠、会员权益介绍',
    },
    need_attention: {
      name: '需关注会员',
      description: '购买行为开始减少，需要关注的客户',
      characteristics: ['活跃度下降', '有流失风险', '需唤醒'],
      marketingStrategy: '专属优惠、活动召回、满意度调研',
    },
    about_to_sleep: {
      name: '即将沉睡',
      description: '购买活跃度明显下降，即将流失的客户',
      characteristics: ['活跃度低', '流失风险高', '需紧急唤醒'],
      marketingStrategy: '强力优惠、定向召回、流失原因调研',
    },
    at_risk: {
      name: '流失风险',
      description: '较长时间未购买，有较高流失风险的客户',
      characteristics: ['长期未活跃', '高流失风险', '召回难度大'],
      marketingStrategy: '大额优惠券、专属客服、重新激活活动',
    },
    can_not_lose: {
      name: '不能流失',
      description: '曾经是高价值客户，但已长时间未购买',
      characteristics: ['历史高价值', '流失风险高', '召回价值大'],
      marketingStrategy: '高层级关怀、专属回归礼包、VIP专线回访',
    },
    hibernating: {
      name: '沉睡会员',
      description: '长时间未购买且价值较低的客户',
      characteristics: ['长期未活跃', '价值低', '唤醒成本高'],
      marketingStrategy: '低成本召回、定期短信提醒、季末清仓通知',
    },
    lost: {
      name: '流失会员',
      description: '已长时间未购买，基本确定流失的客户',
      characteristics: ['已流失', '召回难度极大', '价值极低'],
      marketingStrategy: '放弃主动营销，保留信息等待自然回流',
    },
  }

  return descriptions[segment]
}

export interface HeatmapCell {
  r: number
  f: number
  m: number
  count: number
  totalMonetary: number
}

export interface RFMHeatmapData {
  data: HeatmapCell[]
  xAxis: number[]
  yAxis: number[]
  maxCount: number
}

export function generateRFMHeatmapData(
  rfmList: RFMValues[],
  rScoreFn?: (recency: number) => number,
  fScoreFn?: (frequency: number) => number
): RFMHeatmapData {
  const defaultRScore = (recency: number): number => {
    if (recency <= 7) return 5
    if (recency <= 30) return 4
    if (recency <= 90) return 3
    if (recency <= 180) return 2
    return 1
  }

  const defaultFScore = (frequency: number): number => {
    if (frequency <= 1) return 1
    if (frequency <= 3) return 2
    if (frequency <= 5) return 3
    if (frequency <= 10) return 4
    return 5
  }

  const getRScore = rScoreFn || defaultRScore
  const getFScore = fScoreFn || defaultFScore

  const grid = new Map<string, HeatmapCell>()
  let maxCount = 0

  for (const rfm of rfmList) {
    const r = getRScore(rfm.recency)
    const f = getFScore(rfm.frequency)
    const key = `${r}-${f}`

    if (!grid.has(key)) {
      grid.set(key, { r, f, m: 0, count: 0, totalMonetary: 0 })
    }

    const cell = grid.get(key)!
    cell.count++
    cell.totalMonetary += rfm.monetary
    cell.m = cell.totalMonetary / cell.count

    if (cell.count > maxCount) {
      maxCount = cell.count
    }
  }

  const data = Array.from(grid.values())
  const xAxis = [1, 2, 3, 4, 5]
  const yAxis = [1, 2, 3, 4, 5]

  return {
    data,
    xAxis,
    yAxis,
    maxCount,
  }
}
