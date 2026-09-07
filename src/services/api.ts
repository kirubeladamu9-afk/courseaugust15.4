import { type AdminCourse, type AdminModule, type AdminTutor, type AdminUser } from '@/components/admin/admin-data'
import { type Course } from '@/interfaces/course'
import { type PracticeExam, type PracticeExamWithQuestions, type PracticePurchase, type PracticeQuestion } from '@/components/practice/practice-data'

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

interface EnrollmentLesson {
  id: number
  title: string
  type: 'video' | 'article' | 'quiz' | 'live'
  duration: number | null
  videoUrl?: string
  thumbnailUrl?: string
  estimatedDuration?: number
  articleBody?: string
  resources?: Array<{ id: number; name: string; url?: string }>
  quizQuestions?: Array<{ id: number; question: string; options: string[] }>
  passThreshold?: number
  meetingUrl?: string
  scheduledAt?: string
  endsAt?: string
}

interface EnrollmentModule {
  id: number
  title: string
  lessons: EnrollmentLesson[]
}

export interface LessonProgress {
  startedAt: string
  completedAt: string | null
  activeSeconds: number
  videoPositionSeconds: number
  lastAccessedAt: string
}

export type QuizAnswerStatus = 'unanswered' | 'answered' | 'expired'
export type QuizViolationType = 'visibility' | 'fullscreen'
export interface QuizViolation {
  type: QuizViolationType
  occurredAt: string
}
export interface QuizQuestionResult {
  questionId: number
  question: string
  studentAnswer: string | null
  correctAnswer: string | null
  status: QuizAnswerStatus
}
export interface QuizAnswerRecord {
  status: QuizAnswerStatus
  value: string | number | string[] | null
}

export interface QuizAttempt {
  id: number
  lessonId: number
  startedAt: string
  activeSeconds: number
  answers?: Record<number, QuizAnswerRecord>
  violations?: QuizViolation[]
  questionResults?: QuizQuestionResult[]
  score: number | null
  passed: boolean | null
  disqualified?: boolean
  retakeApproved?: boolean
  submittedAt: string | null
}

export interface MyEnrollment {
  id: number
  courseId: number | null
  courseTitle: string | null
  courseCover: string | null
  category: string | null
  level: string | null
  tutor: string | null
  certificate: boolean | null
  modules: EnrollmentModule[]
  classId: number | null
  classTitle: string | null
  classTutor: string | null
  classSchedule: { days: string[]; time: string; duration: number; flexible: boolean; startDate: string; endDate?: string } | null
  meetingLink: string | null
  classStatus: 'pending_schedule' | 'open' | 'full' | 'closed' | null
  attendance: Record<number, 'Present' | 'Absent'>
  sessionJoinClicks: Record<number, string>
  lessonProgress: Record<number, LessonProgress>
  quizAttempts: QuizAttempt[]
  completedLessonIds: number[]
  started: boolean
  timeSpentSeconds: number
  progressPercentage: number
  lastActivityAt: string | null
}

export interface GamificationStats {
  student_id: number
  xp: number
  level: number
  points: number
  current_streak: number
  longest_streak: number
  next_level_xp: number
  level_progress: number
  lesson_count: number
  quiz_count: number
  live_count: number
}

export interface GamificationBadge {
  id: string
  name: string
  icon: string
  description: string
  criteria: string
}

export interface GamificationAchievement {
  id: string
  student_id: number
  badge_id: string
  unlocked_at: string
}

export interface GamificationChallenge {
  id: string
  title: string
  type: 'daily' | 'weekly'
  xp_reward: number
  points_reward: number
  completed: boolean
  completed_at: string | null
}

export interface GamificationLeaderboardEntry {
  id: number
  name: string
  avatar: string
  xp: number
  isCurrentStudent: boolean
}

export interface GamificationData {
  stats: GamificationStats
  badges: GamificationBadge[]
  achievements: GamificationAchievement[]
  challenges: GamificationChallenge[]
  leaderboard: GamificationLeaderboardEntry[]
  classTitle: string | null
}

export interface PublicClass {
  id: number
  title: string
  programId: string
  schedule: { days: string[]; time: string; duration: number; flexible: boolean; startDate: string; endDate: string }
  price: number
  status: 'pending_schedule' | 'open' | 'full' | 'closed'
  courseId: number | null
  courseTitle: string | null
  tutorName: string
  capacity: number
  enrolledCount: number
  published: boolean
  moduleCount: number | null
  lessonCount: number | null
}

