export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) {
    return 0
  }
  const sum = values.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)
  return sum / values.length
}

export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) {
    return 0
  }

  const sorted = [...values].filter((v) => !isNaN(v)).sort((a, b) => a - b)
  const len = sorted.length

  if (len === 0) {
    return 0
  }

  const mid = Math.floor(len / 2)

  if (len % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

export function calculateCorrelation(x: number[], y: number[]): number {
  if (!x || !y || x.length === 0 || y.length === 0 || x.length !== y.length) {
    return 0
  }

  const n = x.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const xi = isNaN(x[i]) ? 0 : x[i]
    const yi = isNaN(y[i]) ? 0 : y[i]
    sumX += xi
    sumY += yi
    sumXY += xi * yi
    sumX2 += xi * xi
    sumY2 += yi * yi
  }

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}

export interface NormalizeResult {
  normalized: number[]
  min: number
  max: number
}

export function normalize(values: number[], min?: number, max?: number): NormalizeResult {
  if (!values || values.length === 0) {
    return { normalized: [], min: 0, max: 0 }
  }

  const validValues = values.filter((v) => !isNaN(v))
  const actualMin = min !== undefined ? min : Math.min(...validValues)
  const actualMax = max !== undefined ? max : Math.max(...validValues)
  const range = actualMax - actualMin

  const normalized = values.map((val) => {
    if (isNaN(val)) {
      return 0
    }
    if (range === 0) {
      return 0.5
    }
    return (val - actualMin) / range
  })

  return {
    normalized,
    min: actualMin,
    max: actualMax,
  }
}

export function calculateGrowthRate(
  current: number,
  previous: number,
  decimals: number = 2
): number {
  if (previous === 0 || isNaN(current) || isNaN(previous)) {
    return 0
  }
  const rate = ((current - previous) / previous) * 100
  return Number(rate.toFixed(decimals))
}

export function roundTo(value: number, decimals: number = 2): number {
  if (isNaN(value)) {
    return 0
  }
  const multiplier = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}
