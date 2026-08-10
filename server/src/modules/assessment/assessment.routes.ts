import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()
const submissionSchema = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])) })
type StoredQuestion = { type: 'single' | 'multiple' | 'true-false' | 'fill-blank'; correctAnswer: string | string[]; points: number }
type AssessmentData = { questions?: StoredQuestion[]; submissions?: { studentId: string; answers: (string | string[])[]; score: number; submittedAt: string }[] }

const normalizeText = (value: string) => value.trim().toLowerCase()
const sameSet = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index])

router.post('/:id/submissions', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const { answers } = submissionSchema.parse(req.body)
    const assessmentId = z.string().min(1).parse(req.params.id)
    const assessment = await prisma.quiz.findUnique({ where: { id: assessmentId } })
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' })
    const data = assessment.data as AssessmentData
    const questions = data.questions || []
    if (answers.length !== questions.length) return res.status(400).json({ message: 'An answer is required for each question.' })

    let score = 0
    const totalPoints = questions.reduce((total, question) => total + question.points, 0)
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
    await prisma.quiz.update({ where: { id: assessment.id }, data: { data: { ...data, submissions: [...(data.submissions || []), submission] }, status: 'Auto-Graded' } })
    return res.status(201).json({ score, totalPoints, status: 'Auto-Graded' })
  } catch (error) {
    return next(error)
  }
})

export default router
