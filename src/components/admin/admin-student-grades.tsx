import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState, type FC } from 'react'
import api from '@/lib/api'
import { AdminPanelLayout } from './admin-dashboard'

type StudentOption = { id: string; fullName: string; gradeLevel: string; classSection: string; academicYear: string }
type AssessmentOption = { data: { Class?: string; Subject?: string } }
type GradeResult = StudentOption & { photoName: string | null; admissionNumber: string; academicYear: string; earnedPoints: number | null; totalPoints: number; grade: number | null }
type AssessmentGrade = { id: string; title: string; assessmentType: string; status: string; results: GradeResult[] }

const gradeStatus = (grade: number | null) => {
  if (grade === null) return { label: 'Did not take', color: 'default' as const }
  if (grade >= 75) return { label: 'High grade', color: 'success' as const }
  if (grade < 50) return { label: 'Lower grade', color: 'error' as const }
  return { label: 'Developing', color: 'warning' as const }
}

const AdminStudentGrades: FC = () => {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [gradeLevel, setGradeLevel] = useState('')
  const [classSection, setClassSection] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [assessmentOptions, setAssessmentOptions] = useState<AssessmentOption[]>([])
  const [assessments, setAssessments] = useState<AssessmentGrade[]>([])
  const [expandedAssessment, setExpandedAssessment] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<{ students: StudentOption[] }>('/api/admin/students', { withCredentials: true }),
      api.get<{ records: AssessmentOption[] }>('/api/admin/all-assessments', { withCredentials: true }),
    ])
      .then(([studentResponse, assessmentResponse]) => { setStudents(studentResponse.data.students); setAssessmentOptions(assessmentResponse.data.records) })
      .catch(() => setError('Unable to load grade and section options.'))
      .finally(() => setLoadingOptions(false))
  }, [])

  useEffect(() => {
    if (!gradeLevel || !classSection || !academicYear) {
      setAssessments([])
      setExpandedAssessment('')
      return
    }
    setLoadingGrades(true)
    setError('')
    api.get<{ assessments: AssessmentGrade[] }>('/api/admin/student-grades', { params: { gradeLevel, classSection, academicYear, ...(subjectName ? { subjectName } : {}) }, withCredentials: true })
      .then(({ data }) => setAssessments(data.assessments))
      .catch(() => setError('Unable to load student grades.'))
      .finally(() => setLoadingGrades(false))
  }, [gradeLevel, classSection, academicYear, subjectName])

  const academicYears = useMemo(() => [...new Set(students.map((student) => student.academicYear).filter(Boolean))].sort((left, right) => right.localeCompare(left)), [students])
  const gradeLevels = useMemo(() => [...new Set(students.map((student) => student.gradeLevel).filter(Boolean))].sort(), [students])
  const subjects = useMemo(() => {
    const selectedClassNames = [classSection, `${gradeLevel} ${classSection}`, `${gradeLevel} - ${classSection}`].map((value) => value.toLowerCase())
    return [...new Set(assessmentOptions.filter((assessment) => assessment.data.Subject && selectedClassNames.includes((assessment.data.Class || '').toLowerCase())).map((assessment) => assessment.data.Subject as string))].sort()
  }, [assessmentOptions, classSection, gradeLevel])
  const sections = useMemo(() => [...new Set(students.filter((student) => student.gradeLevel === gradeLevel).map((student) => student.classSection).filter(Boolean))].sort(), [students, gradeLevel])
  const selectedStudents = students.filter((student) => student.academicYear === academicYear && student.gradeLevel === gradeLevel && student.classSection === classSection)

  return <AdminPanelLayout title="Student Grades">
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="primary.main">Student Grades</Typography></Breadcrumbs>
      <Stack spacing={3}>
        <Box><Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 0.5 }}>Student Grades</Typography><Typography color="text.secondary">Choose an academic year, grade, and section, then optionally filter by subject.</Typography></Box>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><TextField fullWidth select required label="Academic Year" value={academicYear} disabled={loadingOptions} onChange={(event) => setAcademicYear(event.target.value)}><MenuItem value="">Select academic year</MenuItem>{academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth select required label="Grade" value={gradeLevel} disabled={loadingOptions} onChange={(event) => { setGradeLevel(event.target.value); setClassSection(''); setSubjectName('') }}><MenuItem value="">Select grade</MenuItem>{gradeLevels.map((grade) => <MenuItem key={grade} value={grade}>{grade}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth select required label="Section" value={classSection} disabled={!gradeLevel || loadingOptions} onChange={(event) => { setClassSection(event.target.value); setSubjectName('') }}><MenuItem value="">Select section</MenuItem>{sections.map((section) => <MenuItem key={section} value={section}>{section}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth select label="Subject" value={subjectName} disabled={!gradeLevel || !classSection || loadingOptions} onChange={(event) => setSubjectName(event.target.value)}><MenuItem value="">All subjects</MenuItem>{subjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</TextField></Grid>
          </Grid>
        </Paper>
        {error && <Alert severity="error">{error}</Alert>}
        {!academicYear || !gradeLevel || !classSection ? <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center' }}><Typography variant="h6">Select an academic year, grade, and section first</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>Student grades and assessment results will appear after all three selections are made.</Typography></Paper> : loadingGrades ? <LinearProgress /> : <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography variant="h5">{academicYear} · {gradeLevel} · {classSection}</Typography><Typography color="text.secondary">{selectedStudents.length} active student{selectedStudents.length === 1 ? '' : 's'}</Typography></Box><Chip label={`${assessments.length} assessment${assessments.length === 1 ? '' : 's'}`} color="primary" variant="outlined" /></Stack></Paper>
          {assessments.length ? assessments.map((assessment) => { const expanded = expandedAssessment === assessment.id; return <Accordion key={assessment.id} expanded={expanded} onChange={() => setExpandedAssessment(expanded ? '' : assessment.id)} elevation={0} sx={{ borderRadius: 3, '&:before': { display: 'none' } }}><AccordionSummary expandIcon={<ExpandMoreRounded />}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ width: '100%', pr: 1 }}><Box><Typography variant="h6">{assessment.title}</Typography><Typography variant="body2" color="text.secondary">{assessment.assessmentType} · {assessment.results.length} students</Typography></Box><Chip label={assessment.status} size="small" /></Stack></AccordionSummary><AccordionDetails><Stack spacing={1.25}>{assessment.results.map((result) => { const status = gradeStatus(result.grade); return <Paper key={result.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Stack direction="row" alignItems="center" spacing={1.5}><Avatar src={result.photoName || undefined} alt={`${result.fullName} profile photo`}>{result.fullName.slice(0, 1)}</Avatar><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700}>{result.fullName}</Typography><Typography variant="caption" color="text.secondary">{result.admissionNumber} · {result.academicYear}</Typography></Box><Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{result.earnedPoints === null ? '—' : `${result.earnedPoints} / ${result.totalPoints}`}</Typography><Chip label={result.grade === null ? '—' : `${result.grade}%`} size="small" color={status.color} /><Chip label={status.label} size="small" color={status.color} variant="outlined" /></Stack></Paper> })}</Stack></AccordionDetails></Accordion> }) : <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}><Typography color="text.secondary">No assessments are assigned to this grade and section.</Typography></Paper>}
        </Stack>}
      </Stack>
    </Container>
  </AdminPanelLayout>
}

export default AdminStudentGrades
