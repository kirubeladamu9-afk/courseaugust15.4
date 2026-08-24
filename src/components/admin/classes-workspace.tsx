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
import { assignAdminClass, createAdminClass, getAdminClassesWorkspace, removeAdminClassEnrollment, updateAdminClass, updateAdminClassEnrollment } from '@/services/api'
import AdminDataTable, { type DataColumn } from './admin-data-table'

type ProgramId = 'international-online-interactive' | 'summer-camp' | 'ministry-exam-prep'
type ClassStatus = 'pending_schedule' | 'open' | 'full' | 'closed'
type EnrollmentStatus = 'enrolled' | 'waitlisted'
type ClassesView = 'pending' | 'active' | 'new' | 'detail'

interface ClassSchedule {
  days: string[]
  time: string
  flexible: boolean
}

interface AdminClass {
  id: number
  program_id: ProgramId
  title: string
  tutor_id: number
  capacity: number
  schedule: ClassSchedule
  meeting_link: string
  course_id: number | null
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

interface CourseOption {
  id: number
  title: string
}

interface ClassFormValue {
  title: string
  program_id: ProgramId
  tutor_id: number
  capacity: number
  schedule: ClassSchedule
  meeting_link: string
  course_id: number | null
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
let linkedCourses: CourseOption[] = []

const formatTime = (time: string) => {
  if (!time) return 'Time to be confirmed'
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

const formatSchedule = (schedule?: Partial<ClassSchedule> | null) => {
  if (!schedule || !Array.isArray(schedule.days)) return 'Schedule to be confirmed'
  if (schedule.flexible) return 'Flexible'
  return `${schedule.days.join(', ')} · ${formatTime(schedule.time ?? '')}`
}
const tutorName = (tutorId: number) => tutors.find((tutor) => tutor.id === tutorId)?.name ?? 'Unassigned tutor'
const courseName = (courseId: number | null) => linkedCourses.find((course) => course.id === courseId)?.title ?? 'No linked course'

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
  const toggleDay = (day: string) => onChange({ ...schedule, days: schedule.days.includes(day) ? schedule.days.filter((currentDay) => currentDay !== day) : [...schedule.days, day] })

  return (
    <Stack spacing={1}>
      {allowFlexible && <FormControlLabel control={<Switch checked={schedule.flexible} onChange={(event) => onChange({ ...schedule, flexible: event.target.checked })} inputProps={{ 'aria-label': 'Use a flexible schedule' }} />} label="Flexible schedule" />}
      {!schedule.flexible && <>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Days</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
          {weekdays.map((day) => <FormControlLabel key={day} sx={{ mr: 1 }} control={<Checkbox size="small" checked={schedule.days.includes(day)} onChange={() => toggleDay(day)} />} label={day} />)}
        </Box>
        <TextField required label="Time" type="time" value={schedule.time} onChange={(event) => onChange({ ...schedule, time: event.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'Class time' }} sx={{ maxWidth: { xs: '100%', sm: 220 } }} />
      </>}
    </Stack>
  )
}

const AssignScheduleDialog: FC<{ student: PendingStudent | null; onClose: () => void; onSave: (student: PendingStudent, values: PendingAssignmentValue) => void }> = ({ student, onClose, onSave }) => {
  const [values, setValues] = useState<PendingAssignmentValue>({ tutor_id: 0, capacity: 1, schedule: { days: ['Mon', 'Wed'], time: '16:00', flexible: false }, meeting_link: '' })

  useEffect(() => {
    if (student) setValues({ tutor_id: tutors[0]?.id ?? 0, capacity: 1, schedule: { days: ['Mon', 'Wed'], time: '16:00', flexible: false }, meeting_link: '' })
  }, [student])

  const canSave = values.capacity >= 1 && Boolean(values.meeting_link.trim()) && (values.schedule.flexible || (values.schedule.days.length > 0 && Boolean(values.schedule.time)))

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

const emptyClassForm = (): ClassFormValue => ({
  title: '',
  program_id: 'summer-camp',
  tutor_id: tutors[0]?.id ?? 0,
  capacity: 12,
  schedule: { days: ['Mon', 'Wed'], time: '10:00', flexible: false },
  meeting_link: '',
  course_id: null,
  price: 0,
  published: true,
})

const ClassEditorDialog: FC<{ classRecord: AdminClass | null; open: boolean; onClose: () => void; onSave: (values: ClassFormValue) => void }> = ({ classRecord, open, onClose, onSave }) => {
  const [values, setValues] = useState<ClassFormValue>(emptyClassForm)

  useEffect(() => {
    if (!open) return
    setValues(classRecord ? { title: classRecord.title, program_id: classRecord.program_id, tutor_id: classRecord.tutor_id, capacity: classRecord.capacity, schedule: { ...classRecord.schedule, days: [...classRecord.schedule.days] }, meeting_link: classRecord.meeting_link, course_id: classRecord.course_id, price: classRecord.price, published: classRecord.published } : emptyClassForm())
  }, [classRecord, open])

  const canSave = Boolean(values.title.trim() && values.meeting_link.trim() && values.capacity >= 1 && (values.schedule.flexible || (values.schedule.days.length > 0 && values.schedule.time)))
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
          <Box><Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Schedule</Typography><ScheduleFields schedule={values.schedule} onChange={(schedule) => setValues({ ...values, schedule })} allowFlexible /></Box>
          <TextField required fullWidth label="Meeting Link" type="url" placeholder="https://" value={values.meeting_link} onChange={(event) => setValues({ ...values, meeting_link: event.target.value })} />
          <FormControl fullWidth><InputLabel>Linked Course</InputLabel><Select label="Linked Course" value={values.course_id ?? ''} onChange={(event) => setValues({ ...values, course_id: event.target.value === '' ? null : Number(event.target.value) })}><MenuItem value="">No linked course</MenuItem>{linkedCourses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}</Select><Typography color="text.secondary" variant="caption">Optionally link a course for the Ministry Exam Prep curriculum.</Typography></FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.default' }}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{values.published ? 'Published class' : 'Unpublished class'}</Typography><Typography color="text.secondary" variant="caption">Only published classes appear in Active Classes.</Typography></Box><Switch checked={values.published} onChange={(event) => setValues({ ...values, published: event.target.checked })} inputProps={{ 'aria-label': 'Publish class' }} /></Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => onSave(values)} disabled={!canSave}>{classRecord ? 'Save changes' : 'Create class'}</Button></DialogActions>
    </Dialog>
  )
}

const ClassDetail: FC<{ classRecord: AdminClass | undefined; enrollments: ClassEnrollment[]; onBack: () => void; onEdit: () => void; onRemoveEnrollment: (enrollment: ClassEnrollment) => void; onPromote: (enrollment: ClassEnrollment) => void }> = ({ classRecord, enrollments, onBack, onEdit, onRemoveEnrollment, onPromote }) => {
  const [tab, setTab] = useState('roster')

  if (!classRecord) return <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography variant="h6" sx={{ mb: 1 }}>Class not found</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>This class is no longer available in the workspace.</Typography><Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back to Active Classes</Button></Paper>

  const enrolled = enrollments.filter((enrollment) => enrollment.status === 'enrolled')
  const waitlisted = enrollments.filter((enrollment) => enrollment.status === 'waitlisted')
  const isAtCapacity = enrolled.length >= classRecord.capacity
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
        {tab === 'roster' && <Box sx={{ p: 2 }}><AdminDataTable rows={enrolled} columns={rosterColumns} searchPlaceholder="Search roster" searchKeys={['student_name']} actions={(enrollment) => <Tooltip title={`Remove ${enrollment.student_name} from the roster`}><IconButton size="small" color="error" onClick={() => onRemoveEnrollment(enrollment)} aria-label={`Remove ${enrollment.student_name}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>} /></Box>}
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
      linkedCourses = workspace.courses
      setClasses(workspace.classes)
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
        ? await updateAdminClass({ ...editingClass, ...values, title: values.title.trim(), meeting_link: values.meeting_link.trim() })
        : await createAdminClass({ ...values, title: values.title.trim(), meeting_link: values.meeting_link.trim() })
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

  if (view === 'detail') return <><ClassDetail classRecord={selectedClass} enrollments={selectedEnrollments} onBack={() => navigateTo('/admin/classes/active')} onEdit={() => setEditingClassId(selectedClass?.id ?? null)} onRemoveEnrollment={handleRemoveEnrollment} onPromote={handlePromoteEnrollment} /><ClassEditorDialog classRecord={classes.find((classRecord) => classRecord.id === editingClassId) ?? null} open={editingClassId !== null} onClose={() => setEditingClassId(null)} onSave={handleSaveClass} /></>

  if (view === 'pending') return <>
    <WorkspaceHeading title="Pending Scheduling" description="Paid International Online Interactive enrollees who still need a class assignment." />
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'background.paper' }}><EventAvailableOutlinedIcon color="primary" /><Typography color="text.secondary" variant="body2">Students move off this list as soon as a class and roster enrollment are created.</Typography></Paper>
    <AdminDataTable rows={pendingStudents} columns={pendingColumns} searchPlaceholder="Search pending students" searchKeys={['student_name']} actions={(student) => <Button size="small" variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setAssignmentStudent(student)}>Assign &amp; Schedule</Button>} />
    <AssignScheduleDialog student={assignmentStudent} onClose={() => setAssignmentStudent(null)} onSave={handleAssignStudent} />
  </>

  return <>
    <WorkspaceHeading title="Active Classes" description="Published classes across International, Summer Camp, and Ministry Exam Prep." action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigateTo('/admin/classes/new')}>New Class</Button>} />
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: 'background.paper' }}><GroupsOutlinedIcon color="primary" /><Typography color="text.secondary" variant="body2">Summer Camp and Ministry Exam Prep batches are created up front. International Online Interactive classes are created from Pending Scheduling.</Typography></Paper>
    <AdminDataTable rows={activeClasses} columns={activeColumns} searchPlaceholder="Search active classes" searchKeys={['title', 'program_id']} rowClick={(classRecord) => navigateTo(`/admin/classes/${classRecord.id}`)} actions={(classRecord) => <Button size="small" onClick={() => navigateTo(`/admin/classes/${classRecord.id}`)}>View</Button>} />
    <ClassEditorDialog classRecord={null} open={view === 'new'} onClose={() => navigateTo('/admin/classes/active')} onSave={handleSaveClass} />
  </>
}

export default ClassesWorkspace
