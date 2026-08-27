import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { type FC, type ReactNode } from 'react'

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
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

const ReportsPage: FC = () => (
  <>
    <PageHeading title="Reports" description="Review platform revenue and payment performance." />
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <StatCard label="Total revenue" value="$24,680" detail="All-time collected" icon={<PaymentsOutlinedIcon />} />
      <StatCard label="Pending payments" value="$1,240" detail="12 transactions" icon={<AssessmentOutlinedIcon />} />
      <StatCard label="This month" value="$4,860" detail="18.4% increase" icon={<AssessmentOutlinedIcon />} />
    </Stack>
  </>
)

export default ReportsPage
