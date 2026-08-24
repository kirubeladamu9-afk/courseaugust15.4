import { type AdminCourse, type AdminTutor, type AdminUser } from '@/components/admin/admin-data'
import { type Course } from '@/interfaces/course'

export interface AuthUser {
  id: number | string
  name?: string
  email: string
  role: string
  createdAt: string
}

interface AuthResponse {
  user: AuthUser
  sessionToken?: string
}

interface AccountDetails {
  name: string
  phone: string
}

export interface EnrollmentStudent {
  fullName: string
  ageOrGrade: string
  relationship: 'Parent' | 'Guardian' | 'Self'
  preferredLanguage: string
  emergencyPhone?: string
  notes?: string
}

export interface SavedStudent extends EnrollmentStudent {
  id: number
}

interface PaymentStatus {
  status: 'pending' | 'paid' | 'failed'
}

export interface MyEnrollment {
  id: number
  courseId: number
  courseTitle: string
  courseCover: string
  studentName: string
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

const requestTutor = async (url: string, init?: RequestInit): Promise<AdminTutor> => {
  const response = await requestApi(url, init)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export type AdminTutorPayload = Pick<AdminTutor, 'name' | 'email' | 'phone' | 'bio'> & Partial<Pick<AdminTutor, 'status'>> & { assignedCourseIds?: number[] }

export interface AdminDashboardOverview {
  totalRevenue: number
  activeStudents: number
  publishedCourses: number
  draftCourses: number
  activeTutors: number
  inactiveTutors: number
  revenueByMonth: Array<{ label: string; value: number }>
  enrollmentsByCategory: Array<{ label: string; value: number }>
}

export const getAdminDashboardOverview = async (): Promise<AdminDashboardOverview> => {
  const response = await requestApi('/api/admin/overview')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminCourses = async (): Promise<Array<AdminCourse>> => {
  const response = await requestApi('/api/admin/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminCourse = async (id: AdminCourse['id']): Promise<AdminCourse> => requestCourse(`/api/admin/courses/${id}`)

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

export const getAdminTutors = async (): Promise<Array<AdminTutor>> => {
  const response = await requestApi('/api/admin/tutors')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminTutor = async (id: AdminTutor['id']): Promise<AdminTutor> => requestTutor(`/api/admin/tutors/${id}`)

export const createAdminTutor = async (tutor: AdminTutorPayload): Promise<AdminTutor & { inviteLink: string }> => {
  const response = await requestApi('/api/admin/tutors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutor),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const updateAdminTutor = (tutor: AdminTutor) => requestTutor(`/api/admin/tutors/${tutor.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tutor),
})

export const updateAdminTutorStatus = (id: AdminTutor['id'], status: AdminTutor['status']) => requestTutor(`/api/admin/tutors/${id}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status }),
})

export const deleteAdminTutor = async (id: AdminTutor['id']) => {
  const response = await requestApi(`/api/admin/tutors/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const getAdminUsers = async (): Promise<Array<AdminUser>> => {
  const response = await requestApi('/api/admin/users')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const updateAdminUserStatus = async (accountType: AdminUser['accountType'], accountId: number, status: 'Active' | 'Suspended'): Promise<AdminUser> => {
  const response = await requestApi(`/api/admin/users/${accountType}/${accountId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const resetAdminUserPassword = async (accountType: AdminUser['accountType'], accountId: number): Promise<{ temporaryPassword: string }> => {
  const response = await requestApi(`/api/admin/users/${accountType}/${accountId}/reset-password`, { method: 'POST' })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const response = await requestApi('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const getCourse = async (id: Course['id']): Promise<AdminCourse> => requestCourse(`/api/courses/${id}`)

export const submitCredentials = async (mode: 'sign-in' | 'sign-up', email: string, password: string, accountDetails?: AccountDetails): Promise<AuthResponse> => {
  const response = await fetch(`/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...accountDetails }),
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

export const getSavedStudents = async (): Promise<SavedStudent[]> => {
  const response = await requestApi('/api/students')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createChapaCheckout = async (courseId: AdminCourse['id'], students: EnrollmentStudent[]): Promise<{ checkoutUrl: string }> => {
  const response = await requestApi('/api/payments/chapa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, students }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const verifyChapaPayment = async (reference: string): Promise<PaymentStatus> => {
  const response = await requestApi(`/api/payments/chapa/${encodeURIComponent(reference)}`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getMyEnrollments = async (): Promise<MyEnrollment[]> => {
  const response = await requestApi('/api/enrollments')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const signOut = async () => {
  try {
    await requestApi('/api/auth/sign-out', { method: 'POST' })
  } finally {
    clearAuthenticatedUser()
  }
}
