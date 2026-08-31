import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
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
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react'
import { type Course } from '@/interfaces/course'
import { Logo } from '@/components/logo'
import AdminDataTable, { type DataColumn } from '@/components/admin/admin-data-table'
import { toast } from '@/components/toast'
import { getAuthenticatedUser, getCourses, getMyEnrollments, getMyPayments, getPublicClasses, saveCourseProgress, signOut, type MyEnrollment, type MyPayment, type PublicClass } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

 type DashboardView = 'overview' | 'courses' | 'classes' | 'quizzes' | 'purchases' | 'other-courses' | 'other-classes' | 'profile' | 'payments' | 'course-view'
 type EnrollmentType = 'course' | 'class'
 type EnrollmentStatus = 'active' | 'pending_schedule' | 'completed'
 type ClassStatus = 'pending_schedule' | 'open' | 'full' | 'closed'

 interface DashboardQuizResult {
  score: number
  passed: boolean
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
  course?: DashboardCourse
  classRecord?: DashboardClass
 }

 interface DashboardLesson {
  id: number
  title: string
  type: 'video' | 'article' | 'quiz' | 'live'
  duration: string
  description: string
  videoUrl?: string
  thumbnailUrl?: string
  quizQuestions?: Array<{ id: number; question: string; options: string[]; correctOption: number }>
  passThreshold?: number
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
  modules: DashboardModule[]
 }

 interface DashboardClassSchedule {
  days: string[]
  time: string
  flexible: boolean
  startDate: string
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
}

