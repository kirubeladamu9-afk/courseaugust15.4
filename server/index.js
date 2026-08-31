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
const isTestChapa = process.env.CHAPA_MODE !== 'live'
const sessionCookieName = 'coursespace-session'
const sessionDuration = 86400000

const seedTutors = [
  { name: 'Maya Chen', email: 'maya@example.com', status: 'Active' },
  { name: 'Leon Kennedy', email: 'leon@example.com', status: 'Active' },
  { name: 'Jhon Dwirian', email: 'jhon@example.com', status: 'Inactive' },
  { name: 'Rizki Known', email: 'rizki@example.com', status: 'Active' },
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
    CREATE TABLE IF NOT EXISTS tutors (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active'`

  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      age_or_grade TEXT NOT NULL,
      relationship TEXT NOT NULL CHECK (relationship IN ('Parent', 'Guardian', 'Self')),
      preferred_language TEXT NOT NULL,
      emergency_phone TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
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
      level TEXT NOT NULL DEFAULT 'Beginner',
      tutor TEXT NOT NULL DEFAULT '',
      tutor_id BIGINT REFERENCES tutors(id) ON DELETE SET NULL,
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
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutor_id BIGINT REFERENCES tutors(id) ON DELETE SET NULL`
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
    CREATE TABLE IF NOT EXISTS payments (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
      student_data JSONB NOT NULL,
      amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL DEFAULT 'ETB',
      chapa_reference TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `
  await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ETB'`
  await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS chapa_reference TEXT`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_chapa_reference_idx ON payments(chapa_reference) WHERE chapa_reference IS NOT NULL`

  await sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
      payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, course_id, payment_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS classes (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      program_id TEXT NOT NULL CHECK (program_id IN ('international-online-interactive', 'summer-camp', 'ministry-exam-prep')),
      title TEXT NOT NULL,
      tutor_id BIGINT REFERENCES tutors(id) ON DELETE SET NULL,
      capacity INTEGER NOT NULL CHECK (capacity > 0),
      schedule JSONB NOT NULL DEFAULT '{"days": [], "time": "", "flexible": false}'::jsonb,
      meeting_link TEXT NOT NULL,
      course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('pending_schedule', 'open', 'full', 'closed')),
      published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL`
  await sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS class_status TEXT CHECK (class_status IN ('enrolled', 'waitlisted'))`
  await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL`

  await sql`
    CREATE TABLE IF NOT EXISTS course_progress (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      completed_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      started BOOLEAN NOT NULL DEFAULT false,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
      quiz_results JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, course_id)
    )
  `
  await sql`ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0`
  await sql`ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS quiz_results JSONB NOT NULL DEFAULT '{}'::jsonb`

  for (const seedTutor of seedTutors) {
    await sql`
      INSERT INTO tutors ${sql(seedTutor)}
      ON CONFLICT (email) DO NOTHING
    `
    await sql`
      INSERT INTO users ${sql({ name: seedTutor.name, email: seedTutor.email, password_hash: await hashPassword(randomBytes(9).toString('base64url')), role: 'tutor', status: seedTutor.status === 'Active' ? 'Active' : 'Suspended' })}
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'tutor'
    `
  }

  await sql`
    UPDATE tutors
    SET status = 'Inactive'
    WHERE status = 'Pending'
  `

  await sql`
    UPDATE courses
    SET tutor_id = tutors.id
    FROM tutors
    WHERE courses.tutor_id IS NULL
      AND LOWER(TRIM(courses.tutor)) = LOWER(tutors.name)
  `
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

const tutorColumns = sql.unsafe(`
  id::INTEGER AS id,
  name,
  email,
  phone,
  bio,
  status,
  to_char(created_at, 'FMMonth DD, YYYY') AS "createdAt"
`)

const parseCourseId = (value) => /^\d+$/.test(value) ? Number(value) : null
const parseTutorId = (value) => /^\d+$/.test(value) ? Number(value) : null

const parseTutorPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const status = body.status === undefined ? 'Active' : body.status
  const assignedCourseIds = body.assignedCourseIds === undefined ? null : body.assignedCourseIds
  const validCourseIds = Array.isArray(assignedCourseIds) && assignedCourseIds.every((id) => Number.isInteger(id) && id > 0)

  if (!name || name.length > 120 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length > 40 || bio.length > 2000 || (status !== 'Active' && status !== 'Inactive') || (assignedCourseIds !== null && !validCourseIds)) {
    return null
  }

  return { name, email, phone, bio, status, assignedCourseIds }
}

const parseTutorStatus = (body) => body && typeof body === 'object' && !Array.isArray(body) && (body.status === 'Active' || body.status === 'Inactive') ? body.status : null

const addAssignedCourses = async (tutor) => {
  const [assignedCourses, assignedClasses] = await Promise.all([
    sql`
      SELECT id::INTEGER AS id, title, category, students
      FROM courses
      WHERE tutor_id = ${tutor.id}
         OR (tutor_id IS NULL AND LOWER(TRIM(tutor)) = LOWER(${tutor.name}))
      ORDER BY id
    `,
    sql`
      SELECT id::INTEGER AS id, title
      FROM classes
      WHERE tutor_id = ${tutor.id}
      ORDER BY id
    `,
  ])
  return { ...tutor, assignedCourses, assignedCourseIds: assignedCourses.map((course) => course.id), assignedClasses }
}

const readTutor = async (id) => {
  const [tutor] = await sql`
    SELECT ${tutorColumns}
    FROM tutors
    WHERE id = ${id}
  `
  return tutor ? addAssignedCourses(tutor) : null
}

const findTutorIdByName = async (name) => {
  const [tutor] = await sql`
    SELECT id
    FROM tutors
    WHERE LOWER(TRIM(name)) = LOWER(${name})
  `
  return tutor?.id ?? null
}

const updateTutorAssignments = async (tutorId, tutorName, assignedCourseIds, previousTutorName = '') => {
  if (assignedCourseIds === null) return
  const retainedCourses = assignedCourseIds.length ? sql`AND id NOT IN ${sql(assignedCourseIds)}` : sql``
  await sql`
    UPDATE courses
    SET tutor_id = NULL, tutor = ''
    WHERE (tutor_id = ${tutorId} OR (tutor_id IS NULL AND LOWER(TRIM(tutor)) = LOWER(${previousTutorName || tutorName})))
      ${retainedCourses}
  `
  if (assignedCourseIds.length) {
    await sql`
      UPDATE courses
      SET tutor_id = ${tutorId}, tutor = ${tutorName}
      WHERE id IN ${sql(assignedCourseIds)}
    `
  }
}

const getSessionToken = (request) => {
  const cookieToken = request.headers.cookie?.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  const bearerToken = request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1]
  return bearerToken ?? cookieToken
}

const requireAuthenticated = async (request, response, next) => {
  const sessionToken = getSessionToken(request)
  if (!sessionToken) return response.status(401).json({ message: 'Authentication is required.' })

  const [session] = await sql`
    SELECT auth_sessions.user_id AS "userId", users.role
    FROM auth_sessions
    INNER JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token = ${sessionToken}
      AND auth_sessions.expires_at > NOW()
      AND users.status = 'Active'
  `
  if (!session) return response.status(401).json({ message: 'Authentication is required.' })
  request.userId = Number(session.userId)
  request.userRole = session.role
  return next()
}

const requireAdmin = async (request, response, next) => {
  await requireAuthenticated(request, response, () => {
    if (request.userRole !== 'admin') return response.status(401).json({ message: 'Admin authentication is required.' })
    return next()
  })
}

const isValidCourseCover = (cover) => cover.length <= 10 * 1024 * 1024 && (cover.startsWith('/') || /^https?:\/\//i.test(cover) || /^data:image\/(?:avif|gif|jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(cover))

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

  if (!title || !category || !level || !isValidCourseCover(cover) || !status || !Number.isFinite(price) || price < 0 || !Number.isInteger(students) || students < 0 || !learningOutcomes || !requirements || !modules || typeof body.description !== 'string' || typeof body.longDescription !== 'string' || typeof body.certificate !== 'boolean') {
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

const deserializeJson = (value) => typeof value === 'string' ? JSON.parse(value) : value

const deserializeCourse = (course) => course ? {
  ...course,
  learningOutcomes: deserializeJson(course.learningOutcomes),
  requirements: deserializeJson(course.requirements),
  modules: deserializeJson(course.modules),
} : null

const readCourse = async (id, publishedOnly = false) => {
  const [course] = await sql`
    SELECT ${courseColumns}
    FROM courses
    WHERE id = ${id} ${publishedOnly ? sql`AND status = 'Published'` : sql``}
  `
  return deserializeCourse(course)
}

const parseEnrollmentStudents = (value) => {
  if (!Array.isArray(value) || !value.length || value.length > 10) return null
  const students = value.map((student) => {
    if (!student || typeof student !== 'object' || Array.isArray(student)) return null
    const fullName = typeof student.fullName === 'string' ? student.fullName.trim() : ''
    const ageOrGrade = typeof student.ageOrGrade === 'string' ? student.ageOrGrade.trim() : ''
    const relationship = student.relationship
    const preferredLanguage = typeof student.preferredLanguage === 'string' ? student.preferredLanguage.trim() : ''
    const emergencyPhone = typeof student.emergencyPhone === 'string' ? student.emergencyPhone.trim() : ''
    const notes = typeof student.notes === 'string' ? student.notes.trim() : ''
    if (!fullName || fullName.length > 120 || !ageOrGrade || ageOrGrade.length > 80 || !['Parent', 'Guardian', 'Self'].includes(relationship) || !preferredLanguage || preferredLanguage.length > 80 || emergencyPhone.length > 50 || notes.length > 1000) return null
    return { fullName, ageOrGrade, relationship, preferredLanguage, emergencyPhone, notes }
  })
  return students.every(Boolean) ? students : null
}

const getChapaStatus = (verification) => {
  const status = String(verification?.data?.status ?? verification?.status ?? '').toLowerCase()
  if (['success', 'paid', 'completed'].includes(status)) return 'paid'
  if (['failed', 'cancelled', 'canceled', 'expired'].includes(status)) return 'failed'
  return 'pending'
}

const verifyChapaTransaction = async (reference) => {
  const secretKey = process.env.CHAPA_SECRET_KEY
  if (!secretKey) throw new Error('Chapa checkout has not been configured.')
  const response = await fetch(`https://api.chapa.global/v2/payments/${encodeURIComponent(reference)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Chapa could not verify this payment.')
  const verification = await response.json()
  return { status: getChapaStatus(verification), data: verification?.data ?? {} }
}

