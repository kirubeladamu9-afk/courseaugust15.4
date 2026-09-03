import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useEffect, useMemo, useState } from 'react'
import { CourseEditor } from '@/components/admin/admin-dashboard'
import { createAdminClass, createAdminCourse, deleteAdminClass, deleteAdminCourse, getAuthenticatedUser, getTutorClasses, getTutorClassStudents, getTutorCourses, getTutorOverview, updateAdminClass, updateAdminCourse, updateTutorClassAttendance, updateTutorProfile, type AdminClass, type TutorClass, type TutorClassStudent, type TutorOverview } from '@/services/api'
import { type AdminCourse, type AdminModule } from '@/components/admin/admin-data'
import { navigateTo } from '@/lib/navigation'
import { signOut } from '@/services/api'

type View = 'overview' | 'courses' | 'classes' | 'students' | 'profile'

const statItems = (overview: TutorOverview) => [
  { label: 'Assigned courses', value: overview.totalCourses, icon: <SchoolOutlinedIcon color="primary" /> },
  { label: 'Assigned classes', value: overview.totalClasses, icon: <ClassOutlinedIcon color="primary" /> },
  { label: 'Active students', value: overview.totalStudents, icon: <GroupsOutlinedIcon color="primary" /> },
  { label: 'Upcoming classes', value: overview.upcomingClasses, icon: <DashboardOutlinedIcon color="primary" /> },
]

interface StudentsAttendanceViewProps {
  selectedClass: TutorClass
  students: TutorClassStudent[]
  liveLessons: AdminModule['lessons']
  onMarkAttendance: (student: TutorClassStudent, lessonId: number, status: 'Present' | 'Absent') => Promise<void>
  onBack: () => void
}

