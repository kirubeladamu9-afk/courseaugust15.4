import { Router } from 'express'
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

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { createdAt: 'asc' }, include: { guardianLinks: { include: { guardian: true } } } })
    return res.json({ students })
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
        guardianLinks: { create: { guardianId: guardian.id } },
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
