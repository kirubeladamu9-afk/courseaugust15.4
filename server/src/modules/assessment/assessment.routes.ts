import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()
const submissionSchema = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])), automatic: z.boolean().optional().default(false) })
const draftSchema = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])) })
type StoredQuestion = { type: 'single' | 'multiple' | 'true-false' | 'fill-blank'; options?: string[]; correctAnswer: string | string[]; points: number }
type AssessmentData = { questions?: StoredQuestion[]; drafts?: { studentId: string; answers: (string | string[])[]; updatedAt: string }[]; submissions?: { studentId: string; answers: (string | string[])[]; score: number; submittedAt: string }[] }
type StudentIdentity = { id: string; account?: { id: string } | null }
const submissionBelongsToStudent = (studentId: unknown, student: StudentIdentity) => studentId === student.id || studentId === student.account?.id

const normalizeText = (value: string) => value.trim().toLowerCase()
const normalizeChoice = (question: StoredQuestion, value: unknown) => {
  const text = String(value ?? '').trim()
  const index = Number(text)
  return Number.isInteger(index) && String(index) === text && question.options?.[index] !== undefined ? normalizeText(question.options[index]) : normalizeText(text)
}
const sameSet = (question: StoredQuestion, left: string[], right: string[]) => {
  const normalizedLeft = left.map((value) => normalizeChoice(question, value)).sort()
  const normalizedRight = right.map((value) => normalizeChoice(question, value)).sort()
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index])
}
const gradeAssessment = (questions: StoredQuestion[], answers: (string | string[])[]) => questions.reduce((score, question, index) => {
  const answer = answers[index]
  const correct = question.correctAnswer
  const isCorrect = question.type === 'multiple'
    ? Array.isArray(answer) && Array.isArray(correct) && sameSet(question, answer, correct)
    : typeof answer === 'string' && !Array.isArray(correct) && normalizeChoice(question, answer) === normalizeChoice(question, correct)
  return isCorrect ? score + question.points : score
}, 0)
export const finishExpiredAssessmentAssignments = async () => {
  const expiredAssignments = await prisma.assessmentAssignment.findMany({
    where: { endsAt: { lte: new Date() }, status: { notIn: ['Completed', 'Finished'] } },
    select: { id: true, className: true, quiz: { select: { id: true, data: true } } },
  })

  for (const assignment of expiredAssignments) {
    const data = assignment.quiz.data as AssessmentData
    const students = (await prisma.student.findMany({ select: { id: true, gradeLevel: true, classSection: true, account: { select: { id: true } } } })).filter((student) =>
      student.classSection.toLowerCase() === assignment.className.toLowerCase() || `${student.gradeLevel} ${student.classSection}`.toLowerCase() === assignment.className.toLowerCase(),
    )
    const unanswered = (data.questions || []).map((question) => question.type === 'multiple' ? [] : '')
    const submissions = [...(data.submissions || []), ...students.filter((student) => !(data.submissions || []).some((submission) => submissionBelongsToStudent(submission.studentId, student))).map((student) => {
      const answers = data.drafts?.find((draft) => submissionBelongsToStudent(draft.studentId, student))?.answers || unanswered
      return { studentId: student.id, answers, score: gradeAssessment(data.questions || [], answers), submittedAt: new Date().toISOString() }
    })]

    await prisma.$transaction([
      prisma.quiz.update({ where: { id: assignment.quiz.id }, data: { data: { ...data, drafts: (data.drafts || []).filter((draft) => !students.some((student) => submissionBelongsToStudent(draft.studentId, student))), submissions } } }),
      prisma.assessmentAssignment.update({ where: { id: assignment.id }, data: { status: 'Finished' } }),
    ])
  }
}

const getStudentForAssessment = async (userId: string, assessmentId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { student: { select: { id: true, gradeLevel: true, classSection: true, account: { select: { id: true } } } } } })
  const student = user?.student
  if (!student) return null
  const classNames = [student.classSection, `${student.gradeLevel} ${student.classSection}`]
  const assignment = await prisma.assessmentAssignment.findFirst({
    where: {
      quizId: assessmentId,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
      status: { notIn: ['Completed', 'Finished'] },
      OR: classNames.map((className) => ({ className: { equals: className, mode: 'insensitive' } })),
    },
    select: { id: true },
  })
  return assignment ? student : null
}

router.post('/:id/draft', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const assessmentId = z.string().min(1).parse(req.params.id)
    const { answers } = draftSchema.parse(req.body)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    const student = await getStudentForAssessment(res.locals.auth.sub, assessmentId)
    if (!assessment || !student) return res.status(404).json({ message: 'Assessment not found.' })
    const data = assessment.data as AssessmentData
    if ((data.submissions || []).some((submission) => submissionBelongsToStudent(submission.studentId, student))) return res.status(409).json({ message: 'This assessment has already been submitted.' })
    await prisma.quiz.update({ where: { id: assessment.id }, data: { data: { ...data, drafts: [...(data.drafts || []).filter((draft) => !submissionBelongsToStudent(draft.studentId, student)), { studentId: student.id, answers, updatedAt: new Date().toISOString() }] } } })
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
    const student = await getStudentForAssessment(res.locals.auth.sub, assessmentId)
    const existingSubmission = student ? (data.submissions || []).find((submission) => submissionBelongsToStudent(submission.studentId, student)) : undefined
    if (automatic) {
      if (!existingSubmission) return res.status(404).json({ message: 'Assessment not found.' })
      return res.status(201).json({ score: existingSubmission.score, totalPoints, status: 'Auto-Graded' })
    }
    if (!student) return res.status(404).json({ message: 'Assessment not found.' })
    if (existingSubmission) return res.status(409).json({ message: 'This assessment has already been submitted.' })
    if (!automatic && answers.length !== questions.length) return res.status(400).json({ message: 'An answer is required for each question.' })

    const score = gradeAssessment(questions, answers)

    const submission = { studentId: student.id, answers, score, submittedAt: new Date().toISOString() }
    await prisma.quiz.update({ where: { id: assessment.id }, data: { data: { ...data, drafts: (data.drafts || []).filter((draft) => !submissionBelongsToStudent(draft.studentId, student)), submissions: [...(data.submissions || []), submission] }, status: 'Auto-Graded' } })
    return res.status(201).json({ score, totalPoints, status: 'Auto-Graded' })
  } catch (error) {
    return next(error)
  }
})

export default router
