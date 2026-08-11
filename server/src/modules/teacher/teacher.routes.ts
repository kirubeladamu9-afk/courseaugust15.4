import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()

router.use(requireAuth, requireRole('TEACHER'))

const assessmentQuestionSchema = z.object({
  type: z.enum(['single', 'multiple', 'true-false', 'fill-blank']),
  prompt: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).max(20),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  points: z.number().int().positive().max(100),
}).superRefine((question, context) => {
  if (question.type === 'fill-blank') {
    if (question.options.length || typeof question.correctAnswer !== 'string' || !question.correctAnswer.trim()) context.addIssue({ code: 'custom', message: 'Fill-in-the-blank questions require one text answer and no options.' })
    return
  }
  if (question.options.length < 2 || new Set(question.options).size !== question.options.length) context.addIssue({ code: 'custom', message: 'Choice questions require at least two unique options.' })
  if (question.type === 'true-false' && (question.options.join('|') !== 'True|False' || typeof question.correctAnswer !== 'string' || !['0', '1'].includes(question.correctAnswer))) context.addIssue({ code: 'custom', message: 'True/False questions must use True and False with one correct answer.' })
  if (question.type === 'single' && (typeof question.correctAnswer !== 'string' || !question.options.includes(question.options[Number(question.correctAnswer)]))) context.addIssue({ code: 'custom', message: 'Single-answer questions require one valid correct option.' })
  if (question.type === 'multiple' && (!Array.isArray(question.correctAnswer) || !question.correctAnswer.length || question.correctAnswer.some((answer) => !question.options[Number(answer)]))) context.addIssue({ code: 'custom', message: 'Multiple-answer questions require one or more valid correct options.' })
})

const assignmentSchema = z.object({
  className: z.string().trim().min(1).max(80),
  dueDate: z.coerce.date(),
})

const assessmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  className: z.string().trim().min(1).max(80),
  subjectName: z.string().trim().min(1).max(120),
  questions: z.array(assessmentQuestionSchema).min(1).max(100),
})

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, gradeLevel: true, status: true } })
    return res.json({ students })
  } catch (error) {
    return next(error)
  }
})

router.get('/assigned-subjects', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { name: true } })
    const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { assignedSubjects: true } }) : null
    const subjects = teacher?.assignedSubjects?.split(',').map((value) => value.trim()).filter(Boolean) || []
    return res.json({ subjects })
  } catch (error) {
    return next(error)
  }
})

router.get('/assigned-classes', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { name: true } })
    const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { assignedClasses: true } }) : null
    const classes = teacher?.assignedClasses?.split(',').map((value) => value.trim()).filter(Boolean) || []
    return res.json({ classes })
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments', async (_req, res, next) => {
  try {
    const assessments = await prisma.quiz.findMany({ orderBy: { createdAt: 'desc' } })
    const records = assessments
      .filter((assessment) => (assessment.data as { teacherId?: string }).teacherId === res.locals.auth.sub)
      .map((assessment) => {
        const data = assessment.data as { className?: string; questions?: unknown[] }
        return { id: assessment.id, title: assessment.title, className: data.className || '—', questionCount: data.questions?.length || 0, status: assessment.status }
      })
    return res.json({ assessments: records })
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments/assignments', async (_req, res, next) => {
  try {
    const assignments = await prisma.assessmentAssignment.findMany({ where: { teacherId: res.locals.auth.sub }, orderBy: { createdAt: 'desc' }, include: { quiz: { select: { title: true } } } })
    const records = assignments.map((assignment) => ({ id: assignment.id, assessment: assignment.quiz.title, className: assignment.className, dueDate: assignment.dueDate.toISOString(), status: assignment.status }))
    return res.json({ assignments: records })
  } catch (error) {
    return next(error)
  }
})

router.post('/assessments/:id/assign', async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const input = assignmentSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    const assignment = await prisma.assessmentAssignment.create({ data: { quizId: assessment.id, teacherId: res.locals.auth.sub, className: input.className, dueDate: input.dueDate } })
    return res.status(201).json({ assignment: { id: assignment.id, className: assignment.className, dueDate: assignment.dueDate.toISOString(), status: assignment.status } })
  } catch (error) {
    return next(error)
  }
})

router.post('/assessments', async (req, res, next) => {
  try {
    const input = assessmentSchema.parse(req.body)
    const assessment = await prisma.quiz.create({ data: { title: input.title, data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, questions: input.questions }, status: 'Draft' } })
    return res.status(201).json({ assessment: { id: assessment.id, title: assessment.title, status: assessment.status } })
  } catch (error) {
    return next(error)
  }
})

export default router
