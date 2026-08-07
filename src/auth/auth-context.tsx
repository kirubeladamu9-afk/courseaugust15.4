import { createContext, useContext, useState, type FC, type ReactNode } from 'react'

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'disabled'

export interface AuthUser {
  id: string
  name: string
  username: string
  email: string
  password: string
  role: UserRole
  status: AccountStatus
}

interface LoginResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: Omit<AuthUser, 'password'> | null
  isAuthenticated: boolean
  login: (identifier: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => void
}

const mockUsers: AuthUser[] = [
  { id: 'admin-1', name: 'Admin User', username: 'admin', email: 'admin@coursespace.com', password: 'Admin123!', role: 'admin', status: 'active' },
  { id: 'teacher-1', name: 'Teacher User', username: 'teacher', email: 'teacher@coursespace.com', password: 'Teacher123!', role: 'teacher', status: 'active' },
  { id: 'parent-1', name: 'Parent User', username: 'parent', email: 'parent@coursespace.com', password: 'Parent123!', role: 'parent', status: 'active' },
  { id: 'student-1', name: 'Student User', username: 'student', email: 'student@coursespace.com', password: 'Student123!', role: 'student', status: 'active' },
  { id: 'suspended-1', name: 'Suspended User', username: 'suspended', email: 'suspended@coursespace.com', password: 'Suspended123!', role: 'student', status: 'suspended' },
]

const authStorageKey = 'coursespace-auth-user'
const attemptsStorageKey = 'coursespace-login-attempts'
const maxAttempts = 5
const lockoutDuration = 15 * 60 * 1000

const getStoredUser = (): Omit<AuthUser, 'password'> | null => {
  const rawUser = localStorage.getItem(authStorageKey) || sessionStorage.getItem(authStorageKey)
  if (!rawUser) return null
  try {
    return JSON.parse(rawUser) as Omit<AuthUser, 'password'>
  } catch {
    localStorage.removeItem(authStorageKey)
    sessionStorage.removeItem(authStorageKey)
    return null
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<AuthUser, 'password'> | null>(getStoredUser)

  const login = async (identifier: string, password: string, remember: boolean): Promise<LoginResult> => {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const attempts = JSON.parse(sessionStorage.getItem(attemptsStorageKey) || '{}') as Record<string, { count: number; lockedUntil?: number }>
    const currentAttempt = attempts[normalizedIdentifier]

    if (currentAttempt?.lockedUntil && currentAttempt.lockedUntil > Date.now()) {
      return { success: false, error: 'Too many failed attempts. Please try again later.' }
    }

    const matchedUser = mockUsers.find((candidate) => candidate.email === normalizedIdentifier || candidate.username === normalizedIdentifier)
    if (!matchedUser || matchedUser.password !== password) {
      const nextCount = (currentAttempt?.count || 0) + 1
      attempts[normalizedIdentifier] = { count: nextCount, ...(nextCount >= maxAttempts ? { lockedUntil: Date.now() + lockoutDuration } : {}) }
      sessionStorage.setItem(attemptsStorageKey, JSON.stringify(attempts))
      return { success: false, error: nextCount >= maxAttempts ? 'Too many failed attempts. Please try again later.' : 'Invalid username/email or password.' }
    }

    if (matchedUser.status !== 'active') {
      return { success: false, error: `This account is ${matchedUser.status}. Please contact your system administrator.` }
    }

    delete attempts[normalizedIdentifier]
    sessionStorage.setItem(attemptsStorageKey, JSON.stringify(attempts))
    const sessionUser = { id: matchedUser.id, name: matchedUser.name, username: matchedUser.username, email: matchedUser.email, role: matchedUser.role, status: matchedUser.status }
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(authStorageKey, JSON.stringify(sessionUser))
    if (remember) sessionStorage.removeItem(authStorageKey)
    else localStorage.removeItem(authStorageKey)
    setUser(sessionUser)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem(authStorageKey)
    sessionStorage.removeItem(authStorageKey)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
