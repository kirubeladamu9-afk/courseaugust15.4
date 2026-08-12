import { useEffect, useMemo, useState, type FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import LinearProgress from '@mui/material/LinearProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import DownloadOutlined from '@mui/icons-material/DownloadOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import MenuRounded from '@mui/icons-material/MenuRounded'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import CampaignOutlined from '@mui/icons-material/CampaignOutlined'
import PlayCircleOutlineRounded from '@mui/icons-material/PlayCircleOutlineRounded'
import { Logo } from '@/components/logo'
import ThemeToggle from '@/components/theme-toggle'
import { useAuth } from '@/auth/auth-context'
import api from '@/lib/api'

const portalItems = [
  { label: 'Dashboard', path: '/student', icon: <DashboardOutlined fontSize="small" /> },
  { label: 'My Profile', path: '/student/profile', icon: <PersonOutlineRounded fontSize="small" /> },
  { label: 'Timetable', path: '/student/timetable', icon: <ScheduleOutlined fontSize="small" /> },
  { label: 'Materials', path: '/student/materials', icon: <FolderOutlined fontSize="small" /> },
  { label: 'Assessments', path: '/student/assessments', icon: <AssessmentOutlined fontSize="small" /> },
  { label: 'Announcements', path: '/student/announcements', icon: <CampaignOutlined fontSize="small" /> },
]

const pageDetails: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Student Dashboard', description: 'Keep track of today’s learning, assessments, and school updates.' },
  profile: { title: 'My Profile', description: 'Your school record and guardian information.' },
  timetable: { title: 'My Timetable', description: 'Your Grade 8 · Section A weekly schedule.' },
  materials: { title: 'Learning Materials', description: 'Resources shared for your class and subjects.' },
  assessments: { title: 'Assessments & Results', description: 'Complete active assessments and review your learning progress.' },
  announcements: { title: 'Announcements', description: 'School and class notices, newest first.' },
  settings: { title: 'Profile Settings', description: 'Update your contact details and password.' },
}

const schedule = [
  ['Monday', '08:00', 'Mathematics', 'Mr. Daniel', 'Room 12'], ['Monday', '10:00', 'English Language', 'Ms. Hana', 'Room 8'],
  ['Tuesday', '08:00', 'Science', 'Mrs. Rahel', 'Lab 2'], ['Tuesday', '11:00', 'Social Studies', 'Mr. Tesfaye', 'Room 14'],
  ['Wednesday', '09:00', 'Mathematics', 'Mr. Daniel', 'Room 12'], ['Wednesday', '13:00', 'Computer Science', 'Ms. Eden', 'Lab 1'],
  ['Thursday', '08:00', 'English Language', 'Ms. Hana', 'Room 8'], ['Thursday', '11:00', 'Science', 'Mrs. Rahel', 'Lab 2'],
  ['Friday', '09:00', 'Social Studies', 'Mr. Tesfaye', 'Room 14'], ['Friday', '13:00', 'Physical Education', 'Mr. Bekele', 'Field'],
]

const materials = [
  { title: 'Linear Equations Practice', subject: 'Mathematics', teacher: 'Mr. Daniel', date: 'May 16, 2025', type: 'PDF' },
  { title: 'Forces and Motion Notes', subject: 'Science', teacher: 'Mrs. Rahel', date: 'May 14, 2025', type: 'PDF' },
  { title: 'Reading Comprehension Pack', subject: 'English Language', teacher: 'Ms. Hana', date: 'May 10, 2025', type: 'DOCX' },
]

const announcements = [
  { title: 'Science fair registration is open', body: 'Students interested in presenting a project can register with their science teacher by Friday, May 23.', date: 'Today', scope: 'School-wide' },
  { title: 'Mathematics revision session', body: 'An optional revision session will be held after school on Thursday in Room 12.', date: 'Yesterday', scope: 'Grade 8 · Section A' },
  { title: 'Library hours updated', body: 'The library will remain open until 5:00 PM on weekdays during the assessment period.', date: 'May 15', scope: 'School-wide' },
]

const assessments = [
  { id: 'sample-assessment', title: 'Linear Equations Quiz', subject: 'Mathematics', type: 'Quiz', window: 'Available now · Closes May 22, 4:00 PM', duration: '20 minutes', status: 'Active' },
  { id: 'science-review', title: 'Forces and Motion Worksheet', subject: 'Science', type: 'Assignment', window: 'Opens May 21 · Due May 27', duration: 'Untimed', status: 'Upcoming' },
]

