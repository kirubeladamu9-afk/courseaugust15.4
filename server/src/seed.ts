import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client'
import { env } from './config/env'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const users = [
  { name: 'Admin User', username: 'admin', email: 'admin@coursespace.com', password: 'Admin123!', role: UserRole.ADMIN },
  { name: 'Teacher User', username: 'teacher', email: 'teacher@coursespace.com', password: 'Teacher123!', role: UserRole.TEACHER },
  { name: 'Parent User', username: 'parent', email: 'parent@coursespace.com', password: 'Parent123!', role: UserRole.PARENT },
  { name: 'Student User', username: 'student', email: 'student@coursespace.com', password: 'Student123!', role: UserRole.STUDENT },
]

for (const user of users) {
  await prisma.user.upsert({
    where: { username: user.username },
    update: { name: user.name, email: user.email, passwordHash: await bcrypt.hash(user.password, 12), role: user.role, status: AccountStatus.ACTIVE },
    create: { name: user.name, username: user.username, email: user.email, passwordHash: await bcrypt.hash(user.password, 12), role: user.role, status: AccountStatus.ACTIVE },
  })
}

const adminRecords = [
  ['roles-permissions', 'Administrator', { Role: 'Administrator', Users: '8', Permissions: 'Full access' }, 'Active'],
  ['roles-permissions', 'Teacher', { Role: 'Teacher', Users: '186', Permissions: 'Academic management' }, 'Active'],
  ['student-progress', 'Ava Johnson', { Student: 'Ava Johnson', Grade: 'Grade 8', Courses: '6 courses', Completion: '86%' }, 'On track'],
  ['student-progress', 'Noah Williams', { Student: 'Noah Williams', Grade: 'Grade 7', Courses: '5 courses', Completion: '72%' }, 'On track'],
  ['parent-student-link', 'Olivia Johnson', { Parent: 'Olivia Johnson', Student: 'Ava Johnson', Relationship: 'Mother', 'Linked on': 'Jul 12, 2024' }, 'Active'],
  ['parent-student-link', 'James Williams', { Parent: 'James Williams', Student: 'Noah Williams', Relationship: 'Father', 'Linked on': 'Jul 10, 2024' }, 'Active'],
  ['teacher-assignments', 'Maria Garcia', { Teacher: 'Maria Garcia', Subject: 'Mathematics', Grade: 'Grade 8', Students: '124' }, 'Assigned'],
  ['teacher-assignments', 'Daniel Wilson', { Teacher: 'Daniel Wilson', Subject: 'Science', Grade: 'Grade 7', Students: '98' }, 'Assigned'],
  ['subjects', 'Mathematics', { Subject: 'Mathematics', 'Grade levels': '6–9', Chapters: '24', Teachers: '32' }, 'Published'],
  ['subjects', 'Science', { Subject: 'Science', 'Grade levels': '6–9', Chapters: '18', Teachers: '28' }, 'Published'],
  ['chapters', 'Algebraic Expressions', { Chapter: 'Algebraic Expressions', Subject: 'Mathematics', Lessons: '12', Completion: '84%' }, 'Published'],
  ['chapters', 'Energy & Matter', { Chapter: 'Energy & Matter', Subject: 'Science', Lessons: '9', Completion: '76%' }, 'Published'],
  ['lessons', 'Solving Linear Equations', { Lesson: 'Solving Linear Equations', Subject: 'Mathematics', Chapter: 'Algebraic Expressions', Views: '1,284' }, 'Published'],
  ['lessons', 'Forms of Energy', { Lesson: 'Forms of Energy', Subject: 'Science', Chapter: 'Energy & Matter', Views: '982' }, 'Published'],
  ['learning-materials', 'Algebra workbook', { Material: 'Algebra workbook', Type: 'PDF', Course: 'Mathematics', Downloads: '842' }, 'Published'],
  ['learning-materials', 'Energy lab guide', { Material: 'Energy lab guide', Type: 'Document', Course: 'Science', Downloads: '621' }, 'Published'],
  ['quizzes', 'Linear Equations Check', { Quiz: 'Linear Equations Check', Subject: 'Mathematics', Questions: '15', Attempts: '842' }, 'Published'],
  ['quizzes', 'Energy Fundamentals', { Quiz: 'Energy Fundamentals', Subject: 'Science', Questions: '20', Attempts: '621' }, 'Published'],
  ['exams', 'Midterm Assessment', { Exam: 'Midterm Assessment', Term: 'Fall 2024', Subjects: '6', Submissions: '2,104' }, 'Scheduled'],
  ['exams', 'Mathematics Final', { Exam: 'Mathematics Final', Term: 'Spring 2024', Subjects: '1', Submissions: '2,312' }, 'Completed'],
  ['assignments', 'Algebra practice set', { Assignment: 'Algebra practice set', Course: 'Mathematics', 'Due date': 'Jul 19, 2024', Submissions: '114/124' }, 'Active'],
  ['assignments', 'Energy lab report', { Assignment: 'Energy lab report', Course: 'Science', 'Due date': 'Jul 21, 2024', Submissions: '82/98' }, 'Active'],
  ['teacher-reports', 'Maria Garcia', { Teacher: 'Maria Garcia', Classes: '4', Students: '124', Completion: '92%' }, 'Published'],
  ['teacher-reports', 'Daniel Wilson', { Teacher: 'Daniel Wilson', Classes: '3', Students: '98', Completion: '88%' }, 'Published'],
  ['course-reports', 'Mathematics', { Course: 'Mathematics', Students: '624', Completion: '84%', 'Avg. score': '82%' }, 'Published'],
  ['course-reports', 'Science', { Course: 'Science', Students: '498', Completion: '78%', 'Avg. score': '76%' }, 'Published'],
  ['performance-analytics', 'Course completion', { Metric: 'Course completion', 'Current period': '78%', 'Previous period': '73%' }, 'Published'],
  ['performance-analytics', 'Average assessment score', { Metric: 'Average assessment score', 'Current period': '79%', 'Previous period': '75%' }, 'Published'],
] as const

await prisma.adminRecord.deleteMany()
await prisma.adminRecord.createMany({ data: adminRecords.map(([section, title, data, status]) => ({ section, title, data, status })) })
await prisma.$disconnect()
