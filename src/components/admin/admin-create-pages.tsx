import { useState, type FC, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import { useNavigate } from 'react-router-dom'
import { AdminPanelLayout } from '@/components/admin/admin-dashboard'

type CreateType = 'student' | 'teacher' | 'lesson' | 'quiz'

interface FieldConfig {
  name: string
  label: string
  type?: string
  required?: boolean
  options?: string[]
  multiline?: boolean
}

const pageConfig: Record<CreateType, { title: string; description: string; fields: FieldConfig[] }> = {
  student: {
    title: 'Add Student',
    description: 'Create a student profile and assign the learner to a class.',
    fields: [
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'email', label: 'Email address', type: 'email', required: true },
      { name: 'class', label: 'Class', options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], required: true },
      { name: 'parentEmail', label: 'Parent email', type: 'email' },
    ],
  },
  teacher: {
    title: 'Add Teacher',
    description: 'Create a teacher profile and define the subjects they can manage.',
    fields: [
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'email', label: 'Email address', type: 'email', required: true },
      { name: 'subject', label: 'Primary subject', options: ['Mathematics', 'Science', 'English', 'History'], required: true },
      { name: 'phone', label: 'Phone number', type: 'tel' },
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
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
            <Grid container spacing={2.25}>
              {config.fields.map((field) => (
                <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
                  <TextField
                    fullWidth
                    required={field.required}
                    label={field.label}
                    type={field.options ? undefined : field.type || 'text'}
                    select={Boolean(field.options)}
                    multiline={field.multiline}
                    minRows={field.multiline ? 4 : undefined}
                    value={values[field.name] || ''}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  >
                    {field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
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

export const AddStudentPage: FC = () => <AdminCreatePage type="student" />
export const AddTeacherPage: FC = () => <AdminCreatePage type="teacher" />
export const CreateLessonPage: FC = () => <AdminCreatePage type="lesson" />
export const CreateQuizPage: FC = () => <AdminCreatePage type="quiz" />

export default AdminCreatePage
