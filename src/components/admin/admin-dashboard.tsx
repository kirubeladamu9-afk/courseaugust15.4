import { useMemo, type FC, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LockResetIcon from '@mui/icons-material/LockReset'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import InsertLinkOutlinedIcon from '@mui/icons-material/InsertLinkOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import TitleIcon from '@mui/icons-material/Title'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from '@/components/toast'
import { Logo } from '@/components/logo'
import { StyledButton } from '@/components/styled-button'
import { navigateTo } from '@/lib/navigation'
import { changePassword, type AdminDashboardOverview, createAdminCourse, createAdminTutor, deleteAdminCourse, deleteAdminTutor, getAdminCourse, getAdminCourses, getAdminDashboardOverview, getAdminTutor, getAdminTutors, getAdminUsers, getAuthenticatedUser, resetAdminUserPassword, signOut, updateAdminCourse, updateAdminTutor, updateAdminTutorStatus, updateAdminUserStatus, type AuthUser } from '@/services/api'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { payments, registrations, type AdminCourse, type AdminLesson, type AdminTutor, type AdminUser, type LessonType, type Registration } from './admin-data'

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

const CourseEditorSection: FC<{ title: string; description?: string; expanded: boolean; onToggle: () => void; withTopMargin?: boolean; children: ReactNode }> = ({ title, description, expanded, onToggle, withTopMargin = false, children }) => (
  <Accordion expanded={expanded} onChange={onToggle} disableGutters elevation={0} sx={{ mt: withTopMargin ? 1 : 0, border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Box><Typography variant="h6">{title}</Typography>{description && <Typography color="text.secondary" variant="body2">{description}</Typography>}</Box></AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
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

const RepeatableBulletList: FC<{ title: string; values: string[]; onChange: (values: string[]) => void }> = ({ title, values, onChange }) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const updateValue = (index: number, value: string) => onChange(values.map((currentValue, currentIndex) => currentIndex === index ? value : currentValue))
  const addValue = () => {
    const nextIndex = values.length
    onChange([...values, ''])
    setFocusedIndex(nextIndex)
  }

  return <Box>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
    <Stack spacing={1}>
      {values.map((value, index) => <Box key={`${title}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography color="primary.main">•</Typography><TextField fullWidth size="small" placeholder={`Add ${title.toLowerCase()} point`} value={value} autoFocus={focusedIndex === index} onFocus={() => setFocusedIndex(null)} onChange={(event) => updateValue(index, event.target.value)} /><IconButton size="small" onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))} aria-label={`Remove ${title} point ${index + 1}`}><CloseIcon fontSize="small" /></IconButton></Box>)}
      <Box component="button" type="button" onClick={addValue} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', p: 0.5, color: 'primary.main', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}><AddIcon fontSize="small" /> Add point</Box>
    </Stack>
  </Box>
}

const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0m'
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h${minutes ? ` ${minutes}m` : ''}` : `${minutes}m`
}

const getModuleDuration = (module: AdminCourse['modules'][number]) => module.lessons.reduce((total, lesson) => total + (lesson.duration ?? lesson.estimatedDuration ?? 0), 0)
const getLessonLabel = (lesson: AdminLesson) => lesson.type === 'video' ? (lesson.duration ? formatDuration(lesson.duration) : 'Processing') : lesson.type === 'article' ? 'Article' : lesson.type === 'quiz' ? 'Quiz' : 'Live'

const LessonTypeIcon: FC<{ type: LessonType; fontSize?: 'small' | 'medium' }> = ({ type, fontSize = 'small' }) => {
  if (type === 'article') return <ArticleOutlinedIcon fontSize={fontSize} />
  if (type === 'quiz') return <QuizOutlinedIcon fontSize={fontSize} />
  if (type === 'live') return <InsertLinkOutlinedIcon fontSize={fontSize} />
  return <PlayCircleOutlineIcon fontSize={fontSize} />
}

const createLesson = (id: number, type: LessonType): AdminLesson => ({
  id, title: `New ${type} lesson`, type, duration: null, resources: [],
  ...(type === 'article' ? { articleBody: '' } : {}),
  ...(type === 'quiz' ? { passThreshold: 70, quizQuestions: [] } : {}),
  ...(type === 'live' ? { meetingUrl: '', scheduledAt: '', estimatedDuration: 3600 } : {}),
})

const lessonTypeOptions: Array<{ type: LessonType; label: string; detail: string }> = [
  { type: 'video', label: 'Video', detail: 'Upload a lecture' },
  { type: 'article', label: 'Article', detail: 'Write a lesson' },
  { type: 'quiz', label: 'Quiz', detail: 'Test learning' },
  { type: 'live', label: 'Live', detail: 'Schedule a session' },
]

type LessonPanelState = { moduleId: number; lesson: AdminLesson; isNew: boolean }

const CourseEditor: FC<{ course: AdminCourse; onChange: (course: AdminCourse) => void }> = ({ course, onChange }) => {
  const [draggedModule, setDraggedModule] = useState<number | null>(null)
  const [draggedLesson, setDraggedLesson] = useState<{ moduleId: number; index: number } | null>(null)
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>(() => course.modules.map((module) => module.id))
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')
  const [addingLessonModuleId, setAddingLessonModuleId] = useState<number | null>(null)
  const [lessonPanel, setLessonPanel] = useState<LessonPanelState | null>(null)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [expandedSections, setExpandedSections] = useState<string[]>(['curriculum'])

  useEffect(() => {
    setExpandedModuleIds(course.modules.map((module) => module.id))
    setIsAddingModule(false)
    setNewModuleTitle('')
    setEditingModuleId(null)
    setAddingLessonModuleId(null)
    setLessonPanel(null)
    setVideoUploadProgress(0)
    setExpandedSections(['curriculum'])
  }, [course.id])

  const toggleSection = (section: string) => {
    setExpandedSections((sections) => sections.includes(section) ? sections.filter((currentSection) => currentSection !== section) : [...sections, section])
  }

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
    if (!sourceModule || !lesson) return
    onChange({ ...course, modules: course.modules.map((module) => module.id === sourceModuleId ? { ...module, lessons: module.lessons.filter((_, index) => index !== lessonIndex) } : module.id === targetModuleId ? { ...module, lessons: [...module.lessons, lesson] } : module) })
    setExpandedModuleIds((ids) => ids.includes(targetModuleId) ? ids : [...ids, targetModuleId])
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

  const saveModuleTitle = (moduleId: number) => {
    const title = editingModuleTitle.trim()
    if (title) onChange({ ...course, modules: course.modules.map((module) => module.id === moduleId ? { ...module, title } : module) })
    setEditingModuleId(null)
  }

  const deleteModule = (module: AdminCourse['modules'][number]) => {
    const warning = module.lessons.length ? `Delete ${module.title} and its ${module.lessons.length} ${module.lessons.length === 1 ? 'lesson' : 'lessons'}? This cannot be undone.` : `Delete ${module.title}?`
    if (!window.confirm(warning)) return
    onChange({ ...course, modules: course.modules.filter((currentModule) => currentModule.id !== module.id) })
    if (lessonPanel?.moduleId === module.id) setLessonPanel(null)
  }

  const openLessonPanel = (moduleId: number, lesson: AdminLesson, isNew: boolean) => {
    setAddingLessonModuleId(null)
    setVideoUploadProgress(0)
    setLessonPanel({ moduleId, lesson: { ...lesson, resources: [...lesson.resources], quizQuestions: lesson.quizQuestions?.map((question) => ({ ...question, options: [...question.options] })) }, isNew })
  }

  const updateLessonDraft = (nextLesson: AdminLesson) => setLessonPanel((panel) => panel ? { ...panel, lesson: nextLesson } : panel)

  const deleteLesson = (moduleId: number, lessonId: number) => {
    onChange({ ...course, modules: course.modules.map((module) => module.id === moduleId ? { ...module, lessons: module.lessons.filter((lesson) => lesson.id !== lessonId) } : module) })
    if (lessonPanel?.lesson.id === lessonId) setLessonPanel(null)
  }

  const saveLesson = () => {
    if (!lessonPanel) return
    const lesson = { ...lessonPanel.lesson, title: lessonPanel.lesson.title.trim() }
    if (!lesson.title) return
    onChange({ ...course, modules: course.modules.map((module) => module.id === lessonPanel.moduleId ? { ...module, lessons: lessonPanel.isNew ? [...module.lessons, lesson] : module.lessons.map((currentLesson) => currentLesson.id === lesson.id ? lesson : currentLesson) } : module) })
    setLessonPanel(null)
  }

  const handleVideoFile = (file: File) => {
    if (!lessonPanel) return
    if (file.size > 6 * 1024 * 1024) {
      toast.add({ title: 'Video is too large', description: 'Choose a video smaller than 6 MB.', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !lessonPanel) return
      const videoUrl = reader.result
      updateLessonDraft({ ...lessonPanel.lesson, videoUrl, duration: null })
      setVideoUploadProgress(12)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        setLessonPanel((panel) => panel ? { ...panel, lesson: { ...panel.lesson, duration: Math.max(1, Math.round(video.duration)) } } : panel)
      }
      video.src = videoUrl
      window.setTimeout(() => setVideoUploadProgress(100), 700)
    }
    reader.readAsDataURL(file)
  }

  const addResources = (files: FileList | null) => {
    if (!lessonPanel || !files?.length) return
    const highestResourceId = Math.max(0, ...lessonPanel.lesson.resources.map((resource) => resource.id))
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') return
        const resource = { id: highestResourceId + index + 1, name: file.name, url: reader.result }
        setLessonPanel((panel) => panel ? { ...panel, lesson: { ...panel.lesson, resources: [...panel.lesson.resources, resource] } } : panel)
      }
      reader.readAsDataURL(file)
    })
  }

  const isVideoProcessing = lessonPanel?.lesson.type === 'video' && videoUploadProgress > 0 && videoUploadProgress < 100
  const cannotSaveLesson = Boolean(!lessonPanel?.lesson.title.trim() || isVideoProcessing || (lessonPanel?.isNew && lessonPanel.lesson.type === 'video' && !lessonPanel.lesson.videoUrl))
  const handleThumbnailFile = (file: File) => {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
    if (!supportedTypes.includes(file.type)) {
      toast.add({ title: 'Unsupported thumbnail', description: 'Choose a JPG, PNG, GIF, WebP, or AVIF image.', type: 'error' })
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.add({ title: 'Thumbnail is too large', description: 'Choose an image smaller than 6 MB.', type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange({ ...course, cover: reader.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Paper id="course-curriculum-editor" elevation={0} sx={{ mt: 3, p: 2.5, border: 1, borderColor: 'divider', scrollMarginTop: 24 }}>
      <CourseEditorSection expanded={expandedSections.includes('details')} onToggle={() => toggleSection('details')} title="Course details" description="Edit the information learners see before they enroll.">
          <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField required fullWidth label="Course title" value={course.title} onChange={(event) => onChange({ ...course, title: event.target.value })} />
          <FormControl fullWidth required><InputLabel>Program</InputLabel><Select label="Program" value={course.category} onChange={(event) => onChange({ ...course, category: event.target.value })}><MenuItem value="Data">Data</MenuItem><MenuItem value="Development">Development</MenuItem><MenuItem value="Design">Design</MenuItem><MenuItem value="Business">Business</MenuItem></Select></FormControl>
        </Stack>
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Thumbnail</Typography>
          <Box component="label" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const [file] = Array.from(event.dataTransfer.files); if (file) handleThumbnailFile(file) }} sx={{ minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, p: 2, border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' } }}>
            {course.cover && <Box component="img" src={course.cover} alt={`${course.title || 'Course'} thumbnail`} sx={{ width: 180, height: 100, objectFit: 'cover', borderRadius: 1 }} />}
            <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{course.cover ? 'Replace thumbnail' : 'Drop a thumbnail here or browse'}</Typography><Typography color="text.secondary" variant="caption">JPG, PNG, GIF, WebP, or AVIF · 6 MB maximum</Typography></Box>
            <input hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); if (file) handleThumbnailFile(file); event.target.value = '' }} aria-label="Browse for course thumbnail" />
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth><InputLabel>Level</InputLabel><Select label="Level" value={course.level} onChange={(event) => onChange({ ...course, level: event.target.value })}><MenuItem value="Beginner">Beginner</MenuItem><MenuItem value="Intermediate">Intermediate</MenuItem><MenuItem value="Advanced">Advanced</MenuItem></Select></FormControl>
          <FormControl fullWidth><InputLabel>Tutor</InputLabel><Select label="Tutor" value={course.tutor} onChange={(event) => onChange({ ...course, tutor: event.target.value })}>{['Maya Chen', 'Leon Kennedy', 'Jhon Dwirian', 'Rizki Known'].map((tutor) => <MenuItem key={tutor} value={tutor}>{tutor}</MenuItem>)}</Select></FormControl>
          <TextField fullWidth label="Price" type="number" inputProps={{ min: 0, step: 1 }} value={course.price} onChange={(event) => onChange({ ...course, price: Number(event.target.value) })} />
        </Stack>
        <TextField fullWidth multiline minRows={2} label="Description" value={course.description} onChange={(event) => onChange({ ...course, description: event.target.value })} />
        <TextField fullWidth multiline minRows={4} label="Long description" value={course.longDescription} onChange={(event) => onChange({ ...course, longDescription: event.target.value })} />
      </Stack>
          <RepeatableBulletList title="What you'll learn" values={course.learningOutcomes} onChange={(learningOutcomes) => onChange({ ...course, learningOutcomes })} />
      </CourseEditorSection>
      <CourseEditorSection expanded={expandedSections.includes('status')} onToggle={() => toggleSection('status')} title="Course status" description="Control whether learners can see this course." withTopMargin>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{course.status === 'Published' ? 'Published' : 'Draft course'}</Typography><Typography variant="caption" color="text.secondary">Draft courses remain editable and hidden from learners.</Typography></Box><Stack direction="row" alignItems="center" spacing={1}><StatusChip status={course.status} /><Switch checked={course.status === 'Published'} onChange={() => onChange({ ...course, status: course.status === 'Published' ? 'Draft' : 'Published' })} inputProps={{ 'aria-label': `Publish ${course.title || 'course'}` }} /></Stack></Box>
      </CourseEditorSection>
      <CourseEditorSection expanded={expandedSections.includes('requirements')} onToggle={() => toggleSection('requirements')} title="Requirements" withTopMargin>
        <RepeatableBulletList title="Requirements" values={course.requirements} onChange={(requirements) => onChange({ ...course, requirements })} />
      </CourseEditorSection>
      <Divider sx={{ my: 3 }} />
      <CourseEditorSection expanded={expandedSections.includes('curriculum')} onToggle={() => toggleSection('curriculum')} title="Course curriculum" description={`${course.modules.length} ${course.modules.length === 1 ? 'section' : 'sections'} · ${course.title || 'Untitled course'}`}>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Drag modules to reorder. Lessons can be reordered within their module.</Typography>
          <Stack spacing={1.5}>
        {course.modules.length === 0 && !isAddingModule && <Box sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1 }}><Typography color="text.secondary" sx={{ mb: 1 }}>This course has no modules yet.</Typography><Button label="Add your first module" size="small" onClick={() => setIsAddingModule(true)} /></Box>}
        {course.modules.map((module) => {
          const isExpanded = expandedModuleIds.includes(module.id)
          return <Paper key={module.id} elevation={0} draggable onDragStart={() => setDraggedModule(module.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveModule(module.id)} sx={{ p: 1.5, backgroundColor: 'background.default', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={() => setExpandedModuleIds((ids) => isExpanded ? ids.filter((id) => id !== module.id) : [...ids, module.id])} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${module.title}`} aria-expanded={isExpanded}><ChevronRightIcon sx={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 160ms ease' }} fontSize="small" /></IconButton>
              <DragIndicatorIcon color="disabled" fontSize="small" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {editingModuleId === module.id ? <TextField autoFocus fullWidth size="small" value={editingModuleTitle} onChange={(event) => setEditingModuleTitle(event.target.value)} onBlur={() => saveModuleTitle(module.id)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} inputProps={{ 'aria-label': 'Module title' }} /> : <Box component="button" type="button" onClick={() => { setEditingModuleId(module.id); setEditingModuleTitle(module.title) }} sx={{ display: 'block', width: '100%', p: 0, border: 0, background: 'none', color: 'text.primary', cursor: 'text', font: 'inherit', textAlign: 'left' }}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{module.title}</Typography></Box>}
                <Typography color="text.secondary" variant="caption">{module.lessons.length} {module.lessons.length === 1 ? 'lecture' : 'lectures'} · {formatDuration(getModuleDuration(module))}</Typography>
              </Box>
              <Tooltip title={`Delete ${module.title}`}><IconButton size="small" color="error" onClick={() => deleteModule(module)} aria-label={`Delete ${module.title}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
            {isExpanded && <Stack spacing={0.5} sx={{ mt: 1, ml: { xs: 0, sm: 5 } }}>
              {module.lessons.map((lesson, index) => <Box key={lesson.id} draggable onDragStart={(event) => { event.stopPropagation(); setDraggedLesson({ moduleId: module.id, index }) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); moveLesson(module.id, index) }} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, backgroundColor: 'background.paper', borderRadius: 1, flexWrap: 'wrap' }}>
                <DragIndicatorIcon color="disabled" fontSize="small" /><Box sx={{ color: 'text.secondary', display: 'flex' }}><LessonTypeIcon type={lesson.type} /></Box>
                <Box component="button" type="button" onClick={() => openLessonPanel(module.id, lesson, false)} sx={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 1, p: 0, border: 0, background: 'none', color: 'text.primary', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}><Typography variant="body2">{lesson.title}</Typography><Chip label={getLessonLabel(lesson)} size="small" variant="outlined" /></Box>
                {course.modules.length > 1 && <Select value="" displayEmpty size="small" onChange={(event) => moveLessonToModule(module.id, index, Number(event.target.value))} renderValue={() => 'Move to module'} inputProps={{ 'aria-label': `Move ${lesson.title} to module` }} sx={{ minWidth: 145 }}><MenuItem disabled value="">Move to module</MenuItem>{course.modules.filter((targetModule) => targetModule.id !== module.id).map((targetModule) => <MenuItem key={targetModule.id} value={targetModule.id}>{targetModule.title}</MenuItem>)}</Select>}
                <Tooltip title={`Edit ${lesson.title}`}><IconButton size="small" onClick={() => openLessonPanel(module.id, lesson, false)} aria-label={`Edit ${lesson.title}`}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title={`Delete ${lesson.title}`}><IconButton size="small" color="error" onClick={() => deleteLesson(module.id, lesson.id)} aria-label={`Delete ${lesson.title}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
              </Box>)}
              {module.lessons.length === 0 && <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>No lessons yet</Typography>}
              {addingLessonModuleId === module.id ? <Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>Choose a lesson type</Typography><IconButton size="small" onClick={() => setAddingLessonModuleId(null)} aria-label="Cancel adding lesson"><CloseIcon fontSize="small" /></IconButton></Box><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>{lessonTypeOptions.map((option) => <Box key={option.type} component="button" type="button" onClick={() => openLessonPanel(module.id, createLesson(Math.max(0, ...course.modules.flatMap((currentModule) => currentModule.lessons.map((currentLesson) => currentLesson.id))) + 1, option.type), true)} sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.default', color: 'text.primary', cursor: 'pointer', textAlign: 'left', font: 'inherit', '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' } }}><Box sx={{ color: 'primary.main', display: 'flex' }}><LessonTypeIcon type={option.type} /></Box><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{option.label}</Typography><Typography variant="caption" color="text.secondary">{option.detail}</Typography></Box></Box>)}</Stack></Paper> : <Box component="button" type="button" onClick={() => setAddingLessonModuleId(module.id)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', p: 0.5, color: 'primary.main', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}><AddIcon fontSize="small" /> Add lesson</Box>}
            </Stack>}
          </Paper>
        })}
        {isAddingModule ? <Box component="form" onSubmit={addModule} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TextField autoFocus required size="small" fullWidth label="Module title" value={newModuleTitle} onChange={(event) => setNewModuleTitle(event.target.value)} /><IconButton type="submit" color="primary" aria-label="Save module"><CheckIcon /></IconButton><IconButton type="button" onClick={() => setIsAddingModule(false)} aria-label="Cancel adding module"><CloseIcon /></IconButton></Box> : course.modules.length > 0 && <Box component="button" type="button" onClick={() => setIsAddingModule(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', p: 0, color: 'primary.main', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}><AddIcon fontSize="small" /> Add module</Box>}
          </Stack>
      </CourseEditorSection>
      {lessonPanel && <LessonDetailsPanel lessonPanel={lessonPanel} updateLessonDraft={updateLessonDraft} onClose={() => setLessonPanel(null)} onSave={saveLesson} onVideoFile={handleVideoFile} onAddResources={addResources} videoUploadProgress={videoUploadProgress} disabled={cannotSaveLesson} />}
    </Paper>
  )
}

const LessonDetailsPanel: FC<{ lessonPanel: LessonPanelState; updateLessonDraft: (lesson: AdminLesson) => void; onClose: () => void; onSave: () => void; onVideoFile: (file: File) => void; onAddResources: (files: FileList | null) => void; videoUploadProgress: number; disabled: boolean }> = ({ lessonPanel, updateLessonDraft, onClose, onSave, onVideoFile, onAddResources, videoUploadProgress, disabled }) => {
  const { lesson } = lessonPanel
  const articleBodyRef = useRef<HTMLDivElement>(null)
  const questionId = Math.max(0, ...(lesson.quizQuestions ?? []).map((question) => question.id)) + 1
  const removeResource = (resourceId: number) => updateLessonDraft({ ...lesson, resources: lesson.resources.filter((resource) => resource.id !== resourceId) })

  useEffect(() => {
    if (lesson.type === 'article' && articleBodyRef.current) articleBodyRef.current.innerText = lesson.articleBody ?? ''
  }, [lesson.id, lesson.type])
  const isVideoProcessing = lesson.type === 'video' && videoUploadProgress > 0 && videoUploadProgress < 100
  return <Paper elevation={0} sx={{ mt: 2, p: 2.5, border: 1, borderColor: 'primary.main', backgroundColor: 'background.paper' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}><Box><Typography variant="h6">{lessonPanel.isNew ? 'Add lesson' : 'Lesson details'}</Typography><Typography color="text.secondary" variant="body2">{lessonTypeOptions.find((option) => option.type === lesson.type)?.label} lesson</Typography></Box><IconButton onClick={onClose} aria-label="Close lesson details"><CloseIcon /></IconButton></Box>
    <Stack spacing={2}><TextField label="Title" fullWidth required value={lesson.title} onChange={(event) => updateLessonDraft({ ...lesson, title: event.target.value })} />
      {lesson.type === 'video' && <Stack spacing={1.5}><Box component="label" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const [file] = Array.from(event.dataTransfer.files); if (file) onVideoFile(file) }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, p: 3, border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, color: 'text.secondary', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}><UploadFileOutlinedIcon color="primary" /><Typography variant="body2" sx={{ fontWeight: 600 }}>{lesson.videoUrl ? 'Replace video' : 'Drop a video here or choose a file'}</Typography><Typography variant="caption">Duration is extracted automatically after processing.</Typography><input hidden type="file" accept="video/*" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); if (file) onVideoFile(file); event.target.value = '' }} /></Box>{videoUploadProgress > 0 && <Box><LinearProgress variant="determinate" value={videoUploadProgress} sx={{ mb: 0.5 }} /><Typography color="text.secondary" variant="caption">{isVideoProcessing ? `Processing video · ${videoUploadProgress}%` : lesson.duration ? `Video duration: ${formatDuration(lesson.duration)}` : 'Video uploaded. Duration will appear when metadata is available.'}</Typography></Box>}<Box><Typography variant="body2" sx={{ mb: 0.75 }}>Downloadable resources <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></Typography><Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', cursor: 'pointer', fontSize: 14 }}><UploadFileOutlinedIcon fontSize="small" /> Add files<input hidden type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={(event) => { onAddResources(event.target.files); event.target.value = '' }} /></Box>{lesson.resources.length > 0 && <Stack spacing={0.5} sx={{ mt: 1 }}>{lesson.resources.map((resource) => <Box key={resource.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="caption" sx={{ flex: 1 }}>Downloadable resource</Typography><IconButton size="small" onClick={() => updateLessonDraft({ ...lesson, resources: lesson.resources.filter((currentResource) => currentResource.id !== resource.id) })} aria-label="Remove downloadable resource"><CloseIcon fontSize="small" /></IconButton></Box>)}</Stack>}</Box></Stack>}
      {lesson.type === 'article' && <Box><Typography variant="body2" sx={{ mb: 0.75 }}>Downloadable resources <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></Typography><Box component="label" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, minHeight: 72, p: 1.5, border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, color: 'text.secondary', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}><UploadFileOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">Add files</Typography><input hidden type="file" multiple onChange={(event) => { onAddResources(event.target.files); event.target.value = '' }} aria-label="Add downloadable resources" /></Box>{lesson.resources.length > 0 && <Stack spacing={0.5} sx={{ mt: 1 }}>{lesson.resources.map((resource) => <Box key={resource.id} sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.default' }}><InsertDriveFileOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2" color="text.secondary">Downloadable resource</Typography><IconButton size="small" color="error" onClick={() => removeResource(resource.id)} aria-label="Remove downloadable resource"><DeleteOutlineIcon fontSize="small" /></IconButton></Box>)}</Stack>}</Box>}
      {lesson.type === 'article' && <Stack spacing={1}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Tooltip title="Bold"><IconButton size="small" onClick={() => document.execCommand('bold')} aria-label="Bold text"><FormatBoldIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Italic"><IconButton size="small" onClick={() => document.execCommand('italic')} aria-label="Italic text"><FormatItalicIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Bulleted list"><IconButton size="small" onClick={() => document.execCommand('insertUnorderedList')} aria-label="Bulleted list"><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Heading"><IconButton size="small" onClick={() => document.execCommand('formatBlock', false, 'h3')} aria-label="Heading"><TitleIcon fontSize="small" /></IconButton></Tooltip></Box><Box ref={articleBodyRef} contentEditable suppressContentEditableWarning onInput={(event) => updateLessonDraft({ ...lesson, articleBody: event.currentTarget.innerText })} sx={{ minHeight: 180, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, outline: 'none', '&:focus': { borderColor: 'primary.main' } }} /><Typography color="text.secondary" variant="caption">Estimated read time: {Math.max(1, Math.ceil((lesson.articleBody?.trim().split(/\s+/).filter(Boolean).length ?? 0) / 200))} min</Typography></Stack>}
      {lesson.type === 'quiz' && <Stack spacing={1.5}>{(lesson.quizQuestions ?? []).map((question, questionIndex) => <Paper key={question.id} elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>Question {questionIndex + 1}</Typography><IconButton size="small" color="error" onClick={() => updateLessonDraft({ ...lesson, quizQuestions: lesson.quizQuestions?.filter((currentQuestion) => currentQuestion.id !== question.id) })} aria-label={`Delete question ${questionIndex + 1}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Box><TextField fullWidth size="small" label="Question" value={question.question} onChange={(event) => updateLessonDraft({ ...lesson, quizQuestions: lesson.quizQuestions?.map((currentQuestion) => currentQuestion.id === question.id ? { ...currentQuestion, question: event.target.value } : currentQuestion) })} sx={{ mb: 1 }} /><Stack spacing={0.75}>{question.options.map((option, optionIndex) => <Box key={`${question.id}-${optionIndex}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box component="input" type="radio" name={`correct-option-${question.id}`} checked={question.correctOption === optionIndex} onChange={() => updateLessonDraft({ ...lesson, quizQuestions: lesson.quizQuestions?.map((currentQuestion) => currentQuestion.id === question.id ? { ...currentQuestion, correctOption: optionIndex } : currentQuestion) })} aria-label={`Mark option ${optionIndex + 1} correct`} /><TextField fullWidth size="small" placeholder={`Option ${optionIndex + 1}`} value={option} onChange={(event) => updateLessonDraft({ ...lesson, quizQuestions: lesson.quizQuestions?.map((currentQuestion) => currentQuestion.id === question.id ? { ...currentQuestion, options: currentQuestion.options.map((currentOption, currentOptionIndex) => currentOptionIndex === optionIndex ? event.target.value : currentOption) } : currentQuestion) })} /></Box>)}</Stack></Paper>)}<Button label="Add question" size="small" variant="outlined" onClick={() => updateLessonDraft({ ...lesson, quizQuestions: [...(lesson.quizQuestions ?? []), { id: questionId, question: '', options: ['', '', ''], correctOption: 0 }] })} /><TextField label="Pass threshold" type="number" size="small" inputProps={{ min: 0, max: 100 }} value={lesson.passThreshold ?? 70} onChange={(event) => updateLessonDraft({ ...lesson, passThreshold: Number(event.target.value) })} sx={{ maxWidth: 220 }} /></Stack>}
      {lesson.type === 'live' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth label="Meeting link" type="url" placeholder="https://" value={lesson.meetingUrl ?? ''} onChange={(event) => updateLessonDraft({ ...lesson, meetingUrl: event.target.value })} /><TextField fullWidth label="Scheduled date and time" type="datetime-local" InputLabelProps={{ shrink: true }} value={lesson.scheduledAt ?? ''} onChange={(event) => updateLessonDraft({ ...lesson, scheduledAt: event.target.value })} /><TextField label="Duration (minutes)" type="number" inputProps={{ min: 1 }} value={Math.round((lesson.estimatedDuration ?? 3600) / 60)} onChange={(event) => updateLessonDraft({ ...lesson, estimatedDuration: Number(event.target.value) * 60 })} /></Stack>}
      <Stack direction="row" justifyContent="flex-end" spacing={1}><Button label="Cancel" variant="text" onClick={onClose} /><Button label={isVideoProcessing ? 'Processing video' : 'Save lesson'} onClick={onSave} disabled={disabled} /></Stack>
    </Stack>
  </Paper>
}

const DashboardCharts: FC<Pick<AdminDashboardOverview, 'revenueByMonth' | 'enrollmentsByCategory'>> = ({ revenueByMonth, enrollmentsByCategory }) => {
  const theme = useTheme()
  const maxRevenue = Math.max(0, ...revenueByMonth.map(({ value }) => value))
  const maxEnrollments = Math.max(0, ...enrollmentsByCategory.map(({ value }) => value))
  const revenuePoints = revenueByMonth.map(({ value }, index) => `${20 + (540 * index) / Math.max(revenueByMonth.length - 1, 1)},${160 - (maxRevenue ? (value / maxRevenue) * 125 : 0)}`).join(' ')

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Revenue overview</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Monthly revenue performance</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Revenue trend chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          {maxRevenue > 0 ? <><polyline points={revenuePoints} fill="none" stroke={theme.palette.primary.main} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{revenueByMonth.map(({ label, value }, index) => { const cx = 20 + (540 * index) / Math.max(revenueByMonth.length - 1, 1); const cy = 160 - (value / maxRevenue) * 125; return <circle key={label} cx={cx} cy={cy} r="5" fill={theme.palette.background.paper} stroke={theme.palette.primary.main} strokeWidth="3" /> })}</> : <text x="290" y="100" fill={theme.palette.text.secondary} fontSize="14" textAnchor="middle">No revenue data available yet</text>}
          {revenueByMonth.map(({ label }, index) => <text key={label} x={20 + (540 * index) / Math.max(revenueByMonth.length - 1, 1)} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{label}</text>)}
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}>
        <Typography variant="h6">Course enrollments</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Students enrolled by category</Typography>
        <Box component="svg" viewBox="0 0 580 190" sx={{ width: '100%', height: 220 }} role="img" aria-label="Course enrollment chart">
          {[35, 75, 115, 155].map((y) => <line key={y} x1="20" x2="560" y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />)}
          {maxEnrollments > 0 ? enrollmentsByCategory.map(({ label, value }, index) => { const height = (value / maxEnrollments) * 125; const x = 45 + (490 * index) / Math.max(enrollmentsByCategory.length - 1, 1); return <g key={label}><rect x={x} y={160 - height} width="48" height={height} rx="5" fill={index % 2 ? theme.palette.secondary.main : theme.palette.primary.main} /><text x={x + 24} y="180" fill={theme.palette.text.secondary} fontSize="12" textAnchor="middle">{label}</text></g> }) : <text x="290" y="100" fill={theme.palette.text.secondary} fontSize="14" textAnchor="middle">No enrollments available yet</text>}
        </Box>
      </Paper>
    </Stack>
  )
}

const OverviewPage: FC = () => {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reloadOverview = async () => {
    try {
      setOverview(await getAdminDashboardOverview())
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void reloadOverview() }, [])

  return <>
    <PageHeading title="Dashboard overview" description="A snapshot of your learning platform." />
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading dashboard data" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError}</Typography><Button label="Retry" onClick={() => { setIsLoading(true); void reloadOverview() }} /></Paper> : overview && <><Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <StatCard label="Total revenue" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(overview.totalRevenue)} detail="Published course enrollments" icon={<PaymentsOutlinedIcon />} />
      <StatCard label="Active students" value={new Intl.NumberFormat('en-US').format(overview.activeStudents)} detail="Across published courses" icon={<GroupOutlinedIcon />} />
      <StatCard label="Published courses" value={new Intl.NumberFormat('en-US').format(overview.publishedCourses)} detail={`${overview.draftCourses} course${overview.draftCourses === 1 ? '' : 's'} in draft`} icon={<SchoolOutlinedIcon />} />
      <StatCard label="Active tutors" value={new Intl.NumberFormat('en-US').format(overview.activeTutors)} detail={`${overview.inactiveTutors} inactive tutor${overview.inactiveTutors === 1 ? '' : 's'}`} icon={<PersonOutlineIcon />} />
    </Stack>
    <DashboardCharts revenueByMonth={overview.revenueByMonth} enrollmentsByCategory={overview.enrollmentsByCategory} /></>}
  </>
}

const createEmptyCourse = (): AdminCourse => ({
  id: 0,
  title: 'Untitled course',
  category: 'Development',
  level: 'Beginner',
  tutor: 'Maya Chen',
  status: 'Draft',
  students: 0,
  price: 0,
  cover: '/images/courses/christopher-gower-m_HRfLhgABo-unsplash.jpg',
  description: '',
  longDescription: '',
  learningOutcomes: [''],
  requirements: [''],
  certificate: false,
  updatedAt: 'Not published',
  modules: [],
})

const CoursesPage: FC = () => {
  const [courseRows, setCourseRows] = useState<AdminCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'All' | AdminCourse['status']>('All')
  const [programFilter, setProgramFilter] = useState('All')

  const reloadCourses = async () => {
    try {
      const courses = await getAdminCourses()
      setCourseRows(courses)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load courses.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reloadCourses()
  }, [])

  const updateCourse = async (course: AdminCourse) => {
    setCourseRows((rows) => rows.map((row) => row.id === course.id ? course : row))
    try {
      const savedCourse = await updateAdminCourse(course)
      setCourseRows((rows) => rows.map((row) => row.id === savedCourse.id ? savedCourse : row))
    } catch (error) {
      toast.add({ title: 'Unable to save course', description: error instanceof Error ? error.message : 'Please try again.', type: 'error', priority: 'high' })
      void reloadCourses()
    }
  }

  const openNewCoursePage = () => navigateTo('/admin/courses/new')
  const openEditCoursePage = (course: AdminCourse) => navigateTo(`/admin/courses/${course.id}/edit`)

  const deleteCourse = async (course: AdminCourse) => {
    if (!window.confirm(`Delete ${course.title}? This cannot be undone.`)) return

    try {
      await deleteAdminCourse(course.id)
      setCourseRows((rows) => rows.filter((row) => row.id !== course.id))
    } catch (error) {
      toast.add({ title: 'Unable to delete course', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const programs = useMemo(() => [...new Set(courseRows.map((course) => course.category))].sort(), [courseRows])
  const filteredCourses = useMemo(() => courseRows.filter((course) => (statusFilter === 'All' || course.status === statusFilter) && (programFilter === 'All' || course.category === programFilter)), [courseRows, programFilter, statusFilter])
  const columns: DataColumn<AdminCourse>[] = [
    { key: 'title', label: 'Course' },
    { key: 'category', label: 'Program' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'status', label: 'Status', render: (value, course) => <Stack direction="row" alignItems="center" spacing={1}><StatusChip status={String(value)} /><Switch size="small" checked={course.status === 'Published'} onChange={() => void updateCourse({ ...course, status: course.status === 'Published' ? 'Draft' : 'Published' })} inputProps={{ 'aria-label': `${course.status === 'Published' ? 'Unpublish' : 'Publish'} ${course.title}` }} /></Stack> },
    { key: 'students', label: 'Students' },
  ]

  return (
    <>
      <PageHeading title="Programs & Courses" description="Manage your catalog, tutors, and learning content." action={<Button label="New course" onClick={openNewCoursePage} disabled={isLoading} />} />
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading courses" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError}</Typography><Button label="Retry" onClick={() => { setIsLoading(true); void reloadCourses() }} /></Paper> : <>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | AdminCourse['status'])}><MenuItem value="All">All statuses</MenuItem><MenuItem value="Published">Published</MenuItem><MenuItem value="Draft">Draft</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Program</InputLabel><Select label="Program" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><MenuItem value="All">All programs</MenuItem>{programs.map((program) => <MenuItem key={program} value={program}>{program}</MenuItem>)}</Select></FormControl>
        </Stack>
        <AdminDataTable rows={filteredCourses} columns={columns} searchPlaceholder="Search courses" searchKeys={['title', 'category', 'tutor']} actions={(course) => <Stack direction="row" justifyContent="flex-end" spacing={0.5}><Button label="View" size="small" variant="text" onClick={() => navigateTo(`/courses/${course.id}`)} /><Button label="Edit" size="small" variant="text" onClick={() => openEditCoursePage(course)} /><Tooltip title={`Delete ${course.title}`}><IconButton size="small" color="error" onClick={() => void deleteCourse(course)} aria-label={`Delete ${course.title}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></Stack>} />
      </>}
    </>
  )
}

type CourseEditorPageProps =
  | { mode: 'new'; courseId?: never }
  | { mode: 'edit'; courseId: number }

const CourseEditorPage: FC<CourseEditorPageProps> = ({ mode, courseId }) => {
  const [course, setCourse] = useState<AdminCourse | null>(() => mode === 'new' ? createEmptyCourse() : null)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    setCourse(mode === 'new' ? createEmptyCourse() : null)
    setIsLoading(mode === 'edit')
    setLoadError(null)

    if (mode === 'new') return () => { isCurrent = false }

    getAdminCourse(courseId)
      .then((loadedCourse) => {
        if (isCurrent) setCourse(loadedCourse)
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Unable to load course.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [mode, courseId])

  const saveCourse = async () => {
    if (!course) return
    const title = course.title.trim()
    if (!title) {
      toast.add({ title: 'Course title is required', description: 'Add a title before saving the course.', type: 'error', priority: 'high' })
      return
    }
    if (!course.cover.trim()) {
      toast.add({ title: 'Course thumbnail is required', description: 'Add a thumbnail URL before saving the course.', type: 'error', priority: 'high' })
      return
    }

    setIsSaving(true)
    try {
      const savedCourse = mode === 'new' ? await createAdminCourse({ ...course, title }) : await updateAdminCourse({ ...course, title })
      setCourse(savedCourse)
      toast.add({ title: mode === 'new' ? 'Course created' : 'Course saved', description: `${savedCourse.title} is now stored in the database.`, type: 'success' })
      if (mode === 'new') navigateTo(`/admin/courses/${savedCourse.id}/edit`, true)
      else navigateTo('/admin/courses', true)
    } catch (error) {
      toast.add({ title: 'Unable to save course', description: error instanceof Error ? error.message : 'Please try again.', type: 'error', priority: 'high' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <AdminLoadingState label="Loading course" />
  if (loadError || !course) return <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError ?? 'Course not found.'}</Typography><Stack direction="row" spacing={1}><Button label="Back to courses" variant="text" onClick={() => navigateTo('/admin/courses')} /><Button label="Retry" onClick={() => window.location.reload()} /></Stack></Paper>

  return (
    <>
      <PageHeading
        title={mode === 'new' ? 'New course' : 'Edit course'}
        description={mode === 'new' ? 'Create a course and build its learning path.' : `Update ${course.title} and its learning path.`}
        action={<Stack direction="row" spacing={1}><Button label="Back to courses" variant="text" onClick={() => navigateTo('/admin/courses')} /><Button label={mode === 'new' ? 'Create course' : 'Save changes'} onClick={() => void saveCourse()} disabled={isSaving} /></Stack>}
      />
      <CourseEditor course={course} onChange={setCourse} />
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
  const [tutorRows, setTutorRows] = useState<AdminTutor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'All' | AdminTutor['status']>('All')
  const [programFilter, setProgramFilter] = useState('All')

  const reloadTutors = async () => {
    try {
      const tutors = await getAdminTutors()
      setTutorRows(tutors)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load tutors.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reloadTutors()
  }, [])

  const openNewTutorPage = () => navigateTo('/admin/tutors/new')
  const openTutorDetails = (tutor: AdminTutor) => navigateTo(`/admin/tutors/${tutor.id}`)

  const toggleTutorStatus = async (tutor: AdminTutor) => {
    const status = tutor.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const updatedTutor = await updateAdminTutorStatus(tutor.id, status)
      setTutorRows((rows) => rows.map((row) => row.id === updatedTutor.id ? updatedTutor : row))
    } catch (error) {
      toast.add({ title: 'Unable to update tutor status', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const deleteTutor = async (tutor: AdminTutor) => {
    if (!window.confirm(`Delete ${tutor.name}? This cannot be undone.`)) return

    try {
      await deleteAdminTutor(tutor.id)
      setTutorRows((rows) => rows.filter((row) => row.id !== tutor.id))
    } catch (error) {
      toast.add({ title: 'Unable to delete tutor', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const programs = useMemo(() => [...new Set(tutorRows.flatMap((tutor) => tutor.assignedCourses.map((course) => course.category)))].sort(), [tutorRows])
  const filteredTutors = useMemo(() => tutorRows.filter((tutor) => (statusFilter === 'All' || tutor.status === statusFilter) && (programFilter === 'All' || tutor.assignedCourses.some((course) => course.category === programFilter))), [programFilter, statusFilter, tutorRows])
  const columns: DataColumn<AdminTutor>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'assignedCourses', label: 'Assigned Courses', render: (value) => <Stack direction="row" flexWrap="wrap" gap={0.5}>{(value as AdminTutor['assignedCourses']).length ? (value as AdminTutor['assignedCourses']).map((course) => <Chip key={course.id} label={course.title} size="small" variant="outlined" />) : <Typography color="text.secondary" variant="body2">None</Typography>}</Stack> },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
    { key: 'createdAt', label: 'Date Joined' },
  ]

  return (
    <>
      <PageHeading title="Tutors" description="Manage tutor profiles and review their assigned courses." action={<Button label="New Tutor" onClick={openNewTutorPage} disabled={isLoading} />} />
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading tutors" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError}</Typography><Button label="Retry" onClick={() => { setIsLoading(true); void reloadTutors() }} /></Paper> : <>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | AdminTutor['status'])}><MenuItem value="All">All statuses</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Program</InputLabel><Select label="Program" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><MenuItem value="All">All programs</MenuItem>{programs.map((program) => <MenuItem key={program} value={program}>{program}</MenuItem>)}</Select></FormControl>
        </Stack>
        <AdminDataTable rows={filteredTutors} columns={columns} searchPlaceholder="Search tutors" searchKeys={['name', 'email']} rowClick={openTutorDetails} actions={(tutor) => <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5}><Button label="Edit" size="small" variant="text" onClick={() => openTutorDetails(tutor)} /><Switch size="small" checked={tutor.status === 'Active'} onChange={() => void toggleTutorStatus(tutor)} inputProps={{ 'aria-label': `${tutor.status === 'Active' ? 'Deactivate' : 'Activate'} ${tutor.name}` }} /><Tooltip title={`Delete ${tutor.name}`}><IconButton size="small" color="error" onClick={() => void deleteTutor(tutor)} aria-label={`Delete ${tutor.name}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></Stack>} />
      </>}
    </>
  )
}

type TutorEditorPageProps =
  | { mode: 'new'; tutorId?: never }
  | { mode: 'edit'; tutorId: number }

const createEmptyTutor = (): AdminTutor => ({ id: 0, name: '', email: '', phone: '', bio: '', status: 'Active', createdAt: '', assignedCourses: [] })

const TutorEditorPage: FC<TutorEditorPageProps> = ({ mode, tutorId }) => {
  const [tutor, setTutor] = useState<AdminTutor | null>(() => mode === 'new' ? createEmptyTutor() : null)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [courses, setCourses] = useState<AdminCourse[]>([])

  useEffect(() => {
    getAdminCourses().then(setCourses).catch(() => setLoadError('Unable to load courses.'))
  }, [])

  useEffect(() => {
    let isCurrent = true
    setTutor(mode === 'new' ? createEmptyTutor() : null)
    setIsLoading(mode === 'edit')
    setLoadError(null)
    if (mode === 'new') return () => { isCurrent = false }

    getAdminTutor(tutorId)
      .then((loadedTutor) => { if (isCurrent) setTutor(loadedTutor) })
      .catch((error) => { if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Unable to load tutor.') })
      .finally(() => { if (isCurrent) setIsLoading(false) })

    return () => { isCurrent = false }
  }, [mode, tutorId])

  const saveTutor = async () => {
    if (!tutor) return
    const name = tutor.name.trim()
    const email = tutor.email.trim()
    if (!name || !email) {
      toast.add({ title: 'Name and email are required', description: 'Add the tutor name and email before saving.', type: 'error', priority: 'high' })
      return
    }

    setIsSaving(true)
    try {
      const assignedCourseIds = tutor.assignedCourseIds ?? tutor.assignedCourses.map((course) => course.id)
      const savedTutor = mode === 'new' ? await createAdminTutor({ name, email, phone: tutor.phone.trim(), bio: tutor.bio.trim(), status: tutor.status, assignedCourseIds }) : await updateAdminTutor({ ...tutor, name, email, phone: tutor.phone.trim(), bio: tutor.bio.trim(), assignedCourseIds })
      setTutor(savedTutor)
      toast.add({ title: mode === 'new' ? 'Tutor created' : 'Tutor saved', description: mode === 'new' ? 'An invite link is ready for this tutor.' : `${savedTutor.name} is now updated.`, type: 'success' })
      if (mode === 'new') navigateTo(`/admin/tutors/${savedTutor.id}`, true)
      else navigateTo('/admin/tutors', true)
    } catch (error) {
      toast.add({ title: 'Unable to save tutor', description: error instanceof Error ? error.message : 'Please try again.', type: 'error', priority: 'high' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <AdminLoadingState label="Loading tutor" />
  if (loadError || !tutor) return <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError ?? 'Tutor not found.'}</Typography><Button label="Back to tutors" variant="text" onClick={() => navigateTo('/admin/tutors')} /></Paper>

  const selectedCourseIds = tutor.assignedCourseIds ?? tutor.assignedCourses.map((course) => course.id)
  return (
    <>
      <PageHeading title={mode === 'new' ? 'New Tutor' : tutor.name} description={mode === 'new' ? 'Create a tutor profile, assign courses, and generate an invite link.' : 'Edit profile information and assigned courses.'} action={<Stack direction="row" spacing={1}><Button label="Back to tutors" variant="text" onClick={() => navigateTo('/admin/tutors')} /><Button label={mode === 'new' ? 'Create Tutor' : 'Save changes'} onClick={() => void saveTutor()} disabled={isSaving} /></Stack>} />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Profile information</Typography>
          <Stack spacing={2}><TextField required fullWidth label="Name" value={tutor.name} onChange={(event) => setTutor({ ...tutor, name: event.target.value })} /><TextField required fullWidth type="email" label="Email" value={tutor.email} onChange={(event) => setTutor({ ...tutor, email: event.target.value })} /><TextField fullWidth label="Phone" value={tutor.phone} onChange={(event) => setTutor({ ...tutor, phone: event.target.value })} /><TextField fullWidth multiline minRows={5} label="Bio" value={tutor.bio} onChange={(event) => setTutor({ ...tutor, bio: event.target.value })} /><FormControl fullWidth><InputLabel id="tutor-course-assignment-label">Assigned courses</InputLabel><Select labelId="tutor-course-assignment-label" multiple label="Assigned courses" value={selectedCourseIds} onChange={(event) => setTutor({ ...tutor, assignedCourseIds: (typeof event.target.value === 'string' ? event.target.value.split(',').map(Number) : event.target.value) as number[] })} renderValue={(selected) => (selected as number[]).map((id) => courses.find((course) => course.id === id)?.title ?? '').join(', ')}>{courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}</Select><Typography color="text.secondary" variant="caption">Select every course this tutor teaches.</Typography></FormControl><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>Status</Typography><Typography variant="caption" color="text.secondary">Inactive tutors remain available in existing course history.</Typography></Box><Switch checked={tutor.status === 'Active'} onChange={() => setTutor({ ...tutor, status: tutor.status === 'Active' ? 'Inactive' : 'Active' })} inputProps={{ 'aria-label': 'Tutor status' }} /></Stack></Stack>
        </Paper>
        {mode === 'edit' && <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography variant="h6" sx={{ mb: 0.5 }}>Assigned Courses</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Current assignments. Update them with the multi-select in the profile form.</Typography><Stack spacing={1}>{tutor.assignedCourses.length ? tutor.assignedCourses.map((course) => <Box key={course.id} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}><Typography variant="subtitle2">{course.title}</Typography><Typography color="text.secondary" variant="body2">{course.category} · {course.students} students</Typography></Box>) : <Typography color="text.secondary" variant="body2">No courses assigned.</Typography>}</Stack></Paper>}
      </Stack>
    </>
  )
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
  const [userRows, setUserRows] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reloadUsers = async () => {
    try {
      const accounts = await getAdminUsers()
      setUserRows(accounts)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reloadUsers()
  }, [])

  const toggleAccountStatus = async (account: AdminUser) => {
    if (!account.accountType || account.accountId === undefined) return
    const status = account.status === 'Active' ? 'Suspended' : 'Active'
    try {
      const updatedAccount = await updateAdminUserStatus(account.accountType, account.accountId, status)
      setUserRows((rows) => rows.map((row) => row.id === account.id ? updatedAccount : row))
      toast.add({ title: status === 'Active' ? 'Account activated' : 'Account deactivated', description: `${account.name} is now ${status === 'Active' ? 'active' : 'suspended'}.`, type: 'success' })
    } catch (error) {
      toast.add({ title: 'Unable to update account', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const resetPassword = async (account: AdminUser) => {
    if (!account.accountType || account.accountId === undefined) return
    if (!window.confirm(`Reset the password for ${account.name}?`)) return
    try {
      const result = await resetAdminUserPassword(account.accountType, account.accountId)
      toast.add({ title: 'Password reset', description: `Temporary password: ${result.temporaryPassword}`, type: 'success', priority: 'high' })
    } catch (error) {
      toast.add({ title: 'Unable to reset password', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    }
  }

  const columns: DataColumn<AdminUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'joined', label: 'Joined' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]

  return (
    <>
      <PageHeading title="Users" description="Manage learners, tutors, and administrator accounts." action={<Button label="Add user" disabled={isLoading} />} />
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading users" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error" sx={{ mb: 2 }}>{loadError}</Typography><Button label="Retry" onClick={() => { setIsLoading(true); void reloadUsers() }} /></Paper> : <AdminDataTable rows={userRows} columns={columns} searchPlaceholder="Search users" searchKeys={['name', 'email']} actions={(account) => <Stack direction="row" justifyContent="flex-end" spacing={0.5}><Tooltip title="Reset password"><IconButton size="small" onClick={() => void resetPassword(account)} aria-label={`Reset password for ${account.name}`}><LockResetIcon fontSize="small" /></IconButton></Tooltip><Tooltip title={account.status === 'Active' ? 'Deactivate account' : 'Activate account'}><IconButton size="small" color={account.status === 'Active' ? 'warning' : 'success'} onClick={() => void toggleAccountStatus(account)} aria-label={`${account.status === 'Active' ? 'Deactivate' : 'Activate'} ${account.name}`} disabled={account.role === 'Admin'}>{account.status === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}</IconButton></Tooltip></Stack>} />}
    </>
  )
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

const Button: FC<{ label: string; onClick?: () => void; size?: 'small' | 'medium'; variant?: 'contained' | 'outlined' | 'text'; type?: 'button' | 'submit'; disabled?: boolean }> = ({ label, onClick, size = 'medium', variant = 'contained', type = 'button', disabled = false }) => (
  <Box
    component="button"
    type={type}
    onClick={onClick}
    disabled={disabled}
    sx={{
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main',
      borderRadius: 6,
      px: size === 'small' ? 1.25 : 2,
      py: size === 'small' ? 0.5 : 1,
      backgroundColor: variant === 'contained' ? 'primary.main' : 'transparent',
      color: variant === 'text' ? 'primary.main' : variant === 'contained' ? 'primary.contrastText' : 'primary.main',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      fontFamily: 'inherit',
      fontSize: size === 'small' ? 12 : 14,
      '&:hover': { backgroundColor: disabled ? 'transparent' : variant === 'contained' ? 'primary.dark' : 'action.hover' },
    }}
  >
    {label}
  </Box>
)

const AdminLoadingState: FC<{ label?: string }> = ({ label = 'Loading admin workspace' }) => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 72px)',
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
    <CircularProgress aria-label={label} />
    <Typography color="text.secondary">{label}...</Typography>
  </Box>
)

interface AdminDashboardProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const ProfileDetail: FC<{ icon: ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, flexShrink: 0, borderRadius: 1.5, backgroundColor: 'action.hover', color: 'primary.main' }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>
    </Box>
  </Box>
)

const AdminProfilePage: FC<{ user: AuthUser | null; onSignOut: () => void }> = ({ user, onSignOut }) => {
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const displayName = user?.name || 'Admin User'
  const email = user?.email || 'Administrator account'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not available'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const currentPassword = String(formData.get('currentPassword') ?? '')
    const newPassword = String(formData.get('newPassword') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }

    setPasswordError(null)
    setPasswordSuccess(false)
    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setIsPasswordFormOpen(false)
      setPasswordSuccess(true)
      formElement.reset()
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'We could not update your password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <>
      <PageHeading
        title="Admin profile"
        description="Review your account details and workspace access."
        action={<StyledButton variant="outlined" onClick={() => navigateTo('/admin')}>Back to dashboard</StyledButton>}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, 0.8fr) minmax(0, 1.2fr)' }, gap: 3 }}>
        <Paper elevation={0} sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
            <Avatar sx={{ width: 76, height: 76, mb: 2.5, backgroundColor: 'primary.contrastText', color: 'primary.main', fontSize: 28, fontWeight: 700 }}>{initials || 'AU'}</Avatar>
            <Typography variant="h4" sx={{ mb: 0.5, color: 'inherit' }}>{displayName}</Typography>
            <Typography sx={{ mb: 2, color: 'inherit', opacity: 0.84, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</Typography>
            <Chip label="Administrator" size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', color: 'inherit', fontWeight: 600 }} />
          </Box>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Workspace access</Typography>
            <Typography variant="body2" color="text.secondary">You have full access to Coursespace administration, reporting, and content management.</Typography>
            <Box sx={{ mt: 3, '& button': { width: '100%', justifyContent: 'center' } }}>
              <StyledButton variant="outlined" startIcon={<LogoutIcon />} onClick={onSignOut}>Sign out</StyledButton>
            </Box>
          </Box>
        </Paper>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Account details</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Your administrator account information.</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              <ProfileDetail icon={<AccountCircleOutlinedIcon fontSize="small" />} label="Name" value={displayName} />
              <ProfileDetail icon={<MailOutlineIcon fontSize="small" />} label="Email address" value={email} />
              <ProfileDetail icon={<PersonOutlineIcon fontSize="small" />} label="Role" value="Administrator" />
              <ProfileDetail icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Member since" value={memberSince} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 0.5 }}>Security and access</Typography>
                <Typography color="text.secondary" variant="body2">Your account is protected by authenticated workspace access.</Typography>
              </Box>
              <Chip label="Active" color="success" size="small" />
            </Box>
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <LockResetIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Administrator permissions</Typography>
                <Typography color="text.secondary" variant="body2">Manage courses, tutors, users, registrations, and payment reports from this workspace.</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Password</Typography>
                <Typography color="text.secondary" variant="body2">Update your password regularly to keep your account secure.</Typography>
              </Box>
              <Button label={isPasswordFormOpen ? 'Cancel' : 'Change password'} variant="outlined" size="small" onClick={() => { setIsPasswordFormOpen((current) => !current); setPasswordError(null); setPasswordSuccess(false) }} />
            </Box>
            {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>Your password has been changed successfully.</Alert>}
            {isPasswordFormOpen && <Box component="form" onSubmit={(event) => void handleChangePassword(event)} sx={{ display: 'grid', gap: 2, mt: 2.5 }}>
              <TextField required fullWidth label="Current password" name="currentPassword" type="password" autoComplete="current-password" />
              <TextField required fullWidth label="New password" name="newPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} helperText="Use 8 to 128 characters." />
              <TextField required fullWidth label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
              {passwordError && <Alert severity="error">{passwordError}</Alert>}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button label={isChangingPassword ? 'Changing password...' : 'Save new password'} type="submit" disabled={isChangingPassword} />
              </Box>
            </Box>}
          </Paper>
        </Stack>
      </Box>
    </>
  )
}

const getSectionFromPath = (pathname: string): Section => {
  const pathSection = pathname.split('/')[2]
  return navigation.some(({ key }) => key === pathSection) ? (pathSection as Section) : 'overview'
}

const AdminDashboard: FC<AdminDashboardProps> = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [section, setSection] = useState<Section>(() => getSectionFromPath(window.location.pathname))
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const adminUser = getAuthenticatedUser()

  const selectSection = (next: Section) => {
    navigateTo(next === 'overview' ? '/admin' : `/admin/${next}`)
    setSection(next)
    setMobileOpen(false)
  }

  const handleSignOut = () => {
    void signOut()
    navigateTo('/', true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 400)
    const handlePopState = () => {
      setPathname(window.location.pathname)
      setSection(getSectionFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const currentPage = useMemo(() => {
    if (/^\/admin\/profile\/?$/.test(pathname)) return <AdminProfilePage user={adminUser} onSignOut={handleSignOut} />

    switch (section) {
      case 'courses': {
        if (/^\/admin\/courses\/new\/?$/.test(pathname)) return <CourseEditorPage mode="new" />
        const editMatch = pathname.match(/^\/admin\/courses\/(\d+)\/edit\/?$/)
        if (editMatch) return <CourseEditorPage mode="edit" courseId={Number(editMatch[1])} />
        return <CoursesPage />
      }
      case 'registrations': return <RegistrationsPage />
      case 'tutors': {
        if (/^\/admin\/tutors\/new\/?$/.test(pathname)) return <TutorEditorPage mode="new" />
        const tutorMatch = pathname.match(/^\/admin\/tutors\/(\d+)\/?$/)
        if (tutorMatch) return <TutorEditorPage mode="edit" tutorId={Number(tutorMatch[1])} />
        return <TutorsPage />
      }
      case 'blog': return <SimplePage title="Bookstore & Blog" description="Manage books, articles, and publishing content." icon={<BookOutlinedIcon fontSize="large" />} />
      case 'payments': return <PaymentsPage />
      case 'users': return <UsersPage />
      default: return <OverviewPage />
    }
  }, [adminUser, pathname, section])

  const sidebar = (
    <Box sx={{ width: drawerWidth, height: '100%', overflowY: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5 }}><Logo /></Box>
      <Divider />
      <Box component="nav" aria-label="Admin navigation" sx={{ p: 1.5, flex: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1.5, mb: 1, letterSpacing: 1.2, fontWeight: 700 }}>Main menu</Typography>
        {navigation.map((item) => (
          <Box
            key={item.key}
            component="button"
            title={item.label}
            aria-label={item.label}
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
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1.5, mb: 1, letterSpacing: 1.2, fontWeight: 700 }}>Preferences</Typography>
        <Box title="Settings" aria-label="Settings" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: 'background.default', borderRadius: 2 }}><SettingsOutlinedIcon color="disabled" fontSize="small" /><Typography variant="body2" color="text.secondary">Settings</Typography></Box>
      </Box>
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
              <IconButton id="admin-profile-button" onClick={() => navigateTo('/admin/profile')} aria-label="Open admin profile">
                <AccountCircleOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, minHeight: 'calc(100vh - 72px)' }}>
          {isLoading ? <AdminLoadingState /> : currentPage}
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
