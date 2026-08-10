import { Router } from 'express'
import bcrypt from 'bcryptjs'
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

const toUserAccountRecord = (user: { id: string; name: string; username: string; email: string; role: UserRole; lastLoginAt: Date | null; status: AccountStatus }) => ({
  id: user.id,
  title: user.name,
  data: { User: user.name, Role: user.role.charAt(0) + user.role.slice(1).toLowerCase(), Email: user.email, 'Last login': user.lastLoginAt?.toISOString() || 'Never' },
  status: user.status.charAt(0) + user.status.slice(1).toLowerCase(),
})

const guardianSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.preprocess((value) => value === '' ? undefined : value, z.string().trim().email().max(160).optional()),
  relationshipType: z.enum(['Mother', 'Father', 'Guardian', 'Emergency Contact']).default('Guardian'),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  occupation: z.string().trim().max(120).optional(),
  nationalId: z.string().trim().max(120).optional(),
  photoName: z.string().trim().max(255).optional(),
})
const studentSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  dateOfBirth: z.coerce.date(),
  gender: z.string().trim().min(1).max(40),
  admissionNumber: z.string().trim().min(1).max(80),
  photoName: z.string().trim().max(255).optional(),
  academicYear: z.string().trim().min(1).max(20),
  gradeLevel: z.string().trim().min(1).max(40),
  classSection: z.string().trim().min(1).max(80),
  enrollmentDate: z.coerce.date(),
  address: z.string().trim().max(300).optional(),
  guardianSearch: z.string().trim().min(1).max(160),
  relationshipType: z.enum(['Mother', 'Father', 'Guardian', 'Emergency Contact']).default('Guardian'),
  status: z.enum(['Active', 'Inactive', 'Pending']),
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

router.get('/user-accounts', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, username: true, email: true, role: true, lastLoginAt: true, status: true } })
    return res.json({ records: users.map(toUserAccountRecord) })
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

const gradeLevelSchema = z.object({ grade: z.string().trim().min(1).max(80), classes: z.coerce.number().int().nonnegative(), students: z.coerce.number().int().nonnegative(), status: z.string().trim().min(1).max(40) })
const classSectionSchema = z.object({ classSection: z.string().trim().min(1).max(80), gradeLevelId: z.string().trim().min(1), students: z.coerce.number().int().nonnegative(), status: z.string().trim().min(1).max(40) })
const teacherSchema = z.object({ fullName: z.string().trim().min(1).max(160), gender: z.string().trim().min(1).max(40), photoName: z.string().trim().max(255).optional(), phoneNumber: z.string().trim().max(40).optional(), address: z.string().trim().max(300).optional(), nationalId: z.string().trim().max(120).optional(), assignedSubjects: z.string().trim().max(300).optional(), assignedClasses: z.string().trim().max(300).optional(), status: z.enum(['Active', 'Inactive', 'On Leave']) })

const toGradeLevelRecord = (record: { id: string; name: string; classes: number; students: number; status: string }) => ({ id: record.id, title: record.name, data: { Grade: record.name, Classes: String(record.classes), Students: String(record.students) }, status: record.status })
const toClassSectionRecord = (record: { id: string; name: string; students: number; status: string; gradeLevel: { name: string } | null }) => ({ id: record.id, title: record.name, data: { 'Class / Section': record.name, 'Grade Level': record.gradeLevel?.name || '—', Students: String(record.students) }, status: record.status })
const toTeacherRecord = (record: { id: string; fullName: string; gender: string; photoName: string | null; phoneNumber: string | null; address: string | null; nationalId: string | null; assignedSubjects: string | null; assignedClasses: string | null; status: string }) => ({ id: record.id, title: record.fullName, data: { 'Full Name': record.fullName, Gender: record.gender, Photo: record.photoName || '—', 'Phone Number': record.phoneNumber || '—', Address: record.address || '—', 'National ID / Passport Number': record.nationalId || '—', 'Assigned Subjects': record.assignedSubjects || '—', 'Assigned Classes': record.assignedClasses || '—' }, status: record.status })

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
