import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import type { AtRiskStudent } from '@/services/api'

interface AtRiskStudentsPanelProps {
  students: AtRiskStudent[]
  loading: boolean
  error: string | null
}

const AtRiskStudentsPanel = ({ students, loading, error }: AtRiskStudentsPanelProps) => (
  <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: 1, borderRadius: 3, borderColor: students.length ? 'warning.main' : 'divider', mb: 1.5 }}>
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
      <WarningAmberOutlinedIcon color="warning" />
      <Box>
        <Typography variant="h6">At-Risk Students</Typography>
        <Typography variant="body2" color="text.secondary">Deterministic alerts from attendance, quiz, activity, and progress records.</Typography>
      </Box>
      {!loading && !error && <Chip size="small" color={students.length ? 'warning' : 'success'} label={`${students.length} flagged`} sx={{ ml: 'auto' }} />}
    </Stack>
    {loading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={20} aria-label="Loading at-risk students" /><Typography color="text.secondary">Checking student records...</Typography></Stack> : error ? <Alert severity="error">{error}</Alert> : students.length === 0 ? <Typography color="text.secondary">No students currently match the early-warning rules.</Typography> : <Stack spacing={1.25}>{students.map((student) => <Box key={student.id} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(237, 108, 2, 0.06)' }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography sx={{ fontWeight: 700 }}>{student.studentName}</Typography><Typography variant="body2" color="text.secondary">{student.studentEmail} · {student.classTitle ?? student.courseTitle ?? 'Active enrollment'}</Typography></Box><Typography variant="body2" color="text.secondary">Progress {student.progressPercentage}%</Typography></Stack><Typography variant="body2" sx={{ mt: 0.75, color: 'warning.dark' }}>{student.reasons.join(' · ')}</Typography></Box>)}</Stack>}
  </Paper>
)

export default AtRiskStudentsPanel
