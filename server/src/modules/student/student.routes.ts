import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()

const supportedMaterialExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'] as const
const materialMimeTypes: Record<(typeof supportedMaterialExtensions)[number], string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

type MaterialData = {
  teacherId?: string
  className?: string
  subjectName?: string
  description?: string
  fileName?: string
  fileExtension?: string
  fileData?: string
  assignmentScope?: 'Whole Class' | 'Specific Students'
  studentIds?: string[]
}

type AssessmentQuestion = {
  type?: 'single' | 'multiple' | 'true-false' | 'fill-blank'
  prompt?: unknown
  options?: unknown
  correctAnswer?: unknown
  points?: unknown
}

type AssessmentSubmission = {
  studentId?: unknown
  answers?: (string | string[])[]
  score?: unknown
  submittedAt?: unknown
}

type AssessmentData = {
  subjectName?: unknown
  questions?: AssessmentQuestion[]
  submissions?: AssessmentSubmission[]
  drafts?: { studentId?: unknown; answers?: (string | string[])[]; updatedAt?: unknown }[]
}

type StudentIdentity = { id: string; account?: { id: string } | null }
const submissionBelongsToStudent = (studentId: unknown, student: StudentIdentity) => studentId === student.id || studentId === student.account?.id

const materialFileExtension = (fileName: string) => fileName.trim().split('.').pop()?.toLowerCase() || ''
const classNamesForStudent = (student: { gradeLevel: string; classSection: string }) => [student.classSection, `${student.gradeLevel} ${student.classSection}`]
const finishExpiredAssessmentAssignments = () => prisma.assessmentAssignment.updateMany({ where: { endsAt: { lte: new Date() }, status: { notIn: ['Completed', 'Finished'] } }, data: { status: 'Finished' } })

const getAuthenticatedStudent = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { student: { select: { id: true, gradeLevel: true, classSection: true, account: { select: { id: true } } } } },
  })
  return user?.student || null
}

const visibleMaterialsForStudent = async (student: { id: string; gradeLevel: string; classSection: string }, materialId?: string) => {
  const classNames = classNamesForStudent(student)
  const idFilter = materialId ? Prisma.sql`AND lm.id = ${materialId}` : Prisma.empty
  return prisma.$queryRaw<Array<{ id: string; title: string; data: unknown; createdAt: Date }>>(Prisma.sql`
    SELECT lm.id, lm.title, lm.data, lm."createdAt"
    FROM learning_materials lm
    WHERE lm.status = 'Published'
      ${idFilter}
      AND LOWER(COALESCE(lm.data->>'className', '')) IN (LOWER(${classNames[0]}), LOWER(${classNames[1]}))
      AND (
        LOWER(COALESCE(lm.data->>'assignmentScope', '')) = LOWER('Whole Class')
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(lm.data->'studentIds', '[]'::jsonb)) AS assigned(student_id)
          WHERE assigned.student_id = ${student.id}
        )
      )
    ORDER BY lm."createdAt" DESC
  `)
}

router.use(requireAuth, requireRole('STUDENT'))

const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(8).max(200) }).superRefine(({ currentPassword, newPassword }, context) => {
  if (currentPassword === newPassword) context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Your new password must be different from your current password.' })
})

router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { passwordHash: true } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' })
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: res.locals.auth.sub }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } })
    return res.json({ message: 'Password updated successfully.' })
  } catch (error) {
    return next(error)
  }
})

router.get('/profile', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: res.locals.auth.sub },
      select: {
        name: true,
        username: true,
        email: true,
        status: true,
        lastLoginAt: true,
        student: {
          select: {
            fullName: true,
            dateOfBirth: true,
            gender: true,
            admissionNumber: true,
            photoName: true,
            academicYear: true,
            gradeLevel: true,
            classSection: true,
            enrollmentDate: true,
            address: true,
            status: true,
            guardianLinks: { select: { relationshipType: true, guardian: { select: { name: true, email: true, phone: true, address: true } } } },
          },
        },
      },
    })
    const student = user?.student
    if (!user || !student) return res.status(404).json({ message: 'Student profile not found.' })
    const { student: _student, ...profileUser } = user
    return res.json({ profile: { user: profileUser, student: { ...student, dateOfBirth: student.dateOfBirth.toISOString(), enrollmentDate: student.enrollmentDate.toISOString() }, guardians: student.guardianLinks.map(({ relationshipType, guardian }) => ({ ...guardian, relationshipType })) } })
  } catch (error) {
    return next(error)
  }
})

