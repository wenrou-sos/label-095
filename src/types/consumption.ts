/**
 * 消费类别类型
 * 定义会员消费的不同业务类别
 */
export type ConsumptionCategory = '餐饮' | '酒水' | 'SPA' | '棋牌' | '客房';

/**
 * 消费记录接口
 * 存储会员的每笔消费详细信息
 */
export interface ConsumptionRecord {
  id: string;
  memberId: string;
  category: ConsumptionCategory;
  subCategory: string;
  amount: number;
  date: string;
  time: string;
  weekday: string;
  paymentMethod: string;
}

/**
 * 类别分布明细接口
 * 用于展示各类别消费金额的占比分析
 */
export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
}

/**
 * 趋势数据点接口
 * 用于展示消费趋势随时间变化的数据
 */
export interface TrendDataPoint {
  date: string;
  categories: Record<ConsumptionCategory, number>;
}

/**
 * 基准对比数据接口
 * 用于对比俱乐部数据与行业平均水平
 */
export interface BenchmarkData {
  categories: ConsumptionCategory[];
  industryAvg: number[];
  clubData: number[];
  gap: number[];
}