const getPageKey = (pathname: string) => pathname.replace('/student/', '').replace('/student', 'dashboard') || 'dashboard'
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const Sidebar: FC<{ path: string; onNavigate: (path: string) => void; onClose?: () => void }> = ({ path, onNavigate, onClose }) => {
  const nav = (next: string) => { onNavigate(next); onClose?.() }
  const buttonSx = { justifyContent: 'flex-start', width: '100%', p: 1.25, borderRadius: 2, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  return <Box sx={{ width: 256, height: '100%', boxSizing: 'border-box', p: 3, backgroundColor: 'background.paper', overflowY: 'auto' }}>
    <Box sx={{ mb: 4 }}><Logo /></Box>
    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Student Portal</Typography>
    <Stack spacing={0.8} sx={{ mt: 0.5 }}>{portalItems.map((item) => <ButtonBase key={item.path} title={item.label} aria-label={item.label} onClick={() => nav(item.path)} sx={{ ...buttonSx, ...(path === item.path ? { color: 'primary.contrastText', backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.main' } } : {}) }}><Box sx={{ display: 'flex', mr: 1.25 }}>{item.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{item.label}</Typography></ButtonBase>)}</Stack>
    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mt: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Profile / Settings</Typography>
    <ButtonBase title="Settings" aria-label="Settings" onClick={() => nav('/student/settings')} sx={{ ...buttonSx, mt: 1, ...(path === '/student/settings' ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><SettingsOutlined fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>Settings</Typography></ButtonBase>
  </Box>
}

const TodaySchedule: FC = () => <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Box><Typography variant="h5">Today&apos;s Timetable</Typography><Typography variant="body2" color="text.secondary">Monday · May 19</Typography></Box><Button size="small" href="/student/timetable">View timetable</Button></Stack><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>{schedule.filter(([day]) => day === 'Monday').map(([, time, subject, teacher, room]) => <Box key={subject} sx={{ p: 1.5, flex: 1, borderRadius: 2, backgroundColor: 'background.default' }}><Typography variant="caption" color="primary.main" fontWeight={700}>{time}</Typography><Typography fontWeight={700} sx={{ mt: 0.5 }}>{subject}</Typography><Typography variant="caption" color="text.secondary">{teacher} · {room}</Typography></Box>)}</Stack></Paper>

const Dashboard: FC<{ name: string }> = ({ name }) => <Stack spacing={2}>
  <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}><Stack direction={{ xs: 'column-reverse', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4">Welcome back, {name.split(' ')[0]}.</Typography><Typography sx={{ opacity: 0.82, mt: 0.75 }}>Grade 8 · Section A &nbsp;|&nbsp; 2024/25 Academic Year</Typography></Box><Avatar sx={{ width: 68, height: 68, bgcolor: 'secondary.main', color: 'text.primary', fontWeight: 700 }}>{initials(name)}</Avatar></Stack></Paper>
  <TodaySchedule />
  <Grid container spacing={2}><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}><Typography variant="h5">Recent Results</Typography><Stack spacing={1.5} sx={{ mt: 2 }}>{[['Mathematics quiz', '18 / 20', '90%'], ['Science lab report', '42 / 50', '84%'], ['English reading', '16 / 20', '80%']].map(([title, score, percent]) => <Stack key={title} direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>{title}</Typography><Typography variant="caption" color="text.secondary">Graded this week</Typography></Box><Chip label={`${score} · ${percent}`} size="small" color="success" /></Stack>)}</Stack></Paper></Grid><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}><Typography variant="h5">Pending Assessments</Typography><Stack spacing={1.5} sx={{ mt: 2 }}>{assessments.map((item) => <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.subject} · {item.window}</Typography></Box><Chip label={item.status} size="small" color={item.status === 'Active' ? 'primary' : 'warning'} /></Stack>)}</Stack></Paper></Grid><Grid item xs={12}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between"><Typography variant="h5">Latest Announcements</Typography><Button size="small" href="/student/announcements">View all</Button></Stack><Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>{announcements.slice(0, 2).map((item) => <Box key={item.title} sx={{ py: 1.5 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Typography fontWeight={700}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.date}</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.body}</Typography></Box>)}</Stack></Paper></Grid></Grid>
</Stack>

const Profile: FC<{ name: string; email: string }> = ({ name, email }) => <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'center', sm: 'flex-start' }}><Avatar sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 30, fontWeight: 700 }}>{initials(name)}</Avatar><Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}><Typography variant="h4">{name}</Typography><Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1 }}><Chip label="Student" color="primary" size="small" /><Chip label="Active" color="success" size="small" /></Stack><Typography color="text.secondary" sx={{ mt: 1 }}>Grade 8 · Section A · 2024/25</Typography></Box></Stack><Divider sx={{ my: 3 }} /><Grid container spacing={3}>{[['Student ID', 'STU-2025-0841'], ['Date of birth', 'September 14, 2011'], ['Gender', 'Female'], ['Phone', '+251 91 000 0000'], ['Email', email], ['Address', 'Addis Ababa, Ethiopia']].map(([label, value]) => <Grid key={label} item xs={12} sm={6}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ mt: 0.5 }}>{value}</Typography></Grid>)}</Grid><Divider sx={{ my: 3 }} /><Typography variant="h5" sx={{ mb: 2 }}>Guardians</Typography><Grid container spacing={2}>{[['Mekdes Alemu', 'Mother', '+251 91 111 1111'], ['Alemu Bekele', 'Father', '+251 91 222 2222']].map(([guardian, relationship, contact]) => <Grid item xs={12} md={6} key={guardian}><Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}><Typography fontWeight={700}>{guardian}</Typography><Typography variant="body2" color="text.secondary">{relationship} · {contact}</Typography></Box></Grid>)}</Grid></Paper>

