import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { type FC, type ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/toast'
import { navigateTo } from '@/lib/navigation'
import { assignAdminClass, createAdminClass, deleteAdminClass, getAdminClassesWorkspace, removeAdminClassEnrollment, updateAdminClass, updateAdminClassAttendance, updateAdminClassEnrollment } from '@/services/api'
import { type AdminCourse, type AdminLesson, type AdminModule, type LessonType } from './admin-data'
import { CourseEditor } from './admin-dashboard'
import AdminDataTable, { type DataColumn } from './admin-data-table'

type ProgramId = 'international-online-interactive' | 'summer-camp' | 'ministry-exam-prep'
type ClassStatus = 'pending_schedule' | 'open' | 'full' | 'closed'
type EnrollmentStatus = 'enrolled' | 'waitlisted'
type ClassesView = 'pending' | 'active' | 'new' | 'detail'

interface ClassSchedule {
  days: string[]
  time: string
  duration: number
  flexible: boolean
  startDate: string
  endDate: string
}

interface AdminClass {
  id: number
  program_id: ProgramId
  title: string
  tutor_id: number
  capacity: number
  schedule: ClassSchedule
  meeting_link: string
  modules: AdminModule[]
  price: number
  status: ClassStatus
  published: boolean
}

interface ClassEnrollment {
  id: number
  class_id: number
  student_name: string
  enrolled_date: string
  status: EnrollmentStatus
}

interface PendingStudent {
  id: number
  student_name: string
  enrolled_date: string
  age: number | null
}

interface TutorOption {
  id: number
  name: string
}

interface ClassFormValue {
  title: string
  program_id: ProgramId
  tutor_id: number
  capacity: number
  schedule: ClassSchedule
  meeting_link: string
  modules: AdminModule[]
  price: number
  published: boolean
}

interface PendingAssignmentValue {
  tutor_id: number
  capacity: number
  schedule: ClassSchedule
  meeting_link: string
}

const programLabels: Record<ProgramId, string> = {
  'international-online-interactive': 'International Online Interactive',
  'summer-camp': 'Summer Camp',
  'ministry-exam-prep': 'Ministry Exam Prep',
}

const manageablePrograms: ProgramId[] = ['summer-camp', 'ministry-exam-prep']
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

let tutors: TutorOption[] = []

const getTodayInputValue = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const getDateValidation = (schedule: ClassSchedule) => ({
  startInPast: Boolean(schedule.startDate && schedule.startDate < getTodayInputValue()),
  endBeforeStart: Boolean(schedule.startDate && schedule.endDate && schedule.endDate <= schedule.startDate),
})

const formatTime = (time: string) => {
  if (!time) return 'Time to be confirmed'
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

const normalizeSchedule = (schedule: unknown): ClassSchedule => {
  const parsed = typeof schedule === 'string' ? (() => { try { return JSON.parse(schedule) } catch { return null } })() : schedule
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { days: [], time: '', duration: 60, flexible: false, startDate: '', endDate: '' }
  const candidate = parsed as Partial<ClassSchedule>
  return {
    days: Array.isArray(candidate.days) ? candidate.days.filter((day): day is string => typeof day === 'string') : [],
    time: typeof candidate.time === 'string' ? candidate.time : '',
    duration: typeof candidate.duration === 'number' && candidate.duration > 0 ? candidate.duration : 60,
    flexible: candidate.flexible === true,
    startDate: typeof candidate.startDate === 'string' ? candidate.startDate : '',
    endDate: typeof candidate.endDate === 'string' ? candidate.endDate : '',
  }
}

const formatSchedule = (schedule: ClassSchedule) => {
  const normalizedSchedule = normalizeSchedule(schedule)
  if (normalizedSchedule.flexible) return 'Flexible'
  const days = normalizedSchedule.days.length > 0 ? normalizedSchedule.days.join(', ') : 'Days to be confirmed'
  return `${days} · ${formatTime(normalizedSchedule.time)}`
}
const tutorName = (tutorId: number) => tutors.find((tutor) => tutor.id === tutorId)?.name ?? 'Unassigned tutor'

const classStatusColor = (status: ClassStatus): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'open') return 'success'
  if (status === 'full') return 'warning'
  if (status === 'closed') return 'error'
  return 'default'
}

