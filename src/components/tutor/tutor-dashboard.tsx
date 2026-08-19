import { useMemo, useState, type FC, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
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
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined'
import { Logo } from '@/components/logo'
import AdminDataTable, { type DataColumn } from '@/components/admin/admin-data-table'
import ModuleLessonEditor from '@/components/admin/module-lesson-editor'
import { loggedInTutor, tutorAnnouncements, tutorCourses, tutorEnrollments, tutorSubmissions, type TutorAnnouncement, type TutorEnrollment, type TutorSubmission } from './tutor-data'

const drawerWidth = 272

type TutorSection = 'classes' | 'builder' | 'grading' | 'messages' | 'profile'

const navigation: Array<{ key: TutorSection; label: string; icon: ReactNode }> = [
  { key: 'classes', label: 'My Classes', icon: <SchoolOutlinedIcon /> },
  { key: 'builder', label: 'Course Builder', icon: <ViewModuleOutlinedIcon /> },
  { key: 'grading', label: 'Grading', icon: <AssignmentTurnedInOutlinedIcon /> },
  { key: 'messages', label: 'Messages & Announcements', icon: <CampaignOutlinedIcon /> },
  { key: 'profile', label: 'Profile', icon: <PersonOutlineIcon /> },
]

const sectionFromPath = (): TutorSection => {
  const section = window.location.pathname.split('/')[2]
  return navigation.some((item) => item.key === section) ? section as TutorSection : 'classes'
}

const statusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
  if (['Present', 'Graded'].includes(status)) return 'success'
  if (status === 'Pending') return 'warning'
  if (status === 'Absent') return 'default'
  return 'info'
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

const ActionButton: FC<{ label: string; onClick?: () => void; size?: 'small' | 'medium'; variant?: 'contained' | 'outlined' | 'text'; disabled?: boolean }> = ({ label, onClick, size = 'medium', variant = 'contained', disabled = false }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main',
      borderRadius: 6,
      px: size === 'small' ? 1.25 : 2,
      py: size === 'small' ? 0.5 : 1,
      backgroundColor: variant === 'contained' ? 'primary.main' : 'transparent',
      color: variant === 'text' ? 'primary.main' : variant === 'contained' ? 'primary.contrastText' : 'primary.main',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit',
      fontSize: size === 'small' ? 12 : 14,
      opacity: disabled ? 0.55 : 1,
      '&:hover': disabled ? undefined : { backgroundColor: variant === 'contained' ? 'primary.dark' : 'action.hover' },
    }}
  >
    {label}
  </Box>
)

const MyClassesPage: FC = () => {
  const [courseId, setCourseId] = useState(tutorCourses[0].id)
  const [enrollments, setEnrollments] = useState(tutorEnrollments)
  const currentCourse = tutorCourses.find((course) => course.id === courseId) ?? tutorCourses[0]
  const rows = enrollments.filter((enrollment) => enrollment.courseId === courseId)
  const columns: DataColumn<TutorEnrollment>[] = [
    { key: 'student', label: 'Student' },
    { key: 'email', label: 'Email' },
    { key: 'progress', label: 'Progress' },
    { key: 'attendance', label: 'Attendance', render: (value) => <StatusChip status={String(value)} /> },
  ]

  const toggleAttendance = (id: number) => setEnrollments((current) => current.map((enrollment) => enrollment.id === id ? { ...enrollment, attendance: enrollment.attendance === 'Present' ? 'Absent' : 'Present' } : enrollment))

  return (
    <>
      <PageHeading title="My Classes" description="Review your class roster and record attendance for today’s session." />
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h6">{currentCourse.title}</Typography>
            <Typography variant="body2" color="text.secondary">{currentCourse.students} enrolled students · {currentCourse.modules.length} modules</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 300 } }}>
            <InputLabel>Class</InputLabel>
            <Select label="Class" value={courseId} onChange={(event) => setCourseId(Number(event.target.value))}>
              {tutorCourses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      <AdminDataTable rows={rows} columns={columns} searchPlaceholder="Search students" actions={(row) => <ActionButton label={row.attendance === 'Present' ? 'Mark absent' : 'Mark present'} size="small" variant="outlined" onClick={() => toggleAttendance(row.id)} />} />
    </>
  )
}