const updatePaymentStatus = async (reference, status, verification = {}) => sql.begin(async (transaction) => {
  const [payment] = await transaction`
    SELECT id, user_id AS "userId", course_id AS "courseId", class_id AS "classId", student_data AS "studentData", amount::FLOAT AS amount, currency, status
    FROM payments
    WHERE reference = ${reference}
    FOR UPDATE
  `
  if (!payment || payment.status === status || payment.status === 'paid') return payment?.status ?? null
  if (status === 'paid' && !isTestChapa && (Number(verification.amount) !== payment.amount || String(verification.currency).toUpperCase() !== payment.currency.toUpperCase() || verification.merchant_reference !== payment.reference)) return payment.status

  await transaction`
    UPDATE payments
    SET status = ${status}, paid_at = ${status === 'paid' ? new Date() : null}, chapa_reference = COALESCE(chapa_reference, ${verification.chapa_reference ?? null})
    WHERE id = ${payment.id}
  `
  if (status !== 'paid') return status

  const students = typeof payment.studentData === 'string' ? JSON.parse(payment.studentData) : payment.studentData
  for (const student of students) {
    const [savedStudent] = await transaction`
      INSERT INTO students ${transaction({
        user_id: payment.userId,
        full_name: student.fullName,
        age_or_grade: student.ageOrGrade,
        relationship: student.relationship,
        preferred_language: student.preferredLanguage,
        emergency_phone: student.emergencyPhone,
        notes: student.notes,
      })}
      RETURNING id
    `
    const classRecord = payment.classId === null ? null : (await transaction`
      SELECT classes.id,
             classes.capacity,
             classes.status,
             COALESCE(enrollment_counts.enrolled_count, 0)::INTEGER AS enrolled_count
      FROM classes
      LEFT JOIN (
        SELECT class_id, COUNT(*) FILTER (WHERE class_status = 'enrolled') AS enrolled_count
        FROM enrollments
        WHERE class_id = ${payment.classId}
        GROUP BY class_id
      ) AS enrollment_counts ON enrollment_counts.class_id = classes.id
      WHERE classes.id = ${payment.classId}
        AND classes.published = true
        AND classes.status <> 'closed'
      FOR UPDATE OF classes
    `)[0] ?? null
    const classStatus = classRecord ? (classRecord.status === 'full' || classRecord.enrolled_count >= classRecord.capacity ? 'waitlisted' : 'enrolled') : null
    await transaction`
      INSERT INTO enrollments ${transaction({ user_id: payment.userId, student_id: savedStudent.id, course_id: payment.courseId, payment_id: payment.id, class_id: classRecord?.id ?? null, class_status: classStatus })}
      ON CONFLICT (student_id, course_id, payment_id) DO NOTHING
    `
    if (classRecord && classStatus === 'enrolled' && classRecord.enrolled_count + 1 >= classRecord.capacity) {
      await transaction`UPDATE classes SET status = 'full', updated_at = NOW() WHERE id = ${classRecord.id}`
    }
  }
  await transaction`UPDATE courses SET students = students + ${students.length} WHERE id = ${payment.courseId}`
  return 'paid'
})

