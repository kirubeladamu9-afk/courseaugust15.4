import { useEffect, useState, type FC, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminPanelLayout } from '@/components/admin/admin-dashboard'
import api from '@/lib/api'

type CreateType = 'student' | 'teacher' | 'lesson' | 'quiz'

interface FieldConfig {
  name: string
  label: string
  type?: string
  required?: boolean
  options?: string[]
  multiline?: boolean
  multiple?: boolean
}

interface Guardian {
  id: string
  name: string
  email?: string | null
}

const pageConfig: Record<CreateType, { title: string; description: string; fields: FieldConfig[] }> = {
  student: {
    title: 'Add Student',
    description: 'Create a complete student profile, assign academic placement, and link at least one guardian.',
    fields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true },
      { name: 'admissionNumber', label: 'Student ID / Admission number', required: true },
      { name: 'photo', label: 'Student photo', type: 'file' },
      { name: 'academicYear', label: 'Academic year', options: ['2025/2026', '2026/2027'], required: true },
      { name: 'gradeLevel', label: 'Grade level', options: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'], required: true },
      { name: 'classSection', label: 'Class & section', options: ['Grade 5 - A', 'Grade 5 - B', 'Grade 6 - A', 'Grade 6 - B'], required: true },
      { name: 'enrollmentDate', label: 'Enrollment date', type: 'date', required: true },
      { name: 'address', label: 'Address' },
      { name: 'existingGuardian', label: 'Search existing guardian' },
      { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'Pending'], required: true },
    ],
  },
  teacher: {
    title: 'Add Teacher',
    description: 'Create a teacher profile and assign subjects and classes.',
    fields: [
      { name: 'fullName', label: 'Full Name', required: true },
      { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true },
      { name: 'photoName', label: 'Teacher photo', type: 'file' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel' },
      { name: 'address', label: 'Address' },
      { name: 'nationalId', label: 'National ID / Passport Number' },
      { name: 'assignedSubjects', label: 'Assigned Subjects', multiple: true },
      { name: 'assignedClasses', label: 'Assigned Classes', multiple: true },
      { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'On Leave'], required: true },
    ],
  },
  lesson: {
    title: 'Create Lesson',
    description: 'Publish a lesson with its subject, chapter, and learning objectives.',
    fields: [
      { name: 'title', label: 'Lesson title', required: true },
      { name: 'subject', label: 'Subject', options: ['Mathematics', 'Science', 'English', 'History'], required: true },
      { name: 'chapter', label: 'Chapter', required: true },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', required: true },
      { name: 'description', label: 'Lesson description', multiline: true, required: true },
    ],
  },
  quiz: {
    title: 'Create Quiz',
    description: 'Set up a quiz and configure its subject, grade, and time limit.',
    fields: [
      { name: 'title', label: 'Quiz title', required: true },
      { name: 'subject', label: 'Subject', options: ['Mathematics', 'Science', 'English', 'History'], required: true },
      { name: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], required: true },
      { name: 'duration', label: 'Time limit (minutes)', type: 'number', required: true },
      { name: 'instructions', label: 'Instructions', multiline: true },
    ],
  },
}

