import dayjs from 'dayjs'
import { generateMembers, generateConsumptionRecords } from './members'
import { getAllTags } from './tags'
import { getSpaceTypeSummary } from './space'
import type { AlertRule, AlertRecord, AlertMetricType, AlertConditionOperator, AlertStatus } from '../../types/alert'
import { ALERT_METRICS } from '../../types/alert'
import type { MemberLevel } from '../../types/member'

let alertRules: AlertRule[] = [
  {
    id: 'AR001',
    name: '钻石会员流失预警',
    metricType: 'member_inactive_days',
    operator: '>=',
    threshold: 30,
    filterValue: '钻石',
    filterLabel: '钻石会员',
    level: 'critical',
    enabled: true,
    createdAt: '2026-05-01',
    lastCheckedAt: '2026-06-18',
    lastTriggeredAt: '2026-06-18',
  },
  {
    id: 'AR002',
    name: '场地使用率不足',
    metricType: 'space_usage_rate',
    operator: '<',
    threshold: 30,
    filterValue: '棋牌',
    filterLabel: '棋牌场地',
    consecutiveDays: 7,
    level: 'warning',
    enabled: true,
    createdAt: '2026-05-10',
    lastCheckedAt: '2026-06-18',
  },
  {
    id: 'AR003',
    name: '周消费大幅下降',
    metricType: 'consumption_drop',
    operator: '>=',
    threshold: 20,
    level: 'warning',
    enabled: true,
    createdAt: '2026-05-15',
    lastCheckedAt: '2026-06-18',
  },
]

const alertRecords: AlertRecord[] = []
const ruleConsecutiveCounter: Record<string, number> = {}

