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
const sessionCookieName = 'coursespace-session'
const sessionDuration = 86400000

const seedCourses = [
  { title: 'Android Development from Zeo to Hero', cover: '/images/courses/a9e7b27a0c5e986a22416d79e2e9dba9.jpg', rating: 5, ratingCount: 8, price: 25, category: 'Development', level: 'Beginner', tutor: 'Leon Kennedy', students: 0, status: 'Published' },
  { title: 'UI/UX Complete Guide', cover: '/images/courses/alvaro-reyes-qWwpHwip31M-unsplash.jpg', rating: 5, ratingCount: 15, price: 20, category: 'Design', level: 'Intermediate', tutor: 'Rizki Known', students: 0, status: 'Published' },
  { title: 'Mastering Data Modeling Fundamentals', cover: '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg', rating: 4, ratingCount: 7, price: 30, category: 'Data', level: 'Beginner', tutor: 'Maya Chen', students: 128, status: 'Published' },
  { title: 'The Complete Guide to Docker and Kubernetes', cover: '/images/courses/true-agency-o4UhdLv5jbQ-unsplash.jpg', rating: 4, ratingCount: 12, price: 30, category: 'Development', level: 'Intermediate', tutor: 'Leon Kennedy', students: 96, status: 'Published' },
  { title: 'Modern React with MUI & Redux', cover: '/images/courses/stillness-inmotion-Jh6aQX-25Uo-unsplash.jpg', rating: 4, ratingCount: 32, price: 35, category: 'Development', level: 'Intermediate', tutor: 'Jhon Dwirian', students: 0, status: 'Draft' },
  { title: 'Ethical Hacking Bootcamp Zero to Mastery', cover: '/images/courses/stillness-inmotion-YSCCnRGrD-4-unsplash.jpg', rating: 5, ratingCount: 14, price: 35, category: 'Development', level: 'Beginner', tutor: 'Leon Kennedy', students: 0, status: 'Published' },
  { title: 'Adobe Lightroom For Beginners: Complete Photo Editing', cover: '/images/courses/grovemade-RvPDe41lYBA-unsplash.jpg', rating: 4, ratingCount: 6, price: 25, category: 'Design', level: 'Beginner', tutor: 'Rizki Known', students: 0, status: 'Published' },
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
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
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
      level TEXT NOT NULL DEFAULT 'Beginner',
      tutor TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Published',
      students INTEGER NOT NULL DEFAULT 0 CHECK (students >= 0),
      description TEXT NOT NULL DEFAULT '',
      long_description TEXT NOT NULL DEFAULT '',
      learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
      requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
      certificate BOOLEAN NOT NULL DEFAULT false,
      modules JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner'`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutor TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published'`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS students INTEGER NOT NULL DEFAULT 0`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS long_description TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS modules JSONB NOT NULL DEFAULT '[]'::jsonb`
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

  await sql`
    UPDATE courses
    SET title = 'The Complete Guide to Docker and Kubernetes'
    WHERE title = 'The Complete Guide Docker and Kubernetes'
      AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'The Complete Guide to Docker and Kubernetes')
  `

  for (const seedCourse of seedCourses) {
    await sql`
      UPDATE courses
      SET category = ${seedCourse.category},
          level = ${seedCourse.level},
          tutor = ${seedCourse.tutor},
          students = ${seedCourse.students},
          status = ${seedCourse.status}
      WHERE title = ${seedCourse.title}
        AND tutor = ''
        AND description = ''
        AND long_description = ''
        AND modules = '[]'::jsonb
    `
  }

  for (const seedCourse of seedCourses) {
    await sql`
      INSERT INTO courses ${sql({
        title: seedCourse.title,
        cover: seedCourse.cover,
        rating: seedCourse.rating,
        rating_count: seedCourse.ratingCount,
        price: seedCourse.price,
        category: seedCourse.category,
        level: seedCourse.level,
        tutor: seedCourse.tutor,
        students: seedCourse.students,
        status: seedCourse.status,
      })}
      ON CONFLICT (title) DO NOTHING
    `
  }
}

const courseColumns = sql.unsafe(`
  id::INTEGER AS id,
  title,
  cover,
  rating::FLOAT AS rating,
  rating_count AS "ratingCount",
  price::FLOAT AS price,
  category,
  level,
  tutor,
  status,
  students,
  description,
  long_description AS "longDescription",
  learning_outcomes AS "learningOutcomes",
  requirements,
  certificate,
  modules,
  to_char(updated_at, 'FMMonth DD, YYYY') AS "updatedAt"
