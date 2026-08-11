import { Router } from 'express'
import { Prisma } from '@prisma/client'
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

const defaultAssessmentTypes = [
  { title: 'Quiz', data: { description: 'Short, frequent, low-stakes check of understanding.', allowedQuestionTypes: ['single', 'true-false', 'fill-blank'], typical: '5–10 questions; auto-graded.' } },
  { title: 'Assignment', data: { description: 'Homework-style task completed outside class time.', allowedQuestionTypes: ['single', 'multiple', 'fill-blank'], typical: 'Mix of auto-graded work; longer time window.' } },
  { title: 'Midterm Exam', data: { description: 'Broader mid-term checkpoint covering multiple topics.', allowedQuestionTypes: ['single', 'multiple', 'true-false', 'fill-blank'], typical: '20–40 questions; timed and auto-graded.' } },
  { title: 'Final Exam', data: { description: 'Comprehensive, high-stakes end-of-term assessment.', allowedQuestionTypes: ['single', 'multiple', 'true-false', 'fill-blank'], typical: 'Largest question count; strict time window.' } },
  { title: 'Project', data: { description: 'Longer-term file or link submission graded manually.', allowedQuestionTypes: [], typical: 'Does not use the question builder.' } },
]

const assessmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  assessmentType: z.enum(['Quiz', 'Assignment', 'Midterm Exam', 'Final Exam', 'Project']).default('Quiz'),
  className: z.string().trim().min(1).max(80),
  subjectName: z.string().trim().min(1).max(120),
  questions: z.array(assessmentQuestionSchema).max(100),
}).superRefine((assessment, context) => {
  if (assessment.assessmentType !== 'Project' && !assessment.questions.length) context.addIssue({ code: 'custom', path: ['questions'], message: 'This assessment type requires at least one question.' })
  if (assessment.assessmentType === 'Project' && assessment.questions.length) context.addIssue({ code: 'custom', path: ['questions'], message: 'Projects do not use question builder questions.' })
})

const assessmentStatusSchema = z.object({ status: z.enum(['Draft', 'Published', 'Archived']) })

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, photoName: true, admissionNumber: true, gradeLevel: true, classSection: true, academicYear: true, status: true } })
    return res.json({ students })
  } catch (error) {
    return next(error)
  }
})

router.get('/profile', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { name: true } })
    const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { photoName: true, status: true } }) : null
    return res.json({ photoName: teacher?.photoName || null, status: teacher?.status || null })
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

router.get('/assessment-types', async (_req, res, next) => {
  try {
    for (const type of defaultAssessmentTypes) {
      await prisma.assessmentType.upsert({ where: { title: type.title }, update: {}, create: { ...type, status: 'Active' } })
    }
    const records = await prisma.assessmentType.findMany({ where: { status: 'Active' }, orderBy: { createdAt: 'asc' }, select: { title: true, data: true } })
    return res.json({ assessmentTypes: records.map((record) => ({ title: record.title, ...(record.data as object) })) })
  } catch {
    return res.json({ assessmentTypes: defaultAssessmentTypes.map(({ title }) => ({ title })) })
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
        return { id: assessment.id, title: assessment.title, assessmentType: assessment.assessmentType, className: data.className || '—', questionCount: data.questions?.length || 0, status: assessment.status }
      })
    return res.json({ assessments: records })
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments/assignments', async (_req, res, next) => {
  try {
    const assignments = await prisma.$queryRaw<{ id: string; assessmentId: string; assessment: string; className: string; dueDate: Date; status: string }[]>(Prisma.sql`SELECT aa.id, aa.quiz_id AS "assessmentId", q.title AS assessment, aa.class_name AS "className", aa.due_date AS "dueDate", aa.status FROM assessment_assignments aa JOIN quizzes q ON q.id = aa.quiz_id WHERE aa.teacher_id = ${res.locals.auth.sub} ORDER BY aa.created_at DESC`)
    const records = assignments.map((assignment) => ({ ...assignment, dueDate: assignment.dueDate.toISOString() }))
    return res.json({ assignments: records })
  } catch (error) {
    return next(error)
  }
})

router.patch('/assessments/assignments/:id', async (req, res, next) => {
  try {
    const assignmentId = z.string().min(1).parse(req.params.id)
    const input = assignmentSchema.extend({ assessmentId: z.string().min(1) }).parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: input.assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    const [assignment] = await prisma.$queryRaw<{ id: string; assessmentId: string; className: string; dueDate: Date; status: string }[]>(Prisma.sql`UPDATE assessment_assignments SET quiz_id = ${input.assessmentId}, class_name = ${input.className}, due_date = ${input.dueDate}, updated_at = NOW() WHERE id = ${assignmentId} AND teacher_id = ${res.locals.auth.sub} RETURNING id, quiz_id AS "assessmentId", class_name AS "className", due_date AS "dueDate", status`)
    if (!assignment) return res.status(404).json({ message: 'Assigned assessment not found.' })
    return res.json({ assignment: { ...assignment, dueDate: assignment.dueDate.toISOString() } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/assessments/assignments/:id', async (req, res, next) => {
  try {
    const assignmentId = z.string().min(1).parse(req.params.id)
    const [assignment] = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`DELETE FROM assessment_assignments WHERE id = ${assignmentId} AND teacher_id = ${res.locals.auth.sub} RETURNING id`)
    if (!assignment) return res.status(404).json({ message: 'Assigned assessment not found.' })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.patch('/assessments/:id/status', async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const { status } = assessmentStatusSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    const updated = await prisma.quiz.update({ where: { id: assessmentId }, data: { status } })
    return res.json({ assessment: { id: updated.id, status: updated.status } })
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments/:id', async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    const data = assessment.data as { className?: string; subjectName?: string; questions?: unknown[] }
    return res.json({ assessment: { id: assessment.id, title: assessment.title, assessmentType: assessment.assessmentType, className: data.className || '', subjectName: data.subjectName || '', questions: data.questions || [], status: assessment.status } })
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
    const [assignment] = await prisma.$queryRaw<{ id: string; className: string; dueDate: Date; status: string }[]>(Prisma.sql`INSERT INTO assessment_assignments (quiz_id, teacher_id, class_name, due_date) VALUES (${assessment.id}, ${res.locals.auth.sub}, ${input.className}, ${input.dueDate}) RETURNING id, class_name AS "className", due_date AS "dueDate", status`)
    return res.status(201).json({ assignment: { id: assignment.id, className: assignment.className, dueDate: assignment.dueDate.toISOString(), status: assignment.status } })
  } catch (error) {
    return next(error)
  }
})

router.patch('/assessments/:id', async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const input = assessmentSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    const updated = await prisma.quiz.update({ where: { id: assessmentId }, data: { title: input.title, assessmentType: input.assessmentType, data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, questions: input.questions } } })
    return res.json({ assessment: { id: updated.id, title: updated.title, status: updated.status } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/assessments/:id', async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || (assessment.data as { teacherId?: string }).teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Assessment not found.' })
    await prisma.quiz.delete({ where: { id: assessmentId } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.post('/assessments', async (req, res, next) => {
  try {
    const input = assessmentSchema.parse(req.body)
    const assessment = await prisma.quiz.create({ data: { title: input.title, assessmentType: input.assessmentType, data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, questions: input.questions }, status: 'Draft' } })
    return res.status(201).json({ assessment: { id: assessment.id, title: assessment.title, status: assessment.status } })
  } catch (error) {
    return next(error)
  }
})

export default router
