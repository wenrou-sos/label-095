/**
 * 日期范围类型
 * 用于指定数据查询的时间范围
 */
export type DateRange = {
  startDate: string;
  endDate: string;
};

/**
 * 筛选选项接口
 * 用于会员和消费数据的多维筛选
 */
export interface FilterOptions {
  dateRange: DateRange;
  memberLevels: string[];
  genders: string[];
  ageGroups: string[];
  categories: string[];
}

/**
 * 分页参数接口
 * 用于列表数据的分页查询
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * API响应泛型接口
 * 统一封装API返回数据结构
 * @template T 响应数据的类型
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
