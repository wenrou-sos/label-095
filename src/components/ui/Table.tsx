import { useState, useMemo, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown as ExpandIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SortDirection = 'asc' | 'desc' | null

interface Column<T> {
  key: string
  title?: string
  label?: string
  dataIndex?: keyof T | string | (string | number)[] | ((row: T) => React.ReactNode)
  width?: string | number
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

interface PaginationConfig {
  pageSize?: number
  showSizeChanger?: boolean
  showTotal?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey?: keyof T | string
  striped?: boolean
  hoverable?: boolean
  sortable?: boolean
  pagination?: boolean | PaginationConfig
  pageSize?: number
  expandable?: boolean
  expandedRowRender?: (row: T) => React.ReactNode
  className?: string
  onRowClick?: (row: T) => void
}

function getNestedValue(obj: Record<string, unknown>, path: (string | number)[] | string): unknown {
  if (Array.isArray(path)) {
    return path.reduce((acc: unknown, key) => {
      if (acc == null) return undefined
      if (typeof acc === 'object' && acc !== null) {
        return (acc as Record<string, unknown>)[key as string]
      }
      return undefined
    }, obj)
  }
  return obj[path]
}

export default function Table<T extends object>({
  columns,
  data,
  rowKey = 'id',
  striped = true,
  hoverable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  expandable = false,
  expandedRowRender,
  className,
  onRowClick,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<unknown>>(new Set())

  const actualPageSize = useMemo(() => {
    if (typeof pagination === 'object' && pagination.pageSize) {
      return pagination.pageSize
    }
    return pageSize
  }, [pagination, pageSize])

  const normalizedColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      title: col.title || col.label || '',
    }))
  }, [columns])

  const getCellValue = useCallback((row: T, column: Column<T>): unknown => {
    if (!column.dataIndex) return undefined
    if (typeof column.dataIndex === 'function') {
      return column.dataIndex(row)
    }
    if (Array.isArray(column.dataIndex)) {
      return getNestedValue(row as Record<string, unknown>, column.dataIndex)
    }
    return getNestedValue(row as Record<string, unknown>, column.dataIndex as string)
  }, [])

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const column = columns.find((c) => c.key === sortKey)
      if (!column) return 0

      const aValue = getCellValue(a, column)
      const bValue = getCellValue(b, column)

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue ?? '')
      const bStr = String(bValue ?? '')
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDirection, columns, getCellValue])

  const paginatedData = useMemo(() => {
    if (pagination === false) return sortedData
    const start = (currentPage - 1) * actualPageSize
    return sortedData.slice(start, start + actualPageSize)
  }, [sortedData, pagination, currentPage, actualPageSize])

  const totalPages = Math.ceil(sortedData.length / actualPageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const toggleExpand = (row: T) => {
    const key = getNestedValue(row as Record<string, unknown>, rowKey as string)
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRows(newExpanded)
  }

  const renderCell = (column: Column<T>, row: T) => {
    const value = getCellValue(row, column)
    if (column.render) {
      return column.render(value, row)
    }
    if (typeof column.dataIndex === 'function') {
      return column.dataIndex(row)
    }
    return value as React.ReactNode
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-gray-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {expandable && <th className="w-12" />}
              {normalizedColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600',
                    column.sortable !== false && sortable && 'cursor-pointer select-none hover:bg-gray-100',
                    column.width
                  )}
                  style={{ width: typeof column.width === 'number' ? `${column.width}px` : column.width }}
                  onClick={() => column.sortable !== false && sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.title}
                    {column.sortable !== false && sortable && (
                      <span className="text-gray-400">
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUp className="h-4 w-4 opacity-0" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={normalizedColumns.length + (expandable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const key = getNestedValue(row as Record<string, unknown>, rowKey as string)
                const isExpanded = expandedRows.has(key)
                return (
                  <Fragment key={String(key)}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'transition-colors',
                        striped && index % 2 === 1 && 'bg-gray-50/50',
                        hoverable && 'cursor-pointer hover:bg-indigo-50',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {expandable && (
                        <td className="px-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(row)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <ExpandIcon
                              className={cn(
                                'h-4 w-4 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        </td>
                      )}
                      {normalizedColumns.map((column) => (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-700">
                          {renderCell(column, row)}
                        </td>
                      ))}
                    </motion.tr>
                    <AnimatePresence>
                      {expandable && isExpanded && expandedRowRender && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td
                            colSpan={normalizedColumns.length + 1}
                            className="border-t border-gray-100 bg-gray-50 p-4"
                          >
                            {expandedRowRender(row)}
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <div className="text-sm text-gray-500">
            共 {sortedData.length} 条记录，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'flex h-8 min-w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
