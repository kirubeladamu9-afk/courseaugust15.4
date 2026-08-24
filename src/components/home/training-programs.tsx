import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Chip from '@mui/material/Chip'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useMemo, useState } from 'react'
import { getTrainingBatches, type AdminClassSchedule, type TrainingBatchRecord } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

interface TrainingBatch {
  id: number
  title: string
  schedule: string
  tutor: string
  enrolled: number
  capacity: number
  price: number
  courseId: number | null
  curriculum?: string
}

const getCurriculumSummary = (modules: TrainingBatchRecord['modules'] | null = []) => {
  const normalizedModules = modules ?? []
  const lessonCount = normalizedModules.reduce((total, module) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0)
  return `${normalizedModules.length} modules · ${lessonCount} lessons`
}

const parseSchedule = (value: TrainingBatchRecord['schedule']): AdminClassSchedule => {
  try {
    const schedule = typeof value === 'string' ? JSON.parse(value) as Partial<AdminClassSchedule> : value
    return {
      days: Array.isArray(schedule?.days) ? schedule.days : [],
      time: typeof schedule?.time === 'string' ? schedule.time : '',
      flexible: schedule?.flexible === true,
    }
  } catch {
    return { days: [], time: '', flexible: false }
  }
}

const mapTrainingBatch = (batch: TrainingBatchRecord): TrainingBatch => {
  const schedule = parseSchedule(batch.schedule)
  return {
  id: batch.id,
  title: batch.title,
  schedule: schedule.flexible ? 'Flexible schedule' : `${schedule.days.join(', ')} · ${schedule.time}`,
  tutor: batch.tutor,
  enrolled: batch.enrolled,
  capacity: batch.capacity,
  price: batch.price,
  courseId: batch.course_id,
  curriculum: batch.program_id === 'ministry-exam-prep' ? getCurriculumSummary(batch.modules) : undefined,
  }
}

const formatPrice = (price: number) => `$${price}`

const PackageFeatures: FC<{ items: string[] }> = ({ items }) => <Stack spacing={1.25} sx={{ mb: 3 }}>
  {items.map((item) => <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleOutlineIcon color="primary" fontSize="small" /><Typography variant="body2">{item}</Typography></Box>)}
</Stack>

const BatchCard: FC<{ batch: TrainingBatch }> = ({ batch }) => {
  const isFull = batch.enrolled >= batch.capacity

  return <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: isFull ? 'divider' : 'primary.light', backgroundColor: 'background.default' }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack spacing={1.25}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{batch.title}</Typography>
            {isFull && <Chip label="Full" size="small" variant="outlined" sx={{ mt: 0.75, height: 22 }} />}
          </Box>
          <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(batch.price)}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">{batch.schedule}</Typography>
        <Typography variant="body2" color="text.secondary">Tutor: {batch.tutor}</Typography>
        {batch.curriculum && <Typography variant="body2" color="text.secondary">{batch.curriculum}</Typography>}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary">Availability</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{batch.enrolled}/{batch.capacity} spots</Typography>
          </Box>
          <LinearProgress variant="determinate" value={Math.min(100, (batch.enrolled / batch.capacity) * 100)} color={isFull ? 'inherit' : 'primary'} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant={isFull ? 'outlined' : 'contained'} disabled={!batch.courseId} onClick={() => batch.courseId && navigateTo(`/courses/${batch.courseId}?batch=${batch.id}`)}>
            {!batch.courseId ? 'Enrollment unavailable' : isFull ? 'Join Waitlist' : 'Join'}
          </Button>
        </Box>
      </Stack>
    </CardContent>
  </Card>
}

const BatchList: FC<{ batches: TrainingBatch[] }> = ({ batches }) => batches.length > 0 ? <Stack spacing={1.5} sx={{ mt: 2 }}>{batches.map((batch) => <BatchCard key={batch.id} batch={batch} />)}</Stack> : <Typography color="text.secondary" sx={{ mt: 2 }}>No published batches are available right now.</Typography>

