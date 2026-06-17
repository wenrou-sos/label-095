/**
 * 会员等级类型
 * 定义会员的不同等级分类
 */
export type MemberLevel = '普通' | '银卡' | '金卡' | '钻石';

/**
 * 性别类型
 */
export type Gender = '男' | '女';

/**
 * 年龄段类型
 * 将会员按年龄划分为不同群组
 */
export type AgeGroup = '18-25' | '26-35' | '36-45' | '46-55' | '55+';

/**
 * 会员细分类型
 * 基于RFM模型将会员划分为不同的价值群体
 */
export type MemberSegment =
  | '高价值会员'
  | '潜力会员'
  | '重要深耕'
  | '重要唤回'
  | '一般会员'
  | '沉睡会员'
  | '流失会员'
  | '新会员';

/**
 * 会员基本信息接口
 * 存储会员的核心属性数据
 */
export interface Member {
  id: string;
  name: string;
  level: MemberLevel;
  gender: Gender;
  age: number;
  ageGroup: AgeGroup;
  joinDate: string;
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  phone: string;
  avatar: string;
}

/**
 * RFM评分接口
 * 用于评估会员价值的RFM模型数据
 * - Recency: 最近一次消费时间 (1-5分)
 * - Frequency: 消费频率 (1-5分)
 * - Monetary: 消费金额 (1-5分)
 */
export interface RFMScore {
  memberId: string;
  recency: number;
  frequency: number;
  monetary: number;
  totalScore: number;
  segment: MemberSegment;
  lastConsumeDays: number;
  consumeFrequency: number;
  consumeAmount: number;
  riskLevel: string;
}

/**
 * RFM统计摘要接口
 * 用于展示全体会员的RFM分析概览
 */
export interface RFMSummary {
  totalMembers: number;
  avgScore: number;
  segmentDistribution: Record<MemberSegment, number>;
}
