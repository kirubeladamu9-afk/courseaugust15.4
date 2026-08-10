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
