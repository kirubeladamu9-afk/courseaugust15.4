import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import express from 'express'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set.')
}

const sql = postgres(databaseUrl, { max: 10, ssl: 'require', prepare: false })
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

const gamificationBadgeSeeds = [
  { id: 'first-quiz-passed', name: 'First Quiz Passed', icon: 'quiz', description: 'Passed your first quiz and started building assessment momentum.', criteria: 'Pass 1 quiz' },
  { id: 'seven-day-streak', name: '7-Day Streak', icon: 'streak', description: 'Kept your learning habit going for seven days.', criteria: 'Reach a 7-day streak' },
  { id: 'perfect-attendance', name: 'Perfect Attendance', icon: 'attendance', description: 'Attended every live session currently tracked for your cohort.', criteria: 'Attend every live session' },
  { id: 'course-completed', name: 'Course Completed', icon: 'course', description: 'Completed every lesson in a course.', criteria: 'Complete 1 course' },
  { id: 'lesson-momentum', name: 'Lesson Momentum', icon: 'momentum', description: 'Completed ten lessons across your learning plan.', criteria: 'Complete 10 lessons' },
]

const gamificationChallengeSeeds = [
  { id: 'daily-lesson', title: 'Complete 1 lesson today', type: 'daily', criteria: 'lesson_today', xpReward: 30, pointsReward: 10, sortOrder: 1 },
  { id: 'daily-quiz', title: 'Pass a quiz today', type: 'daily', criteria: 'quiz_today', xpReward: 45, pointsReward: 15, sortOrder: 2 },
  { id: 'daily-live', title: 'Attend a live session today', type: 'daily', criteria: 'live_today', xpReward: 50, pointsReward: 18, sortOrder: 3 },
  { id: 'weekly-live', title: 'Attend both live sessions this week', type: 'weekly', criteria: 'live_week', xpReward: 80, pointsReward: 30, sortOrder: 1 },
  { id: 'weekly-lessons', title: 'Complete 3 lessons this week', type: 'weekly', criteria: 'lesson_week', xpReward: 90, pointsReward: 35, sortOrder: 2 },
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

const quoteIdentifier = (identifier) => `"${identifier.replaceAll('"', '""')}"`

const ensureColumns = async (tableName, columns) => {
  const existingColumns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
  `
  const existingColumnNames = new Set(existingColumns.map(({ column_name }) => column_name))

  for (const [columnName, definition] of Object.entries(columns)) {
    if (!existingColumnNames.has(columnName)) {
      await sql.unsafe(`ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columnName)} ${definition}`)
    }
  }
}

const ensureNullable = async (tableName, columnName) => {
  const [column] = await sql`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName}
  `
  if (column?.is_nullable === 'NO') {
    await sql.unsafe(`ALTER TABLE ${quoteIdentifier(tableName)} ALTER COLUMN ${quoteIdentifier(columnName)} DROP NOT NULL`)
  }
}

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

  await ensureColumns('users', {
    name: "TEXT NOT NULL DEFAULT ''",
    phone: "TEXT NOT NULL DEFAULT ''",
    status: "TEXT NOT NULL DEFAULT 'Active'",
  })

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

  await ensureColumns('courses', {
    level: "TEXT NOT NULL DEFAULT 'Beginner'",
    tutor: "TEXT NOT NULL DEFAULT ''",
    tutor_id: 'BIGINT REFERENCES tutors(id) ON DELETE SET NULL',
    status: "TEXT NOT NULL DEFAULT 'Published'",
    students: 'INTEGER NOT NULL DEFAULT 0',
    description: "TEXT NOT NULL DEFAULT ''",
    long_description: "TEXT NOT NULL DEFAULT ''",
    learning_outcomes: "JSONB NOT NULL DEFAULT '[]'::jsonb",
    requirements: "JSONB NOT NULL DEFAULT '[]'::jsonb",
    certificate: 'BOOLEAN NOT NULL DEFAULT false',
    modules: "JSONB NOT NULL DEFAULT '[]'::jsonb",
    updated_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  })

  await sql`
    CREATE TABLE IF NOT EXISTS practice_exams (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS practice_questions (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      exam_id BIGINT NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
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
  await ensureColumns('payments', {
    practice_exam_id: 'BIGINT REFERENCES practice_exams(id) ON DELETE RESTRICT',
    currency: "TEXT NOT NULL DEFAULT 'ETB'",
    chapa_reference: 'TEXT',
  })
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_chapa_reference_idx ON payments(chapa_reference) WHERE chapa_reference IS NOT NULL`

  await sql`
    CREATE TABLE IF NOT EXISTS practice_purchases (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id BIGINT NOT NULL REFERENCES practice_exams(id) ON DELETE RESTRICT,
      payment_id BIGINT UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, exam_id)
    )
  `

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
      modules JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await ensureColumns('classes', {
    modules: "JSONB NOT NULL DEFAULT '[]'::jsonb",
  })
  await ensureColumns('enrollments', {
    class_id: 'BIGINT REFERENCES classes(id) ON DELETE SET NULL',
    class_status: "TEXT CHECK (class_status IN ('enrolled', 'waitlisted'))",
  })
  await ensureNullable('enrollments', 'course_id')
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS enrollments_class_payment_idx ON enrollments (student_id, payment_id) WHERE course_id IS NULL`
  await ensureColumns('payments', {
    class_id: 'BIGINT REFERENCES classes(id) ON DELETE SET NULL',
  })
  await ensureNullable('payments', 'course_id')

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
  await ensureColumns('course_progress', {
    time_spent_seconds: 'INTEGER NOT NULL DEFAULT 0',
    quiz_results: "JSONB NOT NULL DEFAULT '{}'::jsonb",
  })

  await sql`
    CREATE TABLE IF NOT EXISTS student_lesson_progress (
      enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      lesson_id BIGINT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
      video_position_seconds NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (video_position_seconds >= 0),
      last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (enrollment_id, lesson_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS class_attendance (
      enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      lesson_id BIGINT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
      marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (enrollment_id, lesson_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS class_session_join_logs (
      enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      lesson_id BIGINT NOT NULL,
      clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (enrollment_id, lesson_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      lesson_id BIGINT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
      answers JSONB,
      score INTEGER CHECK (score BETWEEN 0 AND 100),
      passed BOOLEAN,
      submitted_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK ((submitted_at IS NULL AND score IS NULL AND passed IS NULL) OR (submitted_at IS NOT NULL AND score IS NOT NULL AND passed IS NOT NULL))
    )
  `
  await ensureColumns('quiz_attempts', {
    violations: "JSONB NOT NULL DEFAULT '[]'::jsonb",
    disqualified: 'BOOLEAN NOT NULL DEFAULT false',
    retake_approved: 'BOOLEAN NOT NULL DEFAULT false',
  })
  await sql`CREATE INDEX IF NOT EXISTS student_lesson_progress_enrollment_idx ON student_lesson_progress(enrollment_id, last_accessed_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS quiz_attempts_enrollment_lesson_idx ON quiz_attempts(enrollment_id, lesson_id, submitted_at DESC)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_one_open_attempt_idx ON quiz_attempts(enrollment_id, lesson_id) WHERE submitted_at IS NULL`

  await sql`
    CREATE TABLE IF NOT EXISTS gamification_activity_rewards (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL CHECK (source_type IN ('lesson', 'quiz', 'live')),
      source_id TEXT NOT NULL,
      xp INTEGER NOT NULL CHECK (xp >= 0),
      points INTEGER NOT NULL CHECK (points >= 0),
      awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, source_type, source_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS gamification_student_stats (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
      level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
      current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
      longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS gamification_badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      criteria TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS gamification_achievements (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, badge_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS gamification_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
      xp_reward INTEGER NOT NULL CHECK (xp_reward >= 0),
      points_reward INTEGER NOT NULL CHECK (points_reward >= 0),
      criteria TEXT NOT NULL DEFAULT 'lesson_today',
      sort_order INTEGER NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true
    )
  `
  await ensureColumns('gamification_challenges', {
    criteria: "TEXT NOT NULL DEFAULT 'lesson_today'",
  })
  await sql`
    CREATE TABLE IF NOT EXISTS gamification_challenge_completions (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES gamification_challenges(id) ON DELETE CASCADE,
      period_key TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, challenge_id, period_key)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS gamification_activity_rewards_user_idx ON gamification_activity_rewards(user_id, awarded_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS gamification_achievements_user_idx ON gamification_achievements(user_id, unlocked_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS gamification_challenge_completions_user_idx ON gamification_challenge_completions(user_id, completed_at DESC)`

  for (const badge of gamificationBadgeSeeds) {
    await sql`
      INSERT INTO gamification_badges ${sql(badge)}
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, criteria = EXCLUDED.criteria
    `
  }
  for (const challenge of gamificationChallengeSeeds) {
    await sql`
      INSERT INTO gamification_challenges (id, title, type, criteria, xp_reward, points_reward, sort_order)
      VALUES (${challenge.id}, ${challenge.title}, ${challenge.type}, ${challenge.criteria}, ${challenge.xpReward}, ${challenge.pointsReward}, ${challenge.sortOrder})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, criteria = EXCLUDED.criteria, xp_reward = EXCLUDED.xp_reward, points_reward = EXCLUDED.points_reward, sort_order = EXCLUDED.sort_order
    `
  }

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

const requireAdminOrTutor = async (request, response, next) => {
  await requireAuthenticated(request, response, () => {
    if (request.userRole !== 'admin' && request.userRole !== 'tutor') return response.status(403).json({ message: 'Admin or tutor authentication is required.' })
    return next()
  })
}

const requireTutor = async (request, response, next) => {
  await requireAuthenticated(request, response, async () => {
    if (request.userRole !== 'tutor') return response.status(403).json({ message: 'Tutor authentication is required.' })
    const [tutor] = await sql`
      SELECT tutors.id::INTEGER AS id,
             tutors.name,
             tutors.email,
             tutors.phone,
             tutors.bio,
             tutors.status,
             to_char(tutors.created_at, 'FMMonth DD, YYYY') AS "createdAt"
      FROM tutors
      INNER JOIN users ON LOWER(TRIM(users.email)) = LOWER(TRIM(tutors.email))
      WHERE users.id = ${request.userId}
        AND users.role = 'tutor'
    `
    if (!tutor) return response.status(403).json({ message: 'Tutor profile not found.' })
    request.tutor = await addAssignedCourses(tutor)
    request.tutorId = Number(tutor.id)
    return next()
  })
}

const isValidTutorProfile = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const profile = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) return null
    profile.name = body.name.trim()
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string' || body.phone.trim().length > 40) return null
    profile.phone = body.phone.trim()
  }
  if (body.bio !== undefined) {
    if (typeof body.bio !== 'string' || body.bio.trim().length > 2000) return null
    profile.bio = body.bio.trim()
  }
  return Object.keys(profile).length ? profile : null
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

const getCourseLessons = (modules) => Array.isArray(modules)
  ? modules.flatMap((module) => Array.isArray(module?.lessons) ? module.lessons : [])
  : []

const sanitizeModulesForLearner = (modules) => Array.isArray(modules)
  ? modules.map((module) => ({
    ...module,
    lessons: Array.isArray(module?.lessons)
      ? module.lessons.map(({ quizQuestions, ...lesson }) => ({
        ...lesson,
        quizQuestions: Array.isArray(quizQuestions)
          ? quizQuestions.map(({ correctOption, ...question }) => question)
          : quizQuestions,
      }))
      : [],
  }))
  : []