`)

const parseCourseId = (value) => /^\d+$/.test(value) ? Number(value) : null

const getSessionToken = (request) => {
  const cookieToken = request.headers.cookie?.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  const bearerToken = request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1]
  return bearerToken ?? cookieToken
}

const requireAdmin = async (request, response, next) => {
  const sessionToken = getSessionToken(request)
  if (!sessionToken) return response.status(401).json({ message: 'Admin authentication is required.' })

  const [session] = await sql`
    SELECT auth_sessions.token, users.role
    FROM auth_sessions
    INNER JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token = ${sessionToken}
      AND auth_sessions.expires_at > NOW()
  `
  if (!session || session.role !== 'admin') return response.status(401).json({ message: 'Admin authentication is required.' })
  return next()
}

const parseCoursePayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const level = typeof body.level === 'string' ? body.level.trim() : ''
  const tutor = typeof body.tutor === 'string' ? body.tutor.trim() : ''
  const cover = typeof body.cover === 'string' ? body.cover.trim() : ''
  const status = body.status === 'Published' || body.status === 'Draft' ? body.status : null
  const price = Number(body.price)
  const students = Number(body.students)
  const learningOutcomes = Array.isArray(body.learningOutcomes) && body.learningOutcomes.every((value) => typeof value === 'string') ? body.learningOutcomes : null
  const requirements = Array.isArray(body.requirements) && body.requirements.every((value) => typeof value === 'string') ? body.requirements : null
  const modules = Array.isArray(body.modules) ? body.modules : null

  if (!title || !category || !level || !cover || !status || !Number.isFinite(price) || price < 0 || !Number.isInteger(students) || students < 0 || !learningOutcomes || !requirements || !modules || typeof body.description !== 'string' || typeof body.longDescription !== 'string' || typeof body.certificate !== 'boolean') {
    return null
  }

  return {
    title,
    cover,
    price,
    category,
    level,
    tutor,
    status,
    students,
    description: body.description,
    long_description: body.longDescription,
    learning_outcomes: JSON.stringify(learningOutcomes),
    requirements: JSON.stringify(requirements),
    certificate: body.certificate,
    modules: JSON.stringify(modules),
  }
}

const readCourse = async (id, publishedOnly = false) => {
  const [course] = await sql`
    SELECT ${courseColumns}
    FROM courses
    WHERE id = ${id} ${publishedOnly ? sql`AND status = 'Published'` : sql``}
  `
  return course ?? null
}

app.use(express.json({ limit: '16kb' }))

app.get('/api/health', async (_request, response) => {
  await sql`SELECT 1`
  response.json({ status: 'ok' })
})

app.get('/api/courses', async (_request, response) => {
  const courses = await sql`
    SELECT ${courseColumns}
    FROM courses
    WHERE status = 'Published'
    ORDER BY id
  `
  response.json(courses)
})

app.get('/api/courses/:id', async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = await readCourse(id, true)
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(course)
})

app.get('/api/admin/courses', requireAdmin, async (_request, response) => {
  const courses = await sql`
    SELECT ${courseColumns}
    FROM courses
    ORDER BY id
  `
  response.json(courses)
})

app.get('/api/admin/courses/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = await readCourse(id)
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(course)
})

app.post('/api/admin/courses', requireAdmin, async (request, response) => {
  const course = parseCoursePayload(request.body)
  if (!course) return response.status(400).json({ message: 'Enter all required course details.' })

  try {
    const [created] = await sql`
      INSERT INTO courses ${sql(course)}
      RETURNING id
    `
    return response.status(201).json(await readCourse(Number(created.id)))
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'A course with this title already exists.' })
    throw error
  }
})

app.put('/api/admin/courses/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = parseCoursePayload(request.body)
  if (!course) return response.status(400).json({ message: 'Enter all required course details.' })

  try {
    const [updated] = await sql`
      UPDATE courses
      SET ${sql(course)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `
    if (!updated) return response.status(404).json({ message: 'Course not found.' })
    return response.json(await readCourse(id))
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'A course with this title already exists.' })
    throw error
  }
})

app.delete('/api/admin/courses/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const [deleted] = await sql`DELETE FROM courses WHERE id = ${id} RETURNING id`
  if (!deleted) return response.status(404).json({ message: 'Course not found.' })
  return response.status(204).end()
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
  const sessionToken = randomBytes(32).toString('hex')
  await sql`
    INSERT INTO auth_sessions ${sql({ token: sessionToken, user_id: user.id, expires_at: new Date(Date.now() + sessionDuration) })}
  `
  response.setHeader('Set-Cookie', `${sessionCookieName}=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionDuration / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
  return response.json({ user: account, sessionToken })
})

app.post('/api/auth/sign-out', async (request, response) => {
  const sessionToken = getSessionToken(request)
  if (sessionToken) await sql`DELETE FROM auth_sessions WHERE token = ${sessionToken}`
  response.setHeader('Set-Cookie', `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
  return response.status(204).end()
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
