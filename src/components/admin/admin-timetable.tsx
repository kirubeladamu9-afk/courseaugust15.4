import axios from 'axios'
import { useEffect, useMemo, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { AdminPanelLayout } from './admin-dashboard'
import api from '@/lib/api'

type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
type Option = { id: string; name: string }
type Teacher = { id: string; fullName: string; assignedSubjects: string | null; assignedClasses: string | null }
type TimetableEntry = { day: Day; period: string; startTime: string; endTime: string; subject: string; teacher: string; room: string }
type Slot = { period: string; startTime: string; endTime: string }

const days: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const slots: Slot[] = [
  { period: 'Period 1', startTime: '08:00', endTime: '08:45' },
  { period: 'Period 2', startTime: '08:50', endTime: '09:35' },
  { period: 'Period 3', startTime: '09:40', endTime: '10:25' },
  { period: 'Period 4', startTime: '10:45', endTime: '11:30' },
  { period: 'Period 5', startTime: '11:35', endTime: '12:20' },
  { period: 'Period 6', startTime: '13:20', endTime: '14:05' },
  { period: 'Period 7', startTime: '14:10', endTime: '14:55' },
]

const entryKey = (day: Day, period: string) => `${day}-${period}`

const AdminTimetable: FC = () => {
  const navigate = useNavigate()
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const [classes, setClasses] = useState<Option[]>([])
  const [subjects, setSubjects] = useState<Option[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [academicYear, setAcademicYear] = useState('')
  const [classSection, setClassSection] = useState('')
  const [entries, setEntries] = useState<Record<string, TimetableEntry>>({})
  const [showSaturday, setShowSaturday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api.get<{ academicYears: string[]; classes: Option[]; subjects: Option[]; teachers: Teacher[] }>('/api/admin/timetable/options', { withCredentials: true })
      .then(({ data }) => {
        setAcademicYears(data.academicYears)
        setClasses(data.classes)
        setSubjects(data.subjects)
        setTeachers(data.teachers)
        setAcademicYear(data.academicYears[0] || '')
        setClassSection(data.classes[0]?.name || '')
      })
      .catch(() => setError('Unable to load timetable options. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!academicYear || !classSection) {
      setEntries({})
      return
    }
    setNotice('')
    api.get<{ entries: TimetableEntry[] }>('/api/admin/timetable', { params: { academicYear, classSection }, withCredentials: true })
      .then(({ data }) => setEntries(Object.fromEntries(data.entries.map((entry) => [entryKey(entry.day, entry.period), entry]))))
      .catch(() => setError('Unable to load this class timetable. Please try again.'))
  }, [academicYear, classSection])

  const visibleDays = showSaturday ? days : days.slice(0, 5)
  const selectedClass = classes.find((option) => option.name === classSection)?.name || classSection

  const findTeacher = (subject: string) => {
    if (!subject) return ''
    const teacher = teachers.find((candidate) => {
      const assignedSubjects = (candidate.assignedSubjects || '').split(',').map((value) => value.trim().toLowerCase())
      const assignedClasses = (candidate.assignedClasses || '').split(',').map((value) => value.trim().toLowerCase())
      return assignedSubjects.includes(subject.toLowerCase()) && assignedClasses.includes(selectedClass.toLowerCase())
    })
    return teacher?.fullName || 'Unassigned'
  }

  const updateEntry = (day: Day, slot: Slot, changes: Partial<TimetableEntry>) => {
    const key = entryKey(day, slot.period)
    setEntries((current) => {
      const previous = current[key] || { day, period: slot.period, startTime: slot.startTime, endTime: slot.endTime, subject: '', teacher: '', room: '' }
      const next = { ...previous, ...changes }
      if ('subject' in changes) next.teacher = findTeacher(changes.subject || '')
      if (!next.subject) return Object.fromEntries(Object.entries(current).filter(([entryId]) => entryId !== key))
      return { ...current, [key]: next }
    })
  }

  const saveTimetable = async () => {
    setError('')
    setNotice('')
    if (!academicYear || !classSection) {
      setError('Select an academic year and class section before saving.')
      return
    }
    setSaving(true)
    try {
      await api.put('/api/admin/timetable', { academicYear, classSection, entries: Object.values(entries) }, { withCredentials: true })
      setNotice('Timetable saved successfully.')
    } catch (requestError) {
      setError(axiosMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const assignedCount = useMemo(() => Object.values(entries).length, [entries])

  return (
    <AdminPanelLayout title="Timetable">
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="primary.main">Timetable</Typography></Breadcrumbs>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box><Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 0.5 }}>Timetable</Typography><Typography color="text.secondary">Build weekly periods for each class and section.</Typography></Box>
          <Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => setShowSaturday((current) => !current)}>{showSaturday ? 'Show Monday–Friday' : 'Add Saturday'}</Button><Button variant="contained" onClick={saveTimetable} disabled={saving || loading}>{saving ? 'Saving...' : 'Save Timetable'}</Button></Stack>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" select label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>{academicYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" select label="Grade + Section" value={classSection} onChange={(event) => setClassSection(event.target.value)}>{classes.map((option) => <MenuItem key={option.id} value={option.name}>{option.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><Stack justifyContent="center" sx={{ height: '100%' }}><Typography variant="body2" color="text.secondary">{assignedCount} {assignedCount === 1 ? 'period' : 'periods'} assigned</Typography><Typography variant="caption" color="text.secondary">Teachers are filled from class assignments.</Typography></Stack></Grid>
          </Grid>
        </Paper>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, borderRadius: 3, overflowX: 'auto' }}>
          <Box sx={{ minWidth: 980 }}>
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={1.3}><Typography variant="caption" color="text.secondary">Period</Typography></Grid>
              {visibleDays.map((day) => <Grid item xs key={day}><Typography variant="subtitle2">{day}</Typography></Grid>)}
            </Grid>
            <Stack spacing={1}>
              {slots.map((slot) => <Grid container spacing={1} alignItems="stretch" key={slot.period}>
                <Grid item xs={1.3}><Paper variant="outlined" sx={{ p: 1, height: '100%', backgroundColor: 'background.default' }}><Typography variant="subtitle2">{slot.period}</Typography><Typography variant="caption" color="text.secondary">{slot.startTime}–{slot.endTime}</Typography></Paper></Grid>
                {visibleDays.map((day) => {
                  const entry = entries[entryKey(day, slot.period)]
                  return <Grid item xs key={day}><Paper variant="outlined" sx={{ p: 1, height: '100%' }}><Stack spacing={0.75}><Select size="small" displayEmpty value={entry?.subject || ''} onChange={(event) => updateEntry(day, slot, { subject: event.target.value })} renderValue={(value) => value || 'Assign subject'}><MenuItem value="">Clear period</MenuItem>{subjects.map((subject) => <MenuItem key={subject.id} value={subject.name}>{subject.name}</MenuItem>)}</Select><Typography variant="caption" color={entry?.teacher === 'Unassigned' ? 'warning.main' : 'text.secondary'} sx={{ minHeight: 18 }}>{entry?.teacher ? `Teacher: ${entry.teacher}` : 'Teacher auto-fills'}</Typography><TextField size="small" label="Room / location" value={entry?.room || ''} onChange={(event) => updateEntry(day, slot, { room: event.target.value })} disabled={!entry?.subject} /></Stack></Paper></Grid>
                })}
              </Grid>)}
            </Stack>
          </Box>
        </Paper>
        <Button onClick={() => navigate('/admin')} sx={{ mt: 2, px: 0 }}>Back to dashboard</Button>
      </Container>
    </AdminPanelLayout>
  )
}

const axiosMessage = (error: unknown) => axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to save the timetable.' : 'Unable to save the timetable.'

export default AdminTimetable
