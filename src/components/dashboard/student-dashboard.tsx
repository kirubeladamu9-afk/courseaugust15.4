import { useMemo, useState, type FC, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined'
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Logo } from '@/components/logo'
import AdminDataTable, { type DataColumn } from '@/components/admin/admin-data-table'
import { loggedInStudent, quizAttempts, studentCourses, studentEnrollments, studentLessons, studentPayments, studentPurchases, studentQuizzes, type StudentEnrollment, type StudentLesson, type StudentPayment, type StudentPurchase, type StudentQuiz } from './dashboard-data'

const drawerWidth = 272

type DashboardSection = 'enrollments' | 'course-view' | 'quizzes' | 'purchases' | 'profile-payments'

const navigation: Array<{ key: DashboardSection; path: string; label: string; icon: ReactNode }> = [
  { key: 'enrollments', path: 'enrollments', label: 'My Enrollments', icon: <SchoolOutlinedIcon /> },
  { key: 'course-view', path: 'course-view', label: 'Course View', icon: <BookOutlinedIcon /> },
  { key: 'quizzes', path: 'quizzes', label: 'Quizzes & Results', icon: <QuizOutlinedIcon /> },
  { key: 'purchases', path: 'purchases', label: 'My Purchases', icon: <PaymentOutlinedIcon /> },
  { key: 'profile-payments', path: 'profile-payments', label: 'Profile & Payment History', icon: <PersonOutlineIcon /> },
]

const sectionFromPath = (): DashboardSection => {
  const path = window.location.pathname.split('/')[2]
  return navigation.find((item) => item.path === path)?.key ?? 'enrollments'
}

const courseTitle = (courseId: number) => studentCourses.find((course) => course.id === courseId)?.title ?? ''

const statusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
  if (['Completed', 'Paid'].includes(status)) return 'success'
  if (['Available', 'Pending'].includes(status)) return 'warning'
  if (['In progress'].includes(status)) return 'info'
  return 'default'
}

const StatusChip: FC<{ status: string }> = ({ status }) => <Chip label={status} color={statusColor(status)} size="small" />

const PageHeading: FC<{ title: string; description: string; action?: ReactNode }> = ({ title, description, action }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
    {action}
  </Box>
)

const ActionButton: FC<{ label: string; onClick?: () => void; size?: 'small' | 'medium'; variant?: 'contained' | 'outlined' | 'text'; disabled?: boolean; startIcon?: ReactNode }> = ({ label, onClick, size = 'medium', variant = 'contained', disabled = false, startIcon }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main', borderRadius: 6,
      px: size === 'small' ? 1.25 : 2, py: size === 'small' ? 0.5 : 1,
      backgroundColor: variant === 'contained' ? 'primary.main' : 'transparent',
      color: variant === 'text' ? 'primary.main' : variant === 'contained' ? 'primary.contrastText' : 'primary.main',
      cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: size === 'small' ? 12 : 14,
      opacity: disabled ? 0.55 : 1, '&:hover': disabled ? undefined : { backgroundColor: variant === 'contained' ? 'primary.dark' : 'action.hover' },
    }}
  >
    {startIcon}{label}
  </Box>
)