const Timetable: FC = () => <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack spacing={2}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => <Box key={day}><Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{day}</Typography><Grid container spacing={1}>{schedule.filter(([scheduleDay]) => scheduleDay === day).map(([, time, subject, teacher, room]) => <Grid item xs={12} sm={6} md={4} key={`${day}-${subject}`}><Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.default', height: '100%' }}><Typography variant="caption" color="primary.main" fontWeight={700}>{time}–{Number(time.slice(0, 2)) + 1}:00</Typography><Typography fontWeight={700} sx={{ mt: 0.5 }}>{subject}</Typography><Typography variant="caption" color="text.secondary">{teacher} · {room}</Typography></Box></Grid>)}</Grid></Box>)}</Stack></Paper>

const Materials: FC = () => { const [subject, setSubject] = useState('All subjects'); const filtered = subject === 'All subjects' ? materials : materials.filter((item) => item.subject === subject); return <Stack spacing={2}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h5">Shared materials</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Only resources for Grade 8 · Section A are shown.</Typography></Box><TextField select size="small" label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} sx={{ minWidth: 180 }}><MenuItem value="All subjects">All subjects</MenuItem>{[...new Set(materials.map((item) => item.subject))].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Stack></Paper>{filtered.map((item) => <Paper key={item.title} elevation={0} sx={{ p: 2, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}><Stack direction="row" spacing={1.5} alignItems="center"><Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'background.default', color: 'primary.main' }}><DescriptionOutlined /></Box><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.subject} · {item.teacher} · {item.date} · {item.type}</Typography></Box></Stack><Stack direction="row" spacing={1}><Button size="small">View</Button><Button size="small" variant="outlined" startIcon={<DownloadOutlined />}>Download</Button></Stack></Stack></Paper>)}</Stack> }

const AssessmentPlayer: FC<{ onClose: () => void }> = ({ onClose }) => { const [answer, setAnswer] = useState(''); const [time, setTime] = useState(20 * 60); const [message, setMessage] = useState(''); useEffect(() => { const timer = window.setInterval(() => setTime((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer) }, []); const submit = async () => { if (!answer) return setMessage('Choose an answer before submitting.'); try { await api.post('/api/assessments/sample-assessment/submissions', { answers: [answer] }, { withCredentials: true }); setMessage('Your assessment was submitted successfully.') } catch { setMessage('This sample assessment is not available on the server yet.') } }; return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h5">Linear Equations Quiz</Typography><Typography color="text.secondary">Question 1 of 1</Typography></Box><Chip label={`${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`} color="primary" /></Stack><LinearProgress variant="determinate" value={100} sx={{ my: 3 }} /><Typography variant="h6">Solve for x: 3x + 6 = 21</Typography><Stack sx={{ mt: 2 }}>{['3', '5', '7', '9'].map((option, index) => <FormControlLabel key={option} value={String(index)} control={<Radio checked={answer === String(index)} onChange={() => setAnswer(String(index))} />} label={option} />)}</Stack>{message && <Alert severity={message.includes('successfully') ? 'success' : 'info'} sx={{ mt: 2 }}>{message}</Alert>}<Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}><Button onClick={onClose}>Exit assessment</Button><Button variant="contained" onClick={submit}>Submit assessment</Button></Stack></Paper> }

const Assessments: FC = () => { const [taking, setTaking] = useState(false); if (taking) return <AssessmentPlayer onClose={() => setTaking(false)} />; return <Stack spacing={2}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Upcoming Assessments</Typography><Stack spacing={1.5} sx={{ mt: 2 }}>{assessments.map((item) => <Box key={item.id} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.subject} · {item.type} · {item.window} · {item.duration}</Typography></Box>{item.status === 'Active' ? <Button variant="contained" startIcon={<PlayCircleOutlineRounded />} onClick={() => setTaking(true)}>Start</Button> : <Chip label="Upcoming" color="warning" size="small" />}</Stack></Box>)}</Stack></Paper><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">My Results</Typography><Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>{[['Mathematics quiz', 'Mathematics', '18 / 20', 'May 17'], ['Science lab report', 'Science', 'Awaiting grading', 'May 15']].map(([title, subject, result, date]) => <Stack key={title} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}><Box><Typography fontWeight={700}>{title}</Typography><Typography variant="caption" color="text.secondary">{subject} · {date}</Typography></Box><Chip label={result} size="small" color={result.includes('Awaiting') ? 'warning' : 'success'} /></Stack>)}</Stack></Paper><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Report Cards</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}><Typography>Term 1 · 2024/25</Typography><Button variant="outlined" startIcon={<DownloadOutlined />}>View report card</Button></Stack></Paper></Stack> }

const Announcements: FC = () => <Stack spacing={2}>{announcements.map((item) => <Paper key={item.title} elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Box><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">{item.title}</Typography><Chip label={item.scope} size="small" /></Stack><Typography color="text.secondary" sx={{ mt: 1 }}>{item.body}</Typography></Box><Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{item.date}</Typography></Stack></Paper>)}</Stack>

const Settings: FC<{ email: string }> = ({ email }) => <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, maxWidth: 720 }}><Typography variant="h5">Contact details</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Name and class details are maintained by school administration.</Typography><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Phone" defaultValue="+251 91 000 0000" /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Email" defaultValue={email} /></Grid></Grid><Button variant="contained" sx={{ mt: 2 }}>Request profile update</Button><Divider sx={{ my: 4 }} /><Typography variant="h5">Change password</Typography><Stack spacing={2} sx={{ mt: 2 }}><TextField fullWidth label="Current password" type="password" /><TextField fullWidth label="New password" type="password" /><TextField fullWidth label="Confirm new password" type="password" /><Button variant="outlined">Update password</Button></Stack></Paper>

const StudentPortal: FC = () => { const navigate = useNavigate(); const location = useLocation(); const { user, logout } = useAuth(); const [mobileOpen, setMobileOpen] = useState(false); const [anchor, setAnchor] = useState<HTMLElement | null>(null); const key = useMemo(() => getPageKey(location.pathname), [location.pathname]); const details = pageDetails[key] || pageDetails.dashboard; const name = user?.name || 'Student'; const content = key === 'profile' ? <Profile name={name} email={user?.email || 'student@coursespace.edu'} /> : key === 'timetable' ? <Timetable /> : key === 'materials' ? <Materials /> : key === 'assessments' ? <Assessments /> : key === 'announcements' ? <Announcements /> : key === 'settings' ? <Settings email={user?.email || 'student@coursespace.edu'} /> : <Dashboard name={name} />; return <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', display: 'flex' }}><Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', inset: '0 auto 0 0', zIndex: (theme) => theme.zIndex.drawer, width: 256, borderRight: 1, borderColor: 'divider' }}><Sidebar path={location.pathname} onNavigate={navigate} /></Box><Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}><Sidebar path={location.pathname} onNavigate={navigate} onClose={() => setMobileOpen(false)} /></Drawer><Box component="section" sx={{ minWidth: 0, flex: 1, ml: { xs: 0, md: '256px' } }}><Paper component="header" elevation={0} sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, px: { xs: 1.5, md: 3 }, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}><Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 2 }} sx={{ minHeight: 48, position: 'relative' }}><IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuRounded /></IconButton><Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{details.title}</Typography><Box sx={{ ml: { xs: 'auto', sm: 2 }, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', width: '100%', maxWidth: 440, px: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><InputBase fullWidth placeholder="Search materials and assessments..." inputProps={{ 'aria-label': 'Search student portal' }} sx={{ py: 0.75, fontSize: '0.85rem' }} /></Box><Stack direction="row" alignItems="center" spacing={0.5} sx={{ position: 'absolute', right: 0, backgroundColor: 'background.paper' }}><ThemeToggle /><IconButton aria-label="Notifications"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton><IconButton aria-label="Open profile menu" onClick={(event) => setAnchor(event.currentTarget)}><Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12 }}>{initials(name)}</Avatar></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => { setAnchor(null); navigate('/student/profile') }}>My Profile</MenuItem><MenuItem onClick={() => { setAnchor(null); navigate('/student/settings') }}>Settings</MenuItem><MenuItem onClick={async () => { setAnchor(null); await logout(); navigate('/login', { replace: true }) }}>Logout</MenuItem></Menu></Stack></Stack></Paper><Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Student Portal</Typography><Typography variant="subtitle2" color="primary.main">{details.title}</Typography></Breadcrumbs><Box sx={{ mb: 4 }}><Typography variant="h1" sx={{ fontSize: { xs: 30, md: 38 } }}>{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{details.description}</Typography></Box>{content}</Container></Box></Box> }

export default StudentPortal
