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
import Switch from '@mui/material/Switch'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { Logo } from '@/components/logo'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import ModuleLessonEditor from './module-lesson-editor'
import { courses, payments, registrations, tutors, users, type Registration } from './admin-data'

const drawerWidth = 272

type Section = 'overview' | 'courses' | 'registrations' | 'tutors' | 'blog' | 'payments' | 'users'

const navigation: Array<{ key: Section; label: string; icon: ReactNode }> = [
  { key: 'overview', label: 'Overview', icon: <DashboardOutlinedIcon /> },
  { key: 'courses', label: 'Programs & Courses', icon: <SchoolOutlinedIcon /> },
  { key: 'registrations', label: 'Registrations', icon: <PeopleOutlineIcon /> },
  { key: 'tutors', label: 'Tutors', icon: <PersonOutlineIcon /> },
  { key: 'blog', label: 'Bookstore & Blog', icon: <BookOutlinedIcon /> },
  { key: 'payments', label: 'Payments & Reports', icon: <PaymentsOutlinedIcon /> },
  { key: 'users', label: 'Users', icon: <GroupOutlinedIcon /> },
]

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (['Published', 'Approved', 'Active', 'Paid'].includes(status)) return 'success'
  if (['Pending', 'Draft', 'Waitlisted'].includes(status)) return 'warning'
  if (['Rejected', 'Suspended', 'Refunded'].includes(status)) return 'error'
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

const StatCard: FC<{ label: string; value: string; detail: string; icon: ReactNode }> = ({ label, value, detail, icon }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 200 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
    </Box>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{value}</Typography>
    <Typography color="text.secondary" variant="body2">{detail}</Typography>
  </Paper>
)

const DashboardCharts: FC = () => {
  const theme = useTheme()
  const revenuePoints = '20,148 110,132 200,144 290,96 380,112 470,70 560,84'
  const enrollments = [56, 80, 44, 92, 68]
  const courseLabels = ['Data', 'Docker', 'React', 'Design', 'Mobile']

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Revenue overview</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Monthly revenue performance</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Revenue trend chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          <polyline points={revenuePoints} fill="none" stroke={theme.palette.primary.main} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {revenuePoints.split(' ').map((point) => {
            const [cx, cy] = point.split(',')
            return <circle key={point} cx={cx} cy={cy} r="5" fill={theme.palette.background.paper} stroke={theme.palette.primary.main} strokeWidth="3" />
          })}
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((label, index) => <text key={label} x={20 + index * 90} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{label}</text>)}
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Course enrollments</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Students enrolled by category</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Course enrollment chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          {enrollments.map((value, index) => {
            const height = value * 1.25
            const x = 45 + index * 105
            return <g key={courseLabels[index]}><rect x={x} y={160 - height} width="48" height={height} rx="5" fill={index % 2 ? theme.palette.secondary.main : theme.palette.primary.main} /><text x={x + 24} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{courseLabels[index]}</text></g>
          })}
        </Box>
      </Paper>
    </Stack>
  )
}

const OverviewPage: FC = () => (
  <>
    <PageHeading title="Dashboard overview" description="A snapshot of your learning platform." />
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <StatCard label="Total revenue" value="$24,680" detail="12.5% from last month" icon={<PaymentsOutlinedIcon />} />
      <StatCard label="Active students" value="1,284" detail="8.2% from last month" icon={<GroupOutlinedIcon />} />
      <StatCard label="Published courses" value="48" detail="6 courses in draft" icon={<SchoolOutlinedIcon />} />
      <StatCard label="Active tutors" value="32" detail="4 pending approvals" icon={<PersonOutlineIcon />} />
    </Stack>
    <DashboardCharts />
  </>
)

