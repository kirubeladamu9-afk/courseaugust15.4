import { useEffect, useMemo, useState, type FC, type FormEvent } from 'react'
import axios from 'axios'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Divider from '@mui/material/Divider'
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
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined'
import Avatar from '@mui/material/Avatar'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import MenuRounded from '@mui/icons-material/MenuRounded'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined'
import SlideshowOutlined from '@mui/icons-material/SlideshowOutlined'
import TableChartOutlined from '@mui/icons-material/TableChartOutlined'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
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
  { label: 'Materials', icon: <FolderOutlined fontSize="small" />, items: [{ label: 'Upload Material', path: '/teacher/materials/upload' }, { label: 'Material List', path: '/teacher/materials' }] },
  { label: 'Assessments', icon: <AssessmentOutlined fontSize="small" />, items: [{ label: 'Create Assessment', path: '/teacher/assessments/create' }, { label: 'Assign Assessment', path: '/teacher/assessments/assign' }, { label: 'My Assessments', path: '/teacher/assessments' }, { label: 'Student Results', path: '/teacher/assessments/results' }] },
]

const pageDetails: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Teacher Dashboard', description: 'Manage your classes, materials, and assessments from one place.' },
  students: { title: 'Student List', description: 'Review the students assigned to your classes.' },
  timetable: { title: 'Timetable', description: 'View your teaching schedule and upcoming classes.' },
  materials: { title: 'Material List', description: 'Manage the learning materials shared with your classes.' },
  'materials/upload': { title: 'Upload Material', description: 'Add a PDF, Word, PowerPoint, or Excel file for your students.' },
  assessments: { title: 'My Assessments', description: 'Review assessments and monitor student submissions.' },
  'assessments/results': { title: 'Student Results', description: 'Choose an assessment and academic year to review student grades.' },
  'assessments/create': { title: 'Create Assessment', description: 'Build an assessment for one of your classes.' },
  'assessments/assign': { title: 'Assign Assessment', description: 'Choose classes and due dates for an assessment.' },
  profile: { title: 'My Profile', description: 'Update your teacher profile information.' },
  'change-password': { title: 'Change Password', description: 'Keep your account secure with a new password.' },
}