const sanitizeCourseForLearner = (course) => course ? {
  ...course,
  modules: sanitizeModulesForLearner(course.modules),
} : null

const parseEnrollmentId = (value) => /^\d+$/.test(value) ? Number(value) : null
const maxEngagementSeconds = 60

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const getEnrollmentProgress = (modules, lessonProgress) => {
  const lessons = getCourseLessons(modules).filter((lesson) => lesson.type !== 'practice')
  const completedLessonIds = lessons
    .filter((lesson) => lessonProgress?.[lesson.id]?.completedAt)
    .map((lesson) => lesson.id)
  const allCompletedLessonIds = lessons
    .map((lesson) => lesson.id)
    .filter((lessonId) => completedLessonIds.includes(lessonId))

  return {
    completedLessonIds: allCompletedLessonIds,
    progressPercentage: Math.round((allCompletedLessonIds.length / Math.max(1, lessons.length)) * 100),
  }
}

const normalizeQuizAnswers = (answers, questions) => {
  const parsedAnswers = deserializeJson(answers)
  if (!isPlainObject(parsedAnswers)) return {}
  const questionIds = new Set(questions.map((question) => String(question.id)))
  const hasQuestionId = (value) => questionIds.has(value)
  const directAnswers = Object.fromEntries(Object.entries(parsedAnswers).filter(([id]) => hasQuestionId(id)))
  if (Object.keys(directAnswers).length > 0) return directAnswers
  for (const key of ['answers', 'responses']) {
    const nestedAnswers = deserializeJson(parsedAnswers[key])
    if (!isPlainObject(nestedAnswers)) continue
    const matchingAnswers = Object.fromEntries(Object.entries(nestedAnswers).filter(([id]) => hasQuestionId(id)))
    if (Object.keys(matchingAnswers).length > 0) return matchingAnswers
  }
  return directAnswers
}

const getQuestionResults = (modules, attempt) => {
  if (!attempt?.submittedAt) return undefined
  const questions = getCourseLessons(modules).find((lesson) => lesson?.id === attempt.lessonId)?.quizQuestions ?? []
  const answers = normalizeQuizAnswers(attempt.answers, questions)
  return questions.map((question) => {
    const rawRecord = answers[String(question.id)]
    const record = Number.isInteger(rawRecord) ? { status: 'answered', value: rawRecord } : rawRecord
    const selected = selectedOptionFromRecord(record, question)
    const studentAnswer = typeof record?.value === 'string'
      ? record.value
      : Array.isArray(record?.value)
        ? record.value.join(', ')
        : selected === null
          ? null
          : question.options[selected] ?? null
    return { questionId: Number(question.id), question: question.question, studentAnswer, correctAnswer: question.options[question.correctOption] ?? null, status: record?.status ?? 'unanswered' }
  })
}

const serializeEnrollment = (enrollment) => {
  const modules = deserializeJson(enrollment.modules)
  const rawLessonProgress = deserializeJson(enrollment.lessonProgress)
  const rawQuizAttempts = deserializeJson(enrollment.quizAttempts)
  const lessonProgress = isPlainObject(rawLessonProgress) ? rawLessonProgress : {}
  const quizAttempts = Array.isArray(rawQuizAttempts) ? rawQuizAttempts.map((attempt) => ({ ...attempt, questionResults: getQuestionResults(modules, attempt) })) : []
  const { completedLessonIds, progressPercentage } = getEnrollmentProgress(modules, lessonProgress)

  return {
    ...enrollment,
    modules: sanitizeModulesForLearner(modules),
    classSchedule: isPlainObject(deserializeJson(enrollment.classSchedule)) ? deserializeJson(enrollment.classSchedule) : null,
    lessonProgress,
    quizAttempts,
    completedLessonIds,
    started: Object.keys(lessonProgress).length > 0,
    timeSpentSeconds: Number(enrollment.timeSpentSeconds) || 0,
    attendance: deserializeJson(enrollment.attendance) ?? {},
    progressPercentage,
  }
}

