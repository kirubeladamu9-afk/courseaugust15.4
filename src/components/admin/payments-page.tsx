import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { type FC } from 'react'
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
      <PageHeading title="Payments" description="Review payment transactions and statuses." />
      <AdminDataTable rows={payments} columns={columns} searchPlaceholder="Search payments" />
    </>
  )
}

export default PaymentsPage
