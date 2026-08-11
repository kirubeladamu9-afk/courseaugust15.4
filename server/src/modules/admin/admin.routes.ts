import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { AccountStatus, UserRole } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAdmin } from '../../middleware/require-admin'

const router = Router()
const sectionSchema = z.string().regex(/^[a-z0-9-]+$/)
const recordSchema = z.object({
  title: z.string().trim().min(1).max(160),
  data: z.record(z.string(), z.string().max(300)),
  status: z.string().trim().min(1).max(40).default('Draft'),
})
const userAccountSchema = z.object({
  name: z.string().trim().min(1).max(160),
  username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})
const timetableEntrySchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  period: z.string().trim().min(1).max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().trim().min(1).max(120),
  teacher: z.string().trim().min(1).max(160),
  room: z.string().trim().max(120).optional().default(''),
})
const timetableSaveSchema = z.object({
  academicYear: z.string().trim().min(1).max(20),
  classSection: z.string().trim().min(1).max(120),
  entries: z.array(timetableEntrySchema).max(100),
})
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200).regex(/[a-z]/, 'New password must include a lowercase letter.').regex(/[A-Z]/, 'New password must include an uppercase letter.').regex(/\d/, 'New password must include a number.'),
}).superRefine(({ currentPassword, newPassword }, context) => {
  if (currentPassword === newPassword) context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Your new password must be different from your current password.' })
})

type UserAccountSource = 'teacher' | 'student' | 'guardian'
type UserAccountRecord = { id: string; title: string; data: Record<string, string>; status: string; sourceType: UserAccountSource | 'user'; sourceId: string; userId?: string }

const toUserAccountRecord = (user: { id: string; name: string; username: string; email: string; role: UserRole; lastLoginAt: Date | null; status: AccountStatus }): UserAccountRecord => ({
  id: user.id,
  title: user.name,
  data: { User: user.name, Username: user.username, Role: user.role.charAt(0) + user.role.slice(1).toLowerCase(), Email: user.email, 'Last login': user.lastLoginAt?.toISOString() || 'Never' },
  status: user.status.charAt(0) + user.status.slice(1).toLowerCase(),
  sourceType: 'user',
  sourceId: user.id,
  userId: user.id,
})