function genAlertId(): string {
  return `A${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

function genRuleId(): string {
  const maxNum = alertRules.reduce((max, r) => {
    const n = parseInt(r.id.replace('AR', ''), 10)
    return n > max ? n : max
  }, 0)
  return `AR${String(maxNum + 1).padStart(3, '0')}`
}

function evaluateCondition(value: number, operator: AlertConditionOperator, threshold: number): boolean {
  switch (operator) {
    case '>': return value > threshold
    case '>=': return value >= threshold
    case '<': return value < threshold
    case '<=': return value <= threshold
    case '==': return value === threshold
  }
}

function getOperatorText(op: AlertConditionOperator): string {
  switch (op) {
    case '>': return '高于'
    case '>=': return '达到或超过'
    case '<': return '低于'
    case '<=': return '不超过'
    case '==': return '等于'
  }
}

function getMetricValue(metricType: AlertMetricType, filterValue?: string): { value: number; label: string } {
  switch (metricType) {
    case 'member_inactive_days': {
      const members = generateMembers()
      const level = filterValue as MemberLevel | '全部'
      const filtered = level === '全部' ? members : members.filter(m => m.level === level)
      const daysSinceLastVisit = filtered.map(m => {
        const refDate = m.lastVisit || m.joinDate
        return dayjs().diff(dayjs(refDate), 'day')
      })
      const maxDays = Math.max(...daysSinceLastVisit, 0)
      const matchingCount = daysSinceLastVisit.filter(d => d >= 30).length
      return {
        value: maxDays,
        label: `${level || '全部'}会员最长未到店 ${maxDays} 天（${matchingCount}人≥30天）`,
      }
    }

    case 'space_usage_rate': {
      try {
        const summary = getSpaceTypeSummary()
        const found = summary.find(s => s.type === filterValue)
        if (found) {
          return { value: Math.round(found.avgUsageRate), label: `${found.type}使用率 ${found.avgUsageRate.toFixed(1)}%` }
        }
        return { value: 0, label: `${filterValue}使用率 0%` }
      } catch {
        const mockRate = 15 + Math.floor(Math.random() * 20)
        return { value: mockRate, label: `${filterValue}使用率 ${mockRate}%` }
      }
    }

    case 'consumption_drop': {
      const records = generateConsumptionRecords()
      const now = dayjs()
      const thisWeek = records.filter(r => dayjs(r.date).isAfter(now.subtract(7, 'day')))
      const lastWeek = records.filter(r => dayjs(r.date).isBefore(now.subtract(7, 'day')) && dayjs(r.date).isAfter(now.subtract(14, 'day')))
      const thisWeekTotal = thisWeek.reduce((s, r) => s + r.amount, 0)
      const lastWeekTotal = lastWeek.reduce((s, r) => s + r.amount, 0)
      const dropRate = lastWeekTotal > 0 ? Math.max(0, ((lastWeekTotal - thisWeekTotal) / lastWeekTotal) * 100) : 0
      return {
        value: Math.round(dropRate),
        label: `本周消费较上周下降 ${dropRate.toFixed(1)}%`,
      }
    }

    case 'new_member_count': {
      const members = generateMembers()
      const newMembers = members.filter(m => dayjs(m.joinDate).isAfter(dayjs().subtract(7, 'day')))
      return {
        value: newMembers.length,
        label: `近 7 天新增会员 ${newMembers.length} 人`,
      }
    }

    case 'tag_member_count': {
      const tags = getAllTags()
      const found = tags.find(t => t.id === filterValue)
      if (found) {
        return { value: found.memberCount || 0, label: `「${found.name}」会员 ${found.memberCount} 人` }
      }
      return { value: 0, label: `标签会员 0 人` }
    }

    case 'visit_drop_rate': {
      const records = generateConsumptionRecords()
      const now = dayjs()
      const thisWeek = records.filter(r => dayjs(r.date).isAfter(now.subtract(7, 'day')))
      const lastWeek = records.filter(r => dayjs(r.date).isBefore(now.subtract(7, 'day')) && dayjs(r.date).isAfter(now.subtract(14, 'day')))
      const drop = lastWeek.length > 0
        ? Math.max(0, ((lastWeek.length - thisWeek.length) / lastWeek.length) * 100)
        : 0
      return {
        value: Math.round(drop),
        label: `周到店人次较上周下降 ${drop.toFixed(1)}%`,
      }
    }
  }
}

export function runAlertCheck(): AlertRecord[] {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const newAlerts: AlertRecord[] = []
  const activeRuleIds = new Set<string>()

  alertRules.filter(r => r.enabled).forEach(rule => {
    const metric = getMetricValue(rule.metricType, rule.filterValue)
    const conditionMet = evaluateCondition(metric.value, rule.operator, rule.threshold)

    rule.lastCheckedAt = now

    if (conditionMet) {
      ruleConsecutiveCounter[rule.id] = (ruleConsecutiveCounter[rule.id] || 0) + 1
    } else {
      ruleConsecutiveCounter[rule.id] = 0
    }

    const requiredDays = rule.consecutiveDays && rule.consecutiveDays > 0 ? rule.consecutiveDays : 1
    const triggered = conditionMet && ruleConsecutiveCounter[rule.id] >= requiredDays

    if (triggered) {
      rule.lastTriggeredAt = now
      const metricInfo = ALERT_METRICS.find(m => m.type === rule.metricType)!
      const existsRecent = alertRecords.find(r =>
        r.ruleId === rule.id &&
        r.status !== 'resolved' &&
        dayjs(r.triggeredAt).isAfter(dayjs().subtract(1, 'day'))
      )

      if (!existsRecent) {
        const filterDesc = rule.filterLabel ? `（${rule.filterLabel}）` : ''
        const consecutiveDesc = requiredDays > 1 ? `，已连续 ${ruleConsecutiveCounter[rule.id]} 天` : ''
        const record: AlertRecord = {
          id: genAlertId(),
          ruleId: rule.id,
          ruleName: rule.name,
          metricType: rule.metricType,
          level: rule.level,
          message: `${metricInfo.name}${filterDesc} ${metric.label}${consecutiveDesc}，${getOperatorText(rule.operator)}阈值 ${rule.threshold}${metricInfo.unit}`,
          value: metric.value,
          threshold: rule.threshold,
          operator: rule.operator,
          filterLabel: rule.filterLabel,
          triggeredAt: now,
          status: 'unread',
        }
        alertRecords.unshift(record)
        newAlerts.push(record)
      }
      activeRuleIds.add(rule.id)
    }
  })

  return newAlerts
}

export function getAlertRules(): AlertRule[] {
  return [...alertRules]
}

export function createAlertRule(data: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule {
  const newRule: AlertRule = {
    ...data,
    id: genRuleId(),
    createdAt: dayjs().format('YYYY-MM-DD'),
  }
  alertRules = [...alertRules, newRule]
  runAlertCheck()
  return newRule
}

export function updateAlertRule(id: string, data: Partial<Omit<AlertRule, 'id' | 'createdAt'>>): AlertRule | null {
  const index = alertRules.findIndex(r => r.id === id)
  if (index === -1) return null
  alertRules = alertRules.map(r => (r.id === id ? { ...r, ...data } : r))
  ruleConsecutiveCounter[id] = 0
  runAlertCheck()
  return alertRules.find(r => r.id === id) || null
}

export function deleteAlertRule(id: string): boolean {
  const index = alertRules.findIndex(r => r.id === id)
  if (index === -1) return false
  alertRules = alertRules.filter(r => r.id !== id)
  delete ruleConsecutiveCounter[id]
  runAlertCheck()
  return true
}

export function toggleAlertRuleEnabled(id: string): boolean {
  const rule = alertRules.find(r => r.id === id)
  if (!rule) return false
  rule.enabled = !rule.enabled
  ruleConsecutiveCounter[id] = 0
  runAlertCheck()
  return true
}

export function getAlertRecords(statusFilter?: AlertStatus | 'all'): AlertRecord[] {
  if (statusFilter === undefined || statusFilter === 'all') return [...alertRecords]
  return alertRecords.filter(r => r.status === statusFilter)
}

export function getUnreadAlertCount(): number {
  return alertRecords.filter(r => r.status === 'unread').length
}

export function markAlertRead(id: string): boolean {
  const rec = alertRecords.find(r => r.id === id)
  if (!rec) return false
  if (rec.status === 'unread') rec.status = 'read'
  return true
}

export function markAllAlertsRead(): number {
  let count = 0
  alertRecords.forEach(r => {
    if (r.status === 'unread') {
      r.status = 'read'
      count++
    }
  })
  return count
}

export function resolveAlert(id: string, note?: string): boolean {
  const rec = alertRecords.find(r => r.id === id)
  if (!rec) return false
  rec.status = 'resolved'
  rec.resolvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  if (note) rec.resolvedNote = note
  return true
}

export function getAlertMetricInfo(type: AlertMetricType) {
  return ALERT_METRICS.find(m => m.type === type)
}

export { ALERT_METRICS }
