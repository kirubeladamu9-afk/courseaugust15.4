import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Pagination from '@mui/material/Pagination'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { type FC, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Course } from '@/interfaces/course'
import ScheduleCalendar, { type ScheduleSession } from '@/components/schedule-calendar'
import GamificationWidgets from './gamification-widgets'
import { Logo } from '@/components/logo'
import EnrollmentModal from './enrollment-modal'
import AdminDataTable, { type DataColumn } from '@/components/admin/admin-data-table'
import { toast } from '@/components/toast'
import { beginQuizAttempt, completeLesson as completeLessonApi, getAuthenticatedUser, getCourses, getGamification, getMyEnrollments, getMyPayments, getPracticeExam, getPracticePurchases, getPublicClasses, logLiveSessionJoin, saveLessonEngagement, saveQuizAnswer, saveQuizViolation, submitQuizAttempt, signOut, type GamificationData, type MyEnrollment, type MyPayment, type PublicClass, type QuizAnswerRecord, type QuizAnswerStatus, type QuizAttempt, type QuizQuestionResult, type QuizViolation, type QuizViolationType } from '@/services/api'
import { navigateTo } from '@/lib/navigation'
import { calculateOverallGrade } from '@/lib/overall-grade'

 type DashboardView = 'overview' | 'calendar' | 'courses' | 'classes' | 'quizzes' | 'purchases' | 'other-courses' | 'other-classes' | 'profile' | 'payments' | 'course-view'
 type EnrollmentType = 'course' | 'class'
 type EnrollmentStatus = 'active' | 'pending_schedule' | 'completed'
 type ClassStatus = 'pending_schedule' | 'open' | 'full' | 'closed'

 interface DashboardQuizResult {
  score: number
  passed: boolean
  disqualified?: boolean
  retakeApproved?: boolean
  answerStatuses?: Record<number, QuizAnswerStatus>
  violationCount?: number
  questionResults?: QuizQuestionResult[]
}

 interface DashboardEnrollment {
  id: number
  user_id: number
  type: EnrollmentType
  item_id: number
  status: EnrollmentStatus
  progress: number
  timeSpentSeconds: number
  quizResults: Record<number, DashboardQuizResult>
  attendance: Record<number, 'Present' | 'Absent'>
  sessionJoinClicks: Record<number, string>
  activityDates: string[]
  course?: DashboardCourse
  classRecord?: DashboardClass
 }

type QuizQuestion = { id: number; question: string; topic?: string; options: string[]; type?: string; category?: string }
const getQuestionSeconds = (question: QuizQuestion) => {
  const kind = `${question.type ?? ''} ${question.category ?? ''}`.toLowerCase()
  if (/true|false|boolean/.test(kind)) return 30
  if (/multiple|choice/.test(kind)) return 90
  if (/matching|ordering|order/.test(kind)) return 90
  if (/fill|short|text/.test(kind)) return 180
  if (/calculation|data|numeric|math/.test(kind)) return 240
  if (/essay|file|upload/.test(kind)) return 900
  return 90
}
const formatQuizCountdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

 interface DashboardLesson {
  id: number
  title: string
  type: 'video' | 'article' | 'quiz' | 'practice' | 'live'
  duration: string
  description: string
  videoUrl?: string
  thumbnailUrl?: string
  resources: Array<{ id: number; name: string; url?: string }>
  quizQuestions?: QuizQuestion[]
  practiceQuestions?: Array<{ id: number; question: string; topic: string; options: string[]; correctAnswer: string; explanation: string }>
  passThreshold?: number
  meetingUrl?: string
  scheduledAt?: string
  endsAt?: string
  estimatedDuration?: number
}

 interface DashboardModule {
  id: number
  title: string
  lessons: DashboardLesson[]
 }

 interface DashboardCourse {
  id: number
  title: string
  category: string
  level: string
  tutor: string
  certificate: boolean
  modules: DashboardModule[]
  meetingLink?: string
}

 interface DashboardClassSchedule {
  days: string[]
  time: string
  duration: number
  flexible: boolean
  startDate: string
  endDate: string
  date: string
  startsAt: string
 }

 interface DashboardClass {
  id: number
  title: string
  tutorName: string
  schedule: DashboardClassSchedule
  meeting_link: string
  status: ClassStatus
  course_id: number | null
  course?: DashboardCourse
 }

 interface DashboardPurchase {
  id: number
  item_name: string
  type: 'Book' | 'Exam'
  download_url: string
  exam_id?: number
}

