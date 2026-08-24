import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Grid from '@mui/material/Grid'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined'
import { type FC, useEffect, useState } from 'react'
import { type AdminCourse, type AdminLesson } from '@/components/admin/admin-data'
import EnrollmentModal from '@/components/course/enrollment-modal'
import { getAuthenticatedUser, getAdminCourse, getCourse as getCourseFromApi } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h${minutes ? ` ${minutes}m` : ''}` : `${minutes}m`
}

const getLessonLabel = (lesson: AdminLesson) => {
  if (lesson.type === 'video') return lesson.duration ? formatDuration(lesson.duration) : 'Video'
  if (lesson.type === 'article') return 'Article'
  if (lesson.type === 'quiz') return 'Quiz'
  return 'Live'
}

const LessonTypeIcon: FC<{ type: AdminLesson['type'] }> = ({ type }) => {
  if (type === 'article') return <MenuBookOutlinedIcon fontSize="small" />
  return <PlayCircleOutlineIcon fontSize="small" />
}

const CourseDetailPage: FC<{ courseId: string }> = ({ courseId }) => {
  const [course, setCourse] = useState<AdminCourse | null>(null)
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false)
  const isAdmin = getAuthenticatedUser()?.role === 'admin'
  const paymentReference = new URLSearchParams(window.location.search).get('payment')

  useEffect(() => {
    if (paymentReference) setIsEnrollmentOpen(true)
  }, [paymentReference])

  useEffect(() => {
    let isCurrent = true
    setCourse(null)
    setIsLoading(true)
    setExpandedModules([])

    const loadCourse = isAdmin ? getAdminCourse(Number(courseId)) : getCourseFromApi(courseId)

    loadCourse
      .then((nextCourse) => {
        if (!isCurrent) return
        setCourse(nextCourse)
        setExpandedModules(nextCourse.modules.map((module) => module.id))
      })
      .catch(() => {
        if (!isCurrent) return
        setCourse(null)
        setExpandedModules([])
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [courseId, isAdmin])

  if (isLoading && !course) {
    return <Container maxWidth="lg" sx={{ py: 12, textAlign: 'center' }}><Typography variant="h4">Loading course...</Typography></Container>
  }

  if (!course) {
    return <Container maxWidth="lg" sx={{ py: 12, textAlign: 'center' }}><Typography variant="h4" sx={{ mb: 1 }}>Course not found</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>This course may have been removed or is not available yet.</Typography><Button variant="contained" onClick={() => navigateTo('/')}>Back to courses</Button></Container>
  }

  const lessons = course.modules.flatMap((module) => module.lessons)
  const videoLessons = lessons.filter((lesson) => lesson.type === 'video')
  const totalVideoSeconds = videoLessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0)
  const totalDurationSeconds = lessons.reduce((total, lesson) => total + (lesson.duration ?? lesson.estimatedDuration ?? 0), 0)
  const resourceCount = lessons.reduce((total, lesson) => total + lesson.resources.length, 0)
  const firstVideo = videoLessons[0]
  const allExpanded = course.modules.length > 0 && expandedModules.length === course.modules.length

  const toggleExpandAll = () => setExpandedModules(allExpanded ? [] : course.modules.map((module) => module.id))
  const toggleModule = (moduleId: number) => setExpandedModules((current) => current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId])

  return <Box sx={{ backgroundColor: 'background.default' }}>
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Box component="button" type="button" onClick={() => navigateTo('/')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0, mb: 3, border: 0, background: 'none', color: 'primary.main', cursor: 'pointer', font: 'inherit' }}>
        Courses <Typography component="span" color="text.secondary">/</Typography> <Typography component="span" color="text.primary">{course.title}</Typography>
      </Box>

      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid item xs={12} md={8}>
          <Chip label={course.category} color="primary" size="small" sx={{ mb: 2 }} />
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 54 }, mb: 2 }}>{course.title}</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.5, mb: 2 }}>{course.description}</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">{course.students.toLocaleString()} students</Typography>
            <Typography variant="body2" color="text.secondary">{course.level}</Typography>
            <Typography variant="body2" color="text.secondary">Updated {course.updatedAt}</Typography>
          </Stack>
          <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: { xs: 230, md: 390 }, borderRadius: 3, backgroundColor: 'grey.900', backgroundImage: `url(${course.cover})`, backgroundPosition: 'center', backgroundSize: 'cover' }}>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 20, 30, 0.42)' }}>
              {firstVideo?.videoUrl ? <Box component="video" controls preload="metadata" src={firstVideo.videoUrl} poster={firstVideo.thumbnailUrl || course.cover} sx={{ width: '100%', height: '100%', objectFit: 'cover' }}>Your browser does not support video playback.</Box> : <Box component="button" type="button" aria-label="Play course preview" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, p: 0, border: 0, borderRadius: '50%', backgroundColor: 'primary.main', color: 'primary.contrastText', cursor: 'pointer', '&:hover': { backgroundColor: 'primary.dark', transform: 'scale(1.04)' }, transition: 'transform 160ms ease' }}><PlayCircleOutlineIcon sx={{ fontSize: 42 }} /></Box>}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ position: { md: 'sticky' }, top: { md: 24 }, p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>${course.price}</Typography>
            <Button fullWidth variant="contained" size="large" onClick={() => setIsEnrollmentOpen(true)}>ENROLL NOW</Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>Full lifetime access</Typography>
            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>This course includes</Typography>
            <Stack spacing={1.25}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VideoLibraryOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">{formatDuration(totalVideoSeconds)} of video</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MenuBookOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">{lessons.filter((lesson) => lesson.type === 'article').length} articles</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SchoolOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">{resourceCount} downloadable resources</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SchoolOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">{course.certificate ? 'Certificate of completion' : 'No certificate included'}</Typography></Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 4, md: 6 }} sx={{ mt: { xs: 2, md: 4 } }}>
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            <Box><Typography variant="h4" sx={{ mb: 2 }}>What you'll learn</Typography><Stack spacing={1}>{course.learningOutcomes.map((outcome) => <Box key={outcome} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}><Typography color="primary.main" sx={{ fontSize: 22, lineHeight: 1 }}>✓</Typography><Typography>{outcome}</Typography></Box>)}</Stack></Box>
            <Box><Typography variant="h4" sx={{ mb: 2 }}>Requirements</Typography><Stack spacing={1}>{course.requirements.map((requirement) => <Box key={requirement} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}><Typography color="primary.main" sx={{ fontSize: 22, lineHeight: 1 }}>✓</Typography><Typography>{requirement}</Typography></Box>)}</Stack></Box>
            <Box><Typography variant="h4" sx={{ mb: 2 }}>Description</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{course.longDescription}</Typography></Box>
            <Box id="course-content">
              <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box><Typography variant="h4">Course content</Typography><Typography color="text.secondary" variant="body2">{course.modules.length} sections · {lessons.length} lectures · {formatDuration(totalDurationSeconds)}</Typography></Box>
                <Button size="small" variant="text" onClick={toggleExpandAll}>{allExpanded ? 'Collapse all' : 'Expand all'}</Button>
              </Box>
              <Stack spacing={1.25}>{course.modules.map((module) => <Accordion key={module.id} expanded={expandedModules.includes(module.id)} onChange={() => toggleModule(module.id)} disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', '&::before': { display: 'none' } }}><AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`module-${module.id}-content`} id={`module-${module.id}-header`}><Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 2, pr: 1 }}><Typography sx={{ fontWeight: 600 }}>{module.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{module.lessons.length} lectures · {formatDuration(module.lessons.reduce((total, lesson) => total + (lesson.duration ?? lesson.estimatedDuration ?? 0), 0))}</Typography></Box></AccordionSummary><AccordionDetails sx={{ pt: 0 }}><Stack divider={<Divider flexItem />}>{module.lessons.map((lesson) => <Box key={lesson.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}><Box color="text.secondary" sx={{ display: 'flex' }}><LessonTypeIcon type={lesson.type} /></Box><Typography variant="body2" sx={{ flexGrow: 1 }}>{lesson.title}</Typography><Typography variant="body2" color="text.secondary">{getLessonLabel(lesson)}</Typography></Box>)}</Stack></AccordionDetails></Accordion>)}</Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Container>
    <EnrollmentModal course={course} open={isEnrollmentOpen} paymentReference={paymentReference} onClose={() => setIsEnrollmentOpen(false)} />
  </Box>
}

export default CourseDetailPage