const classStatusLabel = (status: ClassStatus) => status === 'pending_schedule' ? 'Pending schedule' : `${status.charAt(0).toUpperCase()}${status.slice(1)}`

const WorkspaceHeading: FC<{ title: string; description: string; action?: ReactNode }> = ({ title, description, action }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
    {action}
  </Box>
)

const ClassStatusChip: FC<{ status: ClassStatus }> = ({ status }) => <Chip label={classStatusLabel(status)} color={classStatusColor(status)} size="small" />

const ScheduleFields: FC<{ schedule: ClassSchedule; onChange: (schedule: ClassSchedule) => void; allowFlexible?: boolean }> = ({ schedule, onChange, allowFlexible = false }) => {
  const dateValidation = getDateValidation(schedule)
  const toggleDay = (day: string) => onChange({ ...schedule, days: schedule.days.includes(day) ? schedule.days.filter((currentDay) => currentDay !== day) : [...schedule.days, day] })

  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField required label="Start date" type="date" value={schedule.startDate} onChange={(event) => onChange({ ...schedule, startDate: event.target.value })} error={dateValidation.startInPast} helperText={dateValidation.startInPast ? 'Start date cannot be in the past.' : undefined} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'Class start date' }} /><TextField required label="End date" type="date" value={schedule.endDate} onChange={(event) => onChange({ ...schedule, endDate: event.target.value })} error={dateValidation.endBeforeStart} helperText={dateValidation.endBeforeStart ? 'End date must be later than the start date.' : undefined} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'Class end date' }} /></Stack>
      {allowFlexible && <FormControlLabel control={<Switch checked={schedule.flexible} onChange={(event) => onChange({ ...schedule, flexible: event.target.checked })} inputProps={{ 'aria-label': 'Use a flexible schedule' }} />} label="Flexible schedule" />}
      {!schedule.flexible && <>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Days</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
          {weekdays.map((day) => <FormControlLabel key={day} sx={{ mr: 1 }} control={<Checkbox size="small" checked={schedule.days.includes(day)} onChange={() => toggleDay(day)} />} label={day} />)}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField required label="Time" type="time" value={schedule.time} onChange={(event) => onChange({ ...schedule, time: event.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'Class time' }} /><TextField required label="Duration (minutes)" type="number" value={schedule.duration} onChange={(event) => onChange({ ...schedule, duration: Math.max(1, Number(event.target.value)) })} inputProps={{ min: 1 }} /></Stack>
      </>}
    </Stack>
  )
}

