import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import { CourseEditor } from '@/components/admin/admin-dashboard'
import ScheduleCalendar, { type ScheduleSession } from '@/components/schedule-calendar'
import { getAuthenticatedUser, getClassLeaderboard, getTutorAtRiskStudents, getTutorClasses, getTutorClassStudents, getTutorCourses, getTutorCourseStudents, getTutorOverview, updateTutorClassAttendance, updateTutorClassCurriculum, updateTutorCourseCurriculum, updateTutorProfile, type AtRiskStudent, type TutorClass, type TutorClassStudent, type TutorOverview } from '@/services/api'
import AtRiskStudentsPanel from '@/components/at-risk-students-panel'
import { type AdminCourse, type AdminModule } from '@/components/admin/admin-data'
import { navigateTo } from '@/lib/navigation'
import { calculateOverallGrade } from '@/lib/overall-grade'
import { toast } from '@/components/toast'
import { signOut } from '@/services/api'

type View = 'overview' | 'schedule' | 'courses' | 'classes' | 'students' | 'profile'
type ProgressTarget = { type: 'course' | 'class'; id: number; title: string; modules: AdminModule[] }

const statItems = (overview: TutorOverview) => [
  { label: 'Assigned courses', value: overview.totalCourses, icon: <SchoolOutlinedIcon color="primary" /> },
  { label: 'Assigned classes', value: overview.totalClasses, icon: <ClassOutlinedIcon color="primary" /> },
  { label: 'Active students', value: overview.totalStudents, icon: <GroupsOutlinedIcon color="primary" /> },
  { label: 'Upcoming classes', value: overview.upcomingClasses, icon: <DashboardOutlinedIcon color="primary" /> },
]

interface StudentsAttendanceViewProps {
  selectedClass: TutorClass
  students: TutorClassStudent[]
  liveLessons: AdminModule['lessons']
  onMarkAttendance: (student: TutorClassStudent, lessonId: number, status: 'Present' | 'Absent') => Promise<void>
  studentsLoading: boolean
  onBack: () => void
}

