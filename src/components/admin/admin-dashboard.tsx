import type { FC, ReactNode } from 'react'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import ButtonBase from '@mui/material/ButtonBase'
import Container from '@mui/material/Container'
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
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined'
import CoPresentOutlined from '@mui/icons-material/CoPresentOutlined'
import AddTaskOutlined from '@mui/icons-material/AddTaskOutlined'
import QuizOutlined from '@mui/icons-material/QuizOutlined'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import { Header } from '@/components/header'

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
  success: { backgroundColor: '#e4f7ef', color: '#127c71' },
  warning: { backgroundColor: '#fff3d7', color: '#936b00' },
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
      <Box sx={{ ...toneStyles[tone], width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

const StudentGrowthChart: FC = () => (
  <Box sx={{ height: 220, mt: 2 }}>
    <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Student growth chart">
      <g color="#127c71"><line x1="0" x2="600" y1="55" y2="55" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="110" y2="110" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="165" y2="165" stroke="currentColor" strokeOpacity="0.12" /><path d="M0 178 C55 164, 75 145, 125 153 S195 130, 250 140 S315 94, 365 115 S430 70, 485 88 S550 44, 600 56 L600 220 L0 220 Z" fill="currentColor" fillOpacity="0.1" /><path d="M0 178 C55 164, 75 145, 125 153 S195 130, 250 140 S315 94, 365 115 S430 70, 485 88 S550 44, 600 56" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></g>
    </svg>
    <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.disabled', mt: -1, px: 0.5 }}>
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => <Typography key={month} variant="caption">{month}</Typography>)}
    </Stack>
  </Box>
)

const LearningActivityChart: FC = () => (
  <Box sx={{ height: 220, mt: 2 }}>
    <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Learning activity chart">
      <g color="#f5b82e"><line x1="0" x2="600" y1="55" y2="55" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="110" y2="110" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="165" y2="165" stroke="currentColor" strokeOpacity="0.12" /><path d="M0 158 C62 145, 78 95, 130 116 S200 162, 255 108 S320 130, 370 78 S430 112, 480 90 S550 145, 600 62" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></g>
    </svg>
    <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.disabled', mt: -1, px: 0.5 }}>
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Typography key={day} variant="caption">{day}</Typography>)}
    </Stack>
  </Box>
)

interface FeedItemProps { title: string; detail: string; time: string; icon: ReactNode }
const FeedItem: FC<FeedItemProps> = ({ title, detail, time, icon }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5 }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', backgroundColor: 'secondary.main', flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap>{detail}</Typography>
    </Box>
    <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>{time}</Typography>
  </Stack>
)

const QuickAction: FC<{ label: string; icon: ReactNode }> = ({ label, icon }) => (
  <ButtonBase sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', p: 1.25, borderRadius: 2, textAlign: 'left', '&:hover': { backgroundColor: 'background.default' } }}>
    <Box sx={{ width: 34, height: 34, mr: 1.25, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', backgroundColor: 'secondary.main' }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
  </ButtonBase>
)

const AdminDashboard: FC = () => {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Header />
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
          <Typography variant="subtitle2" color="text.secondary">Tuesday, July 16, 2024</Typography>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Students" value="2,480" change="12.5%" tone="primary" icon={<PeopleAltOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Teachers" value="186" change="8.2%" tone="secondary" icon={<SchoolOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Parents" value="1,920" change="6.4%" tone="success" icon={<FamilyRestroomOutlined />} /></Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}><StatCard label="Total Lessons" value="864" change="10.8%" tone="secondary" icon={<PlayLessonOutlined />} /></Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h5">Student Growth</Typography><Typography variant="subtitle2" color="text.secondary">New student registrations</Typography></Box><Typography variant="h5" color="primary.main">+18.6%</Typography></Stack>
              <StudentGrowthChart />
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5">Learning Activity</Typography><Typography variant="subtitle2" color="text.secondary">Lessons completed this week</Typography>
              <LearningActivityChart />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Recent Activities</Typography>
              <FeedItem title="New student registered" detail="Ava Johnson joined Grade 8" time="8m ago" icon={<PersonAddAltOutlined fontSize="small" />} />
              <Divider /><FeedItem title="Lesson published" detail="Introduction to Algebra" time="34m ago" icon={<AddTaskOutlined fontSize="small" />} />
              <Divider /><FeedItem title="Teacher profile updated" detail="Maria Garcia updated her bio" time="1h ago" icon={<CoPresentOutlined fontSize="small" />} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Recent Notifications</Typography>
              <FeedItem title="Quiz results are ready" detail="Science quiz results need review" time="12m ago" icon={<QuizOutlined fontSize="small" />} />
              <Divider /><FeedItem title="Parent meeting reminder" detail="8 meetings scheduled tomorrow" time="2h ago" icon={<NotificationsNoneOutlined fontSize="small" />} />
              <Divider /><FeedItem title="Monthly report available" detail="Your June performance report" time="Yesterday" icon={<InsightsOutlined fontSize="small" />} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Quick Actions</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={2.4}><QuickAction label="Add Student" icon={<PersonAddAltOutlined fontSize="small" />} /></Grid>
                <Grid item xs={12} sm={6} md={2.4}><QuickAction label="Add Teacher" icon={<CoPresentOutlined fontSize="small" />} /></Grid>
                <Grid item xs={12} sm={6} md={2.4}><QuickAction label="Create Lesson" icon={<AddTaskOutlined fontSize="small" />} /></Grid>
                <Grid item xs={12} sm={6} md={2.4}><QuickAction label="Create Quiz" icon={<QuizOutlined fontSize="small" />} /></Grid>
                <Grid item xs={12} sm={6} md={2.4}><QuickAction label="Send Notification" icon={<NotificationsNoneOutlined fontSize="small" />} /></Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default AdminDashboard
