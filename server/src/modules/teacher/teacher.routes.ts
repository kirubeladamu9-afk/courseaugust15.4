import { Router } from 'express'
import bcrypt from 'bcryptjs'
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
  timeLimitMinutes: z.coerce.number().int().min(1).max(1440),
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
  timeLimitMinutes: z.coerce.number().int().min(1).max(1440).default(30),
  questions: z.array(assessmentQuestionSchema).max(100),
}).superRefine((assessment, context) => {
  if (assessment.assessmentType !== 'Project' && !assessment.questions.length) context.addIssue({ code: 'custom', path: ['questions'], message: 'This assessment type requires at least one question.' })
  if (assessment.assessmentType === 'Project' && assessment.questions.length) context.addIssue({ code: 'custom', path: ['questions'], message: 'Projects do not use question builder questions.' })
})

const assessmentStatusSchema = z.object({ status: z.enum(['Draft', 'Published', 'Archived']) })
const supportedMaterialExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'] as const
const materialMimeTypes: Record<(typeof supportedMaterialExtensions)[number], string> = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
const maxMaterialFileSize = 20 * 1024 * 1024
const materialSchema = z.object({
  title: z.string().trim().min(1).max(160),
  className: z.string().trim().min(1).max(80),
  subjectName: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  fileName: z.string().trim().min(1).max(260),
  fileData: z.string().min(1).max(29 * 1024 * 1024),
  assignmentScope: z.enum(['Whole Class', 'Specific Students']),
  studentIds: z.array(z.string().min(1)).max(200).default([]),
})
type MaterialData = { teacherId: string; className: string; subjectName: string; description: string; fileName: string; fileExtension: string; fileData: string; assignmentScope: 'Whole Class' | 'Specific Students'; studentIds: string[] }

const materialFileExtension = (fileName: string) => fileName.trim().split('.').pop()?.toLowerCase() || ''
const isSupportedMaterialFile = (fileName: string) => supportedMaterialExtensions.includes(materialFileExtension(fileName) as (typeof supportedMaterialExtensions)[number])
const matchesClass = (student: { gradeLevel: string; classSection: string }, className: string) => [student.classSection, `${student.gradeLevel} ${student.classSection}`].some((candidate) => candidate.toLowerCase() === className.toLowerCase())
const finishExpiredAssessmentAssignments = () => prisma.assessmentAssignment.updateMany({ where: { endsAt: { lte: new Date() }, status: { notIn: ['Completed', 'Finished'] } }, data: { status: 'Finished' } })

const getTeacherAssignments = async (teacherId: string) => {
  const user = await prisma.user.findUnique({ where: { id: teacherId }, select: { name: true } })
  const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { assignedClasses: true, assignedSubjects: true } }) : null
  return {
    classes: teacher?.assignedClasses?.split(',').map((value) => value.trim()).filter(Boolean) || [],
    subjects: teacher?.assignedSubjects?.split(',').map((value) => value.trim()).filter(Boolean) || [],
  }
}

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

router.get('/timetable', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: res.locals.auth.sub }, select: { name: true } })
    const teacher = user ? await prisma.teacher.findFirst({ where: { fullName: { equals: user.name, mode: 'insensitive' } }, select: { fullName: true, assignedSubjects: true, assignedClasses: true } }) : null
    const entries = await prisma.timetableEntry.findMany({ orderBy: [{ academicYear: 'asc' }, { day: 'asc' }, { startTime: 'asc' }] })
    const teacherName = teacher?.fullName?.toLowerCase()
    const assignedSubjects = (teacher?.assignedSubjects || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
    const assignedClasses = (teacher?.assignedClasses || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
    const visibleEntries = entries.filter((entry) => {
      const isAssignedTeacher = Boolean(teacherName && entry.teacher.toLowerCase() === teacherName)
      const isAssignedClassSubject = assignedClasses.includes(entry.classSection.toLowerCase()) && assignedSubjects.includes(entry.subject.toLowerCase())
      return isAssignedTeacher || isAssignedClassSubject
    })
    const requestedYear = typeof req.query.academicYear === 'string' ? req.query.academicYear : visibleEntries[0]?.academicYear
    return res.json({ academicYears: [...new Set(visibleEntries.map((entry) => entry.academicYear))], entries: requestedYear ? visibleEntries.filter((entry) => entry.academicYear === requestedYear) : [] })
  } catch (error) {
    return next(error)
  }
})

