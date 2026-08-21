export type LessonType = 'video' | 'article' | 'quiz' | 'live'

export interface LessonResource {
  id: number
  name: string
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

export interface AdminTutor {
  id: number
  name: string
  email: string
  phone: string
  bio: string
  status: 'Active' | 'Inactive'
  createdAt: string
  assignedCourses: AssignedCourse[]
  assignedCourseIds?: number[]
  specialty?: string
  courses?: number
}

export type Tutor = AdminTutor

export interface Payment {
  id: number
  student: string
  course: string
  amount: number
  date: string
  status: 'Paid' | 'Pending' | 'Refunded'
}

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

export const courses: AdminCourse[] = [
  {
    id: 3,
    title: 'Mastering Data Modeling Fundamentals',
    category: 'Data',
    level: 'Beginner',
    tutor: 'Maya Chen',
    status: 'Published',
    students: 128,
    price: 30,
    cover: '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg',
    description: 'Build clear, scalable data models that make better product decisions possible.',
    longDescription: 'Learn a practical, repeatable approach to modeling real-world information. You will work from business questions through entities, relationships, and the trade-offs behind durable database design.',
    learningOutcomes: ['Identify the entities and relationships behind a product problem', 'Create clear conceptual and logical data models', 'Review a model for consistency, scale, and maintainability'],
    requirements: ['No previous data modeling experience is required', 'Bring a product or workflow you would like to model'],
    certificate: true,
    updatedAt: 'August 21, 2025',
    modules: [
      {
        id: 1,
        title: 'Data Foundations',
        lessons: [
          { id: 1, title: 'Schemas and entities', type: 'video', duration: 724, resources: [{ id: 1, name: 'Entity mapping worksheet.pdf' }] },
          { id: 2, title: 'Relational thinking', type: 'article', duration: null, resources: [], articleBody: 'Relationships are the language of a useful data model. Start by describing how each important entity connects to the next.' },
        ],
      },
      {
        id: 2,
        title: 'Practical Modeling',
        lessons: [
          { id: 3, title: 'Building a model', type: 'video', duration: 1080, resources: [{ id: 2, name: 'Modeling template.pdf' }] },
          { id: 4, title: 'Reviewing relationships', type: 'quiz', duration: null, resources: [], passThreshold: 70, quizQuestions: [{ id: 1, question: 'Which relationship describes one customer with many orders?', options: ['One-to-one', 'One-to-many', 'Many-to-many'], correctOption: 1 }] },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'The Complete Guide to Docker and Kubernetes',
    category: 'Development',
    level: 'Intermediate',
    tutor: 'Leon Kennedy',
    status: 'Published',
    students: 96,
    price: 30,
    cover: '/images/courses/true-agency-o4UhdLv5jbQ-unsplash.jpg',
    description: 'Confidently package, ship, and operate modern applications in containers.',
    longDescription: 'Move from a working local container to a dependable production deployment. This course connects Docker fundamentals with the Kubernetes primitives teams use to run resilient services.',
    learningOutcomes: ['Build efficient Docker images for application services', 'Use registries and container networking confidently', 'Deploy and scale workloads with Kubernetes'],
    requirements: ['Comfort with a command line', 'A computer capable of running Docker Desktop'],
    certificate: true,
    updatedAt: 'August 18, 2025',
    modules: [
      {
        id: 3,
        title: 'Container Basics',
        lessons: [
          { id: 5, title: 'Images and containers', type: 'video', duration: 960, resources: [{ id: 3, name: 'Docker commands cheat sheet.pdf' }] },
          { id: 6, title: 'Working with registries', type: 'article', duration: null, resources: [], articleBody: 'A registry provides a trusted place to store, version, and distribute container images across your team.' },
        ],
      },
      {
        id: 4,
        title: 'Kubernetes',
        lessons: [
          { id: 7, title: 'Deployments', type: 'video', duration: 1260, resources: [] },
          { id: 8, title: 'Services and networking', type: 'live', duration: null, estimatedDuration: 2700, resources: [], meetingUrl: 'https://meet.google.com/', scheduledAt: '2025-09-12T17:00' },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'Modern React with MUI & Redux',
    category: 'Development',
    level: 'Intermediate',
    tutor: 'Jhon Dwirian',
    status: 'Draft',
    students: 0,
    price: 35,
    cover: '/images/courses/stillness-inmotion-Jh6aQX-25Uo-unsplash.jpg',
    description: 'Design reliable React interfaces with component systems and predictable application state.',
    longDescription: 'Create polished, maintainable frontends using React, Material UI, and Redux. The lessons focus on practical structure, reusable patterns, and the choices that keep a product easy to evolve.',
    learningOutcomes: ['Structure React applications around reusable features', 'Build accessible interfaces with Material UI', 'Model shared state with Redux'],
    requirements: ['Working knowledge of JavaScript', 'A recent version of Node.js'],
    certificate: false,
    updatedAt: 'August 16, 2025',
    modules: [
      {
        id: 5,
        title: 'React Architecture',
        lessons: [
          { id: 9, title: 'Components', type: 'video', duration: 840, resources: [] },
          { id: 10, title: 'State management', type: 'quiz', duration: null, resources: [], passThreshold: 70, quizQuestions: [{ id: 2, question: 'Where should shared application state live?', options: ['Only in CSS', 'In a predictable shared store when it is genuinely shared', 'Inside every component'], correctOption: 1 }] },
        ],
      },
    ],
  },
]

const courseStorageKey = 'coursespace-admin-courses'

export const loadAdminCourses = (): AdminCourse[] => {
  if (typeof window === 'undefined') return courses

  try {
    const storedCourses: unknown = JSON.parse(window.localStorage.getItem(courseStorageKey) ?? 'null')
    if (Array.isArray(storedCourses) && storedCourses.every((course) => course && typeof course === 'object' && 'id' in course && 'title' in course && 'modules' in course)) {
      return storedCourses as AdminCourse[]
    }
  } catch {
    return courses
  }

  return courses
}

export const saveAdminCourses = (nextCourses: AdminCourse[]) => {
  window.localStorage.setItem(courseStorageKey, JSON.stringify(nextCourses))
}

export const registrations: Registration[] = [
  { id: 1, student: 'Ava Johnson', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 18, 2025', status: 'Pending' },
  { id: 2, student: 'Noah Williams', course: 'Docker and Kubernetes', date: 'Aug 17, 2025', status: 'Approved' },
  { id: 3, student: 'Liam Brown', course: 'Modern React with MUI & Redux', date: 'Aug 16, 2025', status: 'Waitlisted' },
  { id: 4, student: 'Emma Davis', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 15, 2025', status: 'Pending' },
]

export const tutors: Tutor[] = [
  { id: 1, name: 'Maya Chen', email: 'maya@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jul 12, 2025', assignedCourses: [], specialty: 'Data Science', courses: 4 },
  { id: 2, name: 'Leon Kennedy', email: 'leon@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jun 24, 2025', assignedCourses: [], specialty: 'Cloud Engineering', courses: 3 },
  { id: 3, name: 'Jhon Dwirian', email: 'jhon@example.com', phone: '', bio: '', status: 'Inactive', createdAt: 'May 09, 2025', assignedCourses: [], specialty: 'Frontend Development', courses: 2 },
  { id: 4, name: 'Rizki Known', email: 'rizki@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Apr 18, 2025', assignedCourses: [], specialty: 'Product Design', courses: 5 },
]

export const payments: Payment[] = [
  { id: 1, student: 'Ava Johnson', course: 'Data Modeling Fundamentals', amount: 30, date: 'Aug 18, 2025', status: 'Paid' },
  { id: 2, student: 'Noah Williams', course: 'Docker and Kubernetes', amount: 30, date: 'Aug 17, 2025', status: 'Paid' },
  { id: 3, student: 'Liam Brown', course: 'React with MUI & Redux', amount: 35, date: 'Aug 16, 2025', status: 'Pending' },
  { id: 4, student: 'Emma Davis', course: 'Data Modeling Fundamentals', amount: 30, date: 'Aug 15, 2025', status: 'Refunded' },
]

export const users: AdminUser[] = [
  { id: 1, name: 'Ava Johnson', email: 'ava@example.com', role: 'Student', joined: 'Aug 18, 2025', status: 'Active' },
  { id: 2, name: 'Maya Chen', email: 'maya@example.com', role: 'Tutor', joined: 'Jul 12, 2025', status: 'Active' },
  { id: 3, name: 'Noah Williams', email: 'noah@example.com', role: 'Student', joined: 'Jun 24, 2025', status: 'Active' },
  { id: 4, name: 'Jhon Dwirian', email: 'jhon@example.com', role: 'Tutor', joined: 'May 09, 2025', status: 'Suspended' },
]
