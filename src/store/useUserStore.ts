import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface UserState {
  user: User | null
  isLoggedIn: boolean
  permissions: string[]
  login: (userData: User, permissions?: string[]) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  permissions: [],
  login: (userData, permissions = []) =>
    set({
      user: userData,
      isLoggedIn: true,
      permissions,
    }),
  logout: () =>
    set({
      user: null,
      isLoggedIn: false,
      permissions: [],
    }),
  hasPermission: (permission) => {
    const { permissions } = get()
    return permissions.includes(permission) || permissions.includes('*')
  },
}))
