import { courses, type AdminCourse } from '@/components/admin/admin-data'

export interface TutorEnrollment {
  id: number
  student: string
  email: string
  courseId: number
  progress: string
  attendance: 'Present' | 'Absent'
}

export interface TutorSubmission {
  id: number
  student: string
  courseId: number
  assessment: string
  submitted: string
  score: string
  status: 'Pending' | 'Graded'
}

export interface TutorAnnouncement {
  id: number
  courseId: number
  title: string
  message: string
  published: string
}

export const loggedInTutor = {
  id: 1,
  name: 'Maya Chen',
  email: 'maya.chen@coursespace.io',
  specialty: 'Data Science',
}

export const tutorCourses: AdminCourse[] = courses.filter((course) => course.tutor === loggedInTutor.name)

export const tutorEnrollments: TutorEnrollment[] = [
  { id: 1, student: 'Ava Johnson', email: 'ava@example.com', courseId: 1, progress: '78%', attendance: 'Present' },
  { id: 2, student: 'Noah Williams', email: 'noah@example.com', courseId: 1, progress: '64%', attendance: 'Present' },
  { id: 3, student: 'Emma Davis', email: 'emma@example.com', courseId: 1, progress: '52%', attendance: 'Absent' },
  { id: 4, student: 'Ethan Miller', email: 'ethan@example.com', courseId: 1, progress: '91%', attendance: 'Present' },
  { id: 5, student: 'Sophia Martinez', email: 'sophia@example.com', courseId: 1, progress: '43%', attendance: 'Present' },
]

export const tutorSubmissions: TutorSubmission[] = [
  { id: 1, student: 'Ava Johnson', courseId: 1, assessment: 'Entity relationship quiz', submitted: 'Today, 9:42 AM', score: '', status: 'Pending' },
  { id: 2, student: 'Noah Williams', courseId: 1, assessment: 'Schema design exercise', submitted: 'Yesterday, 3:18 PM', score: '', status: 'Pending' },
  { id: 3, student: 'Emma Davis', courseId: 1, assessment: 'Entity relationship quiz', submitted: 'Aug 19, 11:04 AM', score: '88', status: 'Graded' },
  { id: 4, student: 'Ethan Miller', courseId: 1, assessment: 'Schema design exercise', submitted: 'Aug 18, 2:30 PM', score: '94', status: 'Graded' },
]

export const tutorAnnouncements: TutorAnnouncement[] = [
  { id: 1, courseId: 1, title: 'Live modeling clinic this Friday', message: 'Bring your current schema draft for a working review during our live session.', published: 'Today, 8:30 AM' },
  { id: 2, courseId: 1, title: 'Module two is now available', message: 'The practical modeling lessons are ready. Please complete the foundations quiz first.', published: 'Aug 19, 2025' },
]