const AssignScheduleDialog: FC<{ student: PendingStudent | null; onClose: () => void; onSave: (student: PendingStudent, values: PendingAssignmentValue) => void }> = ({ student, onClose, onSave }) => {
  const [values, setValues] = useState<PendingAssignmentValue>({ tutor_id: 0, capacity: 1, schedule: { days: ['Mon', 'Wed'], time: '16:00', duration: 60, flexible: false, startDate: '', endDate: '' }, meeting_link: '' })

  useEffect(() => {
    if (student) setValues({ tutor_id: tutors[0]?.id ?? 0, capacity: 1, schedule: { days: ['Mon', 'Wed'], time: '16:00', duration: 60, flexible: false, startDate: '', endDate: '' }, meeting_link: '' })
  }, [student])

  const assignmentDateValidation = getDateValidation(values.schedule)
  const canSave = values.capacity >= 1 && Boolean(values.meeting_link.trim()) && Boolean(values.schedule.startDate && values.schedule.endDate) && !assignmentDateValidation.startInPast && !assignmentDateValidation.endBeforeStart && (values.schedule.flexible || (values.schedule.days.length > 0 && Boolean(values.schedule.time)))

  return (
    <Dialog open={Boolean(student)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="assign-schedule-title">
      <DialogTitle id="assign-schedule-title" sx={{ pr: 7 }}>Assign &amp; schedule {student?.student_name ?? ''}<IconButton aria-label="Close assignment form" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}><CloseIcon /></IconButton></DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Typography color="text.secondary" variant="body2">Create a class for this paid International Online Interactive enrollee. Use a capacity of 1 for a private class.</Typography>
          <FormControl fullWidth required><InputLabel>Tutor</InputLabel><Select label="Tutor" value={values.tutor_id} onChange={(event) => setValues({ ...values, tutor_id: Number(event.target.value) })}>{tutors.map((tutor) => <MenuItem key={tutor.id} value={tutor.id}>{tutor.name}</MenuItem>)}</Select></FormControl>
          <TextField required fullWidth label="Capacity" type="number" value={values.capacity} onChange={(event) => setValues({ ...values, capacity: Math.max(1, Number(event.target.value)) })} inputProps={{ min: 1 }} helperText="Set to 1 for a private class." />
          <Box><Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Schedule</Typography><ScheduleFields schedule={values.schedule} onChange={(schedule) => setValues({ ...values, schedule })} allowFlexible /></Box>
          <TextField required fullWidth label="Meeting Link" type="url" placeholder="https://" value={values.meeting_link} onChange={(event) => setValues({ ...values, meeting_link: event.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => student && onSave(student, values)} disabled={!canSave}>Create class</Button></DialogActions>
    </Dialog>
  )
}

const normalizeModules = (modules: unknown): AdminModule[] => {
  const parsed = typeof modules === 'string' ? (() => { try { return JSON.parse(modules) } catch { return [] } })() : modules
  return Array.isArray(parsed) ? parsed : []
}

const formatScheduledAt = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

const getScheduledAt = (schedule: ClassSchedule, liveIndex: number) => {
  if (!schedule.startDate || !schedule.days.length || !schedule.time) return ''
  const dayIndexes = new Set(schedule.days.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day)).filter((day) => day >= 0))
  if (!dayIndexes.size) return ''
  const date = new Date(`${schedule.startDate}T00:00:00`)
  let matches = 0
  while (!dayIndexes.has(date.getDay()) || matches < liveIndex) {
    if (dayIndexes.has(date.getDay())) matches += 1
    date.setDate(date.getDate() + 1)
  }
  const [hours, minutes] = schedule.time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return formatScheduledAt(date)
}

const getScheduledEndAt = (scheduledAt: string | undefined, duration: number) => {
  if (!scheduledAt) return ''
  const date = new Date(scheduledAt)
  date.setMinutes(date.getMinutes() + duration)
  return formatScheduledAt(date)
}

const synchronizeLiveLessons = (modules: AdminModule[], schedule: ClassSchedule, meetingUrl: string) => {
  let liveIndex = 0
  return modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => {
    if (lesson.type !== 'live') return lesson
    const scheduledAt = lesson.dateOverridden ? lesson.scheduledAt : getScheduledAt(schedule, liveIndex)
    liveIndex += 1
    return { ...lesson, meetingUrl, scheduledAt, endsAt: getScheduledEndAt(scheduledAt, schedule.duration) }
  }) }))
}

const getLiveLessonIndex = (modules: AdminModule[], lesson: AdminLesson, isNew: boolean) => {
  const liveLessons = modules.flatMap((module) => module.lessons).filter((currentLesson) => currentLesson.type === 'live')
  return isNew ? liveLessons.length : Math.max(0, liveLessons.findIndex((currentLesson) => currentLesson.id === lesson.id))
}

const emptyClassForm = (): ClassFormValue => ({
  title: '',
  program_id: 'summer-camp',
  tutor_id: tutors[0]?.id ?? 0,
  capacity: 12,
  schedule: { days: ['Mon', 'Wed'], time: '10:00', duration: 60, flexible: false, startDate: '', endDate: '' },
  meeting_link: '',
  modules: [],
  price: 0,
  published: true,
})

