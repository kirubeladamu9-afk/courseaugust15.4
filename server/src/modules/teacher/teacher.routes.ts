import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()

router.use(requireAuth, requireRole('TEACHER'))

const assessmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  className: z.string().trim().min(1).max(80),
  questions: z.array(z.object({
    type: z.enum(['single', 'multiple', 'true-false', 'fill-blank']),
    prompt: z.string().trim().min(1).max(1000),
    options: z.array(z.string().max(300)).max(20),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    points: z.number().int().positive().max(100),
  })).min(1).max(100),
})

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, gradeLevel: true, status: true } })
    return res.json({ students })
  } catch (error) {
    return next(error)
  }
})

router.get('/assigned-grades', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { name: true } })
    const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { assignedClasses: true } }) : null
    const assignedClasses = teacher?.assignedClasses?.split(',').map((value) => value.trim()).filter(Boolean) || []
    const classSections = assignedClasses.length ? await prisma.classSection.findMany({ where: { name: { in: assignedClasses } }, select: { gradeLevel: { select: { name: true } } } }) : []
    const grades = [...new Set(classSections.map(({ gradeLevel }) => gradeLevel?.name).filter((name): name is string => Boolean(name)))]
    return res.json({ grades })
  } catch (error) {
    return next(error)
  }
})

router.post('/assessments', async (req, res, next) => {
  try {
    const input = assessmentSchema.parse(req.body)
    const assessment = await prisma.quiz.create({ data: { title: input.title, data: { className: input.className, questions: input.questions }, status: 'Draft' } })
    return res.status(201).json({ assessment: { id: assessment.id, title: assessment.title, status: assessment.status } })
  } catch (error) {
    return next(error)
  }
})

export default router
