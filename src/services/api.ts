import { type AdminCourse } from '@/components/admin/admin-data'
import { type Course } from '@/interfaces/course'

export interface AuthUser {
  id: number | string
  email: string
  role: string
  createdAt: string
}

interface AuthResponse {
  user: AuthUser
  sessionToken?: string
}

const authStorageKey = 'coursespace-auth-user'
const authSessionTokenKey = 'coursespace-auth-session-token'

const getErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null)
  return body?.message ?? 'Unable to complete your request.'
}

export const getCourses = async (): Promise<Array<Course>> => {
  const response = await fetch('/api/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const requestApi = (url: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  const sessionToken = sessionStorage.getItem(authSessionTokenKey)
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`)
  return fetch(url, { ...init, headers })
}

const requestCourse = async (url: string, init?: RequestInit): Promise<AdminCourse> => {
  const response = await requestApi(url, init)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminCourses = async (): Promise<Array<AdminCourse>> => {
  const response = await requestApi('/api/admin/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createAdminCourse = (course: AdminCourse) => requestCourse('/api/admin/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(course),
})

export const updateAdminCourse = (course: AdminCourse) => requestCourse(`/api/admin/courses/${course.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(course),
})

export const deleteAdminCourse = async (id: AdminCourse['id']) => {
  const response = await requestApi(`/api/admin/courses/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const getCourse = async (id: Course['id']): Promise<AdminCourse> => requestCourse(`/api/courses/${id}`)

export const submitCredentials = async (mode: 'sign-in' | 'sign-up', email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  const authResponse: AuthResponse = await response.json()
  if (authResponse.sessionToken) sessionStorage.setItem(authSessionTokenKey, authResponse.sessionToken)
  return authResponse
}

export const saveAuthenticatedUser = (user: AuthUser) => {
  sessionStorage.setItem(authStorageKey, JSON.stringify(user))
}

export const getAuthenticatedUser = (): AuthUser | null => {
  try {
    const storedUser: unknown = JSON.parse(sessionStorage.getItem(authStorageKey) ?? 'null')
    if (storedUser && typeof storedUser === 'object' && 'role' in storedUser) return storedUser as AuthUser
  } catch {
    return null
  }

  return null
}

export const clearAuthenticatedUser = () => {
  sessionStorage.removeItem(authStorageKey)
  sessionStorage.removeItem(authSessionTokenKey)
}

export const signOut = async () => {
  try {
    await requestApi('/api/auth/sign-out', { method: 'POST' })
  } finally {
    clearAuthenticatedUser()
  }
}