app.use(express.json({ limit: '10mb' }))

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
  response.json(courses.map(deserializeCourse))
})

app.get('/api/courses/:id', async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = await readCourse(id, true)
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(course)
})

app.get('/api/students', requireAuthenticated, async (request, response) => {
  const students = await sql`
    SELECT id::INTEGER AS id,
           full_name AS "fullName",
           age_or_grade AS "ageOrGrade",
           relationship,
           preferred_language AS "preferredLanguage",
           emergency_phone AS "emergencyPhone",
           notes
    FROM students
    WHERE user_id = ${request.userId}
    ORDER BY created_at DESC
  `
  response.json(students)
})

app.get('/api/enrollments', requireAuthenticated, async (request, response) => {
  const enrollments = await sql`
    SELECT enrollments.id::INTEGER AS id,
           courses.id::INTEGER AS "courseId",
           courses.title AS "courseTitle",
           courses.cover AS "courseCover",
           courses.category,
           courses.level,
           courses.tutor,
           courses.modules,
           classes.id::INTEGER AS "classId",
           classes.title AS "classTitle",
           tutors.name AS "classTutor",
           classes.schedule AS "classSchedule",
           classes.meeting_link AS "meetingLink",
           classes.status AS "classStatus",
           COALESCE(course_progress.completed_lesson_ids, '[]'::jsonb) AS "completedLessonIds",
           COALESCE(course_progress.started, false) AS started,
           COALESCE(course_progress.time_spent_seconds, 0) AS "timeSpentSeconds",
           COALESCE(course_progress.quiz_results, '{}'::jsonb) AS "quizResults"
    FROM enrollments
    INNER JOIN payments ON payments.id = enrollments.payment_id AND payments.status = 'paid'
    INNER JOIN courses ON courses.id = enrollments.course_id
    INNER JOIN students ON students.id = enrollments.student_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    LEFT JOIN tutors ON tutors.id = classes.tutor_id
    LEFT JOIN course_progress ON course_progress.user_id = enrollments.user_id AND course_progress.course_id = enrollments.course_id
    WHERE enrollments.user_id = ${request.userId}
    ORDER BY enrollments.created_at DESC
  `
  response.json(enrollments.map((enrollment) => {
    const modules = deserializeJson(enrollment.modules)
    const classSchedule = deserializeJson(enrollment.classSchedule)
    const completedLessonIds = deserializeJson(enrollment.completedLessonIds)
    const quizResults = deserializeJson(enrollment.quizResults)
    return {
      ...enrollment,
      modules: Array.isArray(modules) ? modules : [],
      classSchedule: classSchedule && typeof classSchedule === 'object' && !Array.isArray(classSchedule) ? classSchedule : null,
      completedLessonIds: Array.isArray(completedLessonIds) ? completedLessonIds : [],
      started: Boolean(enrollment.started),
      timeSpentSeconds: Number.isInteger(enrollment.timeSpentSeconds) ? enrollment.timeSpentSeconds : 0,
      quizResults: quizResults && typeof quizResults === 'object' && !Array.isArray(quizResults) ? quizResults : {},
    }
  }))
})

app.put('/api/enrollments/:courseId/progress', requireAuthenticated, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId)
  const completedLessonIds = request.body?.completedLessonIds
  const started = request.body?.started
  const timeSpentSeconds = request.body?.timeSpentSeconds
  const quizResults = request.body?.quizResults
  const hasValidQuizResults = quizResults && typeof quizResults === 'object' && !Array.isArray(quizResults) && Object.entries(quizResults).every(([lessonId, result]) => {
    const parsedLessonId = Number(lessonId)
    return Number.isInteger(parsedLessonId) && result && typeof result === 'object' && !Array.isArray(result) && Number.isInteger(result.score) && result.score >= 0 && result.score <= 100 && typeof result.passed === 'boolean'
  })
  if (courseId === null || !Array.isArray(completedLessonIds) || !completedLessonIds.every((lessonId) => Number.isInteger(lessonId)) || new Set(completedLessonIds).size !== completedLessonIds.length || typeof started !== 'boolean' || !Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || !hasValidQuizResults) return response.status(400).json({ message: 'Invalid course progress.' })

  const [enrollment] = await sql`
    SELECT courses.modules,
           COALESCE(course_progress.completed_lesson_ids, '[]'::jsonb) AS "completedLessonIds",
           COALESCE(course_progress.quiz_results, '{}'::jsonb) AS "quizResults"
    FROM enrollments
    INNER JOIN payments ON payments.id = enrollments.payment_id AND payments.status = 'paid'
    INNER JOIN courses ON courses.id = enrollments.course_id
    LEFT JOIN course_progress ON course_progress.user_id = enrollments.user_id AND course_progress.course_id = enrollments.course_id
    WHERE enrollments.user_id = ${request.userId}
      AND enrollments.course_id = ${courseId}
    LIMIT 1
  `
  if (!enrollment) return response.status(404).json({ message: 'Course enrollment not found.' })

  const modules = deserializeJson(enrollment.modules)
  const existingCompletedLessonIds = deserializeJson(enrollment.completedLessonIds)
  const existingQuizResults = deserializeJson(enrollment.quizResults)
  const lessons = Array.isArray(modules) ? modules.flatMap((module) => Array.isArray(module?.lessons) ? module.lessons : []) : []
  const lessonIds = new Set(lessons.map((lesson) => lesson?.id))
  const quizLessonIds = new Set(lessons.filter((lesson) => lesson?.type === 'quiz').map((lesson) => lesson?.id))
  const completedIds = Array.isArray(existingCompletedLessonIds) ? existingCompletedLessonIds : []
  const previousResults = existingQuizResults && typeof existingQuizResults === 'object' && !Array.isArray(existingQuizResults) ? existingQuizResults : {}
  const hasRemovedCompletedLesson = completedIds.some((lessonId) => !completedLessonIds.includes(lessonId))
  const hasChangedQuizResult = Object.entries(previousResults).some(([lessonId, previous]) => {
    const next = quizResults[lessonId]
    return !next || previous?.score !== next.score || previous?.passed !== next.passed
  })
  if (completedLessonIds.some((lessonId) => !lessonIds.has(lessonId)) || Object.keys(quizResults).some((lessonId) => !quizLessonIds.has(Number(lessonId))) || hasRemovedCompletedLesson || hasChangedQuizResult) return response.status(400).json({ message: 'Completed quizzes and lessons cannot be changed.' })

  await sql`
    INSERT INTO course_progress ${sql({ user_id: request.userId, course_id: courseId, completed_lesson_ids: JSON.stringify(completedLessonIds), started, time_spent_seconds: timeSpentSeconds, quiz_results: JSON.stringify(quizResults) })}
    ON CONFLICT (user_id, course_id) DO UPDATE SET completed_lesson_ids = EXCLUDED.completed_lesson_ids, started = EXCLUDED.started, time_spent_seconds = EXCLUDED.time_spent_seconds, quiz_results = EXCLUDED.quiz_results, updated_at = NOW()
  `
  return response.status(204).end()
})

