import { courses, type AdminCourse } from '@/components/admin/admin-data'

export interface StudentEnrollment {
  id: number
  courseId: number
  status: 'In progress' | 'Completed'
  progress: number
  nextLesson: string
  enrolledAt: string
}

export interface StudentLesson {
  id: number
  courseId: number
  moduleId: number
  title: string
  type: 'video' | 'live'
  duration: string
  completed: boolean
  description: string
}

export interface StudentQuiz {
  id: number
  courseId: number
  title: string
  questions: number
  dueDate: string
  status: 'Available' | 'Completed'
  score?: number
}

export interface StudentPurchase {
  id: number
  title: string
  type: 'Book' | 'Standalone exam'
  purchasedAt: string
  accessLabel: string
}

export interface StudentPayment {
  id: number
  description: string
  date: string
  amount: number
  status: 'Paid' | 'Pending'
}

export const loggedInStudent = {
  id: 7,
  name: 'Ava Johnson',
  email: 'ava@example.com',
  phone: '+251 911 234 567',
}

export const studentCourses: AdminCourse[] = courses.filter((course) => [1, 2].includes(course.id))

export const studentEnrollments: StudentEnrollment[] = [
  { id: 1, courseId: 1, status: 'In progress', progress: 68, nextLesson: 'Building a model', enrolledAt: 'Aug 08, 2025' },
  { id: 2, courseId: 2, status: 'In progress', progress: 34, nextLesson: 'Working with registries', enrolledAt: 'Aug 14, 2025' },
]

export const studentLessons: StudentLesson[] = [
  { id: 1, courseId: 1, moduleId: 1, title: 'Schemas and entities', type: 'video', duration: '18 min', completed: true, description: 'Learn how to identify the core entities in a reliable data model.' },
  { id: 2, courseId: 1, moduleId: 1, title: 'Relational thinking', type: 'video', duration: '24 min', completed: true, description: 'Connect entities and relationships using practical examples.' },
  { id: 3, courseId: 1, moduleId: 2, title: 'Building a model', type: 'video', duration: '31 min', completed: false, description: 'Build a complete model from a real product brief.' },
  { id: 4, courseId: 1, moduleId: 2, title: 'Reviewing relationships', type: 'live', duration: 'Live · Today, 4:00 PM', completed: false, description: 'Join the tutor-led review clinic and bring your current schema draft.' },
  { id: 5, courseId: 2, moduleId: 3, title: 'Images and containers', type: 'video', duration: '22 min', completed: true, description: 'Understand the relationship between Docker images and containers.' },
  { id: 6, courseId: 2, moduleId: 3, title: 'Working with registries', type: 'video', duration: '27 min', completed: false, description: 'Push, pull, and manage images across registries.' },
  { id: 7, courseId: 2, moduleId: 4, title: 'Deployments', type: 'live', duration: 'Live · Aug 28, 6:00 PM', completed: false, description: 'Walk through a Kubernetes deployment with your tutor.' },
  { id: 8, courseId: 2, moduleId: 4, title: 'Services and networking', type: 'video', duration: '29 min', completed: false, description: 'Make services discoverable and resilient in Kubernetes.' },
]

export const studentQuizzes: StudentQuiz[] = [
  { id: 1, courseId: 1, title: 'Data foundations quiz', questions: 12, dueDate: 'Aug 26, 2025', status: 'Completed', score: 88 },
  { id: 2, courseId: 1, title: 'Schema design checkpoint', questions: 15, dueDate: 'Sep 02, 2025', status: 'Available' },
  { id: 3, courseId: 2, title: 'Container basics quiz', questions: 10, dueDate: 'Aug 30, 2025', status: 'Completed', score: 94 },
  { id: 4, courseId: 2, title: 'Kubernetes readiness check', questions: 18, dueDate: 'Sep 06, 2025', status: 'Available' },
]

export const quizAttempts = [
  { id: 1, quizId: 1, studentId: loggedInStudent.id, score: 88, completedAt: 'Aug 21, 2025' },
  { id: 2, quizId: 3, studentId: loggedInStudent.id, score: 94, completedAt: 'Aug 22, 2025' },
]

export const studentPurchases: StudentPurchase[] = [
  { id: 1, title: 'The Practical Data Modeling Handbook', type: 'Book', purchasedAt: 'Aug 12, 2025', accessLabel: 'Download PDF' },
  { id: 2, title: 'Cloud Engineering Certification Exam', type: 'Standalone exam', purchasedAt: 'Aug 16, 2025', accessLabel: 'Access exam' },
  { id: 3, title: 'Design Systems with MUI', type: 'Book', purchasedAt: 'Aug 20, 2025', accessLabel: 'Download PDF' },
]

export const studentPayments: StudentPayment[] = [
  { id: 1, description: 'Mastering Data Modeling Fundamentals', date: 'Aug 08, 2025', amount: 30, status: 'Paid' },
  { id: 2, description: 'The Complete Guide to Docker and Kubernetes', date: 'Aug 14, 2025', amount: 30, status: 'Paid' },
  { id: 3, description: 'Cloud Engineering Certification Exam', date: 'Aug 16, 2025', amount: 45, status: 'Paid' },
  { id: 4, description: 'Design Systems with MUI', date: 'Aug 20, 2025', amount: 24, status: 'Pending' },
]