const EnrollmentCard: FC<{ enrollment: StudentEnrollment; onContinue: (courseId: number) => void }> = ({ enrollment, onContinue }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
      <Box sx={{ width: { xs: '100%', sm: 112 }, height: { xs: 72, sm: 112 }, borderRadius: 2, background: 'linear-gradient(135deg, #5965db 0%, #8d98f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <SchoolOutlinedIcon sx={{ fontSize: 42 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 0.75 }}>
          <Typography variant="h6">{courseTitle(enrollment.courseId)}</Typography>
          <StatusChip status={enrollment.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Enrolled {enrollment.enrolledAt} · Next lesson: {enrollment.nextLesson}</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <LinearProgress variant="determinate" value={enrollment.progress} sx={{ flex: 1, maxWidth: 280, height: 7, borderRadius: 4 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{enrollment.progress}%</Typography>
        </Stack>
      </Box>
      <ActionButton label="Continue" onClick={() => onContinue(enrollment.courseId)} />
    </Stack>
  </Paper>
)

const MyEnrollmentsPage: FC<{ onContinue: (courseId: number) => void }> = ({ onContinue }) => (
  <>
    <PageHeading title="My Enrollments" description="Pick up where you left off in your active programs and courses." />
    <Stack spacing={2}>
      {studentEnrollments.map((enrollment) => <EnrollmentCard key={enrollment.id} enrollment={enrollment} onContinue={onContinue} />)}
    </Stack>
  </>
)

const ReadOnlyCourseOutline: FC<{ courseId: number; lessons: StudentLesson[]; activeLessonId: number; onSelectLesson: (lessonId: number) => void }> = ({ courseId, lessons, activeLessonId, onSelectLesson }) => {
  const course = studentCourses.find((item) => item.id === courseId)
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Course content</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Follow the lessons in order to complete this program.</Typography>
      <Stack spacing={1.5}>
        {course?.modules.map((module) => {
          const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id)
          return (
            <Box key={module.id}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.75 }}>{module.title}</Typography>
              <Stack spacing={0.5} sx={{ ml: 1 }}>
                {moduleLessons.map((lesson) => (
                  <Box key={lesson.id} component="button" type="button" onClick={() => onSelectLesson(lesson.id)} sx={{ width: '100%', border: 0, borderRadius: 1.5, p: 1, display: 'flex', alignItems: 'center', gap: 1, textAlign: 'left', backgroundColor: activeLessonId === lesson.id ? 'action.selected' : 'transparent', color: 'text.primary', cursor: 'pointer', fontFamily: 'inherit', '&:hover': { backgroundColor: 'action.hover' } }}>
                    {lesson.completed ? <CheckCircleIcon color="success" fontSize="small" /> : <OndemandVideoOutlinedIcon color="disabled" fontSize="small" />}
                    <Typography variant="body2" sx={{ flex: 1 }}>{lesson.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{lesson.duration}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

const LessonPlayer: FC<{ lesson: StudentLesson; onComplete: (lessonId: number) => void }> = ({ lesson, onComplete }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>{lesson.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{lesson.description}</Typography>
      <Box sx={{ minHeight: 230, borderRadius: 2, background: 'linear-gradient(135deg, #21264c 0%, #454f92 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1.5, textAlign: 'center', p: 3 }}>
        {lesson.type === 'live' ? <EventAvailableOutlinedIcon sx={{ fontSize: 48 }} /> : <PlayCircleOutlineIcon sx={{ fontSize: 52 }} />}
        <Typography variant="h6" sx={{ color: 'inherit' }}>{lesson.type === 'live' ? 'Live session' : playing ? 'Lesson is playing' : 'Video lesson'}</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>{lesson.duration}</Typography>
        {lesson.type === 'live' ? <ActionButton label="Join Live Session" startIcon={<ExitToAppOutlinedIcon fontSize="small" />} onClick={() => setPlaying(true)} /> : <ActionButton label={playing ? 'Playing' : 'Play lesson'} startIcon={<PlayCircleOutlineIcon fontSize="small" />} onClick={() => setPlaying(true)} disabled={playing} />}
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <ActionButton label={lesson.completed ? 'Completed' : 'Mark as complete'} variant={lesson.completed ? 'outlined' : 'contained'} disabled={lesson.completed} onClick={() => onComplete(lesson.id)} />
      </Stack>
    </Paper>
  )
}

const CourseViewPage: FC<{ selectedCourseId: number; onCourseChange: (courseId: number) => void; lessons: StudentLesson[]; onComplete: (lessonId: number) => void }> = ({ selectedCourseId, onCourseChange, lessons, onComplete }) => {
  const course = studentCourses.find((item) => item.id === selectedCourseId) ?? studentCourses[0]
  const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id)
  const [activeLessonId, setActiveLessonId] = useState(courseLessons[0]?.id ?? 0)
  const activeLesson = courseLessons.find((lesson) => lesson.id === activeLessonId) ?? courseLessons[0]
  const completedCount = courseLessons.filter((lesson) => lesson.completed).length

  return (
    <>
      <PageHeading title="Course View" description="Work through your modules, lessons, and live sessions." action={<FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 330 } }}><InputLabel>Course</InputLabel><Select label="Course" value={course.id} onChange={(event) => { const nextId = Number(event.target.value); onCourseChange(nextId); const nextLesson = lessons.find((lesson) => lesson.courseId === nextId); if (nextLesson) setActiveLessonId(nextLesson.id) }}>{studentCourses.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</Select></FormControl>} />
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box><Typography variant="h6">{course.title}</Typography><Typography variant="body2" color="text.secondary">{completedCount} of {courseLessons.length} lessons completed</Typography></Box>
          <Typography variant="h6" color="primary.main">{Math.round((completedCount / Math.max(courseLessons.length, 1)) * 100)}%</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={(completedCount / Math.max(courseLessons.length, 1)) * 100} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
      <Stack direction={{ xs: 'column', lg: 'row-reverse' }} spacing={3} alignItems="flex-start">
        <Box sx={{ flex: 1, width: '100%' }}>{activeLesson && <LessonPlayer key={activeLesson.id} lesson={activeLesson} onComplete={onComplete} />}</Box>
        <Box sx={{ width: { xs: '100%', lg: 390 } }}><ReadOnlyCourseOutline courseId={course.id} lessons={courseLessons} activeLessonId={activeLesson?.id ?? 0} onSelectLesson={setActiveLessonId} /></Box>
      </Stack>
    </>
  )
}

const QuizzesPage: FC = () => {
  const [quizzes, setQuizzes] = useState(studentQuizzes)
  const [notice, setNotice] = useState('')
  const startQuiz = (quizId: number) => {
    setQuizzes((current) => current.map((quiz) => quiz.id === quizId ? { ...quiz, status: 'Completed', score: 0 } : quiz))
    setNotice('Quiz started. Your attempt is ready to complete.')
  }
  const columns: DataColumn<StudentQuiz>[] = [
    { key: 'title', label: 'Quiz' },
    { key: 'courseId', label: 'Course', render: (value) => courseTitle(Number(value)) },
    { key: 'questions', label: 'Questions' },
    { key: 'dueDate', label: 'Due date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
    { key: 'score', label: 'Result', render: (value, row) => row.status === 'Completed' && value !== undefined ? `${value}%` : '—' },
  ]
  return (
    <>
      <PageHeading title="Quizzes & Results" description="Check upcoming assessments and review your completed results." />
      {notice && <Chip label={notice} color="info" sx={{ mb: 2 }} onDelete={() => setNotice('')} />}
      <AdminDataTable rows={quizzes} columns={columns} searchPlaceholder="Search quizzes" actions={(row) => row.status === 'Available' ? <ActionButton label="Start Quiz" size="small" onClick={() => startQuiz(row.id)} /> : <Typography variant="body2" color="text.secondary">Result saved</Typography>} />
      <Paper elevation={0} sx={{ p: 2.5, mt: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Recent attempts</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{quizAttempts.length} completed attempts belong to your account.</Typography>
        <Stack spacing={1}>
          {quizAttempts.map((attempt) => <Stack key={attempt.id} direction="row" justifyContent="space-between"><Typography variant="body2">{studentQuizzes.find((quiz) => quiz.id === attempt.quizId)?.title}</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{attempt.score}% · {attempt.completedAt}</Typography></Stack>)}
        </Stack>
      </Paper>
    </>
  )
}

const PurchasesPage: FC = () => {
  const [notice, setNotice] = useState('')
  const accessPurchase = (purchase: StudentPurchase) => setNotice(`${purchase.accessLabel} opened for ${purchase.title}.`)
  return (
    <>
      <PageHeading title="My Purchases" description="Access your bookstore items and standalone exams." />
      {notice && <Chip label={notice} color="success" sx={{ mb: 2 }} onDelete={() => setNotice('')} />}
      <Stack spacing={1.5}>
        {studentPurchases.map((purchase) => <Paper key={purchase.id} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}><Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', backgroundColor: 'action.hover' }}>{purchase.type === 'Book' ? <DownloadOutlinedIcon /> : <QuizOutlinedIcon />}</Box><Box sx={{ flex: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{purchase.title}</Typography><Typography variant="body2" color="text.secondary">{purchase.type} · Purchased {purchase.purchasedAt}</Typography></Box><ActionButton label={purchase.accessLabel} variant="outlined" startIcon={purchase.type === 'Book' ? <DownloadOutlinedIcon fontSize="small" /> : <ExitToAppOutlinedIcon fontSize="small" />} onClick={() => accessPurchase(purchase)} /></Stack></Paper>)}
      </Stack>
    </>
  )
}

const ProfilePaymentsPage: FC = () => {
  const columns: DataColumn<StudentPayment>[] = [
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return (
    <>
      <PageHeading title="Profile & Payment History" description="Manage your account details and review your purchases." />
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider', maxWidth: 720 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
          <AccountCircleOutlinedIcon sx={{ fontSize: 82, color: 'primary.main' }} />
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Typography variant="h6">Personal details</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Full name" value={loggedInStudent.name} InputProps={{ readOnly: true }} fullWidth /><TextField label="Email" value={loggedInStudent.email} InputProps={{ readOnly: true }} fullWidth /></Stack>
            <TextField label="Phone" value={loggedInStudent.phone} InputProps={{ readOnly: true }} fullWidth />
          </Stack>
        </Stack>
      </Paper>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Payment history</Typography>
      <AdminDataTable rows={studentPayments} columns={columns} searchPlaceholder="Search payments" />
    </>
  )
}

interface StudentDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const StudentDashboard: FC<StudentDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [section, setSection] = useState<DashboardSection>(sectionFromPath)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)
  const [language, setLanguage] = useState<'EN' | 'AM'>('EN')
  const [selectedCourseId, setSelectedCourseId] = useState(studentCourses[0].id)
  const [lessons, setLessons] = useState(studentLessons)

  const selectSection = (next: DashboardSection) => {
    setSection(next)
    setMobileOpen(false)
    const path = navigation.find((item) => item.key === next)?.path
    window.history.replaceState({}, '', next === 'enrollments' ? '/dashboard' : `/dashboard/${path}`)
  }

  const markComplete = (lessonId: number) => setLessons((current) => current.map((lesson) => lesson.id === lessonId ? { ...lesson, completed: true } : lesson))
  const pageTitle = navigation.find((item) => item.key === section)?.label ?? 'My Enrollments'
  const currentPage = useMemo(() => {
    switch (section) {
      case 'course-view': return <CourseViewPage selectedCourseId={selectedCourseId} onCourseChange={setSelectedCourseId} lessons={lessons} onComplete={markComplete} />
      case 'quizzes': return <QuizzesPage />
      case 'purchases': return <PurchasesPage />
      case 'profile-payments': return <ProfilePaymentsPage />
      default: return <MyEnrollmentsPage onContinue={(courseId) => { setSelectedCourseId(courseId); selectSection('course-view') }} />
    }
  }, [section, selectedCourseId, lessons])

  const sidebar = (
    <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5, cursor: 'pointer' }} onClick={() => selectSection('enrollments')}><Logo /></Box>
      <Divider />
      <Box component="nav" aria-label="Student navigation" sx={{ p: 1.5, flex: 1 }}>
        {navigation.map((item) => <Box key={item.key} component="button" type="button" onClick={() => selectSection(item.key)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5, backgroundColor: section === item.key ? 'primary.main' : 'transparent', color: section === item.key ? 'primary.contrastText' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: section === item.key ? 'primary.dark' : 'action.hover' } }}>{item.icon}<Typography variant="body2" sx={{ fontWeight: section === item.key ? 600 : 400 }}>{item.label}</Typography></Box>)}
      </Box>
      <Box sx={{ p: 2 }}><Paper elevation={0} sx={{ p: 1.5, backgroundColor: 'background.default' }}><Typography variant="body2" sx={{ fontWeight: 600 }}>{loggedInStudent.name}</Typography><Typography variant="caption" color="text.secondary">Learning workspace</Typography></Paper></Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}</Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
      <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
        <Box component="header" sx={{ minHeight: 72, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>{isMobile && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open student menu"><MenuIcon /></IconButton>}<Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Dashboard</Typography><ChevronRightIcon fontSize="small" color="disabled" sx={{ display: { xs: 'none', sm: 'block' } }} /><Typography variant="h6">{pageTitle}</Typography></Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Language"><IconButton onClick={(event) => setLanguageAnchor(event.currentTarget)} aria-label="Change language"><Typography variant="caption" sx={{ fontWeight: 700 }}>{language}</Typography></IconButton></Tooltip>
            <Tooltip title="New activity"><IconButton onClick={(event) => setNotificationAnchor(event.currentTarget)} aria-label="Open new activity"><NotificationsNoneOutlinedIcon /></IconButton></Tooltip>
            <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}><IconButton onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton></Tooltip>
            <Tooltip title="Student profile"><IconButton onClick={(event) => setProfileAnchor(event.currentTarget)} aria-label="Open student profile"><AccountCircleOutlinedIcon /></IconButton></Tooltip>
            <Menu anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}><MenuItem selected={language === 'EN'} onClick={() => { setLanguage('EN'); setLanguageAnchor(null) }}>English</MenuItem><MenuItem selected={language === 'AM'} onClick={() => { setLanguage('AM'); setLanguageAnchor(null) }}>አማርኛ</MenuItem></Menu>
            <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={() => setNotificationAnchor(null)}><MenuItem onClick={() => { setNotificationAnchor(null); selectSection('quizzes') }}>New quiz grade: 88%</MenuItem><MenuItem onClick={() => { setNotificationAnchor(null); selectSection('course-view') }}>New course announcement</MenuItem></Menu>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><MenuItem onClick={() => { setProfileAnchor(null); selectSection('profile-payments') }}><PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />My profile</MenuItem><MenuItem onClick={() => setProfileAnchor(null)}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Sign out</MenuItem></Menu>
          </Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440 }}>{currentPage}</Box>
      </Box>
    </Box>
  )
}

export default StudentDashboard