const gamificationLevelThresholds = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3400]
const getGamificationLevelInfo = (xp) => {
  let levelIndex = 0
  gamificationLevelThresholds.forEach((threshold, index) => {
    if (xp >= threshold) levelIndex = index
  })
  const currentThreshold = gamificationLevelThresholds[levelIndex]
  const nextThreshold = gamificationLevelThresholds[levelIndex + 1] ?? currentThreshold + (levelIndex + 2) * 600
  return {
    level: levelIndex + 1,
    nextLevelXp: nextThreshold,
    progress: Math.min(100, ((xp - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100),
  }
}

const getDateKey = (value) => new Date(value).toISOString().slice(0, 10)
const getGamificationStreak = (activityDates) => {
  const activeDays = new Set(activityDates.filter(Boolean).map(getDateKey))
  const today = new Date()
  const todayKey = getDateKey(today)
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayKey = getDateKey(yesterday)
  let current = 0
  if (activeDays.has(todayKey) || activeDays.has(yesterdayKey)) {
    const cursor = new Date(activeDays.has(todayKey) ? today : yesterday)
    while (activeDays.has(getDateKey(cursor))) {
      current += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }
  }

  const sortedDays = [...activeDays].sort()
  let longest = 0
  let run = 0
  sortedDays.forEach((day, index) => {
    const previous = sortedDays[index - 1]
    const difference = previous
      ? (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`)) / 86400000
      : null
    run = difference === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  })
  return { current, longest }
}

const syncGamificationActivity = async () => {
  await sql`
    DELETE FROM gamification_activity_rewards rewards
    USING class_attendance attendance
    WHERE rewards.source_type = 'live'
      AND rewards.user_id = (SELECT user_id FROM enrollments WHERE id = attendance.enrollment_id)
      AND rewards.source_id = attendance.enrollment_id::TEXT || ':' || attendance.lesson_id::TEXT
      AND attendance.status <> 'Present'
  `
  await sql`
    INSERT INTO gamification_activity_rewards (user_id, source_type, source_id, xp, points, awarded_at)
    SELECT enrollments.user_id,
           'lesson',
           enrollments.id::TEXT || ':' || progress.lesson_id::TEXT,
           25,
           10,
           progress.completed_at
    FROM enrollments
    INNER JOIN student_lesson_progress progress ON progress.enrollment_id = enrollments.id
    WHERE progress.completed_at IS NOT NULL
    ON CONFLICT (user_id, source_type, source_id) DO NOTHING
  `
  await sql`
    INSERT INTO gamification_activity_rewards (user_id, source_type, source_id, xp, points, awarded_at)
    SELECT passed_attempts.user_id,
           'quiz',
           passed_attempts.enrollment_id::TEXT || ':' || passed_attempts.lesson_id::TEXT,
           50,
           20,
           passed_attempts.submitted_at
    FROM (
      SELECT DISTINCT ON (enrollments.user_id, quiz_attempts.enrollment_id, quiz_attempts.lesson_id)
             enrollments.user_id,
             quiz_attempts.enrollment_id,
             quiz_attempts.lesson_id,
             quiz_attempts.submitted_at
      FROM quiz_attempts
      INNER JOIN enrollments ON enrollments.id = quiz_attempts.enrollment_id
      WHERE quiz_attempts.passed = true
        AND quiz_attempts.submitted_at IS NOT NULL
      ORDER BY enrollments.user_id, quiz_attempts.enrollment_id, quiz_attempts.lesson_id, quiz_attempts.submitted_at
    ) AS passed_attempts
    ON CONFLICT (user_id, source_type, source_id) DO NOTHING
  `
  await sql`
    INSERT INTO gamification_activity_rewards (user_id, source_type, source_id, xp, points, awarded_at)
    SELECT enrollments.user_id,
           'live',
           attendance.enrollment_id::TEXT || ':' || attendance.lesson_id::TEXT,
           40,
           15,
           attendance.marked_at
    FROM class_attendance attendance
    INNER JOIN enrollments ON enrollments.id = attendance.enrollment_id
    WHERE attendance.status = 'Present'
    ON CONFLICT (user_id, source_type, source_id) DO NOTHING
  `
}

const isGamificationChallengeComplete = async (userId, criteria) => {
  if (criteria === 'lesson_today') {
    const [result] = await sql`SELECT EXISTS (SELECT 1 FROM student_lesson_progress progress INNER JOIN enrollments ON enrollments.id = progress.enrollment_id WHERE enrollments.user_id = ${userId} AND progress.completed_at >= CURRENT_DATE) AS fulfilled`
    return result.fulfilled
  }
  if (criteria === 'quiz_today') {
    const [result] = await sql`SELECT EXISTS (SELECT 1 FROM quiz_attempts attempts INNER JOIN enrollments ON enrollments.id = attempts.enrollment_id WHERE enrollments.user_id = ${userId} AND attempts.passed = true AND attempts.submitted_at >= CURRENT_DATE) AS fulfilled`
    return result.fulfilled
  }
  if (criteria === 'live_today') {
    const [result] = await sql`SELECT EXISTS (SELECT 1 FROM class_attendance attendance INNER JOIN enrollments ON enrollments.id = attendance.enrollment_id WHERE enrollments.user_id = ${userId} AND attendance.status = 'Present' AND attendance.marked_at >= CURRENT_DATE) AS fulfilled`
    return result.fulfilled
  }
  if (criteria === 'live_week') {
    const [result] = await sql`SELECT COUNT(*) >= 2 AS fulfilled FROM class_attendance attendance INNER JOIN enrollments ON enrollments.id = attendance.enrollment_id WHERE enrollments.user_id = ${userId} AND attendance.status = 'Present' AND attendance.marked_at >= date_trunc('week', CURRENT_DATE)`
    return result.fulfilled
  }
  const [result] = await sql`SELECT COUNT(*) >= 3 AS fulfilled FROM student_lesson_progress progress INNER JOIN enrollments ON enrollments.id = progress.enrollment_id WHERE enrollments.user_id = ${userId} AND progress.completed_at >= date_trunc('week', CURRENT_DATE)`
  return result.fulfilled
}

const syncGamificationForUser = async (userId) => {
  const challenges = await sql`
    SELECT id, title, type, criteria, xp_reward AS "xpReward", points_reward AS "pointsReward"
    FROM gamification_challenges
    WHERE active = true
    ORDER BY type, sort_order
  `
  const dailyChallenges = challenges.filter((challenge) => challenge.type === 'daily')
  const weeklyChallenges = challenges.filter((challenge) => challenge.type === 'weekly')
  const dayIndex = Math.floor(Date.now() / 86400000)
  const selectedChallenges = [
    dailyChallenges[dayIndex % dailyChallenges.length],
    dailyChallenges[(dayIndex + 1) % dailyChallenges.length],
    weeklyChallenges[Math.floor(dayIndex / 7) % weeklyChallenges.length],
  ].filter(Boolean)
  const [periods] = await sql`SELECT CURRENT_DATE::TEXT AS today, date_trunc('week', CURRENT_DATE)::DATE::TEXT AS week`
  const challengeResults = []
  for (const challenge of selectedChallenges) {
    const periodKey = challenge.type === 'daily' ? periods.today : periods.week
    const fulfilled = await isGamificationChallengeComplete(userId, challenge.criteria)
    if (fulfilled) {
      await sql`
        INSERT INTO gamification_challenge_completions (user_id, challenge_id, period_key)
        VALUES (${userId}, ${challenge.id}, ${periodKey})
        ON CONFLICT (user_id, challenge_id, period_key) DO NOTHING
      `
    }
    const [completion] = await sql`
      SELECT completed_at AS "completedAt"
      FROM gamification_challenge_completions
      WHERE user_id = ${userId} AND challenge_id = ${challenge.id} AND period_key = ${periodKey}
    `
    challengeResults.push({ ...challenge, completed: Boolean(completion), completedAt: completion?.completedAt ?? null })
  }

  const [statsTotals] = await sql`
    SELECT COALESCE(SUM(rewards.xp), 0)::INTEGER AS xp,
           COALESCE(SUM(rewards.points), 0)::INTEGER AS points
    FROM (
      SELECT xp, points FROM gamification_activity_rewards WHERE user_id = ${userId}
      UNION ALL
      SELECT challenges.xp_reward AS xp, challenges.points_reward AS points
      FROM gamification_challenge_completions completions
      INNER JOIN gamification_challenges challenges ON challenges.id = completions.challenge_id
      WHERE completions.user_id = ${userId}
    ) AS rewards
  `
  const activityDates = await sql`
    SELECT progress.completed_at AS "activityDate"
    FROM student_lesson_progress progress
    INNER JOIN enrollments ON enrollments.id = progress.enrollment_id
    WHERE enrollments.user_id = ${userId} AND progress.completed_at IS NOT NULL
    UNION ALL
    SELECT attempts.submitted_at AS "activityDate"
    FROM quiz_attempts attempts
    INNER JOIN enrollments ON enrollments.id = attempts.enrollment_id
    WHERE enrollments.user_id = ${userId} AND attempts.passed = true AND attempts.submitted_at IS NOT NULL
    UNION ALL
    SELECT attendance.marked_at AS "activityDate"
    FROM class_attendance attendance
    INNER JOIN enrollments ON enrollments.id = attendance.enrollment_id
    WHERE enrollments.user_id = ${userId} AND attendance.status = 'Present'
  `
  const streak = getGamificationStreak(activityDates.map((activity) => activity.activityDate))
  const level = getGamificationLevelInfo(Number(statsTotals.xp))
  await sql`
    INSERT INTO gamification_student_stats (user_id, xp, level, points, current_streak, longest_streak)
    VALUES (${userId}, ${statsTotals.xp}, ${level.level}, ${statsTotals.points}, ${streak.current}, ${streak.longest})
    ON CONFLICT (user_id) DO UPDATE SET xp = EXCLUDED.xp, level = EXCLUDED.level, points = EXCLUDED.points, current_streak = EXCLUDED.current_streak, longest_streak = EXCLUDED.longest_streak, updated_at = NOW()
  `

  const [courseMilestone] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM enrollments
      LEFT JOIN courses ON courses.id = enrollments.course_id
      LEFT JOIN classes ON classes.id = enrollments.class_id
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(CASE WHEN enrollments.class_id IS NULL THEN courses.modules ELSE classes.modules END) = 'array'
          THEN CASE WHEN enrollments.class_id IS NULL THEN courses.modules ELSE classes.modules END
          ELSE '[]'::jsonb END
      ) AS modules
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(modules.value->'lessons') = 'array' THEN modules.value->'lessons' ELSE '[]'::jsonb END
      ) AS lessons
      LEFT JOIN student_lesson_progress progress ON progress.enrollment_id = enrollments.id AND progress.lesson_id = (lessons.value->>'id')::BIGINT
      WHERE enrollments.user_id = ${userId}
      GROUP BY enrollments.id
      HAVING COUNT(*) > 0 AND COUNT(*) FILTER (WHERE progress.completed_at IS NOT NULL) = COUNT(*)
    ) AS completed
  `
  const [attendanceMilestone] = await sql`
    SELECT COUNT(*)::INTEGER AS total,
           COUNT(*) FILTER (WHERE attendance.status = 'Present')::INTEGER AS present
    FROM enrollments
    INNER JOIN classes ON classes.id = enrollments.class_id
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(classes.modules) = 'array' THEN classes.modules ELSE '[]'::jsonb END
    ) AS modules
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(modules.value->'lessons') = 'array' THEN modules.value->'lessons' ELSE '[]'::jsonb END
    ) AS lessons
    LEFT JOIN class_attendance attendance ON attendance.enrollment_id = enrollments.id AND attendance.lesson_id = (lessons.value->>'id')::BIGINT
    WHERE enrollments.user_id = ${userId} AND enrollments.class_status = 'enrolled' AND lessons.value->>'type' = 'live'
  `
  const [lessonMilestone] = await sql`SELECT COUNT(*)::INTEGER AS total FROM gamification_activity_rewards WHERE user_id = ${userId} AND source_type = 'lesson'`
  const [quizMilestone] = await sql`SELECT COUNT(*)::INTEGER AS total FROM gamification_activity_rewards WHERE user_id = ${userId} AND source_type = 'quiz'`
  const [activityCounts] = await sql`
    SELECT COUNT(*) FILTER (WHERE source_type = 'lesson')::INTEGER AS "lessonCount",
           COUNT(*) FILTER (WHERE source_type = 'quiz')::INTEGER AS "quizCount",
           COUNT(*) FILTER (WHERE source_type = 'live')::INTEGER AS "liveCount"
    FROM gamification_activity_rewards
    WHERE user_id = ${userId}
  `
  const badgeUnlocks = [
    ['first-quiz-passed', Number(quizMilestone.total) > 0],
    ['seven-day-streak', streak.longest >= 7],
    ['perfect-attendance', Number(attendanceMilestone.total) > 0 && Number(attendanceMilestone.total) === Number(attendanceMilestone.present)],
    ['course-completed', courseMilestone.completed],
    ['lesson-momentum', Number(lessonMilestone.total) >= 10],
  ]
  for (const [badgeId, unlocked] of badgeUnlocks) {
    if (unlocked) {
      await sql`
        INSERT INTO gamification_achievements (user_id, badge_id)
        VALUES (${userId}, ${badgeId})
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `
    }
  }

  return { stats: { student_id: Number(userId), xp: Number(statsTotals.xp), level: level.level, points: Number(statsTotals.points), current_streak: streak.current, longest_streak: streak.longest, next_level_xp: level.nextLevelXp, level_progress: level.progress, lesson_count: Number(activityCounts.lessonCount), quiz_count: Number(activityCounts.quizCount), live_count: Number(activityCounts.liveCount) }, challengeResults }
}

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
    SELECT id, user_id AS "userId", course_id AS "courseId", class_id AS "classId", practice_exam_id AS "practiceExamId", student_data AS "studentData", amount::FLOAT AS amount, currency, status
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
  if (payment.practiceExamId !== null) {
    await transaction`
      INSERT INTO practice_purchases ${transaction({ user_id: payment.userId, exam_id: payment.practiceExamId, payment_id: payment.id })}
      ON CONFLICT (user_id, exam_id) DO NOTHING
    `
    return 'paid'
  }

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
      ON CONFLICT DO NOTHING
    `
    if (classRecord && classStatus === 'enrolled' && classRecord.enrolled_count + 1 >= classRecord.capacity) {
      await transaction`UPDATE classes SET status = 'full', updated_at = NOW() WHERE id = ${classRecord.id}`
    }
  }
  if (payment.courseId !== null) await transaction`UPDATE courses SET students = students + ${students.length} WHERE id = ${payment.courseId}`
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
  response.json(courses.map(deserializeCourse).map(sanitizeCourseForLearner))
})

app.get('/api/practice-exams', async (_request, response) => {
  const exams = await sql`
    SELECT id::INTEGER AS id, title, subject, grade, price::FLOAT AS price, published
    FROM practice_exams
    WHERE published = true
    ORDER BY created_at DESC, id DESC
  `
  return response.json(exams)
})

app.get('/api/practice-exams/:id', async (request, response) => {
  const examId = parseCourseId(request.params.id)
  if (examId === null) return response.status(400).json({ message: 'Invalid practice exam id.' })
  const [exam] = await sql`
    SELECT practice_exams.id::INTEGER AS id, practice_exams.title, practice_exams.subject, practice_exams.grade, practice_exams.price::FLOAT AS price, practice_exams.published
    FROM practice_exams
    WHERE practice_exams.id = ${examId} AND practice_exams.published = true
  `
  if (!exam) return response.status(403).json({ message: 'Purchase this practice exam to access its questions.' })
  const questions = await sql`
    SELECT id::INTEGER AS id, exam_id::INTEGER AS exam_id, question_text, options, correct_answer, explanation
    FROM practice_questions
    WHERE exam_id = ${examId}
    ORDER BY id
  `
  return response.json({ ...exam, questions: questions.map((question) => ({ ...question, options: deserializeJson(question.options) })) })
})

app.get('/api/courses/:id', async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid course id.' })

  const course = await readCourse(id, true)
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(sanitizeCourseForLearner(course))
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

app.get('/api/gamification', requireAuthenticated, async (request, response) => {
  await syncGamificationActivity()
  const { stats, challengeResults } = await syncGamificationForUser(request.userId)
  const badges = await sql`
    SELECT id, name, icon, description, criteria
    FROM gamification_badges
    ORDER BY id
  `
  const achievements = await sql`
    SELECT id::TEXT AS id, user_id AS student_id, badge_id, unlocked_at
    FROM gamification_achievements
    WHERE user_id = ${request.userId}
    ORDER BY unlocked_at DESC
  `
  const [classContext] = await sql`
    SELECT enrollments.class_id AS "classId", classes.title AS "classTitle"
    FROM enrollments
    INNER JOIN classes ON classes.id = enrollments.class_id
    WHERE enrollments.user_id = ${request.userId} AND enrollments.class_id IS NOT NULL
    ORDER BY enrollments.created_at DESC
    LIMIT 1
  `
  const leaderboard = await sql`
    WITH cohort_users AS (
      SELECT DISTINCT enrollments.user_id
      FROM enrollments
      WHERE enrollments.class_id = ${classContext?.classId ?? null}
    )
    SELECT users.id::INTEGER AS id,
           COALESCE(NULLIF(users.name, ''), users.email) AS name,
           LEFT(COALESCE(NULLIF(users.name, ''), users.email), 1) AS avatar,
           (COALESCE(activity_totals.xp, 0) + COALESCE(challenge_totals.xp, 0))::INTEGER AS xp,
           users.id = ${request.userId} AS "isCurrentStudent"
    FROM cohort_users
    INNER JOIN users ON users.id = cohort_users.user_id
    LEFT JOIN (
      SELECT user_id, SUM(xp)::INTEGER AS xp
      FROM gamification_activity_rewards
      GROUP BY user_id
    ) activity_totals ON activity_totals.user_id = users.id
    LEFT JOIN (
      SELECT completions.user_id, SUM(challenges.xp_reward)::INTEGER AS xp
      FROM gamification_challenge_completions completions
      INNER JOIN gamification_challenges challenges ON challenges.id = completions.challenge_id
      GROUP BY completions.user_id
    ) challenge_totals ON challenge_totals.user_id = users.id
    ORDER BY xp DESC, name
    LIMIT 20
  `
  return response.json({
    stats,
    badges,
    achievements,
    challenges: challengeResults.map(({ criteria: _criteria, ...challenge }) => ({
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      xp_reward: Number(challenge.xpReward),
      points_reward: Number(challenge.pointsReward),
      completed: challenge.completed,
      completed_at: challenge.completedAt,
    })),
    leaderboard,
    classTitle: classContext?.classTitle ?? null,
  })
})

app.get('/api/enrollments', requireAuthenticated, async (request, response) => {
  await sql`UPDATE classes SET status = 'closed', updated_at = NOW() WHERE (schedule->>'endDate') IS NOT NULL AND (schedule->>'endDate') < CURRENT_DATE::TEXT AND status <> 'closed'`
  const enrollments = await sql`
    SELECT enrollments.id::INTEGER AS id,
           enrollments.course_id::INTEGER AS "courseId",
           courses.title AS "courseTitle",
           courses.cover AS "courseCover",
           courses.category,
           courses.level,
           courses.tutor,
           courses.certificate,
           CASE WHEN classes.id IS NULL THEN courses.modules ELSE classes.modules END AS modules,
           classes.id::INTEGER AS "classId",
           classes.title AS "classTitle",
           tutors.name AS "classTutor",
           classes.schedule AS "classSchedule",
           classes.meeting_link AS "meetingLink",
           classes.status AS "classStatus",
           lesson_summary."lessonProgress",
           lesson_summary."timeSpentSeconds",
           lesson_summary."lastActivityAt",
           quiz_summary."quizAttempts",
           attendance_summary.attendance,
           session_join_summary."sessionJoinClicks"
    FROM enrollments
    INNER JOIN payments ON payments.id = enrollments.payment_id AND payments.status = 'paid'
    LEFT JOIN courses ON courses.id = enrollments.course_id
    INNER JOIN students ON students.id = enrollments.student_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    LEFT JOIN tutors ON tutors.id = classes.tutor_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(
               lesson_id::TEXT,
               jsonb_build_object(
                 'startedAt', started_at,
                 'completedAt', completed_at,
                 'activeSeconds', active_seconds,
                 'videoPositionSeconds', video_position_seconds,
                 'lastAccessedAt', last_accessed_at
               )
             ), '{}'::jsonb) AS "lessonProgress",
             COALESCE(SUM(active_seconds), 0)::INTEGER AS "timeSpentSeconds",
             MAX(last_accessed_at) AS "lastActivityAt"
      FROM student_lesson_progress
      WHERE enrollment_id = enrollments.id
    ) AS lesson_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_agg(
               jsonb_build_object(
                 'id', id,
                 'lessonId', lesson_id,
                 'startedAt', started_at,
                 'activeSeconds', active_seconds,
                 'answers', COALESCE(answers, '{}'::jsonb),
                 'violations', COALESCE(violations, '[]'::jsonb),
                 'score', score,
                 'passed', passed,
                 'disqualified', disqualified,
                 'retakeApproved', retake_approved,
                 'submittedAt', submitted_at
               )
               ORDER BY started_at DESC
             ), '[]'::jsonb) AS "quizAttempts"
      FROM quiz_attempts
      WHERE enrollment_id = enrollments.id
    ) AS quiz_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, status), '{}'::jsonb) AS attendance
      FROM class_attendance
      WHERE enrollment_id = enrollments.id
    ) AS attendance_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, clicked_at), '{}'::jsonb) AS "sessionJoinClicks"
      FROM class_session_join_logs
      WHERE enrollment_id = enrollments.id
    ) AS session_join_summary ON true
    WHERE enrollments.user_id = ${request.userId}
    ORDER BY lesson_summary."lastActivityAt" DESC NULLS LAST, enrollments.created_at DESC
  `
  response.json(enrollments.map(serializeEnrollment))
})

const getOwnedEnrollment = async (transaction, userId, enrollmentId) => {
  const [enrollment] = await transaction`
    SELECT enrollments.id,
           enrollments.course_id AS "courseId",
           enrollments.class_id AS "classId",
           CASE WHEN enrollments.class_id IS NULL THEN courses.modules ELSE classes.modules END AS modules
    FROM enrollments
    INNER JOIN payments ON payments.id = enrollments.payment_id AND payments.status = 'paid'
    LEFT JOIN courses ON courses.id = enrollments.course_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    WHERE enrollments.id = ${enrollmentId}
      AND enrollments.user_id = ${userId}
    FOR UPDATE OF enrollments
  `
  return enrollment ?? null
}

const findCourseLesson = (modules, lessonId) => getCourseLessons(deserializeJson(modules)).find((lesson) => lesson?.id === lessonId) ?? null

const quizAnswerStatuses = new Set(['unanswered', 'answered', 'expired'])
const isValidQuizAnswerValue = (value) => value === null || typeof value === 'string' || Number.isInteger(value) || (Array.isArray(value) && value.every((item) => typeof item === 'string'))
const parseQuizAnswerRecord = (value) => {
  if (!isPlainObject(value) || !quizAnswerStatuses.has(value.status) || !isValidQuizAnswerValue(value.value)) return null
  return { status: value.status, value: value.value }
}
const parseQuizAnswers = (answers, questions) => {
  if (!isPlainObject(answers)) return null
  const expected = new Set(questions.map((question) => String(question?.id)))
  const entries = Object.entries(answers)
  if (entries.length !== questions.length || entries.some(([id, value]) => !expected.has(id) || !parseQuizAnswerRecord(value))) return null
  return Object.fromEntries(entries.map(([id, value]) => [id, parseQuizAnswerRecord(value)]))
}
const selectedOptionFromRecord = (record, question) => {
  const value = Number.isInteger(record) ? record : ['answered', 'expired'].includes(record?.status) ? record.value : null
  return Number.isInteger(value) && value >= 0 && value < (question?.options?.length ?? 0) ? value : null
}


app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/engagement', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  const activeSeconds = request.body?.activeSeconds
  const videoPositionSeconds = request.body?.videoPositionSeconds
  const quizAttemptId = request.body?.quizAttemptId

  if (enrollmentId === null || lessonId === null || !Number.isInteger(activeSeconds) || activeSeconds < 0 || activeSeconds > maxEngagementSeconds || (videoPositionSeconds !== undefined && (!Number.isFinite(videoPositionSeconds) || videoPositionSeconds < 0)) || (quizAttemptId !== undefined && (!Number.isInteger(quizAttemptId) || quizAttemptId <= 0))) {
    return response.status(400).json({ message: 'Invalid lesson engagement.' })
  }

  const progress = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    if (!findCourseLesson(enrollment.modules, lessonId)) return { error: 'Lesson not found.' }

    const [lessonProgress] = await transaction`
      INSERT INTO student_lesson_progress (enrollment_id, lesson_id, active_seconds, video_position_seconds)
      VALUES (${enrollmentId}, ${lessonId}, ${activeSeconds}, ${videoPositionSeconds ?? 0})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE
      SET active_seconds = student_lesson_progress.active_seconds + ${activeSeconds},
          video_position_seconds = CASE
            WHEN ${videoPositionSeconds ?? null}::NUMERIC IS NULL THEN student_lesson_progress.video_position_seconds
            ELSE ${videoPositionSeconds ?? 0}
          END,
          last_accessed_at = NOW()
      RETURNING started_at AS "startedAt",
                completed_at AS "completedAt",
                active_seconds AS "activeSeconds",
                video_position_seconds::FLOAT AS "videoPositionSeconds",
                last_accessed_at AS "lastAccessedAt"
    `

    if (quizAttemptId !== undefined) {
      const [quizAttempt] = await transaction`
        UPDATE quiz_attempts
        SET active_seconds = active_seconds + ${activeSeconds}, updated_at = NOW()
        WHERE id = ${quizAttemptId}
          AND enrollment_id = ${enrollmentId}
          AND lesson_id = ${lessonId}
          AND submitted_at IS NULL
        RETURNING id
      `
      if (!quizAttempt) return { error: 'Quiz attempt is no longer active.' }
    }

    return { lessonProgress }
  })

  if (!progress) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (progress.error) return response.status(404).json({ message: progress.error })
  return response.json(progress.lessonProgress)
})

app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/complete', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  if (enrollmentId === null || lessonId === null) return response.status(400).json({ message: 'Invalid lesson.' })

  const completion = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    if (!lesson) return { error: 'Lesson not found.' }

    if (lesson.type === 'quiz') {
      const [completedAttempt] = await transaction`
        SELECT id
        FROM quiz_attempts
        WHERE enrollment_id = ${enrollmentId}
          AND lesson_id = ${lessonId}
          AND submitted_at IS NOT NULL
        LIMIT 1
      `
      if (!completedAttempt) return { error: 'Submit the quiz before completing this lesson.' }
    }

    const [lessonProgress] = await transaction`
      INSERT INTO student_lesson_progress (enrollment_id, lesson_id, completed_at)
      VALUES (${enrollmentId}, ${lessonId}, NOW())
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE
      SET completed_at = COALESCE(student_lesson_progress.completed_at, NOW()),
          last_accessed_at = NOW()
      RETURNING started_at AS "startedAt",
                completed_at AS "completedAt",
                active_seconds AS "activeSeconds",
                video_position_seconds::FLOAT AS "videoPositionSeconds",
                last_accessed_at AS "lastAccessedAt"
    `
    return { lessonProgress }
  })

  if (!completion) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (completion.error) return response.status(400).json({ message: completion.error })
  return response.json(completion.lessonProgress)
})

app.post('/api/enrollments/:enrollmentId/live-sessions/:lessonId/join', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  if (enrollmentId === null || lessonId === null) return response.status(400).json({ message: 'Invalid live session.' })

  const joinLog = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    if (enrollment.classId === null) return { error: 'Live session not found.' }
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    if (!lesson || lesson.type !== 'live') return { error: 'Live session not found.' }
    const [saved] = await transaction`
      INSERT INTO class_session_join_logs (enrollment_id, lesson_id)
      VALUES (${enrollmentId}, ${lessonId})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET clicked_at = NOW()
      RETURNING clicked_at AS "clickedAt"
    `
    return { clickedAt: saved.clickedAt }
  })

  if (!joinLog) return response.status(404).json({ message: 'Class enrollment not found.' })
  if (joinLog.error) return response.status(404).json({ message: joinLog.error })
  return response.status(201).json(joinLog)
})

app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/quiz-attempts', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  if (enrollmentId === null || lessonId === null) return response.status(400).json({ message: 'Invalid quiz lesson.' })

  const quizAttempt = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    if (!lesson || lesson.type !== 'quiz') return { error: 'Quiz lesson not found.' }

    const completedAttempts = await transaction`
      SELECT id, answers, violations, disqualified, passed, retake_approved AS "retakeApproved"
      FROM quiz_attempts
      WHERE enrollment_id = ${enrollmentId}
        AND lesson_id = ${lessonId}
        AND submitted_at IS NOT NULL
      ORDER BY submitted_at DESC
    `
    if (completedAttempts.length > 0) {
      const latestAttempt = completedAttempts[0]
      const hasApprovedRetake = completedAttempts.some((attempt) => attempt.retakeApproved)
      const violations = deserializeJson(latestAttempt.violations)
      const answers = deserializeJson(latestAttempt.answers)
      const hasExpiredAnswer = isPlainObject(answers) && Object.values(answers).some((answer) => deserializeJson(answer)?.status === 'expired')
      const requiresApproval = latestAttempt.disqualified || (Array.isArray(violations) && violations.length > 0)
      if (completedAttempts.length >= 2) return { error: 'Only one quiz retake is allowed.' }
      if (latestAttempt.passed) return { error: 'Passed quizzes cannot be retaken.' }
      if (requiresApproval && !hasApprovedRetake) return { error: 'An administrator must approve a retake after a quiz violation.' }
      if (!requiresApproval && !hasExpiredAnswer && !hasApprovedRetake) return { error: 'Only a timer-expired quiz can be retaken.' }
    }

    const [attempt] = await transaction`
      INSERT INTO quiz_attempts (enrollment_id, lesson_id)
      VALUES (${enrollmentId}, ${lessonId})
      ON CONFLICT (enrollment_id, lesson_id) WHERE submitted_at IS NULL
      DO UPDATE SET updated_at = NOW()
      RETURNING id::INTEGER AS id,
                lesson_id::INTEGER AS "lessonId",
                started_at AS "startedAt",
                active_seconds AS "activeSeconds",
                COALESCE(answers, '{}'::jsonb) AS answers,
                COALESCE(violations, '[]'::jsonb) AS violations,
                score,
                passed,
                disqualified,
                submitted_at AS "submittedAt"
    `
    return { attempt }
  })

  if (!quizAttempt) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (quizAttempt.error) return response.status(404).json({ message: quizAttempt.error })
  return response.status(201).json(quizAttempt.attempt)
})

app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/quiz-attempts/:attemptId/violations', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  const attemptId = parseEnrollmentId(request.params.attemptId)
  const violation = request.body?.violation
  if (enrollmentId === null || lessonId === null || attemptId === null || !isPlainObject(violation) || !['visibility', 'fullscreen'].includes(violation.type) || typeof violation.occurredAt !== 'string' || Number.isNaN(Date.parse(violation.occurredAt))) return response.status(400).json({ message: 'Invalid quiz violation.' })

  const saved = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    if (!lesson || lesson.type !== 'quiz') return { error: 'Quiz lesson not found.' }
    const [attempt] = await transaction`
      UPDATE quiz_attempts
      SET violations = COALESCE(violations, '[]'::jsonb) || ${JSON.stringify([{ type: violation.type, occurredAt: violation.occurredAt }])}::jsonb,
          updated_at = NOW()
      WHERE id = ${attemptId} AND enrollment_id = ${enrollmentId} AND lesson_id = ${lessonId} AND submitted_at IS NULL
      RETURNING id::INTEGER AS id, lesson_id::INTEGER AS "lessonId", started_at AS "startedAt", active_seconds AS "activeSeconds", COALESCE(answers, '{}'::jsonb) AS answers, COALESCE(violations, '[]'::jsonb) AS violations, score, passed, submitted_at AS "submittedAt"
    `
    return attempt ? { attempt } : { error: 'Quiz attempt is no longer active.' }
  })
  if (!saved) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (saved.error) return response.status(400).json({ message: saved.error })
  return response.json(saved.attempt)
})

app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/quiz-attempts/:attemptId/answers', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  const attemptId = parseEnrollmentId(request.params.attemptId)
  const questionId = parseEnrollmentId(String(request.body?.questionId ?? ''))
  const answer = parseQuizAnswerRecord(request.body?.answer)
  if (enrollmentId === null || lessonId === null || attemptId === null || questionId === null || !answer) return response.status(400).json({ message: 'Invalid quiz answer.' })

  const saved = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    const question = (lesson?.quizQuestions ?? []).find((item) => Number(item?.id) === questionId)
    if (!lesson || lesson.type !== 'quiz' || !question) return { error: 'Quiz question not found.' }
    const [attempt] = await transaction`
      UPDATE quiz_attempts
      SET answers = CASE
            WHEN COALESCE(answers->${String(questionId)}->>'status', '') = 'expired' THEN COALESCE(answers, '{}'::jsonb)
            ELSE COALESCE(answers, '{}'::jsonb) || ${JSON.stringify({ [questionId]: answer })}::JSONB
          END,
          updated_at = NOW()
      WHERE id = ${attemptId} AND enrollment_id = ${enrollmentId} AND lesson_id = ${lessonId} AND submitted_at IS NULL
      RETURNING id::INTEGER AS id, lesson_id::INTEGER AS "lessonId", started_at AS "startedAt", active_seconds AS "activeSeconds", COALESCE(answers, '{}'::jsonb) AS answers, score, passed, submitted_at AS "submittedAt"
    `
    return attempt ? { attempt } : { error: 'Quiz attempt is no longer active.' }
  })
  if (!saved) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (saved.error) return response.status(400).json({ message: saved.error })
  return response.json(saved.attempt)
})

app.post('/api/enrollments/:enrollmentId/lessons/:lessonId/quiz-attempts/:attemptId/submit', requireAuthenticated, async (request, response) => {
  const enrollmentId = parseEnrollmentId(request.params.enrollmentId)
  const lessonId = parseEnrollmentId(request.params.lessonId)
  const attemptId = parseEnrollmentId(request.params.attemptId)
  const answers = request.body?.answers
  const disqualified = request.body?.disqualified === true
  if (enrollmentId === null || lessonId === null || attemptId === null || !isPlainObject(answers) || (request.body?.disqualified !== undefined && typeof request.body.disqualified !== 'boolean')) return response.status(400).json({ message: 'Invalid quiz submission.' })

  const result = await sql.begin(async (transaction) => {
    const enrollment = await getOwnedEnrollment(transaction, request.userId, enrollmentId)
    if (!enrollment) return null
    const lesson = findCourseLesson(enrollment.modules, lessonId)
    const questions = Array.isArray(lesson?.quizQuestions) ? lesson.quizQuestions : []
    if (!lesson || lesson.type !== 'quiz' || !questions.length) return { error: 'Quiz questions are unavailable.' }

    const parsedAnswers = parseQuizAnswers(answers, questions)
    if (!parsedAnswers) return { error: 'Invalid quiz answer records.' }

    const correctAnswers = questions.filter((question) => selectedOptionFromRecord(parsedAnswers[String(question.id)], question) === question.correctOption).length
    const score = Math.round((correctAnswers / questions.length) * 100)
    const passThreshold = Number.isInteger(lesson.passThreshold) ? lesson.passThreshold : 70
    const passed = !disqualified && score >= passThreshold
    const [attempt] = await transaction`
      UPDATE quiz_attempts
      SET answers = ${JSON.stringify(parsedAnswers)}::JSONB,
          score = ${score},
          passed = ${passed},
          disqualified = ${disqualified},
          submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = ${attemptId}
        AND enrollment_id = ${enrollmentId}
        AND lesson_id = ${lessonId}
        AND submitted_at IS NULL
      RETURNING id::INTEGER AS id,
                lesson_id::INTEGER AS "lessonId",
                started_at AS "startedAt",
                active_seconds AS "activeSeconds",
                answers,
                violations,
                score,
                passed,
                disqualified,
                submitted_at AS "submittedAt"
    `
    if (!attempt) return { error: 'Quiz attempt is no longer active.' }
    return { attempt: { ...attempt, questionResults: getQuestionResults(deserializeJson(enrollment.modules), attempt) } }
  })

  if (!result) return response.status(404).json({ message: 'Course enrollment not found.' })
  if (result.error) return response.status(400).json({ message: result.error })
  return response.json(result.attempt)
})

app.post('/api/admin/quiz-attempts/:attemptId/retake-approval', requireAdmin, async (request, response) => {
  const attemptId = parseEnrollmentId(request.params.attemptId)
  if (attemptId === null) return response.status(400).json({ message: 'Invalid quiz attempt.' })
  const [attempt] = await sql`
    UPDATE quiz_attempts
    SET retake_approved = true, updated_at = NOW()
    WHERE id = ${attemptId} AND submitted_at IS NOT NULL
    RETURNING id::INTEGER AS id, retake_approved AS "retakeApproved"
  `
  if (!attempt) return response.status(404).json({ message: 'Quiz attempt not found.' })
  return response.json(attempt)
})

app.post('/api/payments/chapa', requireAuthenticated, async (request, response) => {
  const courseId = parseCourseId(String(request.body?.courseId ?? ''))
  const practiceExamId = parseCourseId(String(request.body?.practiceExamId ?? ''))
  if (courseId === null && practiceExamId === null) return response.status(400).json({ message: 'Choose a valid course or practice exam.' })
  if (courseId !== null && practiceExamId !== null) return response.status(400).json({ message: 'Choose only one item.' })
  if (!isTestChapa && !process.env.CHAPA_SECRET_KEY) return response.status(503).json({ message: 'Chapa checkout has not been configured yet.' })

  const [course] = courseId === null ? [null] : await sql`
    SELECT courses.id, courses.title, courses.price::FLOAT AS price, users.name, users.email, users.phone
    FROM courses
    INNER JOIN users ON users.id = ${request.userId}
    WHERE courses.id = ${courseId}
      AND courses.status = 'Published'
  `
  const [practiceExam] = practiceExamId === null ? [null] : await sql`
    SELECT practice_exams.id, practice_exams.title, practice_exams.price::FLOAT AS price, users.name, users.email, users.phone
    FROM practice_exams
    INNER JOIN users ON users.id = ${request.userId}
    WHERE practice_exams.id = ${practiceExamId}
      AND practice_exams.published = true
  `
  const item = course ?? practiceExam
  if (!item) return response.status(404).json({ message: 'This item is not available for purchase.' })

  const students = [{
    fullName: item.name.trim() || 'Student',
    ageOrGrade: 'Not provided',
    relationship: 'Self',
    preferredLanguage: 'Not provided',
    emergencyPhone: '',
    notes: '',
  }]
  const referencePrefix = isTestChapa ? (practiceExam ? 'test-practice' : 'test-course') : (practiceExam ? 'practice' : 'course')
  const reference = `${referencePrefix}-${item.id}-${randomBytes(12).toString('hex')}`
  const currency = process.env.CHAPA_CURRENCY ?? 'ETB'
  const amount = item.price * students.length
  const [payment] = await sql`
    INSERT INTO payments ${sql({ reference, user_id: request.userId, course_id: course?.id ?? null, practice_exam_id: practiceExam?.id ?? null, student_data: JSON.stringify(students), amount, currency })}
    RETURNING id
  `

  if (isTestChapa) return response.status(201).json({ checkoutUrl: '', paymentReference: reference, mode: 'test' })

  const baseUrl = process.env.APP_URL ?? `${request.protocol}://${request.get('host')}`
  const nameParts = item.name.trim().split(/\s+/)
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
          email: item.email,
          phone_number: item.phone || undefined,
        },
        meta: practiceExam ? { order_id: reference, practice_exam_id: practiceExam.id } : { order_id: reference, course_id: course.id },
        return_url: practiceExam ? `${baseUrl}/practice-exams/${practiceExam.id}?payment=${reference}` : `${baseUrl}/courses/${course.id}?payment=${reference}`,
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
           classes.price::FLOAT AS price,
           users.name,
           users.email,
           users.phone
    FROM classes
    INNER JOIN users ON users.id = ${request.userId}
    WHERE classes.id = ${classId}
      AND classes.published = true
      AND classes.status IN ('open', 'full')
  `
  if (!classRecord) return response.status(404).json({ message: 'This batch is not available for enrollment.' })

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
    INSERT INTO payments ${sql({ reference, user_id: request.userId, course_id: null, class_id: classRecord.id, student_data: JSON.stringify(students), amount, currency })}
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
  if (!/^test-(?:course|class|practice)-\d+-[a-f0-9]{24}$/.test(reference) || !['paid', 'failed'].includes(status)) return response.status(400).json({ message: 'Invalid test payment.' })

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

app.get('/api/practice-purchases', requireAuthenticated, async (request, response) => {
  const purchases = await sql`
    SELECT practice_purchases.id::INTEGER AS id,
           practice_purchases.user_id::INTEGER AS user_id,
           practice_purchases.exam_id::INTEGER AS exam_id,
           practice_purchases.purchased_at
    FROM practice_purchases
    INNER JOIN practice_exams ON practice_exams.id = practice_purchases.exam_id
    WHERE practice_purchases.user_id = ${request.userId}
    ORDER BY practice_purchases.purchased_at DESC, practice_purchases.id DESC
  `
  return response.json(purchases)
})

app.get('/api/payments', requireAuthenticated, async (request, response) => {
  const payments = await sql`
    SELECT payments.id::INTEGER AS id,
           COALESCE(classes.title, courses.title, 'Class enrollment') AS "itemName",
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
    LEFT JOIN courses ON courses.id = payments.course_id
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
           jsonb_array_length(CASE WHEN jsonb_typeof(classes.modules) = 'array' THEN classes.modules ELSE '[]'::jsonb END)::INTEGER AS "moduleCount",
           (SELECT COUNT(*)::INTEGER FROM jsonb_array_elements(CASE WHEN jsonb_typeof(classes.modules) = 'array' THEN classes.modules ELSE '[]'::jsonb END) AS module CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(module->'lessons') = 'array' THEN module->'lessons' ELSE '[]'::jsonb END) AS lesson) AS "lessonCount"
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