router.get('/dashboard', async (_req, res, next) => {
  try {
    await finishExpiredAssessmentAssignments()
    const teacherId = res.locals.auth.sub
    const [assignedStudents, activeMaterials, pendingGrades, upcomingAssignments, teacherAssignments, teacherMaterials] = await Promise.all([
      prisma.student.count({ where: { status: 'Active' } }),
      prisma.learningMaterial.count({ where: { status: 'Published' } }),
      prisma.assessmentAssignment.count({ where: { teacherId, status: { not: 'Completed' } } }),
      prisma.assessmentAssignment.findMany({ where: { teacherId, dueDate: { gte: new Date() } }, orderBy: { dueDate: 'asc' }, take: 4, select: { id: true, className: true, dueDate: true, status: true, quiz: { select: { title: true } } } }),
      prisma.assessmentAssignment.findMany({ where: { teacherId }, select: { quiz: { select: { data: true } } } }),
      prisma.learningMaterial.findMany({ where: { status: 'Published' }, select: { data: true } }),
    ])
    const assessmentSubmissions = teacherAssignments.flatMap((assignment) => (assignment.quiz.data as { submissions?: { score?: unknown }[] }).submissions || [])
    const submittedAssessments = assessmentSubmissions.length
    const gradedAssessments = assessmentSubmissions.filter((submission) => typeof submission.score === 'number').length
    const materialCounts = teacherMaterials.reduce<Record<string, number>>((counts, material) => {
      const subject = (material.data as { teacherId?: string; subjectName?: string }).teacherId === teacherId ? (material.data as { subjectName?: string }).subjectName || 'Uncategorized' : null
      if (subject) counts[subject] = (counts[subject] || 0) + 1
      return counts
    }, {})
    return res.json({
      assignedStudents,
      activeMaterials,
      pendingGrades,
      upcomingAssignments: upcomingAssignments.map(({ quiz, ...assignment }) => ({ ...assignment, assessment: quiz.title, dueDate: assignment.dueDate.toISOString() })),
      assessmentChart: [{ label: 'Assignments', value: teacherAssignments.length }, { label: 'Submissions', value: submittedAssessments }, { label: 'Graded', value: gradedAssessments }, { label: 'Awaiting grading', value: Math.max(0, submittedAssessments - gradedAssessments) }],
      materialChart: Object.entries(materialCounts).map(([label, value]) => ({ label, value })),
    })
  } catch (error) {
    return next(error)
  }
})

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

router.get('/material-students', async (req, res, next) => {
  try {
    const className = z.string().trim().min(1).max(80).parse(req.query.className)
    const assignments = await getTeacherAssignments(res.locals.auth.sub)
    if (!assignments.classes.includes(className)) return res.status(403).json({ message: 'That class is not assigned to you.' })
    const students = await prisma.student.findMany({ where: { status: 'Active' }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, admissionNumber: true, gradeLevel: true, classSection: true } })
    return res.json({ students: students.filter((student) => matchesClass(student, className)).map(({ id, fullName, admissionNumber }) => ({ id, fullName, admissionNumber })) })
  } catch (error) {
    return next(error)
  }
})