const StudentsAttendanceView = ({ selectedClass, students, liveLessons, onMarkAttendance, onBack }: StudentsAttendanceViewProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const selectedSession = liveLessons.find((lesson) => lesson.id === selectedSessionId)
  const now = Date.now()
  const isPast = (lesson: AdminModule['lessons'][number]) => Boolean(lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() < now)
  const attended = (student: TutorClassStudent) => liveLessons.filter((lesson) => student.attendance[lesson.id] === 'Present').length

  if (selectedSession) return <>
    <Button onClick={() => setSelectedSessionId(null)} sx={{ mb: 2 }}>Back to sessions</Button>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{selectedSession.title}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>{selectedSession.scheduledAt ? new Date(selectedSession.scheduledAt).toLocaleString() : 'Schedule pending'} · Attendance marking</Typography>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography sx={{ flex: 1, fontWeight: 700 }}>Enrolled student</Typography><Typography sx={{ width: 220, fontWeight: 700 }}>Join-click reference</Typography><Typography sx={{ width: 180, fontWeight: 700 }}>Attendance</Typography></Stack>
      {students.map((student) => <Stack key={student.id} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail}</Typography></Box><Typography variant="body2" color="text.secondary" sx={{ width: { md: 220 } }}>{student.sessionJoinClicks[selectedSession.id] ? new Date(student.sessionJoinClicks[selectedSession.id]).toLocaleString() : 'No join click recorded'}</Typography><Select size="small" value={student.attendance[selectedSession.id] ?? ''} displayEmpty onChange={(event) => void onMarkAttendance(student, selectedSession.id, event.target.value as 'Present' | 'Absent')} sx={{ width: { xs: '100%', md: 180 } }}><MenuItem value=""><em>Not marked</em></MenuItem><MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem></Select></Stack>)}
    </Paper>
  </>

  return <>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}><Box><Button onClick={onBack} sx={{ mb: 1 }}>Back to My Classes</Button><Typography variant="h4">{selectedClass.title}</Typography><Typography color="text.secondary">Students & attendance</Typography></Box></Stack>
    <Typography variant="h5" sx={{ mb: 2 }}>Roster</Typography>
    <Paper elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider', overflow: 'hidden' }}><Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography sx={{ flex: 1, fontWeight: 700 }}>Student</Typography><Typography sx={{ width: 190, fontWeight: 700 }}>Enrolled</Typography><Typography sx={{ width: 190, fontWeight: 700 }}>Attendance</Typography></Stack>{students.map((student) => <Stack key={student.id} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail}</Typography></Box><Typography variant="body2" color="text.secondary" sx={{ width: { md: 190 } }}>{student.enrolledDate}</Typography><Typography variant="body2" sx={{ width: { md: 190 }, fontWeight: 600 }}>{attended(student)}/{liveLessons.length} sessions attended</Typography></Stack>)}</Paper>
    <Typography variant="h5" sx={{ mb: 2 }}>Sessions</Typography>
    <Stack spacing={1.5}>{liveLessons.length === 0 && <Typography color="text.secondary">No live sessions have been added to this class.</Typography>}{liveLessons.map((lesson) => <Paper key={lesson.id} component={isPast(lesson) ? 'button' : 'div'} type={isPast(lesson) ? 'button' : undefined} onClick={isPast(lesson) ? () => setSelectedSessionId(lesson.id) : undefined} elevation={0} sx={{ width: '100%', p: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', textAlign: 'left', backgroundColor: 'background.paper', cursor: isPast(lesson) ? 'pointer' : 'default', '&:hover': isPast(lesson) ? { borderColor: 'primary.main' } : undefined }}><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{lesson.title}</Typography><Typography variant="body2" color="text.secondary">{lesson.scheduledAt ? new Date(lesson.scheduledAt).toLocaleString() : 'Schedule pending'}</Typography></Box><Chip label={isPast(lesson) ? 'Mark attendance' : 'Not yet occurred'} color={isPast(lesson) ? 'primary' : 'default'} variant="outlined" /></Paper>)}</Stack>
  </>
}

const TutorDashboard = ({ darkMode, onToggleDarkMode }: { darkMode: boolean; onToggleDarkMode: () => void }) => {
  const [view, setView] = useState<View>('overview')
  const [overview, setOverview] = useState<TutorOverview | null>(null)
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof getTutorCourses>>>([])
  const [classes, setClasses] = useState<TutorClass[]>([])
  const [students, setStudents] = useState<TutorClassStudent[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [profile, setProfile] = useState({ name: '', phone: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [courseDraft, setCourseDraft] = useState<AdminCourse | null>(null)
  const [classDraft, setClassDraft] = useState<{ record?: TutorClass; course: AdminCourse; schedule: { startDate: string; endDate: string } } | null>(null)
  const user = getAuthenticatedUser()

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextOverview, nextCourses, nextClasses] = await Promise.all([getTutorOverview(), getTutorCourses(), getTutorClasses()])
      setOverview(nextOverview)
      setCourses(nextCourses)
      setClasses(nextClasses)
      setProfile({ name: nextOverview.tutor.name, phone: nextOverview.tutor.phone, bio: nextOverview.tutor.bio })
      if (nextClasses[0]) setSelectedClassId(nextClasses[0].id)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load tutor portal.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (view !== 'students' || selectedClassId === '') return
    void getTutorClassStudents(selectedClassId).then(setStudents).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load students.'))
  }, [view, selectedClassId])

  const selectedClass = classes.find((classRecord) => classRecord.id === selectedClassId)
  const liveLessons = useMemo(() => selectedClass?.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.type === 'live') ?? [], [selectedClass])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileSaved(false)
    try {
      const updated = await updateTutorProfile(profile)
      setOverview((current) => current ? { ...current, tutor: updated } : current)
      setProfile({ name: updated.name, phone: updated.phone, bio: updated.bio })
      setProfileSaved(true)
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : 'Unable to save profile.')
    } finally { setSaving(false) }
  }

  const manageCourse = (course?: AdminCourse) => {
    setCourseDraft(course ?? { id: 0, title: 'New course', category: 'Development', level: 'Beginner', tutor: overview?.tutor.name ?? '', status: 'Draft', students: 0, price: 0, cover: '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg', description: '', longDescription: '', learningOutcomes: [], requirements: [], certificate: false, updatedAt: '', modules: [] })
  }

  const saveCourseDraft = async () => {
    if (!courseDraft) return
    setSaving(true)
    try {
      const saved = courseDraft.id ? await updateAdminCourse(courseDraft) : await createAdminCourse(courseDraft)
      setCourses((current) => courseDraft.id ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
      setCourseDraft(null)
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save course.') } finally { setSaving(false) }
  }

  const removeCourse = async (course: AdminCourse) => {
    if (!window.confirm(`Delete ${course.title}? This cannot be undone.`)) return
    try { await deleteAdminCourse(course.id); setCourses((current) => current.filter((item) => item.id !== course.id)) } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete course.') }
  }

  const manageClass = (classRecord?: TutorClass) => {
    if (!overview) return
    const startDate = classRecord?.schedule.startDate ?? window.prompt('Class start date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))?.trim() ?? ''
    const endDate = classRecord?.schedule.endDate ?? window.prompt('Class end date (YYYY-MM-DD)', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))?.trim() ?? ''
    if (!startDate || !endDate) return
    setClassDraft({ record: classRecord, schedule: { startDate, endDate }, course: { id: classRecord?.id ?? 0, title: classRecord?.title ?? 'New class', category: 'Class', level: '', tutor: overview.tutor.name, status: 'Draft', students: classRecord?.enrolledCount ?? 0, price: classRecord?.price ?? 0, cover: '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg', description: '', longDescription: '', learningOutcomes: [], requirements: [], certificate: false, updatedAt: '', modules: classRecord?.modules ?? [] } })
  }

  const saveClassDraft = async () => {
    if (!classDraft || !overview) return
    setSaving(true)
    const record = classDraft.record
    const payload = record ? { ...(record as unknown as AdminClass), title: classDraft.course.title, tutor_id: overview.tutor.id, meeting_link: record.meetingLink, schedule: classDraft.schedule, modules: classDraft.course.modules } : { title: classDraft.course.title, program_id: 'summer-camp' as const, tutor_id: overview.tutor.id, capacity: 12, schedule: classDraft.schedule, meeting_link: '', modules: classDraft.course.modules, price: 0, published: false }
    try {
      const saved = record ? await updateAdminClass(payload as Omit<AdminClass, 'status'>) : await createAdminClass(payload as Omit<AdminClass, 'id' | 'status'>)
      setClasses((current) => record ? current.map((item) => item.id === saved.id ? { ...item, title: saved.title, modules: saved.modules } : item) : [{ ...saved, programId: saved.program_id, meetingLink: saved.meeting_link, courseId: null, courseTitle: null, enrolledCount: 0, modules: saved.modules }, ...current])
      setClassDraft(null)
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save class.') } finally { setSaving(false) }
  }

  const removeClass = async (classRecord: TutorClass) => {
    if (!window.confirm(`Delete ${classRecord.title}? This cannot be undone.`)) return
    try { await deleteAdminClass(classRecord as unknown as AdminClass); setClasses((current) => current.filter((item) => item.id !== classRecord.id)) } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete class.') }
  }

  const markAttendance = async (student: TutorClassStudent, lessonId: number, status: 'Present' | 'Absent') => {
    try {
      await updateTutorClassAttendance(student.id, lessonId, status)
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, attendance: { ...item.attendance, [lessonId]: status } } : item))
    } catch (attendanceError) { setError(attendanceError instanceof Error ? attendanceError.message : 'Unable to save attendance.') }
  }

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress aria-label="Loading tutor portal" /></Box>

  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Box sx={{ px: { xs: 2, md: 5 }, py: 2, backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
        <Box><Typography variant="h5" sx={{ fontWeight: 700 }}>Tutor Portal</Typography><Typography variant="body2" color="text.secondary">Welcome, {user?.name || overview?.tutor.name || 'Tutor'}</Typography></Box>
        <Stack direction="row" spacing={1}><Button size="small" onClick={onToggleDarkMode}>{darkMode ? 'Light mode' : 'Dark mode'}</Button><Button size="small" onClick={() => { void signOut().then(() => navigateTo('/', true)) }}>Sign out</Button></Stack>
      </Stack>
    </Box>
    <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {courseDraft && <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: 1, borderColor: 'primary.main' }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5">Edit course content</Typography><Stack direction="row" spacing={1}><Button onClick={() => setCourseDraft(null)}>Cancel</Button><Button variant="contained" onClick={() => void saveCourseDraft()} disabled={saving}>Save course</Button></Stack></Stack><CourseEditor course={courseDraft} onChange={setCourseDraft} /></Paper>}
      {classDraft && <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: 1, borderColor: 'primary.main' }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5">Edit class curriculum</Typography><Stack direction="row" spacing={1}><Button onClick={() => setClassDraft(null)}>Cancel</Button><Button variant="contained" onClick={() => void saveClassDraft()} disabled={saving}>Save class</Button></Stack></Stack><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}><TextField fullWidth label="Class title" value={classDraft.course.title} onChange={(event) => setClassDraft((current) => current ? { ...current, course: { ...current.course, title: event.target.value } } : current)} /><TextField fullWidth label="Start date" type="date" value={classDraft.schedule.startDate} onChange={(event) => setClassDraft((current) => current ? { ...current, schedule: { ...current.schedule, startDate: event.target.value } } : current)} InputLabelProps={{ shrink: true }} /><TextField fullWidth label="End date" type="date" value={classDraft.schedule.endDate} onChange={(event) => setClassDraft((current) => current ? { ...current, schedule: { ...current.schedule, endDate: event.target.value } } : current)} InputLabelProps={{ shrink: true }} /></Stack><CourseEditor curriculumOnly course={classDraft.course} onChange={(course) => setClassDraft((current) => current ? { ...current, course } : current)} /></Paper>}
      <Tabs value={view} onChange={(_, next) => { setView(next); setError(''); if (next !== 'profile') setProfileError('') }} variant="fullWidth" aria-label="Tutor portal sections" sx={{ mb: 3 }}>
        <Tab value="overview" label="Overview" /><Tab value="courses" label="My Courses" /><Tab value="classes" label="My Classes" /><Tab value="students" label="Students & Attendance" /><Tab value="profile" label="Profile" />
      </Tabs>
      {error && view !== 'profile' && <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'error.main' }}><Typography color="error">{error}</Typography></Paper>}
      {profileError && view === 'profile' && <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'error.main' }}><Typography color="error">{profileError}</Typography></Paper>}
      {view === 'overview' && overview && <><Typography variant="h4" sx={{ mb: 3 }}>Teaching overview</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>{statItems(overview).map((item) => <Card key={item.label} elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography color="text.secondary" variant="body2">{item.label}</Typography>{item.icon}</Stack><Typography variant="h4" sx={{ mt: 1 }}>{item.value}</Typography></CardContent></Card>)}</Box><Paper elevation={0} sx={{ mt: 3, p: 3, border: 1, borderColor: 'divider' }}><Typography variant="h6" sx={{ mb: 1 }}>Your teaching assignments</Typography><Typography color="text.secondary">Manage class rosters, attendance, and your profile from the sections above.</Typography></Paper></>}
      {view === 'courses' && <><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}><Typography variant="h4">My courses</Typography><Button variant="contained" onClick={() => void manageCourse()}>Create course</Button></Stack><Stack spacing={2}>{courses.length ? courses.map((course) => <Paper key={course.id} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h6">{course.title}</Typography><Typography color="text.secondary">{course.category} · {course.students} students</Typography></Box><Stack direction="row" spacing={1} alignItems="center"><Chip label={course.status} color={course.status === 'Published' ? 'success' : 'default'} size="small" /><Button size="small" onClick={() => void manageCourse(course)}>Edit</Button><Button size="small" color="error" onClick={() => void removeCourse(course)}>Delete</Button></Stack></Stack></Paper>) : <Typography color="text.secondary">No courses assigned yet.</Typography>}</Stack></>}
      {view === 'classes' && <><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}><Typography variant="h4">My classes</Typography><Button variant="contained" onClick={() => void manageClass()}>Create class</Button></Stack><Stack spacing={2}>{classes.length ? classes.map((classRecord) => <Paper key={classRecord.id} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h6">{classRecord.title}</Typography><Typography color="text.secondary">{classRecord.enrolledCount} / {classRecord.capacity} students · {classRecord.status}</Typography><Typography color="text.secondary" variant="body2">{classRecord.schedule.startDate || 'Start date pending'} – {classRecord.schedule.endDate || 'End date pending'}</Typography></Box><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => { setSelectedClassId(classRecord.id); setView('students') }}>Students</Button><Button size="small" onClick={() => void manageClass(classRecord)}>Edit</Button><Button size="small" color="error" onClick={() => void removeClass(classRecord)}>Delete</Button></Stack></Stack></Paper>) : <Typography color="text.secondary">No classes assigned yet.</Typography>}</Stack></>}
      {view === 'students' && selectedClass && <StudentsAttendanceView selectedClass={selectedClass} students={students} liveLessons={liveLessons} onMarkAttendance={markAttendance} onBack={() => setView('classes')} />}
      {view === 'students' && !selectedClass && <><Typography variant="h4" sx={{ mb: 3 }}>Students & attendance</Typography><FormControl sx={{ minWidth: { xs: '100%', sm: 360 }, mb: 2 }}><InputLabel>Class</InputLabel><Select label="Class" value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value as number)}>{classes.map((classRecord) => <MenuItem key={classRecord.id} value={classRecord.id}>{classRecord.title}</MenuItem>)}</Select></FormControl>{selectedClass && <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}><Typography variant="subtitle2">Join-click reference</Typography><Typography variant="caption" color="text.secondary">A Join Class click is a reference only; select Present or Absent to record attendance.</Typography><Stack spacing={0.5} sx={{ mt: 1 }}>{students.flatMap((student) => liveLessons.filter((lesson) => student.sessionJoinClicks[lesson.id]).map((lesson) => <Typography key={`${student.id}-${lesson.id}`} variant="caption">{student.studentName} · {lesson.title}: {new Date(student.sessionJoinClicks[lesson.id]).toLocaleString()}</Typography>))}</Stack></Paper>}{selectedClass && <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'auto' }}><Box sx={{ minWidth: 700 }}><Stack direction="row" sx={{ p: 2, backgroundColor: 'background.default', fontWeight: 700 }}><Typography sx={{ flex: 1 }}>Student</Typography>{liveLessons.map((lesson) => <Typography key={lesson.id} sx={{ width: 150 }}>{lesson.title}</Typography>)}</Stack><Divider />{students.length ? students.map((student) => <Stack key={student.id} direction="row" alignItems="center" sx={{ p: 2 }}><Box sx={{ flex: 1 }}><Typography>{student.studentName}</Typography><Typography variant="caption" color="text.secondary">{student.studentEmail}</Typography></Box>{liveLessons.map((lesson) => <FormControl key={lesson.id} size="small" sx={{ width: 140 }}><Select value={student.attendance[lesson.id] ?? ''} displayEmpty inputProps={{ 'aria-label': `${student.studentName} attendance for ${lesson.title}` }} onChange={(event) => void markAttendance(student, lesson.id, event.target.value as 'Present' | 'Absent')}><MenuItem value="">Not marked</MenuItem><MenuItem value="Present">Present</MenuItem><MenuItem value="Absent">Absent</MenuItem></Select></FormControl>)}</Stack>) : <Typography color="text.secondary" sx={{ p: 3 }}>No students enrolled in this class.</Typography>}</Box></Paper>}</>}
      {view === 'profile' && <><Typography variant="h4" sx={{ mb: 0.5 }}>Tutor profile</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Keep your contact details and teaching bio up to date for students and administrators.</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch"><Paper elevation={0} sx={{ p: 3, width: { xs: '100%', md: 240 }, border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><Avatar sx={{ width: 88, height: 88, mb: 2, fontSize: 30, fontWeight: 700, backgroundColor: 'primary.main' }}>{profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'}</Avatar><Typography variant="h6">{profile.name || 'Tutor'}</Typography><Typography variant="body2" color="text.secondary">Tutor account</Typography></Paper><Paper component="form" onSubmit={saveProfile} elevation={0} sx={{ p: { xs: 2, md: 3 }, flex: 1, border: 1, borderColor: 'divider' }}><Stack spacing={2}><TextField label="Full name" value={profile.name} onChange={(event) => { setProfile({ ...profile, name: event.target.value }); setProfileSaved(false) }} required fullWidth /><TextField label="Phone number" placeholder="Add a phone number" value={profile.phone} onChange={(event) => { setProfile({ ...profile, phone: event.target.value }); setProfileSaved(false) }} fullWidth /><TextField label="Teaching bio" placeholder="Tell students about your teaching experience" value={profile.bio} onChange={(event) => { setProfile({ ...profile, bio: event.target.value }); setProfileSaved(false) }} multiline minRows={5} fullWidth /><Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}><Typography variant="caption" color="text.secondary">Your profile is visible in the tutor portal.</Typography><Button type="submit" variant="contained" disabled={saving} startIcon={<PersonOutlineIcon />}>{saving ? 'Saving...' : 'Save profile'}</Button></Stack>{profileSaved && <Typography color="success.main" role="status">Profile updated successfully.</Typography>}</Stack></Paper></Stack></>}
    </Box>
  </Box>
}

export default TutorDashboard
