import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { requireAdmin } from '../../middleware/require-admin'

const router = Router()
const sectionSchema = z.string().regex(/^[a-z0-9-]+$/)
const recordSchema = z.object({
  title: z.string().trim().min(1).max(160),
  data: z.record(z.string(), z.string().max(300)),
  status: z.string().trim().min(1).max(40).default('Draft'),
})

router.use(requireAdmin)

router.get('/:section', async (req, res, next) => {
  try {
    const section = sectionSchema.parse(req.params.section)
    const records = await prisma.adminRecord.findMany({ where: { section }, orderBy: { createdAt: 'asc' } })
    return res.json({ records })
  } catch (error) {
    return next(error)
  }
})

router.post('/:section', async (req, res, next) => {
  try {
    const section = sectionSchema.parse(req.params.section)
    const input = recordSchema.parse(req.body)
    const record = await prisma.adminRecord.create({ data: { section, title: input.title, data: input.data, status: input.status } })
    return res.status(201).json({ record })
  } catch (error) {
    return next(error)
  }
})

export default router