router.get('/materials', async (_req, res, next) => {
  try {
    const materials = await prisma.learningMaterial.findMany({ orderBy: { createdAt: 'desc' } })
    const records = materials
      .filter((material) => (material.data as MaterialData).teacherId === res.locals.auth.sub)
      .map((material) => {
        const data = material.data as MaterialData
        return { id: material.id, title: material.title, className: data.className, subjectName: data.subjectName, description: data.description, fileName: data.fileName, fileExtension: data.fileExtension, assignmentScope: data.assignmentScope, studentCount: data.studentIds.length, uploadedAt: material.createdAt.toISOString(), status: material.status }
      })
    return res.json({ materials: records })
  } catch (error) {
    return next(error)
  }
})

router.get('/materials/:id/file', async (req, res, next) => {
  try {
    const materialId = z.string().min(1).parse(req.params.id)
    const material = await prisma.learningMaterial.findUnique({ where: { id: materialId } })
    const data = material?.data as MaterialData | undefined
    if (!material || !data || data.teacherId !== res.locals.auth.sub) return res.status(404).json({ message: 'Material not found.' })
    const base64 = data.fileData.split(',')[1]
    if (!base64) return res.status(404).json({ message: 'Material file not found.' })
    const fileExtension = materialFileExtension(data.fileName) as (typeof supportedMaterialExtensions)[number]
    return res.type(materialMimeTypes[fileExtension]).setHeader('Content-Disposition', `${fileExtension === 'pdf' ? 'inline' : 'attachment'}; filename="${encodeURIComponent(data.fileName)}"`).send(Buffer.from(base64, 'base64'))
  } catch (error) {
    return next(error)
  }
})

