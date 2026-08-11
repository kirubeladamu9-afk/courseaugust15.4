import { useEffect, useState, type FC, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Badge from '@mui/material/Badge'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import SchoolOutlined from '@mui/icons-material/SchoolOutlined'
import FamilyRestroomOutlined from '@mui/icons-material/FamilyRestroomOutlined'
import PlayLessonOutlined from '@mui/icons-material/PlayLessonOutlined'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined'
import CoPresentOutlined from '@mui/icons-material/CoPresentOutlined'
import AddTaskOutlined from '@mui/icons-material/AddTaskOutlined'
import QuizOutlined from '@mui/icons-material/QuizOutlined'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import KeyboardDoubleArrowLeft from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight'
import MenuRounded from '@mui/icons-material/MenuRounded'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import TranslateOutlined from '@mui/icons-material/TranslateOutlined'
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { useAuth } from '@/auth/auth-context'
import ThemeToggle from '@/components/theme-toggle'
import api from '@/lib/api'

interface StatCardProps {
  label: string
  value: string
  change: string
  icon: ReactNode
  tone: 'primary' | 'secondary' | 'success' | 'warning'
}

const toneStyles = {
  primary: { backgroundColor: 'primary.main', color: 'primary.contrastText' },
  secondary: { backgroundColor: 'secondary.main', color: 'text.primary' },
  success: { backgroundColor: 'rgba(50, 220, 136, 0.16)', color: '#32dc88' },
  warning: { backgroundColor: 'rgba(245, 184, 46, 0.18)', color: '#f5b82e' },
}

const StatCard: FC<StatCardProps> = ({ label, value, change, icon, tone }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
      <Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
        <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 30 }, mb: 0.5 }}>
          {value}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <ArrowUpwardRounded sx={{ fontSize: 15, color: 'primary.main' }} />
          <Typography variant="subtitle2" color="primary.main">
            {change}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            this month
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ ...toneStyles[tone], backgroundColor: 'background.paper', width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
    </Stack>
  </Paper>
)

const ChartGrid: FC = () => (
  <>
    {[25, 50, 75].map((position) => (
      <line key={position} x1="0" x2="100%" y1={position} y2={position} stroke="currentColor" strokeOpacity="0.12" />
    ))}
  </>
)

const chartPoints = (values: number[]) => {
  const max = Math.max(...values, 1)
  return values.map((value, index) => `${index * (600 / Math.max(values.length - 1, 1))},${205 - (value / max) * 170}`).join(' ')
}

const StudentGrowthChart: FC<{ values: number[] }> = ({ values }) => (
  <Box sx={{ height: 220, mt: 2 }}>
    <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Student growth chart">
      <g color="#127c71"><line x1="0" x2="600" y1="55" y2="55" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="110" y2="110" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="165" y2="165" stroke="currentColor" strokeOpacity="0.12" /><polyline points={chartPoints(values)} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
    <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.disabled', mt: -1, px: 0.5 }}>
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => <Typography key={month} variant="caption">{month}</Typography>)}
    </Stack>
  </Box>
)

const LearningActivityChart: FC<{ values: number[] }> = ({ values }) => (
  <Box sx={{ height: 220, mt: 2 }}>
    <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Learning activity chart">
      <g color="#f5b82e"><line x1="0" x2="600" y1="55" y2="55" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="110" y2="110" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="165" y2="165" stroke="currentColor" strokeOpacity="0.12" /><polyline points={chartPoints(values)} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
    <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.disabled', mt: -1, px: 0.5 }}>
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Typography key={day} variant="caption">{day}</Typography>)}
    </Stack>
  </Box>
)

interface FeedItemProps { title: string; detail: string; time: string; icon: ReactNode }
const FeedItem: FC<FeedItemProps> = ({ title, detail, time, icon }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5 }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', backgroundColor: 'background.paper', flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap>{detail}</Typography>
    </Box>
    <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>{time}</Typography>
  </Stack>
)