app.post('/api/payments/chapa', requireAuthenticated, async (request, response) => {
  const courseId = parseCourseId(String(request.body?.courseId ?? ''))
  if (courseId === null) return response.status(400).json({ message: 'Choose a valid course.' })
  if (!isTestChapa && !process.env.CHAPA_SECRET_KEY) return response.status(503).json({ message: 'Chapa checkout has not been configured yet.' })

  const [course] = await sql`
    SELECT courses.id, courses.title, courses.price::FLOAT AS price, users.name, users.email, users.phone
    FROM courses
    INNER JOIN users ON users.id = ${request.userId}
    WHERE courses.id = ${courseId}
      AND courses.status = 'Published'
  `
  if (!course) return response.status(404).json({ message: 'This course is not available for enrollment.' })

  const students = [{
    fullName: course.name.trim() || 'Student',
    ageOrGrade: 'Not provided',
    relationship: 'Self',
    preferredLanguage: 'Not provided',
    emergencyPhone: '',
    notes: '',
  }]
  const referencePrefix = isTestChapa ? 'test-course' : 'course'
  const reference = `${referencePrefix}-${course.id}-${randomBytes(12).toString('hex')}`
  const currency = process.env.CHAPA_CURRENCY ?? 'ETB'
  const amount = course.price * students.length
  const [payment] = await sql`
    INSERT INTO payments ${sql({ reference, user_id: request.userId, course_id: course.id, student_data: JSON.stringify(students), amount, currency })}
    RETURNING id
  `

  if (isTestChapa) return response.status(201).json({ checkoutUrl: '', paymentReference: reference, mode: 'test' })

  const baseUrl = process.env.APP_URL ?? `${request.protocol}://${request.get('host')}`
  const nameParts = course.name.trim().split(/\s+/)
  try {
    const chapaResponse = await fetch('https://api.chapa.global/v2/payments/hosted', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        merchant_reference: reference,
        customer: {
          first_name: nameParts[0] || 'Student',
          last_name: nameParts.slice(1).join(' '),
          email: course.email,
          phone_number: course.phone || undefined,
        },
        meta: { order_id: reference, course_id: course.id },
        return_url: `${baseUrl}/courses/${course.id}?payment=${reference}`,
        callback_url: `${baseUrl}/api/payments/chapa/webhook`,
      }),
    })
    const chapaPayment = await chapaResponse.json().catch(() => null)
    const checkoutUrl = chapaPayment?.data?.checkout_url
    const chapaReference = chapaPayment?.data?.chapa_reference
    if (!chapaResponse.ok || typeof checkoutUrl !== 'string') throw new Error('Chapa did not return a checkout link.')
    if (typeof chapaReference === 'string' && chapaReference) await sql`UPDATE payments SET chapa_reference = ${chapaReference} WHERE id = ${payment.id}`
    return response.status(201).json({ checkoutUrl, paymentReference: typeof chapaReference === 'string' && chapaReference ? chapaReference : reference, mode: 'live' })
  } catch (error) {
    await sql`UPDATE payments SET status = 'failed' WHERE id = ${payment.id}`
    throw error
  }
})

app.post('/api/payments/chapa/class', requireAuthenticated, async (request, response) => {
  const classId = parseCourseId(String(request.body?.classId ?? ''))
  if (classId === null) return response.status(400).json({ message: 'Choose a valid batch.' })
  if (!isTestChapa && !process.env.CHAPA_SECRET_KEY) return response.status(503).json({ message: 'Chapa checkout has not been configured yet.' })

  const [classRecord] = await sql`
    SELECT classes.id,
           classes.title,
           classes.course_id AS "courseId",
           classes.price::FLOAT AS price,
           courses.id AS "paymentCourseId",
           users.name,
           users.email,
           users.phone
    FROM classes
    INNER JOIN courses ON courses.id = classes.course_id AND courses.status = 'Published'
    INNER JOIN users ON users.id = ${request.userId}
    WHERE classes.id = ${classId}
      AND classes.published = true
      AND classes.status IN ('open', 'full')
  `
  if (!classRecord) return response.status(404).json({ message: 'This batch is not available for enrollment or has no linked published course.' })

  const students = [{
    fullName: classRecord.name.trim() || 'Student',
    ageOrGrade: 'Not provided',
    relationship: 'Self',
    preferredLanguage: 'Not provided',
    emergencyPhone: '',
    notes: '',
  }]
  const referencePrefix = isTestChapa ? 'test-class' : 'class'
  const reference = `${referencePrefix}-${classRecord.id}-${randomBytes(12).toString('hex')}`
  const currency = process.env.CHAPA_CURRENCY ?? 'ETB'
  const amount = classRecord.price * students.length
  const [payment] = await sql`
    INSERT INTO payments ${sql({ reference, user_id: request.userId, course_id: classRecord.paymentCourseId, class_id: classRecord.id, student_data: JSON.stringify(students), amount, currency })}
    RETURNING id
  `

  if (isTestChapa) return response.status(201).json({ checkoutUrl: '', paymentReference: reference, mode: 'test' })

  const baseUrl = process.env.APP_URL ?? `${request.protocol}://${request.get('host')}`
  const nameParts = classRecord.name.trim().split(/\s+/)
  try {
    const chapaResponse = await fetch('https://api.chapa.global/v2/payments/hosted', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        merchant_reference: reference,
        customer: {
          first_name: nameParts[0] || 'Student',
          last_name: nameParts.slice(1).join(' '),
          email: classRecord.email,
          phone_number: classRecord.phone || undefined,
        },
        meta: { order_id: reference, class_id: classRecord.id },
        return_url: `${baseUrl}/?payment=${reference}&class=${classRecord.id}`,
        callback_url: `${baseUrl}/api/payments/chapa/webhook`,
      }),
    })
    const chapaPayment = await chapaResponse.json().catch(() => null)
    const checkoutUrl = chapaPayment?.data?.checkout_url
    const chapaReference = chapaPayment?.data?.chapa_reference
    if (!chapaResponse.ok || typeof checkoutUrl !== 'string') throw new Error('Chapa did not return a checkout link.')
    if (typeof chapaReference === 'string' && chapaReference) await sql`UPDATE payments SET chapa_reference = ${chapaReference} WHERE id = ${payment.id}`
    return response.status(201).json({ checkoutUrl, paymentReference: typeof chapaReference === 'string' && chapaReference ? chapaReference : reference, mode: 'live' })
  } catch (error) {
    await sql`UPDATE payments SET status = 'failed' WHERE id = ${payment.id}`
    throw error
  }
})

