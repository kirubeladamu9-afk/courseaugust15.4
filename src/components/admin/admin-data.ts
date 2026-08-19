export interface AdminCourse {
  id: number
  title: string
  category: string
  tutor: string
  status: 'Published' | 'Draft'
  students: number
  price: number
  modules: AdminModule[]
}

export interface AdminModule {
  id: number
  title: string
  lessons: string[]
}

export interface Registration {
  id: number
  student: string
  course: string
  date: string
  status: 'Pending' | 'Approved' | 'Waitlisted' | 'Rejected'
}

export interface Tutor {
  id: number
  name: string
  specialty: string
  courses: number
  status: 'Active' | 'Pending'
}

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
  name: string
  email: string
  role: 'Student' | 'Tutor' | 'Admin'
  joined: string
  status: 'Active' | 'Suspended'
}

export const courses: AdminCourse[] = [
  {
    id: 1,
    title: 'Mastering Data Modeling Fundamentals',
    category: 'Data',
    tutor: 'Maya Chen',
    status: 'Published',
    students: 128,
    price: 30,
    modules: [
      { id: 1, title: 'Data Foundations', lessons: ['Schemas and entities', 'Relational thinking'] },
      { id: 2, title: 'Practical Modeling', lessons: ['Building a model', 'Reviewing relationships'] },
    ],
  },
  {
    id: 2,
    title: 'The Complete Guide to Docker and Kubernetes',
    category: 'Development',
    tutor: 'Leon Kennedy',
    status: 'Published',
    students: 96,
    price: 30,
    modules: [
      { id: 3, title: 'Container Basics', lessons: ['Images and containers', 'Working with registries'] },
      { id: 4, title: 'Kubernetes', lessons: ['Deployments', 'Services and networking'] },
    ],
  },
  {
    id: 3,
    title: 'Modern React with MUI & Redux',
    category: 'Development',
    tutor: 'Jhon Dwirian',
    status: 'Draft',
    students: 0,
    price: 35,
    modules: [{ id: 5, title: 'React Architecture', lessons: ['Components', 'State management'] }],
  },
]

export const registrations: Registration[] = [
  { id: 1, student: 'Ava Johnson', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 18, 2025', status: 'Pending' },
  { id: 2, student: 'Noah Williams', course: 'Docker and Kubernetes', date: 'Aug 17, 2025', status: 'Approved' },
  { id: 3, student: 'Liam Brown', course: 'Modern React with MUI & Redux', date: 'Aug 16, 2025', status: 'Waitlisted' },
  { id: 4, student: 'Emma Davis', course: 'Mastering Data Modeling Fundamentals', date: 'Aug 15, 2025', status: 'Pending' },
]

export const tutors: Tutor[] = [
  { id: 1, name: 'Maya Chen', specialty: 'Data Science', courses: 4, status: 'Active' },
  { id: 2, name: 'Leon Kennedy', specialty: 'Cloud Engineering', courses: 3, status: 'Active' },
  { id: 3, name: 'Jhon Dwirian', specialty: 'Frontend Development', courses: 2, status: 'Pending' },
  { id: 4, name: 'Rizki Known', specialty: 'Product Design', courses: 5, status: 'Active' },
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
