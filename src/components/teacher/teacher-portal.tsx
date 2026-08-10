import { useEffect, useMemo, useState, type FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import GradeOutlined from '@mui/icons-material/GradeOutlined'
import MenuRounded from '@mui/icons-material/MenuRounded'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import Radio from '@mui/material/Radio'
import SearchRounded from '@mui/icons-material/SearchRounded'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined'
import Badge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import TranslateOutlined from '@mui/icons-material/TranslateOutlined'
import { Logo } from '@/components/logo'
import ThemeToggle from '@/components/theme-toggle'
import { useAuth } from '@/auth/auth-context'
import api from '@/lib/api'

const portalItems = [
  { label: 'Dashboard', path: '/teacher', icon: <DashboardOutlined fontSize="small" /> },
  { label: 'Student List', path: '/teacher/students', icon: <PeopleAltOutlined fontSize="small" /> },
  { label: 'Timetable', path: '/teacher/timetable', icon: <ScheduleOutlined fontSize="small" /> },
]

const portalGroups = [
  { label: 'Materials', icon: <FolderOutlined fontSize="small" />, items: [{ label: 'Upload Material', path: '/teacher/materials/upload' }, { label: 'Assign Material', path: '/teacher/materials/assign' }, { label: 'Material List', path: '/teacher/materials' }] },
  { label: 'Assessments', icon: <AssessmentOutlined fontSize="small" />, items: [{ label: 'Create Assessment', path: '/teacher/assessments/create' }, { label: 'Assign Assessment', path: '/teacher/assessments/assign' }, { label: 'My Assessments', path: '/teacher/assessments' }] },
]

const footerItems = [
  { label: 'Gradebook', path: '/teacher/gradebook', icon: <GradeOutlined fontSize="small" /> },
]

const pageDetails: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Teacher Dashboard', description: 'Manage your classes, materials, and assessments from one place.' },
  students: { title: 'Student List', description: 'Review the students assigned to your classes.' },
  timetable: { title: 'Timetable', description: 'View your teaching schedule and upcoming classes.' },
  materials: { title: 'Material List', description: 'Manage the learning materials shared with your classes.' },
  'materials/upload': { title: 'Upload Material', description: 'Add a document, video, or resource for your students.' },
  'materials/assign': { title: 'Assign Material', description: 'Share learning materials with selected classes.' },
  assessments: { title: 'My Assessments', description: 'Review assessments and monitor student submissions.' },
  'assessments/create': { title: 'Create Assessment', description: 'Build an assessment for one of your classes.' },
  'assessments/assign': { title: 'Assign Assessment', description: 'Choose classes and due dates for an assessment.' },
  gradebook: { title: 'Gradebook', description: 'Record and review grades for your students.' },
  profile: { title: 'My Profile', description: 'Update your teacher profile information.' },
  'change-password': { title: 'Change Password', description: 'Keep your account secure with a new password.' },
}

const getPageKey = (pathname: string) => pathname.replace('/teacher/', '').replace('/teacher', 'dashboard') || 'dashboard'