app.get('/api/payments/chapa/:reference', requireAuthenticated, async (request, response) => {
  const requestedReference = request.params.reference
  const [payment] = await sql`
    SELECT reference, chapa_reference AS "chapaReference", status
    FROM payments
    WHERE (reference = ${requestedReference} OR chapa_reference = ${requestedReference})
      AND user_id = ${request.userId}
  `
  if (!payment) return response.status(404).json({ message: 'Payment not found.' })
  if (payment.status === 'pending') {
    const providerReference = payment.chapaReference ?? (requestedReference === payment.reference ? null : requestedReference)
    if (!providerReference) return response.json({ status: 'pending' })
    const verification = await verifyChapaTransaction(providerReference)
    if (verification.status !== 'pending') await updatePaymentStatus(payment.reference, verification.status, verification.data)
    return response.json({ status: verification.status })
  }
  return response.json({ status: payment.status })
})

app.post('/api/payments/chapa/:reference/test-complete', requireAuthenticated, async (request, response) => {
  if (!isTestChapa) return response.status(404).json({ message: 'Test checkout is not enabled.' })

  const reference = request.params.reference
  const status = request.body?.status
  if (!/^test-(?:course|class)-\d+-[a-f0-9]{24}$/.test(reference) || !['paid', 'failed'].includes(status)) return response.status(400).json({ message: 'Invalid test payment.' })

  const [payment] = await sql`
    SELECT reference, amount::FLOAT AS amount, currency, status
    FROM payments
    WHERE reference = ${reference}
      AND user_id = ${request.userId}
      AND status = 'pending'
  `
  if (!payment) return response.status(404).json({ message: 'Test payment not found.' })

  const updatedStatus = await updatePaymentStatus(reference, status, {
    amount: payment.amount,
    currency: payment.currency,
    merchant_reference: payment.reference,
    chapa_reference: payment.reference,
  })
  return response.json({ status: updatedStatus })
})

