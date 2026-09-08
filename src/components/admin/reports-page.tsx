import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
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
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import { type FC, useEffect, useMemo, useState } from 'react'
import { getAdminAtRiskStudents, getAdminClassesWorkspace, getAdminPayments, getAdminQuizViolations, getAdminTutors, getAdminUsers, type AdminClass, type AdminClassEnrollment, type AdminPayment, type AdminQuizViolation, type AtRiskStudent } from '@/services/api'
import { type AdminTutor, type AdminUser } from './admin-data'

type ReportType = 'enrollment' | 'revenue' | 'attendance' | 'academic' | 'tutor' | 'progress'
type FilterValues = Record<string, string>
type ReportRow = { id: number; [key: string]: string | number }

const reportOptions: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'enrollment', label: 'Enrollment', description: 'Review student enrollment activity across programs and classes.' },
  { value: 'revenue', label: 'Revenue', description: 'Review filtered payment transactions and collected revenue.' },
  { value: 'attendance', label: 'Attendance', description: 'Review attendance recorded for class enrollments.' },
  { value: 'academic', label: 'Academic Performance', description: 'Review recorded quiz results and assessment outcomes.' },
  { value: 'tutor', label: 'Tutor Performance', description: 'Review tutor class coverage and enrollment activity.' },
  { value: 'progress', label: 'Student Progress', description: 'Review recorded learning progress for students needing attention.' },
]

const programLabel = (program: string) => ({ 'international-online-interactive': 'International Online Interactive', 'summer-camp': 'Summer Camp', 'ministry-exam-prep': 'Ministry Exam Prep' }[program] ?? program)
const displayDate = (value: string) => value ? new Date(value).toLocaleDateString() : '—'
const inDateRange = (value: string, filters: FilterValues) => (!filters.startDate || value >= filters.startDate) && (!filters.endDate || value <= filters.endDate)
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

const PageHeading: FC = () => <Box sx={{ mb: 4 }}><Typography variant="h4" sx={{ mb: 0.5 }}>Reports</Typography><Typography color="text.secondary">Create focused reports from existing enrollment, payment, attendance, and learning records.</Typography></Box>