const drawerWidth = 272
const purchases: DashboardPurchase[] = [
  { id: 1, item_name: 'The Practical React Workbook', type: 'Book', download_url: '#react-workbook' },
]

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h${minutes ? ` ${minutes}m` : ''}` : `${minutes}m`
}
const formatTimeSpent = (seconds: number) => seconds < 60 ? `${seconds}s` : formatDuration(seconds)
const getQuizGrade = (score: number) => score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
const formatClassTime = (time: string) => {
  if (!time) return 'Time to be confirmed'
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 'Time to be confirmed'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`
}
const classScheduleLabel = (schedule: DashboardClassSchedule) => {
  if (schedule.flexible) return 'Flexible schedule'
  const days = schedule.days.length ? schedule.days.join(', ') : 'Days to be confirmed'
  return `${days} · ${formatClassTime(schedule.time)}`
}
const classStartDate = (schedule: DashboardClassSchedule) => {
  if (!schedule.startDate) return null
  const date = new Date(`${schedule.startDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
const formatClassStartDate = (schedule: DashboardClassSchedule) => {
  const date = classStartDate(schedule)
  return date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'Start date not set'
}
const classStartDateTime = (schedule: DashboardClassSchedule) => {
  const date = classStartDate(schedule)
  if (!date) return null
  if (!schedule.flexible && schedule.days.length) {
    const dayIndexes = new Set(schedule.days.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day)))
    while (!dayIndexes.has(date.getDay())) date.setDate(date.getDate() + 1)
  }
  const [hours, minutes] = schedule.time.split(':').map(Number)
  if (Number.isFinite(hours) && Number.isFinite(minutes)) date.setHours(hours, minutes, 0, 0)
  return date
}
const classHasStarted = (schedule: DashboardClassSchedule, now: Date) => {
  const date = classStartDateTime(schedule)
  return date !== null && now.getTime() >= date.getTime()
}
const classHasEnded = (schedule: DashboardClassSchedule, now: Date) => {
  if (!schedule.endDate) return false
  const endDate = new Date(`${schedule.endDate}T00:00:00`)
  endDate.setDate(endDate.getDate() + 1)
  return now.getTime() >= endDate.getTime()
}
const getClassSessionState = (classRecord: DashboardClass, now: Date) => {
  const sessions = classRecord.course?.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.type === 'live' && lesson.scheduledAt).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!)) ?? []
  const activeLesson = sessions.find((lesson) => {
    const start = new Date(lesson.scheduledAt!).getTime()
    const end = lesson.endsAt ? new Date(lesson.endsAt).getTime() : start + 60 * 60 * 1000
    return now.getTime() >= start && now.getTime() < end
  })
  const latestStarted = [...sessions].reverse().find((lesson) => new Date(lesson.scheduledAt!).getTime() <= now.getTime())
  return { activeLesson, isActive: Boolean(activeLesson), hasEnded: Boolean(latestStarted && !activeLesson) }
}
const getLessons = (course: DashboardCourse) => course.modules.flatMap((module) => module.lessons)
const getCompletionLessons = (course: DashboardCourse) => getLessons(course).filter((lesson) => lesson.type !== 'practice')
const getEnrollmentContentId = (enrollment: MyEnrollment) => enrollment.classId ?? enrollment.courseId ?? enrollment.id
const mapEnrollmentCourse = (enrollment: MyEnrollment): DashboardCourse => ({
  id: getEnrollmentContentId(enrollment),
  title: enrollment.classTitle || enrollment.courseTitle || 'Enrolled class',
  category: enrollment.classId === null ? enrollment.category || 'Course' : 'Class',
  level: enrollment.level || 'Not specified',
  tutor: enrollment.tutor || enrollment.classTutor || 'Tutor to be confirmed',
  certificate: enrollment.certificate ?? false,
  modules: enrollment.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      duration: lesson.duration ? formatDuration(lesson.duration) : lesson.type === 'article' ? 'Article' : lesson.type === 'quiz' ? 'Quiz' : lesson.type === 'practice' ? 'Practice' : 'Video',
      description: lesson.articleBody || 'Work through this lesson at your own pace.',
      videoUrl: lesson.videoUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      resources: lesson.resources ?? [],
      quizQuestions: lesson.quizQuestions,
      practiceQuestions: lesson.practiceQuestions,
      passThreshold: lesson.passThreshold,
      meetingUrl: lesson.meetingUrl,
      scheduledAt: lesson.scheduledAt,
      endsAt: lesson.endsAt,
      estimatedDuration: lesson.estimatedDuration,
    })),
  })),
  meetingLink: enrollment.classId === null ? undefined : enrollment.meetingLink ?? undefined,
})
const mapEnrollmentClass = (enrollment: MyEnrollment, course: DashboardCourse): DashboardClass | null => enrollment.classId === null ? null : {
  id: enrollment.classId,
  title: enrollment.classTitle || 'Class enrollment',
  tutorName: enrollment.classTutor || 'Tutor to be confirmed',
  schedule: {
    days: enrollment.classSchedule?.days ?? [],
    time: enrollment.classSchedule?.time ?? '',
    duration: enrollment.classSchedule?.duration ?? 60,
    flexible: enrollment.classSchedule?.flexible ?? false,
    startDate: enrollment.classSchedule?.startDate ?? '',
    endDate: enrollment.classSchedule?.endDate ?? '',
    date: '',
    startsAt: '',
  },
  meeting_link: enrollment.meetingLink || '',
  status: enrollment.classStatus || 'pending_schedule',
  course_id: enrollment.courseId,
  course,
}
const getLatestQuizResults = (attempts: MyEnrollment['quizAttempts']): Record<number, DashboardQuizResult> => attempts
  .filter((attempt) => attempt.score !== null && attempt.passed !== null)
  .sort((first, second) => new Date(second.submittedAt ?? second.startedAt).getTime() - new Date(first.submittedAt ?? first.startedAt).getTime())
  .reduce<Record<number, DashboardQuizResult>>((results, attempt) => {
    if (results[attempt.lessonId] === undefined) results[attempt.lessonId] = { score: attempt.score!, passed: attempt.passed!, disqualified: attempt.disqualified, retakeApproved: attempt.retakeApproved || attempts.some((candidate) => candidate.lessonId === attempt.lessonId && candidate.retakeApproved), answerStatuses: Object.fromEntries((attempt.questionResults ?? Object.entries(attempt.answers ?? {}).map(([id, answer]) => ({ questionId: Number(id), status: typeof answer === 'object' && answer !== null && 'status' in answer ? answer.status : typeof answer === 'number' ? 'answered' : 'unanswered' }))).map((item) => [item.questionId, item.status])), violationCount: attempt.violations?.length ?? 0, questionResults: attempt.questionResults }
    return results
  }, {})
const mapMyEnrollments = (records: MyEnrollment[], userId: number): DashboardEnrollment[] => records.flatMap((record) => {
  const course = mapEnrollmentCourse(record)
  const classRecord = mapEnrollmentClass(record, course)
  const quizResults = getLatestQuizResults(record.quizAttempts)
  const lessonById = new Map(record.modules.flatMap((module) => module.lessons).map((lesson) => [lesson.id, lesson]))
  const activityDates = [
    ...Object.values(record.lessonProgress ?? {}).map((progress) => progress.completedAt),
    ...record.quizAttempts.filter((attempt) => attempt.passed === true).map((attempt) => attempt.submittedAt ?? attempt.startedAt),
    ...Object.entries(record.attendance ?? {}).filter(([, status]) => status === 'Present').map(([lessonId]) => lessonById.get(Number(lessonId))?.scheduledAt),
  ].filter((date): date is string => Boolean(date))
  const courseEnrollment: DashboardEnrollment = { id: record.id, user_id: userId, type: 'course', item_id: getEnrollmentContentId(record), status: 'active', progress: record.progressPercentage, timeSpentSeconds: record.timeSpentSeconds, quizResults, attendance: record.attendance ?? {}, sessionJoinClicks: record.sessionJoinClicks ?? {}, activityDates, course }
  if (!classRecord) return [courseEnrollment]
  return [{ id: record.id, user_id: userId, type: 'class', item_id: classRecord.id, status: classRecord.status === 'pending_schedule' ? 'pending_schedule' : 'active', progress: record.progressPercentage, timeSpentSeconds: record.timeSpentSeconds, quizResults, attendance: record.attendance ?? {}, sessionJoinClicks: record.sessionJoinClicks ?? {}, activityDates, classRecord }]
})
const getCourseProgress = (course: DashboardCourse, completedLessonIds: number[]) => Math.round((completedLessonIds.filter((lessonId) => getCompletionLessons(course).some((lesson) => lesson.id === lessonId)).length / Math.max(1, getCompletionLessons(course).length)) * 100)
const getEnrollmentCourse = (enrollment: DashboardEnrollment) => enrollment.course ?? enrollment.classRecord?.course
const findCourseEnrollment = (records: DashboardEnrollment[], courseId: number) => records.find((enrollment) => enrollment.type === 'class' && getEnrollmentCourse(enrollment)?.id === courseId) ?? records.find((enrollment) => getEnrollmentCourse(enrollment)?.id === courseId)
const getEnrollmentOverallGrade = (enrollment: DashboardEnrollment, completionPercentage = enrollment.progress, now = new Date()) => {
  const course = getEnrollmentCourse(enrollment)
  const lessons = course ? getLessons(course) : []
  return calculateOverallGrade({
    quizLessonIds: lessons.filter((lesson) => lesson.type === 'quiz').map((lesson) => lesson.id),
    quizScores: Object.fromEntries(Object.entries(enrollment.quizResults).map(([lessonId, result]) => [Number(lessonId), result.score])),
    attendance: enrollment.attendance,
    liveLessons: lessons.filter((lesson) => lesson.type === 'live'),
    completionPercentage,
    isClass: enrollment.type === 'class',
    now,
  })
}
const OverallGradeValue: FC<{ grade: ReturnType<typeof getEnrollmentOverallGrade> }> = ({ grade }) => <Stack direction="row" spacing={1.25} alignItems="center"><Typography variant="body2" color="text.secondary">Overall grade</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{grade.percentage}%</Typography><Chip label={grade.letter} size="small" color={grade.letter === 'F' ? 'error' : grade.letter === 'D' ? 'warning' : 'success'} /></Stack>
const ClassRankValue: FC<{ rank?: number }> = ({ rank }) => rank === undefined ? null : <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>Class rank: {rank}</Typography>
const getClassRank = (data: GamificationData | null, classId?: number) => {
  if (!data || classId === undefined) return undefined
  const rank = data.classRanks?.find((entry) => Number(entry.classId) === classId)?.rank
  return rank ?? (Number(data.classId) === classId ? data.leaderboard.find((entry) => entry.isCurrentStudent)?.rank : undefined)
}
const iconForLesson = (type: DashboardLesson['type']) => {
  if (type === 'article') return <ArticleOutlinedIcon fontSize="small" />
  if (type === 'quiz') return <QuizOutlinedIcon fontSize="small" />
  if (type === 'practice') return <QuizOutlinedIcon fontSize="small" />
  return <PlayCircleOutlineIcon fontSize="small" />
}

const ViewHeading: FC<{ eyebrow?: string; title: string; description: string; action?: ReactNode }> = ({ eyebrow, title, description, action }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      {eyebrow && <Typography color="primary.main" variant="overline" sx={{ fontWeight: 700, letterSpacing: 1 }}>{eyebrow}</Typography>}
      <Typography component="h1" variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
    {action}
  </Box>
)

const SummaryCard: FC<{ label: string; value: string; detail: string; icon: ReactNode; onClick?: () => void }> = ({ label, value, detail, icon, onClick }) => (
  <Card elevation={0} onClick={onClick} sx={{ flex: 1, minWidth: { xs: '100%', sm: 210 }, border: 1, borderColor: 'divider', cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { borderColor: 'primary.main' } : undefined }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography component="h2" color="text.secondary" variant="body2">{label}</Typography>
        <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>
      </Box>
      <Typography variant="h5" sx={{ mb: 0.75 }}>{value}</Typography>
      <Typography color="text.secondary" variant="body2">{detail}</Typography>
    </CardContent>
  </Card>
)

const DashboardHeader: FC<{ title: string; darkMode: boolean; language: string; onLanguageChange: () => void; onToggleDarkMode: () => void; onOpenMenu: () => void }> = ({ title, darkMode, language, onLanguageChange, onToggleDarkMode, onOpenMenu }) => {
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const user = getAuthenticatedUser()
  const displayName = user?.name || 'Alex Morgan'

  return <Box component="header" sx={{ height: 72, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <IconButton onClick={onOpenMenu} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="Open dashboard navigation"><MenuIcon /></IconButton>
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Coursespace</Typography></Box>
      <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 2, pl: 2, borderLeft: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">Student portal /</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
      </Box>
    </Box>
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Tooltip title={`Language: ${language}`}><IconButton onClick={onLanguageChange} aria-label={`Change language, currently ${language}`}><TranslateOutlinedIcon /><Typography variant="caption" sx={{ ml: 0.25, fontWeight: 700 }}>{language}</Typography></IconButton></Tooltip>
      <Tooltip title="Notifications"><IconButton aria-label="Notifications"><NotificationsNoneOutlinedIcon /></IconButton></Tooltip>
      <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}><IconButton onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton></Tooltip>
      <Tooltip title="Open profile menu"><IconButton onClick={(event) => setProfileAnchor(event.currentTarget)} aria-label="Open profile menu" aria-controls={profileAnchor ? 'student-profile-menu' : undefined} aria-haspopup="true"><AccountCircleOutlinedIcon /></IconButton></Tooltip>
      <Menu id="student-profile-menu" anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)} PaperProps={{ sx: { minWidth: 190, borderRadius: 2, p: 0.75 } }}>
        <MenuItem onClick={() => { setProfileAnchor(null); window.dispatchEvent(new CustomEvent('student-profile-open')) }}><PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />{displayName}</MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); void signOut().then(() => navigateTo('/', true)) }}>Sign out</MenuItem>
      </Menu>
    </Stack>
  </Box>
}

interface SidebarProps {
  activeView: DashboardView
  onSelectView: (view: DashboardView) => void
}

const DashboardSidebar: FC<SidebarProps> = ({ activeView, onSelectView }) => {
  const enrollmentActive = activeView === 'courses' || activeView === 'classes' || activeView === 'course-view'
  const [isEnrollmentExpanded, setIsEnrollmentExpanded] = useState(enrollmentActive)

  useEffect(() => {
    setIsEnrollmentExpanded(enrollmentActive)
  }, [enrollmentActive])

  const toggleEnrollment = () => {
    setIsEnrollmentExpanded((current) => !current)
    if (!enrollmentActive) onSelectView('courses')
  }
  const navItem = (view: DashboardView, label: string, icon: ReactNode, active: boolean, endIcon?: ReactNode, onClick?: () => void, ariaExpanded?: boolean) => <Box component="button" type="button" aria-expanded={ariaExpanded} onClick={onClick ?? (() => onSelectView(view))} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5, backgroundColor: active ? 'primary.main' : 'transparent', color: active ? 'primary.contrastText' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: active ? 'primary.dark' : 'action.hover' } }}><Box sx={{ display: 'flex' }}>{icon}</Box><Typography variant="body2" sx={{ flex: 1, fontWeight: active ? 600 : 400 }}>{label}</Typography>{endIcon}</Box>

  return <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ px: 3, py: 2.5 }}><Logo /></Box>
    <Divider />
    <Box component="nav" aria-label="Student dashboard navigation" sx={{ p: 1.5, flex: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1.5, mb: 1, letterSpacing: 1.2, fontWeight: 700 }}>Main menu</Typography>
      {navItem('overview', 'Dashboard', <DashboardOutlinedIcon fontSize="small" />, activeView === 'overview')}
      {navItem('calendar', 'Calendar', <CalendarTodayOutlinedIcon fontSize="small" />, activeView === 'calendar')}
      <Box>
        {navItem('courses', 'My Enrollments', <MenuBookOutlinedIcon fontSize="small" />, enrollmentActive, <ExpandMoreIcon fontSize="small" sx={{ transform: isEnrollmentExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} />, toggleEnrollment, isEnrollmentExpanded)}
        {isEnrollmentExpanded && <Box sx={{ ml: 2, mb: 1 }}>
          <Box component="button" type="button" onClick={() => onSelectView('courses')} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, border: 0, borderLeft: 2, borderColor: activeView === 'courses' || activeView === 'course-view' ? 'primary.main' : 'divider', py: 0.75, pl: 1.5, pr: 1, backgroundColor: 'transparent', color: activeView === 'courses' || activeView === 'course-view' ? 'primary.main' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeView === 'courses' || activeView === 'course-view' ? 600 : 400, textAlign: 'left' }}><MenuBookOutlinedIcon fontSize="small" />My Courses</Box>
          <Box component="button" type="button" onClick={() => onSelectView('classes')} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, border: 0, borderLeft: 2, borderColor: activeView === 'classes' ? 'primary.main' : 'divider', py: 0.75, pl: 1.5, pr: 1, backgroundColor: 'transparent', color: activeView === 'classes' ? 'primary.main' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeView === 'classes' ? 600 : 400, textAlign: 'left' }}><ClassOutlinedIcon fontSize="small" />My Classes</Box>
        </Box>}
      </Box>
      {navItem('quizzes', 'Quizzes & Results', <QuizOutlinedIcon fontSize="small" />, activeView === 'quizzes')}
      {navItem('purchases', 'My Purchases', <PaymentsOutlinedIcon fontSize="small" />, activeView === 'purchases')}
      {navItem('other-courses', 'Other Courses', <MenuBookOutlinedIcon fontSize="small" />, activeView === 'other-courses')}
      {navItem('other-classes', 'Other Classes', <ClassOutlinedIcon fontSize="small" />, activeView === 'other-classes')}
      {navItem('profile', 'Profile', <PersonOutlineIcon fontSize="small" />, activeView === 'profile')}
      {navItem('payments', 'Payment History', <PaymentsOutlinedIcon fontSize="small" />, activeView === 'payments')}
    </Box>
    <Box sx={{ p: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, backgroundColor: 'background.default', borderRadius: 2 }}><SchoolOutlinedIcon color="primary" fontSize="small" /><Typography variant="caption" color="text.secondary">Keep learning at your own pace.</Typography></Box></Box>
  </Box>
}

const StudentCalendarView: FC<{ enrollments: DashboardEnrollment[]; now: Date; onJoin: (session: ScheduleSession) => void }> = ({ enrollments, now, onJoin }) => {
  const sessions = enrollments.flatMap((enrollment) => {
    const classRecord = enrollment.classRecord
    if (enrollment.type !== 'class' || !classRecord?.course) return []
    const course = classRecord.course
    return getLessons(course)
      .filter((lesson) => lesson.type === 'live' && lesson.scheduledAt)
      .map((lesson) => ({
        id: `${enrollment.id}-${lesson.id}`,
        classTitle: classRecord.title,
        lessonTitle: lesson.title,
        scheduledAt: lesson.scheduledAt!,
        endsAt: lesson.endsAt,
        meetingUrl: lesson.meetingUrl || classRecord.meeting_link,
        classSchedule: classScheduleLabel(classRecord.schedule),
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      }))
  })

  return <ScheduleCalendar
    title="Class calendar"
    description="See every upcoming live session from your enrolled classes in one place."
    sessions={sessions}
    now={now}
    emptyTitle="No upcoming live sessions"
    emptyDescription="Your scheduled live lessons will appear here once they are added to an enrolled class."
    onJoin={onJoin}
  />
}

const OverviewView: FC<{ enrollments: DashboardEnrollment[]; now: Date; onSelectView: (view: DashboardView) => void; onOpenCourse: (courseId: number) => void; gamificationData: GamificationData }> = ({ enrollments, now, onSelectView, onOpenCourse, gamificationData }) => {
  const courseEnrollments = enrollments.filter((enrollment) => enrollment.type === 'course' && enrollment.status !== 'completed')
  const activeCourseCount = courseEnrollments.length
  const nextClassEnrollment = enrollments.find((enrollment) => enrollment.type === 'class' && enrollment.status === 'active' && enrollment.classRecord?.status === 'open' && classHasStarted(enrollment.classRecord.schedule, now))
  const nextClass = nextClassEnrollment?.classRecord
  const pendingCount = enrollments.filter((enrollment) => enrollment.type === 'class' && enrollment.status === 'pending_schedule').length

  return <>
    <ViewHeading eyebrow="Welcome back" title="Dashboard" description="Pick up where you left off and stay on top of your learning schedule." />
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <SummaryCard label="Active courses" value={String(activeCourseCount)} detail="Self-paced courses in progress" icon={<MenuBookOutlinedIcon />} onClick={() => onSelectView('courses')} />
      <SummaryCard label="Next live class" value={nextClass?.title ?? 'No class scheduled'} detail={nextClass ? classScheduleLabel(nextClass.schedule) : 'Check My Classes for updates'} icon={<VideoCallOutlinedIcon />} onClick={() => onSelectView('classes')} />
      <SummaryCard label="Learning progress" value={`${Math.round(courseEnrollments.reduce((total, enrollment) => total + enrollment.progress, 0) / Math.max(1, courseEnrollments.length))}%`} detail="Average across active courses" icon={<CheckCircleOutlineIcon />} />
    </Stack>
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: 1, borderColor: 'divider' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>Overall grades</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Your combined quiz, attendance, and completion performance for each enrollment.</Typography>
      <Stack spacing={1.25}>{enrollments.map((enrollment) => {
        const course = getEnrollmentCourse(enrollment)
        if (!course) return null
        const classRank = enrollment.type === 'class' ? getClassRank(gamificationData, enrollment.classRecord?.id) : undefined
        return <Stack key={`${enrollment.type}-${enrollment.id}`} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ p: 1.25, borderRadius: 1.5, backgroundColor: 'background.default' }}><Box><Typography sx={{ fontWeight: 600 }}>{enrollment.type === 'class' ? enrollment.classRecord?.title : course.title}</Typography><Typography variant="body2" color="text.secondary">{enrollment.type === 'class' ? 'Class' : 'Course'}</Typography></Box><Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}><OverallGradeValue grade={getEnrollmentOverallGrade(enrollment, enrollment.progress, now)} /><ClassRankValue rank={classRank} /></Stack></Stack>
      })}</Stack>
    </Paper>
    <GamificationWidgets data={gamificationData} />
    {pendingCount > 0 && <Alert severity="info" icon={<CalendarTodayOutlinedIcon />} action={<Button color="inherit" size="small" onClick={() => onSelectView('classes')}>View classes</Button>} sx={{ mb: 3 }}><Box><Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700 }}>Pending items</Typography><Typography variant="body2">You have {pendingCount} class {pendingCount === 1 ? 'enrollment' : 'enrollments'} awaiting scheduling. We&apos;ll contact you to arrange the next step.</Typography></Box></Alert>}
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper elevation={0} sx={{ flex: 1, p: 2.5, border: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>Continue learning</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Jump back into your most recently active course.</Typography>
        {courseEnrollments[0]?.course && <CourseMiniRow course={courseEnrollments[0].course} enrollment={courseEnrollments[0]} onOpenCourse={onOpenCourse} />}
      </Paper>
      <Paper elevation={0} sx={{ flex: 1, p: 2.5, border: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>Upcoming class</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Your next scheduled live learning session.</Typography>
        {nextClass ? <Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><CalendarTodayOutlinedIcon /></Box><Box><Typography sx={{ fontWeight: 600 }}>{nextClass.title}</Typography><Typography color="text.secondary" variant="body2">{classScheduleLabel(nextClass.schedule)}</Typography><Typography color="text.secondary" variant="body2">Tutor: {nextClass.tutorName}</Typography></Box></Stack> : <Typography color="text.secondary">Your schedule will appear here once a class is confirmed.</Typography>}
      </Paper>
    </Stack>
  </>
}

const CourseMiniRow: FC<{ course: DashboardCourse; enrollment: DashboardEnrollment; onOpenCourse: (courseId: number) => void }> = ({ course, enrollment, onOpenCourse }) => <Box component="button" type="button" onClick={() => onOpenCourse(course.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper', cursor: 'pointer', textAlign: 'left', font: 'inherit', '&:hover': { borderColor: 'primary.main' } }}><Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><PlayCircleOutlineIcon /></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 600 }}>{course.title}</Typography><LinearProgress variant="determinate" value={enrollment.progress} sx={{ mt: 1, height: 6, borderRadius: 4 }} /></Box><Typography color="primary.main" variant="body2" sx={{ fontWeight: 700 }}>{enrollment.progress}%</Typography></Box>

const CoursesView: FC<{ enrollments: DashboardEnrollment[]; completedLessons: Record<number, number[]>; onOpenCourse: (courseId: number) => void }> = ({ enrollments, completedLessons, onOpenCourse }) => {
  const courseEnrollments = enrollments.filter((enrollment) => enrollment.type === 'course' && enrollment.course)
  return <>
    <ViewHeading title="My Courses" description="Build momentum with the self-paced courses in your learning plan." />
    {courseEnrollments.length === 0 ? <EmptyState title="No courses yet" description="Your paid course enrollments will appear here." actionLabel="Browse courses" onAction={() => navigateTo('/')} /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {courseEnrollments.map((enrollment) => {
        const course = enrollment.course!
        const completed = completedLessons[course.id]
        const progress = completed === undefined ? enrollment.progress : getCourseProgress(course, completed)
        return <Card key={enrollment.id} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ minHeight: 110, p: 2.5, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.16), rgba(16, 125, 111, 0.04))' }}><MenuBookOutlinedIcon color="primary" sx={{ fontSize: 38 }} /></Box>
          <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}><Chip label={course.category} size="small" color="primary" variant="outlined" /><Typography variant="caption" color="text.secondary">{course.level}</Typography></Stack>
            <Typography variant="h6" sx={{ mb: 1 }}>{course.title}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Tutor: {course.tutor}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Time spent: {formatTimeSpent(enrollment.timeSpentSeconds)}</Typography>
            <Box sx={{ mb: 2 }}><OverallGradeValue grade={getEnrollmentOverallGrade(enrollment, progress)} /></Box>
            <Box sx={{ mt: 'auto' }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="body2">Progress</Typography><Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 2 }} /><Button fullWidth variant="contained" onClick={() => onOpenCourse(course.id)}>{progress ? 'Continue course' : 'Start course'}</Button></Box>
          </CardContent>
        </Card>
      })}
    </Box>}
  </>
}

const ClassesView: FC<{ enrollments: DashboardEnrollment[]; completedLessons: Record<number, number[]>; now: Date; onOpenCourse: (courseId: number) => void; gamificationData: GamificationData | null }> = ({ enrollments, completedLessons, now, onOpenCourse, gamificationData }) => {
  const classEnrollments = enrollments.filter((enrollment) => enrollment.type === 'class' && enrollment.classRecord)
  return <>
    <ViewHeading title="My Classes" description="Continue your class curriculum and keep up with live learning sessions." />
    {classEnrollments.length === 0 ? <EmptyState title="No classes yet" description="Paid class enrollments will appear here once they are assigned." actionLabel="Explore courses" onAction={() => navigateTo('/')} /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>{classEnrollments.map((enrollment) => {
      const classRecord = enrollment.classRecord!
      const course = classRecord.course!
      const hasStarted = classHasStarted(classRecord.schedule, now)
      const classEnded = classHasEnded(classRecord.schedule, now)
      const canOpenClass = classRecord.status !== 'closed' && classRecord.status !== 'pending_schedule' && hasStarted && !classEnded
      const progress = getCourseProgress(course, completedLessons[course.id] ?? [])
      const classRank = getClassRank(gamificationData, classRecord.id)
      const nextLiveLesson = getLessons(course).find((lesson) => lesson.type === 'live' && lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() >= now.getTime())
      return <Card key={enrollment.id} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ minHeight: 110, p: 2.5, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.16), rgba(16, 125, 111, 0.04))' }}><ClassOutlinedIcon color="primary" sx={{ fontSize: 38 }} /></Box>
        <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center" sx={{ mb: 1 }}><Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap"><Chip label={classRecord.status === 'pending_schedule' ? 'Pending schedule' : classEnded || classRecord.status === 'closed' ? 'Closed' : !hasStarted ? `Starts ${formatClassStartDate(classRecord.schedule)}` : 'Active class'} size="small" color={canOpenClass ? 'success' : 'warning'} variant="outlined" /><ClassRankValue rank={classRank} /></Stack><Typography variant="caption" color="text.secondary">Class</Typography></Stack>
          <Typography variant="h6" sx={{ mb: 1 }}>{classRecord.title}</Typography>
          <Typography color="text.secondary" variant="body2">Tutor: {classRecord.tutorName}</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>{nextLiveLesson?.scheduledAt ? `Next live session: ${new Date(nextLiveLesson.scheduledAt).toLocaleString()}` : classScheduleLabel(classRecord.schedule)}</Typography>
          <Box sx={{ mb: 2 }}><OverallGradeValue grade={getEnrollmentOverallGrade(enrollment, progress, now)} /></Box>
          <Box sx={{ mt: 'auto' }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="body2">Progress</Typography><Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 2 }} /><Button fullWidth variant="contained" disabled={!canOpenClass} onClick={() => { if (canOpenClass) onOpenCourse(course.id) }}>{classEnded || classRecord.status === 'closed' ? 'Class ended' : !hasStarted ? 'Available at start time' : progress ? 'Continue class' : 'Open class'}</Button></Box>
        </CardContent>
      </Card>
    })}</Box>}
  </>
}

const ClassCard: FC<{ classRecord: DashboardClass; now: Date; onOpenCourse: (courseId: number) => void }> = ({ classRecord, now, onOpenCourse }) => {
  const hasStarted = classHasStarted(classRecord.schedule, now)
  const classEnded = classHasEnded(classRecord.schedule, now)
  const sessionState = getClassSessionState(classRecord, now)
  const hasLiveLessons = classRecord.course?.modules.some((module) => module.lessons.some((lesson) => lesson.type === 'live')) === true
  const isJoinable = classRecord.status === 'open' && !classEnded && Boolean(sessionState.activeLesson?.meetingUrl)
  const statusLabel = classRecord.status === 'pending_schedule' ? 'Pending schedule' : classEnded || classRecord.status === 'closed' ? 'Closed' : classRecord.status === 'open' ? hasStarted ? 'Scheduled' : classRecord.schedule.startDate ? `Starts ${formatClassStartDate(classRecord.schedule)}` : 'Start date not set' : classRecord.status === 'full' ? 'Full' : 'Closed'
  const statusColor = classRecord.status === 'pending_schedule' || classRecord.status === 'full' || (classRecord.status === 'open' && !hasStarted) ? 'warning' : classRecord.status === 'open' ? 'success' : 'error'
  const linkedCourse = classRecord.course
  return <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
    <CardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><ClassOutlinedIcon /></Box><Box><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6">{classRecord.title}</Typography><Chip label={statusLabel} size="small" color={statusColor} /></Stack>{classRecord.status === 'pending_schedule' ? <Typography color="text.secondary" sx={{ mt: 0.75 }}>Pending — we&apos;ll contact you to schedule your class.</Typography> : <><Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>{classScheduleLabel(classRecord.schedule)}</Typography><Typography color="text.secondary" variant="body2">Tutor: {classRecord.tutorName}</Typography><Typography color="text.secondary" variant="body2">Session duration: {formatDuration(classRecord.schedule.duration * 60)}</Typography>{classRecord.status === 'open' && <Typography color="text.secondary" variant="body2">{classRecord.schedule.startDate ? `Starts ${formatClassStartDate(classRecord.schedule)}` : 'Start date not set'}</Typography>}</>}</Box></Box>
        {classRecord.status === 'open' && !classEnded && <Button variant="contained" component="a" href={isJoinable ? sessionState.activeLesson?.meetingUrl : undefined} disabled={!isJoinable} aria-disabled={!isJoinable} onClick={(event) => { if (!isJoinable) event.preventDefault() }} startIcon={<VideoCallOutlinedIcon />} sx={{ flexShrink: 0 }}>{isJoinable ? 'Join live session' : sessionState.hasEnded ? 'Session Ended' : 'Available at scheduled time'}</Button>}
      </Stack>
      {linkedCourse && <><Divider sx={{ my: 2 }} /><Button variant="text" size="small" startIcon={<MenuBookOutlinedIcon />} onClick={() => onOpenCourse(linkedCourse.id)}>View {linkedCourse.title} curriculum summary</Button></>}
    </CardContent>
  </Card>
}

const QuizzesView: FC<{ enrollments: DashboardEnrollment[]; completedLessons: Record<number, number[]>; quizResults: Record<number, Record<number, DashboardQuizResult>>; onOpenCourse: (courseId: number, lessonId?: number, readOnly?: boolean) => void }> = ({ enrollments, completedLessons, quizResults, onOpenCourse }) => {
  const enrolledQuizzes = enrollments.flatMap((enrollment) => {
    const course = enrollment.type === 'course' ? enrollment.course : enrollment.classRecord?.course
    if (!course) return []
    const source = enrollment.type === 'class' ? `Class: ${enrollment.classRecord?.title ?? course.title}` : `Course: ${course.title}`
    const lessons = getLessons(course)
    const isQuizAvailable = (lesson: DashboardLesson) => {
      const lessonIndex = lessons.findIndex((item) => item.id === lesson.id)
      return lessonIndex === 0 || completedLessons[course.id]?.includes(lessons[lessonIndex - 1].id) === true
    }
    return course.modules.flatMap((module) => module.lessons.filter((lesson) => lesson.type === 'quiz').map((lesson) => { const result = quizResults[course.id]?.[lesson.id]; const available = isQuizAvailable(lesson); return { enrollmentId: enrollment.id, enrollmentType: enrollment.type, course, lesson, moduleTitle: module.title, source, available, completed: (completedLessons[course.id] ?? []).includes(lesson.id), result, finished: (completedLessons[course.id] ?? []).includes(lesson.id) || Boolean(result), retakeAllowed: Boolean(result && !result.passed && (result.retakeApproved || (!result.disqualified && !result.violationCount && Object.values(result.answerStatuses ?? {}).includes('expired')))) } }))
  })

  const quizPageSize = 6
  const [page, setPage] = useState(1)
  const pageCount = Math.ceil(enrolledQuizzes.length / quizPageSize)
  const visibleQuizzes = enrolledQuizzes.slice((page - 1) * quizPageSize, page * quizPageSize)

  useEffect(() => setPage(1), [enrolledQuizzes.length])

  return <>
    <ViewHeading title="Quizzes & Results" description="Complete the lesson before each quiz to unlock it, then review your quiz results." />
    {enrolledQuizzes.length === 0 ? <EmptyState title="No quizzes available" description="Quizzes from your enrolled courses and classes will appear here." /> : <><Stack spacing={2}>{visibleQuizzes.map(({ enrollmentId, enrollmentType, course, lesson, moduleTitle, source, available, completed, result, finished, retakeAllowed }) => <Card key={`${enrollmentType}-${enrollmentId}-${course.id}-${lesson.id}`} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}><Box sx={{ display: 'flex', gap: 1.5 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><QuizOutlinedIcon /></Box><Box><Typography variant="h6">{lesson.title}</Typography><Typography color="text.secondary" variant="body2">{source} · {moduleTitle}</Typography>{result ? <Typography color={result.passed ? 'success.main' : 'warning.main'} variant="body2" sx={{ mt: 0.75, fontWeight: 600 }}>{result.passed ? 'Passed' : 'Latest attempt'} · Score {result.score}% · Grade {getQuizGrade(result.score)} · {Object.values(result.answerStatuses ?? {}).filter((status) => status === 'answered').length} answered / {Object.values(result.answerStatuses ?? {}).filter((status) => status === 'expired').length} expired{result.violationCount ? ` · Flagged: ${result.violationCount} violation${result.violationCount === 1 ? '' : 's'}` : ''}</Typography> : completed && <Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>Completed · Score not recorded</Typography>}</Box></Box><Stack direction="row" spacing={1} alignItems="center"><Chip icon={completed ? <CheckCircleOutlineIcon /> : undefined} label={completed ? 'Completed' : result ? 'Finished' : available ? 'Ready to take' : 'Complete previous lesson'} color={completed ? 'success' : result ? 'warning' : 'primary'} size="small" variant={finished ? 'filled' : 'outlined'} /><Button variant={finished ? 'outlined' : 'contained'} size="small" onClick={() => onOpenCourse(course.id, lesson.id, retakeAllowed ? false : finished)} disabled={!available && !finished}>{retakeAllowed ? 'Retake quiz' : finished ? 'View result' : 'Open quiz'}</Button></Stack></Stack></CardContent></Card>)}</Stack>
      {pageCount > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" aria-label="Quiz results pages" /></Stack>}
    </>}
  </>
}

const PurchasesView: FC = () => {
  const [practicePurchases, setPracticePurchases] = useState<Array<{ id: number; exam_id: number }>>([])
  const [practiceExams, setPracticeExams] = useState<Record<number, Awaited<ReturnType<typeof getPracticeExam>>>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getPracticePurchases().then(async (records) => {
      const exams = await Promise.all(records.map(async (record) => [record.exam_id, await getPracticeExam(record.exam_id)] as const))
      if (!active) return
      setPracticePurchases(records)
      setPracticeExams(Object.fromEntries(exams))
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load practice purchases.') })
    return () => { active = false }
  }, [])

  return <>
    <ViewHeading title="My Purchases" description="Access your bookstore items and purchased practice exams." />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {purchases.map((purchase) => <Card key={purchase.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><MenuBookOutlinedIcon /></Box><Box sx={{ flex: 1 }}><Chip label={purchase.type} size="small" variant="outlined" sx={{ mb: 1 }} /><Typography variant="h6" sx={{ mb: 2 }}>{purchase.item_name}</Typography><Button variant="outlined" size="small" component="a" href={purchase.download_url} startIcon={<DownloadOutlinedIcon />}>Download item</Button></Box></Stack></CardContent></Card>)}
      {practicePurchases.map((purchase) => { const exam = practiceExams[purchase.exam_id]; return <Card key={`practice-${purchase.id}`} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><SchoolOutlinedIcon /></Box><Box sx={{ flex: 1 }}><Chip label="Practice exam" size="small" variant="outlined" sx={{ mb: 1 }} /><Typography variant="h6" sx={{ mb: 2 }}>{exam?.title ?? 'Practice exam'}</Typography><Button variant="outlined" size="small" disabled={!exam} onClick={() => navigateTo(`/practice-exams/${purchase.exam_id}`)}>Practice exam</Button></Box></Stack></CardContent></Card> })}
    </Box>
  </>
}

const catalogPageSize = 6
const OtherCoursesView: FC<{ courses: Course[]; enrolledCourseIds: Set<string>; isLoading: boolean; error: string | null }> = ({ courses, enrolledCourseIds, isLoading, error }) => {
  const [page, setPage] = useState(1)
  const availableCourses = courses.filter((course) => !enrolledCourseIds.has(String(course.id)))
  const pageCount = Math.ceil(availableCourses.length / catalogPageSize)
  const visibleCourses = availableCourses.slice((page - 1) * catalogPageSize, page * catalogPageSize)

  useEffect(() => setPage(1), [courses.length, enrolledCourseIds.size])

  return <>
    <ViewHeading title="Other Courses" description="Explore more courses outside your current learning plan." />
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading other courses" /></Box> : error ? <EmptyState title="Courses unavailable" description={error} /> : availableCourses.length === 0 ? <EmptyState title="No other courses yet" description="You are enrolled in every published course." /> : <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>{visibleCourses.map((course) => <Card key={String(course.id)} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}><Box component="img" src={course.cover} alt={course.title} sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} /><CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}><Chip label={course.category} size="small" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1.5 }} /><Typography variant="h6" sx={{ mb: 1 }}>{course.title}</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto', pt: 2 }}><Typography color="primary.main" sx={{ fontWeight: 700 }}>${course.price}</Typography><Button variant="outlined" size="small" onClick={() => navigateTo(`/courses/${course.id}`)}>View course</Button></Stack></CardContent></Card>)}</Box>
      {pageCount > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" aria-label="Other courses pages" /></Stack>}
    </>}
  </>
}

const OtherClassesView: FC<{ classes: PublicClass[]; enrolledClassIds: Set<number>; isLoading: boolean; error: string | null; onEnroll: (classRecord: PublicClass) => void }> = ({ classes, enrolledClassIds, isLoading, error, onEnroll }) => {
  const [page, setPage] = useState(1)
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null)
  const availableClasses = classes.filter((classRecord) => !enrolledClassIds.has(classRecord.id))
  const pageCount = Math.ceil(availableClasses.length / catalogPageSize)
  const visibleClasses = availableClasses.slice((page - 1) * catalogPageSize, page * catalogPageSize)

  useEffect(() => setPage(1), [classes.length, enrolledClassIds.size])

  return <>
    <ViewHeading title="Other Classes" description="Find live classes available outside your current schedule." />
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading other classes" /></Box> : error ? <EmptyState title="Classes unavailable" description={error} /> : availableClasses.length === 0 ? <EmptyState title="No other classes yet" description="There are no additional published classes available right now." /> : <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>{visibleClasses.map((classRecord) => { const schedule = { ...classRecord.schedule, date: '', startsAt: '' }; const statusLabel = classRecord.enrollmentClosed ? 'Enrollment closed' : classRecord.status === 'pending_schedule' ? 'Pending schedule' : classRecord.status === 'open' ? 'Available' : classRecord.status === 'full' ? 'Full' : 'Closed'; const statusColor = classRecord.enrollmentClosed || classRecord.status === 'closed' ? 'error' : classRecord.status === 'open' ? 'success' : 'warning'; return <Card key={classRecord.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><ClassOutlinedIcon /></Box><Chip label={statusLabel} size="small" color={statusColor} /></Stack><Typography variant="h6" sx={{ mb: 1 }}>{classRecord.title}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Tutor: {classRecord.tutorName}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{classScheduleLabel(schedule)}</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}><Typography color="primary.main" sx={{ fontWeight: 700 }}>${classRecord.price}</Typography><Button variant="contained" size="small" onClick={() => !classRecord.enrollmentClosed && onEnroll(classRecord)} disabled={classRecord.status !== 'open' && classRecord.status !== 'full'}>{classRecord.status === 'full' ? 'Join waitlist' : 'Enroll'}</Button></Stack><Button fullWidth variant="text" size="small" onClick={() => setExpandedClassId((current) => current === classRecord.id ? null : classRecord.id)} aria-expanded={expandedClassId === classRecord.id} aria-controls={`class-details-${classRecord.id}`} endIcon={<ExpandMoreIcon sx={{ transform: expandedClassId === classRecord.id ? 'rotate(180deg)' : undefined, transition: 'transform 180ms ease' }} />}>View details</Button><Collapse in={expandedClassId === classRecord.id} timeout="auto" unmountOnExit><Box id={`class-details-${classRecord.id}`} sx={{ pt: 1.5, mt: 1, borderTop: 1, borderColor: 'divider' }}><Stack spacing={0.75}><Typography variant="body2">Enrollment: {classRecord.enrolledCount}/{classRecord.capacity} seats filled</Typography><Typography variant="body2">Curriculum: {classRecord.moduleCount ?? 0} modules · {classRecord.lessonCount ?? 0} lessons</Typography><Typography variant="body2">Starts: {classRecord.schedule.startDate ? formatClassStartDate(schedule) : 'Date to be confirmed'}</Typography>{classRecord.courseTitle && <Typography variant="body2">Course: {classRecord.courseTitle}</Typography>}</Stack></Box></Collapse></CardContent></Card> })}</Box>
      {pageCount > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" aria-label="Other classes pages" /></Stack>}
    </>}
  </>
}

const ProfileFact: FC<{ icon: ReactNode; label: string; value: string }> = ({ icon, label, value }) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0, borderRadius: 1.5, backgroundColor: 'action.hover', color: 'primary.main' }}>{icon}</Box><Box sx={{ minWidth: 0 }}><Typography variant="overline" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography></Box></Box>

const ProfileView: FC<{ onUpdateProfile: (profile: { name: string; email: string; phone: string }) => void }> = ({ onUpdateProfile }) => {
  const user = getAuthenticatedUser()
  const [profile, setProfile] = useState({ name: user?.name || 'Alex Morgan', email: user?.email || 'alex@example.com', phone: '+1 202 555 0147' })
  const initials = profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <>
    <ViewHeading title="Profile" description="Keep your learner details current and up to date." />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, 0.8fr) minmax(0, 1.2fr)' }, gap: 3 }}>
      <Paper elevation={0} sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Avatar sx={{ width: 76, height: 76, mb: 2.5, backgroundColor: 'primary.contrastText', color: 'primary.main', fontSize: 28, fontWeight: 700 }}>{initials || 'AL'}</Avatar>
          <Typography variant="h4" sx={{ mb: 0.5, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</Typography>
          <Typography sx={{ color: 'inherit', opacity: 0.84, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email}</Typography>
        </Box>
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>Learner overview</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Your personal details and learning activity at a glance.</Typography>
          <Stack spacing={1.25}><ProfileFact icon={<MenuBookOutlinedIcon fontSize="small" />} label="Active courses" value="2 courses in progress" /><ProfileFact icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Next class" value="Live React Workshop" /><ProfileFact icon={<CheckCircleOutlineIcon fontSize="small" />} label="Account status" value="Active" /></Stack>
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>Personal information</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Update the information used for your learning records and class communications.</Typography>
        <Box component="form" onSubmit={(event) => { event.preventDefault(); onUpdateProfile(profile) }} sx={{ display: 'grid', gap: 2 }}><TextField label="Full name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /><TextField label="Email address" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /><TextField label="Phone number" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /><Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}><Button type="submit" variant="contained" startIcon={<PersonOutlineIcon />}>Save profile</Button></Box></Box>
      </Paper>
    </Box>
  </>
}

const PaymentHistoryView: FC<{ payments: MyPayment[]; isLoading: boolean; error: string | null }> = ({ payments, isLoading, error }) => <>
  <ViewHeading title="Payment History" description="Review course transactions linked to your account." />
  {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading payments" /></Box> : error ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error">{error}</Typography></Paper> : <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
    <AdminDataTable rows={payments} columns={paymentColumns} searchPlaceholder="Search payments" searchKeys={['itemName', 'type', 'txRef']} />
  </Paper>}
</>

const paymentColumns: DataColumn<MyPayment>[] = [
  { key: 'itemName', label: 'Item' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (value, row) => `${row.currency} ${Number(value).toFixed(2)}` },
  { key: 'status', label: 'Status', render: (value) => <Chip label={String(value)} color={value === 'Paid' ? 'success' : value === 'Failed' ? 'error' : 'warning'} size="small" /> },
  { key: 'date', label: 'Date' },
  { key: 'txRef', label: 'Transaction Reference' },
]

const formatVideoTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

const LessonVideoPlayer: FC<{ src?: string; poster?: string; fallbackDuration: string }> = ({ src, poster, fallbackDuration }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }
  return <Box sx={{ position: 'relative', width: '100%', minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #102a32, #1a4d53)', overflow: 'hidden' }}>
    {src ? <Box component="video" ref={videoRef} src={src} poster={poster} preload="metadata" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} sx={{ width: '100%', height: '100%', maxHeight: { xs: 340, md: 520 }, objectFit: 'contain' }}>Your browser does not support video playback.</Box> : <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>Video preview unavailable</Typography>}
    <Box sx={{ position: 'absolute', right: 0, bottom: 0, left: 0, px: 2, pt: 4, pb: 1.5, background: 'linear-gradient(transparent, rgba(5, 18, 22, 0.9))' }}>
      <input aria-label="Video progress" type="range" min={0} max={duration || 1} step="any" value={Math.min(currentTime, duration || 1)} disabled={!src || !duration} onChange={(event) => { const nextTime = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = nextTime; setCurrentTime(nextTime) }} style={{ width: '100%', accentColor: '#8de0c1', cursor: src ? 'pointer' : 'default' }} />
      <Stack direction="row" alignItems="center" spacing={1}><IconButton onClick={togglePlayback} disabled={!src} aria-label={isPlaying ? 'Pause video' : 'Play video'} sx={{ color: 'white', p: 0.5 }}>{isPlaying ? <PauseIcon /> : <PlayArrowIcon />}</IconButton><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.82)' }}>{duration ? `${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}` : fallbackDuration}</Typography></Stack>
    </Box>
  </Box>
}

const QuizResultReview: FC<{ lesson: DashboardLesson; result: DashboardQuizResult | null; passingScore: number }> = ({ lesson, result, passingScore }) => {
  const statuses = Object.values(result?.answerStatuses ?? {})
  const answered = statuses.filter((status) => status === 'answered').length
  const expired = statuses.filter((status) => status === 'expired').length
  return <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: 1, borderColor: 'divider' }}><Stack spacing={2}><Typography variant="h4">{lesson.title}</Typography><Typography color="text.secondary">Read-only result review. This completed attempt cannot be retaken from here.</Typography>{result ? <><Alert severity={result.passed ? 'success' : 'warning'}>Score: {result.score}% · {result.disqualified ? 'Disqualified' : result.passed ? 'Passed' : `Need ${passingScore}% to pass`}</Alert><Typography variant="body2">{answered} answered · {expired} expired{result.violationCount ? ` · ${result.violationCount} violation${result.violationCount === 1 ? '' : 's'}` : ''}</Typography><Stack spacing={1.5}>{(result.questionResults ?? []).map((item, index) => <Paper key={item.questionId} variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 700 }}>{index + 1}. {item.question}</Typography><Typography variant="body2" sx={{ mt: 1 }}>My answer: {item.studentAnswer ?? 'Unanswered'}</Typography><Typography variant="body2" color="success.main">Correct answer: {item.correctAnswer ?? 'Unavailable'}</Typography><Typography variant="caption" color="text.secondary">Status: {item.status}</Typography></Paper>)}</Stack></> : <Alert severity="info">No recorded score is available for this completed quiz.</Alert>}</Stack></Paper>
}

const LessonResources: FC<{ resources: DashboardLesson['resources'] }> = ({ resources }) => {
  if (!resources.length) return null
  return <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ mb: 1 }}>Downloadable resources</Typography>
    <Stack spacing={1}>
      {resources.map((resource) => resource.url ? <Button key={resource.id} component="a" href={resource.url} download={resource.name} variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>{resource.name}</Button> : <Typography key={resource.id} color="text.secondary" variant="body2">{resource.name} is unavailable.</Typography>)}
    </Stack>
  </Paper>
}

const QuizLessonView: FC<{ lesson: DashboardLesson; attempt: QuizAttempt | null; onBegin: () => Promise<QuizAttempt | null>; onSave: (questionId: number, answer: QuizAnswerRecord) => Promise<void>; onSubmit: (answers: Record<number, QuizAnswerRecord>, disqualified?: boolean) => Promise<DashboardQuizResult | null>; onViolation: (violation: QuizViolation) => Promise<void>; onActiveChange: (active: boolean) => void; result: DashboardQuizResult | null; passingScore: number; strikeThreshold: number }> = ({ lesson, attempt, onBegin, onSave, onSubmit, onViolation, onActiveChange, result, passingScore, strikeThreshold }) => {
  const questions = lesson.quizQuestions ?? []
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, QuizAnswerRecord>>({})
  const answersRef = useRef<Record<number, QuizAnswerRecord>>({})
  const [secondsLeft, setSecondsLeft] = useState(questions[0] ? getQuestionSeconds(questions[0]) : 0)
  const [locked, setLocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [violationCount, setViolationCount] = useState(attempt?.violations?.length ?? 0)
  const [warning, setWarning] = useState(false)

  useEffect(() => {
    setViolationCount(attempt?.violations?.length ?? 0)
  }, [attempt])

  useEffect(() => {
    if (!attempt) return
    const saved = attempt.answers ?? {}
    const restoredAnswers = Object.fromEntries(questions.map((question) => [question.id, saved[question.id] ?? { status: 'unanswered', value: null }]))
    answersRef.current = restoredAnswers
    setAnswers(restoredAnswers)
  }, [attempt, questions])
  useEffect(() => {
    setSecondsLeft(questions[current] ? getQuestionSeconds(questions[current]) : 0)
    setLocked(false)
  }, [current, questions])

  const updateAnswer = useCallback((questionId: number, answer: QuizAnswerRecord) => {
    const nextAnswers = { ...answersRef.current, [questionId]: answer }
    answersRef.current = nextAnswers
    setAnswers(nextAnswers)
    return nextAnswers
  }, [])

  const saveCurrentAnswer = useCallback(async (status: 'answered' | 'expired') => {
    const question = questions[current]
    if (!attempt || !question) return null
    const answer = { ...(answersRef.current[question.id] ?? { value: null }), status } satisfies QuizAnswerRecord
    updateAnswer(question.id, answer)
    await onSave(question.id, answer)
    return answersRef.current
  }, [attempt, current, onSave, questions, updateAnswer])

  useEffect(() => {
    if (!attempt || locked || !questions[current]) return
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [attempt, current, locked, questions])
  useEffect(() => {
    if (secondsLeft !== 0 || locked || !attempt || !questions[current]) return
    const isFinalQuestion = current === questions.length - 1
    setLocked(true)
    if (isFinalQuestion) {
      submittingRef.current = true
      setSubmitting(true)
    }
    void saveCurrentAnswer('expired').then(async (savedAnswers) => {
      if (!savedAnswers) return
      if (!isFinalQuestion) {
        setCurrent((index) => index + 1)
        return
      }
      await onSubmit(Object.fromEntries(questions.map((item) => [item.id, savedAnswers[item.id] ?? { status: 'unanswered', value: null }])))
    }).finally(() => {
      if (isFinalQuestion) {
        submittingRef.current = false
        setSubmitting(false)
      }
    })
  }, [secondsLeft, locked, attempt, current, onSubmit, questions, saveCurrentAnswer])

  useEffect(() => {
    if (!attempt) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') void registerViolation('visibility') }
    const onFullscreenChange = () => { if (!document.fullscreenElement) void disqualifyForFullscreenExit() }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [attempt, locked, violationCount])

  const disqualifyForFullscreenExit = async () => {
    if (!attempt || submitting || submittingRef.current) return
    const violation = { type: 'fullscreen', occurredAt: new Date().toISOString() } satisfies QuizViolation
    submittingRef.current = true
    setSubmitting(true)
    await onViolation(violation)
    await onSubmit(Object.fromEntries(questions.map((item) => [item.id, answersRef.current[item.id] ?? { status: 'unanswered', value: null }])), true)
    setSubmitting(false)
  }

  const registerViolation = async (type: QuizViolationType) => {
    if (!attempt || submitting || submittingRef.current) return
    const violation = { type, occurredAt: new Date().toISOString() } satisfies QuizViolation
    const nextCount = violationCount + 1
    setViolationCount(nextCount)
    setWarning(true)
    await onViolation(violation)
    if (nextCount >= strikeThreshold) {
      const savedAnswers = Object.fromEntries(questions.map((item) => [item.id, answersRef.current[item.id] ?? { status: 'unanswered', value: null }]))
      submittingRef.current = true
      setSubmitting(true)
      await onSubmit(savedAnswers, true)
      setSubmitting(false)
    }
  }

  const startQuiz = async () => {
    if (!document.documentElement.requestFullscreen) return
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      return
    }
    const next = await onBegin()
    if (!next) {
      await document.exitFullscreen?.().catch(() => undefined)
      return
    }
    onActiveChange(true)
  }

  const selectAnswer = (value: string | number | string[] | null) => {
    const question = questions[current]
    if (!question || locked) return
    updateAnswer(question.id, { status: 'answered', value })
    void saveCurrentAnswer('answered')
  }
  const canSubmit = questions.every((item) => (answers[item.id]?.status ?? 'unanswered') !== 'unanswered')
  const submit = async () => {
    if (!attempt || submitting || submittingRef.current || !canSubmit) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const savedAnswers = await saveCurrentAnswer('answered')
      if (!savedAnswers) return
      await onSubmit(Object.fromEntries(questions.map((question) => [question.id, savedAnswers[question.id] ?? { status: 'unanswered', value: null }])))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }
  if (!questions.length) return <EmptyState title="Quiz unavailable" description="This quiz does not have any questions." />
  if (!attempt) return <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}><Typography variant="h5" sx={{ mb: 1 }}>{lesson.title}</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Each question has its own time limit. Your answer is saved as you go and when a timer expires.</Typography><Button variant="contained" onClick={() => void startQuiz()}>Start Quiz</Button></Paper>
  const question = questions[current]
  const answer = answers[question.id]
  const isText = question.options.length === 0 || /fill|short|essay|file|calculation|data/i.test(`${question.type ?? ''} ${question.category ?? ''}`)
  return <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: 1, borderColor: 'divider' }}><Stack spacing={2}>{warning && <Alert severity="warning" onClose={() => setWarning(false)}>Leaving the quiz may result in disqualification. Violation {violationCount} of {strikeThreshold}.</Alert>}<Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="overline" color="primary.main">Question {current + 1} of {questions.length}</Typography><Chip color={secondsLeft <= 10 ? 'error' : 'primary'} label={locked ? 'Time expired' : formatQuizCountdown(secondsLeft)} /></Stack><Typography variant="h5">{question.question}</Typography>{isText ? <TextField fullWidth multiline minRows={3} disabled={locked} value={typeof answer?.value === 'string' ? answer.value : ''} placeholder="Type your answer" onChange={(event) => selectAnswer(event.target.value)} /> : <FormControl disabled={locked}><FormLabel>Choose an answer</FormLabel><RadioGroup value={typeof answer?.value === 'number' ? String(answer.value) : ''} onChange={(event) => selectAnswer(Number(event.target.value))}>{question.options.map((option, index) => <FormControlLabel key={option + index} value={String(index)} control={<Radio />} label={option} />)}</RadioGroup></FormControl>}<Typography variant="caption" color="text.secondary">This question limit: {formatQuizCountdown(getQuestionSeconds(question))}. Status: {answer?.status ?? 'unanswered'}.</Typography><Stack direction="row" justifyContent="space-between"><Button disabled={current === 0} onClick={() => setCurrent((index) => index - 1)}>Previous</Button>{current < questions.length - 1 ? <Button variant="outlined" onClick={() => setCurrent((index) => index + 1)}>Next question</Button> : <Button variant="contained" disabled={!canSubmit || submitting} onClick={() => void submit()}>{submitting ? 'Submitting...' : 'Submit quiz'}</Button>}</Stack>{result && <Alert severity={result.passed ? 'success' : 'warning'}>Latest result: {result.score}% ({result.passed ? 'passed' : `need ${passingScore}% to pass`}).</Alert>}</Stack></Paper>
}

const ArticleLessonContent: FC<{ description: string; onFinalPageChange: (isFinal: boolean) => void }> = ({ description, onFinalPageChange }) => {
  const sections = useMemo(() => {
    const htmlSections = description.split(/(?=<h[1-6][^>]*>)/i).filter((section) => section.trim())
    if (htmlSections.length > 1) return htmlSections
    return description.split(/\n(?=(?:#{1,6}\s+|\d+[.)]\s+))/).filter((section) => section.trim())
  }, [description])
  const [page, setPage] = useState(0)
  useEffect(() => { setPage(0) }, [description])
  useEffect(() => { onFinalPageChange(page === sections.length - 1) }, [onFinalPageChange, page, sections.length])
  const section = sections[page] ?? description
  const isRichText = /<[^>]+>/.test(section)
  return <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Page {page + 1} of {sections.length}</Typography><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => setPage((current) => current - 1)} disabled={page === 0}>Previous</Button><Button size="small" variant="outlined" onClick={() => setPage((current) => current + 1)} disabled={page === sections.length - 1}>Next</Button></Stack></Stack>
    {isRichText ? <Box sx={{ lineHeight: 1.9, '& p': { mb: 2 }, '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2.5, mb: 1, fontWeight: 700 }, '& ul, & ol': { pl: 3, mb: 2 } }} dangerouslySetInnerHTML={{ __html: section }} /> : <Typography color="text.primary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{section}</Typography>}
  </Box>
}

const PracticeLessonView: FC<{ questions: NonNullable<DashboardLesson['practiceQuestions']> }> = ({ questions }) => {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  useEffect(() => { setQuestionIndex(0); setSelectedAnswer(null) }, [questions])
  if (!questions.length) return <EmptyState title="Practice unavailable" description="This practice lesson does not have any questions yet." />
  const question = questions[questionIndex]
  const answered = selectedAnswer !== null
  const isCorrect = selectedAnswer === question.correctAnswer
  const isLast = questionIndex === questions.length - 1
  return <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: 1, borderColor: 'divider' }}><Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography variant="overline" color="primary.main">Practice question {questionIndex + 1} of {questions.length}</Typography><Chip size="small" label="Unlimited practice" /></Stack><Typography variant="h5">{question.question}</Typography><Stack spacing={1} role="radiogroup" aria-label="Practice answer options">{question.options.filter(Boolean).map((option) => <Button key={option} variant={selectedAnswer === option ? 'contained' : 'outlined'} color={answered ? option === question.correctAnswer ? 'success' : selectedAnswer === option ? 'error' : 'inherit' : 'inherit'} disabled={answered} onClick={() => setSelectedAnswer(option)} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}>{option}</Button>)}</Stack>{answered && <Paper elevation={0} sx={{ p: 2, backgroundColor: isCorrect ? 'success.light' : 'error.light' }}><Typography sx={{ fontWeight: 700, mb: 0.5 }}>{isCorrect ? 'Correct' : `Not quite. The correct answer is ${question.correctAnswer}.`}</Typography><Typography variant="body2">{question.explanation}</Typography></Paper>}{answered && <Button variant="contained" onClick={() => { setQuestionIndex((index) => isLast ? 0 : index + 1); setSelectedAnswer(null) }}>{isLast ? 'Practice again' : 'Next question'}</Button>}</Stack></Paper>
}

const CourseViewer: FC<{ course: DashboardCourse; progress: number; completedLessonIds: number[]; started: boolean; timeSpentSeconds: number; quizResults: Record<number, DashboardQuizResult>; attendance: Record<number, 'Present' | 'Absent'>; isClass: boolean; now: Date; initialLessonId?: number; onBack: () => void; onStart: () => void; onCompleteLesson: (lessonId: number) => void | Promise<void>; onQuizStart: (lessonId: number) => Promise<QuizAttempt | null>; onQuizAnswer: (lessonId: number, attemptId: number, questionId: number, answer: QuizAnswerRecord) => Promise<void>; onQuizSubmit: (lessonId: number, attemptId: number, answers: Record<number, QuizAnswerRecord>, disqualified?: boolean) => Promise<DashboardQuizResult | null>; onQuizViolation: (lessonId: number, attemptId: number, violation: QuizViolation) => Promise<void>; onQuizActiveChange: (active: boolean) => void; sessionJoinClicks: Record<number, string>; onJoinLiveSession: (lessonId: number, meetingUrl: string) => Promise<void>; readOnly?: boolean }> = ({ course, progress, completedLessonIds, started, timeSpentSeconds, quizResults, attendance = {}, isClass, now, initialLessonId, onBack, onStart, onCompleteLesson, onQuizStart, onQuizAnswer, onQuizSubmit, onQuizViolation, onQuizActiveChange, sessionJoinClicks, onJoinLiveSession, readOnly = false }) => {
  const lessons = getLessons(course)
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ?? lessons[0]?.id)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null)
  const [articleFinalPage, setArticleFinalPage] = useState(false)
  const submitQuiz = () => undefined
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0]

  useEffect(() => { setSelectedLessonId(initialLessonId ?? lessons[0]?.id) }, [course.id, initialLessonId])
  useEffect(() => { setQuizAttempt(null); setArticleFinalPage(false); onQuizActiveChange(false) }, [selectedLessonId])

  if (!selectedLesson) return <EmptyState title="Course content unavailable" description="This course does not have any lessons yet." actionLabel="Back to courses" onAction={onBack} />

  const isCompleted = completedLessonIds.includes(selectedLesson.id)
  const completionLessons = getCompletionLessons(course)
  const isCourseComplete = completionLessons.length > 0 && progress === 100
  const failedQuizLessons = lessons.filter((lesson) => lesson.type === 'quiz' && quizResults[lesson.id] && !quizResults[lesson.id].passed)
  const allQuizzesPassed = lessons.filter((lesson) => lesson.type === 'quiz').every((lesson) => quizResults[lesson.id]?.passed === true)
  const liveLessons = lessons.filter((lesson) => lesson.type === 'live')
  const attendedSessionCount = liveLessons.filter((lesson) => attendance[lesson.id] === 'Present').length
  const allLiveLessonsPresent = !isClass || liveLessons.every((lesson) => attendance[lesson.id] === 'Present')
  const certificateEligible = isCourseComplete && (!course.certificate || (allQuizzesPassed && allLiveLessonsPresent))
  const quizResult = selectedLessonId === undefined ? null : quizResults[selectedLessonId] ?? null
  const quizQuestions = selectedLesson.quizQuestions ?? []
  const passingScore = selectedLesson.passThreshold ?? 70
  const hasAnsweredQuiz = quizQuestions.length > 0 && quizQuestions.every((question) => quizAnswers[question.id] !== undefined)
  const canRetakeQuiz = Boolean(quizResult && !readOnly && !quizResult.passed && (quizResult.retakeApproved || (!quizResult.disqualified && !quizResult.violationCount && Object.values(quizResult.answerStatuses ?? {}).includes('expired'))))
  const isQuizFinished = selectedLesson.type === 'quiz' && (isCompleted || Boolean(quizResult)) && !canRetakeQuiz
  const canCompleteLesson = (selectedLesson.type !== 'quiz' || isQuizFinished) && (selectedLesson.type !== 'live' || attendance[selectedLesson.id] === 'Present')
  const liveSessionStart = selectedLesson.scheduledAt ? new Date(selectedLesson.scheduledAt).getTime() : NaN
  const liveSessionEnd = selectedLesson.endsAt ? new Date(selectedLesson.endsAt).getTime() : liveSessionStart + (selectedLesson.estimatedDuration ?? 60 * 60) * 1000
  const canJoinLiveSession = selectedLesson.type === 'live' && Number.isFinite(liveSessionStart) && Number.isFinite(liveSessionEnd) && now.getTime() >= liveSessionStart && now.getTime() < liveSessionEnd
  const isLessonLocked = (lessonId: number) => {
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId)
    return lessonIndex > 0 && lessons.slice(0, lessonIndex).filter((lesson) => lesson.type !== 'practice').some((lesson) => !completedLessonIds.includes(lesson.id) && !(isClass && attendance[lesson.id] === 'Absent'))
  }

  if (!started) return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to My Courses</Box>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}><Box><Typography variant="h4" sx={{ mb: 0.5 }}>{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.level} · Tutor: {course.tutor}</Typography></Box><Chip label="Not started" color="default" /></Stack>
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider' }}><Typography variant="h5" sx={{ mb: 0.5 }}>Course content</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Review the lessons below, then start the course when you&apos;re ready to learn.</Typography><Stack spacing={2} sx={{ mb: 3 }}>{course.modules.map((module) => <Box key={module.id}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>{module.title}</Typography><Stack spacing={0.5}>{module.lessons.map((lesson) => <Box key={lesson.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, backgroundColor: 'background.default' }}><Box sx={{ display: 'flex', color: 'text.secondary' }}>{iconForLesson(lesson.type)}</Box><Typography variant="body2" sx={{ flex: 1 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.duration}</Typography></Box>)}</Stack></Box>)}</Stack><Button variant="contained" size="large" onClick={onStart} startIcon={<PlayCircleOutlineIcon />}>Start course</Button></Paper>
  </>

  if (selectedLesson.type === 'practice') return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to Course</Box>
    <PracticeLessonView questions={selectedLesson.practiceQuestions ?? []} />
  </>

  if ((selectedLesson.type as string) === 'quiz') return <>
    {!quizAttempt && <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to Course</Box>}
    {readOnly || isQuizFinished ? <QuizResultReview lesson={selectedLesson} result={quizResult} passingScore={passingScore} /> : <QuizLessonView lesson={selectedLesson} attempt={quizAttempt} onBegin={async () => { const next = await onQuizStart(selectedLesson.id); setQuizAttempt(next); return next }} onSave={(questionId, answer) => quizAttempt ? onQuizAnswer(selectedLesson.id, quizAttempt.id, questionId, answer) : Promise.resolve()} onSubmit={async (answers, disqualified) => { if (!quizAttempt) return null; const submitted = await onQuizSubmit(selectedLesson.id, quizAttempt.id, answers, disqualified); if (submitted) { setQuizAttempt(null); onQuizActiveChange(false); if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen().catch(() => undefined) }; return submitted }} onViolation={(violation) => quizAttempt ? onQuizViolation(selectedLesson.id, quizAttempt.id, violation) : Promise.resolve()} onActiveChange={onQuizActiveChange} result={quizResult} passingScore={passingScore} strikeThreshold={3} />}
  </>

  return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to My Courses</Box>
    {isCourseComplete && <Paper elevation={0} role="status" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, mb: 3, border: 1, borderColor: allQuizzesPassed ? 'primary.main' : 'warning.main', backgroundColor: allQuizzesPassed ? 'primary.main' : 'rgba(237, 108, 2, 0.08)', color: allQuizzesPassed ? 'primary.contrastText' : 'text.primary' }}>{allQuizzesPassed ? <CelebrationOutlinedIcon /> : <QuizOutlinedIcon color="warning" />}<Box><Typography sx={{ fontWeight: 700 }}>{allQuizzesPassed ? 'Congratulations!' : 'Course completed'}</Typography><Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>{allQuizzesPassed ? 'You completed every lesson in this course.' : 'You completed every lesson, but some quizzes were not passed.'}</Typography>{failedQuizLessons.length > 0 && <Stack spacing={0.25} sx={{ mt: 1 }}>{failedQuizLessons.map((lesson) => <Button key={lesson.id} variant="text" size="small" onClick={() => setSelectedLessonId(lesson.id)} sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>{failedQuizLessons.length} quiz{failedQuizLessons.length === 1 ? '' : 'zes'} not passed · View {lesson.title}</Button>)}</Stack>}{course.certificate && <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>{certificateEligible ? 'Certificate unlocked.' : 'Certificate unlocks after all quizzes are passed and every live session is marked Present.'}</Typography>}</Box></Paper>}
    <Box sx={{ mb: 3 }}><Typography variant="h4" sx={{ mb: 1 }}>{course.title}</Typography><Typography component="div" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Avatar sx={{ width: 24, height: 24, fontSize: 11, fontWeight: 700, backgroundColor: 'primary.main' }}>{course.tutor.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</Avatar><Box component="span">{course.category} · {course.level} · Tutor: {course.tutor}</Box></Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Time spent learning: {formatTimeSpent(timeSpentSeconds)}</Typography><Box sx={{ mt: 2, maxWidth: 560 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Course progress</Typography><Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} aria-label={`Course progress: ${progress}%`} sx={{ height: 9, borderRadius: 5, backgroundColor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }} /></Box></Box>
    {isClass && liveLessons.length > 0 && <Paper elevation={0} sx={{ p: 2, mb: 3, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}><Box><Typography variant="h6">Session attendance</Typography><Typography variant="body2" color="text.secondary">{attendedSessionCount} of {liveLessons.length} sessions attended</Typography></Box><Chip color={attendedSessionCount === liveLessons.length ? 'success' : 'default'} label={`${attendedSessionCount}/${liveLessons.length} Present`} /></Stack><Stack spacing={0.75}>{liveLessons.map((lesson) => { const status = attendance[lesson.id]; return <Stack key={lesson.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 1.5, backgroundColor: 'background.default' }}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.scheduledAt ? new Date(lesson.scheduledAt).toLocaleString() : 'Schedule pending'}</Typography></Box><Chip size="small" color={status === 'Present' ? 'success' : status === 'Absent' ? 'error' : 'default'} label={status ?? 'Awaiting tutor mark'} /></Stack> })}</Stack></Paper>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', alignSelf: 'start', position: { xs: 'static', lg: 'sticky' }, top: { lg: 16 }, maxHeight: { lg: 'calc(100vh - 32px)' }, overflowY: { lg: 'auto' } }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Course content</Typography><Stack spacing={1}>{course.modules.map((module) => <Box key={module.id}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mb: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{module.title}</Typography><Stack spacing={0.5}>{module.lessons.map((lesson) => { const locked = isLessonLocked(lesson.id); const completed = completedLessonIds.includes(lesson.id); const selected = selectedLesson.id === lesson.id; const quizFailed = lesson.type === 'quiz' && quizResults[lesson.id] && !quizResults[lesson.id].passed; return <Box key={lesson.id} component="button" type="button" disabled={locked} aria-disabled={locked} onClick={() => setSelectedLessonId(lesson.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 0, borderLeft: 3, borderRadius: 1.5, borderColor: selected ? 'primary.main' : quizFailed ? 'warning.main' : completed ? 'success.light' : locked ? 'divider' : 'transparent', backgroundColor: selected ? 'rgba(16, 125, 111, 0.12)' : locked ? 'action.disabledBackground' : quizFailed ? 'warning.lighter' : completed ? 'background.default' : 'transparent', color: 'text.primary', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : completed && !selected ? 0.7 : 1, fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: locked ? 'action.disabledBackground' : selected ? 'rgba(16, 125, 111, 0.16)' : 'action.hover' } }}><Box sx={{ display: 'flex', color: quizFailed ? 'warning.main' : completed ? 'success.main' : locked ? 'text.disabled' : 'text.secondary' }}>{quizFailed ? <CloseIcon fontSize="small" /> : completed ? <CheckCircleOutlineIcon fontSize="small" /> : iconForLesson(lesson.type)}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" noWrap sx={{ fontWeight: selectedLesson.id === lesson.id ? 600 : 400 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.duration}</Typography></Box></Box> })}</Stack></Box>)}</Stack></Paper>
      <Stack spacing={2}>
        {(selectedLesson.type !== 'article' || articleFinalPage) && <Button
          variant="contained"
          color={isCompleted ? 'success' : 'primary'}
          disabled={!isCompleted && !canCompleteLesson}
          onClick={() => onCompleteLesson(selectedLesson.id)}
          startIcon={<CheckCircleOutlineIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {isCompleted ? 'Completed' : 'Mark lesson complete'}
        </Button>}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.18), rgba(16, 125, 111, 0.04))' }}>{selectedLesson.type === 'live' ? <Box sx={{ minHeight: { xs: 220, md: 340 }, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}><VideoCallOutlinedIcon color="primary" sx={{ fontSize: 72 }} /><Typography color="text.secondary">Live lesson · {selectedLesson.scheduledAt ? new Date(selectedLesson.scheduledAt).toLocaleString() : 'Schedule pending'}</Typography><Button variant="contained" disabled={!canJoinLiveSession} aria-disabled={!canJoinLiveSession} onClick={() => { const meetingUrl = selectedLesson.meetingUrl || course.meetingLink; if (meetingUrl) void onJoinLiveSession(selectedLesson.id, meetingUrl) }} startIcon={<VideoCallOutlinedIcon />}>Join Class</Button>{sessionJoinClicks[selectedLesson.id] && <Typography variant="caption" color="text.secondary">Join click logged {new Date(sessionJoinClicks[selectedLesson.id]).toLocaleString()} for tutor reference. Attendance is confirmed by your tutor.</Typography>}</Box> : selectedLesson.type === 'video' ? <LessonVideoPlayer src={selectedLesson.videoUrl} poster={selectedLesson.thumbnailUrl} fallbackDuration={selectedLesson.duration} /> : selectedLesson.type === 'article' ? <Box sx={{ minHeight: { xs: 220, md: 340 }, p: { xs: 3, md: 6 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(242, 247, 243, 0.9), rgba(231, 242, 237, 0.72))' }}><Box sx={{ width: '100%', maxWidth: 720, p: { xs: 2.5, md: 4 }, backgroundColor: 'background.paper', border: 1, borderColor: 'rgba(16, 125, 111, 0.16)', borderRadius: 2, boxShadow: '0 12px 30px rgba(15, 55, 48, 0.08)' }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 1.4 }}>Reading lesson</Typography><Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>{selectedLesson.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>A guided lesson from {course.tutor}</Typography><ArticleLessonContent description={selectedLesson.description} onFinalPageChange={setArticleFinalPage} /></Box></Box> : <Box sx={{ minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.18), rgba(16, 125, 111, 0.04))' }}><QuizOutlinedIcon color="primary" sx={{ fontSize: 72 }} /></Box>}</Box><Box sx={{ p: { xs: 2.5, md: 3 } }}><Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{selectedLesson.type}</Typography><Typography variant="body2" color="text.secondary">{selectedLesson.duration}</Typography></Stack>{selectedLesson.type !== 'article' && <><Typography variant="h5" sx={{ mb: 1 }}>{selectedLesson.title}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{selectedLesson.description}</Typography></>}{selectedLesson.type === 'article' && <Typography sx={{ mt: 2, lineHeight: 1.8 }}>Work through the article carefully, then mark this lesson complete when you are ready.</Typography>}{selectedLesson.type === 'quiz' && <Box sx={{ mt: 3 }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Knowledge check</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Answer every question, then submit the quiz. You need at least {passingScore}% to pass.</Typography>{quizQuestions.length === 0 ? <Alert severity="info">No questions have been added to this quiz yet. You can still mark this lesson complete.</Alert> : <Stack spacing={2.5}>{quizQuestions.map((question, questionIndex) => <FormControl key={question.id} component="fieldset"><FormLabel component="legend">{questionIndex + 1}. {question.question}</FormLabel><RadioGroup value={quizAnswers[question.id] === undefined ? '' : String(quizAnswers[question.id])} onChange={(event) => { setQuizAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) })) }} sx={{ mt: 0.5 }}>{question.options.map((option, optionIndex) => <FormControlLabel key={question.id + '-' + optionIndex} value={optionIndex} control={<Radio />} label={option} disabled={isQuizFinished} />)}</RadioGroup></FormControl>)}</Stack>}{quizQuestions.length > 0 && <Button variant="contained" onClick={submitQuiz} disabled={isQuizFinished || !hasAnsweredQuiz} startIcon={<QuizOutlinedIcon />} sx={{ mt: 2 }}>Submit quiz</Button>}{quizResult ? <Alert severity={quizResult.passed ? 'success' : 'error'} sx={{ mt: 2 }}>Score: {quizResult.score}% · Grade: {getQuizGrade(quizResult.score)} — {quizResult.passed ? 'Passed' : 'Not passed. You need at least ' + passingScore + '% to pass.'}</Alert> : isCompleted && <Alert severity="info" sx={{ mt: 2 }}>Quiz completed. Score not available for this completion.</Alert>}</Box>}{selectedLesson.type !== 'quiz' && <Typography sx={{ mt: 3, lineHeight: 1.8 }}>Mark this lesson complete when you are ready to continue.</Typography>}<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}><Button variant="contained" color={isCompleted ? 'success' : 'primary'} onClick={() => onCompleteLesson(selectedLesson.id)} disabled={!isCompleted && !canCompleteLesson} startIcon={isCompleted ? <CheckCircleOutlineIcon /> : <CheckCircleOutlineIcon />}>{isCompleted ? 'Lesson completed' : 'Mark lesson complete'}</Button></Box></Box></Paper><LessonResources resources={selectedLesson.resources} /></Stack>
    </Box>
  </>
}

const EmptyState: FC<{ title: string; description: string; actionLabel?: string; onAction?: () => void }> = ({ title, description, actionLabel, onAction }) => <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', textAlign: 'center' }}><Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography><Typography color="text.secondary" sx={{ mb: actionLabel ? 2.5 : 0 }}>{description}</Typography>{actionLabel && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}</Paper>

interface StudentDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const StudentDashboard: FC<StudentDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const currentUser = getAuthenticatedUser()
  const currentUserId = Number(currentUser?.id)
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [quizActive, setQuizActive] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [now, setNow] = useState(() => new Date())
  const [enrollments, setEnrollments] = useState<DashboardEnrollment[]>([])
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null)
  const [gamificationError, setGamificationError] = useState<string | null>(null)
  const [payments, setPayments] = useState<MyPayment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [otherCourses, setOtherCourses] = useState<Course[]>([])
  const [isLoadingOtherCourses, setIsLoadingOtherCourses] = useState(true)
  const [otherCoursesError, setOtherCoursesError] = useState<string | null>(null)
  const [otherClasses, setOtherClasses] = useState<PublicClass[]>([])
  const [classToEnroll, setClassToEnroll] = useState<PublicClass | null>(null)
  const [isLoadingOtherClasses, setIsLoadingOtherClasses] = useState(true)
  const [otherClassesError, setOtherClassesError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(undefined)
  const [readOnlyQuizResult, setReadOnlyQuizResult] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Record<number, number[]>>({})
  const [startedCourses, setStartedCourses] = useState<Record<number, boolean>>({})
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({})
  const [quizResults, setQuizResults] = useState<Record<number, Record<number, DashboardQuizResult>>>({})
  const [progressError, setProgressError] = useState<string | null>(null)
  const [profileMessage, setProfileMessage] = useState('')
  const progressSnapshot = useRef({ completedLessons, startedCourses, timeSpent, quizResults })
  progressSnapshot.current = { completedLessons, startedCourses, timeSpent, quizResults }

  const persistEngagement = (courseId: number, lessonId: number, activeSeconds: number) => {
    const enrollment = findCourseEnrollment(enrollments, courseId)
    if (!enrollment) return
    void saveLessonEngagement(enrollment.id, lessonId, { activeSeconds }).catch((error) => setProgressError(error instanceof Error ? error.message : 'Unable to save course activity.'))
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleProfileOpen = () => setActiveView('profile')
    window.addEventListener('student-profile-open', handleProfileOpen)
    return () => window.removeEventListener('student-profile-open', handleProfileOpen)
  }, [])

  useEffect(() => {
    if (activeView !== 'course-view' || selectedCourseId === null || !startedCourses[selectedCourseId]) return
    let lastTrackedAt = Date.now()
    const flushTime = () => {
      const elapsedSeconds = Math.floor((Date.now() - lastTrackedAt) / 1000)
      if (elapsedSeconds <= 0) return
      const trackedSeconds = Math.min(elapsedSeconds, 60)
      const currentSeconds = progressSnapshot.current.timeSpent[selectedCourseId] ?? 0
      const nextSeconds = currentSeconds + trackedSeconds
      lastTrackedAt = Date.now()
      progressSnapshot.current = { ...progressSnapshot.current, timeSpent: { ...progressSnapshot.current.timeSpent, [selectedCourseId]: nextSeconds } }
      setTimeSpent((current) => ({ ...current, [selectedCourseId]: nextSeconds }))
      const enrollment = findCourseEnrollment(enrollments, selectedCourseId)
      const course = enrollment ? getEnrollmentCourse(enrollment) : undefined
      const lessonId = selectedLessonId ?? (course ? getLessons(course)[0]?.id : undefined)
      if (lessonId !== undefined) persistEngagement(selectedCourseId, lessonId, trackedSeconds)
    }
    const timer = window.setInterval(flushTime, 30000)
    return () => {
      window.clearInterval(timer)
      flushTime()
    }
  }, [activeView, enrollments, selectedCourseId, selectedLessonId, startedCourses])

  useEffect(() => {
    let isCurrent = true
    getMyEnrollments()
      .then((records) => {
        if (!isCurrent) return
        const completedByCourse = Object.fromEntries(records.filter((record) => record.completedLessonIds.length > 0).map((record) => [getEnrollmentContentId(record), record.completedLessonIds]))
        const startedByCourse = Object.fromEntries(records.filter((record) => record.started).map((record) => [getEnrollmentContentId(record), true]))
        const timeByCourse = Object.fromEntries(records.filter((record) => record.timeSpentSeconds > 0).map((record) => [getEnrollmentContentId(record), record.timeSpentSeconds]))
        const resultsByCourse = Object.fromEntries(records.map((record) => [getEnrollmentContentId(record), getLatestQuizResults(record.quizAttempts)]).filter(([, results]) => Object.keys(results).length > 0))
        setCompletedLessons(completedByCourse)
        setStartedCourses(startedByCourse)
        setTimeSpent(timeByCourse)
        setQuizResults(resultsByCourse)
        setEnrollments(mapMyEnrollments(records, currentUserId))
        setEnrollmentError(null)
      })
      .catch((error) => {
        if (!isCurrent) return
        setEnrollmentError(error instanceof Error ? error.message : 'Unable to load your enrollments.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingEnrollments(false)
      })

    return () => {
      isCurrent = false
    }
  }, [currentUserId])

  useEffect(() => {
    let isCurrent = true
    getCourses()
      .then((records) => {
        if (!isCurrent) return
        setOtherCourses(records)
        setOtherCoursesError(null)
      })
      .catch((error) => {
        if (!isCurrent) return
        setOtherCoursesError(error instanceof Error ? error.message : 'Unable to load other courses.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOtherCourses(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getPublicClasses()
      .then((records) => {
        if (!isCurrent) return
        setOtherClasses(records)
        setOtherClassesError(null)
      })
      .catch((error) => {
        if (!isCurrent) return
        setOtherClassesError(error instanceof Error ? error.message : 'Unable to load other classes.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOtherClasses(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getGamification()
      .then((data) => {
        if (!isCurrent) return
        setGamificationData(data)
        setGamificationError(null)
      })
      .catch((error) => {
        if (!isCurrent) return
        setGamificationError(error instanceof Error ? error.message : 'Unable to load your gamification data.')
      })
    return () => {
      isCurrent = false
    }
  }, [completedLessons, quizResults, enrollments])

  useEffect(() => {
    let isCurrent = true
    getMyPayments()
      .then((records) => {
        if (!isCurrent) return
        setPayments(records)
        setPaymentError(null)
      })
      .catch((error) => {
        if (!isCurrent) return
        setPaymentError(error instanceof Error ? error.message : 'Unable to load your payments.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPayments(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const selectedCourseEnrollment = selectedCourseId === null ? undefined : findCourseEnrollment(enrollments, selectedCourseId)
  const selectedCourse = selectedCourseEnrollment ? getEnrollmentCourse(selectedCourseEnrollment) : undefined
  const selectedCourseProgress = selectedCourse ? getCourseProgress(selectedCourse, completedLessons[selectedCourse.id] ?? []) : 0
  const enrolledCourseIds = new Set(enrollments.filter((enrollment) => enrollment.type === 'course').map((enrollment) => String(enrollment.item_id)))
  const enrolledClassIds = new Set(enrollments.filter((enrollment) => enrollment.type === 'class').map((enrollment) => enrollment.item_id))
  const pageTitle = activeView === 'course-view' ? selectedCourse?.title ?? 'Course view' : activeView === 'overview' ? 'Dashboard' : activeView === 'calendar' ? 'Calendar' : activeView === 'courses' ? 'My Courses' : activeView === 'classes' ? 'My Classes' : activeView === 'quizzes' ? 'Quizzes & Results' : activeView === 'purchases' ? 'My Purchases' : activeView === 'other-courses' ? 'Other Courses' : activeView === 'other-classes' ? 'Other Classes' : activeView === 'profile' ? 'Profile' : 'Payment History'
  const selectView = (view: DashboardView) => {
    setActiveView(view)
    setProgressError(null)
    setMobileOpen(false)
  }
  const openCourse = (courseId: number, lessonId?: number, readOnly = false) => {
    setProgressError(null)
    setSelectedCourseId(courseId)
    setSelectedLessonId(lessonId)
    setReadOnlyQuizResult(readOnly)
    setActiveView('course-view')
    setMobileOpen(false)
  }
  const startCourse = async (courseId: number) => {
    const enrollment = findCourseEnrollment(enrollments, courseId)
    const course = enrollment ? getEnrollmentCourse(enrollment) : undefined
    const lessonId = course ? getLessons(course)[0]?.id : undefined
    if (!enrollment || lessonId === undefined) return
    try {
      await saveLessonEngagement(enrollment.id, lessonId, { activeSeconds: 0 })
      setStartedCourses((current) => ({ ...current, [courseId]: true }))
      setProgressError(null)
      toast.add({ title: 'Course started', description: 'You are ready to begin learning.', type: 'info' })
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Unable to start course.')
    }
  }
  const joinLiveSession = async (lessonId: number, meetingUrl: string, enrollmentId = selectedCourseEnrollment?.id) => {
    if (!enrollmentId) return
    try {
      const joinLog = await logLiveSessionJoin(enrollmentId, lessonId)
      setEnrollments((current) => current.map((enrollment) => enrollment.id === enrollmentId ? { ...enrollment, sessionJoinClicks: { ...enrollment.sessionJoinClicks, [lessonId]: joinLog.clickedAt } } : enrollment))
      window.location.assign(meetingUrl)
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Unable to log your class join.')
    }
  }
  const completeLesson = async (lessonId: number) => {
    if (selectedCourseId === null || !selectedCourse || !selectedCourseEnrollment) return
    const completed = completedLessons[selectedCourseId] ?? []
    if (completed.includes(lessonId)) return
    try {
      await completeLessonApi(selectedCourseEnrollment.id, lessonId)
      const nextCompleted = [...completed, lessonId]
      const nextProgress = getCourseProgress(selectedCourse, nextCompleted)
      setCompletedLessons((current) => ({ ...current, [selectedCourseId]: nextCompleted }))
      setStartedCourses((current) => ({ ...current, [selectedCourseId]: true }))
      setEnrollments((current) => current.map((enrollment) => getEnrollmentCourse(enrollment)?.id === selectedCourseId ? { ...enrollment, progress: nextProgress } : enrollment))
      setProgressError(null)
      if (nextProgress === 100) toast.add({ title: 'Course completed!', description: `Excellent work finishing ${selectedCourse.title}.`, type: 'success', priority: 'high', duration: 6000 })
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Unable to complete lesson.')
    }
  }
  const startQuizAttempt = async (lessonId: number): Promise<QuizAttempt | null> => {
    if (selectedCourseId === null || !selectedCourseEnrollment) return null
    try { return await beginQuizAttempt(selectedCourseEnrollment.id, lessonId) } catch (error) { setProgressError(error instanceof Error ? error.message : 'Unable to start quiz.'); return null }
  }
  const saveQuizAnswerForAttempt = async (lessonId: number, attemptId: number, questionId: number, answer: QuizAnswerRecord) => {
    if (selectedCourseId === null || !selectedCourseEnrollment) return
    try { await saveQuizAnswer(selectedCourseEnrollment.id, lessonId, attemptId, questionId, answer) } catch (error) { setProgressError(error instanceof Error ? error.message : 'Unable to save quiz answer.') }
  }
  const saveQuizViolationForAttempt = async (lessonId: number, attemptId: number, violation: QuizViolation) => {
    if (selectedCourseId === null || !selectedCourseEnrollment) return
    try { await saveQuizViolation(selectedCourseEnrollment.id, lessonId, attemptId, violation) } catch (error) { setProgressError(error instanceof Error ? error.message : 'Unable to save quiz violation.') }
  }
  const submitQuiz = async (lessonId: number, attemptId: number, answers: Record<number, QuizAnswerRecord>, disqualified = false): Promise<DashboardQuizResult | null> => {
    if (selectedCourseId === null || !selectedCourseEnrollment) return null
    try {
      const submittedAttempt = await submitQuizAttempt(selectedCourseEnrollment.id, lessonId, attemptId, answers, disqualified)
      if (submittedAttempt.score === null || submittedAttempt.passed === null) throw new Error('Quiz result was unavailable.')
      const result = {
        score: submittedAttempt.score,
        passed: submittedAttempt.passed,
        disqualified: submittedAttempt.disqualified || disqualified,
        answerStatuses: Object.fromEntries(Object.entries(submittedAttempt.answers ?? {}).map(([id, answer]) => [Number(id), answer.status])),
        violationCount: submittedAttempt.violations?.length ?? 0,
        questionResults: submittedAttempt.questionResults,
      }
      setQuizResults((current) => ({ ...current, [selectedCourseId]: { ...(current[selectedCourseId] ?? {}), [lessonId]: result } }))
      setEnrollments((current) => current.map((enrollment) => getEnrollmentCourse(enrollment)?.id === selectedCourseId ? { ...enrollment, quizResults: { ...enrollment.quizResults, [lessonId]: result } } : enrollment))
      setStartedCourses((current) => ({ ...current, [selectedCourseId]: true }))
      await completeLessonApi(selectedCourseEnrollment.id, lessonId)
      const completed = completedLessons[selectedCourseId] ?? []
      if (!completed.includes(lessonId)) {
        const nextCompleted = [...completed, lessonId]
        setCompletedLessons((current) => ({ ...current, [selectedCourseId]: nextCompleted }))
        setEnrollments((current) => current.map((enrollment) => getEnrollmentCourse(enrollment)?.id === selectedCourseId ? { ...enrollment, progress: getCourseProgress(selectedCourse!, nextCompleted) } : enrollment))
      }
      setProgressError(null)
      selectView('quizzes')
      return result
    } catch (error) { setProgressError(error instanceof Error ? error.message : 'Unable to submit quiz.'); return null }
  }
  const updateProfile = (profile: { name: string; email: string; phone: string }) => setProfileMessage(`Profile saved for ${profile.name}.`)
  const classCheckoutCourse = classToEnroll ? { id: classToEnroll.courseId ?? classToEnroll.id, title: classToEnroll.title, price: classToEnroll.price } : null

  const sidebar = <DashboardSidebar activeView={activeView} onSelectView={selectView} />
  const isLessonPlayer = activeView === 'course-view'
  const isQuizPlayer = isLessonPlayer && quizActive

  return <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
    {!isLessonPlayer && !isQuizPlayer && (isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}<IconButton onClick={() => setMobileOpen(false)} aria-label="Close dashboard navigation" sx={{ position: 'absolute', top: 10, right: 10 }}><CloseIcon /></IconButton></Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>)}
    <Box sx={{ flex: 1, minWidth: 0, ml: isLessonPlayer ? 0 : { xs: 0, md: `${drawerWidth}px` } }}>
      {!isLessonPlayer && !isQuizPlayer && <DashboardHeader title={pageTitle} darkMode={darkMode} language={language} onLanguageChange={() => setLanguage((current) => current === 'EN' ? 'AM' : 'EN')} onToggleDarkMode={onToggleDarkMode} onOpenMenu={() => setMobileOpen(true)} />}
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: isLessonPlayer ? 1600 : 1440, minHeight: isLessonPlayer ? '100vh' : 'calc(100vh - 72px)' }}>
        {profileMessage && <Alert severity="success" onClose={() => setProfileMessage('')} sx={{ mb: 3 }}>{profileMessage}</Alert>}
        {progressError && <Alert severity="error" onClose={() => setProgressError(null)} sx={{ mb: 3 }}>{progressError}</Alert>}
        {isLoadingEnrollments ? <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }} aria-live="polite"><CircularProgress aria-label="Loading enrollments" /><Typography color="text.secondary">Loading your enrollments...</Typography></Box> : enrollmentError ? <Alert severity="error">{enrollmentError}</Alert> : <>
          {activeView === 'overview' && (gamificationData ? <OverviewView enrollments={enrollments} now={now} onSelectView={selectView} onOpenCourse={openCourse} gamificationData={gamificationData} /> : gamificationError ? <Alert severity="error">{gamificationError}</Alert> : <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} aria-live="polite"><CircularProgress aria-label="Loading gamification" /></Box>)}
          {activeView === 'calendar' && <StudentCalendarView enrollments={enrollments} now={now} onJoin={(session) => { if (session.lessonId && session.meetingUrl) void joinLiveSession(session.lessonId, session.meetingUrl, session.enrollmentId) }} />}
          {activeView === 'courses' && <CoursesView enrollments={enrollments} completedLessons={completedLessons} onOpenCourse={openCourse} />}
          {activeView === 'classes' && <ClassesView enrollments={enrollments} completedLessons={completedLessons} now={now} onOpenCourse={openCourse} gamificationData={gamificationData} />}
          {activeView === 'quizzes' && <QuizzesView enrollments={enrollments} completedLessons={completedLessons} quizResults={quizResults} onOpenCourse={openCourse} />}
          {activeView === 'purchases' && <PurchasesView />}
          {activeView === 'other-courses' && <OtherCoursesView courses={otherCourses} enrolledCourseIds={enrolledCourseIds} isLoading={isLoadingOtherCourses} error={otherCoursesError} />}
          {activeView === 'other-classes' && <OtherClassesView classes={otherClasses} enrolledClassIds={enrolledClassIds} isLoading={isLoadingOtherClasses} error={otherClassesError} onEnroll={setClassToEnroll} />}
          {activeView === 'profile' && <ProfileView onUpdateProfile={updateProfile} />}
          {activeView === 'payments' && <PaymentHistoryView payments={payments} isLoading={isLoadingPayments} error={paymentError} />}
          {activeView === 'course-view' && selectedCourse && selectedCourseEnrollment && <CourseViewer course={selectedCourse} progress={selectedCourseProgress} completedLessonIds={completedLessons[selectedCourse.id] ?? []} started={Boolean(startedCourses[selectedCourse.id] || completedLessons[selectedCourse.id]?.length)} timeSpentSeconds={timeSpent[selectedCourse.id] ?? 0} quizResults={quizResults[selectedCourse.id] ?? {}} now={now} initialLessonId={selectedLessonId} onBack={() => selectView(selectedCourseEnrollment.type === 'class' ? 'classes' : 'courses')} onStart={() => startCourse(selectedCourse.id)} onCompleteLesson={completeLesson} onQuizStart={startQuizAttempt} onQuizAnswer={saveQuizAnswerForAttempt} onQuizSubmit={submitQuiz} onQuizViolation={saveQuizViolationForAttempt} onQuizActiveChange={setQuizActive} attendance={selectedCourseEnrollment.attendance} sessionJoinClicks={selectedCourseEnrollment.sessionJoinClicks} onJoinLiveSession={joinLiveSession} isClass={selectedCourseEnrollment.type === 'class'} readOnly={readOnlyQuizResult} />}
        </>}
      </Box>
    </Box>
    {classCheckoutCourse && classToEnroll && <EnrollmentModal course={classCheckoutCourse} classId={classToEnroll.id} open={true} onClose={() => setClassToEnroll(null)} />}
  </Box>
}

export default StudentDashboard