router.post('/materials', async (req, res, next) => {
  try {
    const parsed = materialSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Complete the required material details and choose a valid file.' })
    const input = parsed.data
    if (!isSupportedMaterialFile(input.fileName)) return res.status(400).json({ message: 'Only PDF, Word, PowerPoint, and Excel files are supported.' })
    const base64 = input.fileData.split(',')[1]
    if (!base64 || !input.fileData.startsWith('data:') || Buffer.byteLength(base64, 'base64') > maxMaterialFileSize) return res.status(400).json({ message: 'The selected file must be 20 MB or smaller.' })
    if (input.assignmentScope === 'Whole Class' && input.studentIds.length) return res.status(400).json({ message: 'Whole-class materials cannot include selected students.' })
    if (input.assignmentScope === 'Specific Students' && !input.studentIds.length) return res.status(400).json({ message: 'Select at least one student for a specific-student assignment.' })

    const assignments = await getTeacherAssignments(res.locals.auth.sub)
    if (!assignments.classes.includes(input.className) || !assignments.subjects.includes(input.subjectName)) return res.status(403).json({ message: 'Select a class and subject assigned to you.' })
    if (input.studentIds.length) {
      const students = await prisma.student.findMany({ where: { id: { in: input.studentIds } }, select: { id: true, gradeLevel: true, classSection: true } })
      if (students.length !== input.studentIds.length || students.some((student) => !matchesClass(student, input.className))) return res.status(400).json({ message: 'Selected students must belong to the assigned class.' })
    }

    const fileExtension = materialFileExtension(input.fileName)
    const material = await prisma.learningMaterial.create({ data: { title: input.title, status: 'Published', data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, description: input.description, fileName: input.fileName, fileExtension, fileData: input.fileData, assignmentScope: input.assignmentScope, studentIds: input.studentIds } } })
    return res.status(201).json({ material: { id: material.id, title: material.title, uploadedAt: material.createdAt.toISOString(), status: material.status } })
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
    await finishExpiredAssessmentAssignments()
    const assignments = await prisma.$queryRaw<{ id: string; assessmentId: string; assessment: string; className: string; dueDate: Date; timeLimitMinutes: number; startsAt: Date; endsAt: Date; status: string }[]>(Prisma.sql`SELECT aa.id, aa.quiz_id AS "assessmentId", q.title AS assessment, aa.class_name AS "className", aa.due_date AS "dueDate", aa.time_limit_minutes AS "timeLimitMinutes", aa.starts_at AS "startsAt", aa.ends_at AS "endsAt", aa.status FROM assessment_assignments aa JOIN quizzes q ON q.id = aa.quiz_id WHERE aa.teacher_id = ${res.locals.auth.sub} ORDER BY aa.created_at DESC`)
    const records = assignments.map((assignment) => ({ ...assignment, dueDate: assignment.dueDate.toISOString(), startsAt: assignment.startsAt.toISOString(), endsAt: assignment.endsAt.toISOString() }))
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
    const startsAt = input.dueDate
    const endsAt = new Date(startsAt.getTime() + input.timeLimitMinutes * 60_000)
    const [assignment] = await prisma.$queryRaw<{ id: string; assessmentId: string; className: string; dueDate: Date; timeLimitMinutes: number; startsAt: Date; endsAt: Date; status: string }[]>(Prisma.sql`UPDATE assessment_assignments SET quiz_id = ${input.assessmentId}, class_name = ${input.className}, due_date = ${input.dueDate}, time_limit_minutes = ${input.timeLimitMinutes}, starts_at = ${startsAt}, ends_at = ${endsAt}, status = 'Assigned', updated_at = NOW() WHERE id = ${assignmentId} AND teacher_id = ${res.locals.auth.sub} RETURNING id, quiz_id AS "assessmentId", class_name AS "className", due_date AS "dueDate", time_limit_minutes AS "timeLimitMinutes", starts_at AS "startsAt", ends_at AS "endsAt", status`)
    if (!assignment) return res.status(404).json({ message: 'Assigned assessment not found.' })
    return res.json({ assignment: { ...assignment, dueDate: assignment.dueDate.toISOString(), startsAt: assignment.startsAt.toISOString(), endsAt: assignment.endsAt.toISOString() } })
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
    return res.json({ assessment: { id: assessment.id, title: assessment.title, assessmentType: assessment.assessmentType, timeLimitMinutes: assessment.timeLimitMinutes, className: data.className || '', subjectName: data.subjectName || '', questions: data.questions || [], status: assessment.status } })
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
    const startsAt = input.dueDate
    const endsAt = new Date(startsAt.getTime() + input.timeLimitMinutes * 60_000)
    const [assignment] = await prisma.$queryRaw<{ id: string; className: string; dueDate: Date; timeLimitMinutes: number; startsAt: Date; endsAt: Date; status: string }[]>(Prisma.sql`INSERT INTO assessment_assignments (quiz_id, teacher_id, class_name, due_date, time_limit_minutes, starts_at, ends_at) VALUES (${assessment.id}, ${res.locals.auth.sub}, ${input.className}, ${input.dueDate}, ${input.timeLimitMinutes}, ${startsAt}, ${endsAt}) RETURNING id, class_name AS "className", due_date AS "dueDate", time_limit_minutes AS "timeLimitMinutes", starts_at AS "startsAt", ends_at AS "endsAt", status`)
    return res.status(201).json({ assignment: { ...assignment, dueDate: assignment.dueDate.toISOString(), startsAt: assignment.startsAt.toISOString(), endsAt: assignment.endsAt.toISOString() } })
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
    const updated = await prisma.quiz.update({ where: { id: assessmentId }, data: { title: input.title, assessmentType: input.assessmentType, timeLimitMinutes: input.timeLimitMinutes, data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, questions: input.questions } } })
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
    const assessment = await prisma.quiz.create({ data: { title: input.title, assessmentType: input.assessmentType, timeLimitMinutes: input.timeLimitMinutes, data: { teacherId: res.locals.auth.sub, className: input.className, subjectName: input.subjectName, questions: input.questions }, status: 'Draft' } })
    return res.status(201).json({ assessment: { id: assessment.id, title: assessment.title, status: assessment.status } })
  } catch (error) {
    return next(error)
  }
})

export default router