const StudentsAttendanceView = ({ selectedClass, students, liveLessons, onMarkAttendance, studentsLoading, onBack }: StudentsAttendanceViewProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const selectedSession = liveLessons.find((lesson) => lesson.id === selectedSessionId)
  const now = Date.now()
  const isPast = (lesson: AdminModule['lessons'][number]) => Boolean(lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() < now)
  const attended = (student: TutorClassStudent) => liveLessons.filter((lesson) => student.attendance[lesson.id] === 'Present').length

  if (selectedSession) return <>
    <Button onClick={() => setSelectedSessionId(null)} sx={{ mb: 2 }}>Back to sessions</Button>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{selectedSession.title}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>{selectedSession.scheduledAt ? new Date(selectedSession.scheduledAt).toLocaleString() : 'Schedule pending'} · Attendance marking</Typography>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography sx={{ flex: 1, fontWeight: 700 }}>Enrolled student</Typography><Typography sx={{ width: 220, fontWeight: 700 }}>Join-click reference</Typography><Typography sx={{ width: 180, fontWeight: 700 }}>Attendance</Typography></Stack>
      {students.map((student) => <Stack key={student.id} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail}</Typography></Box><Typography variant="body2" color="text.secondary" sx={{ width: { md: 220 } }}>{student.sessionJoinClicks[selectedSession.id] ? new Date(student.sessionJoinClicks[selectedSession.id]).toLocaleString() : 'No join click recorded'}</Typography><Select size="small" value={student.attendance[selectedSession.id] ?? ''} displayEmpty onChange={(event) => void onMarkAttendance(student, selectedSession.id, event.target.value as 'Present' | 'Absent')} sx={{ width: { xs: '100%', md: 180 } }}><MenuItem value=""><em>Not marked</em></MenuItem><MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem></Select></Stack>)}
    </Paper>
  </>

  return <>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}><Box><Button onClick={onBack} sx={{ mb: 1 }}>Back to My Classes</Button><Typography variant="h4">{selectedClass.title}</Typography><Typography color="text.secondary">Students & attendance</Typography></Box></Stack>
    <Typography variant="h5" sx={{ mb: 2 }}>Roster</Typography>
    {studentsLoading && <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><CircularProgress size={20} aria-label="Loading roster" /><Typography color="text.secondary">Loading enrolled students...</Typography></Stack>}
    {!studentsLoading && students.length === 0 && <Typography color="text.secondary" sx={{ mb: 2 }}>No enrolled students yet.</Typography>}
    <Paper elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider', overflow: 'hidden' }}><Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography sx={{ flex: 1, fontWeight: 700 }}>Student</Typography><Typography sx={{ width: 190, fontWeight: 700 }}>Enrolled</Typography><Typography sx={{ width: 190, fontWeight: 700 }}>Attendance</Typography></Stack>{students.map((student) => <Stack key={student.id} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail}</Typography></Box><Typography variant="body2" color="text.secondary" sx={{ width: { md: 190 } }}>{student.enrolledDate}</Typography><Typography variant="body2" sx={{ width: { md: 190 }, fontWeight: 600 }}>{attended(student)}/{liveLessons.length} sessions attended</Typography></Stack>)}</Paper>
    <Typography variant="h5" sx={{ mb: 2 }}>Sessions</Typography>
    <Stack spacing={1.5}>{liveLessons.length === 0 && <Typography color="text.secondary">No live sessions have been added to this class.</Typography>}{liveLessons.map((lesson) => <Paper key={lesson.id} component={isPast(lesson) ? 'button' : 'div'} type={isPast(lesson) ? 'button' : undefined} onClick={isPast(lesson) ? () => setSelectedSessionId(lesson.id) : undefined} elevation={0} sx={{ width: '100%', p: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', textAlign: 'left', backgroundColor: 'background.paper', cursor: isPast(lesson) ? 'pointer' : 'default', '&:hover': isPast(lesson) ? { borderColor: 'primary.main' } : undefined }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{lesson.title}</Typography><Typography variant="body2" color="text.secondary">{lesson.scheduledAt ? new Date(lesson.scheduledAt).toLocaleString() : 'Schedule pending'}</Typography></Box><Chip label={isPast(lesson) ? 'Mark attendance' : 'Not yet occurred'} color={isPast(lesson) ? 'primary' : 'default'} variant="outlined" /></Paper>)}</Stack>
  </>
}

const formatLearningTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

const StudentProgressView = ({ target, students, studentsLoading, classRanks, onBack }: { target: ProgressTarget; students: TutorClassStudent[]; studentsLoading: boolean; classRanks: Map<number, number>; onBack: () => void }) => {
  const lessons = target.modules.flatMap((module) => module.lessons)
  const quizzes = lessons.filter((lesson) => lesson.type === 'quiz')
  const liveLessons = lessons.filter((lesson) => lesson.type === 'live')
  const latestAttempt = (student: TutorClassStudent, lessonId: number) => student.quizAttempts
    .filter((attempt) => attempt.lessonId === lessonId && attempt.score !== null && attempt.passed !== null)
    .sort((first, second) => new Date(second.submittedAt ?? second.startedAt).getTime() - new Date(first.submittedAt ?? first.startedAt).getTime())[0]
  const getOverallGrade = (student: TutorClassStudent) => calculateOverallGrade({
    quizLessonIds: quizzes.map((quiz) => quiz.id),
    quizScores: Object.fromEntries(quizzes.map((quiz) => [quiz.id, latestAttempt(student, quiz.id)?.score ?? undefined])),
    attendance: student.attendance,
    liveLessons,
    completionPercentage: student.progressPercentage,
    isClass: target.type === 'class',
  })

  return <>
    <Button onClick={onBack} sx={{ mb: 2 }}>Back to My {target.type === 'course' ? 'Courses' : 'Classes'}</Button>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{target.title}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Student progress</Typography>
    <Stack spacing={2}>
      {studentsLoading && <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} aria-label="Loading enrolled students" /><Typography color="text.secondary">Loading enrolled students...</Typography></Stack>}
      {!studentsLoading && students.length === 0 && <Typography color="text.secondary">No enrolled students yet.</Typography>}
      {!studentsLoading && students.map((student) => <Paper key={student.id} elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: quizzes.length || target.type === 'class' ? 2 : 0 }}>
          <Box><Typography variant="h6">{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail}</Typography></Box>
          <Stack direction="row" spacing={3} flexWrap="wrap"><Box><Typography variant="body2" color="text.secondary">Completion</Typography><Typography sx={{ fontWeight: 700 }}>{student.progressPercentage}%</Typography></Box><Box><Typography variant="body2" color="text.secondary">Overall grade</Typography><Stack direction="row" spacing={0.75} alignItems="center"><Typography sx={{ fontWeight: 700 }}>{getOverallGrade(student).percentage}%</Typography><Chip label={getOverallGrade(student).letter} size="small" color={getOverallGrade(student).letter === 'F' ? 'error' : getOverallGrade(student).letter === 'D' ? 'warning' : 'success'} /></Stack></Box>{target.type === 'class' && <Box><Typography variant="body2" color="text.secondary">Class rank</Typography><Typography sx={{ fontWeight: 700 }}>{classRanks.has(student.studentId) ? `#${classRanks.get(student.studentId)}` : '—'}</Typography></Box>}<Box><Typography variant="body2" color="text.secondary">Time learning</Typography><Typography sx={{ fontWeight: 700 }}>{formatLearningTime(student.timeSpentSeconds)}</Typography></Box></Stack>
        </Stack>
        {target.type === 'class' && <Typography variant="body2" sx={{ mb: quizzes.length ? 2 : 0, fontWeight: 600 }}>{liveLessons.filter((lesson) => student.attendance[lesson.id] === 'Present').length}/{liveLessons.length} sessions attended</Typography>}
        {quizzes.length > 0 && <><Divider sx={{ mb: 1.5 }} /><Typography variant="subtitle2" sx={{ mb: 1 }}>Quiz results</Typography><Stack spacing={1}>{quizzes.map((quiz) => {
          const attempts = student.quizAttempts.filter((attempt) => attempt.lessonId === quiz.id)
          const result = latestAttempt(student, quiz.id)
          return <Stack key={quiz.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}><Typography variant="body2">{quiz.title}</Typography><Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" color="text.secondary">{result ? `${result.score}%` : 'Not attempted'} · {attempts.length} attempt{attempts.length === 1 ? '' : 's'}</Typography>{result && <Chip size="small" label={result.passed ? 'Passed' : 'Failed'} color={result.passed ? 'success' : 'error'} />}</Stack></Stack>
        })}</Stack></>}
      </Paper>)}
    </Stack>
  </>
}

