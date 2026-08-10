import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { env } from '../config/env'

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.cookies.coursespace_session
  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string }
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, status: true } })
    if (!user || user.status !== 'ACTIVE' || user.role !== 'ADMIN') return res.status(403).json({ message: 'Administrator access required.' })
    res.locals.adminUserId = user.id
    return next()
  } catch {
    return res.status(401).json({ message: 'Authentication required.' })
  }
}
