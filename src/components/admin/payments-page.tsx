import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { type FC, type ReactNode } from 'react'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { payments } from './admin-data'

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (['Published', 'Approved', 'Active', 'Paid'].includes(status)) return 'success'
  if (['Pending', 'Draft', 'Waitlisted'].includes(status)) return 'warning'
  if (['Rejected', 'Suspended', 'Refunded'].includes(status)) return 'error'
  return 'default'
}

const StatusChip: FC<{ status: string }> = ({ status }) => <Chip label={status} color={statusColor(status)} size="small" />

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

export default PaymentsPage
