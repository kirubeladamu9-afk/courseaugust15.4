import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { type FC, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/toast'
import EnrollmentModal from '@/components/course/enrollment-modal'
import { getAuthenticatedUser, getPublicClasses, type PublicClass } from '@/services/api'
import { type Course } from '@/interfaces/course'

type ProgramId = 'international-online-interactive' | 'summer-camp' | 'ministry-exam-prep'
type MinistryGrade = 'Grade 6' | 'Grade 8'

type CheckoutCourse = Pick<Course, 'id' | 'title' | 'price'> & { id: number }

interface ProgramDefinition {
  id: ProgramId
  eyebrow: string
  title: string
  price: string
  priceDetail: string
  description: string
  features: string[]
  accent: string
  icon: React.ReactNode
}

const mockClasses: PublicClass[] = [
  {
    id: 9001,
    title: 'July Morning Camp',
    programId: 'summer-camp',
    schedule: { days: ['Mon', 'Fri'], time: '09:00', flexible: false },
    price: 180,
    status: 'open',
    courseId: null,
    courseTitle: null,
    tutorName: 'Abel Tesfaye',
    capacity: 10,
    enrolledCount: 6,
    published: true,
    moduleCount: null,
    lessonCount: null,
  },
  {
    id: 9002,
    title: 'August Afternoon Camp',
    programId: 'summer-camp',
    schedule: { days: ['Mon', 'Fri'], time: '14:00', flexible: false },
    price: 180,
    status: 'full',
    courseId: null,
    courseTitle: null,
    tutorName: 'Mekdes Alemu',
    capacity: 10,
    enrolledCount: 10,
    published: true,
    moduleCount: null,
    lessonCount: null,
  },
  {
    id: 9003,
    title: 'Grade 6 Exam Prep',
    programId: 'ministry-exam-prep',
    schedule: { days: ['Tue', 'Thu'], time: '16:00', flexible: false },
    price: 220,
    status: 'open',
    courseId: null,
    courseTitle: 'Ministry Exam Prep · Grade 6',
    tutorName: 'Maya Chen',
    capacity: 12,
    enrolledCount: 7,
    published: true,
    moduleCount: 8,
    lessonCount: 24,
  },
  {
    id: 9004,
    title: 'Grade 8 Exam Prep',
    programId: 'ministry-exam-prep',
    schedule: { days: ['Tue', 'Thu'], time: '18:00', flexible: false },
    price: 220,
    status: 'open',
    courseId: null,
    courseTitle: 'Ministry Exam Prep · Grade 8',
    tutorName: 'Leon Kennedy',
    capacity: 12,
    enrolledCount: 8,
    published: true,
    moduleCount: 8,
    lessonCount: 24,
  },
]

const programs: ProgramDefinition[] = [
  {
    id: 'international-online-interactive',
    eyebrow: 'Flexible start',
    title: 'International Online Interactive',
    price: '$120',
    priceDetail: '/ package',
    description: 'Live, engaging online classes designed to build confidence and sharpen thinking with guided instruction and practice.',
    features: ['Ages 8–18', 'Live online instruction', 'Flexible scheduling after payment'],
    accent: '#127C71',
    icon: <SchoolOutlinedIcon fontSize="small" />,
  },
  {
    id: 'summer-camp',
    eyebrow: 'Live cohorts',
    title: 'Summer Camp Packages',
    price: 'From $180',
    priceDetail: '/ package',
    description: 'Make school breaks count with focused, social learning in small live cohorts.',
    features: ['Small live learning groups', 'Weekday camp schedules', 'Tutor-led practice and support'],
    accent: '#D0821C',
    icon: <EventAvailableOutlinedIcon fontSize="small" />,
  },
  {
    id: 'ministry-exam-prep',
    eyebrow: 'Exam focused',
    title: 'Ministry Exam Prep',
    price: 'From $220',
    priceDetail: '/ package',
    description: 'Structured revision and exam-focused support aligned to each learner’s grade level.',
    features: ['Grade-specific preparation', 'Linked course curriculum', 'Small-group exam support'],
    accent: '#127C71',
    icon: <MenuBookOutlinedIcon fontSize="small" />,
  },
]

const formatTime = (time: string) => {
  if (!time) return 'Time to be confirmed'
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 'Time to be confirmed'
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

const formatSchedule = (schedule: PublicClass['schedule']) => {
  if (schedule.flexible) return 'Flexible schedule'
  return `${schedule.days.length ? schedule.days.join(', ') : 'Days to be confirmed'} · ${formatTime(schedule.time)}`
}

const findCourse = (courses: Course[], classRecord?: PublicClass, preferInternational = false): CheckoutCourse | null => {
  const candidate = preferInternational
    ? courses.find((course) => course.category.toLowerCase().includes('international') || course.title.toLowerCase().includes('interactive'))
    : classRecord?.courseId !== null && classRecord?.courseId !== undefined
      ? courses.find((course) => Number(course.id) === classRecord.courseId)
      : courses.find((course) => classRecord?.courseTitle ? course.title.toLowerCase().includes(classRecord.courseTitle.toLowerCase()) : false)
  const fallback = candidate ?? courses[0]
  if (!fallback || typeof fallback.id !== 'number') return null
  return { id: fallback.id, title: fallback.title, price: fallback.price }
}

const AvailabilityBadge: FC<{ classRecord: PublicClass }> = ({ classRecord }) => (
  <Chip
    size="small"
    label={classRecord.status === 'full' ? 'Full · Join waitlist' : `${classRecord.enrolledCount}/${classRecord.capacity} spots`}
    color={classRecord.status === 'full' ? 'warning' : 'success'}
    variant="outlined"
  />
)

interface BatchCardProps {
  classRecord: PublicClass
  curriculum?: string
  onEnroll: (classRecord: PublicClass) => void
}

const BatchCard: FC<BatchCardProps> = ({ classRecord, curriculum, onEnroll }) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
        <Typography component="h4" variant="subtitle1" sx={{ fontWeight: 700 }}>{classRecord.title}</Typography>
        <Typography color="primary.main" variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>${classRecord.price}</Typography>
      </Stack>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        <Typography color="text.secondary" variant="body2">{formatSchedule(classRecord.schedule)}</Typography>
        <Typography color="text.secondary" variant="body2">Tutor: {classRecord.tutorName}</Typography>
        {curriculum && <Typography color="text.secondary" variant="body2">Curriculum: {curriculum}</Typography>}
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <AvailabilityBadge classRecord={classRecord} />
        <Button size="small" variant={classRecord.status === 'full' ? 'outlined' : 'contained'} onClick={() => onEnroll(classRecord)} disabled={classRecord.status !== 'open' && classRecord.status !== 'full'}>
          {classRecord.status === 'full' ? 'Join Waitlist' : 'Join'}
        </Button>
      </Stack>
    </CardContent>
  </Card>
)

interface BatchDrawerProps {
  programId: ProgramId
  classes: PublicClass[]
  open: boolean
  grade: MinistryGrade
  onGradeChange: (grade: MinistryGrade) => void
  onClose: () => void
  onEnroll: (classRecord: PublicClass) => void
}

const BatchDrawer: FC<BatchDrawerProps> = ({ programId, classes, open, grade, onGradeChange, onClose, onEnroll }) => {
  const visibleClasses = programId === 'ministry-exam-prep'
    ? classes.filter((classRecord) => classRecord.title.toLowerCase().includes(grade.toLowerCase()) || classRecord.courseTitle?.toLowerCase().includes(grade.toLowerCase()))
    : classes

  return (
    <>
      <Box
        aria-hidden={!open}
        onClick={onClose}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          backgroundColor: 'rgba(18, 34, 34, 0.12)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 220ms ease',
        }}
      />
      <Box
        role="dialog"
        aria-label={`${programId === 'summer-camp' ? 'Summer Camp' : 'Ministry Exam Prep'} batches`}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          width: { xs: '100%', sm: '92%', md: 360 },
          p: { xs: 2, md: 2.5 },
          overflowY: 'auto',
          backgroundColor: 'background.paper',
          boxShadow: '-12px 0 28px rgba(18, 34, 34, 0.12)',
          transform: open ? 'translateX(0)' : 'translateX(105%)',
          transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
          <Box>
            <Typography component="h3" variant="h6">{programId === 'summer-camp' ? 'Open camp batches' : 'Exam prep batches'}</Typography>
            <Typography color="text.secondary" variant="body2">Choose a schedule that fits your learner.</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close batches panel"><CloseIcon fontSize="small" /></IconButton>
        </Stack>
        {programId === 'ministry-exam-prep' && <Tabs grade={grade} onGradeChange={onGradeChange} />}
        <Stack spacing={1.5}>
          {visibleClasses.length > 0 ? visibleClasses.map((classRecord) => (
            <BatchCard
              key={classRecord.id}
              classRecord={classRecord}
              curriculum={programId === 'ministry-exam-prep' ? `${classRecord.moduleCount ?? 8} modules · ${classRecord.lessonCount ?? 24} lessons` : undefined}
              onEnroll={onEnroll}
            />
          )) : <Typography color="text.secondary" variant="body2">No published batches are available for this grade yet.</Typography>}
        </Stack>
      </Box>
    </>
  )
}

