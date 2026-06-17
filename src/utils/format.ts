import dayjs from 'dayjs'

export function formatCurrency(amount: number, prefix: string = '¥'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${prefix}0.00`
  }
  return `${prefix}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatPercent(
  value: number,
  decimals: number = 2,
  multiplier: number = 100
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return `0.${'0'.repeat(decimals)}%`
  }
  return `${(value * multiplier).toFixed(decimals)}%`
}

export function formatDate(date: string | number | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) {
    return '-'
  }
  return dayjs(date).format(format)
}

export function formatDateTime(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!date) {
    return '-'
  }
  return dayjs(date).format(format)
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - suffix.length) + suffix
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) {
    return phone || ''
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