const CoursesPage: FC = () => {
  const [courseRows, setCourseRows] = useState(courses)
  const [selectedId, setSelectedId] = useState(courses[0].id)
  const selectedCourse = courseRows.find((course) => course.id === selectedId) ?? courseRows[0]
  const tutorOptions = ['Maya Chen', 'Leon Kennedy', 'Jhon Dwirian', 'Rizki Known']

  return (
    <>
      <PageHeading title="Programs & Courses" description="Manage your catalog, tutors, and learning content." action={<Button label="New course" />} />
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        {courseRows.map((course) => (
          <Box key={course.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 240, cursor: 'pointer' }} onClick={() => setSelectedId(course.id)}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{course.title}</Typography>
              <Typography variant="body2" color="text.secondary">{course.category} · {course.students} students · ${course.price}</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Tutor</InputLabel>
              <Select
                label="Tutor"
                value={course.tutor}
                onChange={(event) => setCourseRows((rows) => rows.map((row) => row.id === course.id ? { ...row, tutor: event.target.value } : row))}
              >
                {tutorOptions.map((tutor) => <MenuItem key={tutor} value={tutor}>{tutor}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" alignItems="center" spacing={1}>
              <StatusChip status={course.status} />
              <Switch
                checked={course.status === 'Published'}
                onChange={() => setCourseRows((rows) => rows.map((row) => row.id === course.id ? { ...row, status: row.status === 'Published' ? 'Draft' : 'Published' } : row))}
                inputProps={{ 'aria-label': `Publish ${course.title}` }}
              />
            </Stack>
          </Box>
        ))}
      </Paper>
      {selectedCourse && <ModuleLessonEditor course={selectedCourse} onChange={(next) => setCourseRows((rows) => rows.map((row) => row.id === next.id ? next : row))} showAddModule />}
    </>
  )
}

const RegistrationsPage: FC = () => {
  const [rows, setRows] = useState(registrations)
  const columns: DataColumn<Registration>[] = [
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Course' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  const updateStatus = (id: number, status: Registration['status']) => setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row))

  return (
    <>
      <PageHeading title="Registrations" description="Review and manage incoming course registrations." />
      <AdminDataTable rows={rows} columns={columns} searchPlaceholder="Search registrations" actions={(row) => (
        <Stack direction="row" spacing={0.5}>
          <Button label="Approve" size="small" onClick={() => updateStatus(row.id, 'Approved')} />
          <Button label="Waitlist" size="small" variant="outlined" onClick={() => updateStatus(row.id, 'Waitlisted')} />
          <Button label="Reject" size="small" variant="text" onClick={() => updateStatus(row.id, 'Rejected')} />
        </Stack>
      )} />
    </>
  )
}

const TutorsPage: FC = () => {
  const columns: DataColumn<(typeof tutors)[number]>[] = [
    { key: 'name', label: 'Tutor' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'courses', label: 'Courses' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return <><PageHeading title="Tutors" description="Manage instructors and their course assignments." action={<Button label="Invite tutor" />} /><AdminDataTable rows={tutors} columns={columns} searchPlaceholder="Search tutors" /></>
}

const PaymentsPage: FC = () => {
  const columns: DataColumn<(typeof payments)[number]>[] = [
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Course' },
    { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return (
    <>
      <PageHeading title="Payments & Reports" description="Track platform revenue and payment activity." />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <StatCard label="Total revenue" value="$24,680" detail="All-time collected" icon={<PaymentsOutlinedIcon />} />
        <StatCard label="Pending payments" value="$1,240" detail="12 transactions" icon={<AssessmentOutlinedIcon />} />
        <StatCard label="This month" value="$4,860" detail="18.4% increase" icon={<AssessmentOutlinedIcon />} />
      </Stack>
      <AdminDataTable rows={payments} columns={columns} searchPlaceholder="Search payments" />
    </>
  )
}

const UsersPage: FC = () => {
  const columns: DataColumn<(typeof users)[number]>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'joined', label: 'Joined' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return <><PageHeading title="Users" description="Manage learners, tutors, and administrator accounts." action={<Button label="Add user" />} /><AdminDataTable rows={users} columns={columns} searchPlaceholder="Search users" /></>
}

const SimplePage: FC<{ title: string; description: string; icon: ReactNode }> = ({ title, description, icon }) => (
  <>
    <PageHeading title={title} description={description} />
    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: 1, borderColor: 'divider' }}>
      <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
      <Typography variant="h6">Content workspace</Typography>
      <Typography color="text.secondary">This area is ready for bookstore and blog content management.</Typography>
    </Paper>
  </>
)

const Button: FC<{ label: string; onClick?: () => void; size?: 'small' | 'medium'; variant?: 'contained' | 'outlined' | 'text' }> = ({ label, onClick, size = 'medium', variant = 'contained' }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main',
      borderRadius: 6,
      px: size === 'small' ? 1.25 : 2,
      py: size === 'small' ? 0.5 : 1,
      backgroundColor: variant === 'contained' ? 'primary.main' : 'transparent',
      color: variant === 'text' ? 'primary.main' : variant === 'contained' ? 'primary.contrastText' : 'primary.main',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: size === 'small' ? 12 : 14,
      '&:hover': { backgroundColor: variant === 'contained' ? 'primary.dark' : 'action.hover' },
    }}
  >
    {label}
  </Box>
)

interface AdminDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const AdminDashboard: FC<AdminDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)

  const selectSection = (next: Section) => {
    setSection(next)
    setMobileOpen(false)
    window.history.replaceState({}, '', next === 'overview' ? '/admin' : `/admin/${next}`)
  }

  const currentPage = useMemo(() => {
    switch (section) {
      case 'courses': return <CoursesPage />
      case 'registrations': return <RegistrationsPage />
      case 'tutors': return <TutorsPage />
      case 'blog': return <SimplePage title="Bookstore & Blog" description="Manage books, articles, and publishing content." icon={<BookOutlinedIcon fontSize="large" />} />
      case 'payments': return <PaymentsPage />
      case 'users': return <UsersPage />
      default: return <OverviewPage />
    }
  }, [section])

  const sidebar = (
    <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5 }}><Logo /></Box>
      <Divider />
      <Box component="nav" sx={{ p: 1.5, flex: 1 }}>
        {navigation.map((item) => (
          <Box
            key={item.key}
            component="button"
            onClick={() => selectSection(item.key)}
            sx={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5,
              backgroundColor: section === item.key ? 'primary.main' : 'transparent', color: section === item.key ? 'primary.contrastText' : 'text.secondary',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: section === item.key ? 'primary.dark' : 'action.hover' },
            }}
          >
            {item.icon}<Typography variant="body2" sx={{ fontWeight: section === item.key ? 600 : 400 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: 'background.default', borderRadius: 2 }}><SettingsOutlinedIcon color="disabled" fontSize="small" /><Typography variant="body2" color="text.secondary">Settings</Typography></Box></Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}</Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
      <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
        <Box component="header" sx={{ height: 72, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open admin menu"><MenuIcon /></IconButton>}
            <Typography variant="h5" sx={{ display: { xs: 'none', sm: 'block' } }}>Admin workspace</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                {darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Admin profile">
              <IconButton onClick={(event) => setProfileAnchor(event.currentTarget)} aria-label="Open admin profile">
                <AccountCircleOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
              <MenuItem onClick={() => setProfileAnchor(null)}><PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />Admin profile</MenuItem>
              <MenuItem onClick={() => setProfileAnchor(null)}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Sign out</MenuItem>
            </Menu>
          </Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440 }}>{currentPage}</Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
