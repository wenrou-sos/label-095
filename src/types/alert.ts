export type AlertMetricType =
  | 'member_inactive_days'
  | 'space_usage_rate'
  | 'consumption_drop'
  | 'new_member_count'
  | 'tag_member_count'
  | 'visit_drop_rate'

export type AlertConditionOperator = '>' | '>=' | '<' | '<=' | '=='

export interface AlertMetric {
  type: AlertMetricType
  name: string
  description: string
  unit: string
  exampleThreshold: number
  defaultOperator: AlertConditionOperator
  applicableFilters?: string[]
}

export interface AlertRule {
  id: string
  name: string
  metricType: AlertMetricType
  operator: AlertConditionOperator
  threshold: number
  filterValue?: string
  filterLabel?: string
  consecutiveDays?: number
  level: 'warning' | 'critical' | 'info'
  enabled: boolean
  createdAt: string
  lastCheckedAt?: string
  lastTriggeredAt?: string
}

export type AlertStatus = 'unread' | 'read' | 'resolved'

export interface AlertRecord {
  id: string
  ruleId: string
  ruleName: string
  metricType: AlertMetricType
  level: AlertRule['level']
  message: string
  value: number
  threshold: number
  operator: AlertConditionOperator
  filterLabel?: string
  triggeredAt: string
  status: AlertStatus
  resolvedAt?: string
  resolvedNote?: string
}

export const ALERT_METRICS: AlertMetric[] = [
  {
    type: 'member_inactive_days',
    name: '会员未到店天数',
    description: '指定等级会员距离上次到店的天数',
    unit: '天',
    exampleThreshold: 30,
    defaultOperator: '>=',
    applicableFilters: ['钻石', '金卡', '银卡', '普通', '全部'],
  },
  {
    type: 'space_usage_rate',
    name: '场地使用率',
    description: '指定场地类型的周使用率',
    unit: '%',
    exampleThreshold: 30,
    defaultOperator: '<',
    applicableFilters: ['餐饮', '酒水', 'SPA', '棋牌', '客房'],
  },
  {
    type: 'consumption_drop',
    name: '周消费环比下降',
    description: '总消费金额较上周下降的百分比',
    unit: '%',
    exampleThreshold: 20,
    defaultOperator: '>=',
  },
  {
    type: 'new_member_count',
    name: '新增会员数',
    description: '近 7 天新增会员数量',
    unit: '人',
    exampleThreshold: 5,
    defaultOperator: '<',
  },
  {
    type: 'tag_member_count',
    name: '标签会员人数',
    description: '指定标签下的会员数量',
    unit: '人',
    exampleThreshold: 0,
    defaultOperator: '<=',
  },
  {
    type: 'visit_drop_rate',
    name: '周到店人次下降',
    description: '总到店人次较上周下降的百分比',
    unit: '%',
    exampleThreshold: 15,
    defaultOperator: '>=',
  },
]
