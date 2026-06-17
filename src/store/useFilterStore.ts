import { create } from 'zustand'
import type { DateRange } from '@/types/common'

interface FilterState {
  dateRange: DateRange
  memberLevels: string[]
  genders: string[]
  ageGroups: string[]
  categories: string[]
  searchKeyword: string
  setDateRange: (dateRange: DateRange) => void
  setMemberLevels: (levels: string[]) => void
  setGenders: (genders: string[]) => void
  setAgeGroups: (groups: string[]) => void
  setCategories: (categories: string[]) => void
  setSearchKeyword: (keyword: string) => void
  resetFilters: () => void
}

const getDefaultDateRange = (): DateRange => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: getDefaultDateRange(),
  memberLevels: [],
  genders: [],
  ageGroups: [],
  categories: [],
  searchKeyword: '',
  setDateRange: (dateRange) => set({ dateRange }),
  setMemberLevels: (levels) => set({ memberLevels: levels }),
  setGenders: (genders) => set({ genders }),
  setAgeGroups: (groups) => set({ ageGroups: groups }),
  setCategories: (categories) => set({ categories }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  resetFilters: () =>
    set({
      dateRange: getDefaultDateRange(),
      memberLevels: [],
      genders: [],
      ageGroups: [],
      categories: [],
      searchKeyword: '',
    }),
}))
