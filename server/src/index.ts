import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import adminRoutes from './modules/admin/admin.routes'
import teacherRoutes from './modules/teacher/teacher.routes'
import assessmentRoutes, { finishExpiredAssessmentAssignments } from './modules/assessment/assessment.routes'
import studentRoutes from './modules/student/student.routes'
import { env } from './config/env'
import { prisma } from './config/prisma'

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '30mb' }))
app.use(cookieParser())
app.disable('x-powered-by')

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/student', studentRoutes)

const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
  return res.sendFile(path.join(distPath, 'index.html'))
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.name === 'ZodError') return res.status(400).json({ message: 'Invalid request.' })
  console.error(error)
  return res.status(500).json({ message: 'Internal server error.' })
})

const linkLegacyStudentAccounts = async () => {
  const [accounts, students] = await Promise.all([
    prisma.user.findMany({ where: { role: 'STUDENT', studentId: null }, select: { id: true, username: true } }),
    prisma.student.findMany({ select: { id: true, fullName: true, account: { select: { id: true } } } }),
  ])
  for (const account of accounts) {
    const student = students.find((candidate) => !candidate.account && account.username.toLowerCase().endsWith(`.${candidate.id.slice(-6).toLowerCase()}`))
    if (!student) continue
    await prisma.user.update({ where: { id: account.id }, data: { studentId: student.id, name: student.fullName } })
  }
}

const initializeDatabase = async () => {
  await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_id" TEXT`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_student_id_key" ON "users"("student_id")`)
  await linkLegacyStudentAccounts()
  await prisma.$executeRawUnsafe(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "assessmentType" TEXT NOT NULL DEFAULT 'Quiz'`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "time_limit_minutes" INTEGER NOT NULL DEFAULT 30`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "assessment_assignments" ADD COLUMN IF NOT EXISTS "time_limit_minutes" INTEGER NOT NULL DEFAULT 30, ADD COLUMN IF NOT EXISTS "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 minutes')`)
  await prisma.$executeRawUnsafe(`UPDATE "assessment_assignments" SET "ends_at" = "starts_at" + ("time_limit_minutes" * INTERVAL '1 minute') WHERE "ends_at" = "starts_at" + INTERVAL '30 minutes'`)
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "timetable_entries" ("id" TEXT PRIMARY KEY, "academic_year" TEXT NOT NULL, "class_section" TEXT NOT NULL, "day" TEXT NOT NULL, "period" TEXT NOT NULL, "start_time" TEXT NOT NULL, "end_time" TEXT NOT NULL, "subject" TEXT NOT NULL, "teacher" TEXT NOT NULL, "room" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "timetable_entries_schedule_key" UNIQUE ("academic_year", "class_section", "day", "period"))`)
  await prisma.$executeRawUnsafe(`UPDATE "subjects" SET "data" = "data" - 'Chapters' WHERE "data" ? 'Chapters'`)
}

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API server listening on port ${env.PORT}`)
})

let assessmentExpiryTimer: ReturnType<typeof setInterval> | undefined
void initializeDatabase()
  .then(() => {
    assessmentExpiryTimer = setInterval(() => { void finishExpiredAssessmentAssignments().catch(console.error) }, 1000)
    void finishExpiredAssessmentAssignments().catch(console.error)
  })
  .catch(console.error)

const shutdown = async () => {
  if (assessmentExpiryTimer) clearInterval(assessmentExpiryTimer)
  server.close()
  await prisma.$disconnect()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
