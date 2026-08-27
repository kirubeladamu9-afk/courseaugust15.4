import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
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
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
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
import { type FC, type ReactNode, useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import AdminDataTable, { type DataColumn } from '@/components/admin/admin-data-table'
import { getAuthenticatedUser, signOut } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

 type DashboardView = 'overview' | 'courses' | 'classes' | 'quizzes' | 'purchases' | 'profile' | 'payments' | 'course-view'
 type EnrollmentType = 'course' | 'class'
 type EnrollmentStatus = 'active' | 'pending_schedule' | 'completed'
 type QuizStatus = 'available' | 'completed'
 type ClassStatus = 'pending_schedule' | 'open'

 interface DashboardEnrollment {
  id: number
  user_id: number
  type: EnrollmentType
  item_id: number
  status: EnrollmentStatus
  progress: number
 }

 interface DashboardLesson {
  id: number
  title: string
  type: 'video' | 'article' | 'quiz'
  duration: string
  description: string
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
  date: string
  startsAt: string
 }

 interface DashboardClass {
  id: number
  title: string
  tutor_id: number
  schedule: DashboardClassSchedule
  meeting_link: string
  status: ClassStatus
  course_id: number | null
 }

 interface DashboardQuiz {
  id: number
  course_id: number
  title: string
  status: QuizStatus
  score: number | null
 }

 interface DashboardPurchase {
  id: number
  item_name: string
  type: 'Book' | 'Exam'
  download_url: string
}

 interface DashboardPayment {
  id: number
  item_name: string
  type: 'Course' | 'Class'
  amount: number
  status: 'Paid' | 'Pending'
  date: string
  tx_ref: string
}

const drawerWidth = 272
const mockUserId = 101
const mockSessionStart = new Date(Date.now() + 24 * 60 * 60 * 1000)
mockSessionStart.setHours(18, 30, 0, 0)

const courses: DashboardCourse[] = [
  {
    id: 1,
    title: 'Modern React with MUI & Redux',
    category: 'Frontend Development',
    level: 'Intermediate',
    tutor: 'Maya Chen',
    modules: [
      {
        id: 11,
        title: 'React foundations',
        lessons: [
          { id: 101, title: 'Component architecture', type: 'video', duration: '18 min', description: 'Learn how to split a React interface into clear, reusable components.' },
          { id: 102, title: 'Props and state', type: 'article', duration: '8 min read', description: 'Understand the data flow patterns that keep interactive screens predictable.' },
        ],
      },
      {
        id: 12,
        title: 'Building product interfaces',
        lessons: [
          { id: 103, title: 'Designing with Material UI', type: 'video', duration: '24 min', description: 'Create accessible layouts with Material UI components and theme tokens.' },
          { id: 104, title: 'Knowledge check', type: 'quiz', duration: '5 questions', description: 'Review the concepts from the first two sections.' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Data Modeling Fundamentals',
    category: 'Data Science',
    level: 'Beginner',
    tutor: 'Leon Kennedy',
    modules: [
      {
        id: 21,
        title: 'Modeling essentials',
        lessons: [
          { id: 201, title: 'Entities and relationships', type: 'video', duration: '20 min', description: 'Map real-world requirements into a durable data model.' },
          { id: 202, title: 'Normalization guide', type: 'article', duration: '10 min read', description: 'Use normalization to reduce duplication without losing useful context.' },
        ],
      },
    ],
  },
]

const classes: DashboardClass[] = [
  {
    id: 1,
    title: 'Live React Workshop',
    tutor_id: 1,
    schedule: { days: ['Tue'], time: '6:30 PM', date: mockSessionStart.toISOString(), startsAt: mockSessionStart.toISOString() },
    meeting_link: '#join-react-workshop',
    status: 'open',
    course_id: 1,
  },
  {
    id: 2,
    title: 'Private Conversation Class',
    tutor_id: 2,
    schedule: { days: [], time: '', date: '', startsAt: '' },
    meeting_link: '',
    status: 'pending_schedule',
    course_id: null,
  },
]

const quizzes: DashboardQuiz[] = [
  { id: 1, course_id: 1, title: 'React foundations knowledge check', status: 'completed', score: 92 },
  { id: 2, course_id: 1, title: 'Material UI layout challenge', status: 'available', score: null },
  { id: 3, course_id: 2, title: 'Data modeling essentials', status: 'available', score: null },
  { id: 4, course_id: 99, title: 'Unenrolled course quiz', status: 'available', score: null },
]

const purchases: DashboardPurchase[] = [
  { id: 1, item_name: 'The Practical React Workbook', type: 'Book', download_url: '#react-workbook' },
  { id: 2, item_name: 'Frontend Developer Practice Exam', type: 'Exam', download_url: '#frontend-exam' },
]

const payments: DashboardPayment[] = [
  { id: 1, item_name: 'Modern React with MUI & Redux', type: 'Course', amount: 35, status: 'Paid', date: 'Aug 18, 2025', tx_ref: 'CS-REACT-0818' },
  { id: 2, item_name: 'Live React Workshop', type: 'Class', amount: 25, status: 'Paid', date: 'Aug 18, 2025', tx_ref: 'CS-CLASS-0818' },
  { id: 3, item_name: 'Private Conversation Class', type: 'Class', amount: 30, status: 'Pending', date: 'Aug 20, 2025', tx_ref: 'CS-CLASS-0820' },
]

const initialEnrollments: DashboardEnrollment[] = [
  { id: 1, user_id: mockUserId, type: 'course', item_id: 1, status: 'active', progress: 25 },
  { id: 2, user_id: mockUserId, type: 'course', item_id: 2, status: 'active', progress: 20 },
  { id: 3, user_id: mockUserId, type: 'class', item_id: 1, status: 'active', progress: 0 },
  { id: 4, user_id: mockUserId, type: 'class', item_id: 2, status: 'pending_schedule', progress: 0 },
]

const tutors: Record<number, string> = { 1: 'Maya Chen', 2: 'Leon Kennedy' }

const formatDate = (date: string) => date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : 'Date to be confirmed'
const formatTime = (date: string) => date ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date)) : 'Time to be confirmed'
const classScheduleLabel = (schedule: DashboardClassSchedule) => `${schedule.days.join(', ')} · ${schedule.time}`
const getLessons = (course: DashboardCourse) => course.modules.flatMap((module) => module.lessons)
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
        <MenuItem onClick={() => { setProfileAnchor(null); navigateTo('/dashboard') }}>Dashboard home</MenuItem>
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
  const navItem = (view: DashboardView, label: string, icon: ReactNode, active: boolean) => <Box component="button" type="button" onClick={() => onSelectView(view)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5, backgroundColor: active ? 'primary.main' : 'transparent', color: active ? 'primary.contrastText' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: active ? 'primary.dark' : 'action.hover' } }}><Box sx={{ display: 'flex' }}>{icon}</Box><Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>{label}</Typography></Box>

  return <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ px: 3, py: 2.5 }}><Logo /></Box>
    <Divider />
    <Box component="nav" aria-label="Student dashboard navigation" sx={{ p: 1.5, flex: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1.5, mb: 1, letterSpacing: 1.2, fontWeight: 700 }}>Main menu</Typography>
      {navItem('overview', 'Dashboard', <DashboardOutlinedIcon fontSize="small" />, activeView === 'overview')}
      <Box>
        {navItem('courses', 'My Enrollments', <MenuBookOutlinedIcon fontSize="small" />, enrollmentActive)}
        {enrollmentActive && <Box sx={{ ml: 2, mb: 1 }}>
          <Box component="button" type="button" onClick={() => onSelectView('courses')} sx={{ width: '100%', border: 0, borderLeft: 2, borderColor: activeView === 'courses' || activeView === 'course-view' ? 'primary.main' : 'divider', py: 0.75, pl: 1.5, pr: 1, backgroundColor: 'transparent', color: activeView === 'courses' || activeView === 'course-view' ? 'primary.main' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeView === 'courses' || activeView === 'course-view' ? 600 : 400, textAlign: 'left' }}>My Courses</Box>
          <Box component="button" type="button" onClick={() => onSelectView('classes')} sx={{ width: '100%', border: 0, borderLeft: 2, borderColor: activeView === 'classes' ? 'primary.main' : 'divider', py: 0.75, pl: 1.5, pr: 1, backgroundColor: 'transparent', color: activeView === 'classes' ? 'primary.main' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeView === 'classes' ? 600 : 400, textAlign: 'left' }}>My Classes</Box>
        </Box>}
      </Box>
      {navItem('quizzes', 'Quizzes & Results', <QuizOutlinedIcon fontSize="small" />, activeView === 'quizzes')}
      {navItem('purchases', 'My Purchases', <PaymentsOutlinedIcon fontSize="small" />, activeView === 'purchases')}
      {navItem('profile', 'Profile', <PersonOutlineIcon fontSize="small" />, activeView === 'profile')}
      {navItem('payments', 'Payment History', <PaymentsOutlinedIcon fontSize="small" />, activeView === 'payments')}
    </Box>
    <Box sx={{ p: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, backgroundColor: 'background.default', borderRadius: 2 }}><SchoolOutlinedIcon color="primary" fontSize="small" /><Typography variant="caption" color="text.secondary">Keep learning at your own pace.</Typography></Box></Box>
  </Box>
}