const TutorScheduleView: FC<{ classes: TutorClass[]; now: Date }> = ({ classes, now }) => {
  const sessions = classes.flatMap((classRecord) => classRecord.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.type === 'live' && lesson.scheduledAt)
    .map((lesson) => ({
      id: `${classRecord.id}-${lesson.id}`,
      classTitle: classRecord.title,
      lessonTitle: lesson.title,
      scheduledAt: lesson.scheduledAt!,
      endsAt: lesson.endsAt,
      meetingUrl: lesson.meetingUrl || classRecord.meetingLink,
      classSchedule: `${classRecord.schedule.startDate || 'Start date pending'} – ${classRecord.schedule.endDate || 'End date pending'}`,
      lessonId: lesson.id,
    } satisfies ScheduleSession)))

  return <ScheduleCalendar
    title="Live class schedule"
    description="See the upcoming live sessions for every class you teach in one weekly view."
    sessions={sessions}
    now={now}
    emptyTitle="No upcoming live sessions"
    emptyDescription="Live lessons scheduled in your classes will appear here."
  />
}

const TutorDashboard = ({ darkMode, onToggleDarkMode }: { darkMode: boolean; onToggleDarkMode: () => void }) => {
  const [view, setView] = useState<View>('overview')
  const [overview, setOverview] = useState<TutorOverview | null>(null)
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof getTutorCourses>>>([])
  const [classes, setClasses] = useState<TutorClass[]>([])
  const [students, setStudents] = useState<TutorClassStudent[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [progressTarget, setProgressTarget] = useState<ProgressTarget | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [classRanks, setClassRanks] = useState<Map<number, number>>(new Map())
  const [profile, setProfile] = useState({ name: '', phone: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([])
  const [atRiskLoading, setAtRiskLoading] = useState(true)
  const [atRiskError, setAtRiskError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const hasLoaded = useRef(false)
  const [now, setNow] = useState(() => new Date())
  const [courseDraft, setCourseDraft] = useState<AdminCourse | null>(null)
  const [classDraft, setClassDraft] = useState<{ record: TutorClass; course: AdminCourse } | null>(null)
  const user = getAuthenticatedUser()

  const refreshAtRisk = async () => {
    setAtRiskLoading(true)
    try {
      setAtRiskStudents(await getTutorAtRiskStudents())
      setAtRiskError(null)
    } catch (loadError) {
      setAtRiskError(loadError instanceof Error ? loadError.message : 'Unable to load at-risk students.')
    } finally {
      setAtRiskLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextOverview, nextCourses, nextClasses] = await Promise.all([getTutorOverview(), getTutorCourses(), getTutorClasses(), refreshAtRisk()])
      setOverview(nextOverview)
      setCourses(nextCourses)
      setClasses(nextClasses)
      setProfile({ name: nextOverview.tutor.name, phone: nextOverview.tutor.phone, bio: nextOverview.tutor.bio })
      if (nextClasses[0]) setSelectedClassId(nextClasses[0].id)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load tutor portal.'
      setError(message)
      toast.add({ type: 'error', title: 'Tutor portal unavailable', description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    void load()
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => { void refreshAtRisk() }, 30000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const classId = progressTarget?.type === 'class' ? progressTarget.id : null
    if (classId === null) {
      setClassRanks(new Map())
      return
    }
    void getClassLeaderboard(classId)
      .then((entries) => setClassRanks(new Map(entries.map((entry) => [entry.studentId, entry.rank]))))
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load class rankings.'
        setError(message)
        toast.add({ type: 'error', title: 'Unable to load class rankings', description: message })
      })
  }, [progressTarget])

  useEffect(() => {
    const loadStudents = async () => {
      const request = view === 'students' && selectedClassId !== ''
        ? getTutorClassStudents(selectedClassId)
        : progressTarget
          ? progressTarget.type === 'course' ? getTutorCourseStudents(progressTarget.id) : getTutorClassStudents(progressTarget.id)
          : null
      if (!request) return
      setStudentsLoading(true)
      try {
        setStudents(await request)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load students.'
        setError(message)
        toast.add({ type: 'error', title: 'Unable to load students', description: message })
      } finally {
        setStudentsLoading(false)
      }
    }
    void loadStudents()
    const timer = window.setInterval(() => { void loadStudents() }, 30000)
    return () => window.clearInterval(timer)
  }, [view, selectedClassId, progressTarget])

  const selectedClass = classes.find((classRecord) => classRecord.id === selectedClassId)
  const liveLessons = useMemo(() => selectedClass?.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.type === 'live') ?? [], [selectedClass])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileSaved(false)
    try {
      const updated = await updateTutorProfile(profile)
      setOverview((current) => current ? { ...current, tutor: updated } : current)
      setProfile({ name: updated.name, phone: updated.phone, bio: updated.bio })
      setProfileSaved(true)
      toast.add({ type: 'success', title: 'Profile saved', description: 'Your tutor profile was updated.' })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save profile.'
      setProfileError(message)
      toast.add({ type: 'error', title: 'Profile update failed', description: message })
    } finally { setSaving(false) }
  }

  const manageCourse = (course: AdminCourse) => setCourseDraft(course)

  const saveCourseDraft = async () => {
    if (!courseDraft) return
    setSaving(true)
    try {
      const modules = await updateTutorCourseCurriculum(courseDraft.id, courseDraft.modules)
      setCourses((current) => current.map((course) => course.id === courseDraft.id ? { ...course, modules } : course))
      setCourseDraft(null)
      toast.add({ type: 'success', title: 'Course curriculum saved', description: 'The course curriculum was updated.' })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save course curriculum.'
      setError(message)
      toast.add({ type: 'error', title: 'Course update failed', description: message })
    } finally { setSaving(false) }
  }

  const manageClass = (classRecord: TutorClass) => {
    setClassDraft({ record: classRecord, course: { id: classRecord.id, title: classRecord.title, category: 'Class', level: '', tutor: overview?.tutor.name ?? '', status: 'Draft', students: classRecord.enrolledCount, price: 0, cover: '', description: '', longDescription: '', learningOutcomes: [], requirements: [], certificate: false, updatedAt: '', modules: classRecord.modules } })
  }

  const saveClassDraft = async () => {
    if (!classDraft) return
    setSaving(true)
    try {
      const modules = await updateTutorClassCurriculum(classDraft.record.id, classDraft.course.modules)
      setClasses((current) => current.map((classRecord) => classRecord.id === classDraft.record.id ? { ...classRecord, modules } : classRecord))
      setClassDraft(null)
      toast.add({ type: 'success', title: 'Class curriculum saved', description: 'The class curriculum was updated.' })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save class curriculum.'
      setError(message)
      toast.add({ type: 'error', title: 'Class update failed', description: message })
    } finally { setSaving(false) }
  }

  const markAttendance = async (student: TutorClassStudent, lessonId: number, status: 'Present' | 'Absent') => {
    try {
      await updateTutorClassAttendance(student.id, lessonId, status)
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, attendance: { ...item.attendance, [lessonId]: status } } : item))
      void refreshAtRisk()
      toast.add({ type: 'success', title: 'Attendance saved', description: `${student.studentName} marked ${status}.` })
    } catch (attendanceError) {
      const message = attendanceError instanceof Error ? attendanceError.message : 'Unable to save attendance.'
      setError(message)
      toast.add({ type: 'error', title: 'Attendance update failed', description: message })
    }
  }

  const handleSignOut = () => {
    void toast.promise(signOut().then(() => navigateTo('/', true)), {
      loading: 'Signing out...',
      success: 'Signed out successfully.',
      error: (signOutError) => signOutError instanceof Error ? signOutError.message : 'Unable to sign out.',
    })
  }

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress aria-label="Loading tutor portal" /></Box>

  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Box sx={{ px: { xs: 2, md: 5 }, py: 2, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
        <Box><Typography variant="h5" sx={{ fontWeight: 700 }}>Tutor Portal</Typography><Typography variant="body2" color="text.secondary">Welcome, {user?.name || overview?.tutor.name || 'Tutor'}</Typography></Box>
        <Stack direction="row" spacing={1}><Button size="small" onClick={onToggleDarkMode}>{darkMode ? 'Light mode' : 'Dark mode'}</Button><Button size="small" onClick={handleSignOut}>Sign out</Button></Stack>
      </Stack>
    </Box>
    <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {courseDraft && <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: 1, borderColor: 'primary.main' }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5">Edit course curriculum</Typography><Stack direction="row" spacing={1}><Button onClick={() => setCourseDraft(null)}>Cancel</Button><Button variant="contained" onClick={() => void saveCourseDraft()} disabled={saving}>Save curriculum</Button></Stack></Stack><CourseEditor curriculumOnly allowedLessonTypes={['video', 'article', 'quiz']} course={courseDraft} onChange={setCourseDraft} /></Paper>}
      {classDraft && <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: 1, borderColor: 'primary.main' }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5">Edit class curriculum</Typography><Stack direction="row" spacing={1}><Button onClick={() => setClassDraft(null)}>Cancel</Button><Button variant="contained" onClick={() => void saveClassDraft()} disabled={saving}>Save curriculum</Button></Stack></Stack><CourseEditor curriculumOnly course={classDraft.course} onChange={(course) => setClassDraft((current) => current ? { ...current, course } : current)} /></Paper>}
      <Tabs value={view} onChange={(_, next) => { setView(next); setProgressTarget(null); setError(''); if (next !== 'profile') setProfileError('') }} variant="fullWidth" aria-label="Tutor portal sections" sx={{ mb: 3 }}>
        <Tab value="overview" label="Overview" /><Tab value="schedule" label="Schedule" /><Tab value="courses" label="My Courses" /><Tab value="classes" label="My Classes" /><Tab value="students" label="Students & Attendance" /><Tab value="profile" label="Profile" />
      </Tabs>
      {error && view !== 'profile' && <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'error.main' }}><Typography color="error">{error}</Typography></Paper>}
      {profileError && view === 'profile' && <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'error.main' }}><Typography color="error">{profileError}</Typography></Paper>}
      {view === 'overview' && overview && <><Typography variant="h4" sx={{ mb: 2.25 }}>Teaching overview</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>{statItems(overview).map((item) => <Card key={item.label} elevation={0} sx={{ minHeight: 154, border: 1, borderColor: 'divider', borderRadius: 3, backgroundColor: 'background.paper' }}><CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography color="text.secondary" variant="body2">{item.label}</Typography>{item.icon}</Stack><Typography variant="h4" sx={{ mt: 1.5, fontWeight: 800 }}>{item.value}</Typography></CardContent></Card>)}</Box><AtRiskStudentsPanel students={atRiskStudents} loading={atRiskLoading} error={atRiskError} /><Paper elevation={0} sx={{ mt: 2, p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}><Typography variant="h6" sx={{ mb: 1 }}>Your teaching assignments</Typography><Typography color="text.secondary">Manage class rosters, attendance, and your profile from the sections above.</Typography></Paper></>}
      {view === 'schedule' && <TutorScheduleView classes={classes} now={now} />}
      {view === 'courses' && !progressTarget && <><Box sx={{ mb: 3 }}><Typography variant="h4">My courses</Typography><Typography color="text.secondary">Curriculum and student progress for your assigned courses</Typography></Box><Stack spacing={2}>{courses.length ? courses.map((course) => <Paper key={course.id} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h6">{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.students} students</Typography></Box><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => setProgressTarget({ type: 'course', id: course.id, title: course.title, modules: course.modules })}>Student Progress</Button><Button size="small" variant="outlined" onClick={() => manageCourse(course)}>Edit curriculum</Button></Stack></Stack></Paper>) : <Typography color="text.secondary">No courses assigned yet.</Typography>}</Stack></>}
      {view === 'classes' && !progressTarget && <><Box sx={{ mb: 3 }}><Typography variant="h4">My classes</Typography><Typography color="text.secondary">Rosters, attendance, curriculum, and student progress for your assigned classes</Typography></Box><Stack spacing={2}>{classes.length ? classes.map((classRecord) => <Paper key={classRecord.id} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h6">{classRecord.title}</Typography><Typography color="text.secondary">{classRecord.enrolledCount} enrolled students · {classRecord.status}</Typography><Typography color="text.secondary" variant="body2">{classRecord.schedule.startDate || 'Start date pending'} – {classRecord.schedule.endDate || 'End date pending'}</Typography></Box><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => { setProgressTarget({ type: 'class', id: classRecord.id, title: classRecord.title, modules: classRecord.modules }); setView('classes') }}>Student Progress</Button><Button size="small" variant="outlined" onClick={() => { setSelectedClassId(classRecord.id); setProgressTarget(null); setView('students') }}>Students & attendance</Button><Button size="small" variant="outlined" onClick={() => manageClass(classRecord)}>Edit curriculum</Button></Stack></Stack></Paper>) : <Typography color="text.secondary">No classes assigned yet.</Typography>}</Stack></>}
      {progressTarget && <StudentProgressView target={progressTarget} students={students} studentsLoading={studentsLoading} classRanks={classRanks} onBack={() => setProgressTarget(null)} />}
      {view === 'students' && selectedClass && !progressTarget && <StudentsAttendanceView selectedClass={selectedClass} students={students} liveLessons={liveLessons} onMarkAttendance={markAttendance} studentsLoading={studentsLoading} onBack={() => setView('classes')} />}
      {view === 'students' && !selectedClass && <><Typography variant="h4" sx={{ mb: 3 }}>Students & attendance</Typography><FormControl sx={{ minWidth: { xs: '100%', sm: 360 }, mb: 2 }}><InputLabel>Class</InputLabel><Select label="Class" value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value as number)}>{classes.map((classRecord) => <MenuItem key={classRecord.id} value={classRecord.id}>{classRecord.title}</MenuItem>)}</Select></FormControl>{selectedClass && <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}><Typography variant="subtitle2">Join-click reference</Typography><Typography variant="caption" color="text.secondary">A Join Class click is a reference only; select Present or Absent to record attendance.</Typography><Stack spacing={0.5} sx={{ mt: 1 }}>{students.flatMap((student) => liveLessons.filter((lesson) => student.sessionJoinClicks[lesson.id]).map((lesson) => <Typography key={`${student.id}-${lesson.id}`} variant="caption">{student.studentName} · {lesson.title}: {new Date(student.sessionJoinClicks[lesson.id]).toLocaleString()}</Typography>))}</Stack></Paper>}{selectedClass && <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'auto' }}><Box sx={{ minWidth: 700 }}><Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default', fontWeight: 700 }}><Typography sx={{ flex: 1 }}>Student</Typography>{liveLessons.map((lesson) => <Typography key={lesson.id} sx={{ width: 150 }}>{lesson.title}</Typography>)}</Stack><Divider />{students.length ? students.map((student) => <Stack key={student.id} direction="row" alignItems="center" sx={{ p: 2 }}><Box sx={{ flex: 1 }}><Typography>{student.studentName}</Typography><Typography variant="caption" color="text.secondary">{student.studentEmail}</Typography></Box>{liveLessons.map((lesson) => <FormControl key={lesson.id} size="small" sx={{ width: 140 }}><Select value={student.attendance[lesson.id] ?? ''} displayEmpty inputProps={{ 'aria-label': `${student.studentName} attendance for ${lesson.title}` }} onChange={(event) => void markAttendance(student, lesson.id, event.target.value as 'Present' | 'Absent')}><MenuItem value="">Not marked</MenuItem><MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem></Select></FormControl>)}</Stack>) : <Typography color="text.secondary" sx={{ p: 3 }}>No students enrolled in this class.</Typography>}</Box></Paper>}</>}
      {view === 'profile' && <><Typography variant="h4" sx={{ mb: 0.5 }}>Tutor profile</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Keep your contact details and teaching bio up to date for students and administrators.</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch"><Paper elevation={0} sx={{ p: 3, width: { xs: '100%', md: 240 }, border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><Avatar sx={{ width: 88, height: 88, mb: 2, fontSize: 30, fontWeight: 700, backgroundColor: 'primary.main' }}>{profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'}</Avatar><Typography variant="h6">{profile.name || 'Tutor'}</Typography><Typography variant="body2" color="text.secondary">Tutor account</Typography></Paper><Paper component="form" onSubmit={saveProfile} elevation={0} sx={{ p: { xs: 2, md: 3 }, flex: 1, border: 1, borderColor: 'divider' }}><Stack spacing={2}><TextField label="Full name" value={profile.name} onChange={(event) => { setProfile({ ...profile, name: event.target.value }); setProfileSaved(false) }} required fullWidth /><TextField label="Phone number" placeholder="Add a phone number" value={profile.phone} onChange={(event) => { setProfile({ ...profile, phone: event.target.value }); setProfileSaved(false) }} fullWidth /><TextField label="Teaching bio" placeholder="Tell students about your teaching experience" value={profile.bio} onChange={(event) => { setProfile({ ...profile, bio: event.target.value }); setProfileSaved(false) }} multiline minRows={5} fullWidth /><Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}><Typography variant="caption" color="text.secondary">Your profile is visible in the tutor portal.</Typography><Button type="submit" variant="contained" disabled={saving} startIcon={<PersonOutlineIcon />}>{saving ? 'Saving...' : 'Save profile'}</Button></Stack>{profileSaved && <Typography color="success.main" role="status">Profile updated successfully.</Typography>}</Stack></Paper></Stack></>}
    </Box>
  </Box>
}

export default TutorDashboard