const ReportsPage: FC = () => {
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [enrollments, setEnrollments] = useState<AdminClassEnrollment[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [tutors, setTutors] = useState<AdminTutor[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [violations, setViolations] = useState<AdminQuizViolation[]>([])
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([])
  const [reportType, setReportType] = useState<ReportType | ''>('')
  const [filters, setFilters] = useState<FilterValues>({})
  const [generatedType, setGeneratedType] = useState<ReportType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAdminClassesWorkspace(), getAdminPayments(), getAdminTutors(), getAdminUsers(), getAdminQuizViolations(), getAdminAtRiskStudents()])
      .then(([classWorkspace, paymentRecords, tutorRecords, userRecords, quizRecords, progressRecords]) => {
        setClasses(classWorkspace.classes)
        setEnrollments(classWorkspace.enrollments)
        setPayments(paymentRecords)
        setTutors(tutorRecords)
        setUsers(userRecords)
        setViolations(quizRecords)
        setAtRiskStudents(progressRecords)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load reporting data.'))
      .finally(() => setIsLoading(false))
  }, [])

  const studentNames = useMemo(() => Array.from(new Set([...users.filter((user) => user.role === 'Student').map((user) => user.name), ...enrollments.map((enrollment) => enrollment.student_name), ...atRiskStudents.map((student) => student.studentName)])).sort(), [atRiskStudents, enrollments, users])
  const programOptions = useMemo(() => Array.from(new Set(classes.map((item) => item.program_id))).sort(), [classes])
  const updateFilter = (name: string, value: string) => setFilters((current) => ({ ...current, [name]: value }))

  const result = useMemo<{ columns: string[]; rows: ReportRow[] }>(() => {
    if (!generatedType) return { columns: [] as string[], rows: [] as ReportRow[] }
    const classById = new Map(classes.map((item) => [item.id, item]))
    if (generatedType === 'enrollment') {
      const rows = enrollments.filter((item) => {
        const classRecord = classById.get(item.class_id)
        return (!filters.program || classRecord?.program_id === filters.program) && (!filters.status || item.status === filters.status) && inDateRange(item.enrolled_date, filters)
      }).map((item) => {
        const classRecord = classById.get(item.class_id)
        return { id: item.id, Student: item.student_name, Class: classRecord?.title ?? '—', Program: classRecord ? programLabel(classRecord.program_id) : '—', Tutor: tutors.find((tutor) => tutor.id === classRecord?.tutor_id)?.name ?? '—', Status: item.status, 'Enrolled date': displayDate(item.enrolled_date) }
      })
      return { columns: ['Student', 'Class', 'Program', 'Tutor', 'Status', 'Enrolled date'], rows }
    }
    if (generatedType === 'revenue') {
      const rows = payments.filter((item) => (!filters.program || item.course === filters.program) && (!filters.paymentStatus || item.status === filters.paymentStatus) && inDateRange(item.date, filters)).map((item) => ({ id: item.id, Student: item.student, Program: item.course, Amount: item.amount, Status: item.status, Date: displayDate(item.date) }))
      return { columns: ['Student', 'Program', 'Amount', 'Status', 'Date'], rows }
    }
    if (generatedType === 'attendance') {
      const rows = enrollments.filter((item) => {
        const classRecord = classById.get(item.class_id)
        return (!filters.classId || String(item.class_id) === filters.classId) && (!filters.tutorId || String(classRecord?.tutor_id) === filters.tutorId) && inDateRange(classRecord?.schedule.startDate ?? '', filters)
      }).map((item) => {
        const attendance = Object.values(item.attendance)
        const present = attendance.filter((value) => value === 'Present').length
        const rate = attendance.length ? `${Math.round((present / attendance.length) * 100)}%` : 'No sessions recorded'
        return { id: item.id, Student: item.student_name, Class: classById.get(item.class_id)?.title ?? '—', Tutor: tutors.find((tutor) => tutor.id === classById.get(item.class_id)?.tutor_id)?.name ?? '—', Present: present, Absent: attendance.length - present, 'Attendance rate': rate }
      })
      return { columns: ['Student', 'Class', 'Tutor', 'Present', 'Absent', 'Attendance rate'], rows }
    }
    if (generatedType === 'academic') {
      const rows = violations.filter((item) => (!filters.course || item.courseTitle === filters.course) && (!filters.subject || item.lessonTitle === filters.subject) && inDateRange(item.submittedAt ?? '', filters)).map((item) => ({ id: item.id, Student: item.studentName, Course: item.courseTitle, Assessment: item.lessonTitle, Score: item.score ?? 'Not submitted', Result: item.passed === null ? 'Pending' : item.passed ? 'Passed' : 'Not passed', Date: item.submittedAt ? displayDate(item.submittedAt) : '—' }))
      return { columns: ['Student', 'Course', 'Assessment', 'Score', 'Result', 'Date'], rows }
    }
    if (generatedType === 'tutor') {
      const rows = tutors.filter((tutor) => !filters.tutorId || String(tutor.id) === filters.tutorId).map((tutor) => {
        const tutorClasses = classes.filter((item) => item.tutor_id === tutor.id && inDateRange(item.schedule.startDate, filters))
        const tutorEnrollments = enrollments.filter((item) => tutorClasses.some((classRecord) => classRecord.id === item.class_id))
        const attendance = tutorEnrollments.flatMap((item) => Object.values(item.attendance))
        const presentRate = attendance.length ? `${Math.round((attendance.filter((value) => value === 'Present').length / attendance.length) * 100)}%` : 'No sessions recorded'
        return { id: tutor.id, Tutor: tutor.name, Status: tutor.status, Classes: tutorClasses.length, Enrollments: tutorEnrollments.length, 'Attendance rate': presentRate }
      })
      return { columns: ['Tutor', 'Status', 'Classes', 'Enrollments', 'Attendance rate'], rows }
    }
    const rows = atRiskStudents.map((item) => {
      const classRecord = classes.find((record) => record.title === item.classTitle)
      return { item, program: classRecord?.program_id ?? '' }
    }).filter(({ item, program }) => (!filters.student || item.studentName === filters.student) && (!filters.program || program === filters.program)).map(({ item, program }) => ({ id: item.id, Student: item.studentName, Program: program ? programLabel(program) : '—', Course: item.courseTitle ?? '—', Class: item.classTitle ?? '—', Progress: `${Math.round(item.progressPercentage)}%`, 'Last activity': item.lastActivityAt ? displayDate(item.lastActivityAt) : '—' }))
    return { columns: ['Student', 'Program', 'Course', 'Class', 'Progress', 'Last activity'], rows }
  }, [atRiskStudents, classes, enrollments, filters, generatedType, payments, tutors, violations])

  const chartData = useMemo(() => {
    if (generatedType === 'revenue') {
      const values = new Map<string, number>()
      result.rows.forEach((row) => values.set(String(row.Date), (values.get(String(row.Date)) ?? 0) + (typeof row.Amount === 'number' ? row.Amount : 0)))
      return Array.from(values, ([label, value]) => ({ label, value }))
    }
    if (generatedType === 'enrollment') {
      const values = new Map<string, number>()
      result.rows.forEach((row) => values.set(String(row['Enrolled date']), (values.get(String(row['Enrolled date'])) ?? 0) + 1))
      return Array.from(values, ([label, value]) => ({ label, value }))
    }
    return []
  }, [generatedType, result.rows])

  const selectedReport = reportOptions.find((option) => option.value === reportType)
  const generateReport = () => { if (reportType) setGeneratedType(reportType) }
  const exportReport = () => {
    const csv = [result.columns.join(','), ...result.rows.map((row) => result.columns.map((column) => csvCell(row[column])).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${generatedType}-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectField = (name: string, label: string, options: Array<{ value: string; label: string }>) => <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}><InputLabel id={`${name}-label`}>{label}</InputLabel><Select labelId={`${name}-label`} value={filters[name] ?? ''} label={label} onChange={(event) => updateFilter(name, event.target.value)}><MenuItem value="">All {label.toLowerCase()}s</MenuItem>{options.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl>
  const dateFields = <><TextField label="Start date" type="date" size="small" value={filters.startDate ?? ''} onChange={(event) => updateFilter('startDate', event.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: 168 } }} /><TextField label="End date" type="date" size="small" value={filters.endDate ?? ''} onChange={(event) => updateFilter('endDate', event.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: 168 } }} /></>

  const filterPanel = () => {
    if (!reportType) return null
    if (reportType === 'enrollment') return <>{selectField('program', 'Program', programOptions.map((item) => ({ value: item, label: programLabel(item) })))}{dateFields}{selectField('status', 'Status', [{ value: 'enrolled', label: 'Enrolled' }, { value: 'waitlisted', label: 'Waitlisted' }])}</>
    if (reportType === 'revenue') return <>{selectField('program', 'Program', Array.from(new Set(payments.map((item) => item.course))).map((item) => ({ value: item, label: item })))}{dateFields}{selectField('paymentStatus', 'Payment status', ['Paid', 'Pending', 'Failed'].map((item) => ({ value: item, label: item })))}</>
    if (reportType === 'attendance') return <>{selectField('classId', 'Class', classes.map((item) => ({ value: String(item.id), label: item.title })))}{selectField('tutorId', 'Tutor', tutors.map((item) => ({ value: String(item.id), label: item.name })))}{dateFields}</>
    if (reportType === 'academic') return <>{selectField('course', 'Course / Class', Array.from(new Set(violations.map((item) => item.courseTitle))).map((item) => ({ value: item, label: item })))}{selectField('subject', 'Subject', Array.from(new Set(violations.map((item) => item.lessonTitle))).map((item) => ({ value: item, label: item })))}{dateFields}</>
    if (reportType === 'tutor') return <>{selectField('tutorId', 'Tutor', tutors.map((item) => ({ value: String(item.id), label: item.name })))}{dateFields}</>
    return <>{selectField('student', 'Student', studentNames.map((item) => ({ value: item, label: item })))}{selectField('program', 'Program', programOptions.map((item) => ({ value: item, label: programLabel(item) })))}</>
  }

  return <><PageHeading />
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading reporting data" /></Box> : error ? <Alert severity="error">{error}</Alert> : <>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Create a report</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Choose one report type, set only its relevant filters, then generate the results.</Typography>
        <FormControl fullWidth sx={{ maxWidth: 440, mb: selectedReport ? 2.5 : 0 }}><InputLabel id="report-type-label">Report type</InputLabel><Select labelId="report-type-label" value={reportType} label="Report type" onChange={(event) => { setReportType(event.target.value as ReportType); setFilters({}); setGeneratedType(null) }}><MenuItem value=""><em>Select a report type</em></MenuItem>{reportOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl>
        {selectedReport && <><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedReport.description}</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap" alignItems={{ md: 'center' }}>{filterPanel()}<Button variant="contained" startIcon={<AssessmentOutlinedIcon />} onClick={generateReport} sx={{ minHeight: 40 }}>Generate Report</Button></Stack></>}
      </Paper>
      {generatedType && <><Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider', mb: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}><Box><Typography variant="h6">{reportOptions.find((option) => option.value === generatedType)?.label} report</Typography><Typography variant="body2" color="text.secondary">{result.rows.length} matching record{result.rows.length === 1 ? '' : 's'}.</Typography></Box><Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportReport} disabled={!result.rows.length}>Export CSV</Button></Stack></Paper>
      {chartData.length > 0 && <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', mb: 3 }}><Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{generatedType === 'revenue' ? 'Revenue trend' : 'Enrollment trend'}</Typography><Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ height: 180, overflowX: 'auto', pb: 1 }}>{chartData.map((item) => <Box key={item.label} sx={{ minWidth: 72, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: .75 }}><Typography variant="caption" sx={{ fontWeight: 700 }}>{generatedType === 'revenue' ? `$${item.value.toLocaleString()}` : item.value}</Typography><Box sx={{ width: 36, height: `${Math.max(8, (item.value / Math.max(...chartData.map((entry) => entry.value))) * 110)}px`, borderRadius: '6px 6px 2px 2px', bgcolor: 'primary.main' }} /><Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{item.label}</Typography></Box>)}</Stack></Paper>}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><TableContainer><Table sx={{ minWidth: 740 }}><TableHead><TableRow>{result.columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead><TableBody>{result.rows.length ? result.rows.map((row) => <TableRow hover key={row.id}>{result.columns.map((column) => <TableCell key={column}>{column === 'Status' || column === 'Result' ? <Chip label={String(row[column])} size="small" color={String(row[column]).toLowerCase().includes('paid') || String(row[column]).toLowerCase().includes('passed') || String(row[column]).toLowerCase().includes('enrolled') ? 'success' : 'default'} /> : column === 'Amount' ? `$${Number(row[column]).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : row[column]}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={result.columns.length}><Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No records match these filters.</Typography></TableCell></TableRow>}</TableBody></Table></TableContainer></Paper></>}
    </>}
  </>
}

export default ReportsPage