const Tabs: FC<{ grade: MinistryGrade; onGradeChange: (grade: MinistryGrade) => void }> = ({ grade, onGradeChange }) => (
  <Stack direction="row" spacing={0.5} sx={{ mb: 2, p: 0.5, borderRadius: 2, backgroundColor: 'background.default' }}>
    {(['Grade 6', 'Grade 8'] as MinistryGrade[]).map((option) => (
      <Button key={option} fullWidth size="small" variant={grade === option ? 'contained' : 'text'} onClick={() => onGradeChange(option)}>{option}</Button>
    ))}
  </Stack>
)

interface ProgramCardProps {
  program: ProgramDefinition
  classes: PublicClass[]
  onEnroll: (classRecord?: PublicClass, preferInternational?: boolean) => void
}

const ProgramCard: FC<ProgramCardProps> = ({ program, classes, onEnroll }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [grade, setGrade] = useState<MinistryGrade>('Grade 6')
  const isBatchProgram = program.id !== 'international-online-interactive'

  return (
    <Card elevation={0} sx={{ position: 'relative', height: '100%', minHeight: { xs: 560, md: 600 }, overflow: 'hidden', border: 1, borderTop: 3, borderColor: 'divider', borderTopColor: program.accent, borderRadius: 3, backgroundColor: 'background.paper' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', color: program.accent, backgroundColor: program.id === 'summer-camp' ? 'rgba(255, 175, 53, 0.16)' : 'rgba(159, 241, 210, 0.4)' }}>{program.icon}</Box>
          <Chip label={program.eyebrow} size="small" variant="outlined" sx={{ borderColor: 'divider', fontSize: 11 }} />
        </Stack>
        <Typography component="h3" variant="h5" sx={{ mb: 0.75 }}>{program.title}</Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>{program.price}</Typography>
          <Typography color="text.secondary" variant="caption">{program.priceDetail}</Typography>
        </Stack>
        <Typography color="text.secondary" variant="body2" sx={{ minHeight: 68, lineHeight: 1.55, mb: 2 }}>{program.description}</Typography>
        <Stack spacing={1} sx={{ mb: 2.5 }}>
          {program.features.map((feature) => <Box key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}><CheckCircleOutlineIcon sx={{ mt: 0.15, color: 'primary.main', fontSize: 15 }} /><Typography variant="caption" color="text.secondary">{feature}</Typography></Box>)}
        </Stack>
        {isBatchProgram && <Box component="button" type="button" onClick={() => setIsDrawerOpen((current) => !current)} aria-expanded={isDrawerOpen} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', p: 0, mb: 1.5, border: 0, background: 'none', color: 'text.primary', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{program.id === 'summer-camp' ? 'View open batches' : 'View exam prep batches'}</Typography><Typography aria-hidden="true" sx={{ color: 'primary.main', fontSize: 27, lineHeight: 0.7, fontWeight: 400 }}>{isDrawerOpen ? '×' : '›'}</Typography></Box>}
        {isBatchProgram && <Divider sx={{ mb: 2 }} />}
        <Box sx={{ mt: 'auto' }}>
          <Button fullWidth variant="contained" onClick={() => onEnroll(undefined, program.id === 'international-online-interactive')}>{program.id === 'international-online-interactive' ? 'Enroll Now' : 'Choose a batch'}</Button>
          {program.id === 'international-online-interactive' && <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>Pending — we&apos;ll contact you to schedule your class</Typography>}
        </Box>
      </CardContent>
      {isBatchProgram && <BatchDrawer programId={program.id} classes={classes} open={isDrawerOpen} grade={grade} onGradeChange={setGrade} onClose={() => setIsDrawerOpen(false)} onEnroll={(classRecord) => onEnroll(classRecord)} />}
    </Card>
  )
}

interface HomeTrainingProgramsProps {
  courses: Course[]
  onSignIn: () => void
}

const HomeTrainingPrograms: FC<HomeTrainingProgramsProps> = ({ courses, onSignIn }) => {
  const [liveClasses, setLiveClasses] = useState<PublicClass[]>([])
  const [enrollmentCourse, setEnrollmentCourse] = useState<CheckoutCourse | null>(null)
  const [enrollmentClassId, setEnrollmentClassId] = useState<number | null>(null)

  useEffect(() => {
    let isCurrent = true
    getPublicClasses().then((records) => {
      if (isCurrent) setLiveClasses(records)
    }).catch(() => {
      if (isCurrent) setLiveClasses([])
    })
    return () => {
      isCurrent = false
    }
  }, [])

  const classesByProgram = useMemo(() => {
    const result = {} as Record<ProgramId, PublicClass[]>
    programs.forEach((program) => {
      const live = liveClasses.filter((classRecord) => classRecord.programId === program.id && classRecord.published && classRecord.status !== 'closed')
      result[program.id] = live.length > 0 ? live : mockClasses.filter((classRecord) => classRecord.programId === program.id && classRecord.published && classRecord.status !== 'closed')
    })
    return result
  }, [liveClasses])

  const handleEnroll = (classRecord?: PublicClass, preferInternational = false) => {
    if (!getAuthenticatedUser()) {
      onSignIn()
      return
    }
    const course = findCourse(courses, classRecord, preferInternational)
    if (!course) {
      toast.add({ title: 'Enrollment is not ready', description: 'A published course is needed before checkout can begin.', type: 'error' })
      return
    }
    const isLiveClass = classRecord ? liveClasses.some((liveClass) => liveClass.id === classRecord.id) : false
    setEnrollmentCourse(course)
    setEnrollmentClassId(isLiveClass ? classRecord?.id ?? null : null)
  }

  const closeEnrollment = () => {
    setEnrollmentCourse(null)
    setEnrollmentClassId(null)
  }

  return (
    <Box id="training-programs" sx={{ py: { xs: 7, md: 10 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography color="primary.main" variant="overline" sx={{ letterSpacing: 1.4, fontWeight: 700 }}>Find your path</Typography>
            <Typography component="h2" variant="h2" sx={{ mb: 0.5 }}>Our Training Programs</Typography>
            <Typography color="text.secondary">Choose the learning experience that fits your goals, schedule, and stage.</Typography>
          </Box>
          <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 180 }}>Small groups. Expert tutors. Real progress.</Typography>
        </Stack>
        <Grid container spacing={2} alignItems="stretch">
          {programs.map((program) => <Grid key={program.id} item xs={12} md={4}><ProgramCard program={program} classes={classesByProgram[program.id]} onEnroll={handleEnroll} /></Grid>)}
        </Grid>
      </Container>
      {enrollmentCourse && <EnrollmentModal course={enrollmentCourse} classId={enrollmentClassId} open={Boolean(enrollmentCourse)} onClose={closeEnrollment} />}
    </Box>
  )
}

export default HomeTrainingPrograms