app.post('/api/payments/chapa/webhook', async (request, response, next) => {
  const payload = request.body ?? {}
  const merchantReference = payload.merchant_reference ?? payload.data?.merchant_reference ?? payload.meta?.order_id
  const chapaReference = payload.chapa_reference ?? payload.data?.chapa_reference
  if ((typeof merchantReference !== 'string' || merchantReference.length > 200) && (typeof chapaReference !== 'string' || chapaReference.length > 200)) return response.status(400).json({ message: 'Invalid payment reference.' })
  try {
    const [payment] = await sql`
      SELECT reference, chapa_reference AS "chapaReference"
      FROM payments
      WHERE (${typeof merchantReference === 'string' ? sql`reference = ${merchantReference}` : sql`FALSE`}
        OR ${typeof chapaReference === 'string' ? sql`chapa_reference = ${chapaReference}` : sql`FALSE`})
    `
    if (!payment) return response.status(404).json({ message: 'Payment not found.' })
    const providerReference = typeof chapaReference === 'string' ? chapaReference : payment.chapaReference
    if (!providerReference) return response.status(400).json({ message: 'Missing Chapa payment reference.' })
    const verification = await verifyChapaTransaction(providerReference)
    if (verification.status !== 'pending') await updatePaymentStatus(payment.reference, verification.status, verification.data)
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

app.get('/api/payments', requireAuthenticated, async (request, response) => {
  const payments = await sql`
    SELECT payments.id::INTEGER AS id,
           COALESCE(classes.title, courses.title) AS "itemName",
           CASE WHEN payments.class_id IS NULL THEN 'course' ELSE 'class' END AS type,
           payments.amount::FLOAT AS amount,
           payments.currency,
           CASE payments.status
             WHEN 'paid' THEN 'Paid'
             WHEN 'failed' THEN 'Failed'
             ELSE 'Pending'
           END AS status,
           to_char(payments.created_at, 'Mon DD, YYYY') AS date,
           payments.reference AS "txRef"
    FROM payments
    INNER JOIN courses ON courses.id = payments.course_id
    LEFT JOIN classes ON classes.id = payments.class_id
    WHERE payments.user_id = ${request.userId}
    ORDER BY payments.created_at DESC, payments.id DESC
  `
  return response.json(payments)
})

app.get('/api/classes', async (_request, response) => {
  const classes = await sql`
    SELECT classes.id::INTEGER AS id,
           classes.title,
           classes.program_id AS "programId",
           classes.schedule,
           classes.price::FLOAT AS price,
           classes.status,
           classes.course_id::INTEGER AS "courseId",
           courses.title AS "courseTitle",
           COALESCE(tutors.name, 'Tutor to be confirmed') AS "tutorName",
           classes.capacity,
           COALESCE(enrollment_counts.enrolled_count, 0)::INTEGER AS "enrolledCount",
           classes.published,
           CASE WHEN courses.id IS NULL THEN NULL ELSE jsonb_array_length(CASE WHEN jsonb_typeof(courses.modules) = 'array' THEN courses.modules ELSE '[]'::jsonb END) END::INTEGER AS "moduleCount",
           CASE WHEN courses.id IS NULL THEN NULL ELSE (
             SELECT COUNT(*)::INTEGER
             FROM jsonb_array_elements(CASE WHEN jsonb_typeof(courses.modules) = 'array' THEN courses.modules ELSE '[]'::jsonb END) AS module
             CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(module->'lessons') = 'array' THEN module->'lessons' ELSE '[]'::jsonb END) AS lesson
           ) END AS "lessonCount"
    FROM classes
    LEFT JOIN courses ON courses.id = classes.course_id
    LEFT JOIN tutors ON tutors.id = classes.tutor_id
    LEFT JOIN (
      SELECT class_id, COUNT(*) FILTER (WHERE class_status = 'enrolled') AS enrolled_count
      FROM enrollments
      WHERE class_id IS NOT NULL
      GROUP BY class_id
    ) AS enrollment_counts ON enrollment_counts.class_id = classes.id
    WHERE classes.published = true
      AND classes.status <> 'closed'
    ORDER BY classes.created_at DESC, classes.id DESC
  `
  return response.json(classes.map((classRecord) => ({ ...classRecord, schedule: deserializeJson(classRecord.schedule) })))
})

app.get('/api/admin/payments', requireAdmin, async (_request, response) => {
  const payments = await sql`
    SELECT payments.id::INTEGER AS id,
           COALESCE(NULLIF(payments.student_data->0->>'fullName', ''), NULLIF(users.name, ''), 'Unknown student') AS student,
           courses.title AS course,
           payments.amount::FLOAT AS amount,
           to_char(payments.created_at, 'Mon DD, YYYY') AS date,
           CASE payments.status
             WHEN 'paid' THEN 'Paid'
             WHEN 'failed' THEN 'Failed'
             ELSE 'Pending'
           END AS status
    FROM payments
    INNER JOIN users ON users.id = payments.user_id
    INNER JOIN courses ON courses.id = payments.course_id
    ORDER BY payments.created_at DESC, payments.id DESC
  `
  return response.json(payments)
})

app.get('/api/admin/overview', requireAdmin, async (_request, response) => {
  const [totals] = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'Published' THEN price * students ELSE 0 END), 0)::FLOAT AS "totalRevenue",
      COALESCE(SUM(CASE WHEN status = 'Published' THEN students ELSE 0 END), 0)::INTEGER AS "activeStudents",
      COUNT(*) FILTER (WHERE status = 'Published')::INTEGER AS "publishedCourses",
      COUNT(*) FILTER (WHERE status = 'Draft')::INTEGER AS "draftCourses",
      (SELECT COUNT(*) FROM tutors WHERE status = 'Active')::INTEGER AS "activeTutors",
      (SELECT COUNT(*) FROM tutors WHERE status = 'Inactive')::INTEGER AS "inactiveTutors"
    FROM courses
  `
  const revenueByMonth = await sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '6 months',
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      )::DATE AS month
    ), revenue AS (
      SELECT date_trunc('month', updated_at)::DATE AS month, SUM(price * students)::FLOAT AS value
      FROM courses
      WHERE status = 'Published'
        AND updated_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'
      GROUP BY 1
    )
    SELECT to_char(months.month, 'Mon') AS label, COALESCE(revenue.value, 0)::FLOAT AS value
    FROM months
    LEFT JOIN revenue ON revenue.month = months.month
    ORDER BY months.month
  `
  const enrollmentsByCategory = await sql`
    SELECT category AS label, SUM(students)::INTEGER AS value
    FROM courses
    WHERE status = 'Published'
      AND students > 0
    GROUP BY category
    ORDER BY value DESC, label
    LIMIT 5
  `

  response.json({ ...totals, revenueByMonth, enrollmentsByCategory })
})

app.get('/api/admin/courses', requireAdmin, async (_request, response) => {
  const courses = await sql`
    SELECT ${courseColumns}
    FROM courses
    ORDER BY id
  `
  response.json(courses.map(deserializeCourse))
})

app.get('/api/admin/courses/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = await readCourse(id)
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(course)
})

app.get('/api/admin/tutors', requireAdmin, async (_request, response) => {
  const tutors = await sql`
    SELECT ${tutorColumns}
    FROM tutors
    ORDER BY id
  `
  return response.json(await Promise.all(tutors.map(addAssignedCourses)))
})

app.get('/api/admin/tutors/:id', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid tutor id.' })

  const tutor = await readTutor(id)
  if (!tutor) return response.status(404).json({ message: 'Tutor not found.' })
  return response.json(tutor)
})

app.post('/api/admin/tutors', requireAdmin, async (request, response) => {
  const parsedTutor = parseTutorPayload(request.body)
  if (!parsedTutor) return response.status(400).json({ message: 'Enter valid tutor details.' })
  const { assignedCourseIds, ...tutor } = parsedTutor

  try {
    const [created] = await sql`
      INSERT INTO tutors ${sql(tutor)}
      RETURNING id
    `
    await updateTutorAssignments(Number(created.id), tutor.name, assignedCourseIds)
    const createdTutor = await readTutor(Number(created.id))
    return response.status(201).json({ ...createdTutor, inviteLink: `/admin/tutors/${created.id}` })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'A tutor with this email already exists.' })
    throw error
  }
})

app.put('/api/admin/tutors/:id', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid tutor id.' })

  const parsedTutor = parseTutorPayload(request.body)
  if (!parsedTutor) return response.status(400).json({ message: 'Enter valid tutor details.' })
  const { assignedCourseIds, ...tutor } = parsedTutor

  try {
    const [existingTutor] = await sql`SELECT name FROM tutors WHERE id = ${id}`
    if (!existingTutor) return response.status(404).json({ message: 'Tutor not found.' })
    const [updated] = await sql`
      UPDATE tutors
      SET ${sql(tutor)}
      WHERE id = ${id}
      RETURNING id
    `
    if (!updated) return response.status(404).json({ message: 'Tutor not found.' })
    await updateTutorAssignments(id, tutor.name, assignedCourseIds, existingTutor.name)
    return response.json(await readTutor(id))
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'A tutor with this email already exists.' })
    throw error
  }
})

app.patch('/api/admin/tutors/:id/status', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid tutor id.' })

  const status = parseTutorStatus(request.body)
  if (!status) return response.status(400).json({ message: 'Tutor status must be Active or Inactive.' })

  const [updated] = await sql`
    UPDATE tutors
    SET status = ${status}
    WHERE id = ${id}
    RETURNING id
  `
  if (!updated) return response.status(404).json({ message: 'Tutor not found.' })
  return response.json(await readTutor(id))
})

app.delete('/api/admin/tutors/:id', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid tutor id.' })

  const [deleted] = await sql`DELETE FROM tutors WHERE id = ${id} RETURNING id`
  if (!deleted) return response.status(404).json({ message: 'Tutor not found.' })
  return response.status(204).end()
})