const CourseBuilderPage: FC = () => {
  const [courseRows, setCourseRows] = useState(tutorCourses)
  const [courseId, setCourseId] = useState(tutorCourses[0].id)
  const currentCourse = courseRows.find((course) => course.id === courseId) ?? courseRows[0]

  return (
    <>
      <PageHeading title="Course Builder" description="Organize modules and lessons for the classes assigned to you." />
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 360 } }}>
        <InputLabel>Assigned course</InputLabel>
        <Select label="Assigned course" value={courseId} onChange={(event) => setCourseId(Number(event.target.value))}>
          {courseRows.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}
        </Select>
      </FormControl>
      {currentCourse && <ModuleLessonEditor course={currentCourse} onChange={(next) => setCourseRows((rows) => rows.map((course) => course.id === next.id ? next : course))} />}
    </>
  )
}

const GradingPage: FC = () => {
  const [submissions, setSubmissions] = useState(tutorSubmissions)
  const [notice, setNotice] = useState('')
  const courseName = (courseId: number) => tutorCourses.find((course) => course.id === courseId)?.title ?? ''
  const columns: DataColumn<TutorSubmission>[] = [
    { key: 'student', label: 'Student' },
    { key: 'courseId', label: 'Course', render: (value) => courseName(Number(value)) },
    { key: 'assessment', label: 'Assessment' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]

  const updateScore = (id: number, score: string) => setSubmissions((current) => current.map((submission) => submission.id === id ? { ...submission, score } : submission))
  const saveGrade = (id: number) => {
    setSubmissions((current) => current.map((submission) => submission.id === id && submission.score ? { ...submission, status: 'Graded' } : submission))
    setNotice('Grade saved.')
  }

  return (
    <>
      <PageHeading title="Grading" description="Review assessment submissions and publish student scores." />
      {notice && <Chip label={notice} color="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2 }} onDelete={() => setNotice('')} />}
      <AdminDataTable rows={submissions} columns={columns} searchPlaceholder="Search submissions" actions={(row) => (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <TextField value={row.score} onChange={(event) => updateScore(row.id, event.target.value.replace(/[^0-9]/g, ''))} size="small" placeholder="Score" inputProps={{ 'aria-label': `Score for ${row.student}`, inputMode: 'numeric', maxLength: 3 }} sx={{ width: 82 }} />
          <ActionButton label={row.status === 'Graded' ? 'Update' : 'Save grade'} size="small" onClick={() => saveGrade(row.id)} disabled={!row.score} />
        </Stack>
      )} />
    </>
  )
}

const MessagesPage: FC = () => {
  const [announcements, setAnnouncements] = useState(tutorAnnouncements)
  const [courseId, setCourseId] = useState(tutorCourses[0].id)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const publish = () => {
    if (!title.trim() || !message.trim()) return
    setAnnouncements((current) => [{ id: Date.now(), courseId, title: title.trim(), message: message.trim(), published: 'Just now' }, ...current])
    setTitle('')
    setMessage('')
  }

  return (
    <>
      <PageHeading title="Messages & Announcements" description="Keep learners informed with clear updates for each class." />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', width: { xs: '100%', lg: 410 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Post an announcement</Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Class</InputLabel>
              <Select label="Class" value={courseId} onChange={(event) => setCourseId(Number(event.target.value))}>
                {tutorCourses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Subject" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />
            <TextField label="Message" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={5} fullWidth />
            <ActionButton label="Post announcement" onClick={publish} disabled={!title.trim() || !message.trim()} />
          </Stack>
        </Paper>
        <Stack spacing={1.5} sx={{ width: '100%' }}>
          {announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}
        </Stack>
      </Stack>
    </>
  )
}

const AnnouncementCard: FC<{ announcement: TutorAnnouncement }> = ({ announcement }) => {
  const course = tutorCourses.find((item) => item.id === announcement.courseId)
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: 'primary.main', pt: 0.25 }}><AnnouncementOutlinedIcon /></Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5} sx={{ mb: 0.75 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{announcement.title}</Typography>
            <Typography variant="body2" color="text.secondary">{announcement.published}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>{announcement.message}</Typography>
          <Chip label={course?.title} size="small" variant="outlined" />
        </Box>
      </Stack>
    </Paper>
  )
}

const ProfilePage: FC = () => (
  <>
    <PageHeading title="Profile" description="Your tutor account and teaching details." />
    <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', maxWidth: 680 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
        <AccountCircleOutlinedIcon sx={{ fontSize: 88, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>{loggedInTutor.name}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{loggedInTutor.specialty}</Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2"><Box component="span" sx={{ color: 'text.secondary' }}>Email: </Box>{loggedInTutor.email}</Typography>
            <Typography variant="body2"><Box component="span" sx={{ color: 'text.secondary' }}>Assigned courses: </Box>{tutorCourses.length}</Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  </>
)

interface TutorDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const TutorDashboard: FC<TutorDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [section, setSection] = useState<TutorSection>(sectionFromPath)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)

  const selectSection = (next: TutorSection) => {
    setSection(next)
    setMobileOpen(false)
    window.history.replaceState({}, '', next === 'classes' ? '/tutor' : `/tutor/${next}`)
  }

  const pageTitle = navigation.find((item) => item.key === section)?.label ?? 'My Classes'
  const currentPage = useMemo(() => {
    switch (section) {
      case 'builder': return <CourseBuilderPage />
      case 'grading': return <GradingPage />
      case 'messages': return <MessagesPage />
      case 'profile': return <ProfilePage />
      default: return <MyClassesPage />
    }
  }, [section])

  const sidebar = (
    <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5, cursor: 'pointer' }} onClick={() => selectSection('classes')}><Logo /></Box>
      <Divider />
      <Box component="nav" aria-label="Tutor navigation" sx={{ p: 1.5, flex: 1 }}>
        {navigation.map((item) => (
          <Box
            key={item.key}
            component="button"
            type="button"
            onClick={() => selectSection(item.key)}
            sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5, backgroundColor: section === item.key ? 'primary.main' : 'transparent', color: section === item.key ? 'primary.contrastText' : 'text.secondary', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: section === item.key ? 'primary.dark' : 'action.hover' } }}
          >
            {item.icon}<Typography variant="body2" sx={{ fontWeight: section === item.key ? 600 : 400 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2 }}>
        <Paper elevation={0} sx={{ p: 1.5, backgroundColor: 'background.default' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{loggedInTutor.name}</Typography>
          <Typography variant="caption" color="text.secondary">Tutor workspace</Typography>
        </Paper>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}</Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
      <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
        <Box component="header" sx={{ minHeight: 72, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open tutor menu"><MenuIcon /></IconButton>}
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Tutor</Typography>
            <ChevronRightIcon fontSize="small" color="disabled" sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="h6">{pageTitle}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Language"><IconButton onClick={(event) => setLanguageAnchor(event.currentTarget)} aria-label="Change language"><Typography variant="caption" sx={{ fontWeight: 700 }}>EN</Typography></IconButton></Tooltip>
            <Tooltip title="New activity"><IconButton onClick={(event) => setNotificationAnchor(event.currentTarget)} aria-label="Open new activity"><NotificationsNoneOutlinedIcon /></IconButton></Tooltip>
            <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}><IconButton onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton></Tooltip>
            <Tooltip title="Tutor profile"><IconButton onClick={(event) => setProfileAnchor(event.currentTarget)} aria-label="Open tutor profile"><AccountCircleOutlinedIcon /></IconButton></Tooltip>
            <Menu anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}><MenuItem selected>English</MenuItem><MenuItem onClick={() => setLanguageAnchor(null)}>Spanish</MenuItem></Menu>
            <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={() => setNotificationAnchor(null)}><MenuItem onClick={() => { setNotificationAnchor(null); selectSection('grading') }}>2 new submissions to grade</MenuItem><MenuItem onClick={() => { setNotificationAnchor(null); selectSection('messages') }}>1 student message received</MenuItem></Menu>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><MenuItem onClick={() => { setProfileAnchor(null); selectSection('profile') }}><PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />My profile</MenuItem><MenuItem onClick={() => setProfileAnchor(null)}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Sign out</MenuItem></Menu>
          </Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440 }}>{currentPage}</Box>
      </Box>
    </Box>
  )
}

export default TutorDashboard
