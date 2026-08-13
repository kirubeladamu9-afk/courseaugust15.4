import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()
const submissionSchema = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])), automatic: z.boolean().optional().default(false) })
const draftSchema = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])) })
type StoredQuestion = { type: 'single' | 'multiple' | 'true-false' | 'fill-blank'; correctAnswer: string | string[]; points: number }
type AssessmentData = { questions?: StoredQuestion[]; drafts?: { studentId: string; answers: (string | string[])[]; updatedAt: string }[]; submissions?: { studentId: string; answers: (string | string[])[]; score: number; submittedAt: string }[] }

const normalizeText = (value: string) => value.trim().toLowerCase()
const sameSet = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index])
export const finishExpiredAssessmentAssignments = async () => {
  const expiredAssignments = await prisma.assessmentAssignment.findMany({
    where: { endsAt: { lte: new Date() }, status: { notIn: ['Completed', 'Finished'] } },
    select: { id: true, className: true, quiz: { select: { id: true, data: true } } },
  })

  for (const assignment of expiredAssignments) {
    const data = assignment.quiz.data as AssessmentData
    const students = (await prisma.student.findMany({ select: { fullName: true, gradeLevel: true, classSection: true } })).filter((student) =>
      student.classSection.toLowerCase() === assignment.className.toLowerCase() || `${student.gradeLevel} ${student.classSection}`.toLowerCase() === assignment.className.toLowerCase(),
    )
    const studentNames = students.map((student) => student.fullName)
    const users = studentNames.length ? await prisma.user.findMany({ where: { role: 'STUDENT', name: { in: studentNames, mode: 'insensitive' } }, select: { id: true } }) : []
    const submittedStudentIds = new Set((data.submissions || []).map((submission) => submission.studentId))
    const unanswered = (data.questions || []).map((question) => question.type === 'multiple' ? [] : '')
    const submissions = [...(data.submissions || []), ...users.filter((user) => !submittedStudentIds.has(user.id)).map((user) => ({ studentId: user.id, answers: unanswered, score: 0, submittedAt: new Date().toISOString() }))]

    await prisma.$transaction([
      prisma.quiz.update({ where: { id: assignment.quiz.id }, data: { data: { ...data, drafts: (data.drafts || []).filter((draft) => !users.some((user) => user.id === draft.studentId)), submissions } } }),
      prisma.assessmentAssignment.update({ where: { id: assignment.id }, data: { status: 'Finished' } }),
    ])
  }
}

const studentCanSubmitAssessment = async (userId: string, assessmentId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  const student = user ? await prisma.student.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { gradeLevel: true, classSection: true } }) : null
  if (!student) return false
  const classNames = [student.classSection, `${student.gradeLevel} ${student.classSection}`]
  return Boolean(await prisma.assessmentAssignment.findFirst({
    where: {
      quizId: assessmentId,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
      status: { notIn: ['Completed', 'Finished'] },
      OR: classNames.map((className) => ({ className: { equals: className, mode: 'insensitive' } })),
    },
    select: { id: true },
  }))
}

router.post('/:id/draft', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const { answers } = draftSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment || !(await studentCanSubmitAssessment(res.locals.auth.sub, assessmentId))) return res.status(404).json({ message: 'Assessment not found.' })
    const data = assessment.data as AssessmentData
    if ((data.submissions || []).some((submission) => submission.studentId === res.locals.auth.sub)) return res.status(409).json({ message: 'This assessment has already been submitted.' })
    await prisma.quiz.update({ where: { id: assessment.id }, data: { data: { ...data, drafts: [...(data.drafts || []).filter((draft) => draft.studentId !== res.locals.auth.sub), { studentId: res.locals.auth.sub, answers, updatedAt: new Date().toISOString() }] } } })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/submissions', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const { answers, automatic } = submissionSchema.parse(req.body)
    await finishExpiredAssessmentAssignments()
    const assessmentId = z.string().min(1).parse(req.params.id)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' })
    const data = assessment.data as AssessmentData
    const questions = data.questions || []
    const totalPoints = questions.reduce((total, question) => total + question.points, 0)
    const existingSubmission = (data.submissions || []).find((submission) => submission.studentId === res.locals.auth.sub)
    if (automatic) {
      if (!existingSubmission) return res.status(404).json({ message: 'Assessment not found.' })
      return res.status(201).json({ score: existingSubmission.score, totalPoints, status: 'Auto-Graded' })
    }
    if (!(await studentCanSubmitAssessment(res.locals.auth.sub, assessmentId))) return res.status(404).json({ message: 'Assessment not found.' })
    if (existingSubmission) return res.status(409).json({ message: 'This assessment has already been submitted.' })
    if (!automatic && answers.length !== questions.length) return res.status(400).json({ message: 'An answer is required for each question.' })

    let score = 0
    questions.forEach((question, index) => {
      const answer = answers[index]
      const correct = question.correctAnswer
      const isCorrect = question.type === 'fill-blank'
        ? typeof answer === 'string' && typeof correct === 'string' && normalizeText(answer) === normalizeText(correct)
        : question.type === 'multiple'
          ? Array.isArray(answer) && Array.isArray(correct) && sameSet([...answer].sort(), [...correct].sort())
          : typeof answer === 'string' && typeof correct === 'string' && answer === correct
      if (isCorrect) score += question.points
    })

    const submission = { studentId: res.locals.auth.sub, answers, score, submittedAt: new Date().toISOString() }
    await prisma.quiz.update({ where: { id: assessment.id }, data: { data: { ...data, drafts: (data.drafts || []).filter((draft) => draft.studentId !== res.locals.auth.sub), submissions: [...(data.submissions || []), submission] }, status: 'Auto-Graded' } })
    return res.status(201).json({ score, totalPoints, status: 'Auto-Graded' })
  } catch (error) {
    return next(error)
  }
})

export default router
