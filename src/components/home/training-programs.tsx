import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Grid from '@mui/material/Grid'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { type FC, useState } from 'react'
import { navigateTo } from '@/lib/navigation'

interface TrainingBatch {
  id: string
  title: string
  schedule: string
  tutor: string
  enrolled: number
  capacity: number
  price: number
  courseId: number
  curriculum?: string
}

const summerCampBatches: TrainingBatch[] = [
  { id: 'summer-july-morning', title: 'July Morning Camp', schedule: 'July 8–26 · Mon–Fri · 9:00 AM', tutor: 'Abel Tesfaye', enrolled: 6, capacity: 10, price: 180, courseId: 1 },
  { id: 'summer-august-afternoon', title: 'August Afternoon Camp', schedule: 'August 5–23 · Mon–Fri · 2:00 PM', tutor: 'Mekdes Alemu', enrolled: 10, capacity: 10, price: 180, courseId: 1 },
]

const ministryBatches: Record<string, TrainingBatch[]> = {
  'Grade 6': [
    { id: 'ministry-grade-6-july', title: 'Grade 6 July Intensive', schedule: 'July 1–19 · Mon–Fri · 10:00 AM', tutor: 'Sara Bekele', enrolled: 6, capacity: 10, price: 220, courseId: 2, curriculum: '8 modules · 24 lessons' },
    { id: 'ministry-grade-6-august', title: 'Grade 6 August Review', schedule: 'August 5–23 · Mon–Fri · 10:00 AM', tutor: 'Sara Bekele', enrolled: 4, capacity: 10, price: 220, courseId: 2, curriculum: '8 modules · 24 lessons' },
  ],
  'Grade 8': [
    { id: 'ministry-grade-8-july', title: 'Grade 8 July Intensive', schedule: 'July 1–19 · Mon–Fri · 1:00 PM', tutor: 'Dawit Girma', enrolled: 10, capacity: 10, price: 240, courseId: 3, curriculum: '10 modules · 30 lessons' },
    { id: 'ministry-grade-8-august', title: 'Grade 8 August Review', schedule: 'August 5–23 · Mon–Fri · 1:00 PM', tutor: 'Dawit Girma', enrolled: 7, capacity: 10, price: 240, courseId: 3, curriculum: '10 modules · 30 lessons' },
  ],
}

const formatPrice = (price: number) => `$${price}`

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
          <Button size="small" variant={isFull ? 'outlined' : 'contained'} onClick={() => navigateTo(`/courses/${batch.courseId}?batch=${encodeURIComponent(batch.id)}`)}>
            {isFull ? 'Join Waitlist' : 'Join'}
          </Button>
        </Box>
      </Stack>
    </CardContent>
  </Card>
}

const BatchList: FC<{ batches: TrainingBatch[] }> = ({ batches }) => <Stack spacing={1.5} sx={{ mt: 2 }}>{batches.map((batch) => <BatchCard key={batch.id} batch={batch} />)}</Stack>

const TrainingPrograms: FC = () => {
  const [openProgram, setOpenProgram] = useState<string | false>(false)
  const [grade, setGrade] = useState('Grade 6')

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
              <Typography component="h3" variant="h5" sx={{ mb: 1.5 }}>International Online Interactive</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Live, engaging online classes designed to build confident learners through interactive instruction and guided practice.</Typography>
              <Stack divider={<Divider flexItem />} spacing={1.25} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography color="text.secondary">Age range</Typography><Typography sx={{ fontWeight: 600 }}>Ages 8–18</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography color="text.secondary">Format</Typography><Typography sx={{ fontWeight: 600 }}>Live online</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Typography color="text.secondary">Price</Typography><Typography color="primary.main" sx={{ fontWeight: 700 }}>$120</Typography></Box>
              </Stack>
              <Button fullWidth variant="contained" size="large" sx={{ mt: 'auto' }} onClick={() => navigateTo('/courses/1?program=international')}>Enroll Now</Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>Pending — we'll contact you to schedule your class</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card elevation={1} sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 3, md: 3.5 }, borderTop: 4, borderColor: 'secondary.main', borderRadius: '16px 16px 0 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'secondary.light', color: 'secondary.main' }}><SchoolOutlinedIcon /></Box><Chip label="Live cohorts" color="secondary" variant="outlined" size="small" /></Box>
              <Typography component="h3" variant="h5" sx={{ mb: 1.5 }}>Summer Camp Packages</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Make school breaks count with focused, social learning in small live cohorts.</Typography>
              <Accordion expanded={openProgram === 'summer'} onChange={(_, expanded) => setOpenProgram(expanded ? 'summer' : false)} disableGutters elevation={0} sx={{ '&::before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 48 }}><Typography sx={{ fontWeight: 700 }}>View open batches</Typography></AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}><BatchList batches={summerCampBatches} /></AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card elevation={1} sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 3, md: 3.5 }, borderTop: 4, borderColor: 'primary.main', borderRadius: '16px 16px 0 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'primary.light', color: 'primary.main' }}><SchoolOutlinedIcon /></Box><Chip label="Exam focused" color="primary" variant="outlined" size="small" /></Box>
              <Typography component="h3" variant="h5" sx={{ mb: 1.5 }}>Ministry Exam Prep</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>Structured revision and exam-focused support aligned to each learner’s grade level.</Typography>
              <Tabs value={grade} onChange={(_, value: string) => setGrade(value)} variant="fullWidth" sx={{ mb: 1 }}>
                {Object.keys(ministryBatches).map((level) => <Tab key={level} value={level} label={level} />)}
              </Tabs>
              <BatchList batches={ministryBatches[grade]} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  </Box>
}

export default TrainingPrograms