const sourceRole: Record<UserAccountSource, UserRole> = { teacher: UserRole.TEACHER, student: UserRole.STUDENT, guardian: UserRole.PARENT }
const sourceName = (source: { fullName?: string; name?: string }) => source.fullName || source.name || ''
const sourceUsername = (name: string, sourceId: string) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'user'}.${sourceId.slice(-6).toLowerCase()}`
const temporaryPassword = () => randomBytes(12).toString('base64url')

const toSourceRecord = (sourceType: UserAccountSource, source: { id: string; fullName?: string; name?: string; email?: string | null }, user?: { id: string; name: string; username: string; email: string; role: UserRole; lastLoginAt: Date | null; status: AccountStatus }): UserAccountRecord => user
  ? toUserAccountRecord(user)
  : {
      id: `${sourceType}-${source.id}`,
      title: sourceName(source),
      data: { User: sourceName(source), Role: sourceRole[sourceType].charAt(0) + sourceRole[sourceType].slice(1).toLowerCase(), Email: source.email || '—', 'Last login': 'Never' },
      status: 'Active',
      sourceType,
      sourceId: source.id,
    }

const guardianSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().email().max(160).optional()),
  relationshipType: z.enum(['Mother', 'Father', 'Guardian', 'Emergency Contact']).default('Guardian'),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  occupation: z.string().trim().max(120).optional(),
  nationalId: z.string().trim().max(120).optional(),
  photoName: z.string().trim().max(5000000).optional(),
})
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.').refine((value) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}, 'Enter a valid date.').transform((value) => new Date(`${value}T00:00:00Z`))
const studentSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  dateOfBirth: dateInputSchema,
  gender: z.string().trim().min(1).max(40),
  admissionNumber: z.string().trim().min(1).max(80),
  photoName: z.string().trim().max(5000000).optional(),
  academicYear: z.string().trim().min(1).max(20),
  gradeLevel: z.string().trim().min(1).max(40),
  classSection: z.string().trim().min(1).max(80),
  enrollmentDate: dateInputSchema,
  address: z.string().trim().max(300).optional(),
  guardianSearch: z.string().trim().min(1).max(160),
  relationshipType: z.enum(['Mother', 'Father', 'Guardian', 'Emergency Contact']).default('Guardian'),
  status: z.enum(['Active', 'Inactive', 'Pending']),
}).superRefine(({ dateOfBirth, enrollmentDate }, context) => {
  const today = new Date()
  today.setUTCHours(23, 59, 59, 999)
  if (dateOfBirth > today) context.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Date of birth cannot be in the future.' })
  if (enrollmentDate < dateOfBirth) context.addIssue({ code: 'custom', path: ['enrollmentDate'], message: 'Enrollment date cannot be before the date of birth.' })
  if (enrollmentDate > today) context.addIssue({ code: 'custom', path: ['enrollmentDate'], message: 'Enrollment date cannot be in the future.' })
})

type AdminRecordModel = {
  findMany: (args: { orderBy: { createdAt: 'asc' } }) => Promise<unknown[]>
  create: (args: { data: { title: string; data: Record<string, string>; status: string } }) => Promise<unknown>
}

const models: Record<string, AdminRecordModel> = {
  'roles-permissions': prisma.rolePermission,
  'student-progress': prisma.studentProgress,
  'parent-student-link': prisma.parentStudentLink,
  'teacher-assignments': prisma.teacherAssignment,
  subjects: prisma.subject,
  'assessment-types': prisma.assessmentType,
  chapters: prisma.chapter,
  lessons: prisma.lesson,
  'learning-materials': prisma.learningMaterial,
  quizzes: prisma.quiz,
  exams: prisma.exam,
  assignments: prisma.assignment,
  'teacher-reports': prisma.teacherReport,
  'course-reports': prisma.courseReport,
  'performance-analytics': prisma.performanceAnalytic,
}

const getModel = (section: string) => {
  const model = models[section]
  if (!model) throw new Error('Unknown admin section.')
  return model
}

router.use(requireAdmin)

router.get('/timetable/options', async (_req, res, next) => {
  try {
    const [students, sections, subjects, teachers] = await Promise.all([
      prisma.student.findMany({ distinct: ['academicYear'], select: { academicYear: true }, orderBy: { academicYear: 'asc' } }),
      prisma.classSection.findMany({ where: { status: { not: 'Inactive' } }, include: { gradeLevel: { select: { name: true } } }, orderBy: { name: 'asc' } }),
      prisma.subject.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
      prisma.teacher.findMany({ where: { status: { not: 'Inactive' } }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, assignedSubjects: true, assignedClasses: true } }),
    ])
    return res.json({
      academicYears: students.map(({ academicYear }) => academicYear),
      classes: sections.map((section) => ({ id: section.id, name: section.gradeLevel && !section.name.toLowerCase().startsWith(section.gradeLevel.name.toLowerCase()) ? `${section.gradeLevel.name} - ${section.name}` : section.name })),
      subjects: subjects.map(({ id, title }) => ({ id, name: title })),
      teachers,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/timetable', async (req, res, next) => {
  try {
    const academicYear = z.string().trim().min(1).max(20).parse(req.query.academicYear)
    const classSection = z.string().trim().min(1).max(120).parse(req.query.classSection)
    const entries = await prisma.timetableEntry.findMany({ where: { academicYear, classSection }, orderBy: [{ day: 'asc' }, { startTime: 'asc' }] })
    return res.json({ entries })
  } catch (error) {
    return next(error)
  }
})

router.put('/timetable', async (req, res, next) => {
  try {
    const input = timetableSaveSchema.parse(req.body)
    await prisma.$transaction([
      prisma.timetableEntry.deleteMany({ where: { academicYear: input.academicYear, classSection: input.classSection } }),
      ...input.entries.map((entry) => prisma.timetableEntry.create({ data: { ...entry, academicYear: input.academicYear, classSection: input.classSection } })),
    ])
    const entries = await prisma.timetableEntry.findMany({ where: { academicYear: input.academicYear, classSection: input.classSection }, orderBy: [{ day: 'asc' }, { startTime: 'asc' }] })
    return res.json({ entries, message: 'Timetable saved successfully.' })
  } catch (error) {
    return next(error)
  }
})

router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: res.locals.adminUserId }, select: { passwordHash: true } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' })

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: res.locals.adminUserId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } })

    const isHttps = req.secure || req.get('x-forwarded-proto') === 'https' || req.get('origin')?.startsWith('https://')
    res.clearCookie('coursespace_session', { httpOnly: true, sameSite: isHttps ? 'none' : 'lax', secure: isHttps, path: '/' })
    return res.json({ message: 'Password updated. Please sign in with your new password.' })
  } catch (error) {
    return next(error)
  }
})

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [studentCount, teacherCount, guardianCount, lessonCount, assessmentCount, students, teachers, lessons, quizzes, studentDates, lessonDates] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.guardian.count(),
      prisma.lesson.count(),
      prisma.quiz.count(),
      prisma.student.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { fullName: true, gradeLevel: true, createdAt: true } }),
      prisma.teacher.findMany({ orderBy: { updatedAt: 'desc' }, take: 3, select: { fullName: true, updatedAt: true } }),
      prisma.lesson.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { title: true, createdAt: true } }),
      prisma.quiz.findMany({ orderBy: { updatedAt: 'desc' }, take: 3, select: { title: true, status: true, updatedAt: true } }),
      prisma.student.findMany({ select: { createdAt: true } }),
      prisma.lesson.findMany({ select: { createdAt: true } }),
    ])
    const activities = [
      ...students.map((student) => ({ type: 'student', title: 'New student registered', detail: `${student.fullName} joined ${student.gradeLevel}`, date: student.createdAt })),
      ...teachers.map((teacher) => ({ type: 'teacher', title: 'Teacher profile updated', detail: teacher.fullName, date: teacher.updatedAt })),
      ...lessons.map((lesson) => ({ type: 'lesson', title: 'Lesson created', detail: lesson.title, date: lesson.createdAt })),
    ].sort((first, second) => second.date.getTime() - first.date.getTime()).slice(0, 6)
    const now = new Date()
    const studentGrowth = Array.from({ length: 7 }, (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      return studentDates.filter(({ createdAt }) => createdAt >= start && createdAt < end).length
    })
    const learningActivity = Array.from({ length: 7 }, (_, index) => {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - 6 + index)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return lessonDates.filter(({ createdAt }) => createdAt >= start && createdAt < end).length
    })
    const notifications = quizzes.map((quiz) => ({ title: quiz.status === 'Published' ? 'Quiz published' : 'Quiz needs review', detail: `${quiz.title} · ${quiz.status}`, date: quiz.updatedAt }))
    return res.json({ stats: { students: studentCount, teachers: teacherCount, guardians: guardianCount, lessons: lessonCount, assessments: assessmentCount }, trends: { studentGrowth, learningActivity }, activities, notifications })
  } catch (error) {
    return next(error)
  }
})

router.get('/user-accounts', async (_req, res, next) => {
  try {
    const [users, teachers, students, guardians] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true } }),
      prisma.teacher.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, fullName: true } }),
      prisma.student.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, fullName: true } }),
      prisma.guardian.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true } }),
    ])
    const records = users.map(toUserAccountRecord)
    const sources: { type: UserAccountSource; records: { id: string; fullName?: string; name?: string; email?: string | null }[] }[] = [
      { type: 'teacher', records: teachers },
      { type: 'student', records: students },
      { type: 'guardian', records: guardians },
    ]
    for (const { type, records: sourceRecords } of sources) {
      for (const source of sourceRecords) {
        const role = sourceRole[type]
        const matchingUser = users.find((user) => user.role === role && (user.name.toLowerCase() === sourceName(source).toLowerCase() || (source.email && user.email.toLowerCase() === source.email.toLowerCase())))
        if (!matchingUser) records.push(toSourceRecord(type, source))
      }
    }
    return res.json({ records })
  } catch (error) {
    return next(error)
  }
})

router.patch('/user-accounts/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const status = z.enum(['ACTIVE', 'INACTIVE']).parse(req.body.status)
    const user = await prisma.user.update({
      where: { id },
      data: { status: AccountStatus[status] },
      select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true },
    })
    return res.json({ record: toUserAccountRecord(user) })
  } catch (error) {
    return next(error)
  }
})

router.post('/user-accounts/:sourceType/:sourceId/reset-password', async (req, res, next) => {
  try {
    const sourceType = z.enum(['user', 'teacher', 'student', 'guardian']).parse(req.params.sourceType)
    const sourceId = z.string().min(1).parse(req.params.sourceId)
    if (sourceType === 'user') {
      const user = await prisma.user.findUnique({ where: { id: sourceId }, select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true } })
      if (!user) return res.status(404).json({ message: 'User account not found.' })
      const password = temporaryPassword()
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } })
      return res.json({ record: toUserAccountRecord(user), temporaryPassword: password, created: false })
    }
    const source = sourceType === 'teacher'
      ? await prisma.teacher.findUnique({ where: { id: sourceId }, select: { id: true, fullName: true } })
      : sourceType === 'student'
        ? await prisma.student.findUnique({ where: { id: sourceId }, select: { id: true, fullName: true } })
        : await prisma.guardian.findUnique({ where: { id: sourceId }, select: { id: true, name: true, email: true } })
    if (!source) return res.status(404).json({ message: 'Source record not found.' })

    const role = sourceRole[sourceType]
    const name = sourceName(source)
    const email = 'email' in source && source.email ? source.email.toLowerCase() : `${sourceUsername(name, sourceId)}@coursespace.local`
    const matchingUser = await prisma.user.findFirst({ where: { role, OR: [{ name: { equals: name, mode: 'insensitive' } }, { email }] } })
    const password = temporaryPassword()
    if (matchingUser) {
      await prisma.user.update({ where: { id: matchingUser.id }, data: { passwordHash: await bcrypt.hash(password, 12) } })
      return res.json({ record: toUserAccountRecord(matchingUser), temporaryPassword: password, created: false })
    }

    const user = await prisma.user.create({
      data: { name, username: sourceUsername(name, sourceId), email, passwordHash: await bcrypt.hash(password, 12), role, status: AccountStatus.ACTIVE },
      select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true },
    })
    return res.status(201).json({ record: toUserAccountRecord(user), temporaryPassword: password, created: true })
  } catch (error) {
    return next(error)
  }
})

router.post('/user-accounts', async (req, res, next) => {
  try {
    const input = userAccountSchema.parse(req.body)
    const user = await prisma.user.create({
      data: {
        name: input.name,
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 12),
        role: UserRole[input.role],
        status: AccountStatus[input.status],
      },
      select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true },
    })
    return res.status(201).json({ record: toUserAccountRecord(user) })
  } catch (error) {
    return next(error)
  }
})

router.get('/guardians', async (_req, res, next) => {
  try {
    const guardians = await prisma.guardian.findMany({ orderBy: { createdAt: 'asc' }, include: { studentLinks: { include: { student: { select: { fullName: true } } } } } })
    return res.json({ guardians })
  } catch (error) {
    return next(error)
  }
})

router.get('/guardians/search', async (req, res, next) => {
  try {
    const query = z.string().trim().min(1).max(160).parse(req.query.q)
    const guardians = await prisma.guardian.findMany({ where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }] }, orderBy: { name: 'asc' }, take: 10 })
    return res.json({ guardians })
  } catch (error) {
    return next(error)
  }
})

router.post('/guardians', async (req, res, next) => {
  try {
    const input = guardianSchema.parse(req.body)
    const { relationshipType: _relationshipType, ...guardianData } = input
    const guardian = input.email
      ? await prisma.guardian.upsert({ where: { email: input.email }, update: guardianData, create: guardianData })
      : await prisma.guardian.create({ data: guardianData })
    return res.status(201).json({ guardian })
  } catch (error) {
    return next(error)
  }
})

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { createdAt: 'asc' }, include: { guardianLinks: { include: { guardian: true } } } })
    return res.json({ students })
  } catch (error) {
    return next(error)
  }
})

router.get('/students/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const student = await prisma.student.findUnique({ where: { id }, include: { guardianLinks: { include: { guardian: true } } } })
    if (!student) return res.status(404).json({ message: 'Student not found.' })
    return res.json({ student })
  } catch (error) {
    return next(error)
  }
})

const gradeLevelSchema = z.object({ grade: z.string().trim().min(1).max(80), classes: z.coerce.number().int().nonnegative(), students: z.coerce.number().int().nonnegative(), status: z.string().trim().min(1).max(40) })
const classSectionSchema = z.object({ classSection: z.string().trim().min(1).max(80), gradeLevelId: z.string().trim().min(1), students: z.coerce.number().int().nonnegative(), status: z.string().trim().min(1).max(40) })
const subjectUpdateSchema = recordSchema
const teacherSchema = z.object({ fullName: z.string().trim().min(1).max(160), gender: z.string().trim().min(1).max(40), photoName: z.string().trim().max(5000000).optional(), phoneNumber: z.string().trim().max(40).optional(), address: z.string().trim().max(300).optional(), nationalId: z.string().trim().max(120).optional(), assignedSubjects: z.string().trim().max(300).optional(), assignedClasses: z.string().trim().max(300).optional(), status: z.enum(['Active', 'Inactive', 'On Leave']) })
const teacherUpdateSchema = teacherSchema.partial()
const studentUpdateSchema = studentSchema.partial()
const guardianUpdateSchema = guardianSchema.partial()

const toGradeLevelRecord = (record: { id: string; name: string; classes: number; students: number; status: string }) => ({ id: record.id, title: record.name, data: { Grade: record.name, Classes: String(record.classes), Students: String(record.students) }, status: record.status })
const toClassSectionRecord = (record: { id: string; name: string; gradeLevelId: string | null; students: number; status: string; gradeLevel: { name: string } | null }) => ({ id: record.id, title: record.name, data: { 'Class / Section': record.name, 'Grade Level': record.gradeLevel?.name || '—', gradeLevelId: record.gradeLevelId || '', Students: String(record.students) }, status: record.status })
const toTeacherRecord = (record: { id: string; fullName: string; gender: string; photoName: string | null; phoneNumber: string | null; address: string | null; nationalId: string | null; assignedSubjects: string | null; assignedClasses: string | null; status: string }) => ({ id: record.id, title: record.fullName, data: { 'Full Name': record.fullName, Gender: record.gender, Photo: record.photoName || '', 'Phone Number': record.phoneNumber || '—', Address: record.address || '—', 'National ID / Passport Number': record.nationalId || '—', 'Assigned Subjects': record.assignedSubjects || '—', 'Assigned Classes': record.assignedClasses || '—' }, status: record.status })

router.get('/teachers', async (_req, res, next) => {
  try {
    const records = await prisma.teacher.findMany({ orderBy: { createdAt: 'asc' } })
    return res.json({ records: records.map(toTeacherRecord) })
  } catch (error) {
    return next(error)
  }
})

router.post('/teachers', async (req, res, next) => {
  try {
    const input = teacherSchema.parse(req.body)
    const record = await prisma.teacher.create({ data: input })
    return res.status(201).json({ record: toTeacherRecord(record) })
  } catch (error) {
    return next(error)
  }
})

router.get('/grade-levels', async (_req, res, next) => {
  try {
    const records = await prisma.gradeLevel.findMany({ orderBy: { createdAt: 'asc' } })
    return res.json({ records: records.map(toGradeLevelRecord) })
  } catch (error) {
    return next(error)
  }
})

router.post('/grade-levels', async (req, res, next) => {
  try {
    const input = gradeLevelSchema.parse(req.body)
    const record = await prisma.gradeLevel.create({ data: { name: input.grade, classes: input.classes, students: input.students, status: input.status } })
    return res.status(201).json({ record: toGradeLevelRecord(record) })
  } catch (error) {
    return next(error)
  }
})

router.get('/classes-sections', async (_req, res, next) => {
  try {
    const records = await prisma.classSection.findMany({ orderBy: { createdAt: 'asc' }, include: { gradeLevel: { select: { name: true } } } })
    return res.json({ records: records.map(toClassSectionRecord) })
  } catch (error) {
    return next(error)
  }
})

router.post('/classes-sections', async (req, res, next) => {
  try {
    const input = classSectionSchema.parse(req.body)
    const record = await prisma.classSection.create({ data: { name: input.classSection, gradeLevelId: input.gradeLevelId, students: input.students, status: input.status }, include: { gradeLevel: { select: { name: true } } } })
    return res.status(201).json({ record: toClassSectionRecord(record) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/grade-levels/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = gradeLevelSchema.parse(req.body)
    const record = await prisma.gradeLevel.update({ where: { id }, data: { name: input.grade, classes: input.classes, students: input.students, status: input.status } })
    return res.json({ record: toGradeLevelRecord(record) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/grade-levels/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.gradeLevel.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.patch('/classes-sections/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = classSectionSchema.parse(req.body)
    const record = await prisma.classSection.update({ where: { id }, data: { name: input.classSection, gradeLevelId: input.gradeLevelId, students: input.students, status: input.status }, include: { gradeLevel: { select: { name: true } } } })
    return res.json({ record: toClassSectionRecord(record) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/classes-sections/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.classSection.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.post('/students', async (req, res, next) => {
  try {
    const input = studentSchema.parse(req.body)
    const guardian = await prisma.guardian.findFirst({ where: { OR: [{ email: { contains: input.guardianSearch, mode: 'insensitive' } }, { name: { contains: input.guardianSearch, mode: 'insensitive' } }] } })
    if (!guardian) return res.status(400).json({ message: 'No existing guardian matched the search.' })

    const student = await prisma.student.create({
      data: {
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        admissionNumber: input.admissionNumber,
        photoName: input.photoName,
        academicYear: input.academicYear,
        gradeLevel: input.gradeLevel,
        classSection: input.classSection,
        enrollmentDate: input.enrollmentDate,
        address: input.address,
        status: input.status,
        guardianLinks: { create: { guardianId: guardian.id, relationshipType: input.relationshipType } },
      },
      include: { guardianLinks: { include: { guardian: true } } },
    })
    return res.status(201).json({ student })
  } catch (error) {
    return next(error)
  }
})

router.patch('/students/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const { guardianSearch, relationshipType, ...studentData } = studentUpdateSchema.parse(req.body)
    const guardian = guardianSearch ? await prisma.guardian.findFirst({ where: { OR: [{ email: { contains: guardianSearch, mode: 'insensitive' } }, { name: { contains: guardianSearch, mode: 'insensitive' } }] } }) : null
    if (guardianSearch && !guardian) return res.status(400).json({ message: 'No existing guardian matched the search.' })
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        ...(guardian ? { guardianLinks: { deleteMany: {}, create: { guardianId: guardian.id, relationshipType: relationshipType || 'Guardian' } } } : {}),
      },
      include: { guardianLinks: { include: { guardian: true } } },
    })
    return res.json({ record: { id: student.id, title: student.fullName, data: { Student: student.fullName, Grade: student.gradeLevel, Guardians: student.guardianLinks.map(({ guardian }) => guardian.name).join(', ') || '—' }, status: student.status } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/students/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.student.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/teachers/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const teacher = await prisma.teacher.findUnique({ where: { id } })
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' })
    return res.json({ teacher })
  } catch (error) {
    return next(error)
  }
})

router.patch('/teachers/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = teacherUpdateSchema.parse(req.body)
    const teacher = await prisma.teacher.update({ where: { id }, data: input })
    return res.json({ record: toTeacherRecord(teacher) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/teachers/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.teacher.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/guardians/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const guardian = await prisma.guardian.findUnique({ where: { id }, include: { studentLinks: { include: { student: true } } } })
    if (!guardian) return res.status(404).json({ message: 'Guardian not found.' })
    return res.json({ guardian })
  } catch (error) {
    return next(error)
  }
})

router.patch('/guardians/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = guardianUpdateSchema.parse(req.body)
    const guardian = await prisma.guardian.update({ where: { id }, data: input, include: { studentLinks: { include: { student: { select: { fullName: true } } } } } })
    return res.json({ record: { id: guardian.id, title: guardian.name, data: { Guardian: guardian.name, 'Linked students': guardian.studentLinks.map(({ student }) => student.fullName).join(', ') || '—', Relationship: guardian.studentLinks.map(({ relationshipType }) => relationshipType).join(', ') || '—' }, status: 'Active' } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/guardians/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.guardian.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.patch('/subjects/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = subjectUpdateSchema.parse(req.body)
    const record = await prisma.subject.update({ where: { id }, data: input })
    return res.json({ record })
  } catch (error) {
    return next(error)
  }
})

router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.subject.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/assessment-types', async (_req, res, next) => {
  try {
    const defaults = [
      { title: 'Quiz', data: { Purpose: 'Short, frequent, low-stakes check of understanding.', 'Allowed question types': 'Multiple Choice (Single), True/False, Fill in the Blank', Typical: '5–10 questions; auto-graded.' } },
      { title: 'Assignment', data: { Purpose: 'Homework-style task completed outside class time.', 'Allowed question types': 'Multiple Choice (Single/Multiple), Fill in the Blank', Typical: 'Mix of auto-graded work; longer time window.' } },
      { title: 'Midterm Exam', data: { Purpose: 'Broader mid-term checkpoint covering multiple topics.', 'Allowed question types': 'Multiple Choice, True/False, Fill in the Blank', Typical: '20–40 questions; timed and auto-graded.' } },
      { title: 'Final Exam', data: { Purpose: 'Comprehensive, high-stakes end-of-term assessment.', 'Allowed question types': 'Multiple Choice, True/False, Fill in the Blank', Typical: 'Largest question count; strict time window.' } },
      { title: 'Project', data: { Purpose: 'Longer-term file or link submission graded manually.', 'Allowed question types': 'File or link submission', Typical: 'Does not use the question builder.' } },
    ]
    for (const type of defaults) await prisma.assessmentType.upsert({ where: { title: type.title }, update: {}, create: { ...type, status: 'Active' } })
    const records = await prisma.assessmentType.findMany({ orderBy: { createdAt: 'asc' } })
    return res.json({ records })
  } catch (error) {
    return next(error)
  }
})

router.get('/all-assessments', async (_req, res, next) => {
  try {
    const quizzes = await prisma.quiz.findMany({ orderBy: { createdAt: 'desc' } })
    const teacherIds = quizzes.map((quiz) => (quiz.data as { teacherId?: string }).teacherId).filter((id): id is string => Boolean(id))
    const teachers = await prisma.user.findMany({ where: { id: { in: teacherIds } }, select: { id: true, name: true } })
    const teacherNames = new Map(teachers.map((teacher) => [teacher.id, teacher.name]))
    const records = quizzes.map((quiz) => {
      const data = quiz.data as { teacherId?: string; className?: string; questions?: unknown[] }
      return { id: quiz.id, title: quiz.title, data: { Assessment: quiz.title, 'Assessment Type': quiz.assessmentType, Teacher: data.teacherId ? teacherNames.get(data.teacherId) || '—' : '—', Class: data.className || '—' }, questions: data.questions || [], status: quiz.status }
    })
    return res.json({ records })
  } catch (error) {
    return next(error)
  }
})

const assessmentAdminUpdateSchema = z.object({ title: z.string().trim().min(1).max(160), assessmentType: z.enum(['Quiz', 'Assignment', 'Midterm Exam', 'Final Exam', 'Project']).default('Quiz'), className: z.string().trim().min(1).max(80), status: z.enum(['Draft', 'Published', 'Archived']) })

router.patch('/all-assessments/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    const input = assessmentAdminUpdateSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id } })
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' })
    const currentData = assessment.data as Record<string, unknown>
    const updated = await prisma.quiz.update({ where: { id }, data: { title: input.title, status: input.status, data: { ...currentData, className: input.className }, assessmentType: input.assessmentType } })
    const data = updated.data as { teacherId?: string; className?: string }
    const teacher = data.teacherId ? await prisma.user.findUnique({ where: { id: data.teacherId }, select: { name: true } }) : null
    return res.json({ record: { id: updated.id, title: updated.title, data: { Assessment: updated.title, 'Assessment Type': updated.assessmentType, Teacher: teacher?.name || '—', Class: data.className || '—' }, questions: (updated.data as { questions?: unknown[] }).questions || [], status: updated.status } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/all-assessments/:id', async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id)
    await prisma.quiz.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.get('/:section', async (req, res, next) => {
  try {
    const section = sectionSchema.parse(req.params.section)
    const records = await getModel(section).findMany({ orderBy: { createdAt: 'asc' } })
    return res.json({ records })
  } catch (error) {
    return next(error)
  }
})

router.post('/:section', async (req, res, next) => {
  try {
    const section = sectionSchema.parse(req.params.section)
    const input = recordSchema.parse(req.body)
    const record = await getModel(section).create({ data: input })
    return res.status(201).json({ record })
  } catch (error) {
    return next(error)
  }
})

export default router