export interface TutorOverview {
  tutor: AdminTutor
  totalCourses: number
  totalClasses: number
  totalStudents: number
  totalRevenue: number
  upcomingClasses: number
}

export interface TutorClass {
  id: number
  title: string
  programId: string
  schedule: AdminClassSchedule
  meetingLink: string
  price: number
  status: AdminClassStatus
  courseId: number | null
  courseTitle: string | null
  capacity: number
  enrolledCount: number
  published: boolean
  modules: AdminModule[]
}

export interface AtRiskStudent {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  courseTitle: string | null
  classTitle: string | null
  progressPercentage: number
  lastActivityAt: string | null
  reasons: string[]
}

export interface TutorClassStudent {
  id: number
  studentId: number
  studentName: string
  ageOrGrade: string
  studentEmail: string
  status: 'enrolled' | 'waitlisted'
  enrolledDate: string
  attendance: Record<number, 'Present' | 'Absent'>
  sessionJoinClicks: Record<number, string>
  progressPercentage: number
  timeSpentSeconds: number
  quizAttempts: QuizAttempt[]
}

const authStorageKey = 'coursespace-auth-user'
const authSessionTokenKey = 'coursespace-auth-session-token'

const getErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null)
  return body?.message ?? 'Unable to complete your request.'
}

const fetchApi = async (url: string, init?: RequestInit) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetch(url, init)
    } catch (error) {
      if (attempt >= 2 || !(error instanceof TypeError)) throw error
      await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)))
    }
  }
}

