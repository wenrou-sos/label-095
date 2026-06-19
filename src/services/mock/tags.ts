import dayjs from 'dayjs'
import type { MemberTag } from '../../types/tag'
import type { ConsumptionRecord } from '../../types/consumption'
import { generateMembers as baseGenerateMembers, generateConsumptionRecords, resetMembersCache } from './members'
import type { Member } from '../../types/member'

const defaultTags: MemberTag[] = [
  {
    id: 'T001',
    name: '红酒爱好者',
    color: '#8B4513',
    description: '偏好红酒消费，月均酒水消费超过1000元',
    createdAt: '2026-01-15',
  },
  {
    id: 'T002',
    name: '常带客户',
    color: '#1E90FF',
    description: '多次以商务接待形式到店，消费金额较高',
    createdAt: '2026-01-15',
  },
  {
    id: 'T003',
    name: '投诉过',
    color: '#DC143C',
    description: '历史上有过投诉记录，需重点维护',
    createdAt: '2026-01-20',
  },
  {
    id: 'T004',
    name: 'SPA常客',
    color: '#9932CC',
    description: '每月SPA消费2次以上',
    createdAt: '2026-02-01',
  },
  {
    id: 'T005',
    name: '周末党',
    color: '#32CD32',
    description: '主要在周末到店消费',
    createdAt: '2026-02-05',
  },
  {
    id: 'T006',
    name: '棋牌达人',
    color: '#FF8C00',
    description: '棋牌场地消费占比超过50%',
    createdAt: '2026-02-10',
  },
  {
    id: 'T007',
    name: '餐饮大户',
    color: '#FF1493',
    description: '餐饮消费占总消费60%以上',
    createdAt: '2026-02-15',
  },
  {
    id: 'T008',
    name: '夜猫子',
    color: '#4B0082',
    description: '经常在22点以后到店消费',
    createdAt: '2026-02-20',
  },
  {
    id: 'T009',
    name: '生日月',
    color: '#FFD700',
    description: '本月生日会员，可推送专属优惠',
    createdAt: '2026-03-01',
  },
  {
    id: 'T010',
    name: '新婚夫妇',
    color: '#FF69B4',
    description: '近期登记的新婚会员，适合婚宴等活动推荐',
    createdAt: '2026-03-10',
  },
]

let tags: MemberTag[] = [...defaultTags]
let ruleTagMap: Map<string, string[]> | null = null
const customTagRules: Map<string, (member: Member, records: ConsumptionRecord[]) => boolean> = new Map()
const manualTagAssignments: Map<string, Set<string>> = new Map()
const manualTagRemovals: Map<string, Set<string>> = new Map()

function resetRuleTagMap() {
  ruleTagMap = null
  resetMembersCache()
}

function computeFinalTags(memberId: string): string[] {
  const ruleTags = ruleTagMap?.get(memberId) || []
  const added = manualTagAssignments.get(memberId)
  const removed = manualTagRemovals.get(memberId)

  if (!added && !removed) return ruleTags

  const finalTags = new Set(ruleTags)
  if (added) added.forEach(tid => finalTags.add(tid))
  if (removed) removed.forEach(tid => finalTags.delete(tid))
  return Array.from(finalTags)
}

function syncMemberTags() {
  const members = baseGenerateMembers() as Member[]
  members.forEach(member => {
    member.tags = computeFinalTags(member.id)
  })
}

function buildRuleTagMap(): Map<string, string[]> {
  if (ruleTagMap) return ruleTagMap

  const members = baseGenerateMembers() as Member[]
  const records = generateConsumptionRecords()

  ruleTagMap = new Map()

  members.forEach(member => {
    const memberTags: string[] = []
    const memberRecords = records.filter(r => r.memberId === member.id)
    const totalAmount = memberRecords.reduce((sum, r) => sum + r.amount, 0)

    const wineAmount = memberRecords.filter(r => r.category === '酒水').reduce((sum, r) => sum + r.amount, 0)
    if (wineAmount > 3000) memberTags.push('T001')

    const bizRecords = memberRecords.filter(r => r.subCategory.includes('商务') || r.subCategory.includes('包厢'))
    if (bizRecords.length >= 3) memberTags.push('T002')

    if (member.age >= 30 && member.age <= 40 && Math.random() < 0.08) memberTags.push('T003')

    const spaCount = memberRecords.filter(r => r.category === 'SPA').length
    if (spaCount >= 4) memberTags.push('T004')

    const weekendCount = memberRecords.filter(r => r.weekday === '周六' || r.weekday === '周日').length
    if (memberRecords.length > 0 && weekendCount / memberRecords.length >= 0.6) memberTags.push('T005')

    const chessAmount = memberRecords.filter(r => r.category === '棋牌').reduce((sum, r) => sum + r.amount, 0)
    if (totalAmount > 0 && chessAmount / totalAmount >= 0.5) memberTags.push('T006')

    const foodAmount = memberRecords.filter(r => r.category === '餐饮').reduce((sum, r) => sum + r.amount, 0)
    if (totalAmount > 0 && foodAmount / totalAmount >= 0.6) memberTags.push('T007')

    const nightCount = memberRecords.filter(r => {
      const h = parseInt(r.time.split(':')[0], 10)
      return h >= 22 || h < 2
    }).length
    if (nightCount >= 3) memberTags.push('T008')

    const birthMonth = dayjs(member.joinDate).month()
    if (birthMonth === dayjs().month()) memberTags.push('T009')

    if (member.level !== '普通' && member.gender === '女' && member.age >= 25 && member.age <= 35 && Math.random() < 0.15) {
      memberTags.push('T010')
    }

    customTagRules.forEach((rule, tagId) => {
      if (rule(member, memberRecords as ConsumptionRecord[])) {
        memberTags.push(tagId)
      }
    })

    ruleTagMap!.set(member.id, memberTags)
  })

  syncMemberTags()

  return ruleTagMap
}

