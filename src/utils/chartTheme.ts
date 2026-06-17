import type { EChartsOption } from 'echarts'
import type { RiskLevel, MemberSegment } from './rfm'

export interface ChartTheme {
  primary: string
  accent1: string
  accent2: string
  accent3: string
  accent4: string
  accent5: string
  gradientGold: string[]
  gradientHeat: string[]
  success: string
  warning: string
  error: string
  info: string
  textPrimary: string
  textSecondary: string
  background: string
  border: string
}

export const chartTheme: ChartTheme = {
  primary: '#8B5E3C',
  accent1: '#D4A574',
  accent2: '#C9B037',
  accent3: '#E8C872',
  accent4: '#B8860B',
  accent5: '#CD853F',
  gradientGold: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'],
  gradientHeat: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  background: '#ffffff',
  border: '#e5e7eb',
}

export function commonChartOption(): EChartsOption {
  return {
    backgroundColor: 'transparent',
    color: [
      chartTheme.primary,
      chartTheme.accent1,
      chartTheme.accent2,
      chartTheme.accent3,
      chartTheme.accent4,
      chartTheme.accent5,
    ],
    title: {
      textStyle: {
        color: chartTheme.textPrimary,
        fontSize: 16,
        fontWeight: 600,
      },
      subtextStyle: {
        color: chartTheme.textSecondary,
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: chartTheme.border,
      borderWidth: 1,
      textStyle: {
        color: chartTheme.textPrimary,
        fontSize: 12,
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: chartTheme.primary,
          type: 'dashed',
        },
        crossStyle: {
          color: chartTheme.primary,
        },
      },
    },
    legend: {
      textStyle: {
        color: chartTheme.textSecondary,
        fontSize: 12,
      },
      itemGap: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: chartTheme.border,
        },
      },
      axisLabel: {
        color: chartTheme.textSecondary,
        fontSize: 12,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: chartTheme.textSecondary,
        fontSize: 12,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: chartTheme.border,
          type: 'dashed',
        },
      },
    },
  }
}

export function getRiskColor(riskLevel: RiskLevel): string {
  const riskColors: Record<RiskLevel, string> = {
    low: chartTheme.success,
    medium: chartTheme.warning,
    high: '#fa8c16',
    critical: chartTheme.error,
  }

  return riskColors[riskLevel] || chartTheme.textSecondary
}

export function getSegmentColor(segment: MemberSegment): string {
  const segmentColors: Record<MemberSegment, string> = {
    champion: '#FFD700',
    loyal_customer: '#52c41a',
    potential_loyalist: '#1890ff',
    new_customer: '#13c2c2',
    promising: '#722ed1',
    need_attention: '#faad14',
    about_to_sleep: '#fa8c16',
    at_risk: '#f5222d',
    can_not_lose: '#eb2f96',
    hibernating: '#8c8c8c',
    lost: '#434343',
  }

  return segmentColors[segment] || chartTheme.textSecondary
}
