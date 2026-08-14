import { useEffect, useMemo, useState, type FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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

const portalGroups = [
  { label: 'TIMETABLE', items: [{ label: 'Timetable', path: '/student/timetable', icon: <ScheduleOutlined fontSize="small" /> }] },
  { label: 'MATERIALS', items: [{ label: 'Materials', path: '/student/materials', icon: <FolderOutlined fontSize="small" /> }] },
  { label: 'ASSESSMENTS', items: [{ label: 'Assessments', path: '/student/assessments', icon: <AssessmentOutlined fontSize="small" /> }] },
  { label: 'ANNOUNCEMENTS', items: [{ label: 'Announcements', path: '/student/announcements', icon: <CampaignOutlined fontSize="small" /> }] },
]

const pageDetails: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Student Dashboard', description: 'Keep track of today’s learning, assessments, and school updates.' },
  profile: { title: 'My Profile', description: 'Your school record and guardian information.' },
  timetable: { title: 'My Timetable', description: 'Your weekly class schedule.' },
  materials: { title: 'Learning Materials', description: 'Resources shared for your class and subjects.' },
  assessments: { title: 'Assessments & Results', description: 'Complete active assessments and review your learning progress.' },
  announcements: { title: 'Announcements', description: 'School and class notices, newest first.' },
  settings: { title: 'Profile Settings', description: 'Update your contact details and password.' },
}

const announcements = [
  { title: 'Science fair registration is open', body: 'Students interested in presenting a project can register with their science teacher by Friday, May 23.', date: 'Today', scope: 'School-wide' },
  { title: 'Mathematics revision session', body: 'An optional revision session will be held after school on Thursday in Room 12.', date: 'Yesterday', scope: 'Grade 8 · Section A' },
  { title: 'Library hours updated', body: 'The library will remain open until 5:00 PM on weekdays during the assessment period.', date: 'May 15', scope: 'School-wide' },
]