const ClassCurriculumEditor: FC<{ modules: AdminModule[]; onChange: (modules: AdminModule[]) => void }> = ({ modules, onChange }) => {
  const addModule = () => onChange([...modules, { id: Math.max(0, ...modules.map((module) => module.id)) + 1, title: `Module ${modules.length + 1}`, lessons: [] }])
  const addLesson = (moduleId: number, type: LessonType) => onChange(modules.map((module) => module.id === moduleId ? { ...module, lessons: [...module.lessons, { id: Math.max(0, ...modules.flatMap((item) => item.lessons.map((lesson) => lesson.id))) + 1, title: `New ${type} lesson`, type, duration: null, resources: [] }] } : module))
  return <Stack spacing={1.5}><Typography variant="body2" color="text.secondary">Build curriculum private to this class. It is not connected to the public Courses catalog.</Typography>{modules.map((module) => <Paper key={module.id} variant="outlined" sx={{ p: 1.5 }}><TextField fullWidth size="small" label="Module title" value={module.title} onChange={(event) => onChange(modules.map((item) => item.id === module.id ? { ...item, title: event.target.value } : item))} /><Stack spacing={0.5} sx={{ mt: 1 }}>{module.lessons.map((lesson) => <Typography key={lesson.id} variant="body2">{lesson.title} · {lesson.type}</Typography>)}<Stack direction="row" spacing={0.5} flexWrap="wrap">{(['video', 'article', 'quiz', 'live'] as LessonType[]).map((type) => <Button key={type} size="small" onClick={() => addLesson(module.id, type)}>Add {type}</Button>)}</Stack></Stack></Paper>)}<Button startIcon={<AddIcon />} onClick={addModule} sx={{ alignSelf: 'flex-start' }}>Add module</Button></Stack>
}

