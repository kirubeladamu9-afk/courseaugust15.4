export type LessonType = 'video' | 'article' | 'quiz' | 'live'

export interface LessonResource {
  id: number
  name: string
  url?: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctOption: number
}

export interface AdminLesson {
  id: number
  title: string
  type: LessonType
  duration: number | null
  videoUrl?: string
  thumbnailUrl?: string
  resources: LessonResource[]
  articleBody?: string
  quizQuestions?: QuizQuestion[]
  passThreshold?: number
  meetingUrl?: string
  scheduledAt?: string
  dateOverridden?: boolean
  estimatedDuration?: number
}

export interface AdminCourse {
  id: number
  title: string
  category: string
  level: string
  tutor: string
  status: 'Published' | 'Draft'
  students: number
  price: number
  cover: string
  description: string
  longDescription: string
  learningOutcomes: string[]
  requirements: string[]
  certificate: boolean
  updatedAt: string
  modules: AdminModule[]
}

export interface AdminModule {
  id: number
  title: string
  lessons: AdminLesson[]
}

export interface Registration {
  id: number
  student: string
  course: string
  date: string
  status: 'Pending' | 'Approved' | 'Waitlisted' | 'Rejected'
}

export interface AssignedCourse {
  id: number
  title: string
  category: string
  students: number
}

export interface AssignedClass {
  id: number
  title: string
}

export interface AdminTutor {
  id: number
  name: string
  email: string
  phone: string
  bio: string
  status: 'Active' | 'Inactive'
  createdAt: string
  assignedCourses: AssignedCourse[]
  assignedClasses: AssignedClass[]
  assignedCourseIds?: number[]
  specialty?: string
  courses?: number
}

export type Tutor = AdminTutor

export interface AdminUser {
  id: number
  accountId?: number
  accountType?: 'user' | 'tutor'
  name: string
  email: string
  role: 'Student' | 'Tutor' | 'Admin'
  joined: string
  status: 'Active' | 'Suspended'
}

export const registrations: Registration[] = [
  { id: 1, student: 'Ava Johnson', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 18, 2025', status: 'Pending' },
  { id: 2, student: 'Noah Williams', course: 'Docker and Kubernetes', date: 'Aug 17, 2025', status: 'Approved' },
  { id: 3, student: 'Liam Brown', course: 'Modern React with MUI & Redux', date: 'Aug 16, 2025', status: 'Waitlisted' },
  { id: 4, student: 'Emma Davis', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 15, 2025', status: 'Pending' },
]

export const tutors: Tutor[] = [
  { id: 1, name: 'Maya Chen', email: 'maya@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jul 12, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Data Science', courses: 4 },
  { id: 2, name: 'Leon Kennedy', email: 'leon@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jun 24, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Cloud Engineering', courses: 3 },
  { id: 3, name: 'Jhon Dwirian', email: 'jhon@example.com', phone: '', bio: '', status: 'Inactive', createdAt: 'May 09, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Frontend Development', courses: 2 },
  { id: 4, name: 'Rizki Known', email: 'rizki@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Apr 18, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Product Design', courses: 5 },
]

export const users: AdminUser[] = [
  { id: 1, name: 'Ava Johnson', email: 'ava@example.com', role: 'Student', joined: 'Aug 18, 2025', status: 'Active' },
  { id: 2, name: 'Maya Chen', email: 'maya@example.com', role: 'Tutor', joined: 'Jul 12, 2025', status: 'Active' },
  { id: 3, name: 'Noah Williams', email: 'noah@example.com', role: 'Student', joined: 'Jun 24, 2025', status: 'Active' },
  { id: 4, name: 'Jhon Dwirian', email: 'jhon@example.com', role: 'Tutor', joined: 'May 09, 2025', status: 'Suspended' },
]