const QuickAction: FC<{ label: string; icon: ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
  <ButtonBase onClick={onClick} sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', p: 1.25, borderRadius: 2, textAlign: 'left', '&:hover': { backgroundColor: 'background.default' } }}>
    <Box sx={{ width: 34, height: 34, mr: 1.25, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', backgroundColor: 'background.paper' }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
  </ButtonBase>
)

interface AdminSidebarProps {
  mobileOpen: boolean
  collapsed: boolean
  onClose: () => void
}

const SidebarContent: FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState('User Management')
  const itemRoutes: Record<string, string> = {
    'User Accounts': '/admin/user-accounts',
    Students: '/admin/students',
    Teachers: '/admin/teachers',
    'Class & Teacher Assignments': '/admin/teacher-assignments',
    'Guardian List': '/admin/guardians',
    'Grade Levels': '/admin/grade-levels',
    'Classes & Sections': '/admin/classes-sections',
    Subjects: '/admin/subjects',
    Timetable: '/admin/timetable',
    'Grading Scale': '/admin/grading-scale',
    'Assessment Policy': '/admin/assessment-policy',
    'All Assessments': '/admin/all-assessments',
    'Result Approval': '/admin/result-approval',
    'Report Cards': '/admin/report-cards',
    Announcements: '/admin/announcements',
    'Messages / Notices': '/admin/messages-notices',
    'Enrollment Reports': '/admin/enrollment-reports',
    'Performance Trends': '/admin/performance-trends',
    'Custom / Export Reports': '/admin/custom-export-reports',
    'General Settings': '/admin/general-settings',
    'Academic Settings': '/admin/academic-settings',
    'System Settings': '/admin/system-settings',
  }
  const menuGroups = [
    { label: 'User Management', parent: 'All Users', icon: <ManageAccountsOutlined fontSize="small" />, items: ['User Accounts'] },
    { label: 'Students', parent: 'Students', icon: <PeopleAltOutlined fontSize="small" />, items: [] },
    { label: 'Teachers', parent: 'Teachers', icon: <SchoolOutlined fontSize="small" />, items: [] },
    { label: 'Parents / Guardians', parent: 'Guardian List', icon: <FamilyRestroomOutlined fontSize="small" />, items: [] },
    { label: 'Academic Structure', parent: 'Grade Levels', icon: <MenuBookOutlined fontSize="small" />, items: ['Classes & Sections', 'Subjects'] },
    { label: 'Scheduling', parent: 'Timetable', icon: <PlayLessonOutlined fontSize="small" />, items: [] },
    { label: 'Assessments', parent: 'All Assessments', icon: <QuizOutlined fontSize="small" />, items: [] },
    { label: 'Communication', parent: 'Announcements', icon: <NotificationsNoneOutlined fontSize="small" />, items: ['Messages / Notices'] },
    { label: 'Reports & Analytics', parent: 'Enrollment Reports', icon: <BarChartOutlined fontSize="small" />, items: ['Performance Trends', 'Custom / Export Reports'] },
    { label: 'Settings', parent: 'General Settings', icon: <SettingsOutlined fontSize="small" />, items: ['Academic Settings', 'User Accounts', 'System Settings'] },
  ]

  useEffect(() => {
    const activeGroup = menuGroups.find(({ parent, items }) => [parent, ...items].some((item) => itemRoutes[item] === location.pathname))
    if (activeGroup) setExpandedMenu(activeGroup.label)
  }, [location.pathname])

  const menuButtonSx = { justifyContent: 'flex-start', width: '100%', p: 1.1, borderRadius: 2, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const nestedButtonSx = { justifyContent: 'flex-start', width: '100%', py: 0.65, pl: 2.75, borderRadius: 1.5, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const activeMenuButtonSx = { backgroundColor: 'action.selected', color: 'primary.main', '&:hover': { backgroundColor: 'action.selected' } }

  return (
    <Box sx={{ width: 248, height: '100vh', boxSizing: 'border-box', p: 3, backgroundColor: 'background.paper', overflowY: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Logo />
        {onClose && <IconButton onClick={onClose} aria-label="Close navigation"><CloseRounded /></IconButton>}
      </Stack>
      <ButtonBase onClick={() => { navigate('/admin'); onClose?.() }} sx={{ ...menuButtonSx, color: 'primary.contrastText', backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.main' }, mb: 2 }}>
        <DashboardOutlined fontSize="small" sx={{ mr: 1.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Dashboard</Typography>
      </ButtonBase>
      <Stack spacing={2}>
        {menuGroups.map(({ label, parent, icon, items }) => {
          const isExpanded = expandedMenu === label
          return (
            <Box key={label}>
              <Typography variant="caption" color="text.disabled" sx={{ px: 1.25, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
              <ButtonBase onClick={() => { const route = itemRoutes[parent]; if (route) { navigate(route); onClose?.() } setExpandedMenu(isExpanded ? '' : label) }} sx={{ ...menuButtonSx, ...(itemRoutes[parent] === location.pathname ? activeMenuButtonSx : {}), mt: 0.5 }}>
                <Box sx={{ display: 'flex', mr: 1.25, color: 'primary.main' }}>{icon}</Box>
                <Typography variant="subtitle2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{parent}</Typography>
                {items.length > 0 && <Box sx={{ display: 'flex', ml: 'auto' }}>{isExpanded ? <ExpandLessRounded sx={{ fontSize: 17 }} /> : <ExpandMoreRounded sx={{ fontSize: 17 }} />}</Box>}
              </ButtonBase>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                  {items.map((item) => (
                    <ButtonBase key={item} onClick={() => { const route = itemRoutes[item]; if (route) navigate(route); onClose?.() }} sx={{ ...nestedButtonSx, ...(itemRoutes[item] === location.pathname ? activeMenuButtonSx : {}) }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>{item}</Typography>
                    </ButtonBase>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

const AdminSidebar: FC<AdminSidebarProps> = ({ mobileOpen, collapsed, onClose }) => (
  <>
    <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: (theme) => theme.zIndex.drawer, width: collapsed ? 0 : 248, overflow: 'hidden', transition: 'width 240ms ease', borderRight: collapsed ? 0 : 1, borderColor: 'divider' }}>
      <SidebarContent />
    </Box>
    <Drawer open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' } }}>
      <SidebarContent onClose={onClose} />
    </Drawer>
  </>
)

const AdminHeader: FC<{ onMenuClick: () => void; onToggleSidebar: () => void; sidebarCollapsed: boolean; title: string }> = ({ onMenuClick, onToggleSidebar, sidebarCollapsed, title }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const profileOpen = Boolean(profileAnchor)

  const handleProfileAction = async (item: string) => {
    setProfileAnchor(null)
    if (item === 'Profile') {
      navigate('/admin/profile')
    }
    if (item === 'Logout') {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <Paper
      component="header"
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        px: { xs: 1.5, md: 3 },
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 2 }} sx={{ minHeight: 48, position: 'relative' }}>
        <IconButton onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          {sidebarCollapsed ? <KeyboardDoubleArrowRight /> : <KeyboardDoubleArrowLeft />}
        </IconButton>
        <IconButton onClick={onMenuClick} aria-label="Open navigation" sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuRounded /></IconButton>
        <Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, whiteSpace: 'nowrap' }}>{title}</Typography>
        <Box
          sx={{
            ml: { xs: 'auto', sm: 2 },
            mr: 0,
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            width: '100%',
            maxWidth: 440,
            px: 1.5,
            borderRadius: 2,
            backgroundColor: 'background.default',
          }}
        >
          <SearchRounded sx={{ color: 'text.disabled', mr: 1 }} />
          <InputBase fullWidth placeholder="Search students, lessons, quizzes..." inputProps={{ 'aria-label': 'Search dashboard records' }} sx={{ py: 0.75, fontSize: '0.85rem' }} />
        </Box>
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.25, md: 1 }} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', flexShrink: 0, backgroundColor: 'background.paper' }}>
          <IconButton aria-label="Search" sx={{ display: { xs: 'inline-flex', sm: 'none' } }}><SearchRounded /></IconButton>
          <IconButton aria-label="Language" sx={{ display: { xs: 'none', md: 'inline-flex' } }}><TranslateOutlined /></IconButton>
          <ThemeToggle />
          <IconButton aria-label="Notifications">
            <Badge badgeContent={4} color="primary"><NotificationsNoneOutlined /></Badge>
          </IconButton>
          <IconButton aria-label="Open profile menu" onClick={(event) => setProfileAnchor(event.currentTarget)}>
            <AccountCircleOutlined color="primary" />
          </IconButton>
          <Menu anchorEl={profileAnchor} open={profileOpen} onClose={() => setProfileAnchor(null)}>
            {['Profile', 'Change Password', 'Settings', 'Logout'].map((item) => <MenuItem key={item} onClick={() => handleProfileAction(item)}>{item}</MenuItem>)}
          </Menu>
        </Stack>
      </Stack>
    </Paper>
  )
}

export const AdminPanelLayout: FC<{ children: ReactNode; title: string }> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar mobileOpen={mobileOpen} collapsed={sidebarCollapsed} onClose={() => setMobileOpen(false)} />
      <Box component="section" sx={{ minWidth: 0, flex: 1, ml: { xs: 0, md: sidebarCollapsed ? 0 : '248px' }, transition: 'margin-left 240ms ease' }}>
        <AdminHeader onMenuClick={() => setMobileOpen(true)} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} title={title} />
        {children}
      </Box>
    </Box>
  )
}

type DashboardActivity = { type: string; title: string; detail: string; date: string }
type DashboardNotification = { title: string; detail: string; date: string }
type DashboardData = { stats: { students: number; teachers: number; guardians: number; lessons: number }; trends: { studentGrowth: number[]; learningActivity: number[] }; activities: DashboardActivity[]; notifications: DashboardNotification[] }

const formatRelativeTime = (date: string) => {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

const AdminDashboard: FC = () => {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/api/admin/dashboard', { withCredentials: true }).then(({ data }) => setDashboard(data)).catch(() => setDashboard(null))
  }, [])

  const stats = dashboard?.stats
  const activities = dashboard?.activities || []
  const notifications = dashboard?.notifications || []

  return (
    <AdminPanelLayout title="Dashboard Overview">
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Admin</Typography>
          <Typography variant="subtitle2" color="primary.main">Dashboard</Typography>
        </Breadcrumbs>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 0.5 }}>Admin Dashboard</Typography>
            <Typography color="text.secondary">Welcome back, Admin. Here&apos;s what&apos;s happening today.</Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Students" value={stats ? stats.students.toLocaleString() : '—'} change="Live" tone="primary" icon={<PeopleAltOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Teachers" value={stats ? stats.teachers.toLocaleString() : '—'} change="Live" tone="secondary" icon={<SchoolOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Parents" value={stats ? stats.guardians.toLocaleString() : '—'} change="Live" tone="success" icon={<FamilyRestroomOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Lessons" value={stats ? stats.lessons.toLocaleString() : '—'} change="Live" tone="secondary" icon={<PlayLessonOutlined />} /></Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h5">Student Growth</Typography><Typography variant="subtitle2" color="text.secondary">New student registrations</Typography></Box><Typography variant="h5" color="primary.main">+18.6%</Typography></Stack>
              <StudentGrowthChart values={dashboard?.trends.studentGrowth || [0]} />
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5">Learning Activity</Typography><Typography variant="subtitle2" color="text.secondary">Lessons completed this week</Typography>
              <LearningActivityChart values={dashboard?.trends.learningActivity || [0]} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Recent Activities</Typography>
              {activities.length ? activities.slice(0, 3).map((activity, index) => <Box key={`${activity.title}-${activity.date}`}>{index > 0 && <Divider />}<FeedItem title={activity.title} detail={activity.detail} time={formatRelativeTime(activity.date)} icon={activity.type === 'student' ? <PersonAddAltOutlined fontSize="small" /> : activity.type === 'teacher' ? <CoPresentOutlined fontSize="small" /> : <AddTaskOutlined fontSize="small" />} /></Box>) : <Typography color="text.secondary" sx={{ py: 2 }}>No recent activity.</Typography>}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Recent Notifications</Typography>
              {notifications.length ? notifications.slice(0, 3).map((notification, index) => <Box key={`${notification.title}-${notification.date}`}>{index > 0 && <Divider />}<FeedItem title={notification.title} detail={notification.detail} time={formatRelativeTime(notification.date)} icon={<QuizOutlined fontSize="small" />} /></Box>) : <Typography color="text.secondary" sx={{ py: 2 }}>No recent notifications.</Typography>}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Quick Actions</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={3}><QuickAction label="Add Student" icon={<PersonAddAltOutlined fontSize="small" />} onClick={() => navigate('/admin/students/new')} /></Grid>
                <Grid item xs={12} sm={6} md={3}><QuickAction label="Add Teacher" icon={<CoPresentOutlined fontSize="small" />} onClick={() => navigate('/admin/teachers/new')} /></Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
    </Container>
  </AdminPanelLayout>
  )
}

export default AdminDashboard
