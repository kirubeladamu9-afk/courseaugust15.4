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
}

const authStorageKey = 'coursespace-auth-user'

const getErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null)
  return body?.message ?? 'Unable to complete your request.'
}

export const getCourses = async (): Promise<Array<Course>> => {
  const response = await fetch('/api/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const requestCourse = async (url: string, init?: RequestInit): Promise<AdminCourse> => {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminCourses = async (): Promise<Array<AdminCourse>> => {
  const response = await fetch('/api/admin/courses')
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
  const response = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
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
  return response.json()
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
}

export const signOut = async () => {
  clearAuthenticatedUser()
  await fetch('/api/auth/sign-out', { method: 'POST' })
}