app.get('/api/tutor/overview', requireTutor, async (request, response) => {
  const [overview] = await sql`
    SELECT
      (SELECT COUNT(*) FROM courses WHERE tutor_id = ${request.tutorId})::INTEGER AS "totalCourses",
      (SELECT COUNT(*) FROM classes WHERE tutor_id = ${request.tutorId})::INTEGER AS "totalClasses",
      (SELECT COUNT(DISTINCT enrollments.student_id)
       FROM enrollments
       LEFT JOIN courses ON courses.id = enrollments.course_id
       LEFT JOIN classes ON classes.id = enrollments.class_id
       WHERE enrollments.class_status IS DISTINCT FROM 'waitlisted'
         AND (courses.tutor_id = ${request.tutorId} OR classes.tutor_id = ${request.tutorId}))::INTEGER AS "totalStudents",
      (SELECT COALESCE(SUM(payments.amount), 0)
       FROM payments
       LEFT JOIN courses ON courses.id = payments.course_id
       LEFT JOIN classes ON classes.id = payments.class_id
       WHERE payments.status = 'paid'
         AND (courses.tutor_id = ${request.tutorId} OR classes.tutor_id = ${request.tutorId}))::FLOAT AS "totalRevenue"
  `
  const [upcoming] = await sql`
    SELECT COUNT(*)::INTEGER AS count
    FROM classes
    WHERE tutor_id = ${request.tutorId}
      AND published = true
      AND status <> 'closed'
      AND COALESCE(schedule->>'endDate', '9999-12-31') >= CURRENT_DATE::TEXT
  `
  return response.json({
    tutor: request.tutor,
    ...overview,
    upcomingClasses: upcoming.count,
  })
})