const drawerWidth = 272
const purchases: DashboardPurchase[] = [
  { id: 1, item_name: 'The Practical React Workbook', type: 'Book', download_url: '#react-workbook' },
  { id: 2, item_name: 'Frontend Developer Practice Exam', type: 'Exam', download_url: '#frontend-exam' },
]

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h${minutes ? ` ${minutes}m` : ''}` : `${minutes}m`
}
const formatTimeSpent = (seconds: number) => seconds < 60 ? `${seconds}s` : formatDuration(seconds)
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
const classHasStarted = (schedule: DashboardClassSchedule, now: Date) => {
  const date = classStartDate(schedule)
  return date !== null && now.getTime() >= date.getTime()
}
const getLessons = (course: DashboardCourse) => course.modules.flatMap((module) => module.lessons)
const mapEnrollmentCourse = (enrollment: MyEnrollment): DashboardCourse => ({
  id: enrollment.courseId,
  title: enrollment.courseTitle,
  category: enrollment.category,
  level: enrollment.level,
  tutor: enrollment.tutor || 'Tutor to be confirmed',
  modules: enrollment.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type === 'live' ? 'video' : lesson.type,
      duration: lesson.duration ? formatDuration(lesson.duration) : lesson.type === 'article' ? 'Article' : lesson.type === 'quiz' ? 'Quiz' : 'Video',
      description: lesson.articleBody || 'Work through this lesson at your own pace.',
      videoUrl: lesson.videoUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      quizQuestions: lesson.quizQuestions,
      passThreshold: lesson.passThreshold,
    })),
  })),
})
const mapEnrollmentClass = (enrollment: MyEnrollment, course: DashboardCourse): DashboardClass | null => enrollment.classId === null ? null : {
  id: enrollment.classId,
  title: enrollment.classTitle || 'Class enrollment',
  tutorName: enrollment.classTutor || 'Tutor to be confirmed',
  schedule: {
    days: enrollment.classSchedule?.days ?? [],
    time: enrollment.classSchedule?.time ?? '',
    flexible: enrollment.classSchedule?.flexible ?? false,
    startDate: enrollment.classSchedule?.startDate ?? '',
    date: '',
    startsAt: '',
  },
  meeting_link: enrollment.meetingLink || '',
  status: enrollment.classStatus || 'pending_schedule',
  course_id: enrollment.courseId,
  course,
}
const mapMyEnrollments = (records: MyEnrollment[], userId: number): DashboardEnrollment[] => records.flatMap((record) => {
  const course = mapEnrollmentCourse(record)
  const classRecord = mapEnrollmentClass(record, course)
  const courseEnrollment: DashboardEnrollment = { id: record.id, user_id: userId, type: 'course', item_id: record.courseId, status: 'active', progress: getCourseProgress(course, record.completedLessonIds), timeSpentSeconds: record.timeSpentSeconds, quizResults: record.quizResults, course }
  if (!classRecord) return [courseEnrollment]
  return [{ id: record.id, user_id: userId, type: 'class', item_id: classRecord.id, status: classRecord.status === 'pending_schedule' ? 'pending_schedule' : 'active', progress: 0, timeSpentSeconds: record.timeSpentSeconds, quizResults: record.quizResults, classRecord }]
})
const getCourseProgress = (course: DashboardCourse, completedLessonIds: number[]) => Math.round((completedLessonIds.filter((lessonId) => getLessons(course).some((lesson) => lesson.id === lessonId)).length / Math.max(1, getLessons(course).length)) * 100)
const iconForLesson = (type: DashboardLesson['type']) => {
  if (type === 'article') return <ArticleOutlinedIcon fontSize="small" />
  if (type === 'quiz') return <QuizOutlinedIcon fontSize="small" />
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

const OverviewView: FC<{ enrollments: DashboardEnrollment[]; now: Date; onSelectView: (view: DashboardView) => void; onOpenCourse: (courseId: number) => void }> = ({ enrollments, now, onSelectView, onOpenCourse }) => {
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

const CoursesView: FC<{ enrollments: DashboardEnrollment[]; onOpenCourse: (courseId: number) => void }> = ({ enrollments, onOpenCourse }) => {
  const courseEnrollments = enrollments.filter((enrollment) => enrollment.type === 'course' && enrollment.course)
  return <>
    <ViewHeading title="My Courses" description="Build momentum with the self-paced courses in your learning plan." />
    {courseEnrollments.length === 0 ? <EmptyState title="No courses yet" description="Your paid course enrollments will appear here." actionLabel="Browse courses" onAction={() => navigateTo('/')} /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {courseEnrollments.map((enrollment) => {
        const course = enrollment.course!
        return <Card key={enrollment.id} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ minHeight: 110, p: 2.5, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.16), rgba(16, 125, 111, 0.04))' }}><MenuBookOutlinedIcon color="primary" sx={{ fontSize: 38 }} /></Box>
          <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}><Chip label={course.category} size="small" color="primary" variant="outlined" /><Typography variant="caption" color="text.secondary">{course.level}</Typography></Stack>
            <Typography variant="h6" sx={{ mb: 1 }}>{course.title}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Tutor: {course.tutor}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Time spent: {formatTimeSpent(enrollment.timeSpentSeconds)}</Typography>
            <Box sx={{ mt: 'auto' }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="body2">Progress</Typography><Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{enrollment.progress}%</Typography></Stack><LinearProgress variant="determinate" value={enrollment.progress} sx={{ height: 8, borderRadius: 4, mb: 2 }} /><Button fullWidth variant="contained" onClick={() => onOpenCourse(course.id)}>{enrollment.progress ? 'Continue course' : 'Start course'}</Button></Box>
          </CardContent>
        </Card>
      })}
    </Box>}
  </>
}

const ClassesView: FC<{ enrollments: DashboardEnrollment[]; now: Date; onOpenCourse: (courseId: number) => void }> = ({ enrollments, now, onOpenCourse }) => {
  const classEnrollments = enrollments.filter((enrollment) => enrollment.type === 'class' && enrollment.classRecord)
  return <>
    <ViewHeading title="My Classes" description="See your live learning schedule and join sessions when they are ready." />
    {classEnrollments.length === 0 ? <EmptyState title="No classes yet" description="Paid class enrollments will appear here once they are assigned." actionLabel="Explore courses" onAction={() => navigateTo('/')} /> : <Stack spacing={2}>{classEnrollments.map((enrollment) => <ClassCard key={enrollment.id} classRecord={enrollment.classRecord!} timeSpentSeconds={enrollment.timeSpentSeconds} now={now} onOpenCourse={onOpenCourse} />)}</Stack>}
  </>
}

const ClassCard: FC<{ classRecord: DashboardClass; timeSpentSeconds: number; now: Date; onOpenCourse: (courseId: number) => void }> = ({ classRecord, timeSpentSeconds, now, onOpenCourse }) => {
  const hasStarted = classHasStarted(classRecord.schedule, now)
  const isJoinable = classRecord.status === 'open' && hasStarted && Boolean(classRecord.meeting_link)
  const statusLabel = classRecord.status === 'pending_schedule' ? 'Pending schedule' : classRecord.status === 'open' ? hasStarted ? 'Scheduled' : classRecord.schedule.startDate ? `Starts ${formatClassStartDate(classRecord.schedule)}` : 'Start date not set' : classRecord.status === 'full' ? 'Full' : 'Closed'
  const statusColor = classRecord.status === 'pending_schedule' || classRecord.status === 'full' || (classRecord.status === 'open' && !hasStarted) ? 'warning' : classRecord.status === 'open' ? 'success' : 'error'
  const linkedCourse = classRecord.course
  return <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
    <CardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><ClassOutlinedIcon /></Box><Box><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6">{classRecord.title}</Typography><Chip label={statusLabel} size="small" color={statusColor} /></Stack>{classRecord.status === 'pending_schedule' ? <Typography color="text.secondary" sx={{ mt: 0.75 }}>Pending — we&apos;ll contact you to schedule your class.</Typography> : <><Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>{classScheduleLabel(classRecord.schedule)}</Typography><Typography color="text.secondary" variant="body2">Tutor: {classRecord.tutorName}</Typography><Typography color="text.secondary" variant="body2">Time spent learning: {formatTimeSpent(timeSpentSeconds)}</Typography>{classRecord.status === 'open' && <Typography color="text.secondary" variant="body2">{classRecord.schedule.startDate ? `Starts ${formatClassStartDate(classRecord.schedule)}` : 'Start date not set'}</Typography>}</>}</Box></Box>
        {classRecord.status === 'open' && <Button variant="contained" component="a" href={isJoinable ? classRecord.meeting_link : undefined} disabled={!isJoinable} aria-disabled={!isJoinable} onClick={(event) => { if (!isJoinable) event.preventDefault() }} startIcon={<VideoCallOutlinedIcon />} sx={{ flexShrink: 0 }}>{isJoinable ? 'Join Class' : 'Available on start date'}</Button>}
      </Stack>
      {linkedCourse && <><Divider sx={{ my: 2 }} /><Button variant="text" size="small" startIcon={<MenuBookOutlinedIcon />} onClick={() => onOpenCourse(linkedCourse.id)}>View {linkedCourse.title} curriculum summary</Button></>}
    </CardContent>
  </Card>
}

const QuizzesView: FC<{ enrollments: DashboardEnrollment[]; completedLessons: Record<number, number[]>; quizResults: Record<number, Record<number, DashboardQuizResult>>; onOpenCourse: (courseId: number, lessonId?: number) => void }> = ({ enrollments, completedLessons, quizResults, onOpenCourse }) => {
  const enrolledQuizzes = enrollments.flatMap((enrollment) => {
    const course = enrollment.type === 'course' ? enrollment.course : enrollment.classRecord?.course
    if (!course) return []
    const source = enrollment.type === 'class' ? `Class: ${enrollment.classRecord?.title ?? course.title}` : `Course: ${course.title}`
    return course.modules.flatMap((module) => module.lessons.filter((lesson) => lesson.type === 'quiz').map((lesson) => { const result = quizResults[course.id]?.[lesson.id]; return { enrollmentId: enrollment.id, enrollmentType: enrollment.type, course, lesson, moduleTitle: module.title, source, completed: (completedLessons[course.id] ?? []).includes(lesson.id), result, finished: (completedLessons[course.id] ?? []).includes(lesson.id) || Boolean(result) } }))
  })

  return <>
    <ViewHeading title="Quizzes & Results" description="Review results and continue quizzes from your enrolled courses and classes." />
    {enrolledQuizzes.length === 0 ? <EmptyState title="No quizzes available" description="Quizzes from your enrolled courses and classes will appear here." /> : <Stack spacing={2}>{enrolledQuizzes.map(({ enrollmentId, enrollmentType, course, lesson, moduleTitle, source, completed, result, finished }) => <Card key={`${enrollmentType}-${enrollmentId}-${course.id}-${lesson.id}`} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}><Box sx={{ display: 'flex', gap: 1.5 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><QuizOutlinedIcon /></Box><Box><Typography variant="h6">{lesson.title}</Typography><Typography color="text.secondary" variant="body2">{source} · {moduleTitle}</Typography>{result && <Typography color={result.passed ? 'success.main' : 'warning.main'} variant="body2" sx={{ mt: 0.75, fontWeight: 600 }}>{result.passed ? 'Passed' : 'Latest attempt'} · Score {result.score}%</Typography>}</Box></Box><Stack direction="row" spacing={1} alignItems="center"><Chip icon={completed ? <CheckCircleOutlineIcon /> : undefined} label={completed ? 'Completed' : result ? 'Finished' : 'Ready to take'} color={completed ? 'success' : result ? 'warning' : 'primary'} size="small" variant={finished ? 'filled' : 'outlined'} /><Button variant={finished ? 'outlined' : 'contained'} size="small" onClick={() => onOpenCourse(course.id, lesson.id)}>{finished ? 'View result' : 'Open quiz'}</Button></Stack></Stack></CardContent></Card>)}</Stack>}
  </>
}

const PurchasesView: FC = () => <>
  <ViewHeading title="My Purchases" description="Access your bookstore items and standalone exam purchases." />
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>{purchases.map((purchase) => <Card key={purchase.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}>{purchase.type === 'Book' ? <MenuBookOutlinedIcon /> : <SchoolOutlinedIcon />}</Box><Box sx={{ flex: 1 }}><Chip label={purchase.type} size="small" variant="outlined" sx={{ mb: 1 }} /><Typography variant="h6" sx={{ mb: 2 }}>{purchase.item_name}</Typography><Button variant="outlined" size="small" component="a" href={purchase.download_url} startIcon={<DownloadOutlinedIcon />}>{purchase.type === 'Book' ? 'Download item' : 'Access exam'}</Button></Box></Stack></CardContent></Card>)}</Box>
</>

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

const OtherClassesView: FC<{ classes: PublicClass[]; enrolledClassIds: Set<number>; isLoading: boolean; error: string | null }> = ({ classes, enrolledClassIds, isLoading, error }) => {
  const [page, setPage] = useState(1)
  const availableClasses = classes.filter((classRecord) => !enrolledClassIds.has(classRecord.id))
  const pageCount = Math.ceil(availableClasses.length / catalogPageSize)
  const visibleClasses = availableClasses.slice((page - 1) * catalogPageSize, page * catalogPageSize)

  useEffect(() => setPage(1), [classes.length, enrolledClassIds.size])

  return <>
    <ViewHeading title="Other Classes" description="Find live classes available outside your current schedule." />
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading other classes" /></Box> : error ? <EmptyState title="Classes unavailable" description={error} /> : availableClasses.length === 0 ? <EmptyState title="No other classes yet" description="There are no additional published classes available right now." /> : <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>{visibleClasses.map((classRecord) => { const schedule = { ...classRecord.schedule, date: '', startsAt: '' }; const statusLabel = classRecord.status === 'pending_schedule' ? 'Pending schedule' : classRecord.status === 'open' ? 'Available' : classRecord.status === 'full' ? 'Full' : 'Closed'; const statusColor = classRecord.status === 'open' ? 'success' : classRecord.status === 'closed' ? 'error' : 'warning'; return <Card key={classRecord.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><ClassOutlinedIcon /></Box><Chip label={statusLabel} size="small" color={statusColor} /></Stack><Typography variant="h6" sx={{ mb: 1 }}>{classRecord.title}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Tutor: {classRecord.tutorName}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{classScheduleLabel(schedule)}</Typography><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography color="primary.main" sx={{ fontWeight: 700 }}>${classRecord.price}</Typography>{classRecord.courseTitle && <Typography variant="caption" color="text.secondary" noWrap>{classRecord.courseTitle}</Typography>}</Stack></CardContent></Card> })}</Box>
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

const CourseViewer: FC<{ course: DashboardCourse; progress: number; completedLessonIds: number[]; started: boolean; timeSpentSeconds: number; quizResults: Record<number, DashboardQuizResult>; initialLessonId?: number; onBack: () => void; onStart: () => void; onCompleteLesson: (lessonId: number) => void; onQuizSubmit: (lessonId: number, result: DashboardQuizResult) => void }> = ({ course, progress, completedLessonIds, started, timeSpentSeconds, quizResults, initialLessonId, onBack, onStart, onCompleteLesson, onQuizSubmit }) => {
  const lessons = getLessons(course)
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ?? lessons[0]?.id)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizResult, setQuizResult] = useState<DashboardQuizResult | null>(null)
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0]

  useEffect(() => { setSelectedLessonId(initialLessonId ?? lessons[0]?.id) }, [course.id, initialLessonId])
  useEffect(() => { setQuizAnswers({}); setQuizResult(selectedLessonId === undefined ? null : quizResults[selectedLessonId] ?? null) }, [selectedLessonId, quizResults])

  if (!selectedLesson) return <EmptyState title="Course content unavailable" description="This course does not have any lessons yet." actionLabel="Back to courses" onAction={onBack} />

  const isCompleted = completedLessonIds.includes(selectedLesson.id)
  const isCourseComplete = lessons.length > 0 && progress === 100
  const quizQuestions = selectedLesson.quizQuestions ?? []
  const passingScore = selectedLesson.passThreshold ?? 70
  const hasAnsweredQuiz = quizQuestions.length > 0 && quizQuestions.every((question) => quizAnswers[question.id] !== undefined)
  const isQuizPassed = selectedLesson.type === 'quiz' && (quizResult?.passed ?? false)
  const isQuizFinished = selectedLesson.type === 'quiz' && (isCompleted || quizResult !== null)
  const canCompleteLesson = selectedLesson.type !== 'quiz' || quizQuestions.length === 0 || isQuizPassed
  const isLessonLocked = (lessonId: number) => {
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId)
    return lessonIndex > 0 && lessons.slice(0, lessonIndex).some((lesson) => !completedLessonIds.includes(lesson.id))
  }
  const submitQuiz = () => {
    if (!hasAnsweredQuiz || isQuizFinished) return
    const correctAnswers = quizQuestions.filter((question) => quizAnswers[question.id] === question.correctOption).length
    const score = Math.round((correctAnswers / quizQuestions.length) * 100)
    const passed = score >= passingScore
    const result = { score, passed }
    setQuizResult(result)
    onQuizSubmit(selectedLesson.id, result)
    toast.add({ title: passed ? 'Quiz passed' : 'Quiz not passed', description: passed ? 'You scored ' + score + '%. You can now complete this lesson.' : 'You scored ' + score + '%. You need at least ' + passingScore + '% to pass.', type: passed ? 'success' : 'error' })
  }

  if (!started) return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to My Courses</Box>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}><Box><Typography variant="h4" sx={{ mb: 0.5 }}>{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.level} · Tutor: {course.tutor}</Typography></Box><Chip label="Not started" color="default" /></Stack>
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider' }}><Typography variant="h5" sx={{ mb: 0.5 }}>Course content</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Review the lessons below, then start the course when you&apos;re ready to learn.</Typography><Stack spacing={2} sx={{ mb: 3 }}>{course.modules.map((module) => <Box key={module.id}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>{module.title}</Typography><Stack spacing={0.5}>{module.lessons.map((lesson) => <Box key={lesson.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, backgroundColor: 'background.default' }}><Box sx={{ display: 'flex', color: 'text.secondary' }}>{iconForLesson(lesson.type)}</Box><Typography variant="body2" sx={{ flex: 1 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.duration}</Typography></Box>)}</Stack></Box>)}</Stack><Button variant="contained" size="large" onClick={onStart} startIcon={<PlayCircleOutlineIcon />}>Start course</Button></Paper>
  </>

  return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to My Courses</Box>
    {isCourseComplete && <Paper elevation={0} role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 3, border: 1, borderColor: 'primary.main', backgroundColor: 'primary.main', color: 'primary.contrastText' }}><CelebrationOutlinedIcon /><Box><Typography sx={{ fontWeight: 700 }}>Congratulations!</Typography><Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>You completed every lesson in this course.</Typography></Box></Paper>}
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}><Box><Typography variant="h4" sx={{ mb: 0.5 }}>{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.level} · Tutor: {course.tutor}</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Time spent learning: {formatTimeSpent(timeSpentSeconds)}</Typography></Box><Chip label={progress + '% complete'} color="primary" /></Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', alignSelf: 'start' }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Course content</Typography><Stack spacing={1}>{course.modules.map((module) => <Box key={module.id}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mb: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{module.title}</Typography><Stack spacing={0.5}>{module.lessons.map((lesson) => { const locked = isLessonLocked(lesson.id); return <Box key={lesson.id} component="button" type="button" disabled={locked} aria-disabled={locked} onClick={() => setSelectedLessonId(lesson.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 0, borderRadius: 1.5, backgroundColor: selectedLesson.id === lesson.id ? 'action.selected' : 'transparent', color: 'text.primary', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.55 : 1, fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: locked ? 'transparent' : 'action.hover' } }}><Box sx={{ display: 'flex', color: completedLessonIds.includes(lesson.id) ? 'success.main' : 'text.secondary' }}>{completedLessonIds.includes(lesson.id) ? <CheckCircleOutlineIcon fontSize="small" /> : iconForLesson(lesson.type)}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" noWrap sx={{ fontWeight: selectedLesson.id === lesson.id ? 600 : 400 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.duration}</Typography></Box></Box> })}</Stack></Box>)}</Stack></Paper>
      <Stack spacing={2}><Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.18), rgba(16, 125, 111, 0.04))' }}>{selectedLesson.type === 'video' && selectedLesson.videoUrl ? <Box component="video" controls preload="metadata" src={selectedLesson.videoUrl} poster={selectedLesson.thumbnailUrl} sx={{ width: '100%', height: '100%', maxHeight: { xs: 340, md: 520 }, objectFit: 'contain' }}>Your browser does not support video playback.</Box> : selectedLesson.type === 'video' ? <PlayCircleOutlineIcon color="primary" sx={{ fontSize: 78 }} /> : selectedLesson.type === 'article' ? <ArticleOutlinedIcon color="primary" sx={{ fontSize: 72 }} /> : <QuizOutlinedIcon color="primary" sx={{ fontSize: 72 }} />}</Box><Box sx={{ p: { xs: 2.5, md: 3 } }}><Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{selectedLesson.type}</Typography><Typography variant="body2" color="text.secondary">{selectedLesson.duration}</Typography></Stack><Typography variant="h5" sx={{ mb: 1 }}>{selectedLesson.title}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{selectedLesson.description}</Typography>{selectedLesson.type === 'article' && <Typography sx={{ mt: 2, lineHeight: 1.8 }}>Work through the article carefully, then mark this lesson complete when you are ready.</Typography>}{selectedLesson.type === 'quiz' && <Box sx={{ mt: 3 }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Knowledge check</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Answer every question, then submit the quiz. You need at least {passingScore}% to pass.</Typography>{quizQuestions.length === 0 ? <Alert severity="info">No questions have been added to this quiz yet. You can still mark this lesson complete.</Alert> : <Stack spacing={2.5}>{quizQuestions.map((question, questionIndex) => <FormControl key={question.id} component="fieldset"><FormLabel component="legend">{questionIndex + 1}. {question.question}</FormLabel><RadioGroup value={quizAnswers[question.id] === undefined ? '' : String(quizAnswers[question.id])} onChange={(event) => { setQuizAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) })); setQuizResult(null) }} sx={{ mt: 0.5 }}>{question.options.map((option, optionIndex) => <FormControlLabel key={question.id + '-' + optionIndex} value={optionIndex} control={<Radio />} label={option} disabled={isQuizFinished} />)}</RadioGroup></FormControl>)}</Stack>}{quizQuestions.length > 0 && <Button variant="contained" onClick={submitQuiz} disabled={isQuizFinished || !hasAnsweredQuiz} startIcon={<QuizOutlinedIcon />} sx={{ mt: 2 }}>Submit quiz</Button>}{quizResult && <Alert severity={quizResult.passed ? 'success' : 'error'} sx={{ mt: 2 }}>Score: {quizResult.score}% — {quizResult.passed ? 'Passed' : 'Not passed. You need at least ' + passingScore + '% to pass.'}</Alert>}</Box>}{selectedLesson.type !== 'quiz' && <Typography sx={{ mt: 3, lineHeight: 1.8 }}>Mark this lesson complete when you are ready to continue.</Typography>}<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}><Button variant="contained" onClick={() => onCompleteLesson(selectedLesson.id)} disabled={isCompleted || !canCompleteLesson}>{isCompleted ? 'Lesson completed' : 'Mark lesson complete'}</Button></Box></Box></Paper></Stack>
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [now, setNow] = useState(() => new Date())
  const [enrollments, setEnrollments] = useState<DashboardEnrollment[]>([])
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [payments, setPayments] = useState<MyPayment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [otherCourses, setOtherCourses] = useState<Course[]>([])
  const [isLoadingOtherCourses, setIsLoadingOtherCourses] = useState(true)
  const [otherCoursesError, setOtherCoursesError] = useState<string | null>(null)
  const [otherClasses, setOtherClasses] = useState<PublicClass[]>([])
  const [isLoadingOtherClasses, setIsLoadingOtherClasses] = useState(true)
  const [otherClassesError, setOtherClassesError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(undefined)
  const [completedLessons, setCompletedLessons] = useState<Record<number, number[]>>({})
  const [startedCourses, setStartedCourses] = useState<Record<number, boolean>>({})
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({})
  const [quizResults, setQuizResults] = useState<Record<number, Record<number, DashboardQuizResult>>>({})
  const [progressError, setProgressError] = useState<string | null>(null)
  const [profileMessage, setProfileMessage] = useState('')
  const progressSnapshot = useRef({ completedLessons, startedCourses, timeSpent, quizResults })
  progressSnapshot.current = { completedLessons, startedCourses, timeSpent, quizResults }

  const persistProgress = (courseId: number, overrides: { completedLessonIds?: number[]; started?: boolean; timeSpentSeconds?: number; quizResults?: Record<number, DashboardQuizResult> } = {}) => {
    const current = progressSnapshot.current
    const progress = {
      completedLessonIds: overrides.completedLessonIds ?? current.completedLessons[courseId] ?? [],
      started: overrides.started ?? Boolean(current.startedCourses[courseId]),
      timeSpentSeconds: overrides.timeSpentSeconds ?? current.timeSpent[courseId] ?? 0,
      quizResults: overrides.quizResults ?? current.quizResults[courseId] ?? {},
    }
    void saveCourseProgress(courseId, progress).catch((error) => setProgressError(error instanceof Error ? error.message : 'Unable to save course activity.'))
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
    if (activeView !== 'course-view' || selectedCourseId === null) return
    let lastTrackedAt = Date.now()
    const flushTime = () => {
      const elapsedSeconds = Math.floor((Date.now() - lastTrackedAt) / 1000)
      if (elapsedSeconds <= 0) return
      const currentSeconds = progressSnapshot.current.timeSpent[selectedCourseId] ?? 0
      const nextSeconds = currentSeconds + elapsedSeconds
      lastTrackedAt = Date.now()
      progressSnapshot.current = { ...progressSnapshot.current, timeSpent: { ...progressSnapshot.current.timeSpent, [selectedCourseId]: nextSeconds } }
      setTimeSpent((current) => ({ ...current, [selectedCourseId]: nextSeconds }))
      persistProgress(selectedCourseId, { timeSpentSeconds: nextSeconds, started: true })
    }
    const timer = window.setInterval(flushTime, 30000)
    return () => {
      window.clearInterval(timer)
      flushTime()
    }
  }, [activeView, selectedCourseId])

  useEffect(() => {
    let isCurrent = true
    getMyEnrollments()
      .then((records) => {
        if (!isCurrent) return
        const completedByCourse = Object.fromEntries(records.filter((record) => record.completedLessonIds.length > 0).map((record) => [record.courseId, record.completedLessonIds]))
        const startedByCourse = Object.fromEntries(records.filter((record) => record.started).map((record) => [record.courseId, true]))
        const timeByCourse = Object.fromEntries(records.filter((record) => record.timeSpentSeconds > 0).map((record) => [record.courseId, record.timeSpentSeconds]))
        const resultsByCourse = Object.fromEntries(records.filter((record) => Object.keys(record.quizResults).length > 0).map((record) => [record.courseId, record.quizResults]))
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

  const selectedCourse = enrollments.find((enrollment) => enrollment.type === 'course' && enrollment.item_id === selectedCourseId)?.course ?? enrollments.find((enrollment) => enrollment.type === 'class' && enrollment.classRecord?.course?.id === selectedCourseId)?.classRecord?.course
  const selectedCourseEnrollment = enrollments.find((enrollment) => enrollment.type === 'course' && enrollment.item_id === selectedCourseId) ?? enrollments.find((enrollment) => enrollment.type === 'class' && enrollment.classRecord?.course?.id === selectedCourseId)
  const selectedCourseProgress = selectedCourse ? getCourseProgress(selectedCourse, completedLessons[selectedCourse.id] ?? []) : 0
  const enrolledCourseIds = new Set(enrollments.flatMap((enrollment) => enrollment.type === 'course' ? [String(enrollment.item_id)] : enrollment.classRecord?.course ? [String(enrollment.classRecord.course.id)] : []))
  const enrolledClassIds = new Set(enrollments.filter((enrollment) => enrollment.type === 'class').map((enrollment) => enrollment.item_id))
  const pageTitle = activeView === 'course-view' ? selectedCourse?.title ?? 'Course view' : activeView === 'overview' ? 'Dashboard' : activeView === 'courses' ? 'My Courses' : activeView === 'classes' ? 'My Classes' : activeView === 'quizzes' ? 'Quizzes & Results' : activeView === 'purchases' ? 'My Purchases' : activeView === 'other-courses' ? 'Other Courses' : activeView === 'other-classes' ? 'Other Classes' : activeView === 'profile' ? 'Profile' : 'Payment History'

  const selectView = (view: DashboardView) => {
    setActiveView(view)
    setMobileOpen(false)
  }
  const openCourse = (courseId: number, lessonId?: number) => {
    setSelectedCourseId(courseId)
    setSelectedLessonId(lessonId)
    setActiveView('course-view')
    setMobileOpen(false)
  }
  const startCourse = (courseId: number) => {
    const nextCompleted = completedLessons[courseId] ?? []
    setStartedCourses((current) => ({ ...current, [courseId]: true }))
    toast.add({ title: 'Course started', description: 'You are ready to begin learning.', type: 'info' })
    setProgressError(null)
    persistProgress(courseId, { completedLessonIds: nextCompleted, started: true })
  }
  const completeLesson = (lessonId: number) => {
    if (!selectedCourseId || !selectedCourse) return
    const completed = completedLessons[selectedCourseId] ?? []
    if (completed.includes(lessonId)) return
    const nextCompleted = [...completed, lessonId]
    const nextProgress = getCourseProgress(selectedCourse, nextCompleted)
    setCompletedLessons((current) => ({ ...current, [selectedCourseId]: nextCompleted }))
    setStartedCourses((current) => ({ ...current, [selectedCourseId]: true }))
    setEnrollments((current) => current.map((enrollment) => enrollment.type === 'course' && enrollment.item_id === selectedCourseId ? { ...enrollment, progress: nextProgress } : enrollment))
    if (nextProgress === 100) toast.add({ title: 'Course completed!', description: `Excellent work finishing ${selectedCourse.title}.`, type: 'success', priority: 'high', duration: 6000 })
    setProgressError(null)
    persistProgress(selectedCourseId, { completedLessonIds: nextCompleted, started: true })
  }
  const submitQuiz = (lessonId: number, result: DashboardQuizResult) => {
    if (!selectedCourseId) return
    const nextResults = { ...(quizResults[selectedCourseId] ?? {}), [lessonId]: result }
    setQuizResults((current) => ({ ...current, [selectedCourseId]: nextResults }))
    setProgressError(null)
    persistProgress(selectedCourseId, { quizResults: nextResults, started: true })
  }
  const updateProfile = (profile: { name: string; email: string; phone: string }) => setProfileMessage(`Profile saved for ${profile.name}.`)

  const sidebar = <DashboardSidebar activeView={activeView} onSelectView={selectView} />

  return <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
    {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}<IconButton onClick={() => setMobileOpen(false)} aria-label="Close dashboard navigation" sx={{ position: 'absolute', top: 10, right: 10 }}><CloseIcon /></IconButton></Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
    <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
      <DashboardHeader title={pageTitle} darkMode={darkMode} language={language} onLanguageChange={() => setLanguage((current) => current === 'EN' ? 'AM' : 'EN')} onToggleDarkMode={onToggleDarkMode} onOpenMenu={() => setMobileOpen(true)} />
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, minHeight: 'calc(100vh - 72px)' }}>
        {profileMessage && <Alert severity="success" onClose={() => setProfileMessage('')} sx={{ mb: 3 }}>{profileMessage}</Alert>}
        {progressError && <Alert severity="error" onClose={() => setProgressError(null)} sx={{ mb: 3 }}>{progressError}</Alert>}
        {isLoadingEnrollments ? <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }} aria-live="polite"><CircularProgress aria-label="Loading enrollments" /><Typography color="text.secondary">Loading your enrollments...</Typography></Box> : enrollmentError ? <Alert severity="error">{enrollmentError}</Alert> : <>
          {activeView === 'overview' && <OverviewView enrollments={enrollments} now={now} onSelectView={selectView} onOpenCourse={openCourse} />}
          {activeView === 'courses' && <CoursesView enrollments={enrollments} onOpenCourse={openCourse} />}
          {activeView === 'classes' && <ClassesView enrollments={enrollments} now={now} onOpenCourse={openCourse} />}
          {activeView === 'quizzes' && <QuizzesView enrollments={enrollments} completedLessons={completedLessons} quizResults={quizResults} onOpenCourse={openCourse} />}
          {activeView === 'purchases' && <PurchasesView />}
          {activeView === 'other-courses' && <OtherCoursesView courses={otherCourses} enrolledCourseIds={enrolledCourseIds} isLoading={isLoadingOtherCourses} error={otherCoursesError} />}
          {activeView === 'other-classes' && <OtherClassesView classes={otherClasses} enrolledClassIds={enrolledClassIds} isLoading={isLoadingOtherClasses} error={otherClassesError} />}
          {activeView === 'profile' && <ProfileView onUpdateProfile={updateProfile} />}
          {activeView === 'payments' && <PaymentHistoryView payments={payments} isLoading={isLoadingPayments} error={paymentError} />}
          {activeView === 'course-view' && selectedCourse && selectedCourseEnrollment && <CourseViewer course={selectedCourse} progress={selectedCourseProgress} completedLessonIds={completedLessons[selectedCourse.id] ?? []} started={Boolean(startedCourses[selectedCourse.id] || completedLessons[selectedCourse.id]?.length)} timeSpentSeconds={timeSpent[selectedCourse.id] ?? 0} quizResults={quizResults[selectedCourse.id] ?? {}} initialLessonId={selectedLessonId} onBack={() => selectView(selectedCourseEnrollment.type === 'class' ? 'classes' : 'courses')} onStart={() => startCourse(selectedCourse.id)} onCompleteLesson={completeLesson} onQuizSubmit={submitQuiz} />}
        </>}
      </Box>
    </Box>
  </Box>
}

export default StudentDashboard
