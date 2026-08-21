import { useMemo, useState, type FC, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { type FormEvent, useEffect } from 'react'
import { Logo } from '@/components/logo'
import { navigateTo } from '@/lib/navigation'
import { clearAuthenticatedUser } from '@/services/api'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { courses, payments, registrations, tutors, users, type AdminCourse, type AdminModule, type Registration } from './admin-data'

const drawerWidth = 272

type Section = 'overview' | 'courses' | 'registrations' | 'tutors' | 'blog' | 'payments' | 'users'

const navigation: Array<{ key: Section; label: string; icon: ReactNode }> = [
  { key: 'overview', label: 'Overview', icon: <DashboardOutlinedIcon /> },
  { key: 'courses', label: 'Programs & Courses', icon: <SchoolOutlinedIcon /> },
  { key: 'registrations', label: 'Registrations', icon: <PeopleOutlineIcon /> },
  { key: 'tutors', label: 'Tutors', icon: <PersonOutlineIcon /> },
  { key: 'blog', label: 'Bookstore & Blog', icon: <BookOutlinedIcon /> },
  { key: 'payments', label: 'Payments & Reports', icon: <PaymentsOutlinedIcon /> },
  { key: 'users', label: 'Users', icon: <GroupOutlinedIcon /> },
]

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (['Published', 'Approved', 'Active', 'Paid'].includes(status)) return 'success'
  if (['Pending', 'Draft', 'Waitlisted'].includes(status)) return 'warning'
  if (['Rejected', 'Suspended', 'Refunded'].includes(status)) return 'error'
  return 'default'
}

const StatusChip: FC<{ status: string }> = ({ status }) => <Chip label={status} color={statusColor(status)} size="small" />

const PageHeading: FC<{ title: string; description: string; action?: ReactNode }> = ({ title, description, action }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
    {action}
  </Box>
)

const StatCard: FC<{ label: string; value: string; detail: string; icon: ReactNode }> = ({ label, value, detail, icon }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 200 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
    </Box>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{value}</Typography>
    <Typography color="text.secondary" variant="body2">{detail}</Typography>
  </Paper>
)