app.get('/api/tutor/courses', requireTutor, async (request, response) => {
  const courses = await sql`
    SELECT ${courseColumns}
    FROM courses
    WHERE tutor_id = ${request.tutorId}
    ORDER BY id
  `
  return response.json(courses.map(deserializeCourse))
})

app.get('/api/tutor/classes', requireTutor, async (request, response) => {
  const classes = await sql`
    SELECT classes.id::INTEGER AS id,
           classes.title,
           classes.program_id AS "programId",
           classes.schedule,
           classes.meeting_link AS "meetingLink",
           classes.price::FLOAT AS price,
           classes.status,
           classes.course_id::INTEGER AS "courseId",
           courses.title AS "courseTitle",
           classes.capacity,
           COALESCE(enrollment_counts.enrolled_count, 0)::INTEGER AS "enrolledCount",
           classes.published,
           classes.modules
    FROM classes
    LEFT JOIN courses ON courses.id = classes.course_id
    LEFT JOIN (
      SELECT class_id, COUNT(*) FILTER (WHERE class_status = 'enrolled') AS enrolled_count
      FROM enrollments
      WHERE class_id IS NOT NULL
      GROUP BY class_id
    ) AS enrollment_counts ON enrollment_counts.class_id = classes.id
    WHERE classes.tutor_id = ${request.tutorId}
    ORDER BY classes.created_at DESC, classes.id DESC
  `
  return response.json(classes.map((classRecord) => ({
    ...classRecord,
    schedule: deserializeJson(classRecord.schedule),
    modules: deserializeJson(classRecord.modules) ?? [],
  })))
})

