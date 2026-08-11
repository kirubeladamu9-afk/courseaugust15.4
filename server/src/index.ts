import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import adminRoutes from './modules/admin/admin.routes'
import teacherRoutes from './modules/teacher/teacher.routes'
import assessmentRoutes from './modules/assessment/assessment.routes'
import { env } from './config/env'
import { prisma } from './config/prisma'

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.disable('x-powered-by')

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/assessments', assessmentRoutes)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error && error.name === 'ZodError') return res.status(400).json({ message: 'Invalid request.' })
  console.error(error)
  return res.status(500).json({ message: 'Internal server error.' })
})

const startServer = async () => {
  await prisma.$executeRawUnsafe(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "assessmentType" TEXT NOT NULL DEFAULT 'Quiz'`)
  return app.listen(env.PORT, () => {
    console.log(`API server listening on port ${env.PORT}`)
  })
}

const server = await startServer()

const shutdown = async () => {
  server.close()
  await prisma.$disconnect()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
