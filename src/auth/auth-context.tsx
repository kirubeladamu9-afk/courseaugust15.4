import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react'
import axios from 'axios'
import api from '@/lib/api'

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'disabled'

export interface AuthUser {
  id: string
  name: string
  username: string
  email: string
  role: UserRole
  status: AccountStatus
  lastLoginAt?: string | null
}

interface LoginResult {
  success: boolean
  error?: string
  user?: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<{ user: AuthUser }>('/api/auth/me', { withCredentials: true })
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (identifier: string, password: string, remember: boolean): Promise<LoginResult> => {
    try {
      const { data } = await api.post<{ user: AuthUser }>('/api/auth/login', { identifier, password, remember }, { withCredentials: true })
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) return { success: false, error: error.response?.data.message || 'Unable to sign in. Please try again.' }
      return { success: false, error: 'Unable to sign in. Please try again.' }
    }
  }

  const logout = async () => {
    await api.post('/api/auth/logout', undefined, { withCredentials: true })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
