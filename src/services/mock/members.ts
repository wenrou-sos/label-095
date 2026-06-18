import dayjs from 'dayjs'
import type { Member, MemberLevel, RFMScore, RFMSummary, MemberSegment, Gender } from '../../types/member'
import type { ConsumptionRecord, ConsumptionCategory } from '../../types/consumption'
import { calculateRFMScore, classifyMemberSegment, calculateRiskLevel } from '../../utils/rfm'
import { getWeekdayName } from '../../utils/date'

const chineseFirstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '胡', '朱', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹']
const chineseLastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '玲', '辉', '鑫', '斌', '波', '宇', '浩', '凯', '健', '俊', '帆', '鹏', '博', '婷', '雪', '倩', '琳', '欣', '颖', '佳', '悦', '璐', '瑶', '怡', '宁', '梦']

const levelDistribution: MemberLevel[] = [
  ...Array(250).fill('普通'),
  ...Array(125).fill('银卡'),
  ...Array(75).fill('金卡'),
  ...Array(50).fill('钻石')
]

const categories: ConsumptionCategory[] = ['餐饮', '酒水', 'SPA', '棋牌', '客房']
const categoryWeights = [0.3, 0.25, 0.2, 0.15, 0.1]

const subCategories: Record<ConsumptionCategory, string[]> = {
  '餐饮': ['正餐', '下午茶', '夜宵', '自助餐', '私人宴会'],
  '酒水': ['红酒', '白酒', '威士忌', '香槟', '鸡尾酒', '啤酒'],
  'SPA': ['全身按摩', '面部护理', '足浴', '桑拿', '精油SPA'],
  '棋牌': ['麻将', '扑克', '象棋', '围棋', '桌游'],
  '客房': ['标准间', '豪华间', '套房', '总统套房']
}

const paymentMethods = ['微信支付', '支付宝', '银行卡', '会员卡', '现金']

let membersCache: Member[] | null = null
let consumptionRecordsCache: ConsumptionRecord[] | null = null
let rfmScoresCache: RFMScore[] | null = null

export function resetMembersCache() {
  membersCache = null
  rfmScoresCache = null
}

const segmentMap: Record<string, MemberSegment> = {
  champion: '高价值会员',
  loyal_customer: '高价值会员',
  potential_loyalist: '潜力会员',
  new_customer: '新会员',
  promising: '潜力会员',
  need_attention: '重要深耕',
  about_to_sleep: '重要唤回',
  at_risk: '重要唤回',
  can_not_lose: '重要深耕',
  hibernating: '沉睡会员',
  lost: '流失会员'
}

const riskLevelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险'
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedRandomChoice<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

function generateChineseName(): string {
  const firstName = randomChoice(chineseFirstNames)
  const lastName = randomChoice(chineseLastNames)
  return firstName + lastName
}

function generatePhone(): string {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '188', '189', '136']
  const prefix = randomChoice(prefixes)
  const suffix = randomInt(10000000, 99999999).toString()
  return prefix + suffix
}

function getAgeGroup(age: number): Member['ageGroup'] {
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 55) return '46-55'
  return '55+'
}

