import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import express from 'express'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set.')
}

const sql = postgres(databaseUrl, { max: 10, ssl: 'require' })
const scrypt = promisify(scryptCallback)
const app = express()
const port = Number(process.env.PORT ?? 3001)

const seedCourses = [
  ['Android Development from Zeo to Hero', '/images/courses/a9e7b27a0c5e986a22416d79e2e9dba9.jpg', 5, 8, 25, 'Beginner'],
  ['UI/UX Complete Guide', '/images/courses/alvaro-reyes-qWwpHwip31M-unsplash.jpg', 5, 15, 20, 'Intermediate'],
  ['Mastering Data Modeling Fundamentals', '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg', 4, 7, 30, 'Beginner'],
  ['The Complete Guide Docker and Kubernetes', '/images/courses/true-agency-o4UhdLv5jbQ-unsplash.jpg', 4, 12, 30, 'Intermediate'],
  ['Modern React with MUI & Redux', '/images/courses/stillness-inmotion-Jh6aQX-25Uo-unsplash.jpg', 4, 32, 35, 'Intermediate'],
  ['Ethical Hacking Bootcamp Zero to Mastery', '/images/courses/stillness-inmotion-YSCCnRGrD-4-unsplash.jpg', 5, 14, 35, 'Beginner'],
  ['Adobe Lightroom For Beginners: Complete Photo Editing', '/images/courses/grovemade-RvPDe41lYBA-unsplash.jpg', 4, 6, 25, 'Beginner'],
]

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(hash).toString('hex')}`
}

const verifyPassword = async (password, storedHash) => {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const derivedHash = Buffer.from(await scrypt(password, salt, 64))
  const savedHash = Buffer.from(hash, 'hex')
  return derivedHash.length === savedHash.length && timingSafeEqual(derivedHash, savedHash)
}

const isValidCredentials = (email, password) => (
  typeof email === 'string' &&
  typeof password === 'string' &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  password.length >= 8 &&
  password.length <= 128
)

const initializeDatabase = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      cover TEXT NOT NULL,
      rating NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
      rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  for (const [title, cover, rating, ratingCount, price, category] of seedCourses) {
    await sql`
      INSERT INTO courses ${sql({ title, cover, rating, rating_count: ratingCount, price, category })}
      ON CONFLICT (title) DO NOTHING
    `
  }
}

app.use(express.json({ limit: '16kb' }))

app.get('/api/health', async (_request, response) => {
  await sql`SELECT 1`
  response.json({ status: 'ok' })
})

app.get('/api/courses', async (_request, response) => {
  const courses = await sql`
    SELECT
      id,
      title,
      cover,
      rating::FLOAT AS rating,
      rating_count AS "ratingCount",
      price::FLOAT AS price,
      category
    FROM courses
    ORDER BY id
  `
  response.json(courses)
})

app.post('/api/auth/sign-up', async (request, response) => {
  const { email, password } = request.body ?? {}
  if (!isValidCredentials(email, password)) {
    return response.status(400).json({ message: 'Enter a valid email and a password between 8 and 128 characters.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const passwordHash = await hashPassword(password)

  try {
    const [user] = await sql`
      INSERT INTO users ${sql({ email: normalizedEmail, password_hash: passwordHash })}
      RETURNING id, email, role, created_at AS "createdAt"
    `
    return response.status(201).json({ user })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }
    throw error
  }
})

app.post('/api/auth/sign-in', async (request, response) => {
  const { email, password } = request.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ message: 'Enter your email and password.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const [user] = await sql`
    SELECT id, email, password_hash, role, created_at AS "createdAt"
    FROM users
    WHERE email = ${normalizedEmail}
  `

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return response.status(401).json({ message: 'Invalid email or password.' })
  }

  const { password_hash: _passwordHash, ...account } = user
  return response.json({ user: account })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ message: 'Unable to complete your request.' })
})

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on port ${port}`)
    })
  })
  .catch(async (error) => {
    console.error('Unable to initialize the database.', error)
    await sql.end({ timeout: 5 })
    process.exit(1)
  })