router.get('/materials', async (_req, res, next) => {
  try {
    const student = await getAuthenticatedStudent(res.locals.auth.sub)
    if (!student) return res.status(404).json({ message: 'Student record not found.' })

    const materials = await visibleMaterialsForStudent(student)
    const teacherIds = [...new Set(materials.map((material) => (material.data as MaterialData).teacherId).filter((id): id is string => Boolean(id)))]
    const teachers = await prisma.user.findMany({ where: { id: { in: teacherIds } }, select: { id: true, name: true } })
    const teacherNames = new Map(teachers.map((teacher) => [teacher.id, teacher.name]))

    return res.json({ materials: materials.map((material) => {
      const data = material.data as MaterialData
      return {
        id: material.id,
        title: material.title,
        subjectName: data.subjectName || null,
        teacherName: data.teacherId ? teacherNames.get(data.teacherId) || null : null,
        fileName: data.fileName || null,
        fileExtension: data.fileExtension || (data.fileName ? materialFileExtension(data.fileName) : null),
        uploadedAt: material.createdAt.toISOString(),
        description: data.description || null,
      }
    }) })
  } catch (error) {
    return next(error)
  }
})

router.get('/materials/:id/file', async (req, res, next) => {
  try {
    const materialId = z.string().min(1).parse(req.params.id)
    const student = await getAuthenticatedStudent(res.locals.auth.sub)
    if (!student) return res.status(404).json({ message: 'Student record not found.' })

    const [material] = await visibleMaterialsForStudent(student, materialId)
    const data = material?.data as MaterialData | undefined
    if (!material || !data || typeof data.fileName !== 'string' || typeof data.fileData !== 'string') return res.status(404).json({ message: 'Material not found.' })

    const fileExtension = materialFileExtension(data.fileName) as (typeof supportedMaterialExtensions)[number]
    if (!supportedMaterialExtensions.includes(fileExtension)) return res.status(404).json({ message: 'Material file not found.' })
    const base64 = data.fileData.startsWith('data:') ? data.fileData.split(',')[1] : null
    if (!base64) return res.status(404).json({ message: 'Material file not found.' })

    return res.type(materialMimeTypes[fileExtension]).setHeader('Content-Disposition', `${fileExtension === 'pdf' ? 'inline' : 'attachment'}; filename="${encodeURIComponent(data.fileName)}"`).send(Buffer.from(base64, 'base64'))
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments', async (_req, res, next) => {
  try {
    await finishExpiredAssessmentAssignments()
    const student = await getAuthenticatedStudent(res.locals.auth.sub)
    if (!student) return res.status(404).json({ message: 'Student record not found.' })

    const classNames = classNamesForStudent(student)
    const classFilter = { OR: classNames.map((className) => ({ className: { equals: className, mode: 'insensitive' as const } })) }
    const assignments = await prisma.assessmentAssignment.findMany({
      where: { status: { not: 'Completed' }, ...classFilter },
      orderBy: { dueDate: 'asc' },
      select: { id: true, dueDate: true, startsAt: true, timeLimitMinutes: true, endsAt: true, status: true, quiz: { select: { id: true, title: true, assessmentType: true, status: true, data: true } } },
    })
    const quizzes = await prisma.quiz.findMany({ where: { status: 'Published' }, select: { id: true, title: true, assessmentType: true, data: true } })

    const assessments = assignments.filter(({ quiz }) => quiz.status === 'Published').map(({ quiz, ...assignment }) => {
      const data = quiz.data as AssessmentData
      const submitted = (data.submissions || []).some((submission) => submissionBelongsToStudent(submission.studentId, student))
      return {
        id: assignment.id,
        assessmentId: quiz.id,
        title: quiz.title,
        assessmentType: quiz.assessmentType,
        subjectName: typeof data.subjectName === 'string' ? data.subjectName : null,
        dueDate: assignment.dueDate.toISOString(),
        startsAt: assignment.startsAt.toISOString(),
        timeLimitMinutes: assignment.timeLimitMinutes,
        endsAt: assignment.endsAt.toISOString(),
        status: submitted ? 'Submitted' : assignment.status,
        questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
      }
    })

    const results = quizzes.flatMap((quiz) => {
      const data = quiz.data as AssessmentData
      const totalPoints = Array.isArray(data.questions) ? data.questions.reduce((total, question) => total + (typeof question.points === 'number' ? question.points : 0), 0) : 0
      return (data.submissions || [])
        .filter((submission) => submissionBelongsToStudent(submission.studentId, student))
        .map((submission) => ({
          id: quiz.id,
          title: quiz.title,
          assessmentType: quiz.assessmentType,
          subjectName: typeof data.subjectName === 'string' ? data.subjectName : null,
          score: typeof submission.score === 'number' ? submission.score : null,
          totalPoints,
          status: 'Auto-Graded',
          submittedAt: typeof submission.submittedAt === 'string' ? submission.submittedAt : null,
          questions: (data.questions || []).map((question, questionIndex) => {
            const options = Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === 'string') : []
            const displayAnswer = (answer: unknown): string => {
              if (Array.isArray(answer)) return answer.length ? answer.map((value) => displayAnswer(value)).filter((value) => value !== 'Not answered').join(', ') || 'Not answered' : 'Not answered'
              if (typeof answer !== 'string' || !answer.trim()) return 'Not answered'
              const optionIndex = Number(answer)
              return Number.isInteger(optionIndex) && String(optionIndex) === answer && options[optionIndex] !== undefined ? options[optionIndex] : answer
            }
            return {
              prompt: typeof question.prompt === 'string' ? question.prompt : '',
              studentAnswer: displayAnswer(submission.answers?.[questionIndex]),
              correctAnswer: displayAnswer(question.correctAnswer),
            }
          }),
        }))
    }).sort((left, right) => (right.submittedAt || '').localeCompare(left.submittedAt || ''))

    return res.json({ assessments, results })
  } catch (error) {
    return next(error)
  }
})