app.put('/api/tutor/courses/:id/curriculum', requireTutor, async (request, response) => {
  const courseId = parseCourseId(request.params.id)
  const modules = request.body?.modules
  const lessons = getCourseLessons(modules)
  if (courseId === null || !Array.isArray(modules) || lessons.some((lesson) => !['video', 'article', 'quiz'].includes(lesson?.type))) {
    return response.status(400).json({ message: 'Enter valid course curriculum lessons.' })
  }
  const [updated] = await sql`
    UPDATE courses
    SET modules = ${JSON.stringify(modules)}::jsonb, updated_at = NOW()
    WHERE id = ${courseId} AND tutor_id = ${request.tutorId}
    RETURNING modules
  `
  if (!updated) return response.status(404).json({ message: 'Course not found.' })
  return response.json({ modules: deserializeJson(updated.modules) ?? [] })
})

app.put('/api/tutor/classes/:id/curriculum', requireTutor, async (request, response) => {
  const classId = parseCourseId(request.params.id)
  const modules = request.body?.modules
  const lessons = getCourseLessons(modules)
  if (classId === null || !Array.isArray(modules) || lessons.some((lesson) => !['video', 'article', 'quiz', 'live'].includes(lesson?.type))) {
    return response.status(400).json({ message: 'Enter valid class curriculum lessons.' })
  }
  const [updated] = await sql`
    UPDATE classes
    SET modules = ${JSON.stringify(modules)}::jsonb, updated_at = NOW()
    WHERE id = ${classId} AND tutor_id = ${request.tutorId}
    RETURNING modules
  `
  if (!updated) return response.status(404).json({ message: 'Class not found.' })
  return response.json({ modules: deserializeJson(updated.modules) ?? [] })
})

const evaluateAtRiskEnrollment = (record) => {
  const modules = deserializeJson(record.modules) ?? []
  const lessons = getCourseLessons(modules)
  const now = Date.now()
  const liveLessons = lessons.filter((lesson) => lesson.type === 'live' && lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() <= now).sort((first, second) => new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime())
  const attendance = deserializeJson(record.attendance) ?? {}
  let missedConsecutive = 0
  for (const lesson of liveLessons.slice().reverse()) {
    if (attendance[lesson.id]?.status === 'Present' || attendance[lesson.id] === 'Present') break
    missedConsecutive += 1
  }
  const attendedCount = liveLessons.filter((lesson) => attendance[lesson.id]?.status === 'Present' || attendance[lesson.id] === 'Present').length
  const attendanceRate = liveLessons.length ? attendedCount / liveLessons.length : 1
  const quizAttempts = (deserializeJson(record.quizAttempts) ?? []).filter((attempt) => attempt.submittedAt && attempt.score !== null && attempt.passed !== null).sort((first, second) => new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime())
  let failedConsecutive = 0
  for (const attempt of quizAttempts) {
    if (attempt.passed) break
    failedConsecutive += 1
  }
  const averageQuizScore = quizAttempts.length ? quizAttempts.reduce((total, attempt) => total + Number(attempt.score), 0) / quizAttempts.length : null
  const lessonProgress = deserializeJson(record.lessonProgress) ?? {}
  const activityDates = [
    ...Object.values(lessonProgress).flatMap((progress) => [progress.startedAt, progress.lastAccessedAt, progress.completedAt]),
    ...quizAttempts.flatMap((attempt) => [attempt.startedAt, attempt.submittedAt]),
    ...Object.values(attendance).flatMap((value) => typeof value === 'object' ? [value.markedAt] : []),
    record.enrolledDate,
  ].filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite)
  const lastActivityAt = activityDates.length ? new Date(Math.max(...activityDates)).toISOString() : null
  const inactiveDays = lastActivityAt ? (now - new Date(lastActivityAt).getTime()) / 86400000 : Infinity
  const progressPercentage = getEnrollmentProgress(modules, lessonProgress).progressPercentage
  const completedDates = Object.values(lessonProgress).map((progress) => progress.completedAt).filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite)
  const lastProgressAt = completedDates.length ? Math.max(...completedDates) : new Date(record.enrolledDate).getTime()
  const stagnantDays = (now - lastProgressAt) / 86400000
  const reasons = []
  if (missedConsecutive >= 2) reasons.push(`Missed ${missedConsecutive} live sessions in a row`)
  if (liveLessons.length > 0 && attendanceRate < 0.7) reasons.push(`Attendance ${Math.round(attendanceRate * 100)}%`)
  if (failedConsecutive >= 2) reasons.push(`Failed ${failedConsecutive} quizzes in a row`)
  if (averageQuizScore !== null && averageQuizScore < 50) reasons.push(`Quiz average ${Math.round(averageQuizScore)}%`)
  if (inactiveDays >= 7) reasons.push(`No activity for ${Math.floor(inactiveDays)} days`)
  if (progressPercentage < 100 && stagnantDays >= 7) reasons.push(`Progress unchanged for ${Math.floor(stagnantDays)} days`)
  return reasons.length ? {
    id: Number(record.id),
    studentId: Number(record.studentId),
    studentName: record.studentName,
    studentEmail: record.studentEmail,
    courseTitle: record.courseTitle,
    classTitle: record.classTitle,
    progressPercentage,
    lastActivityAt,
    reasons,
  } : null
}

const getAtRiskStudents = async ({ tutorId = null } = {}) => {
  const tutorCondition = tutorId === null ? sql`` : sql`AND (courses.tutor_id = ${tutorId} OR classes.tutor_id = ${tutorId})`
  const records = await sql`
    SELECT enrollments.id::INTEGER AS id,
           students.id::INTEGER AS "studentId",
           students.full_name AS "studentName",
           users.email AS "studentEmail",
           courses.title AS "courseTitle",
           classes.title AS "classTitle",
           enrollments.created_at AS "enrolledDate",
           CASE WHEN classes.id IS NULL THEN courses.modules ELSE classes.modules END AS modules,
           lesson_summary."lessonProgress",
           quiz_summary."quizAttempts",
           attendance_summary.attendance
    FROM enrollments
    INNER JOIN payments ON payments.id = enrollments.payment_id AND payments.status = 'paid'
    INNER JOIN students ON students.id = enrollments.student_id
    INNER JOIN users ON users.id = students.user_id
    LEFT JOIN courses ON courses.id = enrollments.course_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, jsonb_build_object('startedAt', started_at, 'completedAt', completed_at, 'lastAccessedAt', last_accessed_at)), '{}'::jsonb) AS "lessonProgress"
      FROM student_lesson_progress
      WHERE enrollment_id = enrollments.id
    ) lesson_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('startedAt', started_at, 'score', score, 'passed', passed, 'submittedAt', submitted_at) ORDER BY started_at DESC), '[]'::jsonb) AS "quizAttempts"
      FROM quiz_attempts
      WHERE enrollment_id = enrollments.id
    ) quiz_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, jsonb_build_object('status', status, 'markedAt', marked_at)), '{}'::jsonb) AS attendance
      FROM class_attendance
      WHERE enrollment_id = enrollments.id
    ) attendance_summary ON true
    WHERE (enrollments.class_id IS NULL OR enrollments.class_status = 'enrolled')
      ${tutorCondition}
    ORDER BY students.full_name, enrollments.created_at DESC
  `
  return records.map(evaluateAtRiskEnrollment).filter(Boolean)
}

