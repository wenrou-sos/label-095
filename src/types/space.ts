/**
 * 场地类型
 * 定义俱乐部内不同功能区域的类型
 */
export type SpaceType = '餐厅' | '酒吧' | 'SPA中心' | '棋牌室' | '客房' | '会议室';

/**
 * 场地基本信息接口
 * 存储场地的静态属性数据
 */
export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  location: string;
  description: string;
}

/**
 * 场地使用情况接口
 * 记录场地在特定时间点的使用状态数据
 */
export interface SpaceUsage {
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  date: string;
  hour: number;
  weekday: string;
  usageRate: number;
  satisfaction: number;
  headcount: number;
}

/**
 * 排班推荐接口
 * 基于场地使用预测生成的人员排班建议
 */
export interface ScheduleRecommendation {
  shift: string;
  requiredStaff: number;
  suggestedSkill: string;
  costEstimate: number;
}

/**
 * 场地使用率对比接口
 * 对比不同时间段的场地使用情况
 */
export interface UsageComparison {
  space: string;
  weekdayEvening: number;
  weekend: number;
  peakHour: number;
}
