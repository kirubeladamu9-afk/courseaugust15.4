import { Router } from 'express'
import { prisma } from '../../config/prisma'
import { requireAuth, requireRole } from '../../middleware/auth'

const router = Router()

router.use(requireAuth, requireRole('TEACHER'))

router.get('/students', async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, gradeLevel: true, status: true } })
    return res.json({ students })
  } catch (error) {
    return next(error)
  }
})

export default router