const readAdminAccounts = async () => {
  const users = await sql`
    SELECT id::INTEGER AS "accountId",
           id::INTEGER AS id,
           COALESCE(NULLIF(name, ''), split_part(email, '@', 1)) AS name,
           email,
           CASE role WHEN 'admin' THEN 'Admin' WHEN 'tutor' THEN 'Tutor' ELSE 'Student' END AS role,
           to_char(created_at, 'FMMonth DD, YYYY') AS joined,
           status,
           'user' AS "accountType"
    FROM users
  `
  const tutors = await sql`
    SELECT id::INTEGER AS "accountId",
           (1000000000 + id)::INTEGER AS id,
           name,
           email,
           'Tutor' AS role,
           to_char(created_at, 'FMMonth DD, YYYY') AS joined,
           CASE status WHEN 'Active' THEN 'Active' ELSE 'Suspended' END AS status,
           'tutor' AS "accountType"
    FROM tutors
  `
  const accountsByEmail = new Map([...users, ...tutors].map((account) => [account.email, account]))
  return [...accountsByEmail.values()].sort((first, second) => first.name.localeCompare(second.name))
}

app.get('/api/admin/users', requireAdmin, async (_request, response) => response.json(await readAdminAccounts()))

app.patch('/api/admin/users/:accountType/:id/status', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  const accountType = request.params.accountType
  const status = request.body?.status
  if (id === null || !['user', 'tutor'].includes(accountType)) return response.status(400).json({ message: 'Invalid account.' })
  if (status !== 'Active' && status !== 'Suspended') return response.status(400).json({ message: 'Account status must be Active or Suspended.' })

  const updated = accountType === 'user'
    ? await sql`UPDATE users SET status = ${status} WHERE id = ${id} RETURNING id`
    : await sql`UPDATE tutors SET status = ${status === 'Active' ? 'Active' : 'Inactive'} WHERE id = ${id} RETURNING id, email`
  if (!updated.length) return response.status(404).json({ message: 'Account not found.' })
  if (accountType === 'tutor') await sql`UPDATE users SET status = ${status} WHERE email = ${updated[0].email}`
  const account = (await readAdminAccounts()).find((currentAccount) => currentAccount.accountType === accountType && currentAccount.accountId === id)
  return response.json(account)
})

app.post('/api/admin/users/:accountType/:id/reset-password', requireAdmin, async (request, response) => {
  const id = parseTutorId(request.params.id)
  const accountType = request.params.accountType
  if (id === null || !['user', 'tutor'].includes(accountType)) return response.status(400).json({ message: 'Invalid account.' })

  const temporaryPassword = randomBytes(9).toString('base64url')
  const passwordHash = await hashPassword(temporaryPassword)
  if (accountType === 'user') {
    const [updated] = await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id} RETURNING id`
    if (!updated) return response.status(404).json({ message: 'Account not found.' })
  } else {
    const [tutor] = await sql`SELECT name, email, status FROM tutors WHERE id = ${id}`
    if (!tutor) return response.status(404).json({ message: 'Account not found.' })
    await sql`
      INSERT INTO users ${sql({ name: tutor.name, email: tutor.email, password_hash: passwordHash, role: 'tutor', status: tutor.status === 'Active' ? 'Active' : 'Suspended' })}
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = EXCLUDED.status
    `
  }
  return response.json({ temporaryPassword })
})

app.post('/api/admin/courses', requireAdmin, async (request, response) => {
  const course = parseCoursePayload(request.body)
  if (!course) return response.status(400).json({ message: 'Enter all required course details.' })

  try {
    const courseWithTutor = { ...course, tutor_id: await findTutorIdByName(course.tutor) }
    const [created] = await sql`
      INSERT INTO courses ${sql(courseWithTutor)}
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
    const courseWithTutor = { ...course, tutor_id: await findTutorIdByName(course.tutor) }
    const [updated] = await sql`
      UPDATE courses
      SET ${sql(courseWithTutor)}, updated_at = NOW()
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

const classPrograms = ['international-online-interactive', 'summer-camp', 'ministry-exam-prep']
const classStatuses = ['pending_schedule', 'open', 'full', 'closed']

const parseClassPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const programId = body.program_id
  const tutorId = Number(body.tutor_id)
  const capacity = Number(body.capacity)
  const schedule = body.schedule
  const meetingLink = typeof body.meeting_link === 'string' ? body.meeting_link.trim() : ''
  const courseId = body.course_id === null ? null : Number(body.course_id)
  const price = Number(body.price)
  const published = body.published
  const validSchedule = schedule && typeof schedule === 'object' && !Array.isArray(schedule) && Array.isArray(schedule.days) && schedule.days.every((day) => typeof day === 'string' && day.length <= 3) && typeof schedule.time === 'string' && typeof schedule.flexible === 'boolean' && typeof schedule.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(schedule.startDate)
  if (!title || title.length > 200 || !classPrograms.includes(programId) || !Number.isInteger(tutorId) || tutorId < 1 || !Number.isInteger(capacity) || capacity < 1 || !validSchedule || meetingLink.length > 2000 || !meetingLink || !Number.isFinite(price) || price < 0 || typeof published !== 'boolean' || (courseId !== null && (!Number.isInteger(courseId) || courseId < 1))) return null
  return { program_id: programId, title, tutor_id: tutorId, capacity, schedule: JSON.stringify(schedule), meeting_link: meetingLink, course_id: courseId, price, published }
}

const classColumns = sql.unsafe(`
  classes.id::INTEGER AS id,
  classes.program_id,
  classes.title,
  classes.tutor_id::INTEGER AS tutor_id,
  classes.capacity,
  classes.schedule,
  classes.meeting_link,
  classes.course_id::INTEGER AS course_id,
  classes.price::FLOAT AS price,
  classes.status,
  classes.published
`)

const readAdminClass = async (id) => {
  const [classRecord] = await sql`SELECT ${classColumns} FROM classes WHERE classes.id = ${id}`
  return classRecord ?? null
}

const refreshClassStatus = async (id) => {
  const [classRecord] = await sql`SELECT capacity, published, status FROM classes WHERE id = ${id} FOR UPDATE`
  if (!classRecord) return null
  const [counts] = await sql`SELECT COUNT(*) FILTER (WHERE class_status = 'enrolled')::INTEGER AS enrolled FROM enrollments WHERE class_id = ${id}`
  const status = !classRecord.published ? 'closed' : classRecord.status === 'closed' ? 'closed' : counts.enrolled >= classRecord.capacity ? 'full' : 'open'
  await sql`UPDATE classes SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
  return readAdminClass(id)
}

app.get('/api/admin/classes', requireAdmin, async (_request, response) => {
  const [classes, enrollments, pendingStudents, tutors, courses] = await Promise.all([
    sql`SELECT ${classColumns} FROM classes WHERE published = true ORDER BY created_at DESC, id DESC`,
    sql`SELECT enrollments.id::INTEGER AS id, enrollments.class_id::INTEGER AS class_id, students.full_name AS student_name, to_char(enrollments.created_at, 'FMMonth DD, YYYY') AS enrolled_date, enrollments.class_status AS status FROM enrollments INNER JOIN students ON students.id = enrollments.student_id WHERE enrollments.class_id IS NOT NULL ORDER BY enrollments.created_at DESC`,
    sql`SELECT enrollments.id::INTEGER AS id, students.full_name AS student_name, to_char(enrollments.created_at, 'FMMonth DD, YYYY') AS enrolled_date, NULLIF(regexp_replace(students.age_or_grade, '\\D', '', 'g'), '')::INTEGER AS age FROM enrollments INNER JOIN students ON students.id = enrollments.student_id INNER JOIN payments ON payments.id = enrollments.payment_id INNER JOIN courses ON courses.id = enrollments.course_id WHERE payments.status = 'paid' AND enrollments.class_id IS NULL AND LOWER(courses.category) = 'international online interactive' ORDER BY enrollments.created_at DESC`,
    sql`SELECT id::INTEGER AS id, name FROM tutors WHERE status = 'Active' ORDER BY name`,
    sql`SELECT id::INTEGER AS id, title FROM courses ORDER BY title`,
  ])
  response.json({ classes, enrollments, pendingStudents, tutors, courses })
})

app.post('/api/admin/classes', requireAdmin, async (request, response) => {
  const classPayload = parseClassPayload(request.body)
  if (!classPayload) return response.status(400).json({ message: 'Enter valid class details.' })
  const [created] = await sql`INSERT INTO classes ${sql({ ...classPayload, status: classPayload.published ? 'open' : 'closed' })} RETURNING id`
  return response.status(201).json(await readAdminClass(Number(created.id)))
})

app.put('/api/admin/classes/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  const classPayload = parseClassPayload(request.body)
  if (id === null || !classPayload) return response.status(400).json({ message: 'Enter valid class details.' })
  const [updated] = await sql`UPDATE classes SET ${sql(classPayload)}, updated_at = NOW() WHERE id = ${id} RETURNING id`
  if (!updated) return response.status(404).json({ message: 'Class not found.' })
  return response.json(await refreshClassStatus(id))
})