app.get('/api/admin/at-risk-students', requireAdmin, async (_request, response) => response.json(await getAtRiskStudents()))
app.get('/api/tutor/at-risk-students', requireTutor, async (request, response) => response.json(await getAtRiskStudents({ tutorId: request.tutorId })))

const getTutorStudentProgress = async (contentType, contentId) => {
  const contentCondition = contentType === 'class'
    ? sql`enrollments.class_id = ${contentId} AND enrollments.class_status = 'enrolled'`
    : sql`enrollments.course_id = ${contentId} AND enrollments.class_id IS NULL`
  const students = await sql`
    SELECT enrollments.id::INTEGER AS id,
           students.id::INTEGER AS "studentId",
           students.full_name AS "studentName",
           students.age_or_grade AS "ageOrGrade",
           users.email AS "studentEmail",
           enrollments.class_status AS status,
           to_char(enrollments.created_at, 'FMMonth DD, YYYY') AS "enrolledDate",
           CASE WHEN classes.id IS NULL THEN courses.modules ELSE classes.modules END AS modules,
           lesson_summary."lessonProgress",
           lesson_summary."timeSpentSeconds",
           quiz_summary."quizAttempts",
           attendance_summary.attendance,
           session_join_summary."sessionJoinClicks"
    FROM enrollments
    INNER JOIN students ON students.id = enrollments.student_id
    INNER JOIN users ON users.id = students.user_id
    LEFT JOIN courses ON courses.id = enrollments.course_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, jsonb_build_object('completedAt', completed_at)), '{}'::jsonb) AS "lessonProgress",
             COALESCE(SUM(active_seconds), 0)::INTEGER AS "timeSpentSeconds"
      FROM student_lesson_progress
      WHERE enrollment_id = enrollments.id
    ) AS lesson_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'lessonId', lesson_id, 'startedAt', started_at, 'activeSeconds', active_seconds, 'score', score, 'passed', passed, 'disqualified', disqualified, 'retakeApproved', retake_approved, 'submittedAt', submitted_at) ORDER BY started_at DESC), '[]'::jsonb) AS "quizAttempts"
      FROM quiz_attempts
      WHERE enrollment_id = enrollments.id
    ) AS quiz_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, status), '{}'::jsonb) AS attendance
      FROM class_attendance
      WHERE enrollment_id = enrollments.id
    ) AS attendance_summary ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(jsonb_object_agg(lesson_id::TEXT, clicked_at), '{}'::jsonb) AS "sessionJoinClicks"
      FROM class_session_join_logs
      WHERE enrollment_id = enrollments.id
    ) AS session_join_summary ON true
    WHERE ${contentCondition}
    ORDER BY enrollments.created_at DESC, enrollments.id DESC
  `
  return students.map((student) => {
    const lessonProgress = deserializeJson(student.lessonProgress) ?? {}
    const modules = deserializeJson(student.modules) ?? []
    return {
      ...student,
      attendance: deserializeJson(student.attendance) ?? {},
      sessionJoinClicks: deserializeJson(student.sessionJoinClicks) ?? {},
      quizAttempts: deserializeJson(student.quizAttempts) ?? [],
      timeSpentSeconds: Number(student.timeSpentSeconds) || 0,
      progressPercentage: getEnrollmentProgress(modules, lessonProgress).progressPercentage,
    }
  })
}

app.get('/api/tutor/courses/:id/students', requireTutor, async (request, response) => {
  const courseId = parseCourseId(request.params.id)
  if (courseId === null) return response.status(400).json({ message: 'Invalid course id.' })
  const [course] = await sql`SELECT id FROM courses WHERE id = ${courseId} AND tutor_id = ${request.tutorId}`
  if (!course) return response.status(404).json({ message: 'Course not found.' })
  return response.json(await getTutorStudentProgress('course', courseId))
})

app.get('/api/tutor/classes/:id/students', requireTutor, async (request, response) => {
  const classId = parseCourseId(request.params.id)
  if (classId === null) return response.status(400).json({ message: 'Invalid class id.' })
  const [classRecord] = await sql`SELECT id FROM classes WHERE id = ${classId} AND tutor_id = ${request.tutorId}`
  if (!classRecord) return response.status(404).json({ message: 'Class not found.' })
  return response.json(await getTutorStudentProgress('class', classId))
})

app.patch('/api/tutor/classes/enrollments/:id/attendance', requireTutor, async (request, response) => {
  const enrollmentId = parseCourseId(request.params.id)
  const lessonId = parseEnrollmentId(String(request.body?.lessonId ?? ''))
  const status = request.body?.status
  if (enrollmentId === null || lessonId === null || !['Present', 'Absent'].includes(status)) {
    return response.status(400).json({ message: 'Enter a valid live lesson attendance status.' })
  }
  const result = await sql.begin(async (transaction) => {
    const [enrollment] = await transaction`
      SELECT enrollments.id, classes.modules
      FROM enrollments
      INNER JOIN classes ON classes.id = enrollments.class_id
      WHERE enrollments.id = ${enrollmentId}
        AND enrollments.class_status = 'enrolled'
        AND classes.tutor_id = ${request.tutorId}
      FOR UPDATE OF enrollments
    `
    if (!enrollment) return null
    const lesson = getCourseLessons(deserializeJson(enrollment.modules)).find((item) => item?.id === lessonId)
    if (!lesson || lesson.type !== 'live') return { error: 'Live lesson not found.' }
    await transaction`
      INSERT INTO class_attendance (enrollment_id, lesson_id, status)
      VALUES (${enrollmentId}, ${lessonId}, ${status})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
    `
    await transaction`
      INSERT INTO student_lesson_progress (enrollment_id, lesson_id, completed_at)
      VALUES (${enrollmentId}, ${lessonId}, ${status === 'Present' ? sql`NOW()` : sql`NULL`})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET completed_at = ${status === 'Present' ? sql`COALESCE(student_lesson_progress.completed_at, NOW())` : sql`NULL`}, last_accessed_at = NOW()
    `
    return { status }
  })
  if (!result) return response.status(404).json({ message: 'Class enrollment not found.' })
  if (result.error) return response.status(404).json({ message: result.error })
  return response.status(204).end()
})

app.patch('/api/tutor/profile', requireTutor, async (request, response) => {
  const profile = isValidTutorProfile(request.body)
  if (!profile) return response.status(400).json({ message: 'Enter valid tutor profile details.' })
  try {
    const [updated] = await sql`
      UPDATE tutors
      SET ${sql(profile)}
      WHERE id = ${request.tutorId}
      RETURNING id
    `
    if (!updated) return response.status(404).json({ message: 'Tutor profile not found.' })
    return response.json(await readTutor(request.tutorId))
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'A tutor with this email already exists.' })
    throw error
  }
})

app.get('/api/admin/practice-exams', requireAdmin, async (_request, response) => {
  const exams = await sql`
    SELECT id::INTEGER AS id, title, subject, grade, price::FLOAT AS price, published
    FROM practice_exams
    ORDER BY created_at DESC, id DESC
  `
  return response.json(exams)
})

app.post('/api/admin/practice-exams', requireAdmin, async (request, response) => {
  const body = request.body ?? {}
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const grade = typeof body.grade === 'string' ? body.grade.trim() : ''
  const price = Number(body.price)
  const published = body.published === true
  if (!title || !subject || !grade || !Number.isFinite(price) || price < 0) return response.status(400).json({ message: 'Title, subject, grade, and a valid price are required.' })
  const [exam] = await sql`
    INSERT INTO practice_exams ${sql({ title, subject, grade, price, published })}
    RETURNING id::INTEGER AS id, title, subject, grade, price::FLOAT AS price, published
  `
  return response.status(201).json(exam)
})

app.get('/api/admin/practice-exams/:id/questions', requireAdmin, async (request, response) => {
  const examId = parseCourseId(request.params.id)
  if (examId === null) return response.status(400).json({ message: 'Invalid practice exam id.' })
  const questions = await sql`
    SELECT id::INTEGER AS id, exam_id::INTEGER AS exam_id, question_text, options, correct_answer, explanation
    FROM practice_questions
    WHERE exam_id = ${examId}
    ORDER BY id
  `
  return response.json(questions.map((question) => ({ ...question, options: deserializeJson(question.options) })))
})

app.post('/api/admin/practice-exams/:id/questions', requireAdmin, async (request, response) => {
  const examId = parseCourseId(request.params.id)
  const body = request.body ?? {}
  const questionText = typeof body.questionText === 'string' ? body.questionText.trim() : ''
  const options = Array.isArray(body.options) ? body.options.filter((option) => typeof option === 'string').map((option) => option.trim()).filter(Boolean) : []
  const correctAnswer = typeof body.correctAnswer === 'string' ? body.correctAnswer.trim() : ''
  const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : ''
  if (examId === null || !questionText || options.length < 2 || !options.includes(correctAnswer) || !explanation) return response.status(400).json({ message: 'Question text, at least two options, a matching correct answer, and an explanation are required.' })
  const [exam] = await sql`SELECT id FROM practice_exams WHERE id = ${examId}`
  if (!exam) return response.status(404).json({ message: 'Practice exam not found.' })
  const [question] = await sql`
    INSERT INTO practice_questions ${sql({ exam_id: examId, question_text: questionText, options: JSON.stringify(options), correct_answer: correctAnswer, explanation })}
    RETURNING id::INTEGER AS id, exam_id::INTEGER AS exam_id, question_text, options, correct_answer, explanation
  `
  return response.status(201).json({ ...question, options: deserializeJson(question.options) })
})

app.get('/api/admin/payments', requireAdmin, async (_request, response) => {
  const payments = await sql`
    SELECT payments.id::INTEGER AS id,
           COALESCE(NULLIF(payments.student_data->0->>'fullName', ''), NULLIF(users.name, ''), 'Unknown student') AS student,
           COALESCE(classes.title, courses.title, 'Class enrollment') AS course,
           payments.amount::FLOAT AS amount,
           to_char(payments.created_at, 'Mon DD, YYYY') AS date,
           CASE payments.status
             WHEN 'paid' THEN 'Paid'
             WHEN 'failed' THEN 'Failed'
             ELSE 'Pending'
           END AS status
    FROM payments
    INNER JOIN users ON users.id = payments.user_id
    LEFT JOIN courses ON courses.id = payments.course_id
    LEFT JOIN classes ON classes.id = payments.class_id
    ORDER BY payments.created_at DESC, payments.id DESC
  `
  return response.json(payments)
})