export function getMemberTags(memberId: string): string[] {
  buildRuleTagMap()
  return computeFinalTags(memberId)
}

export function getAllTags(): MemberTag[] {
  buildRuleTagMap()
  const members = baseGenerateMembers() as Member[]
  return tags.map(tag => ({
    ...tag,
    memberCount: members.filter(m => computeFinalTags(m.id).includes(tag.id)).length,
  }))
}

export function createTag(data: Omit<MemberTag, 'id' | 'createdAt'>, rule?: (member: Member, records: ConsumptionRecord[]) => boolean): MemberTag {
  const maxId = tags.reduce((max, t) => {
    const num = parseInt(t.id.replace('T', ''), 10)
    return num > max ? num : max
  }, 0)
  const newId = `T${String(maxId + 1).padStart(3, '0')}`
  const newTag: MemberTag = {
    ...data,
    id: newId,
    createdAt: dayjs().format('YYYY-MM-DD'),
  }
  tags = [...tags, newTag]

  if (rule) {
    customTagRules.set(newId, rule)
    resetRuleTagMap()
  }

  return newTag
}

export function updateTag(id: string, data: Partial<Omit<MemberTag, 'id' | 'createdAt'>>, rule?: (member: Member, records: ConsumptionRecord[]) => boolean): MemberTag | null {
  const index = tags.findIndex(t => t.id === id)
  if (index === -1) return null

  tags = tags.map(t => t.id === id ? { ...t, ...data } : t)

  if (rule) {
    customTagRules.set(id, rule)
    resetRuleTagMap()
  } else {
    syncMemberTags()
  }

  return tags.find(t => t.id === id) || null
}

export function deleteTag(id: string): boolean {
  const index = tags.findIndex(t => t.id === id)
  if (index === -1) return false

  tags = tags.filter(t => t.id !== id)
  customTagRules.delete(id)

  manualTagAssignments.forEach(tagSet => tagSet.delete(id))
  manualTagRemovals.forEach(tagSet => tagSet.delete(id))

  resetRuleTagMap()
  return true
}

export function addTagToMember(memberId: string, tagId: string): boolean {
  buildRuleTagMap()

  const removed = manualTagRemovals.get(memberId)
  if (removed && removed.has(tagId)) {
    removed.delete(tagId)
    if (removed.size === 0) manualTagRemovals.delete(memberId)
    else manualTagRemovals.set(memberId, removed)
  }

  const ruleTags = ruleTagMap?.get(memberId) || []
  if (ruleTags.includes(tagId)) {
    const member = baseGenerateMembers().find(m => m.id === memberId)
    if (member) member.tags = computeFinalTags(memberId)
    return true
  }

  const added = manualTagAssignments.get(memberId) || new Set<string>()
  if (added.has(tagId)) return false
  added.add(tagId)
  manualTagAssignments.set(memberId, added)

  const member = baseGenerateMembers().find(m => m.id === memberId)
  if (member) member.tags = computeFinalTags(memberId)
  return true
}

export function removeTagFromMember(memberId: string, tagId: string): boolean {
  buildRuleTagMap()

  const added = manualTagAssignments.get(memberId)
  if (added && added.has(tagId)) {
    added.delete(tagId)
    if (added.size === 0) manualTagAssignments.delete(memberId)
    else manualTagAssignments.set(memberId, added)
  }

  const ruleTags = ruleTagMap?.get(memberId) || []
  if (ruleTags.includes(tagId)) {
    const removed = manualTagRemovals.get(memberId) || new Set<string>()
    if (removed.has(tagId)) return false
    removed.add(tagId)
    manualTagRemovals.set(memberId, removed)
  }

  const member = baseGenerateMembers().find(m => m.id === memberId)
  if (member) member.tags = computeFinalTags(memberId)
  return true
}

export function getTagById(id: string): MemberTag | undefined {
  return tags.find(t => t.id === id)
}

export function filterMembersByTags(memberIds: string[], selectedTagIds: string[], matchAll: boolean = false): string[] {
  if (selectedTagIds.length === 0) return memberIds
  buildRuleTagMap()

  return memberIds.filter(memberId => {
    const memberTagIds = computeFinalTags(memberId)
    if (matchAll) {
      return selectedTagIds.every(tid => memberTagIds.includes(tid))
    }
    return selectedTagIds.some(tid => memberTagIds.includes(tid))
  })
}