const AdminCreatePage: FC<{ type: CreateType }> = ({ type }) => {
  const navigate = useNavigate()
  const config = pageConfig[type]
  const listRoutes: Record<CreateType, string> = { student: '/admin/students', teacher: '/admin/teachers', lesson: '/admin/lessons', quiz: '/admin/quizzes' }
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [guardianMatches, setGuardianMatches] = useState<Guardian[]>([])
  const [guardianFormPrompt, setGuardianFormPrompt] = useState(false)
  const [guardianFormOpen, setGuardianFormOpen] = useState(false)
  const [guardianForm, setGuardianForm] = useState({ name: '', email: '', relationshipType: 'Guardian', phone: '', address: '', occupation: '', nationalId: '', photoName: '' })
  const [academicOptions, setAcademicOptions] = useState({ gradeLevel: [] as string[], classSection: [] as { name: string; gradeLevel: string }[] })
  const [teacherOptions, setTeacherOptions] = useState({ subjects: [] as { id: string; name: string }[], classes: [] as { id: string; name: string }[] })

  useEffect(() => {
    if (type !== 'teacher') return
    Promise.all([
      api.get<{ records: { id: string; title: string }[] }>('/api/admin/subjects', { withCredentials: true }),
      api.get<{ records: { id: string; title: string }[] }>('/api/admin/classes-sections', { withCredentials: true }),
    ])
      .then(([subjectsResponse, classesResponse]) => setTeacherOptions({ subjects: subjectsResponse.data.records.map(({ id, title }) => ({ id, name: title })), classes: classesResponse.data.records.map(({ id, title }) => ({ id, name: title })) }))
      .catch(() => setValidationError('Unable to load subjects and classes. Please try again.'))
  }, [type])

  useEffect(() => {
    if (type !== 'student') return
    Promise.all([
      api.get<{ records: { data: { Grade: string } }[] }>('/api/admin/grade-levels', { withCredentials: true }),
      api.get<{ records: { data: { 'Class / Section': string; 'Grade Level': string } }[] }>('/api/admin/classes-sections', { withCredentials: true }),
    ])
      .then(([gradeResponse, classResponse]) => setAcademicOptions({
        gradeLevel: gradeResponse.data.records.map(({ data }) => data.Grade),
        classSection: classResponse.data.records.map(({ data }) => ({ name: data['Class / Section'], gradeLevel: data['Grade Level'] })),
      }))
      .catch(() => setValidationError('Unable to load grade levels and classes. Please try again.'))
  }, [type])

  useEffect(() => {
    if (!saved) return
    const redirectTimer = window.setTimeout(() => navigate(listRoutes[type]), 800)
    return () => window.clearTimeout(redirectTimer)
  }, [saved, type, navigate])

  const searchGuardians = async () => {
    const query = values.existingGuardian?.trim()
    if (!query) {
      setValidationError('Enter a guardian name or email to search.')
      return
    }
    try {
      const { data } = await api.get<{ guardians: Guardian[] }>(`/api/admin/guardians/search?q=${encodeURIComponent(query)}`, { withCredentials: true })
      setGuardianMatches(data.guardians)
      setGuardianFormPrompt(data.guardians.length === 0)
      setGuardianFormOpen(false)
      setValidationError(data.guardians.length === 0 ? 'No guardian found. Add a new guardian to continue.' : '')
    } catch {
      setValidationError('Unable to search guardians. Please try again.')
    }
  }

  const createGuardian = async () => {
    try {
      const { data } = await api.post<{ guardian: Guardian }>('/api/admin/guardians', guardianForm, { withCredentials: true })
      setValues((current) => ({ ...current, existingGuardian: data.guardian.email || data.guardian.name }))
      setGuardianMatches([data.guardian])
      setGuardianFormPrompt(false)
      setGuardianFormOpen(false)
      setValidationError('')
    } catch {
      setValidationError('Unable to add guardian. Check the name and email address.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (type === 'student' && !values.existingGuardian?.trim()) {
      setValidationError('Search for an existing guardian before saving.')
      return
    }
    setValidationError('')
    if (type === 'student') {
      try {
        await api.post('/api/admin/students', { ...values, guardianSearch: values.existingGuardian, relationshipType: guardianForm.relationshipType, photoName: values.photo }, { withCredentials: true })
        setSaved(true)
      } catch {
        setValidationError('Unable to save the student. Check the details and guardian search, then try again.')
      }
      return
    }
    if (type === 'teacher') {
      try {
        await api.post('/api/admin/teachers', values, { withCredentials: true })
        setSaved(true)
      } catch {
        setValidationError('Unable to save the teacher. Check the details and assignments, then try again.')
      }
      return
    }
    setSaved(true)
  }

  return (
    <AdminPanelLayout title={config.title}>
      <Box component="main" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ maxWidth: 920, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Admin</Typography>
            <Typography variant="subtitle2" color="primary.main">{config.title}</Typography>
          </Breadcrumbs>
          <Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/admin')} sx={{ mb: 3, px: 0 }}>
            Back to dashboard
          </Button>
          <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
            <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, md: 32 }, mb: 0.75 }}>{config.title}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{config.description}</Typography>
            {saved && <Alert severity="success" onClose={() => setSaved(false)} sx={{ mb: 3 }}>The form was saved successfully.</Alert>}
            {validationError && <Alert severity="error" onClose={() => setValidationError('')} sx={{ mb: 3 }}>{validationError}</Alert>}
            <Grid container spacing={2.25}>
              {config.fields.map((field) => (
                <Grid item xs={12} sm={field.multiline || field.name === 'existingGuardian' ? 12 : 6} key={field.name}>
                  {field.multiple ? <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{field.label}</Typography>
                    <FormGroup row>
                      {(field.name === 'assignedSubjects' ? teacherOptions.subjects : teacherOptions.classes).map((option) => {
                        const selected = (values[field.name] || '').split(', ').filter(Boolean).includes(option.name)
                        return <FormControlLabel key={option.id} control={<Checkbox checked={selected} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked ? [...(current[field.name] || '').split(', ').filter(Boolean), option.name].join(', ') : (current[field.name] || '').split(', ').filter((value) => value !== option.name).join(', ') }))} />} label={option.name} />
                      })}
                    </FormGroup>
                  </Box> : <TextField
                    fullWidth
                    required={field.required}
                    label={field.label}
                    type={field.options || field.name === 'gradeLevel' || field.name === 'classSection' ? undefined : field.type || 'text'}
                    select={Boolean(field.options || field.name === 'gradeLevel' || field.name === 'classSection')}
                    multiline={field.multiline}
                    minRows={field.multiline ? 4 : undefined}
                    InputLabelProps={field.type === 'date' || field.type === 'file' ? { shrink: true } : undefined}
                    value={field.type === 'file' ? undefined : values[field.name] || ''}
                    inputProps={field.type === 'file' ? { accept: 'image/*' } : undefined}
                    onChange={(event) => {
                      const input = event.target as HTMLInputElement
                      const file = input.files?.[0]
                      if (field.type === 'file' && file) {
                        const reader = new FileReader()
                        reader.onload = () => setValues((current) => ({ ...current, [field.name]: String(reader.result || '') }))
                        reader.readAsDataURL(file)
                        return
                      }
                      setValues((current) => ({ ...current, [field.name]: event.target.value, ...(field.name === 'gradeLevel' ? { classSection: '' } : {}) }))
                    }}
                  >
                    {(field.name === 'gradeLevel' ? academicOptions.gradeLevel : field.name === 'classSection' ? academicOptions.classSection.filter(({ gradeLevel }) => gradeLevel === values.gradeLevel) : field.options)?.map((option) => <MenuItem key={typeof option === 'string' ? option : option.name} value={typeof option === 'string' ? option : option.name}>{typeof option === 'string' ? option : option.name}</MenuItem>)}
                  </TextField>}
                  {type === 'student' && field.name === 'existingGuardian' && <Stack spacing={1} sx={{ mt: 1 }}>
                    <Button type="button" variant="outlined" size="small" onClick={searchGuardians}>Search Guardian</Button>
                    {guardianMatches.map((guardian) => <Button key={guardian.id} type="button" onClick={() => setValues((current) => ({ ...current, existingGuardian: guardian.email || guardian.name }))} sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 1 }}>
                      {guardian.name} · {guardian.email || 'No email'}
                    </Button>)}
                    {guardianFormPrompt && !guardianFormOpen && <Button type="button" variant="outlined" size="small" onClick={() => setGuardianFormOpen(true)}>Add New Guardian</Button>}
                    {guardianFormOpen && <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Guardian</Typography>
                      <Grid container spacing={1.25}>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Full name" required value={guardianForm.name} onChange={(event) => setGuardianForm((current) => ({ ...current, name: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Email address" type="email" value={guardianForm.email} onChange={(event) => setGuardianForm((current) => ({ ...current, email: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Relationship to student" select required value={guardianForm.relationshipType} onChange={(event) => setGuardianForm((current) => ({ ...current, relationshipType: event.target.value }))}>{['Mother', 'Father', 'Guardian', 'Emergency Contact'].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone number" value={guardianForm.phone} onChange={(event) => setGuardianForm((current) => ({ ...current, phone: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Address" value={guardianForm.address} onChange={(event) => setGuardianForm((current) => ({ ...current, address: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Occupation" value={guardianForm.occupation} onChange={(event) => setGuardianForm((current) => ({ ...current, occupation: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="National ID / Passport number" value={guardianForm.nationalId} onChange={(event) => setGuardianForm((current) => ({ ...current, nationalId: event.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Photo" type="file" InputLabelProps={{ shrink: true }} onChange={(event) => setGuardianForm((current) => ({ ...current, photoName: (event.target as HTMLInputElement).files?.[0]?.name || '' }))} /></Grid>
                        <Grid item xs={12}><Button type="button" variant="contained" size="small" onClick={createGuardian}>Save Guardian</Button></Grid>
                      </Grid>
                    </Paper>}
                  </Stack>}
                </Grid>
              ))}
            </Grid>
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1.5} sx={{ mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate('/admin')}>Cancel</Button>
              <Button type="submit" variant="contained" startIcon={<SaveOutlined />}>Save {type}</Button>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </AdminPanelLayout>
  )
}

type EditableProfileType = 'student' | 'teacher' | 'guardian'

const profileFields: Record<EditableProfileType, FieldConfig[]> = {
  student: [
    { name: 'fullName', label: 'Full name', required: true },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
    { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true },
    { name: 'admissionNumber', label: 'Student ID / Admission number', required: true },
    { name: 'photoName', label: 'Student photo filename' },
    { name: 'academicYear', label: 'Academic year', required: true },
    { name: 'gradeLevel', label: 'Grade level', required: true },
    { name: 'classSection', label: 'Class & section', required: true },
    { name: 'enrollmentDate', label: 'Enrollment date', type: 'date', required: true },
    { name: 'address', label: 'Address' },
    { name: 'guardianSearch', label: 'Guardian name or email', required: true },
    { name: 'relationshipType', label: 'Relationship to student', options: ['Mother', 'Father', 'Guardian', 'Emergency Contact'], required: true },
    { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'Pending'], required: true },
  ],
  teacher: [
    { name: 'fullName', label: 'Full name', required: true },
    { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true },
    { name: 'photoName', label: 'Teacher photo', type: 'file' },
    { name: 'phoneNumber', label: 'Phone number', type: 'tel' },
    { name: 'address', label: 'Address' },
    { name: 'nationalId', label: 'National ID / Passport Number' },
    { name: 'assignedSubjects', label: 'Assigned subjects' },
    { name: 'assignedClasses', label: 'Assigned classes' },
    { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'On Leave'], required: true },
  ],
  guardian: [
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email address', type: 'email' },
    { name: 'phone', label: 'Phone number', type: 'tel' },
    { name: 'address', label: 'Address' },
    { name: 'occupation', label: 'Occupation' },
    { name: 'nationalId', label: 'National ID / Passport Number' },
    { name: 'photoName', label: 'Photo filename' },
  ],
}

const AdminEditProfilePage: FC<{ type: EditableProfileType }> = ({ type }) => {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const listRoute = `/admin/${type === 'guardian' ? 'guardians' : `${type}s`}`
  const imageSource = typeof values.photoName === 'string' && (values.photoName.startsWith('data:image/') || values.photoName.startsWith('https://')) ? values.photoName : ''
  const title = `Edit ${type.charAt(0).toUpperCase()}${type.slice(1)}`

  useEffect(() => {
    api.get<{ student?: Record<string, unknown>; teacher?: Record<string, unknown>; guardian?: Record<string, unknown> }>(`/api/admin/${type === 'guardian' ? 'guardians' : `${type}s`}/${id}`, { withCredentials: true })
      .then(({ data }) => {
        const profile = data[type] || {}
        const dateValue = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : ''
        if (type === 'student') {
          const links = profile.guardianLinks as { guardian: { name: string; email?: string | null }; relationshipType: string }[] | undefined
          const linkedGuardian = links?.[0]
          setValues({ ...Object.fromEntries(profileFields.student.map(({ name }) => [name, String(profile[name] || '')])), dateOfBirth: dateValue(profile.dateOfBirth), enrollmentDate: dateValue(profile.enrollmentDate), guardianSearch: linkedGuardian?.guardian.email || linkedGuardian?.guardian.name || '', relationshipType: linkedGuardian?.relationshipType || 'Guardian' })
          return
        }
        setValues(Object.fromEntries(profileFields[type].map(({ name }) => [name, String(profile[name] || '')])))
      })
      .catch(() => setError(`Unable to load this ${type} profile.`))
      .finally(() => setLoading(false))
  }, [id, type])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch(`/api/admin/${type === 'guardian' ? 'guardians' : `${type}s`}/${id}`, values, { withCredentials: true })
      navigate(listRoute)
    } catch (requestError) {
      setError(`Unable to update this ${type}. Check the details and try again.`)
    } finally {
      setSaving(false)
    }
  }

  return <AdminPanelLayout title={title}>
    <Box component="main" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 920, mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Breadcrumbs sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="text.secondary">{type === 'guardian' ? 'Guardian List' : `${type.charAt(0).toUpperCase()}${type.slice(1)} List`}</Typography><Typography variant="subtitle2" color="primary.main">{title}</Typography></Breadcrumbs>
        <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(listRoute)} sx={{ mb: 3, px: 0 }}>Back to list</Button>
        <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, md: 32 }, mb: 0.75 }}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Review and update the complete profile information.</Typography>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}
          <Grid container spacing={2.25}>
            {profileFields[type].map((field) => <Grid item xs={12} sm={field.name === 'address' || field.name === 'assignedSubjects' || field.name === 'assignedClasses' || field.name === 'guardianSearch' ? 12 : 6} key={field.name}>
              <TextField fullWidth required={field.required} disabled={loading || saving} label={field.label} type={field.options ? undefined : field.type || 'text'} select={Boolean(field.options)} InputLabelProps={field.type === 'date' || field.type === 'file' ? { shrink: true } : undefined} value={field.type === 'file' ? undefined : values[field.name] || ''} inputProps={field.type === 'file' ? { accept: 'image/*' } : undefined} onChange={(event) => {
                const input = event.target as HTMLInputElement
                const file = input.files?.[0]
                if (field.type === 'file' && file) {
                  const reader = new FileReader()
                  reader.onload = () => setValues((current) => ({ ...current, [field.name]: String(reader.result || '') }))
                  reader.readAsDataURL(file)
                  return
                }
                setValues((current) => ({ ...current, [field.name]: event.target.value }))
              }}>
                {field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </TextField>
              {type === 'teacher' && field.name === 'photoName' && <Box sx={{ mt: 1, width: 128, height: 128, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', backgroundColor: 'background.default' }}>{imageSource ? <Box component="img" src={imageSource} alt="Teacher profile" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 1 }}>No image available</Typography>}</Box>}
            </Grid>)}
          </Grid>
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1.5} sx={{ mt: 4 }}>
            <Button variant="outlined" disabled={saving} onClick={() => navigate(listRoute)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading || saving} startIcon={<SaveOutlined />}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  </AdminPanelLayout>
}

export const AddStudentPage: FC = () => <AdminCreatePage type="student" />
export const EditStudentPage: FC = () => <AdminEditProfilePage type="student" />
export const EditTeacherPage: FC = () => <AdminEditProfilePage type="teacher" />
export const EditGuardianPage: FC = () => <AdminEditProfilePage type="guardian" />
export const AddTeacherPage: FC = () => <AdminCreatePage type="teacher" />
export const CreateLessonPage: FC = () => <AdminCreatePage type="lesson" />
export const CreateQuizPage: FC = () => <AdminCreatePage type="quiz" />

export default AdminCreatePage