const getPageKey = (pathname: string) => pathname.replace('/student/', '').replace('/student', 'dashboard') || 'dashboard'
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
type StudentTimetableEntry = { id: string; day: string; period: string; startTime: string; endTime: string; subject: string; teacher: string; room: string | null }
type StudentResultQuestion = { prompt: string; studentAnswer: string | string[]; correctAnswer: string | string[] }
type StudentDashboardData = { student: { fullName: string; photoName: string | null; academicYear: string; gradeLevel: string; classSection: string }; todayTimetable: StudentTimetableEntry[]; timetable: StudentTimetableEntry[]; upcomingAssessments: { id: string; title: string; assessmentType: string; subjectName: string | null; dueDate: string; status: string }[]; recentResults: { id: string; title: string; assessmentType: string; subjectName: string | null; score: number | null; totalPoints: number; submittedAt: string | null; questions: StudentResultQuestion[] }[]; announcements: { title: string; body: string; date: string; scope: string }[] }
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const formatRemainingTime = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const Sidebar: FC<{ path: string; onNavigate: (path: string) => void; onClose?: () => void }> = ({ path, onNavigate, onClose }) => {
  const nav = (next: string) => { onNavigate(next); onClose?.() }
  const menuButtonSx = { justifyContent: 'flex-start', width: '100%', p: 1.1, borderRadius: 2, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const activeMenuButtonSx = { backgroundColor: '#127C71', color: 'primary.contrastText', '&:hover': { backgroundColor: '#127C71' } }
  return <Box sx={{ width: 248, height: '100%', boxSizing: 'border-box', p: 3, backgroundColor: 'background.paper', overflowY: 'auto' }}>
    <Box sx={{ mb: 4 }}><Logo /></Box>
    <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>DASHBOARD</Typography><ButtonBase title="Dashboard" aria-label="Dashboard" onClick={() => nav('/student')} sx={{ ...menuButtonSx, color: path === '/student' ? '#FFFFFF' : 'text.secondary', backgroundColor: path === '/student' ? '#127C71' : 'action.selected', '&:hover': { backgroundColor: path === '/student' ? '#127C71' : 'action.selected' } }}><DashboardOutlined fontSize="small" sx={{ mr: 1.5, color: path === '/student' ? '#FFFFFF' : 'inherit' }} /><Typography variant="subtitle2" sx={{ fontWeight: 600, color: path === '/student' ? '#FFFFFF' : 'inherit' }}>Dashboard</Typography></ButtonBase></Box>
    <Stack spacing={2}>
      {portalGroups.map((group) => <Box key={group.label}><Typography variant="caption" color="text.disabled" sx={{ px: 1.25, textTransform: 'uppercase', letterSpacing: 0.8 }}>{group.label}</Typography><Stack spacing={0.25} sx={{ mt: 0.5 }}>{group.items.map((item) => <ButtonBase key={item.path} title={item.label} aria-label={item.label} onClick={() => nav(item.path)} sx={{ ...menuButtonSx, ...(path === item.path ? activeMenuButtonSx : {}) }}><Box sx={{ display: 'flex', mr: 1.25, color: 'primary.main' }}>{item.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.label}</Typography></ButtonBase>)}</Stack></Box>)}
    </Stack>
    <Stack spacing={2} sx={{ mt: 1 }}><Box><Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>MY PROFILE</Typography><ButtonBase title="My Profile" aria-label="My Profile" onClick={() => nav('/student/profile')} sx={{ ...menuButtonSx, ...(path === '/student/profile' ? activeMenuButtonSx : {}) }}><PersonOutlineRounded fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>My Profile</Typography></ButtonBase></Box><Box><Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>SETTINGS</Typography><ButtonBase title="Settings" aria-label="Settings" onClick={() => nav('/student/settings')} sx={{ ...menuButtonSx, ...(path === '/student/settings' ? activeMenuButtonSx : {}) }}><SettingsOutlined fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>Settings</Typography></ButtonBase></Box></Stack>
  </Box>
}

const TodaySchedule: FC<{ entries: StudentTimetableEntry[] }> = ({ entries }) => <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Box><Typography variant="h5">Today&apos;s Timetable</Typography><Typography variant="body2" color="text.secondary">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</Typography></Box><Button size="small" href="/student/timetable">View timetable</Button></Stack>{entries.length ? <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>{entries.map((entry) => <Box key={entry.id} sx={{ p: 1.5, flex: 1, borderRadius: 2, backgroundColor: 'background.default' }}><Typography variant="caption" color="primary.main" fontWeight={700}>{entry.startTime}–{entry.endTime}</Typography><Typography fontWeight={700} sx={{ mt: 0.5 }}>{entry.subject}</Typography><Typography variant="caption" color="text.secondary">{entry.teacher} · {entry.room || 'Room not assigned'}</Typography></Box>)}</Stack> : <Typography color="text.secondary">No timetable periods are scheduled today.</Typography>}</Paper>

const Dashboard: FC<{ data: StudentDashboardData | null; error: string }> = ({ data, error }) => {
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null)
  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return <LinearProgress />
  const { student, todayTimetable, upcomingAssessments, recentResults, announcements: latestAnnouncements } = data
  const answerText = (answer: string | string[]) => Array.isArray(answer) ? answer.join(', ') || 'No answer' : answer || 'No answer'
  return <Stack spacing={2}>
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}><Stack direction={{ xs: 'column-reverse', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4">Welcome back, {student.fullName.split(' ')[0]}.</Typography><Typography sx={{ opacity: 0.82, mt: 0.75 }}>{student.gradeLevel} · {student.classSection} &nbsp;|&nbsp; {student.academicYear}</Typography></Box><Avatar src={student.photoName || undefined} alt={`${student.fullName} profile photo`} sx={{ width: 68, height: 68, bgcolor: 'secondary.main', color: 'text.primary', fontWeight: 700 }}>{initials(student.fullName)}</Avatar></Stack></Paper>
    <TodaySchedule entries={todayTimetable} />
    <Grid container spacing={2}><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}><Typography variant="h5">Recent Results</Typography>{recentResults.length ? <Stack spacing={1.5} sx={{ mt: 2 }}>{recentResults.slice(0, 3).map((result) => <Stack key={`${result.id}-${result.submittedAt}`} direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>{result.title}</Typography><Typography variant="caption" color="text.secondary">{result.subjectName || result.assessmentType} · {result.submittedAt ? formatDate(result.submittedAt) : 'Date unavailable'}</Typography></Box><Chip label={result.score === null ? 'Awaiting grading' : `${result.score} / ${result.totalPoints}`} size="small" color={result.score === null ? 'warning' : 'success'} /></Stack>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No graded assessments yet.</Typography>}</Paper></Grid>
    <Dialog open={Boolean(selectedResult)} onClose={() => setSelectedResult(null)} fullWidth maxWidth="md"><DialogTitle>{selectedResult?.title} · Result details</DialogTitle><DialogContent dividers><Stack spacing={2}>{selectedResult?.questions.map((question, index) => <Paper key={`${selectedResult.id}-question-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography variant="subtitle1" fontWeight={700}>Question {index + 1}</Typography><Typography sx={{ mt: 0.75 }}>{question.prompt}</Typography><Typography variant="body2" sx={{ mt: 1.5 }}><strong>Your answer:</strong> {answerText(question.studentAnswer)}</Typography><Typography variant="body2" sx={{ mt: 0.5 }}><strong>Correct answer:</strong> {answerText(question.correctAnswer)}</Typography></Paper>)}</Stack></DialogContent><DialogActions><Button onClick={() => setSelectedResult(null)}>Close</Button></DialogActions></Dialog><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}><Typography variant="h5">Pending Assessments</Typography>{upcomingAssessments.length ? <Stack spacing={1.5} sx={{ mt: 2 }}>{upcomingAssessments.slice(0, 3).map((item) => <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.subjectName || item.assessmentType} · Due {formatDate(item.dueDate)}</Typography></Box><Chip label={item.status} size="small" color="primary" /></Stack>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No pending assessments.</Typography>}</Paper></Grid><Grid item xs={12}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between"><Typography variant="h5">Latest Announcements</Typography><Button size="small" href="/student/announcements">View all</Button></Stack>{latestAnnouncements.length ? <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>{latestAnnouncements.slice(0, 3).map((item) => <Box key={`${item.title}-${item.date}`} sx={{ py: 1.5 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Typography fontWeight={700}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.date}</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.body}</Typography></Box>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No announcements available.</Typography>}</Paper></Grid></Grid>
</Stack> }

const Profile: FC<{ name: string; email: string }> = ({ name, email }) => <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'center', sm: 'flex-start' }}><Avatar sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 30, fontWeight: 700 }}>{initials(name)}</Avatar><Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}><Typography variant="h4">{name}</Typography><Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1 }}><Chip label="Student" color="primary" size="small" /><Chip label="Active" color="success" size="small" /></Stack><Typography color="text.secondary" sx={{ mt: 1 }}>Grade 8 · Section A · 2024/25</Typography></Box></Stack><Divider sx={{ my: 3 }} /><Grid container spacing={3}>{[['Student ID', 'STU-2025-0841'], ['Date of birth', 'September 14, 2011'], ['Gender', 'Female'], ['Phone', '+251 91 000 0000'], ['Email', email], ['Address', 'Addis Ababa, Ethiopia']].map(([label, value]) => <Grid key={label} item xs={12} sm={6}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ mt: 0.5 }}>{value}</Typography></Grid>)}</Grid><Divider sx={{ my: 3 }} /><Typography variant="h5" sx={{ mb: 2 }}>Guardians</Typography><Grid container spacing={2}>{[['Mekdes Alemu', 'Mother', '+251 91 111 1111'], ['Alemu Bekele', 'Father', '+251 91 222 2222']].map(([guardian, relationship, contact]) => <Grid item xs={12} md={6} key={guardian}><Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}><Typography fontWeight={700}>{guardian}</Typography><Typography variant="body2" color="text.secondary">{relationship} · {contact}</Typography></Box></Grid>)}</Grid></Paper>

const Timetable: FC<{ entries: StudentTimetableEntry[]; loading: boolean; error: string }> = ({ entries, loading, error }) => { const days = [...new Set(entries.map((entry) => entry.day))]; return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>{loading && <LinearProgress sx={{ mb: 2 }} />}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{!loading && !error && !entries.length && <Typography color="text.secondary" sx={{ py: 3 }}>No timetable periods have been assigned to your class.</Typography>}<Stack spacing={2}>{days.map((day) => <Box key={day}><Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{day}</Typography><Grid container spacing={1}>{entries.filter((entry) => entry.day === day).map((entry) => <Grid item xs={12} sm={6} md={4} key={entry.id}><Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.default', height: '100%' }}><Typography variant="caption" color="primary.main" fontWeight={700}>{entry.startTime}–{entry.endTime}</Typography><Typography fontWeight={700} sx={{ mt: 0.5 }}>{entry.subject}</Typography><Typography variant="caption" color="text.secondary">{entry.teacher} · {entry.room || 'Room not assigned'}</Typography></Box></Grid>)}</Grid></Box>)}</Stack></Paper> }

type StudentMaterial = { id: string; title: string; subjectName: string | null; teacherName: string | null; fileName: string | null; fileExtension: string | null; uploadedAt: string; description: string | null }
const studentMaterialFileUrl = (materialId: string) => `${api.defaults.baseURL || ''}/api/student/materials/${materialId}/file`
const Materials: FC = () => { const [subject, setSubject] = useState('All subjects'); const [materials, setMaterials] = useState<StudentMaterial[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); useEffect(() => { api.get<{ materials: StudentMaterial[] }>('/api/student/materials', { withCredentials: true }).then(({ data }) => setMaterials(data.materials)).catch(() => setError('Unable to load your learning materials. Please try again.')).finally(() => setLoading(false)) }, []); const filtered = subject === 'All subjects' ? materials : materials.filter((item) => item.subjectName === subject); const subjects = [...new Set(materials.map((item) => item.subjectName).filter((item): item is string => Boolean(item)))]; return <Stack spacing={2}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h5">Shared materials</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Resources available for your assigned class.</Typography></Box><TextField select size="small" label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} sx={{ minWidth: 180 }}><MenuItem value="All subjects">All subjects</MenuItem>{subjects.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Stack></Paper>{loading && <LinearProgress />}{error && <Alert severity="error">{error}</Alert>}{!loading && !error && !filtered.length && <Typography color="text.secondary" sx={{ py: 3 }}>No learning materials have been shared with your class.</Typography>}{filtered.map((item) => { const fileUrl = studentMaterialFileUrl(item.id); return <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}><Stack direction="row" spacing={1.5} alignItems="center"><Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'background.default', color: 'primary.main' }}><DescriptionOutlined /></Box><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.subjectName || 'Subject not specified'} · {item.teacherName || 'Teacher not specified'} · {formatDate(item.uploadedAt)} · {(item.fileExtension || 'file').toUpperCase()}</Typography>{item.fileName && <Typography variant="caption" color="text.secondary">{item.fileName}</Typography>}</Box></Stack><Stack direction="row" spacing={1}><Button size="small" component="a" href={fileUrl} target="_blank" rel="noreferrer">View</Button><Button size="small" variant="outlined" component="a" href={fileUrl} download startIcon={<DownloadOutlined />}>Download</Button></Stack></Stack></Paper>})}</Stack> }


type StudentAssessment = { id: string; assessmentId: string; title: string; assessmentType: string; subjectName: string | null; dueDate: string; startsAt: string; timeLimitMinutes: number; endsAt: string; status: string; questionCount: number }
type StudentResult = { id: string; title: string; assessmentType: string; subjectName: string | null; score: number | null; totalPoints: number; status?: string; submittedAt: string | null; questions: StudentResultQuestion[] }
type StudentAssessmentQuestion = { type: 'single' | 'multiple' | 'true-false' | 'fill-blank'; prompt: string; options: string[] }
type StudentAssessmentDetail = { id: string; assignmentId: string; title: string; assessmentType: string; subjectName: string | null; dueDate: string; startsAt: string; timeLimitMinutes: number; endsAt: string; questions: StudentAssessmentQuestion[]; draftAnswers: (string | string[])[] }

type AssessmentSubmissionResult = { score: number; totalPoints: number; status: string }

const AssessmentPlayer: FC<{ assignmentId: string; onClose: () => void; onSubmitted: () => void }> = ({ assignmentId, onClose, onSubmitted }) => {
  const [assessment, setAssessment] = useState<StudentAssessmentDetail | null>(null)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [locked, setLocked] = useState(false)
  const [message, setMessage] = useState('')
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmissionResult | null>(null)
  const [error, setError] = useState('')
  const storageKey = 'student-assessment-draft-' + assignmentId

  useEffect(() => {
    api.get<{ assessment: StudentAssessmentDetail }>('/api/student/assessments/' + assignmentId, { withCredentials: true })
      .then(({ data }) => {
        setAssessment(data.assessment)
        if (data.assessment.draftAnswers?.length) setAnswers(Object.fromEntries(data.assessment.draftAnswers.map((answer, index) => [index, answer])))
        setRemainingSeconds(Math.max(0, Math.min(data.assessment.timeLimitMinutes * 60, Math.floor((new Date(data.assessment.endsAt).getTime() - Date.now()) / 1000))))
        try {
          const saved = sessionStorage.getItem(storageKey)
          if (saved) setAnswers(JSON.parse(saved) as Record<number, string | string[]>)
        } catch { /* Ignore unavailable or malformed browser storage. */ }
      })
      .catch(() => setError('Unable to load this assessment. Please return to your assessment list and try again.'))
      .finally(() => setLoading(false))
  }, [assignmentId, storageKey])

  useEffect(() => {
    if (!assessment || locked) return
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.min(assessment.timeLimitMinutes * 60, Math.floor((new Date(assessment.endsAt).getTime() - Date.now()) / 1000)))
      setRemainingSeconds(next)
      if (next <= 0) setLocked(true)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [assessment, locked])

  useEffect(() => {
    if (!assessment || !Object.keys(answers).length || locked) return
    try { sessionStorage.setItem(storageKey, JSON.stringify(answers)) } catch { /* Ignore unavailable browser storage. */ }
    void api.post('/api/assessments/' + assessment.id + '/draft', { answers: assessment.questions.map((question, index) => answers[index] ?? (question.type === 'multiple' ? [] : '')) }, { withCredentials: true }).catch(() => undefined)
  }, [answers, currentQuestion, assessment, storageKey, locked])

  const updateAnswer = (questionIndex: number, answer: string | string[]) => setAnswers((current) => ({ ...current, [questionIndex]: answer }))
  const updateMultipleAnswer = (questionIndex: number, optionIndex: string, checked: boolean) => {
    const selected = Array.isArray(answers[questionIndex]) ? answers[questionIndex] as string[] : []
    updateAnswer(questionIndex, checked ? [...selected, optionIndex] : selected.filter((item) => item !== optionIndex))
  }

  const submit = async (automatic = false) => {
    if (!assessment || submitting) return
    const submittedAnswers = assessment.questions.map((question, index) => answers[index] ?? (question.type === 'multiple' ? [] : ''))
    if (!automatic && submittedAnswers.some((answer) => Array.isArray(answer) ? !answer.length : !answer.trim())) {
      setError('Answer every question before submitting.')
      return
    }
    setSubmitting(true)
    setLocked(true)
    setError('')
    try {
      const { data } = await api.post<AssessmentSubmissionResult>('/api/assessments/' + assessment.id + '/submissions', { answers: submittedAnswers, automatic }, { withCredentials: true })
      setSubmissionResult(data)
      setMessage(automatic ? 'Time’s up — your answers were submitted automatically.' : 'Assessment submitted successfully.')
      try { sessionStorage.removeItem(storageKey) } catch { /* Ignore unavailable browser storage. */ }
    } catch {
      setLocked(false)
      setError('Unable to submit this assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (locked && remainingSeconds <= 0 && assessment && !submitting && !message) void submit(true)
  }, [locked, remainingSeconds, assessment, submitting, message])

  if (loading) return <LinearProgress />
  if (!assessment) return <Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<Button variant="outlined" onClick={onClose}>Back to assessments</Button></Stack>
  if (submissionResult) {
    const percentage = submissionResult.totalPoints ? Math.round((submissionResult.score / submissionResult.totalPoints) * 100) : 0
    return <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center' }}>
      <Typography variant="h4">Assessment complete</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>{assessment.title}</Typography>
      <Typography variant="h2" color="primary.main" sx={{ mt: 3 }}>{submissionResult.score} / {submissionResult.totalPoints}</Typography>
      <Typography variant="h6" sx={{ mt: 1 }}>{percentage}%</Typography>
      {message && <Alert severity="success" sx={{ mt: 3, textAlign: 'left' }}>{message}</Alert>}
      <Button variant="contained" onClick={onSubmitted} sx={{ mt: 3 }}>View my results</Button>
    </Paper>
  }
  const question = assessment.questions[currentQuestion]
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timerColor = remainingSeconds < 60 ? 'error.main' : remainingSeconds < 300 ? 'warning.main' : 'text.primary'

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
      <Box><Typography variant="h5">{assessment.title}</Typography><Typography color="text.secondary">{assessment.subjectName || assessment.assessmentType} · Due {formatDate(assessment.dueDate)}</Typography></Box>
      <Button variant="outlined" onClick={onClose} disabled={submitting}>Back to assessments</Button>
    </Stack>
    <Paper elevation={0} sx={{ mt: 2, p: 1.5, position: 'sticky', top: 16, zIndex: 1, border: 1, borderColor: remainingSeconds < 300 ? timerColor : 'divider', backgroundColor: 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700}>Time remaining</Typography><Typography variant="h6" sx={{ color: timerColor }}>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</Typography></Stack>
    </Paper>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
    <Box sx={{ mt: 3 }}><Typography variant="subtitle2" color="text.secondary">Question {currentQuestion + 1} of {assessment.questions.length}</Typography><Typography variant="h6" sx={{ mt: 1 }}>{question.prompt}</Typography>
      {question.type === 'fill-blank' ? <TextField fullWidth label="Your answer" value={typeof answers[currentQuestion] === 'string' ? answers[currentQuestion] : ''} onChange={(event) => updateAnswer(currentQuestion, event.target.value)} disabled={locked} sx={{ mt: 2 }} /> : <Stack sx={{ mt: 1 }}>{question.options.map((option, optionIndex) => <FormControlLabel key={option + '-' + optionIndex} control={question.type === 'multiple' ? <Checkbox checked={Array.isArray(answers[currentQuestion]) && answers[currentQuestion].includes(String(optionIndex))} onChange={(event) => updateMultipleAnswer(currentQuestion, String(optionIndex), event.target.checked)} disabled={locked} /> : <Radio checked={answers[currentQuestion] === String(optionIndex)} onChange={() => updateAnswer(currentQuestion, String(optionIndex))} disabled={locked} />} label={option} />)}</Stack>}
    </Box>
    <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}><Button variant="outlined" onClick={() => setCurrentQuestion((index) => Math.max(0, index - 1))} disabled={locked || currentQuestion === 0}>Previous</Button><Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => setCurrentQuestion((index) => Math.min(assessment.questions.length - 1, index + 1))} disabled={locked || currentQuestion === assessment.questions.length - 1}>Next</Button><Button variant="contained" onClick={() => void submit()} disabled={locked || submitting}>Submit assessment</Button></Stack></Stack>
  </Paper>
}

const Assessments: FC = () => {
  const [assessments, setAssessments] = useState<StudentAssessment[]>([])
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null)
  const [selectedQuestionPage, setSelectedQuestionPage] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<{ assessments: StudentAssessment[]; results: StudentResult[] }>('/api/student/assessments', { withCredentials: true })
      .then(({ data }) => { setAssessments(data.assessments); setResults(data.results) })
      .catch(() => setError('Unable to load your assessments and results. Please try again.'))
      .finally(() => setLoading(false))
  }, [reloadKey])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const upcomingAssessments = assessments.filter((item) => item.status === 'Assigned')

  if (selectedAssignmentId) return <AssessmentPlayer assignmentId={selectedAssignmentId} onClose={() => setSelectedAssignmentId(null)} onSubmitted={() => { setSelectedAssignmentId(null); setReloadKey((current) => current + 1) }} />

  return <Stack spacing={2}>{loading && <LinearProgress />}{error && <Alert severity="error">{error}</Alert>}<Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Upcoming Assessments</Typography>{!loading && !error && (upcomingAssessments.length ? <Stack spacing={1.5} sx={{ mt: 2 }}>{upcomingAssessments.map((item) => { const endsAt = new Date(item.endsAt).getTime(); const dueAt = new Date(item.dueDate).getTime(); const startsAt = new Date(item.startsAt).getTime(); const available = now >= startsAt && now <= endsAt; const notYetAvailable = now < startsAt; const remainingSeconds = Math.max(0, Math.floor((endsAt - now) / 1000)); return <Box key={item.id} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.subjectName || item.assessmentType} · {item.assessmentType} · {item.timeLimitMinutes} min · Starts {formatDateTime(item.startsAt)} · {item.questionCount} question{item.questionCount === 1 ? '' : 's'}</Typography></Box>{item.status === 'Submitted' ? <Chip label="Submitted" color="success" size="small" /> : !item.questionCount || !available ? <Chip label={notYetAvailable ? `Available ${formatDateTime(item.startsAt)}` : 'Closed'} color={notYetAvailable ? 'warning' : 'default'} size="small" /> : <Stack direction="row" spacing={1} alignItems="center"><Chip label={`${formatRemainingTime(remainingSeconds)} remaining`} color="primary" size="small" /><Button variant="contained" startIcon={<PlayCircleOutlineRounded />} onClick={() => setSelectedAssignmentId(item.id)}>Start</Button></Stack>}</Stack></Box> })}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No active assessments are assigned to your class.</Typography>)}</Paper><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">My Results</Typography>{!loading && !error && (results.length ? <Stack spacing={1.5} sx={{ mt: 2 }}>{results.slice(0, 5).map((result) => <Stack key={result.id + '-' + result.submittedAt} direction="row" justifyContent="space-between" alignItems="center" role="button" tabIndex={0} onClick={() => { setSelectedResult(result); setSelectedQuestionPage(0) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { setSelectedResult(result); setSelectedQuestionPage(0) } }} sx={{ cursor: 'pointer', borderRadius: 2, p: 1, '&:hover': { backgroundColor: 'action.hover' } }}><Box><Typography fontWeight={700}>{result.title}</Typography><Typography variant="caption" color="text.secondary">{result.subjectName || result.assessmentType} · {result.submittedAt ? formatDate(result.submittedAt) : 'Date unavailable'}</Typography></Box><Chip label={result.score === null ? 'Awaiting grading' : result.score + ' / ' + result.totalPoints} size="small" color={result.score === null ? 'warning' : 'success'} /></Stack>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No results to show yet.</Typography>)}</Paper><Dialog open={Boolean(selectedResult)} onClose={() => setSelectedResult(null)} fullWidth maxWidth="md"><DialogTitle>{selectedResult?.title} · Result details</DialogTitle><DialogContent dividers><Stack spacing={2}>{selectedResult?.questions.slice(selectedQuestionPage * 5, selectedQuestionPage * 5 + 5).map((question, index) => <Paper key={`${selectedResult.id}-question-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography variant="subtitle1" fontWeight={700}>Question {index + 1}</Typography><Typography sx={{ mt: 0.75 }}>{question.prompt}</Typography><Typography variant="body2" sx={{ mt: 1.5 }}><strong>Your answer:</strong> {Array.isArray(question.studentAnswer) ? question.studentAnswer.join(', ') || 'No answer' : question.studentAnswer || 'No answer'}</Typography><Typography variant="body2" sx={{ mt: 0.5 }}><strong>Correct answer:</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') || 'No answer' : question.correctAnswer || 'No answer'}</Typography></Paper>)}</Stack></DialogContent><DialogActions><Button onClick={() => setSelectedQuestionPage((page) => Math.max(0, page - 1))} disabled={!selectedResult || selectedQuestionPage === 0}>Previous</Button><Button onClick={() => setSelectedQuestionPage((page) => Math.min(Math.ceil((selectedResult?.questions.length || 0) / 5) - 1, page))} disabled={!selectedResult || selectedQuestionPage >= Math.ceil(selectedResult.questions.length / 5) - 1}>Next</Button><Button onClick={() => { setSelectedResult(null); setSelectedQuestionPage(0) }}>Close</Button></DialogActions></Dialog></Stack>
}
const Announcements: FC = () => <Stack spacing={2}>{announcements.map((item) => <Paper key={item.title} elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Box><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">{item.title}</Typography><Chip label={item.scope} size="small" /></Stack><Typography color="text.secondary" sx={{ mt: 1 }}>{item.body}</Typography></Box><Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{item.date}</Typography></Stack></Paper>)}</Stack>

const Settings: FC<{ email: string }> = ({ email }) => <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, maxWidth: 720 }}><Typography variant="h5">Contact details</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Name and class details are maintained by school administration.</Typography><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Phone" defaultValue="+251 91 000 0000" /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Email" defaultValue={email} /></Grid></Grid><Button variant="contained" sx={{ mt: 2 }}>Request profile update</Button><Divider sx={{ my: 4 }} /><Typography variant="h5">Change password</Typography><Stack spacing={2} sx={{ mt: 2 }}><TextField fullWidth label="Current password" type="password" /><TextField fullWidth label="New password" type="password" /><TextField fullWidth label="Confirm new password" type="password" /><Button variant="outlined">Update password</Button></Stack></Paper>

const StudentPortal: FC = () => { const navigate = useNavigate(); const location = useLocation(); const { user, logout } = useAuth(); const [mobileOpen, setMobileOpen] = useState(false); const [anchor, setAnchor] = useState<HTMLElement | null>(null); const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null); const [dashboardError, setDashboardError] = useState(''); const key = useMemo(() => getPageKey(location.pathname), [location.pathname]); const details = pageDetails[key] || pageDetails.dashboard; const name = user?.name || 'Student'; useEffect(() => { if (!['dashboard', 'timetable'].includes(key)) return; setDashboardData(null); setDashboardError(''); api.get<StudentDashboardData>('/api/student/dashboard', { withCredentials: true }).then(({ data }) => setDashboardData(data)).catch(() => setDashboardError(`Unable to load your ${key === 'timetable' ? 'timetable' : 'dashboard'} data. Please try again.`)) }, [key]); const content = key === 'profile' ? <Profile name={name} email={user?.email || 'student@coursespace.edu'} /> : key === 'timetable' ? <Timetable entries={dashboardData?.timetable || []} loading={!dashboardData && !dashboardError} error={dashboardError} /> : key === 'materials' ? <Materials /> : key === 'assessments' ? <Assessments /> : key === 'announcements' ? <Announcements /> : key === 'settings' ? <Settings email={user?.email || 'student@coursespace.edu'} /> : <Dashboard data={dashboardData} error={dashboardError} />; return <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', display: 'flex' }}><Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', inset: '0 auto 0 0', zIndex: (theme) => theme.zIndex.drawer, width: 256, borderRight: 1, borderColor: 'divider' }}><Sidebar path={location.pathname} onNavigate={navigate} /></Box><Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}><Sidebar path={location.pathname} onNavigate={navigate} onClose={() => setMobileOpen(false)} /></Drawer><Box component="section" sx={{ minWidth: 0, flex: 1, ml: { xs: 0, md: '256px' } }}><Paper component="header" elevation={0} sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, px: { xs: 1.5, md: 3 }, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}><Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 2 }} sx={{ minHeight: 48, position: 'relative' }}><IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuRounded /></IconButton><Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{details.title}</Typography><Box sx={{ ml: { xs: 'auto', sm: 2 }, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', width: '100%', maxWidth: 440, px: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><InputBase fullWidth placeholder="Search materials and assessments..." inputProps={{ 'aria-label': 'Search student portal' }} sx={{ py: 0.75, fontSize: '0.85rem' }} /></Box><Stack direction="row" alignItems="center" spacing={0.5} sx={{ position: 'absolute', right: 0, backgroundColor: 'background.paper' }}><ThemeToggle /><IconButton aria-label="Notifications"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton><IconButton aria-label="Open profile menu" onClick={(event) => setAnchor(event.currentTarget)}><Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12 }}>{initials(name)}</Avatar></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => { setAnchor(null); navigate('/student/profile') }}>My Profile</MenuItem><MenuItem onClick={() => { setAnchor(null); navigate('/student/settings') }}>Settings</MenuItem><MenuItem onClick={async () => { setAnchor(null); await logout(); navigate('/login', { replace: true }) }}>Logout</MenuItem></Menu></Stack></Stack></Paper><Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Student Portal</Typography><Typography variant="subtitle2" color="primary.main">{details.title}</Typography></Breadcrumbs><Box sx={{ mb: 4 }}><Typography variant="h1" sx={{ fontSize: { xs: 30, md: 38 } }}>{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{details.description}</Typography></Box>{content}</Container></Box></Box> }

export default StudentPortal
