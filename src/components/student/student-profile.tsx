import { useEffect, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

type StudentProfileData = {
  user: { name: string; username: string; email: string; status: string; lastLoginAt: string | null }
  student: { fullName: string; dateOfBirth: string; gender: string; admissionNumber: string; photoName: string | null; academicYear: string; gradeLevel: string; classSection: string; enrollmentDate: string; address: string | null; status: string }
  guardians: { name: string; email: string | null; phone: string | null; address: string | null; relationshipType: string }[]
}

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

const StudentProfile: FC = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ profile: StudentProfileData }>('/api/student/profile', { withCredentials: true })
      .then(({ data }) => setProfile(data.profile))
      .catch(() => setError('Unable to load your profile. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LinearProgress />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!profile) return null

  const { student, guardians } = profile
  const photoSource = student.photoName?.startsWith('data:image/') || student.photoName?.startsWith('https://') ? student.photoName : undefined
  const lastLogin = profile.user.lastLoginAt ? new Date(profile.user.lastLoginAt).toLocaleString() : 'Not available'

  return <Stack spacing={2}>
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <ButtonBase onClick={() => navigate('/student')} sx={{ mb: 3, color: 'text.secondary', borderRadius: 1, p: 0.5, '&:hover': { color: 'primary.main' } }}><ArrowBackRounded sx={{ fontSize: 18, mr: 0.5 }} /><Typography variant="subtitle2">Back to dashboard</Typography></ButtonBase>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={2.5}><Avatar src={photoSource} alt={`${student.fullName} profile photo`} sx={{ width: 88, height: 88, backgroundColor: 'primary.main', fontSize: 30, fontWeight: 700 }}>{initials(student.fullName)}</Avatar><Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}><Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, mb: 0.5 }}>{student.fullName}</Typography><Stack direction="row" justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" spacing={1} sx={{ mb: 1 }}><Chip label="Student" size="small" color="primary" /><Chip label={profile.user.status === 'active' ? 'Active account' : profile.user.status} size="small" sx={{ backgroundColor: 'rgba(50, 220, 136, 0.16)', color: '#32dc88' }} /></Stack><Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={0.75}><EmailOutlined sx={{ fontSize: 17, color: 'text.secondary' }} /><Typography variant="body2" color="text.secondary">{profile.user.email}</Typography></Stack></Box></Stack>
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={2}><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><ScheduleOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Last login</Typography><Typography variant="subtitle2">{lastLogin}</Typography></Box></Stack></Grid><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><ShieldOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Access level</Typography><Typography variant="subtitle2">Student portal access</Typography></Box></Stack></Grid><Grid item xs={12} sm={4}><Stack direction="row" spacing={1.25} alignItems="center"><PeopleAltOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Enrollment status</Typography><Typography variant="subtitle2">{student.status}</Typography></Box></Stack></Grid></Grid>
    </Paper>
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}><PersonOutlineRounded color="primary" /><Typography variant="h4">Personal Information</Typography></Stack>
      <Grid container spacing={2}><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Full name</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.fullName}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Username</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{profile.user.username}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Email address</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{profile.user.email}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Role</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>Student</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Admission number</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.admissionNumber}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Date of birth</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{formatDate(student.dateOfBirth)}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Gender</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.gender}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Class</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.gradeLevel} · {student.classSection}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Academic year</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.academicYear}</Typography></Grid><Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Enrollment date</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{formatDate(student.enrollmentDate)}</Typography></Grid><Grid item xs={12}><Typography variant="caption" color="text.secondary">Address</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{student.address || 'Not available'}</Typography></Grid></Grid>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" sx={{ mb: 2 }}>Guardians</Typography>{guardians.length ? <Grid container spacing={2}>{guardians.map((guardian) => <Grid item xs={12} sm={6} key={guardian.name + guardian.relationshipType}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography fontWeight={700}>{guardian.name}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{guardian.relationshipType}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{guardian.phone || guardian.email || 'No contact information'}</Typography>{guardian.address && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{guardian.address}</Typography>}</Paper></Grid>)}</Grid> : <Typography color="text.secondary">No guardian information available.</Typography>}
    </Paper>
  </Stack>
}

export default StudentProfile
