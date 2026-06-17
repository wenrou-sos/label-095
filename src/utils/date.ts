import dayjs from 'dayjs'

export type DateRangeType = '7d' | '30d' | '90d' | '6m' | '1y'

export interface DateRange {
  startDate: string
  endDate: string
  startDateObj: dayjs.Dayjs
  endDateObj: dayjs.Dayjs
}

export function getDateRange(type: DateRangeType, endDate?: string | number | Date): DateRange {
  const end = endDate ? dayjs(endDate) : dayjs()
  let start: dayjs.Dayjs

  switch (type) {
    case '7d':
      start = end.subtract(6, 'day')
      break
    case '30d':
      start = end.subtract(29, 'day')
      break
    case '90d':
      start = end.subtract(89, 'day')
      break
    case '6m':
      start = end.subtract(6, 'month')
      break
    case '1y':
      start = end.subtract(1, 'year')
      break
    default:
      start = end.subtract(29, 'day')
  }

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    startDateObj: start,
    endDateObj: end,
  }
}

export interface MonthItem {
  value: string
  label: string
  month: number
  year: number
}

export function getMonthList(startDate: string | number | Date, endDate: string | number | Date): MonthItem[] {
  const start = dayjs(startDate).startOf('month')
  const end = dayjs(endDate).endOf('month')
  const months: MonthItem[] = []
  let current = start

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    months.push({
      value: current.format('YYYY-MM'),
      label: current.format('YYYY年MM月'),
      month: current.month() + 1,
      year: current.year(),
    })
    current = current.add(1, 'month')
  }

  return months
}

export type WeekdayLocale = 'zh' | 'zh-short' | 'en' | 'en-short'

export function getWeekdayName(date: string | number | Date, locale: WeekdayLocale = 'zh'): string {
  const weekdayNames: Record<WeekdayLocale, string[]> = {
    'zh': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    'zh-short': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'en-short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  }

  const dayIndex = dayjs(date).day()
  return weekdayNames[locale][dayIndex]
}

export function isWeekend(date: string | number | Date): boolean {
  const dayIndex = dayjs(date).day()
  return dayIndex === 0 || dayIndex === 6
}

export function getDaysDiff(
  date1: string | number | Date,
  date2: string | number | Date,
  absolute: boolean = true
): number {
  const d1 = dayjs(date1)
  const d2 = dayjs(date2)
  const diff = d2.diff(d1, 'day')
  return absolute ? Math.abs(diff) : diff
}

export type Quarter = 1 | 2 | 3 | 4

export interface QuarterInfo {
  quarter: Quarter
  year: number
  label: string
}

export function getQuarter(date: string | number | Date): QuarterInfo {
  const d = dayjs(date)
  const month = d.month() + 1
  const year = d.year()
  let quarter: Quarter

  if (month <= 3) {
    quarter = 1
  } else if (month <= 6) {
    quarter = 2
  } else if (month <= 9) {
    quarter = 3
  } else {
    quarter = 4
  }

  return {
    quarter,
    year,
    label: `${year}年Q${quarter}`,
  }
}