const OverviewView: FC<{ enrollments: DashboardEnrollment[]; onSelectView: (view: DashboardView) => void; onOpenCourse: (courseId: number) => void }> = ({ enrollments, onSelectView, onOpenCourse }) => {
  const enrolledCourseIds = enrollments.filter((enrollment) => enrollment.type === 'course' && enrollment.status !== 'completed').map((enrollment) => enrollment.item_id)
  const activeCourseCount = enrolledCourseIds.length
  const nextClassEnrollment = enrollments.find((enrollment) => enrollment.type === 'class' && enrollment.status === 'active' && classes.find((classRecord) => classRecord.id === enrollment.item_id)?.status === 'open')
  const nextClass = classes.find((classRecord) => classRecord.id === nextClassEnrollment?.item_id)
  const pendingCount = enrollments.filter((enrollment) => enrollment.type === 'class' && enrollment.status === 'pending_schedule').length

  return <>
    <ViewHeading eyebrow="Welcome back" title="Dashboard" description="Pick up where you left off and stay on top of your learning schedule." />
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <SummaryCard label="Active courses" value={String(activeCourseCount)} detail="Self-paced courses in progress" icon={<MenuBookOutlinedIcon />} onClick={() => onSelectView('courses')} />
      <SummaryCard label="Next live class" value={nextClass?.title ?? 'No class scheduled'} detail={nextClass ? `${formatDate(nextClass.schedule.startsAt)} · ${formatTime(nextClass.schedule.startsAt)}` : 'Check My Classes for updates'} icon={<VideoCallOutlinedIcon />} onClick={() => onSelectView('classes')} />
      <SummaryCard label="Learning progress" value={`${Math.round(enrollments.filter((enrollment) => enrollment.type === 'course').reduce((total, enrollment) => total + enrollment.progress, 0) / Math.max(1, enrollments.filter((enrollment) => enrollment.type === 'course').length))}%`} detail="Average across active courses" icon={<CheckCircleOutlineIcon />} />
    </Stack>
    {pendingCount > 0 && <Alert severity="info" icon={<CalendarTodayOutlinedIcon />} action={<Button color="inherit" size="small" onClick={() => onSelectView('classes')}>View classes</Button>} sx={{ mb: 3 }}><Box><Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700 }}>Pending items</Typography><Typography variant="body2">You have {pendingCount} class {pendingCount === 1 ? 'enrollment' : 'enrollments'} awaiting scheduling. We&apos;ll contact you to arrange the next step.</Typography></Box></Alert>}
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper elevation={0} sx={{ flex: 1, p: 2.5, border: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>Continue learning</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Jump back into your most recently active course.</Typography>
        {enrolledCourseIds[0] && <CourseMiniRow course={courses.find((course) => course.id === enrolledCourseIds[0])!} enrollment={enrollments.find((enrollment) => enrollment.item_id === enrolledCourseIds[0] && enrollment.type === 'course')!} onOpenCourse={onOpenCourse} />}
      </Paper>
      <Paper elevation={0} sx={{ flex: 1, p: 2.5, border: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>Upcoming class</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Your next scheduled live learning session.</Typography>
        {nextClass ? <Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><CalendarTodayOutlinedIcon /></Box><Box><Typography sx={{ fontWeight: 600 }}>{nextClass.title}</Typography><Typography color="text.secondary" variant="body2">{classScheduleLabel(nextClass.schedule)}</Typography><Typography color="text.secondary" variant="body2">Tutor: {tutors[nextClass.tutor_id]}</Typography></Box></Stack> : <Typography color="text.secondary">Your schedule will appear here once a class is confirmed.</Typography>}
      </Paper>
    </Stack>
  </>
}

const CourseMiniRow: FC<{ course: DashboardCourse; enrollment: DashboardEnrollment; onOpenCourse: (courseId: number) => void }> = ({ course, enrollment, onOpenCourse }) => <Box component="button" type="button" onClick={() => onOpenCourse(course.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper', cursor: 'pointer', textAlign: 'left', font: 'inherit', '&:hover': { borderColor: 'primary.main' } }}><Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><PlayCircleOutlineIcon /></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 600 }}>{course.title}</Typography><LinearProgress variant="determinate" value={enrollment.progress} sx={{ mt: 1, height: 6, borderRadius: 4 }} /></Box><Typography color="primary.main" variant="body2" sx={{ fontWeight: 700 }}>{enrollment.progress}%</Typography></Box>

const CoursesView: FC<{ enrollments: DashboardEnrollment[]; onOpenCourse: (courseId: number) => void }> = ({ enrollments, onOpenCourse }) => {
  const courseEnrollments = enrollments.filter((enrollment) => enrollment.type === 'course')
  return <>
    <ViewHeading title="My Courses" description="Build momentum with the self-paced courses in your learning plan." />
    {courseEnrollments.length === 0 ? <EmptyState title="No courses yet" description="Your self-paced enrollments will appear here." actionLabel="Browse courses" onAction={() => navigateTo('/')} /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
      {courseEnrollments.map((enrollment) => {
        const course = courses.find((courseRecord) => courseRecord.id === enrollment.item_id)
        if (!course) return null
        return <Card key={enrollment.id} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ minHeight: 110, p: 2.5, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.16), rgba(16, 125, 111, 0.04))' }}><MenuBookOutlinedIcon color="primary" sx={{ fontSize: 38 }} /></Box>
          <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}><Chip label={course.category} size="small" color="primary" variant="outlined" /><Typography variant="caption" color="text.secondary">{course.level}</Typography></Stack>
            <Typography variant="h6" sx={{ mb: 1 }}>{course.title}</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Tutor: {course.tutor}</Typography>
            <Box sx={{ mt: 'auto' }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="body2">Progress</Typography><Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{enrollment.progress}%</Typography></Stack><LinearProgress variant="determinate" value={enrollment.progress} sx={{ height: 8, borderRadius: 4, mb: 2 }} /><Button fullWidth variant="contained" onClick={() => onOpenCourse(course.id)}>{enrollment.progress ? 'Continue course' : 'Start course'}</Button></Box>
          </CardContent>
        </Card>
      })}
    </Box>}
  </>
}

const ClassesView: FC<{ enrollments: DashboardEnrollment[]; now: Date; onOpenCourse: (courseId: number) => void }> = ({ enrollments, now, onOpenCourse }) => {
  const classEnrollments = enrollments.filter((enrollment) => enrollment.type === 'class')
  return <>
    <ViewHeading title="My Classes" description="See your live learning schedule and join sessions when they are ready." />
    {classEnrollments.length === 0 ? <EmptyState title="No classes yet" description="Live class enrollments will appear here once they are assigned." actionLabel="Explore courses" onAction={() => navigateTo('/')} /> : <Stack spacing={2}>{classEnrollments.map((enrollment) => {
      const classRecord = classes.find((classItem) => classItem.id === enrollment.item_id)
      if (!classRecord) return null
      return <ClassCard key={enrollment.id} classRecord={classRecord} now={now} onOpenCourse={onOpenCourse} />
    })}</Stack>}
  </>
}

const ClassCard: FC<{ classRecord: DashboardClass; now: Date; onOpenCourse: (courseId: number) => void }> = ({ classRecord, now, onOpenCourse }) => {
  const sessionStart = classRecord.schedule.startsAt ? new Date(classRecord.schedule.startsAt) : null
  const isJoinable = classRecord.status === 'open' && sessionStart !== null && now.getTime() >= sessionStart.getTime() - 15 * 60 * 1000 && now.getTime() <= sessionStart.getTime() + 90 * 60 * 1000
  const linkedCourse = classRecord.course_id ? courses.find((course) => course.id === classRecord.course_id) : null
  return <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
    <CardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><ClassOutlinedIcon /></Box><Box><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6">{classRecord.title}</Typography><Chip label={classRecord.status === 'pending_schedule' ? 'Pending schedule' : 'Scheduled'} size="small" color={classRecord.status === 'pending_schedule' ? 'warning' : 'success'} /></Stack>{classRecord.status === 'pending_schedule' ? <Typography color="text.secondary" sx={{ mt: 0.75 }}>Pending — we&apos;ll contact you to schedule your class.</Typography> : <><Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>{classScheduleLabel(classRecord.schedule)}</Typography><Typography color="text.secondary" variant="body2">{formatDate(classRecord.schedule.date)} · Tutor: {tutors[classRecord.tutor_id] ?? 'Tutor to be confirmed'}</Typography></>}</Box></Box>
        {classRecord.status === 'open' && <Button variant="contained" component="a" href={classRecord.meeting_link} disabled={!isJoinable} aria-disabled={!isJoinable} onClick={(event) => { if (!isJoinable) event.preventDefault() }} startIcon={<VideoCallOutlinedIcon />} sx={{ flexShrink: 0 }}>{isJoinable ? 'Join Class' : 'Join at session time'}</Button>}
      </Stack>
      {linkedCourse && <><Divider sx={{ my: 2 }} /><Button variant="text" size="small" startIcon={<MenuBookOutlinedIcon />} onClick={() => onOpenCourse(linkedCourse.id)}>View {linkedCourse.title} curriculum summary</Button></>}
    </CardContent>
  </Card>
}

const QuizzesView: FC<{ enrollments: DashboardEnrollment[] }> = ({ enrollments }) => {
  const enrolledCourseIds = new Set(enrollments.filter((enrollment) => enrollment.type === 'course').map((enrollment) => enrollment.item_id))
  const enrolledQuizzes = quizzes.filter((quiz) => enrolledCourseIds.has(quiz.course_id))
  return <>
    <ViewHeading title="Quizzes & Results" description="Review completed results and test your knowledge in enrolled courses." />
    {enrolledQuizzes.length === 0 ? <EmptyState title="No quizzes available" description="Quizzes from your enrolled courses will appear here." /> : <Stack spacing={2}>{enrolledQuizzes.map((quiz) => {
      const course = courses.find((courseRecord) => courseRecord.id === quiz.course_id)
      return <Card key={quiz.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}><Box sx={{ display: 'flex', gap: 1.5 }}><Box sx={{ display: 'flex', alignSelf: 'flex-start', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}><QuizOutlinedIcon /></Box><Box><Typography variant="h6">{quiz.title}</Typography><Typography color="text.secondary" variant="body2">{course?.title}</Typography></Box></Box>{quiz.status === 'completed' ? <Stack direction="row" spacing={1} alignItems="center"><Chip icon={<CheckCircleOutlineIcon />} label={`Score ${quiz.score}%`} color="success" size="small" /><Button variant="outlined" size="small">Review</Button></Stack> : <Button variant="contained" startIcon={<QuizOutlinedIcon />} onClick={() => undefined}>Start Quiz</Button>}</Stack></CardContent></Card>
    })}</Stack>}
  </>
}

const PurchasesView: FC = () => <>
  <ViewHeading title="My Purchases" description="Access your bookstore items and standalone exam purchases." />
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>{purchases.map((purchase) => <Card key={purchase.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" spacing={1.5} alignItems="flex-start"><Box sx={{ display: 'flex', p: 1.25, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}>{purchase.type === 'Book' ? <MenuBookOutlinedIcon /> : <SchoolOutlinedIcon />}</Box><Box sx={{ flex: 1 }}><Chip label={purchase.type} size="small" variant="outlined" sx={{ mb: 1 }} /><Typography variant="h6" sx={{ mb: 2 }}>{purchase.item_name}</Typography><Button variant="outlined" size="small" component="a" href={purchase.download_url} startIcon={<DownloadOutlinedIcon />}>{purchase.type === 'Book' ? 'Download item' : 'Access exam'}</Button></Box></Stack></CardContent></Card>)}</Box>
</>

const ProfileView: FC<{ onUpdateProfile: (profile: { name: string; email: string; phone: string }) => void }> = ({ onUpdateProfile }) => {
  const user = getAuthenticatedUser()
  const [profile, setProfile] = useState({ name: user?.name || 'Alex Morgan', email: user?.email || 'alex@example.com', phone: '+1 202 555 0147' })
  return <>
    <ViewHeading title="Profile" description="Keep your learner details current and up to date." />
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Profile details</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>These details help us keep your learning records up to date.</Typography>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); onUpdateProfile(profile) }} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}><TextField label="Full name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /><TextField label="Email address" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /><TextField label="Phone number" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><Button type="submit" variant="contained">Save profile</Button></Box></Box>
    </Paper>
  </>
}

const PaymentHistoryView: FC = () => <>
  <ViewHeading title="Payment History" description="Review course and live class transactions linked to your account." />
  <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
    <AdminDataTable rows={payments} columns={paymentColumns} searchPlaceholder="Search payments" searchKeys={['item_name', 'type', 'tx_ref']} />
  </Paper>
</>

const paymentColumns: DataColumn<DashboardPayment>[] = [
  { key: 'item_name', label: 'Item' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (value) => `$${Number(value).toFixed(2)}` },
  { key: 'status', label: 'Status', render: (value) => <Chip label={String(value)} color={value === 'Paid' ? 'success' : 'warning'} size="small" /> },
  { key: 'date', label: 'Date' },
  { key: 'tx_ref', label: 'Transaction Reference' },
]

const CourseViewer: FC<{ course: DashboardCourse; progress: number; completedLessonIds: number[]; onBack: () => void; onCompleteLesson: (lessonId: number) => void }> = ({ course, progress, completedLessonIds, onBack, onCompleteLesson }) => {
  const lessons = getLessons(course)
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id)
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0]
  useEffect(() => { setSelectedLessonId(lessons[0]?.id) }, [course.id])
  if (!selectedLesson) return <EmptyState title="Course content unavailable" description="This course does not have any lessons yet." actionLabel="Back to courses" onAction={onBack} />
  const isCompleted = completedLessonIds.includes(selectedLesson.id)
  return <>
    <Box component="button" type="button" onClick={onBack} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}><ArrowBackIcon fontSize="small" /> Back to My Courses</Box>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}><Box><Typography variant="h4" sx={{ mb: 0.5 }}>{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.level} · Tutor: {course.tutor}</Typography></Box><Chip label={`${progress}% complete`} color="primary" /></Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', alignSelf: 'start' }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Course content</Typography><Stack spacing={1}>{course.modules.map((module) => <Box key={module.id}><Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mb: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{module.title}</Typography><Stack spacing={0.5}>{module.lessons.map((lesson) => <Box key={lesson.id} component="button" type="button" onClick={() => setSelectedLessonId(lesson.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 0, borderRadius: 1.5, backgroundColor: selectedLesson.id === lesson.id ? 'action.selected' : 'transparent', color: 'text.primary', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: 'action.hover' } }}><Box sx={{ display: 'flex', color: completedLessonIds.includes(lesson.id) ? 'success.main' : 'text.secondary' }}>{completedLessonIds.includes(lesson.id) ? <CheckCircleOutlineIcon fontSize="small" /> : iconForLesson(lesson.type)}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" noWrap sx={{ fontWeight: selectedLesson.id === lesson.id ? 600 : 400 }}>{lesson.title}</Typography><Typography variant="caption" color="text.secondary">{lesson.duration}</Typography></Box></Box>)}</Stack></Box>)}</Stack></Paper>
      <Stack spacing={2}><Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.18), rgba(16, 125, 111, 0.04))' }}>{selectedLesson.type === 'video' ? <PlayCircleOutlineIcon color="primary" sx={{ fontSize: 78 }} /> : selectedLesson.type === 'article' ? <ArticleOutlinedIcon color="primary" sx={{ fontSize: 72 }} /> : <QuizOutlinedIcon color="primary" sx={{ fontSize: 72 }} />}</Box><Box sx={{ p: { xs: 2.5, md: 3 } }}><Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{selectedLesson.type}</Typography><Typography variant="body2" color="text.secondary">{selectedLesson.duration}</Typography></Stack><Typography variant="h5" sx={{ mb: 1 }}>{selectedLesson.title}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{selectedLesson.description}</Typography>{selectedLesson.type === 'article' && <Typography sx={{ mt: 2, lineHeight: 1.8 }}>Work through this lesson at your own pace, then mark it complete when you are ready to continue.</Typography>}{selectedLesson.type === 'quiz' && <Alert severity="info" sx={{ mt: 2 }}>Complete the quiz to check your understanding of this course section.</Alert>}<Button variant={isCompleted ? 'outlined' : 'contained'} disabled={isCompleted} onClick={() => onCompleteLesson(selectedLesson.id)} sx={{ mt: 3 }}>{isCompleted ? 'Lesson completed' : 'Mark lesson complete'}</Button></Box></Paper><Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Your progress</Typography><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography color="text.secondary" variant="body2">{completedLessonIds.length} of {lessons.length} lessons complete</Typography><Typography color="primary.main" variant="body2" sx={{ fontWeight: 700 }}>{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} /></Paper></Stack>
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
  const currentUserId = Number(currentUser?.id) || mockUserId
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [now, setNow] = useState(() => new Date())
  const [enrollments, setEnrollments] = useState<DashboardEnrollment[]>(() => initialEnrollments.map((enrollment) => ({ ...enrollment, user_id: currentUserId })))
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Record<number, number[]>>({ 1: [101], 2: [] })
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleProfileOpen = () => setActiveView('profile')
    window.addEventListener('student-profile-open', handleProfileOpen)
    return () => window.removeEventListener('student-profile-open', handleProfileOpen)
  }, [])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)
  const selectedCourseEnrollment = enrollments.find((enrollment) => enrollment.type === 'course' && enrollment.item_id === selectedCourseId)
  const selectedCourseProgress = selectedCourse ? getCourseProgress(selectedCourse, completedLessons[selectedCourse.id] ?? []) : 0
  const pageTitle = activeView === 'course-view' ? selectedCourse?.title ?? 'Course view' : activeView === 'overview' ? 'Dashboard' : activeView === 'courses' ? 'My Courses' : activeView === 'classes' ? 'My Classes' : activeView === 'quizzes' ? 'Quizzes & Results' : activeView === 'purchases' ? 'My Purchases' : activeView === 'profile' ? 'Profile' : 'Payment History'

  const selectView = (view: DashboardView) => {
    setActiveView(view)
    setMobileOpen(false)
  }
  const openCourse = (courseId: number) => {
    setSelectedCourseId(courseId)
    setActiveView('course-view')
    setMobileOpen(false)
  }
  const completeLesson = (lessonId: number) => {
    if (!selectedCourseId || !selectedCourse) return
    const completed = completedLessons[selectedCourseId] ?? []
    if (completed.includes(lessonId)) return
    const nextCompleted = [...completed, lessonId]
    const nextProgress = getCourseProgress(selectedCourse, nextCompleted)
    setCompletedLessons((current) => ({ ...current, [selectedCourseId]: nextCompleted }))
    setEnrollments((current) => current.map((enrollment) => enrollment.type === 'course' && enrollment.item_id === selectedCourseId ? { ...enrollment, progress: nextProgress } : enrollment))
  }
  const updateProfile = (profile: { name: string; email: string; phone: string }) => setProfileMessage(`Profile saved for ${profile.name}.`)

  const sidebar = <DashboardSidebar activeView={activeView} onSelectView={selectView} />

  return <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
    {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}<IconButton onClick={() => setMobileOpen(false)} aria-label="Close dashboard navigation" sx={{ position: 'absolute', top: 10, right: 10 }}><CloseIcon /></IconButton></Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
    <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
      <DashboardHeader title={pageTitle} darkMode={darkMode} language={language} onLanguageChange={() => setLanguage((current) => current === 'EN' ? 'AM' : 'EN')} onToggleDarkMode={onToggleDarkMode} onOpenMenu={() => setMobileOpen(true)} />
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, minHeight: 'calc(100vh - 72px)' }}>
        {profileMessage && <Alert severity="success" onClose={() => setProfileMessage('')} sx={{ mb: 3 }}>{profileMessage}</Alert>}
        {activeView === 'overview' && <OverviewView enrollments={enrollments.filter((enrollment) => enrollment.user_id === currentUserId)} onSelectView={selectView} onOpenCourse={openCourse} />}
        {activeView === 'courses' && <CoursesView enrollments={enrollments.filter((enrollment) => enrollment.user_id === currentUserId)} onOpenCourse={openCourse} />}
        {activeView === 'classes' && <ClassesView enrollments={enrollments.filter((enrollment) => enrollment.user_id === currentUserId)} now={now} onOpenCourse={openCourse} />}
        {activeView === 'quizzes' && <QuizzesView enrollments={enrollments.filter((enrollment) => enrollment.user_id === currentUserId)} />}
        {activeView === 'purchases' && <PurchasesView />}
        {activeView === 'profile' && <ProfileView onUpdateProfile={updateProfile} />}
        {activeView === 'payments' && <PaymentHistoryView />}
        {activeView === 'course-view' && selectedCourse && selectedCourseEnrollment && <CourseViewer course={selectedCourse} progress={selectedCourseProgress} completedLessonIds={completedLessons[selectedCourse.id] ?? []} onBack={() => selectView('courses')} onCompleteLesson={completeLesson} />}
      </Box>
    </Box>
  </Box>
}

export default StudentDashboard