app.post('/api/admin/classes/assign', requireAdmin, async (request, response) => {
  const enrollmentId = parseCourseId(String(request.body?.enrollmentId ?? ''))
  const classPayload = parseClassPayload({ ...request.body, program_id: 'international-online-interactive', title: request.body?.title, price: request.body?.price ?? 0, published: true, course_id: null })
  if (enrollmentId === null || !classPayload) return response.status(400).json({ message: 'Enter valid class assignment details.' })
  const created = await sql.begin(async (transaction) => {
    const [enrollment] = await transaction`SELECT id FROM enrollments WHERE id = ${enrollmentId} AND class_id IS NULL FOR UPDATE`
    if (!enrollment) return null
    const [newClass] = await transaction`INSERT INTO classes ${transaction({ ...classPayload, status: 'open' })} RETURNING id`
    await transaction`UPDATE enrollments SET class_id = ${newClass.id}, class_status = 'enrolled' WHERE id = ${enrollmentId}`
    await transaction`UPDATE classes SET status = CASE WHEN capacity <= 1 THEN 'full' ELSE 'open' END WHERE id = ${newClass.id}`
    return newClass
  })
  if (!created) return response.status(404).json({ message: 'Pending enrollment not found.' })
  return response.status(201).json(await readAdminClass(Number(created.id)))
})

app.patch('/api/admin/classes/enrollments/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  const status = request.body?.status
  if (id === null || !['enrolled', 'waitlisted'].includes(status)) return response.status(400).json({ message: 'Enter a valid enrollment status.' })
  const [enrollment] = await sql`UPDATE enrollments SET class_status = ${status} WHERE id = ${id} AND class_id IS NOT NULL RETURNING class_id`
  if (!enrollment) return response.status(404).json({ message: 'Class enrollment not found.' })
  await refreshClassStatus(Number(enrollment.class_id))
  return response.status(204).end()
})

app.delete('/api/admin/classes/enrollments/:id', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid enrollment id.' })
  const [enrollment] = await sql`UPDATE enrollments SET class_id = NULL, class_status = NULL WHERE id = ${id} AND class_id IS NOT NULL RETURNING class_id`
  if (!enrollment) return response.status(404).json({ message: 'Class enrollment not found.' })
  await refreshClassStatus(Number(enrollment.class_id))
  return response.status(204).end()
})

app.post('/api/auth/sign-up', async (request, response) => {
  const { email, password, name } = request.body ?? {}
  if (!isValidCredentials(email, password) || typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    return response.status(400).json({ message: 'Enter your full name, valid email, and a password between 8 and 128 characters.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const passwordHash = await hashPassword(password)

  try {
    const [user] = await sql`
      INSERT INTO users ${sql({ name: name.trim(), phone: '', email: normalizedEmail, password_hash: passwordHash })}
      RETURNING id, name, email, role, created_at AS "createdAt"
    `
    const sessionToken = randomBytes(32).toString('hex')
    await sql`
      INSERT INTO auth_sessions ${sql({ token: sessionToken, user_id: user.id, expires_at: new Date(Date.now() + sessionDuration) })}
    `
    response.setHeader('Set-Cookie', `${sessionCookieName}=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionDuration / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
    return response.status(201).json({ user, sessionToken })
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
    SELECT id, name, email, password_hash, role, status, created_at AS "createdAt"
    FROM users
    WHERE email = ${normalizedEmail}
  `

  if (!user || user.status !== 'Active' || !(await verifyPassword(password, user.password_hash))) {
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

app.post('/api/auth/change-password', requireAuthenticated, async (request, response) => {
  const { currentPassword, newPassword } = request.body ?? {}
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return response.status(400).json({ message: 'Your new password must be between 8 and 128 characters.' })
  }

  const [user] = await sql`
    SELECT password_hash
    FROM users
    WHERE id = ${request.userId}
  `
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return response.status(401).json({ message: 'Your current password is incorrect.' })
  }

  await sql`
    UPDATE users
    SET password_hash = ${await hashPassword(newPassword)}
    WHERE id = ${request.userId}
  `
  return response.status(204).end()
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