function generateMember(id: string, level: MemberLevel): Member {
  const age = randomInt(18, 65)
  const gender = randomChoice(['男', '女']) as Gender
  const joinDate = dayjs().subtract(randomInt(1, 1095), 'day').format('YYYY-MM-DD')

  const levelMultiplier: Record<MemberLevel, number> = {
    '普通': 1,
    '银卡': 2.5,
    '金卡': 5,
    '钻石': 10
  }

  const baseSpend = randomFloat(500, 5000) * levelMultiplier[level]
  const baseVisits = randomInt(5, 30) * Math.ceil(levelMultiplier[level])

  return {
    id,
    name: generateChineseName(),
    level,
    gender,
    age,
    ageGroup: getAgeGroup(age),
    joinDate,
    totalSpend: parseFloat(baseSpend.toFixed(2)),
    visitCount: baseVisits,
    lastVisit: dayjs().subtract(randomInt(1, 180), 'day').format('YYYY-MM-DD'),
    phone: generatePhone(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    tags: [],
  }
}

function generateConsumptionRecord(memberId: string, index: number): ConsumptionRecord {
  const category = weightedRandomChoice(categories, categoryWeights)
  const subCategory = randomChoice(subCategories[category])
  const daysAgo = randomInt(1, 365)
  const date = dayjs().subtract(daysAgo, 'day')
  const hour = randomInt(9, 23)
  const minute = randomInt(0, 59)

  const amountMultiplier: Record<ConsumptionCategory, [number, number]> = {
    '餐饮': [100, 800],
    '酒水': [200, 3000],
    'SPA': [300, 1500],
    '棋牌': [50, 300],
    '客房': [500, 5000]
  }

  const [minAmount, maxAmount] = amountMultiplier[category]
  const amount = randomFloat(minAmount, maxAmount)

  return {
    id: `rec-${memberId}-${index}`,
    memberId,
    category,
    subCategory,
    amount,
    date: date.format('YYYY-MM-DD'),
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    weekday: getWeekdayName(date.toDate(), 'zh'),
    paymentMethod: randomChoice(paymentMethods)
  }
}

function calculateMemberRFM(member: Member, records: ConsumptionRecord[]): RFMScore {
  const memberRecords = records.filter(r => r.memberId === member.id)

  const lastConsumeDate = memberRecords.length > 0
    ? dayjs(memberRecords.reduce((max, r) => dayjs(r.date).isAfter(dayjs(max.date)) ? r : max).date)
    : dayjs(member.joinDate)

  const lastConsumeDays = dayjs().diff(lastConsumeDate, 'day')
  const consumeFrequency = memberRecords.length
  const consumeAmount = memberRecords.reduce((sum, r) => sum + r.amount, 0)

  const rfm = calculateRFMScore({
    recency: lastConsumeDays,
    frequency: consumeFrequency,
    monetary: consumeAmount
  })

  const englishSegment = classifyMemberSegment(rfm)
  const englishRiskLevel = calculateRiskLevel(rfm)

  return {
    memberId: member.id,
    recency: rfm.rScore,
    frequency: rfm.fScore,
    monetary: rfm.mScore,
    totalScore: rfm.totalScore,
    segment: segmentMap[englishSegment] || '一般会员',
    lastConsumeDays,
    consumeFrequency,
    consumeAmount: parseFloat(consumeAmount.toFixed(2)),
    riskLevel: riskLevelMap[englishRiskLevel] || '低风险'
  }
}

export function generateMembers(): Member[] {
  if (membersCache) return membersCache

  const shuffledLevels = [...levelDistribution].sort(() => Math.random() - 0.5)
  const members: Member[] = []

  for (let i = 0; i < 500; i++) {
    const member = generateMember(`M${(i + 1).toString().padStart(4, '0')}`, shuffledLevels[i])
    members.push(member)
  }

  membersCache = members
  return members
}

export function generateConsumptionRecords(): ConsumptionRecord[] {
  if (consumptionRecordsCache) return consumptionRecordsCache

  const members = generateMembers()
  const records: ConsumptionRecord[] = []

  for (const member of members) {
    const recordCount = randomInt(20, 50)
    for (let i = 0; i < recordCount; i++) {
      records.push(generateConsumptionRecord(member.id, i))
    }
  }

  consumptionRecordsCache = records
  return records
}

export function generateRFMScores(): RFMScore[] {
  if (rfmScoresCache) return rfmScoresCache

  const members = generateMembers()
  const records = generateConsumptionRecords()
  const scores: RFMScore[] = []

  for (const member of members) {
    scores.push(calculateMemberRFM(member, records))
  }

  rfmScoresCache = scores
  return scores
}

export function getMemberById(id: string): Member | undefined {
  const members = generateMembers()
  return members.find(m => m.id === id)
}

export function getMembersWithRFM(): Array<Member & { rfm: RFMScore }> {
  const members = generateMembers()
  const rfmScores = generateRFMScores()

  return members.map(member => ({
    ...member,
    rfm: rfmScores.find(r => r.memberId === member.id)!
  }))
}

export function getRFMSummary(): RFMSummary {
  const rfmScores = generateRFMScores()
  const members = generateMembers()

  const segmentDistribution = {} as Record<MemberSegment, number>
  const segments: MemberSegment[] = ['高价值会员', '潜力会员', '重要深耕', '重要唤回', '一般会员', '沉睡会员', '流失会员', '新会员']

  segments.forEach(seg => {
    segmentDistribution[seg] = 0
  })

  let totalScore = 0
  rfmScores.forEach(score => {
    totalScore += score.totalScore
    if (segmentDistribution[score.segment] !== undefined) {
      segmentDistribution[score.segment]++
    } else {
      segmentDistribution['一般会员']++
    }
  })

  return {
    totalMembers: members.length,
    avgScore: parseFloat((totalScore / rfmScores.length).toFixed(2)),
    segmentDistribution
  }
}

export function getMemberConsumptionHistory(memberId: string): ConsumptionRecord[] {
  const records = generateConsumptionRecords()
  return records
    .filter(r => r.memberId === memberId)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
}