const ClassEditorDialog: FC<{ classRecord: AdminClass | null; open: boolean; onClose: () => void; onSave: (values: ClassFormValue) => void }> = ({ classRecord, open, onClose, onSave }) => {
  const [values, setValues] = useState<ClassFormValue>(emptyClassForm)

  useEffect(() => {
    if (!open) return
    setValues(classRecord ? { title: classRecord.title, program_id: classRecord.program_id, tutor_id: classRecord.tutor_id, capacity: classRecord.capacity, schedule: normalizeSchedule(classRecord.schedule), meeting_link: classRecord.meeting_link, modules: normalizeModules(classRecord.modules), price: classRecord.price, published: classRecord.published } : emptyClassForm())
  }, [classRecord, open])

  const classDateValidation = getDateValidation(values.schedule)
  const canSave = Boolean(values.title.trim() && values.meeting_link.trim() && values.capacity >= 1 && values.schedule.duration >= 1 && values.schedule.startDate && values.schedule.endDate && !classDateValidation.startInPast && !classDateValidation.endBeforeStart && (values.schedule.flexible || (values.schedule.days.length > 0 && values.schedule.time)))
  const selectablePrograms = classRecord ? Object.keys(programLabels) as ProgramId[] : manageablePrograms

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="class-editor-title">
      <DialogTitle id="class-editor-title" sx={{ pr: 7 }}>{classRecord ? 'Edit class' : 'New class'}<IconButton aria-label="Close class form" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}><CloseIcon /></IconButton></DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField required fullWidth label="Title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
            <FormControl fullWidth required><InputLabel>Program</InputLabel><Select label="Program" value={values.program_id} onChange={(event) => setValues({ ...values, program_id: event.target.value as ProgramId })}>{selectablePrograms.map((program) => <MenuItem key={program} value={program}>{programLabels[program]}</MenuItem>)}</Select></FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField required fullWidth label="Capacity" type="number" value={values.capacity} onChange={(event) => setValues({ ...values, capacity: Math.max(1, Number(event.target.value)) })} inputProps={{ min: 1 }} />
            <FormControl fullWidth required><InputLabel>Tutor</InputLabel><Select label="Tutor" value={values.tutor_id} onChange={(event) => setValues({ ...values, tutor_id: Number(event.target.value) })}>{tutors.map((tutor) => <MenuItem key={tutor.id} value={tutor.id}>{tutor.name}</MenuItem>)}</Select></FormControl>
            <TextField required fullWidth label="Price" type="number" value={values.price} onChange={(event) => setValues({ ...values, price: Math.max(0, Number(event.target.value)) })} inputProps={{ min: 0, step: 0.01 }} />
          </Stack>
          <Box><Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Schedule</Typography><ScheduleFields schedule={values.schedule} onChange={(schedule) => setValues({ ...values, schedule, modules: synchronizeLiveLessons(values.modules, schedule, values.meeting_link) })} allowFlexible /></Box>
          <TextField required fullWidth label="Meeting Link" type="url" placeholder="https://" value={values.meeting_link} onChange={(event) => setValues({ ...values, meeting_link: event.target.value, modules: synchronizeLiveLessons(values.modules, values.schedule, event.target.value) })} />
          <Box><Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Class curriculum</Typography><CourseEditor curriculumOnly liveLessonSettings={{ meetingUrl: values.meeting_link, getScheduledAt: (lesson, isNew) => getScheduledAt(values.schedule, getLiveLessonIndex(values.modules, lesson, isNew)) }} course={{ id: classRecord?.id ?? 0, title: values.title, category: 'Class', level: '', tutor: '', status: 'Draft', students: 0, price: values.price, cover: '', description: '', longDescription: '', learningOutcomes: [], requirements: [], certificate: false, updatedAt: '', modules: normalizeModules(values.modules) }} onChange={(course) => setValues({ ...values, modules: synchronizeLiveLessons(course.modules, values.schedule, values.meeting_link) })} /></Box>
          <Box sx={{ display: 'flex\',, alignItems: \'center\', justifyContent: \'space-between\', gap: 2, p: 2, border: 1, borderColor: \'divider\', borderRadius: 1, backgroundColor: \'background.default' }}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{values.published ? 'Published class' : 'Unpublished class'}</Typography><Typography color="text.secondary" variant="caption">Only published classes appear in Active Classes.</Typography></Box><Switch checked={values.published} onChange={(event) => setValues({ ...values, published: event.target.checked })} inputProps={{ 'aria-label': 'Publish class' }} /></Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => onSave(values)} disabled={!canSave}>{classRecord ? 'Save changes' : 'Create class'}</Button></DialogActions>
    </Dialog>
  )
}