export const getCourses = async (): Promise<Array<Course>> => {
  const response = await fetchApi('/api/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getPracticeExams = async (): Promise<PracticeExam[]> => {
  const response = await fetchApi('/api/practice-exams')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getPracticeExam = async (examId: number): Promise<PracticeExamWithQuestions> => {
  const response = await requestApi(`/api/practice-exams/${examId}`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getPracticePurchases = async (): Promise<PracticePurchase[]> => {
  const response = await requestApi('/api/practice-purchases')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminPracticeExams = async (): Promise<PracticeExam[]> => {
  const response = await requestApi('/api/admin/practice-exams')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createAdminPracticeExam = async (payload: Omit<PracticeExam, 'id'>): Promise<PracticeExam> => {
  const response = await requestApi('/api/admin/practice-exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminPracticeQuestions = async (examId: number): Promise<PracticeQuestion[]> => {
  const response = await requestApi(`/api/admin/practice-exams/${examId}/questions`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createAdminPracticeQuestion = async (examId: number, payload: Omit<PracticeQuestion, 'id' | 'exam_id'>): Promise<PracticeQuestion> => {
  const response = await requestApi(`/api/admin/practice-exams/${examId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionText: payload.question_text, options: payload.options, correctAnswer: payload.correct_answer, explanation: payload.explanation }) })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const requestApi = (url: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  const sessionToken = sessionStorage.getItem(authSessionTokenKey)
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`)
  return fetchApi(url, { ...init, headers })
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
  revenueByCategory: Array<{ label: string; value: number }>
  topCourses: Array<{ label: string; value: number }>
}

export interface AdminQuizViolation {
  id: number
  studentName: string
  studentEmail: string
  courseTitle: string
  lessonTitle: string
  lessonId: number
  violations: Array<{ type: 'visibility' | 'fullscreen'; occurredAt: string }>
  disqualified: boolean
  score: number | null
  passed: boolean | null
  retakeApproved: boolean
  retakeStatus: 'not_retaken' | 'passed' | 'failed'
  retakeScore: number | null
  retakeSubmittedAt: string | null
  submittedAt: string | null
}

export interface AdminPayment {
  id: number
  student: string
  course: string
  amount: number
  date: string
  status: 'Paid' | 'Pending' | 'Failed'
}

export interface MyPayment {
  id: number
  itemName: string
  type: 'course' | 'class'
  amount: number
  currency: string
  status: 'Paid' | 'Pending' | 'Failed'
  date: string
  txRef: string
}

export const getPublicClasses = async (): Promise<PublicClass[]> => {
  const response = await requestApi('/api/classes')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  const records = await response.json() as Array<Omit<PublicClass, 'schedule'> & { schedule?: Partial<PublicClass['schedule']> | null }>
  return records.map((record) => ({
    ...record,
    schedule: {
      days: record.schedule?.days ?? [],
      time: record.schedule?.time ?? '',
      duration: record.schedule?.duration ?? 0,
      flexible: record.schedule?.flexible ?? false,
      startDate: record.schedule?.startDate ?? '',
      endDate: record.schedule?.endDate ?? '',
    },
  }))
}

export const getTutorOverview = async (): Promise<TutorOverview> => {
  const response = await requestApi('/api/tutor/overview')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getTutorCourses = async (): Promise<AdminCourse[]> => {
  const response = await requestApi('/api/tutor/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getTutorClasses = async (): Promise<TutorClass[]> => {
  const response = await requestApi('/api/tutor/classes')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const updateTutorCurriculum = async (url: string, modules: AdminModule[]): Promise<AdminModule[]> => {
  const response = await requestApi(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modules }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  const result = await response.json() as { modules: AdminModule[] }
  return result.modules
}

export const updateTutorCourseCurriculum = (courseId: number, modules: AdminModule[]) => updateTutorCurriculum(`/api/tutor/courses/${courseId}/curriculum`, modules)

export const updateTutorClassCurriculum = (classId: number, modules: AdminModule[]) => updateTutorCurriculum(`/api/tutor/classes/${classId}/curriculum`, modules)

export const getTutorCourseStudents = async (courseId: number): Promise<TutorClassStudent[]> => {
  const response = await requestApi(`/api/tutor/courses/${courseId}/students`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getTutorClassStudents = async (classId: number): Promise<TutorClassStudent[]> => {
  const response = await requestApi(`/api/tutor/classes/${classId}/students`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const logLiveSessionJoin = async (enrollmentId: number, lessonId: number): Promise<{ clickedAt: string }> => {
  const response = await requestApi(`/api/enrollments/${enrollmentId}/live-sessions/${lessonId}/join`, { method: 'POST' })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const updateTutorClassAttendance = async (enrollmentId: number, lessonId: number, status: 'Present' | 'Absent'): Promise<void> => {
  const response = await requestApi(`/api/tutor/classes/enrollments/${enrollmentId}/attendance`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, status }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const updateTutorProfile = async (profile: Partial<Pick<AdminTutor, 'name' | 'phone' | 'bio'>>): Promise<AdminTutor> => {
  const response = await requestApi('/api/tutor/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminAtRiskStudents = async (): Promise<AtRiskStudent[]> => {
  const response = await requestApi('/api/admin/at-risk-students')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getTutorAtRiskStudents = async (): Promise<AtRiskStudent[]> => {
  const response = await requestApi('/api/tutor/at-risk-students')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminQuizViolations = async (): Promise<AdminQuizViolation[]> => {
  const response = await requestApi('/api/admin/quiz-violations')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const approveAdminQuizRetake = async (attemptId: number) => {
  const response = await requestApi(`/api/admin/quiz-attempts/${attemptId}/retake-approval`, { method: 'POST' })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<{ id: number; retakeApproved: boolean }>
}

export const getAdminPayments = async (): Promise<AdminPayment[]> => {
  const response = await requestApi('/api/admin/payments')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
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

export type AdminClassProgram = 'international-online-interactive' | 'summer-camp' | 'ministry-exam-prep'
export type AdminClassStatus = 'pending_schedule' | 'open' | 'full' | 'closed'

export interface AdminClassSchedule {
  startDate: string
  endDate: string
}

export interface AdminClass {
  id: number
  program_id: AdminClassProgram
  title: string
  tutor_id: number
  capacity: number
  schedule: AdminClassSchedule
  meeting_link: string
  modules: Array<{ id: number; title: string; lessons: Array<{ id: number; title: string; type: 'video' | 'article' | 'quiz' | 'live'; duration: number | null; resources: Array<{ id: number; name: string; url?: string }> }> }>
  price: number
  status: AdminClassStatus
  published: boolean
}

export interface AdminClassEnrollment {
  id: number
  class_id: number
  student_name: string
  enrolled_date: string
  status: 'enrolled' | 'waitlisted'
}

export interface PendingClassStudent {
  id: number
  student_name: string
  enrolled_date: string
  age: number | null
}

export interface AdminClassesWorkspace {
  classes: AdminClass[]
  enrollments: AdminClassEnrollment[]
  pendingStudents: PendingClassStudent[]
  tutors: Array<{ id: number; name: string }>
}

const requestClasses = async (url: string, init?: RequestInit): Promise<AdminClass> => {
  const response = await requestApi(url, init)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getAdminClassesWorkspace = async (): Promise<AdminClassesWorkspace> => {
  const response = await requestApi('/api/admin/classes')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createAdminClass = (classRecord: Omit<AdminClass, 'id' | 'status'>) => requestClasses('/api/admin/classes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(classRecord),
})

export const updateAdminClass = (classRecord: Omit<AdminClass, 'status'>) => requestClasses(`/api/admin/classes/${classRecord.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(classRecord),
})

export const deleteAdminClass = async (classRecord: AdminClass) => {
  const hideClass = async () => {
    const fallbackResponse = await requestApi(`/api/admin/classes/${classRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...classRecord, published: false }),
    })
    if (!fallbackResponse.ok) throw new Error(await getErrorMessage(fallbackResponse))
  }

  try {
    const response = await requestApi(`/api/admin/classes/${classRecord.id}`, { method: 'DELETE' })
    if (response.ok) return
    if (response.status !== 404) throw new Error(await getErrorMessage(response))
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
  }

  await hideClass()
}

export const assignAdminClass = (enrollmentId: number, values: Omit<AdminClass, 'id' | 'status' | 'program_id' | 'modules' | 'published'>) => requestClasses('/api/admin/classes/assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enrollmentId, ...values }),
})

export const updateAdminClassEnrollment = async (id: number, status: AdminClassEnrollment['status']) => {
  const response = await requestApi(`/api/admin/classes/enrollments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const updateAdminClassAttendance = async (enrollmentId: number, lessonId: number, status: 'Present' | 'Absent') => {
  const response = await requestApi(`/api/admin/classes/enrollments/${enrollmentId}/attendance`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, status }) })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}

export const removeAdminClassEnrollment = async (id: number) => {
  const response = await requestApi(`/api/admin/classes/enrollments/${id}`, { method: 'DELETE' })
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

interface ChapaCheckout {
  checkoutUrl: string
  paymentReference: string
  mode: 'test' | 'live'
}

export const createChapaCheckout = async (courseId: AdminCourse['id'], practiceExamId?: number): Promise<ChapaCheckout> => {
  const response = await requestApi('/api/payments/chapa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(practiceExamId === undefined ? { courseId } : { practiceExamId }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const createClassChapaCheckout = async (classId: number): Promise<ChapaCheckout> => {
  const response = await requestApi('/api/payments/chapa/class', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const completeTestPayment = async (reference: string, status: 'paid' | 'failed'): Promise<PaymentStatus> => {
  const response = await requestApi(`/api/payments/chapa/${encodeURIComponent(reference)}/test-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const verifyChapaPayment = async (reference: string): Promise<PaymentStatus> => {
  const response = await requestApi(`/api/payments/chapa/${encodeURIComponent(reference)}`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getMyPayments = async (): Promise<MyPayment[]> => {
  const response = await requestApi('/api/payments')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getMyEnrollments = async (): Promise<MyEnrollment[]> => {
  const response = await requestApi('/api/enrollments')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const getGamification = async (): Promise<GamificationData> => {
  const response = await requestApi('/api/gamification')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const requestLearningProgress = async <T>(url: string, init: RequestInit): Promise<T> => {
  const response = await requestApi(url, init)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const saveLessonEngagement = (enrollmentId: number, lessonId: number, values: { activeSeconds: number; videoPositionSeconds?: number; quizAttemptId?: number; keepalive?: boolean }) => requestLearningProgress<LessonProgress>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/engagement`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activeSeconds: values.activeSeconds, videoPositionSeconds: values.videoPositionSeconds, quizAttemptId: values.quizAttemptId }),
  keepalive: values.keepalive,
})

export const completeLesson = (enrollmentId: number, lessonId: number) => requestLearningProgress<LessonProgress>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {
  method: 'POST',
})

export const beginQuizAttempt = (enrollmentId: number, lessonId: number) => requestLearningProgress<QuizAttempt>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/quiz-attempts`, {
  method: 'POST',
})

export const saveQuizAnswer = (enrollmentId: number, lessonId: number, attemptId: number, questionId: number, answer: QuizAnswerRecord) => requestLearningProgress<QuizAttempt>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/quiz-attempts/${attemptId}/answers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ questionId, answer }),
})

export const saveQuizViolation = (enrollmentId: number, lessonId: number, attemptId: number, violation: QuizViolation) => requestLearningProgress<QuizAttempt>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/quiz-attempts/${attemptId}/violations`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ violation }),
})

export const submitQuizAttempt = (enrollmentId: number, lessonId: number, attemptId: number, answers: Record<number, QuizAnswerRecord>, disqualified = false) => requestLearningProgress<QuizAttempt>(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/quiz-attempts/${attemptId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers, disqualified }),
})

export const signOut = async () => {
  try {
    await requestApi('/api/auth/sign-out', { method: 'POST' })
  } catch {
    // Clear the local session even when the API is unavailable.
  } finally {
    clearAuthenticatedUser()
  }
}
