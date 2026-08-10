import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { env } from '../config/env'

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies.coursespace_session
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    res.locals.auth = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string }
    next()
  } catch {
    res.status(401).json({ message: 'Authentication required.' })
  }
}

export const requireRole = (...roles: string[]): RequestHandler => (req, res, next) => {
  if (!roles.includes(res.locals.auth?.role)) return res.status(403).json({ message: 'You do not have permission to access this resource.' })
  next()
}
