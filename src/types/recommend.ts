/**
 * 推荐类型
 * 定义推荐系统支持的推荐类别
 */
export type RecommendationType = 'wine' | 'activity';

/**
 * 推荐项接口
 * 存储针对会员的个性化推荐内容
 */
export interface Recommendation {
  id: string;
  memberId: string;
  type: RecommendationType;
  itemName: string;
  itemImage: string;
  price: number;
  matchScore: number;
  reason: string;
  similarFeedback: string;
  clickCount: number;
  convertCount: number;
  createDate: string;
}

/**
 * 推荐效果接口
 * 记录推荐系统的表现指标数据
 */
export interface RecommendationEffect {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

/**
 * 推荐结果接口
 * 封装推荐数据及其效果统计
 */
export interface RecommendationResult {
  data: Recommendation[];
  effect: RecommendationEffect;
}