const TrainingPrograms: FC = () => {
  const [openProgram, setOpenProgram] = useState<string | false>(false)
  const [grade, setGrade] = useState('Grade 6')
  const [batchRecords, setBatchRecords] = useState<TrainingBatchRecord[]>([])

  useEffect(() => {
    const controller = new AbortController()
    getTrainingBatches(controller.signal).then(setBatchRecords).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setBatchRecords([])
    })
    return () => controller.abort()
  }, [])

  const summerCampBatches = useMemo(() => batchRecords.filter((batch) => batch.program_id === 'summer-camp').map(mapTrainingBatch), [batchRecords])
  const ministryBatches = useMemo(() => batchRecords.filter((batch) => batch.program_id === 'ministry-exam-prep').reduce<Record<string, TrainingBatch[]>>((groups, batch) => {
    const level = batch.title.match(/Grade (6|8)/)?.[0] ?? 'Grade 6'
    groups[level] = [...(groups[level] ?? []), mapTrainingBatch(batch)]
    return groups
  }, { 'Grade 6': [], 'Grade 8': [] }), [batchRecords])

  return <Box id="training-programs" sx={{ py: { xs: 7, md: 10 }, backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: 80, right: -100, width: 260, height: 260, borderRadius: '50%', backgroundColor: 'primary.light', opacity: 0.12 }} />
    <Container maxWidth="lg" sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 2, mb: 5 }}>
        <Box sx={{ maxWidth: 650 }}>
          <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2, fontWeight: 700 }}>Find your path</Typography>
          <Typography component="h2" variant="h3" sx={{ mt: 1, mb: 1.5, fontSize: { xs: '2.25rem', md: '2.75rem' } }}>Our Training Programs</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>Choose the learning experience that fits your goals, schedule, and stage.</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, lineHeight: 1.6 }}>Small groups. Expert tutors. Real progress.</Typography>
      </Box>
      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card elevation={1} sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 3, md: 3.5 }, borderTop: 4, borderColor: 'primary.main', borderRadius: '16px 16px 0 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'primary.light', color: 'primary.main' }}><SchoolOutlinedIcon /></Box><Chip label="Flexible start" color="primary" variant="outlined" size="small" /></Box>
              <Typography component="h3" variant="h5" sx={{ mb: 1 }}>International Online Interactive</Typography>
              <Typography variant="h3" color="primary.main" sx={{ mb: 1.5, fontWeight: 700 }}>$120<Typography component="span" variant="body2" color="text.secondary"> / package</Typography></Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Live, engaging online classes designed to build confident learners through interactive instruction and guided practice.</Typography>
              <PackageFeatures items={['Ages 8–18', 'Live online instruction', 'Flexible scheduling after payment']} />
              <Button fullWidth variant="contained" size="large" sx={{ mt: 'auto' }} onClick={() => navigateTo('/courses/1?program=international')}>Enroll Now</Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>Pending — we'll contact you to schedule your class</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card elevation={1} sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 3, md: 3.5 }, borderTop: 4, borderColor: 'secondary.main', borderRadius: '16px 16px 0 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'secondary.light', color: 'secondary.main' }}><SchoolOutlinedIcon /></Box><Chip label="Live cohorts" color="secondary" variant="outlined" size="small" /></Box>
              <Typography component="h3" variant="h5" sx={{ mb: 1 }}>Summer Camp Packages</Typography>
              <Typography variant="h3" color="primary.main" sx={{ mb: 1.5, fontWeight: 700 }}>From $180<Typography component="span" variant="body2" color="text.secondary"> / package</Typography></Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Make school breaks count with focused, social learning in small live cohorts.</Typography>
              <PackageFeatures items={['Small live learning groups', 'Weekday camp schedules', 'Tutor-led practice and support']} />
              <Box component="button" type="button" onClick={() => setOpenProgram(openProgram === 'summer' ? false : 'summer')} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 0, py: 1.5, border: 0, borderTop: 1, borderColor: 'divider', backgroundColor: 'transparent', color: 'text.primary', cursor: 'pointer', font: 'inherit', textAlign: 'left', '&:hover': { color: 'secondary.main' } }}>
                <Typography sx={{ fontWeight: 700 }}>View open batches</Typography>
                <ChevronRightIcon color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card elevation={1} sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 3, md: 3.5 }, borderTop: 4, borderColor: 'primary.main', borderRadius: '16px 16px 0 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'primary.light', color: 'primary.main' }}><SchoolOutlinedIcon /></Box><Chip label="Exam focused" color="primary" variant="outlined" size="small" /></Box>
              <Typography component="h3" variant="h5" sx={{ mb: 1 }}>Ministry Exam Prep</Typography>
              <Typography variant="h3" color="primary.main" sx={{ mb: 1.5, fontWeight: 700 }}>From $220<Typography component="span" variant="body2" color="text.secondary"> / package</Typography></Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Structured revision and exam-focused support aligned to each learner’s grade level.</Typography>
              <PackageFeatures items={['Grade-specific preparation', 'Linked course curriculum', 'Small-group exam support']} />
              <Box component="button" type="button" onClick={() => setOpenProgram(openProgram === 'ministry' ? false : 'ministry')} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 0, py: 1.5, border: 0, borderTop: 1, borderColor: 'divider', backgroundColor: 'transparent', color: 'text.primary', cursor: 'pointer', font: 'inherit', textAlign: 'left', '&:hover': { color: 'primary.main' } }}>
                <Typography sx={{ fontWeight: 700 }}>View exam prep batches</Typography>
                <ChevronRightIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    <Drawer anchor="right" open={Boolean(openProgram)} onClose={() => setOpenProgram(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: { xs: 2.5, sm: 3.5 }, backgroundColor: 'background.default' } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.5, fontWeight: 700 }}>Available sessions</Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>{openProgram === 'summer' ? 'Summer Camp Packages' : 'Ministry Exam Prep'}</Typography>
        </Box>
        <IconButton aria-label="Close batch panel" title="Close batch panel" onClick={() => setOpenProgram(false)}><CloseIcon /></IconButton>
      </Box>
      {openProgram === 'ministry' && <Tabs value={grade} onChange={(_, value: string) => setGrade(value)} variant="fullWidth" sx={{ mb: 1 }}>
        {Object.keys(ministryBatches).map((level) => <Tab key={level} value={level} label={level} />)}
      </Tabs>}
      <BatchList batches={openProgram === 'summer' ? summerCampBatches : ministryBatches[grade]} />
    </Drawer>
  </Box>
}

export default TrainingPrograms