const getPageKey = (pathname: string) => pathname.replace('/teacher/', '').replace('/teacher', 'dashboard') || 'dashboard'
const localDateTimeValue = (value: string) => {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const SidebarContent: FC<{ currentPath: string; onNavigate: (path: string) => void; onClose?: () => void }> = ({ currentPath, onNavigate, onClose }) => {
  const [expanded, setExpanded] = useState('Materials')
  const buttonSx = { justifyContent: 'flex-start', width: '100%', p: 1.25, borderRadius: 2, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const nestedSx = { justifyContent: 'flex-start', width: '100%', py: 0.85, pl: 2.75, borderRadius: 1.5, color: 'text.secondary', '&:hover': { backgroundColor: 'background.default' } }
  const isActive = (path: string) => currentPath === path
  const navigate = (path: string) => { onNavigate(path); onClose?.() }

  return <Box sx={{ width: 256, height: '100%', boxSizing: 'border-box', p: 3, backgroundColor: 'background.paper', overflowY: 'auto' }}>
    <Box sx={{ mb: 4 }}><Logo /></Box>
    <Typography variant="caption" color="text.disabled" sx={{ px: 1.25, textTransform: 'uppercase', letterSpacing: 0.8 }}>Teacher Portal</Typography>
    <Stack spacing={0.8} sx={{ mt: 1.25 }}>
      {portalItems.map((item) => <ButtonBase key={item.path} onClick={() => navigate(item.path)} sx={{ ...buttonSx, ...(isActive(item.path) ? { color: 'primary.contrastText', backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.main' } } : {}) }}><Box sx={{ display: 'flex', mr: 1.25 }}>{item.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{item.label}</Typography></ButtonBase>)}
      {portalGroups.map((group) => <Box key={group.label}>
        <ButtonBase onClick={() => setExpanded(expanded === group.label ? '' : group.label)} sx={{ ...buttonSx, mt: 0.5 }}><Box sx={{ display: 'flex', mr: 1.25, color: 'primary.main' }}>{group.icon}</Box><Typography variant="subtitle2" sx={{ fontSize: '0.86rem', fontWeight: 600 }}>{group.label}</Typography><Box sx={{ display: 'flex', ml: 'auto' }}>{expanded === group.label ? <ExpandLessRounded sx={{ fontSize: 17 }} /> : <ExpandMoreRounded sx={{ fontSize: 17 }} />}</Box></ButtonBase>
        <Collapse in={expanded === group.label} timeout="auto" unmountOnExit><Stack spacing={0.25} sx={{ mt: 0.25 }}>{group.items.map((item) => <ButtonBase key={item.path} onClick={() => navigate(item.path)} sx={{ ...nestedSx, ...(isActive(item.path) ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><Typography variant="subtitle2" sx={{ fontSize: '0.82rem' }}>{item.label}</Typography></ButtonBase>)}</Stack></Collapse>
      </Box>)}
    </Stack>
    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 1.25, mt: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Profile / Settings</Typography>
    <Stack spacing={0.8} sx={{ mt: 1.25 }}>
      <ButtonBase onClick={() => navigate('/teacher/profile')} sx={{ ...buttonSx, ...(isActive('/teacher/profile') ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><PersonOutlineRounded fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>My Profile</Typography></ButtonBase>
      <ButtonBase onClick={() => navigate('/teacher/change-password')} sx={{ ...buttonSx, ...(isActive('/teacher/change-password') ? { color: 'primary.main', backgroundColor: 'background.default' } : {}) }}><SettingsOutlined fontSize="small" sx={{ mr: 1.25 }} /><Typography variant="subtitle2" sx={{ fontSize: '0.78rem' }}>Change Password</Typography></ButtonBase>
    </Stack>
  </Box>
}

const StatCard: FC<{ label: string; value: string; tone?: 'primary' | 'secondary' }> = ({ label, value, tone = 'primary' }) => <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}><Typography variant="subtitle2" color="text.secondary">{label}</Typography><Typography variant="h3" color={`${tone}.main`} sx={{ mt: 1, fontSize: { xs: 26, md: 30 } }}>{value}</Typography></Paper>

type TeacherDashboardChartDatum = { label: string; value: number; hasSubmission?: boolean }

const DashboardBarChart: FC<{ data: TeacherDashboardChartDatum[]; color: string; ariaLabel: string }> = ({ data, color, ariaLabel }) => {
  if (!data.length) return <Typography color="text.secondary" sx={{ py: 4 }}>No data available yet.</Typography>
  const max = Math.max(...data.map((item) => item.value), 1)
  const chartWidth = 600
  const barWidth = chartWidth / data.length
  return <Box sx={{ mt: 2 }}>
    <Box sx={{ height: 220 }}><svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label={ariaLabel}><g color="currentColor"><line x1="0" x2="600" y1="55" y2="55" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="110" y2="110" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="165" y2="165" stroke="currentColor" strokeOpacity="0.12" />{data.map((item, index) => { const height = item.value ? Math.max(4, (item.value / max) * 170) : 2; return <rect key={item.label} x={index * barWidth + barWidth * 0.22} y={205 - height} width={barWidth * 0.56} height={height} rx="8" fill={color} /> })}</g></svg></Box>
    <Stack direction="row" spacing={1} justifyContent="space-around" sx={{ mt: -1 }}>{data.map((item) => <Box key={item.label} sx={{ minWidth: 0, textAlign: 'center', flex: 1 }}><Typography variant="caption" color="text.secondary" noWrap>{item.label}</Typography><Typography variant="subtitle2">{item.value.toLocaleString()}</Typography></Box>)}</Stack>
  </Box>
}

const DashboardLineChart: FC<{ data: TeacherDashboardChartDatum[]; color: string; ariaLabel: string }> = ({ data, color, ariaLabel }) => {
  if (!data.length) return <Typography color="text.secondary" sx={{ py: 4 }}>No student assessment data available yet.</Typography>
  const chartWidth = 600
  const chartPoints = data.map((item, index) => `${data.length === 1 ? chartWidth / 2 : index * (chartWidth / (data.length - 1))},${205 - (item.value / 100) * 170}`).join(' ')
  return <Box sx={{ mt: 2 }}>
    <Box sx={{ height: 220 }}><svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label={ariaLabel}><g color="currentColor"><line x1="0" x2="600" y1="35" y2="35" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="90" y2="90" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="145" y2="145" stroke="currentColor" strokeOpacity="0.12" /><line x1="0" x2="600" y1="205" y2="205" stroke="currentColor" strokeOpacity="0.12" /><polyline points={chartPoints} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{data.map((item, index) => { const x = data.length === 1 ? chartWidth / 2 : index * (chartWidth / (data.length - 1)); const y = 205 - (item.value / 100) * 170; return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="5" fill={item.hasSubmission === false ? '#9AA4B2' : color} /> })}</g></svg></Box>
    <Stack direction="row" spacing={1} justifyContent="space-around" sx={{ mt: -1 }}>{data.map((item, index) => <Box key={`${item.label}-${index}`} sx={{ minWidth: 0, textAlign: 'center', flex: 1 }}><Typography variant="caption" color="text.secondary" noWrap title={item.label}>{item.label}</Typography><Typography variant="subtitle2">{item.hasSubmission === false ? 'No submission' : `${item.value}%`}</Typography></Box>)}</Stack>
  </Box>
}

type QuestionType = 'single' | 'multiple' | 'true-false' | 'fill-blank'
type AssessmentType = 'Quiz' | 'Assignment' | 'Midterm Exam' | 'Final Exam' | 'Project'
type AssessmentQuestion = { type: QuestionType; prompt: string; options: string[]; correctAnswer: string | string[]; points: number }

const assessmentTypes: AssessmentType[] = ['Quiz', 'Assignment', 'Midterm Exam', 'Final Exam', 'Project']

const questionTypeLabels: Record<QuestionType, string> = { single: 'Multiple Choice (Single Answer)', multiple: 'Multiple Choice (Multiple Answers)', 'true-false': 'True / False', 'fill-blank': 'Fill in the Blank' }
const assessmentRules: Record<AssessmentType, { description: string; allowedQuestionTypes: QuestionType[]; typical: string; maxQuestions: number }> = {
  Quiz: { description: 'Short, frequent, low-stakes check of understanding.', allowedQuestionTypes: ['single', 'true-false', 'fill-blank'], typical: 'Typical: 5–10 questions; auto-graded.', maxQuestions: 10 },
  Assignment: { description: 'Homework-style task completed outside class time.', allowedQuestionTypes: ['single', 'multiple', 'fill-blank'], typical: 'Mix of auto-graded work; longer time window.', maxQuestions: 100 },
  'Midterm Exam': { description: 'Broader mid-term checkpoint covering multiple topics.', allowedQuestionTypes: ['single', 'multiple', 'true-false', 'fill-blank'], typical: 'Typical: 20–40 questions; timed and auto-graded.', maxQuestions: 40 },
  'Final Exam': { description: 'Comprehensive, high-stakes end-of-term assessment.', allowedQuestionTypes: ['single', 'multiple', 'true-false', 'fill-blank'], typical: 'Largest question count; strict time window.', maxQuestions: 100 },
  Project: { description: 'Longer-term file or link submission graded manually.', allowedQuestionTypes: [], typical: 'Projects do not use the question builder.', maxQuestions: 0 },
}

const newQuestion = (type: QuestionType): AssessmentQuestion => ({ type, prompt: '', options: type === 'true-false' ? ['True', 'False'] : type === 'fill-blank' ? [] : ['', '', '', ''], correctAnswer: type === 'multiple' ? [] : type === 'true-false' ? '0' : '', points: 1 })
const isQuestionComplete = (question: AssessmentQuestion) => {
  if (!question.prompt.trim() || !question.points) return false
  if (question.type === 'fill-blank') return typeof question.correctAnswer === 'string' && Boolean(question.correctAnswer.trim())
  if (question.options.length < 2 || question.options.some((option) => !option.trim())) return false
  return Array.isArray(question.correctAnswer) ? question.correctAnswer.length > 0 : Boolean(question.correctAnswer)
}

const AssessmentBuilder: FC = () => {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [title, setTitle] = useState('')
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Quiz')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('30')
  const [availableAssessmentTypes, setAvailableAssessmentTypes] = useState<AssessmentType[]>(assessmentTypes)
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
    api.get<{ assessmentTypes: { title: AssessmentType }[] }>('/api/teacher/assessment-types', { withCredentials: true })
      .then(({ data }) => {
        const types = data.assessmentTypes.map(({ title }) => title).filter((title): title is AssessmentType => assessmentTypes.includes(title))
        if (types.length) {
          setAvailableAssessmentTypes(types)
          setAssessmentType((current) => types.includes(current) ? current : types[0])
        }
      })
      .catch(() => setAvailableAssessmentTypes(assessmentTypes))
  }, [])

  useEffect(() => {
    api.get<{ classes: string[] }>('/api/teacher/assigned-classes', { withCredentials: true })
      .then(({ data }) => { setAssignedClasses(data.classes); setClassName(data.classes[0] || '') })
      .catch(() => setError('Unable to load your assigned classes. Please try again.'))
      .finally(() => setClassesLoading(false))
  }, [])

  useEffect(() => {
    if (!editId) return
    api.get<{ assessment: { title: string; assessmentType: AssessmentType; timeLimitMinutes: number; className: string; subjectName: string; questions: AssessmentQuestion[] } }>(`/api/teacher/assessments/${editId}`, { withCredentials: true })
      .then(({ data }) => {
        setTitle(data.assessment.title)
        setAssessmentType(data.assessment.assessmentType)
        setTimeLimitMinutes(String(data.assessment.timeLimitMinutes))
        setClassName(data.assessment.className)
        setSubjectName(data.assessment.subjectName)
        setQuestions(data.assessment.questions)
      })
      .catch(() => setError('Unable to load the assessment for editing. Please try again.'))
  }, [editId])

  const currentRules = assessmentRules[assessmentType]
  const updateQuestion = (index: number, update: Partial<AssessmentQuestion>) => setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...update } : question))
  const handleAssessmentTypeChange = (nextType: AssessmentType) => {
    setAssessmentType(nextType)
    const nextRules = assessmentRules[nextType]
    if (!nextRules.allowedQuestionTypes.includes(questionType)) setQuestionType(nextRules.allowedQuestionTypes[0] || 'single')
    if (!nextRules.allowedQuestionTypes.length) setQuestions([])
  }
  const addQuestion = () => {
    if (!currentRules.allowedQuestionTypes.length || questions.length >= currentRules.maxQuestions) {
      setError(`${assessmentType} allows up to ${currentRules.maxQuestions} questions.`)
      return
    }
    setQuestions((current) => [...current, newQuestion(questionType)])
    setNotice('Question added. Complete it and click Save Assessment to insert it into the database.')
  }
  const addOption = (index: number) => setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, options: [...question.options, ''] } : question))
  const removeQuestion = (index: number) => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))
  const saveAssessment = async () => {
    if (!title.trim() || !subjectName || !className || !timeLimitMinutes || Number(timeLimitMinutes) < 1 || Number(timeLimitMinutes) > 1440 || (assessmentType !== 'Project' && (!questions.length || questions.length > currentRules.maxQuestions || questions.some((question) => !currentRules.allowedQuestionTypes.includes(question.type) || !isQuestionComplete(question))))) {
      setError(assessmentType === 'Project' ? 'Add a title, assigned subject, and assigned class before saving.' : `Add a title, assigned subject, assigned class, and valid ${assessmentType} questions before saving.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { title, assessmentType, timeLimitMinutes: Number(timeLimitMinutes), subjectName, className, questions }
      if (editId) {
        await api.patch(`/api/teacher/assessments/${editId}`, payload, { withCredentials: true })
        setNotice('Assessment updated successfully.')
      } else {
        await api.post('/api/teacher/assessments', payload, { withCredentials: true })
        setNotice('Assessment saved as a draft.')
      }
    } catch {
      setError('Unable to save the assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  return <Stack spacing={2}>
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth label="Title" value={title} onChange={(event) => setTitle(event.target.value)} /></Grid><Grid item xs={12} md={3}><Select fullWidth value={assessmentType} onChange={(event) => handleAssessmentTypeChange(event.target.value as AssessmentType)} aria-label="Assessment type">{availableAssessmentTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</Select></Grid><Grid item xs={12} md={3}><Select fullWidth value={subjectName} disabled={subjectsLoading || !assignedSubjects.length} onChange={(event) => setSubjectName(event.target.value)} displayEmpty aria-label="Assigned subject"><MenuItem value="" disabled>{subjectsLoading ? 'Loading assigned subjects...' : assignedSubjects.length ? 'Select an assigned subject' : 'No assigned subjects'}</MenuItem>{assignedSubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</Select></Grid><Grid item xs={12} md={3}><Select fullWidth value={className} disabled={classesLoading || !assignedClasses.length} onChange={(event) => setClassName(event.target.value)} displayEmpty aria-label="Assigned class"><MenuItem value="" disabled>{classesLoading ? 'Loading assigned classes...' : assignedClasses.length ? 'Select an assigned class' : 'No assigned classes'}</MenuItem>{assignedClasses.map((assignedClass) => <MenuItem key={assignedClass} value={assignedClass}>{assignedClass}</MenuItem>)}</Select></Grid></Grid><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{currentRules.description} {currentRules.typical}</Typography></Paper>
    {assessmentType !== 'Project' && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between"><Box><Typography variant="h5">Questions</Typography><Typography variant="body2" color="text.secondary">Choose a type before adding each question.</Typography></Box><Stack direction="row" spacing={1}><Select size="small" value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)} aria-label="Question Type">{currentRules.allowedQuestionTypes.map((type) => <MenuItem key={type} value={type}>{questionTypeLabels[type]}</MenuItem>)}</Select><Button variant="contained" startIcon={<AddRounded />} onClick={addQuestion} disabled={!assignedClasses.length || !assignedSubjects.length || questions.length >= currentRules.maxQuestions || !currentRules.allowedQuestionTypes.length}>Add Question</Button><Button variant="outlined" onClick={saveAssessment} disabled={saving || !questions.length}>{saving ? 'Saving...' : editId ? 'Update Assessment' : 'Save Assessment'}</Button></Stack></Stack>
      <Stack spacing={2} sx={{ mt: 3 }}>{questions.map((question, index) => <Paper key={`${index}-${question.type}`} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="subtitle1" fontWeight={700}>Question {index + 1} · {questionTypeLabels[question.type]}</Typography><IconButton aria-label={`Remove question ${index + 1}`} onClick={() => removeQuestion(index)}><DeleteOutlineRounded /></IconButton></Stack><Stack spacing={2}><TextField fullWidth multiline minRows={2} label="Question text" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} />{question.type === 'fill-blank' ? <TextField fullWidth label="Correct answer" helperText="Answers are graded case-insensitively after trimming whitespace." value={question.correctAnswer as string} onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })} /> : <Box><Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Answer choices</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Select the correct answer{question.type === 'multiple' ? 's' : ''} for automatic grading.</Typography><Stack spacing={1}>{question.options.map((option, optionIndex) => <Stack direction="row" spacing={1} alignItems="center" key={`${index}-${optionIndex}`}><FormControlLabel label="" control={question.type === 'multiple' ? <Checkbox checked={(question.correctAnswer as string[]).includes(String(optionIndex))} onChange={(event) => { const current = question.correctAnswer as string[]; updateQuestion(index, { correctAnswer: event.target.checked ? [...current, String(optionIndex)] : current.filter((value) => value !== String(optionIndex)) }) }} /> : <Radio checked={question.correctAnswer === String(optionIndex)} onChange={() => updateQuestion(index, { correctAnswer: String(optionIndex) })} />} /><TextField fullWidth size="small" label={`Option ${String.fromCharCode(65 + optionIndex)}`} value={option} disabled={question.type === 'true-false'} onChange={(event) => updateQuestion(index, { options: question.options.map((value, valueIndex) => valueIndex === optionIndex ? event.target.value : value) })} /></Stack>)}</Stack>{question.type !== 'true-false' && <Button size="small" startIcon={<AddRounded />} onClick={() => addOption(index)} sx={{ mt: 1 }}>Add Option</Button>}</Box>}<TextField label="Points" type="number" inputProps={{ min: 1 }} value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} sx={{ width: 140 }} /></Stack></Paper>)}</Stack>
      {notice && <Typography color="success.main" sx={{ mt: 2 }}>{notice}</Typography>}{error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}<Button variant="contained" disabled={saving} onClick={saveAssessment} sx={{ mt: 3 }}>{saving ? 'Saving...' : editId ? 'Update Assessment' : 'Save Assessment'}</Button>
    </Paper>}
  </Stack>
}

const AssignmentBuilder: FC = () => {
  const [assessments, setAssessments] = useState<{ id: string; title: string }[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [assessmentId, setAssessmentId] = useState('')
  const [className, setClassName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [assignedAssessments, setAssignedAssessments] = useState<{ id: string; assessmentId: string; assessment: string; className: string; dueDate: string; timeLimitMinutes: number; startsAt: string; endsAt: string; status: string }[]>([])
  const [editingAssignmentId, setEditingAssignmentId] = useState('')
  const [deletingAssignmentId, setDeletingAssignmentId] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<{ assessments: { id: string; title: string }[] }>('/api/teacher/assessments', { withCredentials: true }),
      api.get<{ classes: string[] }>('/api/teacher/assigned-classes', { withCredentials: true }),
      api.get<{ assignments: { id: string; assessmentId: string; assessment: string; className: string; dueDate: string; timeLimitMinutes: number; startsAt: string; endsAt: string; status: string }[] }>('/api/teacher/assessments/assignments', { withCredentials: true }),
    ])
      .then(([assessmentResponse, classResponse, assignmentResponse]) => {
        setAssessments(assessmentResponse.data.assessments)
        setClasses(classResponse.data.classes)
        setAssessmentId(assessmentResponse.data.assessments[0]?.id || '')
        setClassName(classResponse.data.classes[0] || '')
        setAssignedAssessments(assignmentResponse.data.assignments)
      })
      .catch(() => setError('Unable to load assessments and assigned classes. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const editAssignment = (assignment: { id: string; assessmentId: string; className: string; dueDate: string; timeLimitMinutes: number }) => {
    setEditingAssignmentId(assignment.id)
    setAssessmentId(assignment.assessmentId)
    setClassName(assignment.className)
    setDueDate(localDateTimeValue(assignment.dueDate))
    setTimeLimitMinutes(String(assignment.timeLimitMinutes))
    setNotice('Edit the assignment details and save your changes.')
    setError('')
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Delete this assigned assessment? This action cannot be undone.')) return
    setDeletingAssignmentId(assignmentId)
    setError('')
    try {
      await api.delete(`/api/teacher/assessments/assignments/${assignmentId}`, { withCredentials: true })
      setAssignedAssessments((current) => current.filter((assignment) => assignment.id !== assignmentId))
      if (editingAssignmentId === assignmentId) {
        setEditingAssignmentId('')
        setDueDate('')
        setTimeLimitMinutes('')
      }
      setNotice('Assigned assessment deleted successfully.')
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to delete the assigned assessment.' : 'Unable to delete the assigned assessment.')
    } finally {
      setDeletingAssignmentId('')
    }
  }

  const assignAssessment = async () => {
    if (!assessmentId || !className || !dueDate || !timeLimitMinutes) {
      setError('Select an assessment, class, due date, and time limit before assigning.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingAssignmentId) {
        await api.patch(`/api/teacher/assessments/assignments/${editingAssignmentId}`, { assessmentId, className, dueDate: new Date(dueDate).toISOString(), timeLimitMinutes: Number(timeLimitMinutes) }, { withCredentials: true })
      } else {
        await api.post(`/api/teacher/assessments/${assessmentId}/assign`, { className, dueDate: new Date(dueDate).toISOString(), timeLimitMinutes: Number(timeLimitMinutes) }, { withCredentials: true })
      }
      const { data } = await api.get<{ assignments: { id: string; assessmentId: string; assessment: string; className: string; dueDate: string; timeLimitMinutes: number; startsAt: string; endsAt: string; status: string }[] }>('/api/teacher/assessments/assignments', { withCredentials: true })
      setAssignedAssessments(data.assignments)
      setEditingAssignmentId('')
      setDueDate('')
      setTimeLimitMinutes('')
      setNotice(editingAssignmentId ? 'Assigned assessment updated successfully.' : 'Assessment assigned successfully.')
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to assign the assessment.' : 'Unable to assign the assessment.')
    } finally {
      setSaving(false)
    }
  }

  return <Stack spacing={2}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Assign Assessment</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Choose a saved assessment, assigned class, due date, and time limit.</Typography>{loading ? <LinearProgress /> : <Grid container spacing={2}><Grid item xs={12} md={5}><Select fullWidth value={assessmentId} disabled={!assessments.length} onChange={(event) => setAssessmentId(event.target.value)} displayEmpty aria-label="Assessment"><MenuItem value="" disabled>{assessments.length ? 'Select an assessment' : 'No saved assessments'}</MenuItem>{assessments.map((assessment) => <MenuItem key={assessment.id} value={assessment.id}>{assessment.title}</MenuItem>)}</Select></Grid><Grid item xs={12} md={4}><Select fullWidth value={className} disabled={!classes.length} onChange={(event) => setClassName(event.target.value)} displayEmpty aria-label="Class"><MenuItem value="" disabled>{classes.length ? 'Select an assigned class' : 'No assigned classes'}</MenuItem>{classes.map((assignedClass) => <MenuItem key={assignedClass} value={assignedClass}>{assignedClass}</MenuItem>)}</Select></Grid><Grid item xs={12} md={3}><TextField fullWidth required label="Due date and time" type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} inputProps={{ 'aria-label': 'Due date' }} InputLabelProps={{ shrink: true }} /></Grid><Grid item xs={12} md={3}><TextField fullWidth required label="Time limit (minutes)" type="number" value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} inputProps={{ min: 1, max: 1440, 'aria-label': 'Time limit in minutes' }} /></Grid><Grid item xs={12}><Button variant="contained" onClick={assignAssessment} disabled={saving || !assessments.length || !classes.length}>{saving ? editingAssignmentId ? 'Updating...' : 'Assigning...' : editingAssignmentId ? 'Update Assignment' : 'Assign Assessment'}</Button></Grid></Grid>}{notice && <Typography color="success.main" sx={{ mt: 2 }}>{notice}</Typography>}{error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}</Paper><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Assigned Assessment</Typography>{assignedAssessments.length ? <TableContainer sx={{ mt: 2 }}><Table><TableHead><TableRow>{['Assessment', 'Class', 'Due date', 'Status', 'Actions'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{assignedAssessments.map((assignment) => <TableRow hover key={assignment.id}><TableCell>{assignment.assessment}</TableCell><TableCell>{assignment.className}</TableCell><TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell><TableCell><Chip size="small" label={assignment.status} color="success" /></TableCell><TableCell><Stack direction="row" spacing={0.5}><Button size="small" startIcon={<EditOutlined />} onClick={() => editAssignment(assignment)}>Edit</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteAssignment(assignment.id)} disabled={deletingAssignmentId === assignment.id}>{deletingAssignmentId === assignment.id ? 'Deleting...' : 'Delete'}</Button></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Typography color="text.secondary" sx={{ mt: 1 }}>No assessments assigned yet.</Typography>}</Paper></Stack>
}

type MaterialRecord = { id: string; title: string; className: string; subjectName: string; description: string; fileName: string; fileExtension: string; assignmentScope: 'Whole Class' | 'Specific Students'; studentCount: number; uploadedAt: string; status: string }
type MaterialStudent = { id: string; fullName: string; admissionNumber: string }

const materialFileAccept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'
const materialFileExtensions = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
const materialFileUrl = (materialId: string) => `${api.defaults.baseURL || ''}/api/teacher/materials/${materialId}/file`
const materialFileIcon = (extension: string) => extension === 'pdf' ? <PictureAsPdfOutlined color="error" /> : ['ppt', 'pptx'].includes(extension) ? <SlideshowOutlined color="warning" /> : ['xls', 'xlsx'].includes(extension) ? <TableChartOutlined color="success" /> : <DescriptionOutlined color="primary" />
const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const MaterialUploadPage: FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [assignmentScope, setAssignmentScope] = useState<'Whole Class' | 'Specific Students'>('Whole Class')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [assignedClasses, setAssignedClasses] = useState<string[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [students, setStudents] = useState<MaterialStudent[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const uploadedAt = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()), [])

  useEffect(() => {
    Promise.all([
      api.get<{ classes: string[] }>('/api/teacher/assigned-classes', { withCredentials: true }),
      api.get<{ subjects: string[] }>('/api/teacher/assigned-subjects', { withCredentials: true }),
    ]).then(([classResponse, subjectResponse]) => {
      setAssignedClasses(classResponse.data.classes)
      setAssignedSubjects(subjectResponse.data.subjects)
      setClassName(classResponse.data.classes[0] || '')
      setSubjectName(subjectResponse.data.subjects[0] || '')
    }).catch(() => setError('Unable to load your assigned classes and subjects. Please try again.')).finally(() => setLoadingAssignments(false))
  }, [])

  useEffect(() => {
    if (!className) {
      setStudents([])
      setSelectedStudentIds([])
      return
    }
    setLoadingStudents(true)
    setStudents([])
    setSelectedStudentIds([])
    api.get<{ students: MaterialStudent[] }>('/api/teacher/material-students', { params: { className }, withCredentials: true })
      .then(({ data }) => setStudents(data.students))
      .catch(() => setError('Unable to load students for the selected class. Please try again.'))
      .finally(() => setLoadingStudents(false))
  }, [className])

  const selectFile = (nextFile: File | null) => {
    setError('')
    setNotice('')
    if (!nextFile) {
      setFile(null)
      return
    }
    const extension = nextFile.name.split('.').pop()?.toLowerCase() || ''
    if (!materialFileExtensions.has(extension)) {
      setFile(null)
      setError('Only PDF, Word, PowerPoint, and Excel files are supported.')
      return
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setFile(null)
      setError('The selected file must be 20 MB or smaller.')
      return
    }
    setFile(nextFile)
  }

  const submitMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!title.trim() || !className || !subjectName || !file || (assignmentScope === 'Specific Students' && !selectedStudentIds.length)) {
      setError(assignmentScope === 'Specific Students' && !selectedStudentIds.length ? 'Select at least one student for a specific-student assignment.' : 'Add a title, assigned class, subject, and file before uploading.')
      return
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!materialFileExtensions.has(extension)) {
      setError('Only PDF, Word, PowerPoint, and Excel files are supported.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('The selected file must be 20 MB or smaller.')
      return
    }

    setSaving(true)
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read the selected file.'))
        reader.onerror = () => reject(new Error('Unable to read the selected file.'))
        reader.readAsDataURL(file)
      })
      await api.post('/api/teacher/materials', { title: title.trim(), className, subjectName, description: description.trim(), fileName: file.name, fileData, assignmentScope, studentIds: assignmentScope === 'Specific Students' ? selectedStudentIds : [] }, { withCredentials: true })
      setNotice('Material uploaded successfully.')
      setTitle('')
      setDescription('')
      setFile(null)
      setSelectedStudentIds([])
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to upload the material. Please try again.' : 'Unable to read the selected file. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <Stack spacing={2}>
    <Paper component="form" onSubmit={submitMaterial} elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}><Box><Typography variant="h5">Material details</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Share a document with an assigned class or selected students.</Typography></Box><Button variant="outlined" onClick={() => navigate('/teacher/materials')}>View material list</Button></Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {loadingAssignments ? <LinearProgress /> : <Grid container spacing={2}><Grid item xs={12} md={6}><TextField fullWidth required label="Title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={saving} /></Grid><Grid item xs={12} md={3}><TextField fullWidth select required label="Class" value={className} disabled={saving || !assignedClasses.length} onChange={(event) => setClassName(event.target.value)} helperText={assignedClasses.length ? 'Only your assigned classes are shown.' : 'No classes are assigned to you.'}>{assignedClasses.map((assignedClass) => <MenuItem key={assignedClass} value={assignedClass}>{assignedClass}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><TextField fullWidth select required label="Subject" value={subjectName} disabled={saving || !assignedSubjects.length} onChange={(event) => setSubjectName(event.target.value)} helperText={assignedSubjects.length ? 'Only your assigned subjects are shown.' : 'No subjects are assigned to you.'}>{assignedSubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</TextField></Grid><Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving} /></Grid><Grid item xs={12} md={7}><Button component="label" variant="outlined" startIcon={<UploadFileOutlined />} disabled={saving} sx={{ minHeight: 56, px: 2.5 }}>{file ? `${file.name} · ${formatFileSize(file.size)}` : 'Choose document file'}<input hidden type="file" accept={materialFileAccept} onChange={(event) => selectFile(event.target.files?.[0] || null)} /></Button><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>PDF, Word, PowerPoint, or Excel · Maximum 20 MB</Typography></Grid><Grid item xs={12} md={5}><TextField fullWidth label="Upload date" value={uploadedAt} InputProps={{ readOnly: true }} helperText="Set automatically when you upload." /></Grid></Grid>}
      {!loadingAssignments && <Box sx={{ mt: 3 }}><Typography variant="subtitle1" fontWeight={700}>Assignment scope</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }} sx={{ mt: 0.5 }}><FormControlLabel value="Whole Class" control={<Radio checked={assignmentScope === 'Whole Class'} onChange={() => { setAssignmentScope('Whole Class'); setSelectedStudentIds([]) }} />} label="Whole Class" /><FormControlLabel value="Specific Students" control={<Radio checked={assignmentScope === 'Specific Students'} onChange={() => setAssignmentScope('Specific Students')} />} label="Specific Students" /></Stack>{assignmentScope === 'Specific Students' && <Box sx={{ mt: 1.5, maxWidth: 720 }}><TextField fullWidth select SelectProps={{ multiple: true, renderValue: (selected) => (selected as string[]).map((studentId) => students.find((student) => student.id === studentId)?.fullName).filter(Boolean).join(', ') }} label="Students" value={selectedStudentIds} onChange={(event) => setSelectedStudentIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)} disabled={loadingStudents || !students.length || saving} helperText={loadingStudents ? 'Loading students...' : students.length ? 'Choose one or more students from the selected class.' : 'No active students are available in this class.'}>{students.map((student) => <MenuItem key={student.id} value={student.id}><Checkbox checked={selectedStudentIds.includes(student.id)} />{student.fullName} · {student.admissionNumber}</MenuItem>)}</TextField></Box>}</Box>}
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}><Button type="button" onClick={() => navigate('/teacher/materials')} disabled={saving}>Cancel</Button><Button type="submit" variant="contained" startIcon={<UploadFileOutlined />} disabled={saving || loadingAssignments || !assignedClasses.length || !assignedSubjects.length}>{saving ? 'Uploading...' : 'Upload material'}</Button></Stack>
    </Paper>
  </Stack>
}

const MaterialListPage: FC = () => {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  useEffect(() => {
    api.get<{ materials: MaterialRecord[] }>('/api/teacher/materials', { withCredentials: true })
      .then(({ data }) => setMaterials(data.materials))
      .catch(() => setError('Unable to load your materials. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}><Box><Typography variant="h5">Material list</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Documents shared with your classes and selected students.</Typography></Box><Button variant="contained" startIcon={<AddRounded />} onClick={() => navigate('/teacher/materials/upload')}>Upload material</Button></Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!loading && !error && (materials.length ? <TableContainer><Table><TableHead><TableRow>{['File', 'Subject', 'Uploaded date', 'Audience', 'Actions'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{materials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((material) => <TableRow key={material.id}><TableCell><Stack direction="row" spacing={1.25} alignItems="center"><Box sx={{ display: 'flex' }}>{materialFileIcon(material.fileExtension)}</Box><Box><Typography fontWeight={700}>{material.title}</Typography><Typography variant="caption" color="text.secondary">{material.fileName}</Typography></Box></Stack></TableCell><TableCell>{material.subjectName}</TableCell><TableCell>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(material.uploadedAt))}</TableCell><TableCell><Typography variant="body2">{material.className}</Typography><Typography variant="caption" color="text.secondary">{material.assignmentScope === 'Whole Class' ? 'Whole class' : `${material.studentCount} selected student${material.studentCount === 1 ? '' : 's'}`}</Typography></TableCell><TableCell><Stack direction="row" spacing={1}>{material.fileExtension === 'pdf' && <Button size="small" component="a" href={materialFileUrl(material.id)} target="_blank" rel="noreferrer">View</Button>}<Button size="small" variant="outlined" component="a" href={materialFileUrl(material.id)} download>Download</Button></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Box sx={{ py: 5, textAlign: 'center' }}><UploadFileOutlined color="disabled" sx={{ fontSize: 38 }} /><Typography color="text.secondary" sx={{ mt: 1 }}>No materials have been uploaded yet.</Typography></Box>)}
    {!loading && !error && materials.length > 0 && <TablePagination component="div" count={materials.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }} rowsPerPageOptions={[5, 10, 25]} />}
  </Paper>
}

const TeacherProfilePage: FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const initials = user?.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'TR'
  const lastLogin = user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'

  useEffect(() => {
    api.get<{ photoName: string | null; status: string | null }>('/api/teacher/profile', { withCredentials: true }).then(({ data }) => { setProfilePhoto(data.photoName); setProfileStatus(data.status) }).catch(() => { setProfilePhoto(null); setProfileStatus(null) })
    Promise.all([
      api.get<{ subjects: string[] }>('/api/teacher/assigned-subjects', { withCredentials: true }),
      api.get<{ classes: string[] }>('/api/teacher/assigned-classes', { withCredentials: true }),
    ]).then(([subjectsResponse, classesResponse]) => {
      setSubjects(subjectsResponse.data.subjects)
      setClasses(classesResponse.data.classes)
    }).finally(() => setLoading(false))
  }, [])

  const photoSource = profilePhoto?.startsWith('data:image/') || profilePhoto?.startsWith('https://') ? profilePhoto : undefined

  return <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
    <ButtonBase onClick={() => navigate('/teacher')} sx={{ mb: 3, color: 'text.secondary', borderRadius: 1, p: 0.5, '&:hover': { color: 'primary.main' } }}><ArrowBackRounded sx={{ fontSize: 18, mr: 0.5 }} /><Typography variant="subtitle2">Back to dashboard</Typography></ButtonBase>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={2.5}><Avatar src={photoSource} alt={`${user?.name || 'Teacher'} profile photo`} sx={{ width: 88, height: 88, backgroundColor: 'primary.main', fontSize: 30, fontWeight: 700 }}>{initials}</Avatar><Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}><Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, mb: 0.5 }}>{user?.name || 'Teacher'}</Typography><Stack direction="row" justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" spacing={1} sx={{ mb: 1 }}><Chip label="Teacher" size="small" color="primary" /><Chip label={profileStatus || (user?.status === 'active' ? 'Active' : user?.status || 'Unknown status')} size="small" sx={{ backgroundColor: 'rgba(50, 220, 136, 0.16)', color: '#32dc88' }} /></Stack><Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={0.75}><EmailOutlined sx={{ fontSize: 17, color: 'text.secondary' }} /><Typography variant="body2" color="text.secondary">{user?.email || 'No email available'}</Typography></Stack></Box></Stack>
    <Divider sx={{ my: 3 }} />
    <Grid container spacing={2}><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><ScheduleOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Last login</Typography><Typography variant="subtitle2">{lastLogin}</Typography></Box></Stack></Grid><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><ShieldOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Access level</Typography><Typography variant="subtitle2">Teacher portal access</Typography></Box></Stack></Grid><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><PeopleAltOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Assigned classes</Typography><Typography variant="subtitle2">{loading ? 'Loading...' : classes.length || 'None assigned'}</Typography></Box></Stack></Grid></Grid>
    <Divider sx={{ my: 3 }} />
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}><PersonOutlineRounded color="primary" /><Typography variant="h4">Personal Information</Typography></Stack>
    <Grid container spacing={2}><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Full name</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.name || 'Not available'}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Username</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.username || 'Not available'}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Email address</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.email || 'Not available'}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Role</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>Teacher</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Assigned subjects</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{loading ? 'Loading...' : subjects.join(', ') || 'None assigned'}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Assigned classes</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{loading ? 'Loading...' : classes.join(', ') || 'None assigned'}</Typography></Grid></Grid>
  </Paper>
}

const ChangePasswordPage: FC = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<{ message: string }>('/api/teacher/change-password', { currentPassword, newPassword }, { withCredentials: true })
      setSuccess(data.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to update your password.' : 'Unable to update your password.')
    } finally {
      setSaving(false)
    }
  }

  return <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, maxWidth: 640 }}>
    <Typography variant="h5">Change Password</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Use a strong password that you do not use on another account.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    <Stack spacing={2}><TextField fullWidth required disabled={saving} label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /><TextField fullWidth required disabled={saving} label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText="At least 8 characters" autoComplete="new-password" /><TextField fullWidth required disabled={saving} label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Updating password...' : 'Update Password'}</Button></Stack>
  </Paper>
}

const TeacherDashboard: FC = () => {
  const [dashboard, setDashboard] = useState<{ assignedStudents: number; activeMaterials: number; pendingGrades: number; upcomingAssignments: { id: string; assessment: string; className: string; dueDate: string; status: string }[]; studentGradeChart: TeacherDashboardChartDatum[]; materialChart: TeacherDashboardChartDatum[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ assignedStudents: number; activeMaterials: number; pendingGrades: number; upcomingAssignments: { id: string; assessment: string; className: string; dueDate: string; status: string }[]; studentGradeChart: TeacherDashboardChartDatum[]; materialChart: TeacherDashboardChartDatum[] }>('/api/teacher/dashboard', { withCredentials: true })
      .then(({ data }) => setDashboard(data))
      .catch(() => setError('Unable to load your dashboard data. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = dashboard || { assignedStudents: 0, activeMaterials: 0, pendingGrades: 0, upcomingAssignments: [], studentGradeChart: [], materialChart: [] }
  return <>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Grid container spacing={2} sx={{ mb: 3 }}><Grid item xs={12} sm={4}><StatCard label="Assigned students" value={loading ? '—' : stats.assignedStudents.toLocaleString()} /></Grid><Grid item xs={12} sm={4}><StatCard label="Active materials" value={loading ? '—' : stats.activeMaterials.toLocaleString()} tone="secondary" /></Grid><Grid item xs={12} sm={4}><StatCard label="Pending grades" value={loading ? '—' : stats.pendingGrades.toLocaleString()} /></Grid></Grid>
    <Grid container spacing={2} sx={{ mb: 3 }}><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Student grades</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Highest and lowest student grades, plus students who did not take an assessment.</Typography>{loading ? <LinearProgress sx={{ mt: 3 }} /> : <DashboardLineChart data={stats.studentGradeChart} color="#127C71" ariaLabel="Student assessment grades chart" />}</Paper></Grid><Grid item xs={12} md={6}><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Materials by subject</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Published learning materials shared with students.</Typography>{loading ? <LinearProgress sx={{ mt: 3 }} /> : <DashboardBarChart data={stats.materialChart} color="#F5B82E" ariaLabel="Published materials by subject chart" />}</Paper></Grid></Grid>
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography variant="h5">Upcoming assignments</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Assignments scheduled for your classes.</Typography>{loading ? <LinearProgress sx={{ mt: 3 }} /> : stats.upcomingAssignments.length ? <Stack spacing={1.5} sx={{ mt: 2 }}>{stats.upcomingAssignments.map((assignment) => <Stack key={assignment.id} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><Typography fontWeight={700}>{assignment.assessment}</Typography><Typography>{assignment.className}</Typography><Typography variant="body2" color="text.secondary">Due {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(assignment.dueDate))}</Typography><Chip label={assignment.status} size="small" /></Stack>)}</Stack> : <Typography color="text.secondary" sx={{ mt: 3 }}>No upcoming assignments.</Typography>}</Paper>
  </>
}

type AssessmentResult = { id: string; fullName: string; photoName: string | null; admissionNumber: string; academicYear: string; classSection: string; earnedPoints: number | null; totalPoints: number; grade: number | null }
type AssessmentResultAssessment = { id: string; title: string; assessmentType: string; className: string; dueDate: string; status: string; results: AssessmentResult[] }

const AssessmentResultsPage: FC = () => {
  const [assessments, setAssessments] = useState<AssessmentResultAssessment[]>([])
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const [academicYear, setAcademicYear] = useState('')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<{ academicYears: string[]; assessments: AssessmentResultAssessment[] }>('/api/teacher/assessment-results', { params: academicYear ? { academicYear } : undefined, withCredentials: true })
      .then(({ data }) => {
        setAcademicYears(data.academicYears)
        setAssessments(data.assessments)
        setSelectedAssessmentId((current) => data.assessments.some((assessment) => assessment.id === current) ? current : data.assessments[0]?.id || '')
      })
      .catch(() => setError('Unable to load assessment results. Please try again.'))
      .finally(() => setLoading(false))
  }, [academicYear])

  const gradeStatus = (grade: number | null) => {
    if (grade === null) return { label: 'Did not take', color: 'default' as const }
    if (grade >= 75) return { label: 'High grade', color: 'success' as const }
    if (grade < 50) return { label: 'Lower grade', color: 'error' as const }
    return { label: 'Developing', color: 'warning' as const }
  }

  const downloadGradeReport = (assessment: AssessmentResultAssessment) => {
    const pdfText = (value: unknown) => String(value ?? '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?')
    const studentLines = assessment.results.flatMap((student, index) => {
      const status = gradeStatus(student.grade)
      const points = student.earnedPoints === null ? 'Not submitted' : `${student.earnedPoints}/${student.totalPoints}`
      return [`${index + 1}. ${student.fullName}`, `   Student ID: ${student.admissionNumber}`, `   Class & section: ${student.classSection}   Academic year: ${student.academicYear}`, `   Points: ${points}   Grade: ${student.grade === null ? 'No grade' : `${student.grade}%`}   Result: ${status.label}`, '']
    })
    const reportLines = ['Student Grade Report', '', `Assessment: ${assessment.title}`, `Assessment type: ${assessment.assessmentType}`, `Class: ${assessment.className}`, `Academic year: ${academicYear || 'All academic years'}`, '', 'Student grades', '', ...(studentLines.length ? studentLines : ['No students match this academic year for this assessment.'])]
    const pages = Array.from({ length: Math.max(1, Math.ceil(reportLines.length / 42)) }, (_, index) => reportLines.slice(index * 42, (index + 1) * 42))
    const pageObjectNumbers = pages.map((_, index) => 3 + index * 2)
    const fontObjectNumber = 3 + pages.length * 2
    const objects: string[] = []
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
    objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pages.length} >>`
    pages.forEach((page, index) => {
      const pageObjectNumber = pageObjectNumbers[index]
      const content = `BT\n/F1 11 Tf\n15 TL\n48 750 Td\n${page.map((line) => `(${pdfText(line)}) Tj\nT*`).join('\n')}\nET`
      objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${pageObjectNumber + 1} 0 R >>`
      objects[pageObjectNumber + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    })
    objects[fontObjectNumber] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    for (let index = 1; index < objects.length; index += 1) {
      offsets[index] = pdf.length
      pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`
    }
    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${[assessment.title, academicYear || 'all-academic-years', 'grade-report'].join('-').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h5">Assessment results</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Select an assessment to view each student's grade and result.</Typography></Box>
      <TextField select size="small" label="Academic year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="">All academic years</MenuItem>{academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
      </TextField>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!loading && !error && <>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Assessments</Typography>
      {assessments.length ? <Stack spacing={1.25} sx={{ mb: 3 }}>{assessments.map((assessment) => {
        const isExpanded = selectedAssessmentId === assessment.id
        return <Box key={assessment.id} sx={{ border: 1, borderColor: isExpanded ? 'primary.main' : 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <ButtonBase onClick={() => setSelectedAssessmentId(isExpanded ? '' : assessment.id)} aria-expanded={isExpanded} aria-controls={`assessment-results-${assessment.id}`} sx={{ width: '100%', p: 2, backgroundColor: isExpanded ? 'action.selected' : 'background.default', textAlign: 'left' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ width: '100%' }}><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700} noWrap>{assessment.title}</Typography><Typography variant="body2" color="text.secondary">{assessment.assessmentType} · {assessment.className}</Typography></Box><Typography variant="body2" color="text.secondary">Due {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(assessment.dueDate))}</Typography><Chip label={assessment.status} size="small" /><Box sx={{ display: 'flex', color: 'text.secondary' }}>{isExpanded ? <ExpandLessRounded sx={{ fontSize: 20 }} /> : <ExpandMoreRounded sx={{ fontSize: 20 }} />}</Box></Stack>
          </ButtonBase>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box id={`assessment-results-${assessment.id}`} sx={{ p: { xs: 2, md: 3 }, borderTop: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}><Box><Typography variant="h6">Student grades</Typography><Typography variant="body2" color="text.secondary">{assessment.className}{academicYear ? ` · ${academicYear}` : ''}</Typography></Box><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Chip label="High grade" color="success" size="small" /><Chip label="Lower grade" color="error" size="small" /><Chip label="Did not take" size="small" /></Stack><Button variant="outlined" size="small" startIcon={<PictureAsPdfOutlined />} onClick={() => downloadGradeReport(assessment)} aria-label={`Download ${assessment.title} grade report as PDF`}>Download PDF report</Button></Stack>
              <TableContainer><Table><TableHead><TableRow>{['Student', 'Student ID', 'Academic year', 'Class & section', 'Points', 'Grade', 'Result'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{assessment.results.map((student) => {
                const status = gradeStatus(student.grade)
                const photoSource = student.photoName?.startsWith('data:image/') || student.photoName?.startsWith('https://') ? student.photoName : undefined
                return <TableRow key={student.id}><TableCell><Stack direction="row" spacing={1.25} alignItems="center"><Avatar src={photoSource} alt={`${student.fullName} profile photo`} sx={{ width: 40, height: 40 }}>{student.fullName.charAt(0).toUpperCase()}</Avatar><Typography fontWeight={600}>{student.fullName}</Typography></Stack></TableCell><TableCell>{student.admissionNumber}</TableCell><TableCell>{student.academicYear}</TableCell><TableCell>{student.classSection}</TableCell><TableCell><Typography color={student.earnedPoints === null ? 'text.secondary' : 'text.primary'} fontWeight={700}>{student.earnedPoints === null ? '—' : `${student.earnedPoints}/${student.totalPoints}`}</Typography></TableCell><TableCell><Typography color={student.grade === null ? 'text.secondary' : status.color === 'success' ? 'success.main' : status.color === 'error' ? 'error.main' : 'warning.main'} fontWeight={700}>{student.grade === null ? '—' : `${student.grade}%`}</Typography></TableCell><TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell></TableRow>
              })}</TableBody></Table></TableContainer>{!assessment.results.length && <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No students match this academic year for this assessment.</Typography>}
            </Box>
          </Collapse>
        </Box>
      })}</Stack> : <Typography color="text.secondary" sx={{ py: 2, mb: 2 }}>No assigned assessments are available.</Typography>}
    </>}
  </Paper>
}

type TeacherTimetableEntry = { id: string; academicYear: string; classSection: string; day: string; period: string; startTime: string; endTime: string; subject: string; teacher: string; room: string | null }

const TeacherTimetable: FC = () => {
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const [academicYear, setAcademicYear] = useState('')
  const [entries, setEntries] = useState<TeacherTimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ academicYears: string[]; entries: TeacherTimetableEntry[] }>('/api/teacher/timetable', { withCredentials: true })
      .then(({ data }) => {
        setAcademicYears(data.academicYears)
        setAcademicYear(data.academicYears[0] || '')
        setEntries(data.entries)
      })
      .catch(() => setError('Unable to load your timetable. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!academicYear) return
    api.get<{ entries: TeacherTimetableEntry[] }>('/api/teacher/timetable', { params: { academicYear }, withCredentials: true })
      .then(({ data }) => setEntries(data.entries))
      .catch(() => setError('Unable to load your timetable. Please try again.'))
  }, [academicYear])

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h5">Weekly teaching schedule</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Your assigned classes, subjects, rooms, and teaching periods.</Typography></Box>
      <TextField size="small" select label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} sx={{ minWidth: 170 }} disabled={!academicYears.length}>{academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</TextField>
    </Stack>
    {loading && <LinearProgress sx={{ mb: 2 }} />}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!loading && !error && !entries.length && <Typography color="text.secondary" sx={{ py: 3 }}>No timetable periods have been assigned to you yet.</Typography>}
    <Stack spacing={1.5}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
      const dayEntries = entries.filter((entry) => entry.day === day)
      if (!dayEntries.length) return null
      return <Box key={day}><Typography variant="subtitle1" sx={{ mb: 1 }}>{day}</Typography><Stack spacing={1}>{dayEntries.map((entry) => <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, backgroundColor: 'background.default' }}><Grid container spacing={1.5} alignItems="center"><Grid item xs={12} sm={2}><Typography variant="subtitle2">{entry.period}</Typography><Typography variant="caption" color="text.secondary">{entry.startTime}–{entry.endTime}</Typography></Grid><Grid item xs={12} sm={3}><Typography fontWeight={700}>{entry.subject}</Typography><Typography variant="body2" color="text.secondary">{entry.classSection}</Typography></Grid><Grid item xs={12} sm={3}><Typography variant="body2">{entry.room || 'Room not assigned'}</Typography><Typography variant="caption" color="text.secondary">Location</Typography></Grid><Grid item xs={12} sm={4}><Typography variant="body2" color="text.secondary">Academic year</Typography><Typography variant="subtitle2">{entry.academicYear}</Typography></Grid></Grid></Paper>)}</Stack></Box>
    })}</Stack>
  </Paper>
}

const TeacherPageContent: FC<{ pageKey: string }> = ({ pageKey }) => {
  const details = pageDetails[pageKey] || pageDetails.dashboard
  const navigate = useNavigate()
  const [students, setStudents] = useState<{ id: string; fullName: string; photoName?: string | null; admissionNumber: string; gradeLevel: string; classSection: string; academicYear: string; status: string }[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [studentPage, setStudentPage] = useState(0)
  const [studentRowsPerPage, setStudentRowsPerPage] = useState(10)
  const [assessments, setAssessments] = useState<{ id: string; title: string; assessmentType: string; className: string; questionCount: number; status: string }[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [assessmentsError, setAssessmentsError] = useState('')
  const [assessmentActionError, setAssessmentActionError] = useState('')
  const [deletingAssessmentId, setDeletingAssessmentId] = useState('')
  const [updatingAssessmentStatusId, setUpdatingAssessmentStatusId] = useState('')

  const updateAssessmentStatus = async (assessmentId: string, status: string) => {
    setUpdatingAssessmentStatusId(assessmentId)
    setAssessmentActionError('')
    try {
      await api.patch(`/api/teacher/assessments/${assessmentId}/status`, { status }, { withCredentials: true })
      setAssessments((current) => current.map((assessment) => assessment.id === assessmentId ? { ...assessment, status } : assessment))
    } catch (requestError) {
      setAssessmentActionError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to update the assessment status.' : 'Unable to update the assessment status.')
    } finally {
      setUpdatingAssessmentStatusId('')
    }
  }

  const deleteAssessment = async (assessmentId: string) => {
    if (!window.confirm('Delete this assessment? This action cannot be undone.')) return
    setDeletingAssessmentId(assessmentId)
    setAssessmentActionError('')
    try {
      await api.delete(`/api/teacher/assessments/${assessmentId}`, { withCredentials: true })
      setAssessments((current) => current.filter((assessment) => assessment.id !== assessmentId))
    } catch (requestError) {
      setAssessmentActionError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to delete the assessment.' : 'Unable to delete the assessment.')
    } finally {
      setDeletingAssessmentId('')
    }
  }

  useEffect(() => {
    if (pageKey !== 'students') return
    setStudentsLoading(true)
    setStudentsError('')
    api.get<{ students: { id: string; fullName: string; photoName?: string | null; admissionNumber: string; gradeLevel: string; classSection: string; academicYear: string; status: string }[] }>('/api/teacher/students', { withCredentials: true })
      .then(({ data }) => setStudents(data.students))
      .catch(() => setStudentsError('Unable to load students. Please try again.'))
      .finally(() => setStudentsLoading(false))
  }, [pageKey])

  useEffect(() => {
    if (pageKey !== 'assessments') return
    setAssessmentsLoading(true)
    setAssessmentsError('')
    api.get<{ assessments: { id: string; title: string; assessmentType: string; className: string; questionCount: number; status: string }[] }>('/api/teacher/assessments', { withCredentials: true })
      .then(({ data }) => setAssessments(data.assessments))
      .catch(() => setAssessmentsError('Unable to load assessments. Please try again.'))
      .finally(() => setAssessmentsLoading(false))
  }, [pageKey])

  if (pageKey === 'gradebook') return <Navigate to="/teacher" replace />
  if (pageKey === 'profile') return <TeacherProfilePage />
  if (pageKey === 'change-password') return <ChangePasswordPage />
  if (pageKey === 'dashboard') return <TeacherDashboard />
  if (pageKey === 'timetable') return <TeacherTimetable />
  if (pageKey === 'materials/assign') return <Navigate to="/teacher/materials/upload" replace />
  if (pageKey === 'materials/upload') return <MaterialUploadPage />
  if (pageKey === 'materials') return <MaterialListPage />
  if (pageKey === 'assessments/create') return <AssessmentBuilder />
  if (pageKey === 'assessments/assign') return <AssignmentBuilder />
  if (pageKey === 'assessments/results') return <AssessmentResultsPage />
  if (pageKey === 'students') return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Typography variant="h5">{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>{details.description}</Typography>
    {studentsLoading && <LinearProgress sx={{ mb: 2 }} />}{studentsError && <Typography color="error" sx={{ mb: 2 }}>{studentsError}</Typography>}
    <TableContainer><Table><TableHead><TableRow>{['Student', 'Student ID', 'Grade', 'Class & section', 'Academic year', 'Status'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{students.slice(studentPage * studentRowsPerPage, studentPage * studentRowsPerPage + studentRowsPerPage).map((student, index) => {
      const photoSource = student.photoName?.startsWith('data:image/') || student.photoName?.startsWith('https://') ? student.photoName : undefined
      return <TableRow key={`${student.id}-${studentPage * studentRowsPerPage + index}`}><TableCell><Stack direction="row" spacing={1.25} alignItems="center"><Avatar src={photoSource} alt={`${student.fullName} profile photo`} sx={{ width: 40, height: 40 }}>{student.fullName.charAt(0).toUpperCase()}</Avatar><Typography fontWeight={600}>{student.fullName}</Typography></Stack></TableCell><TableCell>{student.admissionNumber}</TableCell><TableCell>{student.gradeLevel}</TableCell><TableCell>{student.classSection}</TableCell><TableCell>{student.academicYear}</TableCell><TableCell><Chip label={student.status} size="small" color={student.status === 'Active' ? 'success' : student.status === 'Pending' ? 'warning' : 'default'} /></TableCell></TableRow>
    })}</TableBody></Table></TableContainer>
    {!studentsLoading && !studentsError && !students.length && <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No students are assigned to your classes.</Typography>}
    <TablePagination component="div" count={students.length} page={studentPage} onPageChange={(_, page) => setStudentPage(page)} rowsPerPage={studentRowsPerPage} onRowsPerPageChange={(event) => { setStudentRowsPerPage(Number(event.target.value)); setStudentPage(0) }} rowsPerPageOptions={[5, 10, 25]} />
  </Paper>
  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
    <Typography variant="h5">{details.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>{details.description}</Typography>
    {pageKey === 'students' || pageKey === 'materials' || pageKey === 'assessments' ? <>{studentsLoading && pageKey === 'students' && <LinearProgress sx={{ mb: 2 }} />}{studentsError && pageKey === 'students' && <Typography color="error" sx={{ mb: 2 }}>{studentsError}</Typography>}{assessmentsLoading && pageKey === 'assessments' && <LinearProgress sx={{ mb: 2 }} />}{assessmentsError && pageKey === 'assessments' && <Typography color="error" sx={{ mb: 2 }}>{assessmentsError}</Typography>}{assessmentActionError && pageKey === 'assessments' && <Typography color="error" sx={{ mb: 2 }}>{assessmentActionError}</Typography>}<TableContainer><Table><TableHead><TableRow>{(pageKey === 'students' ? ['Student', 'Class', 'Progress', 'Status'] : pageKey === 'materials' ? ['Material', 'Type', 'Assigned class', 'Status'] : ['Assessment', 'Assessment Type', 'Class', 'Due date', 'Status', 'Actions']).map((heading) => <TableCell key={heading} sx={{ fontWeight: 700 }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{(pageKey === 'students' ? students.slice(studentPage * studentRowsPerPage, studentPage * studentRowsPerPage + studentRowsPerPage).map((student) => [student.fullName, student.gradeLevel, '—', student.status]) : pageKey === 'materials' ? [['Algebra workbook', 'PDF', 'Grade 8', 'Published'], ['Linear equations video', 'Video', 'Grade 7', 'Published'], ['Practice worksheet', 'Document', 'Grade 9', 'Draft']] : assessments.map((assessment) => [assessment.title, assessment.assessmentType, `${assessment.className} · ${assessment.questionCount} questions`, '—', assessment.status, assessment.id])).map((row, rowIndex) => <TableRow hover key={`${pageKey}-${row[5] || row[0]}-${rowIndex}`}>{row.map((cell, index) => <TableCell key={`${pageKey}-${rowIndex}-${index}`}>{pageKey === 'assessments' && index === 4 ? <Select size="small" value={cell} disabled={updatingAssessmentStatusId === row[5]} onChange={(event) => updateAssessmentStatus(String(row[5]), event.target.value)} aria-label={`Status for ${row[0]}`} sx={{ minWidth: 120 }}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Published">Published</MenuItem><MenuItem value="Archived">Archived</MenuItem></Select> : pageKey === 'assessments' && index === row.length - 1 ? <Stack direction="row" spacing={0.5}><Button size="small" startIcon={<EditOutlined />} onClick={() => navigate(`/teacher/assessments/create?edit=${row[5]}`)}>Edit</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => deleteAssessment(String(row[5]))} disabled={deletingAssessmentId === row[5]}>{deletingAssessmentId === row[5] ? 'Deleting...' : 'Delete'}</Button></Stack> : index === row.length - 1 ? <Chip size="small" label={cell} color={cell === 'Published' || cell === 'Open' || cell === 'On track' || cell === 'Active' ? 'success' : 'warning'} /> : cell}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>{pageKey === 'students' && <TablePagination component="div" count={students.length} page={studentPage} onPageChange={(_, newPage) => setStudentPage(newPage)} rowsPerPage={studentRowsPerPage} onRowsPerPageChange={(event) => { setStudentRowsPerPage(Number(event.target.value)); setStudentPage(0) }} rowsPerPageOptions={[5, 10, 25]} />}{pageKey === 'assessments' && !assessmentsLoading && !assessmentsError && !assessments.length && <Typography color="text.secondary" sx={{ p: 3 }}>No saved assessments found.</Typography>}</> : <Grid container spacing={2}><Grid item xs={12} md={7}><TextField fullWidth label={pageKey.includes('password') ? 'New password' : 'Title'} type={pageKey.includes('password') ? 'password' : 'text'} /></Grid><Grid item xs={12} md={5}><Select fullWidth defaultValue="Grade 8" aria-label="Class"><MenuItem value="Grade 7">Grade 7</MenuItem><MenuItem value="Grade 8">Grade 8</MenuItem><MenuItem value="Grade 9">Grade 9</MenuItem></Select></Grid><Grid item xs={12}><Button variant="contained" startIcon={pageKey.includes('upload') ? <UploadFileOutlined /> : undefined}>{pageKey.includes('upload') ? 'Upload Material' : pageKey.includes('password') ? 'Update Password' : 'Save Changes'}</Button></Grid></Grid>}
  </Paper>
}

const TeacherPortal: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [headerProfilePhoto, setHeaderProfilePhoto] = useState<string | null>(null)
  const pageKey = useMemo(() => getPageKey(location.pathname), [location.pathname])
  const details = pageDetails[pageKey] || pageDetails.dashboard
  const headerPhotoSource = headerProfilePhoto?.startsWith('data:image/') || headerProfilePhoto?.startsWith('https://') ? headerProfilePhoto : undefined
  const headerInitials = user?.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'TR'
  useEffect(() => {
    api.get<{ photoName: string | null }>('/api/teacher/profile', { withCredentials: true }).then(({ data }) => setHeaderProfilePhoto(data.photoName)).catch(() => setHeaderProfilePhoto(null))
  }, [])
  const handleLogout = async () => { setProfileAnchor(null); await logout(); navigate('/login', { replace: true }) }

  return <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', display: 'flex' }}>
    <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: (theme) => theme.zIndex.drawer, width: 256, borderRight: 1, borderColor: 'divider' }}><SidebarContent currentPath={location.pathname} onNavigate={navigate} /></Box>
    <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}><SidebarContent currentPath={location.pathname} onNavigate={navigate} onClose={() => setMobileOpen(false)} /></Drawer>
    <Box component="section" sx={{ minWidth: 0, flex: 1, ml: { xs: 0, md: '256px' } }}>
      <Paper component="header" elevation={0} sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, px: { xs: 1.5, md: 3 }, py: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}><Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 2 }} sx={{ minHeight: 48, position: 'relative' }}><IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuRounded /></IconButton><Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, whiteSpace: 'nowrap' }}>{details.title}</Typography><Box sx={{ ml: { xs: 'auto', sm: 2 }, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', width: '100%', maxWidth: 440, px: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}><SearchRounded sx={{ color: 'text.disabled', mr: 1 }} /><InputBase fullWidth placeholder="Search students, materials, assessments..." inputProps={{ 'aria-label': 'Search teacher portal' }} sx={{ py: 0.75, fontSize: '0.85rem' }} /></Box><Stack direction="row" alignItems="center" spacing={{ xs: 0.25, md: 1 }} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'background.paper', flexShrink: 0 }}><IconButton aria-label="Language" sx={{ display: { xs: 'none', md: 'inline-flex' } }}><TranslateOutlined /></IconButton><ThemeToggle /><IconButton aria-label="Notifications"><Badge badgeContent={3} color="primary"><NotificationsNoneOutlined /></Badge></IconButton><IconButton aria-label="Open profile menu" onClick={(event) => setProfileAnchor(event.currentTarget)}><Avatar src={headerPhotoSource} alt={`${user?.name || 'Teacher'} profile photo`} sx={{ width: 32, height: 32, fontSize: 14, backgroundColor: 'primary.main' }}>{headerInitials}</Avatar></IconButton><Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><MenuItem onClick={() => { setProfileAnchor(null); navigate('/teacher/profile') }}>My Profile</MenuItem><MenuItem onClick={() => { setProfileAnchor(null); navigate('/teacher/change-password') }}>Change Password</MenuItem><MenuItem onClick={handleLogout}>Logout</MenuItem></Menu></Stack></Stack></Paper>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Teacher Portal</Typography><Typography variant="subtitle2" color="primary.main">{details.title}</Typography></Breadcrumbs><Stack spacing={0.5} sx={{ mb: 4 }}><Typography variant="h1" sx={{ fontSize: { xs: 30, md: 38 } }}>{details.title}</Typography><Typography color="text.secondary">{details.description}{user?.name ? ` Welcome back, ${user.name}.` : ''}</Typography></Stack><TeacherPageContent pageKey={pageKey} /></Container>
    </Box>
  </Box>
}

export default TeacherPortal
