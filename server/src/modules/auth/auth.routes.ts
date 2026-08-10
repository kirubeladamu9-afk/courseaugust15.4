import { Router, type RequestHandler } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'

const router = Router()
const sessionCookie = 'coursespace_session'
const maxFailedAttempts = 5
const lockoutDurationMs = 15 * 60 * 1000
const credentialsSchema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1), remember: z.boolean().optional().default(false) })

const createSessionToken = (user: { id: string; role: string }, remember: boolean) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: remember ? '30d' : '8h' })

const setSessionCookie: RequestHandler = (req, res, next) => {
  res.cookie(sessionCookie, (res.locals.sessionToken as string), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: res.locals.remember ? 30 * 24 * 60 * 60 * 1000 : undefined,
  })
  next()
}

router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password, remember } = credentialsSchema.parse(req.body)
    const normalizedIdentifier = identifier.toLowerCase()
    const user = await prisma.user.findFirst({ where: { OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }] } })

    if (!user) return res.status(401).json({ message: 'Invalid username/email or password.' })
    if (user.lockedUntil && user.lockedUntil > new Date()) return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' })
    if (user.status !== 'ACTIVE') return res.status(403).json({ message: `This account is ${user.status.toLowerCase()}. Please contact your system administrator.` })

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatches) {
      const failedAttempts = user.failedLoginAttempts + 1
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: failedAttempts, lockedUntil: failedAttempts >= maxFailedAttempts ? new Date(Date.now() + lockoutDurationMs) : null } })
      return res.status(failedAttempts >= maxFailedAttempts ? 429 : 401).json({ message: failedAttempts >= maxFailedAttempts ? 'Too many failed attempts. Please try again later.' : 'Invalid username/email or password.' })
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } })
    res.locals.sessionToken = createSessionToken({ id: user.id, role: user.role }, remember)
    res.locals.remember = remember
    return setSessionCookie(req, res, () => res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role.toLowerCase() } }))
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.status(204).send()
})

router.get('/me', async (req, res) => {
  const token = req.cookies[sessionCookie]
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status !== 'ACTIVE') return res.status(401).json({ message: 'Authentication required.' })
    return res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role.toLowerCase() } })
  } catch {
    return res.status(401).json({ message: 'Authentication required.' })
  }
})

export default router
