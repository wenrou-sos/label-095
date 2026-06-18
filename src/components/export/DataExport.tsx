import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileSpreadsheet, FileText, FileJson, Clock, Calendar, X, Check, Loader2 } from 'lucide-react'
import * as XLSX from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { generateMembers, generateConsumptionRecords, generateRFMScores } from '@/services/mock/members'
import { getCategoryBreakdown, getTrendData } from '@/services/mock/consumption'
import { getSpaceList, getSpaceTypeSummary } from '@/services/mock/space'
import { getRecommendationEffect } from '@/services/mock/recommend'

type ExportFormat = 'excel' | 'pdf' | 'csv'
type ExportType = 'members' | 'consumption' | 'rfm' | 'space' | 'recommendation' | 'all'

interface ExportOption {
  key: ExportType
  label: string
  description: string
}

const exportOptions: ExportOption[] = [
  { key: 'members', label: '会员数据', description: '会员基本信息列表' },
  { key: 'consumption', label: '消费数据', description: '会员消费记录明细' },
  { key: 'rfm', label: 'RFM分析数据', description: 'RFM评分及会员细分' },
  { key: 'space', label: '场地数据', description: '场地信息及使用情况' },
  { key: 'recommendation', label: '推荐数据', description: '推荐效果统计数据' },
  { key: 'all', label: '全部数据', description: '导出所有分析数据' },
]

interface ScheduledReport {
  id: string
  name: string
  format: ExportFormat
  type: ExportType
  frequency: 'daily' | 'weekly' | 'monthly'
  email: string
  enabled: boolean
  lastRun?: string
  nextRun: string
}