const CourseEditor: FC<{ course: AdminCourse; onChange: (course: AdminCourse) => void }> = ({ course, onChange }) => {
  const [draggedModule, setDraggedModule] = useState<number | null>(null)
  const [draggedLesson, setDraggedLesson] = useState<{ moduleId: number; index: number } | null>(null)
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>(() => course.modules.map((module) => module.id))
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  useEffect(() => {
    setExpandedModuleIds(course.modules.map((module) => module.id))
    setIsAddingModule(false)
    setNewModuleTitle('')
  }, [course.id])

  const moveModule = (targetId: number) => {
    if (draggedModule === null || draggedModule === targetId) return
    const from = course.modules.findIndex((module) => module.id === draggedModule)
    const to = course.modules.findIndex((module) => module.id === targetId)
    const next = [...course.modules]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange({ ...course, modules: next })
    setDraggedModule(null)
  }

  const moveLesson = (moduleId: number, targetIndex: number) => {
    if (!draggedLesson || draggedLesson.moduleId !== moduleId || draggedLesson.index === targetIndex) return
    const nextModules = course.modules.map((module) => {
      if (module.id !== moduleId) return module
      const lessons = [...module.lessons]
      const [moved] = lessons.splice(draggedLesson.index, 1)
      lessons.splice(targetIndex, 0, moved)
      return { ...module, lessons }
    })
    onChange({ ...course, modules: nextModules })
    setDraggedLesson(null)
  }

  const moveLessonToModule = (sourceModuleId: number, lessonIndex: number, targetModuleId: number) => {
    if (sourceModuleId === targetModuleId) return
    const sourceModule = course.modules.find((module) => module.id === sourceModuleId)
    const lesson = sourceModule?.lessons[lessonIndex]
    if (!sourceModule || lesson === undefined) return

    const nextModules = course.modules.map((module) => {
      if (module.id === sourceModuleId) return { ...module, lessons: module.lessons.filter((_, index) => index !== lessonIndex) }
      if (module.id === targetModuleId) return { ...module, lessons: [...module.lessons, lesson] }
      return module
    })
    onChange({ ...course, modules: nextModules })
    setExpandedModuleIds((ids) => ids.includes(targetModuleId) ? ids : [...ids, targetModuleId])
  }

  const addLesson = (moduleId: number) => {
    const nextModules = course.modules.map((module) => {
      if (module.id !== moduleId) return module
      return { ...module, lessons: [...module.lessons, `New lesson ${module.lessons.length + 1}`] }
    })
    onChange({ ...course, modules: nextModules })
  }

  const addModule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newModuleTitle.trim()
    if (!title) return

    const nextModuleId = Math.max(0, ...course.modules.map((module) => module.id)) + 1
    onChange({ ...course, modules: [...course.modules, { id: nextModuleId, title, lessons: [] }] })
    setExpandedModuleIds((ids) => [...ids, nextModuleId])
    setNewModuleTitle('')
    setIsAddingModule(false)
  }

  return (
    <Paper id="course-curriculum-editor" elevation={0} sx={{ mt: 3, p: 2.5, border: 1, borderColor: 'divider', scrollMarginTop: 24 }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h6">Course curriculum</Typography>
          <Typography color="text.secondary" variant="body2">{course.title}</Typography>
        </Box>
        <StatusChip status={course.status} />
      </Box>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Drag modules to reorder modules. Drag lessons to reorder lessons within the same module.</Typography>
      <Stack spacing={1.5}>
        {course.modules.map((module) => {
          const isExpanded = expandedModuleIds.includes(module.id)

          return (
            <Paper
              key={module.id}
              elevation={0}
              draggable
              onDragStart={() => setDraggedModule(module.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveModule(module.id)}
              sx={{ p: 1.5, backgroundColor: 'background.default', border: 1, borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setExpandedModuleIds((ids) => isExpanded ? ids.filter((id) => id !== module.id) : [...ids, module.id])}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${module.title}`}
                  aria-expanded={isExpanded}
                >
                  <ChevronRightIcon sx={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 160ms ease' }} fontSize="small" />
                </IconButton>
                <DragIndicatorIcon color="disabled" fontSize="small" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{module.title}</Typography>
                  <Typography color="text.secondary" variant="caption">{module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}</Typography>
                </Box>
              </Box>
              {isExpanded && (
                <Stack spacing={0.5} sx={{ mt: 1, ml: 5 }}>
                  {module.lessons.map((lesson, index) => (
                    <Box
                      key={`${module.id}-${lesson}-${index}`}
                      draggable
                      onDragStart={(event) => {
                        event.stopPropagation()
                        setDraggedLesson({ moduleId: module.id, index })
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.stopPropagation()
                        moveLesson(module.id, index)
                      }}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, backgroundColor: 'background.paper', borderRadius: 1 }}
                    >
                      <DragIndicatorIcon color="disabled" fontSize="small" />
                      <Typography variant="body2" sx={{ flex: 1 }}>{lesson}</Typography>
                      {course.modules.length > 1 && (
                        <Select
                          value=""
                          displayEmpty
                          size="small"
                          onChange={(event) => moveLessonToModule(module.id, index, Number(event.target.value))}
                          renderValue={() => 'Move to module'}
                          inputProps={{ 'aria-label': `Move ${lesson} to module` }}
                          sx={{ minWidth: 145 }}
                        >
                          <MenuItem disabled value="">Move to module</MenuItem>
                          {course.modules.filter((targetModule) => targetModule.id !== module.id).map((targetModule) => (
                            <MenuItem key={targetModule.id} value={targetModule.id}>{targetModule.title}</MenuItem>
                          ))}
                        </Select>
                      )}
                    </Box>
                  ))}
                  <Box
                    component="button"
                    type="button"
                    onClick={() => addLesson(module.id)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', p: 0.5, color: 'primary.main', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
                  >
                    <AddIcon fontSize="small" /> Add lesson
                  </Box>
                </Stack>
              )}
            </Paper>
          )
        })}
        {isAddingModule ? (
          <Box component="form" onSubmit={addModule} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              autoFocus
              required
              size="small"
              fullWidth
              label="Module title"
              value={newModuleTitle}
              onChange={(event) => setNewModuleTitle(event.target.value)}
            />
            <IconButton type="submit" color="primary" aria-label="Save module"><CheckIcon /></IconButton>
            <IconButton type="button" onClick={() => setIsAddingModule(false)} aria-label="Cancel adding module"><CloseIcon /></IconButton>
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => setIsAddingModule(true)}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', p: 0, color: 'primary.main', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
          >
            <AddIcon fontSize="small" /> Add module
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

const DashboardCharts: FC = () => {
  const theme = useTheme()
  const revenuePoints = '20,148 110,132 200,144 290,96 380,112 470,70 560,84'
  const enrollments = [56, 80, 44, 92, 68]
  const courseLabels = ['Data', 'Docker', 'React', 'Design', 'Mobile']

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Revenue overview</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Monthly revenue performance</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Revenue trend chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          <polyline points={revenuePoints} fill="none" stroke={theme.palette.primary.main} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {revenuePoints.split(' ').map((point) => {
            const [cx, cy] = point.split(',')
            return <circle key={point} cx={cx} cy={cy} r="5" fill={theme.palette.background.paper} stroke={theme.palette.primary.main} strokeWidth="3" />
          })}
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((label, index) => <text key={label} x={20 + index * 90} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{label}</text>)}
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Course enrollments</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Students enrolled by category</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Course enrollment chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          {enrollments.map((value, index) => {
            const height = value * 1.25
            const x = 45 + index * 105
            return <g key={courseLabels[index]}><rect x={x} y={160 - height} width="48" height={height} rx="5" fill={index % 2 ? theme.palette.secondary.main : theme.palette.primary.main} /><text x={x + 24} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{courseLabels[index]}</text></g>
          })}
        </Box>
      </Paper>
    </Stack>
  )
}

const OverviewPage: FC = () => (
  <>
    <PageHeading title="Dashboard overview" description="A snapshot of your learning platform." />
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <StatCard label="Total revenue" value="$24,680" detail="12.5% from last month" icon={<PaymentsOutlinedIcon />} />
      <StatCard label="Active students" value="1,284" detail="8.2% from last month" icon={<GroupOutlinedIcon />} />
      <StatCard label="Published courses" value="48" detail="6 courses in draft" icon={<SchoolOutlinedIcon />} />
      <StatCard label="Active tutors" value="32" detail="4 pending approvals" icon={<PersonOutlineIcon />} />
    </Stack>
    <DashboardCharts />
  </>
)

interface NewCourseDraft {
  title: string
  category: string
  tutor: string
  price: string
}

const CoursesPage: FC = () => {
  const [courseRows, setCourseRows] = useState(courses)
  const [selectedId, setSelectedId] = useState(courses[0].id)
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [newCourseDraft, setNewCourseDraft] = useState<NewCourseDraft>({ title: '', category: '', tutor: 'Maya Chen', price: '' })
  const selectedCourse = courseRows.find((course) => course.id === selectedId) ?? courseRows[0]
  const tutorOptions = ['Maya Chen', 'Leon Kennedy', 'Jhon Dwirian', 'Rizki Known']

  const openCourseDialog = () => {
    setEditingCourseId(null)
    setNewCourseDraft({ title: '', category: '', tutor: tutorOptions[0], price: '' })
    setIsCourseDialogOpen(true)
  }

  const openEditDialog = (course: AdminCourse) => {
    setEditingCourseId(course.id)
    setNewCourseDraft({ title: course.title, category: course.category, tutor: course.tutor, price: String(course.price) })
    setIsCourseDialogOpen(true)
  }

  const deleteCourse = (course: AdminCourse) => {
    if (!window.confirm(`Delete ${course.title}? This cannot be undone.`)) return

    const remainingCourses = courseRows.filter((row) => row.id !== course.id)
    setCourseRows(remainingCourses)
    if (selectedId === course.id) setSelectedId(remainingCourses[0]?.id ?? -1)
  }

  const saveCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const courseDetails = {
      title: newCourseDraft.title.trim(),
      category: newCourseDraft.category.trim(),
      tutor: newCourseDraft.tutor,
      price: Number(newCourseDraft.price),
    }

    if (editingCourseId !== null) {
      setCourseRows((rows) => rows.map((row) => row.id === editingCourseId ? { ...row, ...courseDetails } : row))
    } else {
      const nextCourse: AdminCourse = {
        id: Math.max(0, ...courseRows.map((course) => course.id)) + 1,
        ...courseDetails,
        status: 'Draft',
        students: 0,
        modules: [{ id: 1, title: 'Course introduction', lessons: [] }],
      }
      setCourseRows((rows) => [...rows, nextCourse])
      setSelectedId(nextCourse.id)
    }

    setIsCourseDialogOpen(false)
  }

  return (
    <>
      <PageHeading title="Programs & Courses" description="Manage your catalog, tutors, and learning content." action={<Button label="New course" onClick={openCourseDialog} />} />
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        {courseRows.map((course) => (
          <Box key={course.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 240, cursor: 'pointer' }} onClick={() => setSelectedId(course.id)}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{course.title}</Typography>
              <Typography variant="body2" color="text.secondary">{course.category} · {course.students} students · ${course.price}</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Tutor</InputLabel>
              <Select
                label="Tutor"
                value={course.tutor}
                onChange={(event) => setCourseRows((rows) => rows.map((row) => row.id === course.id ? { ...row, tutor: event.target.value } : row))}
              >
                {tutorOptions.map((tutor) => <MenuItem key={tutor} value={tutor}>{tutor}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" alignItems="center" spacing={1}>
              <StatusChip status={course.status} />
              <Switch
                checked={course.status === 'Published'}
                onChange={() => setCourseRows((rows) => rows.map((row) => row.id === course.id ? { ...row, status: row.status === 'Published' ? 'Draft' : 'Published' } : row))}
                inputProps={{ 'aria-label': `Publish ${course.title}` }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Button
                label="Curriculum"
                size="small"
                variant="text"
                onClick={() => {
                  setSelectedId(course.id)
                  window.setTimeout(() => document.getElementById('course-curriculum-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
                }}
              />
              <Tooltip title={`Edit ${course.title}`}>
                <IconButton size="small" onClick={() => openEditDialog(course)} aria-label={`Edit ${course.title}`}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Delete ${course.title}`}>
                <IconButton size="small" color="error" onClick={() => deleteCourse(course)} aria-label={`Delete ${course.title}`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        ))}
      </Paper>
      {selectedCourse && <CourseEditor course={selectedCourse} onChange={(next) => setCourseRows((rows) => rows.map((row) => row.id === next.id ? next : row))} />}
      <Dialog open={isCourseDialogOpen} onClose={() => setIsCourseDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={saveCourse}>
          <DialogTitle>{editingCourseId === null ? 'Create a new course' : 'Edit course'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Course title"
                value={newCourseDraft.title}
                onChange={(event) => setNewCourseDraft((draft) => ({ ...draft, title: event.target.value }))}
              />
              <TextField
                required
                fullWidth
                label="Category"
                value={newCourseDraft.category}
                onChange={(event) => setNewCourseDraft((draft) => ({ ...draft, category: event.target.value }))}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel>Tutor</InputLabel>
                  <Select
                    label="Tutor"
                    value={newCourseDraft.tutor}
                    onChange={(event) => setNewCourseDraft((draft) => ({ ...draft, tutor: event.target.value }))}
                  >
                    {tutorOptions.map((tutor) => <MenuItem key={tutor} value={tutor}>{tutor}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  required
                  fullWidth
                  label="Price"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={newCourseDraft.price}
                  onChange={(event) => setNewCourseDraft((draft) => ({ ...draft, price: event.target.value }))}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button label="Cancel" variant="text" onClick={() => setIsCourseDialogOpen(false)} />
            <Button label={editingCourseId === null ? 'Create course' : 'Save changes'} type="submit" />
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

const RegistrationsPage: FC = () => {
  const [rows, setRows] = useState(registrations)
  const columns: DataColumn<Registration>[] = [
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Course' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  const updateStatus = (id: number, status: Registration['status']) => setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row))

  return (
    <>
      <PageHeading title="Registrations" description="Review and manage incoming course registrations." />
      <AdminDataTable rows={rows} columns={columns} searchPlaceholder="Search registrations" actions={(row) => (
        <Stack direction="row" spacing={0.5}>
          <Button label="Approve" size="small" onClick={() => updateStatus(row.id, 'Approved')} />
          <Button label="Waitlist" size="small" variant="outlined" onClick={() => updateStatus(row.id, 'Waitlisted')} />
          <Button label="Reject" size="small" variant="text" onClick={() => updateStatus(row.id, 'Rejected')} />
        </Stack>
      )} />
    </>
  )
}

const TutorsPage: FC = () => {
  const columns: DataColumn<(typeof tutors)[number]>[] = [
    { key: 'name', label: 'Tutor' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'courses', label: 'Courses' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return <><PageHeading title="Tutors" description="Manage instructors and their course assignments." action={<Button label="Invite tutor" />} /><AdminDataTable rows={tutors} columns={columns} searchPlaceholder="Search tutors" /></>
}

const PaymentsPage: FC = () => {
  const columns: DataColumn<(typeof payments)[number]>[] = [
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Course' },
    { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return (
    <>
      <PageHeading title="Payments & Reports" description="Track platform revenue and payment activity." />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <StatCard label="Total revenue" value="$24,680" detail="All-time collected" icon={<PaymentsOutlinedIcon />} />
        <StatCard label="Pending payments" value="$1,240" detail="12 transactions" icon={<AssessmentOutlinedIcon />} />
        <StatCard label="This month" value="$4,860" detail="18.4% increase" icon={<AssessmentOutlinedIcon />} />
      </Stack>
      <AdminDataTable rows={payments} columns={columns} searchPlaceholder="Search payments" />
    </>
  )
}

const UsersPage: FC = () => {
  const columns: DataColumn<(typeof users)[number]>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'joined', label: 'Joined' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]
  return <><PageHeading title="Users" description="Manage learners, tutors, and administrator accounts." action={<Button label="Add user" />} /><AdminDataTable rows={users} columns={columns} searchPlaceholder="Search users" /></>
}

const SimplePage: FC<{ title: string; description: string; icon: ReactNode }> = ({ title, description, icon }) => (
  <>
    <PageHeading title={title} description={description} />
    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: 1, borderColor: 'divider' }}>
      <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
      <Typography variant="h6">Content workspace</Typography>
      <Typography color="text.secondary">This area is ready for bookstore and blog content management.</Typography>
    </Paper>
  </>
)

const Button: FC<{ label: string; onClick?: () => void; size?: 'small' | 'medium'; variant?: 'contained' | 'outlined' | 'text'; type?: 'button' | 'submit' }> = ({ label, onClick, size = 'medium', variant = 'contained', type = 'button' }) => (
  <Box
    component="button"
    type={type}
    onClick={onClick}
    sx={{
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main',
      borderRadius: 6,
      px: size === 'small' ? 1.25 : 2,
      py: size === 'small' ? 0.5 : 1,
      backgroundColor: variant === 'contained' ? 'primary.main' : 'transparent',
      color: variant === 'text' ? 'primary.main' : variant === 'contained' ? 'primary.contrastText' : 'primary.main',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: size === 'small' ? 12 : 14,
      '&:hover': { backgroundColor: variant === 'contained' ? 'primary.dark' : 'action.hover' },
    }}
  >
    {label}
  </Box>
)

const AdminLoadingState = () => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 'modal',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: 'background.default',
    }}
    role="status"
    aria-live="polite"
  >
    <CircularProgress aria-label="Loading admin workspace" />
    <Typography color="text.secondary">Loading admin workspace...</Typography>
  </Box>
)

interface AdminDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const getSectionFromPath = (pathname: string): Section => {
  const pathSection = pathname.split('/')[2]
  return navigation.some(({ key }) => key === pathSection) ? (pathSection as Section) : 'overview'
}

const AdminDashboard: FC<AdminDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [section, setSection] = useState<Section>(() => getSectionFromPath(window.location.pathname))
  const [isLoading, setIsLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)

  const selectSection = (next: Section) => {
    navigateTo(next === 'overview' ? '/admin' : `/admin/${next}`)
    setSection(next)
    setMobileOpen(false)
  }

  const handleSignOut = () => {
    clearAuthenticatedUser()
    navigateTo('/', true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 400)
    const handlePopState = () => setSection(getSectionFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const currentPage = useMemo(() => {
    switch (section) {
      case 'courses': return <CoursesPage />
      case 'registrations': return <RegistrationsPage />
      case 'tutors': return <TutorsPage />
      case 'blog': return <SimplePage title="Bookstore & Blog" description="Manage books, articles, and publishing content." icon={<BookOutlinedIcon fontSize="large" />} />
      case 'payments': return <PaymentsPage />
      case 'users': return <UsersPage />
      default: return <OverviewPage />
    }
  }, [section])

  const sidebar = (
    <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5 }}><Logo /></Box>
      <Divider />
      <Box component="nav" sx={{ p: 1.5, flex: 1 }}>
        {navigation.map((item) => (
          <Box
            key={item.key}
            component="button"
            onClick={() => selectSection(item.key)}
            sx={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, border: 0, borderRadius: 2, px: 1.5, py: 1.25, mb: 0.5,
              backgroundColor: section === item.key ? 'primary.main' : 'transparent', color: section === item.key ? 'primary.contrastText' : 'text.secondary',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', '&:hover': { backgroundColor: section === item.key ? 'primary.dark' : 'action.hover' },
            }}
          >
            {item.icon}<Typography variant="body2" sx={{ fontWeight: section === item.key ? 600 : 400 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: 'background.default', borderRadius: 2 }}><SettingsOutlinedIcon color="disabled" fontSize="small" /><Typography variant="body2" color="text.secondary">Settings</Typography></Box></Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }} aria-busy={isLoading}>
      {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebar}</Drawer> : <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: drawerWidth, zIndex: 'drawer' }}>{sidebar}</Box>}
      <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
        <Box component="header" sx={{ height: 72, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} aria-label="Open admin menu"><MenuIcon /></IconButton>}
            <Typography variant="h5" sx={{ display: { xs: 'none', sm: 'block' } }}>Admin workspace</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                {darkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Admin profile">
              <IconButton onClick={(event) => setProfileAnchor(event.currentTarget)} aria-label="Open admin profile">
                <AccountCircleOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
              <MenuItem onClick={() => setProfileAnchor(null)}><PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />Admin profile</MenuItem>
              <MenuItem onClick={handleSignOut}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Sign out</MenuItem>
            </Menu>
          </Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440 }}>
          {currentPage}
        </Box>
      </Box>
      {isLoading && <AdminLoadingState />}
    </Box>
  )
}

export default AdminDashboard
