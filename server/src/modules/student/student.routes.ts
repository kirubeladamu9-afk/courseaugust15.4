import { Router } from 'express'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()

router.get('/dashboard', requireAuth, requireRole('STUDENT'), async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: res.locals.auth.sub },
      select: { name: true },
    })
    const student = user
      ? await prisma.student.findFirst({
          where: { fullName: { equals: user.name, mode: 'insensitive' } },
          select: { fullName: true, photoName: true, academicYear: true, gradeLevel: true, classSection: true },
        })
      : null

    if (!student) return res.status(404).json({ message: 'Student record not found.' })

    const classNames = [student.classSection, `${student.gradeLevel} ${student.classSection}`]
    const classFilter = {
      OR: classNames.map((className) => ({ className: { equals: className, mode: 'insensitive' as const } })),
    }
    const timetableFilter = {
      academicYear: student.academicYear,
      OR: classNames.map((classSection) => ({ classSection: { equals: classSection, mode: 'insensitive' as const } })),
    }
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
    const now = new Date()

    const [timetable, todayTimetable, assignments, quizzes] = await Promise.all([
      prisma.timetableEntry.findMany({
        where: timetableFilter,
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.timetableEntry.findMany({
        where: { ...timetableFilter, day: { equals: today, mode: 'insensitive' } },
        orderBy: [{ startTime: 'asc' }, { period: 'asc' }],
      }),
      prisma.assessmentAssignment.findMany({
        where: { dueDate: { gte: now }, status: { not: 'Completed' }, ...classFilter },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          dueDate: true,
          status: true,
          quiz: { select: { title: true, assessmentType: true, data: true } },
        },
      }),
      prisma.quiz.findMany({
        select: { id: true, title: true, assessmentType: true, data: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const upcomingAssessments = assignments.map(({ quiz, ...assignment }) => {
      const data = quiz.data as { subjectName?: unknown }
      return {
        id: assignment.id,
        title: quiz.title,
        assessmentType: quiz.assessmentType,
        subjectName: typeof data.subjectName === 'string' ? data.subjectName : null,
        dueDate: assignment.dueDate.toISOString(),
        status: assignment.status,
      }
    })

    const recentResults = quizzes.flatMap((quiz) => {
      const data = quiz.data as {
        questions?: Array<{ points?: unknown }>
        submissions?: Array<{ studentId?: unknown; score?: unknown; submittedAt?: unknown }>
        subjectName?: unknown
      }
      const totalPoints = Array.isArray(data.questions)
        ? data.questions.reduce((total, question) => total + (typeof question.points === 'number' ? question.points : 0), 0)
        : 0
      return (Array.isArray(data.submissions) ? data.submissions : [])
        .filter((submission) => submission.studentId === res.locals.auth.sub)
        .map((submission) => ({
          id: quiz.id,
          title: quiz.title,
          assessmentType: quiz.assessmentType,
          subjectName: typeof data.subjectName === 'string' ? data.subjectName : null,
          score: typeof submission.score === 'number' ? submission.score : null,
          totalPoints,
          submittedAt: typeof submission.submittedAt === 'string' ? submission.submittedAt : null,
        }))
    }).sort((left, right) => (right.submittedAt || '').localeCompare(left.submittedAt || ''))

    return res.json({
      student,
      todayTimetable,
      timetable,
      upcomingAssessments,
      recentResults,
      announcements: [],
    })
  } catch (error) {
    return next(error)
  }
})

export default router