export default function DataExport() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [selectedTypes, setSelectedTypes] = useState<Set<ExportType>>(new Set(['members']))
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: '每日会员消费报表',
      format: 'excel',
      type: 'consumption',
      frequency: 'daily',
      email: 'manager@club.com',
      enabled: true,
      lastRun: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      nextRun: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    },
    {
      id: '2',
      name: '每周RFM分析报告',
      format: 'pdf',
      type: 'rfm',
      frequency: 'weekly',
      email: 'admin@club.com',
      enabled: true,
      lastRun: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      nextRun: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    },
  ])

  const toggleType = (type: ExportType) => {
    const newSelected = new Set(selectedTypes)
    if (newSelected.has(type)) {
      newSelected.delete(type)
    } else {
      newSelected.add(type)
    }
    setSelectedTypes(newSelected)
  }

  const filterByDateRange = <T extends Record<string, unknown>>(data: T[], dateField: string): T[] => {
    const start = dayjs(dateRange.start).startOf('day')
    const end = dayjs(dateRange.end).endOf('day')
    return data.filter(item => {
      const val = item[dateField]
      if (typeof val !== 'string') return true
      const d = dayjs(val)
      return d.isAfter(start) && d.isBefore(end)
    })
  }

  const generateExcelData = async (type: ExportType) => {
    switch (type) {
      case 'members': {
        const members = filterByDateRange(
          generateMembers().map(m => ({
            会员ID: m.id,
            姓名: m.name,
            会员等级: m.level,
            性别: m.gender,
            年龄: m.age,
            年龄段: m.ageGroup,
            入会日期: m.joinDate,
            累计消费: m.totalSpend,
            到店次数: m.visitCount,
            最后到店: m.lastVisit,
            联系电话: m.phone,
          })),
          '最后到店'
        )
        return members
      }
      case 'consumption': {
        const records = filterByDateRange(
          generateConsumptionRecords().map(r => ({
            记录ID: r.id,
            会员ID: r.memberId,
            消费类目: r.category,
            消费子类目: r.subCategory,
            消费金额: r.amount,
            消费日期: r.date,
            消费时间: r.time,
            星期: r.weekday,
            支付方式: r.paymentMethod,
          })),
          '消费日期'
        )
        return records
      }
      case 'rfm': {
        const scores = filterByDateRange(
          generateRFMScores().map(s => ({
            会员ID: s.memberId,
            最近消费天数: s.lastConsumeDays,
            消费频率: s.consumeFrequency,
            消费金额: s.consumeAmount,
            R评分: s.recency,
            F评分: s.frequency,
            M评分: s.monetary,
            RFM总分: s.totalScore,
            会员群体: s.segment,
            风险等级: s.riskLevel,
          })),
          '会员ID'
        )
        return scores
      }
      case 'space':
        return getSpaceList().map(s => ({
          场地ID: s.id,
          场地名称: s.name,
          场地类型: s.type,
          容纳人数: s.capacity,
          位置: s.location,
          描述: s.description,
        }))
      case 'recommendation': {
        const effects = filterByDateRange(
          getRecommendationEffect().map(e => ({
            日期: e.date,
            展示量: e.impressions,
            点击量: e.clicks,
            转化量: e.conversions,
            点击率: `${e.ctr}%`,
            转化率: `${e.conversionRate}%`,
          })),
          '日期'
        )
        return effects
      }
      default:
        return []
    }
  }

  const exportToExcel = async () => {
    const workbook = new XLSX.Workbook()
    workbook.creator = '会所会员分析系统'
    workbook.created = new Date()

    const typesToExport = selectedTypes.has('all')
      ? ['members', 'consumption', 'rfm', 'space', 'recommendation'] as ExportType[]
      : Array.from(selectedTypes)

    for (let i = 0; i < typesToExport.length; i++) {
      const type = typesToExport[i]
      const data = await generateExcelData(type)
      const option = exportOptions.find(o => o.key === type)!

      const worksheet = workbook.addWorksheet(option.label)

      if (data.length > 0) {
        const headers = Object.keys(data[0])
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }))
        worksheet.addRows(data)

        worksheet.getRow(1).font = { bold: true, size: 12 }
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }

        worksheet.views = [{ state: 'frozen', ySplit: 1 }]
      }

      setExportProgress(Math.round(((i + 1) / typesToExport.length) * 100))
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `会所数据分析_${dateRange.start}_${dateRange.end}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = async () => {
    const typesToExport = selectedTypes.has('all')
      ? ['members', 'consumption', 'rfm', 'space', 'recommendation'] as ExportType[]
      : Array.from(selectedTypes)

    for (let i = 0; i < typesToExport.length; i++) {
      const type = typesToExport[i]
      const data = await generateExcelData(type)
      const option = exportOptions.find(o => o.key === type)!

      const csv = Papa.unparse(data as any[])
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `会所_${option.label}_${dateRange.start}_${dateRange.end}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setExportProgress(Math.round(((i + 1) / typesToExport.length) * 100))
    }
  }

  const exportToPDF = async () => {
    const doc = new jsPDF()
    let yOffset = 20

    doc.setFontSize(18)
    doc.setTextColor(139, 94, 60)
    doc.text('会所会员消费行为分析报告', 105, yOffset, { align: 'center' })
    yOffset += 10

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 105, yOffset, { align: 'center' })
    yOffset += 5
    doc.text(`数据范围: ${dateRange.start} 至 ${dateRange.end}`, 105, yOffset, { align: 'center' })
    yOffset += 15

    const typesToExport = selectedTypes.has('all')
      ? ['members', 'consumption', 'rfm', 'space', 'recommendation'] as ExportType[]
      : Array.from(selectedTypes)

    for (let i = 0; i < typesToExport.length; i++) {
      const type = typesToExport[i]
      const data = await generateExcelData(type)
      const option = exportOptions.find(o => o.key === type)!

      if (data.length > 0) {
        if (yOffset > 250) {
          doc.addPage()
          yOffset = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(139, 94, 60)
        doc.text(option.label, 14, yOffset)
        yOffset += 8

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(option.description, 14, yOffset)
        yOffset += 8

        const headers = Object.keys(data[0])
        const rows = data.slice(0, 20).map(row => Object.values(row))

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: yOffset,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [139, 94, 60] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14 },
          tableWidth: 'auto',
        })

        if ((doc as any).lastAutoTable.finalY) {
          yOffset = (doc as any).lastAutoTable.finalY + 10
        }

        if (data.length > 20) {
          doc.setFontSize(9)
          doc.setTextColor(150, 150, 150)
          doc.text(`... 共 ${data.length} 条记录，仅显示前 20 条`, 14, yOffset)
          yOffset += 8
        }

        setExportProgress(Math.round(((i + 1) / typesToExport.length) * 100))
      }
    }

    doc.save(`会所数据分析报告_${dateRange.start}_${dateRange.end}.pdf`)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      switch (selectedFormat) {
        case 'excel':
          await exportToExcel()
          break
        case 'csv':
          await exportToCSV()
          break
        case 'pdf':
          await exportToPDF()
          break
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSchedule = (id: string) => {
    setScheduledReports(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
      >
        <Download className="w-4 h-4" />
        导出数据
      </Button>

      <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] md:rounded-2xl bg-white shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">数据导出</h2>
                <p className="text-sm text-gray-500">选择导出格式和内容</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">选择导出格式</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'excel' as ExportFormat, label: 'Excel', icon: FileSpreadsheet, color: 'from-green-500 to-emerald-600' },
                    { key: 'pdf' as ExportFormat, label: 'PDF', icon: FileText, color: 'from-red-500 to-rose-600' },
                    { key: 'csv' as ExportFormat, label: 'CSV', icon: FileJson, color: 'from-blue-500 to-cyan-600' },
                  ].map(format => (
                    <motion.button
                      key={format.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFormat(format.key)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-center',
                        selectedFormat === format.key
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className={cn('w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center', format.color)}>
                        <format.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-medium text-gray-800">{format.label}</div>
                      {selectedFormat === format.key && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">选择导出内容</h3>
                <div className="grid grid-cols-2 gap-3">
                  {exportOptions.map(option => (
                    <motion.div
                      key={option.key}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => toggleType(option.key)}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedTypes.has(option.key)
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                        {selectedTypes.has(option.key) && (
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">数据时间范围</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  仅导出 {dateRange.start} 至 {dateRange.end} 范围内的数据（消费记录、推荐效果等按日期筛选，会员数据按最后到店日期筛选）
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  定时报告
                </h3>
                <div className="space-y-2">
                  {scheduledReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          report.format === 'excel' ? 'bg-green-100' :
                          report.format === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
                        )}>
                          {report.format === 'excel' ? <FileSpreadsheet className="w-5 h-5 text-green-600" /> :
                          report.format === 'pdf' ? <FileText className="w-5 h-5 text-red-600" /> :
                          <FileJson className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{report.name}</div>
                          <div className="text-xs text-gray-500">
                            {report.frequency === 'daily' ? '每日' : report.frequency === 'weekly' ? '每周' : '每月'} · {report.email}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSchedule(report.id)}
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          report.enabled ? 'bg-amber-500' : 'bg-gray-300'
                        )}
                      >
                        <div className={cn(
                          'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                          report.enabled ? 'translate-x-7' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {isExporting && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导出中... {exportProgress}%
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || selectedTypes.size === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      开始导出
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  )
}