router.get('/assessments/:assignmentId', async (req, res, next) => {
  try {
    await finishExpiredAssessmentAssignments()
    const assignmentId = z.string().min(1).parse(req.params.assignmentId)
    const student = await getAuthenticatedStudent(res.locals.auth.sub)
    if (!student) return res.status(404).json({ message: 'Student record not found.' })

    const classNames = classNamesForStudent(student)
    const assignment = await prisma.assessmentAssignment.findFirst({
      where: {
        id: assignmentId,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
        status: { notIn: ['Completed', 'Finished'] },
        OR: classNames.map((className) => ({ className: { equals: className, mode: 'insensitive' } })),
      },
      select: { id: true, dueDate: true, startsAt: true, timeLimitMinutes: true, endsAt: true, quiz: { select: { id: true, title: true, assessmentType: true, data: true } } },
    })
    if (!assignment) return res.status(404).json({ message: 'Assessment not found.' })

    const data = assignment.quiz.data as AssessmentData
    if ((data.submissions || []).some((submission) => submissionBelongsToStudent(submission.studentId, student))) return res.status(409).json({ message: 'This assessment has already been submitted.' })
    const questions = Array.isArray(data.questions) ? data.questions.map((question) => ({
      type: question.type,
      prompt: typeof question.prompt === 'string' ? question.prompt : '',
      options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === 'string') : [],
    })) : []

    return res.json({ assessment: {
      id: assignment.quiz.id,
      assignmentId: assignment.id,
      title: assignment.quiz.title,
      assessmentType: assignment.quiz.assessmentType,
      subjectName: typeof data.subjectName === 'string' ? data.subjectName : null,
      dueDate: assignment.dueDate.toISOString(),
      startsAt: assignment.startsAt.toISOString(),
      timeLimitMinutes: assignment.timeLimitMinutes,
      endsAt: assignment.endsAt.toISOString(),
      questions,
      draftAnswers: (Array.isArray(data.drafts) ? data.drafts.find((draft) => submissionBelongsToStudent(draft.studentId, student))?.answers : undefined) || [],
    } })
  } catch (error) {
    return next(error)
  }
})

router.get('/dashboard', async (_req, res, next) => {
  try {
    await finishExpiredAssessmentAssignments()
    const user = await prisma.user.findUnique({
      where: { id: res.locals.auth.sub },
      select: { student: { select: { id: true, fullName: true, photoName: true, academicYear: true, gradeLevel: true, classSection: true, account: { select: { id: true } } } } },
    })
    const student = user?.student

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
        where: { dueDate: { gte: now }, endsAt: { gte: now }, status: { notIn: ['Completed', 'Finished'] }, ...classFilter },
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
        .filter((submission) => submissionBelongsToStudent(submission.studentId, student))
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