const ClassDetail: FC<{ classRecord: AdminClass | undefined; enrollments: ClassEnrollment[]; onBack: () => void; onEdit: () => void; onRemoveEnrollment: (enrollment: ClassEnrollment) => void; onPromote: (enrollment: ClassEnrollment) => void; onAttendance: (enrollmentId: number, lessonId: number, status: 'Present' | 'Absent') => Promise<void> }> = ({ classRecord, enrollments, onBack, onEdit, onRemoveEnrollment, onPromote, onAttendance }) => {
  const [tab, setTab] = useState('roster')
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent'>>({})

  if (!classRecord) return <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography variant="h6" sx={{ mb: 1 }}>Class not found</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>This class is no longer available in the workspace.</Typography><Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back to Active Classes</Button></Paper>

  const enrolled = enrollments.filter((enrollment) => enrollment.status === 'enrolled')
  const waitlisted = enrollments.filter((enrollment) => enrollment.status === 'waitlisted')
  const isAtCapacity = enrolled.length >= classRecord.capacity
  const liveLessons = (Array.isArray(classRecord.modules) ? classRecord.modules : []).flatMap((module) => module.lessons).filter((lesson) => lesson.type === 'live')
  const rosterColumns: DataColumn<ClassEnrollment>[] = [
    { key: 'student_name', label: 'Student Name' },
    { key: 'enrolled_date', label: 'Enrolled Date' },
    { key: 'status', label: 'Attendance Summary', render: (_, enrollment) => <Typography color="text.secondary" variant="body2">{enrollment.id % 2 === 0 ? '4 of 4 sessions' : '3 of 4 sessions'}</Typography> },
  ]
  const waitlistColumns: DataColumn<ClassEnrollment>[] = [
    { key: 'student_name', label: 'Student Name' },
    { key: 'enrolled_date', label: 'Waitlisted Date' },
  ]

  return (
    <>
      <WorkspaceHeading title={classRecord.title} description={`${programLabels[classRecord.program_id]} · ${tutorName(classRecord.tutor_id)}`} action={<Stack direction="row" spacing={1}><Button startIcon={<ArrowBackIcon />} onClick={onBack}>Active Classes</Button><Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={onEdit}>Edit class</Button></Stack>} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Enrollment</Typography><Typography variant="h5">{enrolled.length} / {classRecord.capacity}</Typography></Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Schedule</Typography><Typography variant="h6">{formatSchedule(classRecord.schedule)}</Typography></Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>Status</Typography><ClassStatusChip status={classRecord.status} /></Paper>
      </Stack>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}><Tabs value={tab} onChange={(_, nextTab) => setTab(nextTab)} aria-label="Class detail tabs"><Tab value="roster" label={`Roster (${enrolled.length})`} /></Tabs></Box>
        {tab === 'roster' && <Box sx={{ p: 2 }}><AdminDataTable rows={enrolled} columns={rosterColumns} searchPlaceholder="Search roster" searchKeys={['student_name']} actions={(enrollment) => <Stack direction="row" spacing={1} alignItems="center"><Stack direction="row" spacing={1}>{liveLessons.map((lesson) => { const key = `${enrollment.id}-${lesson.id}`; return <FormControl key={key} size="small" sx={{ minWidth: 120 }}><InputLabel>{lesson.title}</InputLabel><Select label={lesson.title} value={attendance[key] ?? ''} onChange={async (event) => { const status = event.target.value as 'Present' | 'Absent'; await onAttendance(enrollment.id, lesson.id, status); setAttendance((current) => ({ ...current, [key]: status })) }}><MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem></Select></FormControl> })}</Stack><Tooltip title={`Remove ${enrollment.student_name} from the roster`}><IconButton size="small" color="error" onClick={() => onRemoveEnrollment(enrollment)} aria-label={`Remove ${enrollment.student_name}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></Stack>} /></Box>}
      </Paper>
      {waitlisted.length > 0 && <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, p: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}><Box><Typography variant="h6">Waitlist</Typography><Typography color="text.secondary" variant="body2">{isAtCapacity ? 'This class is full. Remove a roster student before promoting someone.' : 'A seat is available. Promote a waitlisted student to the roster.'}</Typography></Box><Chip label={`${waitlisted.length} waiting`} size="small" color="warning" /></Box>
        <Divider />
        <Box sx={{ p: 2 }}><AdminDataTable rows={waitlisted} columns={waitlistColumns} searchPlaceholder="Search waitlist" searchKeys={['student_name']} actions={(enrollment) => <Button size="small" variant="outlined" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => onPromote(enrollment)} disabled={isAtCapacity}>Promote to enrolled</Button>} /></Box>
      </Paper>}
    </>
  )
}

interface ClassesWorkspaceProps {
  view: ClassesView
  classId?: number
}

const ClassesWorkspace: FC<ClassesWorkspaceProps> = ({ view, classId }) => {
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([])
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [assignmentStudent, setAssignmentStudent] = useState<PendingStudent | null>(null)
  const [editingClassId, setEditingClassId] = useState<number | null>(null)

  const loadWorkspace = async () => {
    setIsLoading(true)
    try {
      const workspace = await getAdminClassesWorkspace()
      tutors = workspace.tutors
      setClasses(workspace.classes.map((classRecord) => ({ ...classRecord, schedule: normalizeSchedule(classRecord.schedule) })))
      setClassEnrollments(workspace.enrollments)
      setPendingStudents(workspace.pendingStudents)
    } catch (error) {
      toast.add({ title: 'Unable to load classes', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadWorkspace() }, [])

  const enrolledCount = (targetClassId: number, enrollments = classEnrollments) => enrollments.filter((enrollment) => enrollment.class_id === targetClassId && enrollment.status === 'enrolled').length

  const handleAssignStudent = async (student: PendingStudent, values: PendingAssignmentValue) => {
    try {
      const classRecord = await assignAdminClass(student.id, { title: `International Interactive · ${student.student_name}`, tutor_id: values.tutor_id, capacity: values.capacity, schedule: values.schedule, meeting_link: values.meeting_link.trim(), price: 0 })
      setAssignmentStudent(null)
      await loadWorkspace()
      toast.add({ title: 'Class created', description: `${student.student_name} has been added to the new class roster.`, type: 'success' })
      navigateTo(`/admin/classes/${classRecord.id}`)
    } catch (error) {
      toast.add({ title: 'Unable to create class', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const handleSaveClass = async (values: ClassFormValue) => {
    const editingClass = classes.find((classRecord) => classRecord.id === editingClassId)
    try {
      const classRecord = editingClass
        ? await updateAdminClass({ ...editingClass, ...values, title: values.title.trim(), meeting_link: values.meeting_link.trim(), modules: synchronizeLiveLessons(values.modules, values.schedule, values.meeting_link.trim()) })
        : await createAdminClass({ ...values, title: values.title.trim(), meeting_link: values.meeting_link.trim(), modules: synchronizeLiveLessons(values.modules, values.schedule, values.meeting_link.trim()) })
      setEditingClassId(null)
      await loadWorkspace()
      toast.add({ title: editingClass ? 'Class saved' : 'Class created', description: `${classRecord.title} is ready to manage.`, type: 'success' })
      navigateTo(`/admin/classes/${classRecord.id}`)
    } catch (error) {
      toast.add({ title: 'Unable to save class', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const handleRemoveEnrollment = async (enrollment: ClassEnrollment) => {
    if (!window.confirm(`Remove ${enrollment.student_name} from this class roster?`)) return
    try {
      await removeAdminClassEnrollment(enrollment.id)
      await loadWorkspace()
      toast.add({ title: 'Student removed', description: `${enrollment.student_name} has been removed from the roster.`, type: 'success' })
    } catch (error) {
      toast.add({ title: 'Unable to remove student', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const handleDeleteClass = async (classRecord: AdminClass) => {
    if (!window.confirm(`Delete ${classRecord.title}? This cannot be undone.`)) return
    try {
      await deleteAdminClass(classRecord)
      await loadWorkspace()
      toast.add({ title: 'Class deleted', description: `${classRecord.title} was removed.`, type: 'success' })
    } catch (error) {
      toast.add({ title: 'Unable to delete class', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const handleAttendance = async (enrollmentId: number, lessonId: number, status: 'Present' | 'Absent') => {
    try {
      await updateAdminClassAttendance(enrollmentId, lessonId, status)
      toast.add({ title: 'Attendance saved', description: `Student marked ${status}.`, type: 'success' })
    } catch (error) {
      toast.add({ title: 'Unable to save attendance', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
      throw error
    }
  }

  const handlePromoteEnrollment = async (enrollment: ClassEnrollment) => {
    const classRecord = classes.find((currentClass) => currentClass.id === enrollment.class_id)
    if (!classRecord || enrolledCount(classRecord.id) >= classRecord.capacity) return
    try {
      await updateAdminClassEnrollment(enrollment.id, 'enrolled')
      await loadWorkspace()
      toast.add({ title: 'Student promoted', description: `${enrollment.student_name} has been moved to the class roster.`, type: 'success' })
    } catch (error) {
      toast.add({ title: 'Unable to promote student', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const activeClasses = useMemo(() => classes.filter((classRecord) => classRecord.published), [classes])
  const selectedClass = classes.find((classRecord) => classRecord.id === classId)
  const selectedEnrollments = useMemo(() => classEnrollments.filter((enrollment) => enrollment.class_id === classId), [classEnrollments, classId])
  const pendingColumns: DataColumn<PendingStudent>[] = [
    { key: 'student_name', label: 'Student Name' },
    { key: 'enrolled_date', label: 'Enrolled Date' },
    { key: 'age', label: 'Age' },
  ]
  const activeColumns: DataColumn<AdminClass>[] = [
    { key: 'title', label: 'Title' },
    { key: 'program_id', label: 'Program', render: (value) => programLabels[value as ProgramId] },
    { key: 'tutor_id', label: 'Tutor', render: (value) => tutorName(Number(value)) },
    { key: 'capacity', label: 'Enrolled/Capacity', render: (value, classRecord) => `${enrolledCount(classRecord.id)} / ${value}` },
    { key: 'schedule', label: 'Schedule', render: (value) => formatSchedule(value as ClassSchedule) },
    { key: 'status', label: 'Status', render: (value) => <ClassStatusChip status={value as ClassStatus} /> },
  ]

  if (view === 'detail') return <><ClassDetail classRecord={selectedClass} enrollments={selectedEnrollments} onBack={() => navigateTo('/admin/classes/active')} onEdit={() => setEditingClassId(selectedClass?.id ?? null)} onRemoveEnrollment={handleRemoveEnrollment} onPromote={handlePromoteEnrollment} onAttendance={handleAttendance} /><ClassEditorDialog classRecord={classes.find((classRecord) => classRecord.id === editingClassId) ?? null} open={editingClassId !== null} onClose={() => setEditingClassId(null)} onSave={handleSaveClass} /></>

  if (view === 'pending') return <>
    <WorkspaceHeading title="Pending Scheduling" description="Paid International Online Interactive enrollees who still need a class assignment." />
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'background.paper' }}><EventAvailableOutlinedIcon color="primary" /><Typography color="text.secondary" variant="body2">Students move off this list as soon as a class and roster enrollment are created.</Typography></Paper>
    <AdminDataTable rows={pendingStudents} columns={pendingColumns} searchPlaceholder="Search pending students" searchKeys={['student_name']} actions={(student) => <Button size="small" variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setAssignmentStudent(student)}>Assign &amp; Schedule</Button>} />
    <AssignScheduleDialog student={assignmentStudent} onClose={() => setAssignmentStudent(null)} onSave={handleAssignStudent} />
  </>

  return <>
    <WorkspaceHeading title="Active Classes" description="Published classes across International, Summer Camp, and Ministry Exam Prep." action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigateTo('/admin/classes/new')}>New Class</Button>} />
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'background.paper' }}><GroupsOutlinedIcon color="primary" /><Typography color="text.secondary" variant="body2">Summer Camp and Ministry Exam Prep batches are created up front. International Online Interactive classes are created from Pending Scheduling.</Typography></Paper>
    <AdminDataTable rows={activeClasses} columns={activeColumns} searchPlaceholder="Search active classes" searchKeys={['title', 'program_id']} rowClick={(classRecord) => navigateTo(`/admin/classes/${classRecord.id}`)} actions={(classRecord) => <Stack direction="row" spacing={0.5} justifyContent="flex-end"><Button size="small" onClick={() => navigateTo(`/admin/classes/${classRecord.id}`)}>View</Button><Tooltip title={`Delete ${classRecord.title}`}><IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); void handleDeleteClass(classRecord) }} aria-label={`Delete ${classRecord.title}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></Stack>} />
    <ClassEditorDialog classRecord={null} open={view === 'new'} onClose={() => navigateTo('/admin/classes/active')} onSave={handleSaveClass} />
  </>
}

export default ClassesWorkspace