app.get('/api/admin/quiz-violations', requireAdmin, async (_request, response) => {
  const violations = await sql`
    SELECT quiz_attempts.id::INTEGER AS id,
           students.full_name AS "studentName",
           users.email AS "studentEmail",
           COALESCE(classes.title, courses.title, 'Class enrollment') AS "courseTitle",
           CASE WHEN enrollments.class_id IS NULL THEN courses.modules ELSE classes.modules END AS modules,
           quiz_attempts.lesson_id::INTEGER AS "lessonId",
           quiz_attempts.violations,
           quiz_attempts.disqualified,
           quiz_attempts.score,
           quiz_attempts.passed,
           quiz_attempts.retake_approved AS "retakeApproved",
           quiz_attempts.submitted_at AS "submittedAt",
           CASE WHEN retake.id IS NULL THEN 'not_retaken' WHEN retake.passed = true THEN 'passed' ELSE 'failed' END AS "retakeStatus",
           retake.score AS "retakeScore",
           retake.submitted_at AS "retakeSubmittedAt"
    FROM quiz_attempts
    LEFT JOIN LATERAL (
      SELECT follow_up.id, follow_up.passed, follow_up.score, follow_up.submitted_at
      FROM quiz_attempts AS follow_up
      WHERE follow_up.enrollment_id = quiz_attempts.enrollment_id
        AND follow_up.lesson_id = quiz_attempts.lesson_id
        AND follow_up.submitted_at IS NOT NULL
        AND follow_up.submitted_at > quiz_attempts.submitted_at
      ORDER BY follow_up.submitted_at ASC, follow_up.id ASC
      LIMIT 1
    ) AS retake ON true
    INNER JOIN enrollments ON enrollments.id = quiz_attempts.enrollment_id
    INNER JOIN students ON students.id = enrollments.student_id
    INNER JOIN users ON users.id = students.user_id
    LEFT JOIN courses ON courses.id = enrollments.course_id
    LEFT JOIN classes ON classes.id = enrollments.class_id
    WHERE quiz_attempts.disqualified = true OR COALESCE(jsonb_array_length(quiz_attempts.violations), 0) > 0
    ORDER BY quiz_attempts.submitted_at DESC NULLS LAST
  `
  return response.json(violations.map((violation) => {
    const { modules, ...serializedViolation } = violation
    return {
    ...serializedViolation,
    lessonTitle: findCourseLesson(modules, violation.lessonId)?.title ?? 'Quiz lesson',
    violations: (deserializeJson(violation.violations) ?? []).flatMap((item) => {
      const parsed = deserializeJson(item)
      return isPlainObject(parsed) ? [parsed] : []
    }),
    }
  }))
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
  const revenueByCategory = await sql`
    SELECT category AS label, SUM(price * students)::FLOAT AS value
    FROM courses
    WHERE status = 'Published'
      AND students > 0
    GROUP BY category
    ORDER BY value DESC, label
    LIMIT 5
  `
  const topCourses = await sql`
    SELECT title AS label, students::INTEGER AS value
    FROM courses
    WHERE status = 'Published'
      AND students > 0
    ORDER BY students DESC, title
    LIMIT 5
  `

  response.json({ ...totals, revenueByMonth, enrollmentsByCategory, revenueByCategory, topCourses })
})

app.get('/api/admin/courses', requireAdminOrTutor, async (_request, response) => {
  const courses = await sql`
    SELECT ${courseColumns}
    FROM courses
    ORDER BY id
  `
  response.json(courses.map(deserializeCourse))
})

app.get('/api/admin/courses/:id', requireAdminOrTutor, async (request, response) => {
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

app.post('/api/admin/courses', requireAdminOrTutor, async (request, response) => {
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

app.put('/api/admin/courses/:id', requireAdminOrTutor, async (request, response) => {
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

app.delete('/api/admin/courses/:id', requireAdminOrTutor, async (request, response) => {
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
  const modules = Array.isArray(body.modules) ? body.modules : []
  const price = Number(body.price)
  const published = body.published
  const validSchedule = schedule && typeof schedule === 'object' && !Array.isArray(schedule) && typeof schedule.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(schedule.startDate) && typeof schedule.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(schedule.endDate) && schedule.endDate >= schedule.startDate
  if (!title || title.length > 200 || !classPrograms.includes(programId) || !Number.isInteger(tutorId) || tutorId < 1 || !Number.isInteger(capacity) || capacity < 1 || !validSchedule || meetingLink.length > 2000 || !Number.isFinite(price) || price < 0 || typeof published !== 'boolean') return null
  return { program_id: programId, title, tutor_id: tutorId, capacity, schedule, meeting_link: meetingLink, modules, price, published }
}

const classColumns = sql.unsafe(`
  classes.id::INTEGER AS id,
  classes.program_id,
  classes.title,
  classes.tutor_id::INTEGER AS tutor_id,
  classes.capacity,
  classes.schedule,
  classes.meeting_link,
  classes.modules,
  classes.price::FLOAT AS price,
  classes.status,
  classes.published
`)

const readAdminClass = async (id) => {
  const [classRecord] = await sql`SELECT ${classColumns} FROM classes WHERE classes.id = ${id}`
  return classRecord ? { ...classRecord, modules: deserializeJson(classRecord.modules) ?? [] } : null
}

const refreshClassStatus = async (id) => {
  const [classRecord] = await sql`SELECT capacity, published, status, schedule FROM classes WHERE id = ${id} FOR UPDATE`
  if (!classRecord) return null
  if (classRecord.schedule?.endDate && classRecord.schedule.endDate < new Date().toISOString().slice(0, 10)) {
    await sql`UPDATE classes SET status = 'closed', updated_at = NOW() WHERE id = ${id}`
    return readAdminClass(id)
  }
  const [counts] = await sql`SELECT COUNT(*) FILTER (WHERE class_status = 'enrolled')::INTEGER AS enrolled FROM enrollments WHERE class_id = ${id}`
  const status = !classRecord.published ? 'closed' : classRecord.status === 'closed' ? 'closed' : counts.enrolled >= classRecord.capacity ? 'full' : 'open'
  await sql`UPDATE classes SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
  return readAdminClass(id)
}

app.get('/api/admin/classes', requireAdminOrTutor, async (_request, response) => {
  await sql`UPDATE classes SET status = 'closed', updated_at = NOW() WHERE (schedule->>'endDate') IS NOT NULL AND (schedule->>'endDate') < CURRENT_DATE::TEXT AND status <> 'closed'`
  const [classes, enrollments, pendingStudents, tutors, courses] = await Promise.all([
    sql`SELECT ${classColumns} FROM classes WHERE published = true ORDER BY created_at DESC, id DESC`,
    sql`SELECT enrollments.id::INTEGER AS id, enrollments.class_id::INTEGER AS class_id, students.full_name AS student_name, to_char(enrollments.created_at, 'FMMonth DD, YYYY') AS enrolled_date, enrollments.class_status AS status FROM enrollments INNER JOIN students ON students.id = enrollments.student_id WHERE enrollments.class_id IS NOT NULL ORDER BY enrollments.created_at DESC`,
    sql`SELECT enrollments.id::INTEGER AS id, students.full_name AS student_name, to_char(enrollments.created_at, 'FMMonth DD, YYYY') AS enrolled_date, NULLIF(regexp_replace(students.age_or_grade, '\\D', '', 'g'), '')::INTEGER AS age FROM enrollments INNER JOIN students ON students.id = enrollments.student_id INNER JOIN payments ON payments.id = enrollments.payment_id INNER JOIN courses ON courses.id = enrollments.course_id WHERE payments.status = 'paid' AND enrollments.class_id IS NULL AND LOWER(courses.category) = 'international online interactive' ORDER BY enrollments.created_at DESC`,
    sql`SELECT id::INTEGER AS id, name FROM tutors WHERE status = 'Active' ORDER BY name`,
  ])
  response.json({ classes: classes.map((classRecord) => ({ ...classRecord, modules: deserializeJson(classRecord.modules) ?? [] })), enrollments, pendingStudents, tutors })
})

app.post('/api/admin/classes', requireAdminOrTutor, async (request, response) => {
  const classPayload = parseClassPayload(request.body)
  if (!classPayload) return response.status(400).json({ message: 'Enter valid class details.' })
  try {
    const [created] = await sql`
      INSERT INTO classes (program_id, title, tutor_id, capacity, schedule, meeting_link, modules, price, published, status)
      VALUES (${classPayload.program_id}, ${classPayload.title}, ${classPayload.tutor_id}, ${classPayload.capacity}, ${JSON.stringify(classPayload.schedule)}::jsonb, ${classPayload.meeting_link}, ${JSON.stringify(classPayload.modules)}::jsonb, ${classPayload.price}, ${classPayload.published}, ${classPayload.published ? 'open' : 'closed'})
      RETURNING id
    `
    return response.status(201).json(await readAdminClass(Number(created.id)))
  } catch (error) {
    if (error.code === '23503') return response.status(400).json({ message: 'Select an existing tutor before creating the class.' })
    throw error
  }
})

app.put('/api/admin/classes/:id', requireAdminOrTutor, async (request, response) => {
  const id = parseCourseId(request.params.id)
  const classPayload = parseClassPayload(request.body)
  if (id === null || !classPayload) return response.status(400).json({ message: 'Enter valid class details.' })
  const [updated] = await sql`UPDATE classes SET ${sql(classPayload)}, updated_at = NOW() WHERE id = ${id} RETURNING id`
  if (!updated) return response.status(404).json({ message: 'Class not found.' })
  return response.json(await refreshClassStatus(id))
})

app.delete('/api/admin/classes/:id', requireAdminOrTutor, async (request, response) => {
  const id = parseCourseId(request.params.id)
  if (id === null) return response.status(400).json({ message: 'Invalid class id.' })
  const [deleted] = await sql`DELETE FROM classes WHERE id = ${id} RETURNING id`
  if (!deleted) return response.status(404).json({ message: 'Class not found.' })
  return response.status(204).end()
})

app.post('/api/admin/classes/assign', requireAdmin, async (request, response) => {
  const enrollmentId = parseCourseId(String(request.body?.enrollmentId ?? ''))
  const classPayload = parseClassPayload({ ...request.body, program_id: 'international-online-interactive', title: request.body?.title, price: request.body?.price ?? 0, published: true })
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

app.patch('/api/admin/classes/enrollments/:id/attendance', requireAdmin, async (request, response) => {
  const id = parseCourseId(request.params.id)
  const lessonId = parseEnrollmentId(String(request.body?.lessonId ?? ''))
  const status = request.body?.status
  if (id === null || lessonId === null || !['Present', 'Absent'].includes(status)) return response.status(400).json({ message: 'Enter a valid live lesson attendance status.' })
  const result = await sql.begin(async (transaction) => {
    const [enrollment] = await transaction`
      SELECT enrollments.id, classes.modules
      FROM enrollments
      INNER JOIN classes ON classes.id = enrollments.class_id
      WHERE enrollments.id = ${id} AND enrollments.class_status = 'enrolled'
      FOR UPDATE OF enrollments
    `
    if (!enrollment) return null
    const lesson = getCourseLessons(deserializeJson(enrollment.modules)).find((item) => item?.id === lessonId)
    if (!lesson || lesson.type !== 'live') return { error: 'Live lesson not found.' }
    await transaction`
      INSERT INTO class_attendance (enrollment_id, lesson_id, status)
      VALUES (${id}, ${lessonId}, ${status})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
    `
    await transaction`
      INSERT INTO student_lesson_progress (enrollment_id, lesson_id, completed_at)
      VALUES (${id}, ${lessonId}, ${status === 'Present' ? sql`NOW()` : sql`NULL`})
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET completed_at = ${status === 'Present' ? sql`COALESCE(student_lesson_progress.completed_at, NOW())` : sql`NULL`}, last_accessed_at = NOW()
    `
    return { status }
  })
  if (!result) return response.status(404).json({ message: 'Class enrollment not found.' })
  if (result.error) return response.status(404).json({ message: result.error })
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