const SidebarContent: FC<{ currentPath: string; onNavigate: (path: string) => void; onClose?: () => void }> = ({ currentPath, onNavigate, onClose }) => {
  const [expanded, setExpanded] = useState('Materials')
  const buttonSx = { justifyContent: 'flex-start', width: '100%', p: 1.1, borderRadius: 2, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const nestedSx = { justifyContent: 'flex-start', width: '100%', py: 0.7, pl: 2.75, borderRadius: 1.5, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const isActive = (path: string) => currentPath === path
  const navigate = (path: string) => { onNavigate(path); onClose?.() }

  return <Box sx={{ width: 256, height: '100%', boxSizing: 'border-box', p: 3, backgroundColor: 'background.paper', overflowY: 'auto' }}>
    <Box sx={{ mb: 4 }}><Logo /></Box>
    <Typography variant="caption" color="text.disabled" sx={{ px: 1.25, textTransform: 'uppercase', letterSpacing: 0.8 }}>Teacher Portal</Typography>
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {[...portalItems, ...footerItems].map((item) => <ButtonBase key={item.path} onClick={() => navigate(item.path)} sx={{ ...buttonSx, ...(isActive(item.path) ? { color: 'primary.contrastText', backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.main' } } : {}) }}><Box sx={{ display: 'flex', mr: 1.25 }}>{item.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.label}</Typography></ButtonBase>)}
      {portalGroups.map((group) => <Box key={group.label}>
        <ButtonBase onClick={() => setExpanded(expanded === group.label ? '' : group.label)} sx={{ ...buttonSx, mt: 0.5 }}><Box sx={{ display: 'flex', mr: 1.25, color: 'primary.main' }}>{group.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{group.label}</Typography><Box sx={{ display: 'flex', ml: 'auto' }}>{expanded === group.label ? <ExpandLessRounded sx={{ fontSize: 17 }} /> : <ExpandMoreRounded sx={{ fontSize: 17 }} />}</Box></ButtonBase>
        <Collapse in={expanded === group.label} timeout="auto" unmountOnExit><Stack spacing={0.25} sx={{ mt: 0.25 }}>{group.items.map((item) => <ButtonBase key={item.path} onClick={() => navigate(item.path)} sx={{ ...nestedSx, ...(isActive(item.path) ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>{item.label}</Typography></ButtonBase>)}</Stack></Collapse>
      </Box>)}
    </Stack>
    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mt: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Profile / Settings</Typography>
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      <ButtonBase onClick={() => navigate('/teacher/profile')} sx={{ ...buttonSx, ...(isActive('/teacher/profile') ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><PersonOutlineRounded fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>My Profile</Typography></ButtonBase>
      <ButtonBase onClick={() => navigate('/teacher/change-password')} sx={{ ...buttonSx, ...(isActive('/teacher/change-password') ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><SettingsOutlined fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>Change Password</Typography></ButtonBase>
    </Stack>
  </Box>
}

const StatCard: FC<{ label: string; value: string; tone?: 'primary' | 'secondary' }> = ({ label, value, tone = 'primary' }) => <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}><Typography variant="subtitle2" color="text.secondary">{label}</Typography><Typography variant="h3" color={`${tone}.main`} sx={{ mt: 1, fontSize: { xs: 26, md: 30 } }}>{value}</Typography></Paper>

type QuestionType = 'single' | 'multiple' | 'true-false' | 'fill-blank'
type AssessmentQuestion = { type: QuestionType; prompt: string; options: string[]; correctAnswer: string | string[]; points: number }

const questionTypeLabels: Record<QuestionType, string> = { single: 'Multiple Choice (Single Answer)', multiple: 'Multiple Choice (Multiple Answers)', 'true-false': 'True / False', 'fill-blank': 'Fill in the Blank' }

const newQuestion = (type: QuestionType): AssessmentQuestion => ({ type, prompt: '', options: type === 'true-false' ? ['True', 'False'] : type === 'fill-blank' ? [] : ['', '', '', ''], correctAnswer: type === 'multiple' ? [] : type === 'true-false' ? '0' : '', points: 1 })
const isQuestionComplete = (question: AssessmentQuestion) => {
  if (!question.prompt.trim() || !question.points) return false
  if (question.type === 'fill-blank') return typeof question.correctAnswer === 'string' && Boolean(question.correctAnswer.trim())
  if (question.options.length < 2 || question.options.some((option) => !option.trim())) return false
  return Array.isArray(question.correctAnswer) ? question.correctAnswer.length > 0 : Boolean(question.correctAnswer)
}

const AssessmentBuilder: FC = () => {
  const [title, setTitle] = useState('')
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [assignedClasses, setAssignedClasses] = useState<string[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [questionType, setQuestionType] = useState<QuestionType>('single')
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    api.get<{ subjects: string[] }>('/api/teacher/assigned-subjects', { withCredentials: true })
      .then(({ data }) => { setAssignedSubjects(data.subjects); setSubjectName(data.subjects[0] || '') })
      .catch(() => setError('Unable to load your assigned subjects. Please try again.'))
      .finally(() => setSubjectsLoading(false))
  }, [])

  useEffect(() => {
    api.get<{ classes: string[] }>('/api/teacher/assigned-classes', { withCredentials: true })
      .then(({ data }) => { setAssignedClasses(data.classes); setClassName(data.classes[0] || '') })
      .catch(() => setError('Unable to load your assigned classes. Please try again.'))
      .finally(() => setClassesLoading(false))
  }, [])
  const updateQuestion = (index: number, update: Partial<AssessmentQuestion>) => setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...update } : question))
  const addQuestion = () => { setQuestions((current) => [...current, newQuestion(questionType)]); setNotice('Question added. Complete it and click Save Assessment to insert it into the database.') }
  const addOption = (index: number) => setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, options: [...question.options, ''] } : question))
  const removeQuestion = (index: number) => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))
  const saveAssessment = async () => {
    if (!title.trim() || !subjectName || !className || !questions.length || questions.some((question) => !isQuestionComplete(question))) {
      setError('Add a title, assigned subject, assigned class, and complete every question with valid options, a correct answer, and points before saving.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/api/teacher/assessments', { title, subjectName, className, questions }, { withCredentials: true })
      setNotice('Assessment saved as a draft.')
    } catch {
      setError('Unable to save the assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  return <Stack spacing={2}>
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Grid container spacing={2}><Grid item xs={12} md={5}><TextField fullWidth label="Title" value={title} onChange={(event) => setTitle(event.target.value)} /></Grid><Grid item xs={12} md={3}><Select fullWidth value={subjectName} disabled={subjectsLoading || !assignedSubjects.length} onChange={(event) => setSubjectName(event.target.value)} displayEmpty aria-label="Assigned subject"><MenuItem value="" disabled>{subjectsLoading ? 'Loading assigned subjects...' : assignedSubjects.length ? 'Select an assigned subject' : 'No assigned subjects'}</MenuItem>{assignedSubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</Select></Grid><Grid item xs={12} md={4}><Select fullWidth value={className} disabled={classesLoading || !assignedClasses.length} onChange={(event) => setClassName(event.target.value)} displayEmpty aria-label="Assigned class"><MenuItem value="" disabled>{classesLoading ? 'Loading assigned classes...' : assignedClasses.length ? 'Select an assigned class' : 'No assigned classes'}</MenuItem>{assignedClasses.map((assignedClass) => <MenuItem key={assignedClass} value={assignedClass}>{assignedClass}</MenuItem>)}</Select></Grid></Grid></Paper>
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between"><Box><Typography variant="h5">Questions</Typography><Typography variant="body2" color="text.secondary">Choose a type before adding each question.</Typography></Box><Stack direction="row" spacing={1}><Select size="small" value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)} aria-label="Question Type">{Object.entries(questionTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select><Button variant="contained" startIcon={<AddRounded />} onClick={addQuestion} disabled={!assignedClasses.length || !assignedSubjects.length}>Add Question</Button><Button variant="outlined" onClick={saveAssessment} disabled={saving || !questions.length}>{saving ? 'Saving...' : 'Save Assessment'}</Button></Stack></Stack>
      <Stack spacing={2} sx={{ mt: 3 }}>{questions.map((question, index) => <Paper key={`${index}-${question.type}`} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="subtitle1" fontWeight={700}>Question {index + 1} · {questionTypeLabels[question.type]}</Typography><IconButton aria-label={`Remove question ${index + 1}`} onClick={() => removeQuestion(index)}><DeleteOutlineRounded /></IconButton></Stack><Stack spacing={2}><TextField fullWidth multiline minRows={2} label="Question text" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} />{question.type === 'fill-blank' ? <TextField fullWidth label="Correct answer" helperText="Answers are graded case-insensitively after trimming whitespace." value={question.correctAnswer as string} onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })} /> : <Box><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Answer choices</Typography><Stack spacing={1}>{question.options.map((option, optionIndex) => <Stack direction="row" spacing={1} alignItems="center" key={`${index}-${optionIndex}`}><FormControlLabel label="" control={question.type === 'multiple' ? <Checkbox checked={(question.correctAnswer as string[]).includes(String(optionIndex))} onChange={(event) => { const current = question.correctAnswer as string[]; updateQuestion(index, { correctAnswer: event.target.checked ? [...current, String(optionIndex)] : current.filter((value) => value !== String(optionIndex)) }) }} /> : <Radio checked={question.correctAnswer === String(optionIndex)} onChange={() => updateQuestion(index, { correctAnswer: String(optionIndex) })} />} /><TextField fullWidth size="small" label={`Option ${String.fromCharCode(65 + optionIndex)}`} value={option} disabled={question.type === 'true-false'} onChange={(event) => updateQuestion(index, { options: question.options.map((value, valueIndex) => valueIndex === optionIndex ? event.target.value : value) })} /></Stack>)}</Stack>{question.type !== 'true-false' && <Button size="small" startIcon={<AddRounded />} onClick={() => addOption(index)} sx={{ mt: 1 }}>Add Option</Button>}</Box>}<TextField label="Points" type="number" inputProps={{ min: 1 }} value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} sx={{ width: 140 }} /></Stack></Paper>)}</Stack>
      {notice && <Typography color="success.main" sx={{ mt: 2 }}>{notice}</Typography>}{error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}<Button variant="contained" disabled={saving || !questions.length} onClick={saveAssessment} sx={{ mt: 3 }}>{saving ? 'Saving...' : 'Save Assessment'}</Button>
    </Paper>
  </Stack>
}

const TeacherPageContent: FC<{ pageKey: string }> = ({ pageKey }) => {
  const details = pageDetails[pageKey] || pageDetails.dashboard
  const [students, setStudents] = useState<{ id: string; fullName: string; gradeLevel: string; status: string }[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [assessments, setAssessments] = useState<{ id: string; title: string; className: string; questionCount: number; status: string }[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [assessmentsError, setAssessmentsError] = useState('')

  useEffect(() => {
    if (pageKey !== 'students') return
    setStudentsLoading(true)
    setStudentsError('')
    api.get<{ students: { id: string; fullName: string; gradeLevel: string; status: string }[] }>('/api/teacher/students', { withCredentials: true })
      .then(({ data }) => setStudents(data.students))
      .catch(() => setStudentsError('Unable to load students. Please try again.'))
      .finally(() => setStudentsLoading(false))
  }, [pageKey])

  useEffect(() => {
    if (pageKey !== 'assessments') return
    setAssessmentsLoading(true)
    setAssessmentsError('')
    api.get<{ assessments: { id: string; title: string; className: string; questionCount: number; status: string }[] }>('/api/teacher/assessments', { withCredentials: true })
      .then(({ data }) => setAssessments(data.assessments))
      .catch(() => setAssessmentsError('Unable to load assessments. Please try again.'))
      .finally(() => setAssessmentsLoading(false))
  }, [pageKey])

  if (pageKey === 'dashboard') return <>
    <Grid container spacing={2} sx={{ mb: 3 }}><Grid item xs={12} sm={4}><StatCard label="Assigned students" value="124" /></Grid><Grid item xs={12} sm={4}><StatCard label="Active materials" value="32" tone="secondary" /></Grid><Grid item xs={12} sm={4}><StatCard label="Pending grades" value="18" /></Grid></Grid>
    <Grid container spacing={2}><Grid item xs={12} md={7}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Today&apos;s timetable</Typography><Stack spacing={1.5} sx={{ mt: 2 }}>{[['08:00', 'Grade 8 · Mathematics', 'Room 204'], ['10:30', 'Grade 7 · Mathematics', 'Room 108'], ['13:00', 'Grade 9 · Mathematics', 'Room 301']].map(([time, className, room]) => <Stack key={time} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><Typography fontWeight={700}>{time}</Typography><Typography>{className}</Typography><Typography variant="body2" color="text.secondary">{room}</Typography></Stack>)}</Stack></Paper></Grid><Grid item xs={12} md={5}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Assessment progress</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>This week</Typography><Stack spacing={2.5} sx={{ mt: 3 }}>{[['Assignments graded', 72], ['Materials viewed', 84], ['Class participation', 68]].map(([label, value]) => <Box key={label as string}><Stack direction="row" justifyContent="space-between"><Typography variant="body2">{label}</Typography><Typography variant="body2" color="text.secondary">{value}%</Typography></Stack><LinearProgress variant="determinate" value={value as number} sx={{ mt: 0.75, height: 8, borderRadius: 4 }} /></Box>)}</Stack></Paper></Grid></Grid>
  </>
  if (pageKey === 'assessments/create') return <AssessmentBuilder />
  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Typography variant="h5">{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>{details.description}</Typography>
    {pageKey === 'students' || pageKey === 'materials' || pageKey === 'assessments' ? <>{studentsLoading && pageKey === 'students' && <LinearProgress sx={{ mb: 2 }} />}{studentsError && pageKey === 'students' && <Typography color="error" sx={{ mb: 2 }}>{studentsError}</Typography>}{assessmentsLoading && pageKey === 'assessments' && <LinearProgress sx={{ mb: 2 }} />}{assessmentsError && pageKey === 'assessments' && <Typography color="error" sx={{ mb: 2 }}>{assessmentsError}</Typography>}<TableContainer><Table><TableHead><TableRow>{(pageKey === 'students' ? ['Student', 'Class', 'Progress', 'Status'] : pageKey === 'materials' ? ['Material', 'Type', 'Assigned class', 'Status'] : ['Assessment', 'Class', 'Due date', 'Status']).map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{(pageKey === 'students' ? students.map((student) => [student.fullName, student.gradeLevel, '—', student.status]) : pageKey === 'materials' ? [['Algebra workbook', 'PDF', 'Grade 8', 'Published'], ['Linear equations video', 'Video', 'Grade 7', 'Published'], ['Practice worksheet', 'Document', 'Grade 9', 'Draft']] : assessments.map((assessment) => [assessment.title, `${assessment.className} · ${assessment.questionCount} questions`, '—', assessment.status])).map((row) => <TableRow hover key={row[0]}>{row.map((cell, index) => <TableCell key={cell}>{index === row.length - 1 ? <Chip size="small" label={cell} color={cell === 'Published' || cell === 'Open' || cell === 'On track' || cell === 'Active' ? 'success' : 'warning'} /> : cell}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer></> : <Grid container spacing={2}><Grid item xs={12} md={7}><TextField fullWidth label={pageKey.includes('password') ? 'New password' : 'Title'} type={pageKey.includes('password') ? 'password' : 'text'} /></Grid><Grid item xs={12} md={5}><Select fullWidth defaultValue="Grade 8" aria-label="Class"><MenuItem value="Grade 7">Grade 7</MenuItem><MenuItem value="Grade 8">Grade 8</MenuItem><MenuItem value="Grade 9">Grade 9</MenuItem></Select></Grid><Grid item xs={12}><Button variant="contained" startIcon={pageKey.includes('upload') ? <UploadFileOutlined /> : undefined}>{pageKey.includes('upload') ? 'Upload Material' : pageKey.includes('password') ? 'Update Password' : 'Save Changes'}</Button></Grid></Grid>}
  </Paper>
}

const TeacherPortal: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const pageKey = useMemo(() => getPageKey(location.pathname), [location.pathname])
  const details = pageDetails[pageKey] || pageDetails.dashboard
  const handleLogout = async () => { setProfileAnchor(null); await logout(); navigate('/login', { replace: true }) }

  return <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', display: 'flex' }}>
    <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: (theme) => theme.zIndex.drawer, width: 256, borderRight: 1, borderColor: 'divider' }}><SidebarContent currentPath={location.pathname} onNavigate={navigate} /></Box>
    <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}><SidebarContent currentPath={location.pathname} onNavigate={navigate} onClose={() => setMobileOpen(false)} /></Drawer>
    <Box component="section" sx={{ minWidth: 0, flex: 1, ml: { xs: 0, md: '256px' } }}>
      <Paper component="header" elevation={0} sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, px: { xs: 1.5, md: 3 }, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}><Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 2 }} sx={{ minHeight: 48, position: 'relative' }}><IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuRounded /></IconButton><Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, whiteSpace: 'nowrap' }}>{details.title}</Typography><Box sx={{ ml: { xs: 'auto', sm: 2 }, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', width: '100%', maxWidth: 440, px: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><SearchRounded sx={{ color: 'text.disabled', mr: 1 }} /><InputBase fullWidth placeholder="Search students, materials, assessments..." inputProps={{ 'aria-label': 'Search teacher portal' }} sx={{ py: 0.75, fontSize: '0.85rem' }} /></Box><Stack direction="row" alignItems="center" spacing={{ xs: 0.25, md: 1 }} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'background.paper', flexShrink: 0 }}><IconButton aria-label="Language" sx={{ display: { xs: 'none', md: 'inline-flex' } }}><TranslateOutlined /></IconButton><ThemeToggle /><IconButton aria-label="Notifications"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton><IconButton aria-label="Open profile menu" onClick={(event) => setProfileAnchor(event.currentTarget)}><AccountCircleOutlined color="primary" /></IconButton><Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><MenuItem onClick={() => { setProfileAnchor(null); navigate('/teacher/profile') }}>My Profile</MenuItem><MenuItem onClick={() => { setProfileAnchor(null); navigate('/teacher/change-password') }}>Change Password</MenuItem><MenuItem onClick={handleLogout}>Logout</MenuItem></Menu></Stack></Stack></Paper>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Teacher Portal</Typography><Typography variant="subtitle2" color="primary.main">{details.title}</Typography></Breadcrumbs><Stack spacing={0.5} sx={{ mb: 4 }}><Typography variant="h1" sx={{ fontSize: { xs: 30, md: 38 } }}>{details.title}</Typography><Typography color="text.secondary">{details.description}{user?.name ? ` Welcome back, ${user.name}.` : ''}</Typography></Stack><TeacherPageContent pageKey={pageKey} /></Container>
    </Box>
  </Box>
}

export default TeacherPortal
