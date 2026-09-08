import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useMemo, useState } from 'react'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { getAdminPayments, type AdminPayment } from '@/services/api'

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (['Published', 'Approved', 'Active', 'Paid'].includes(status)) return 'success'
  if (['Pending', 'Draft', 'Waitlisted'].includes(status)) return 'warning'
  if (['Rejected', 'Suspended', 'Refunded', 'Failed'].includes(status)) return 'error'
  return 'default'
}

const StatusChip: FC<{ status: string }> = ({ status }) => <Chip label={status} color={statusColor(status)} size="small" />

type PaymentTypeFilter = 'All' | 'Course' | 'Class' | 'Book'

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  </Box>
)

const PaymentsPage: FC = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [paymentType, setPaymentType] = useState<PaymentTypeFilter>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadPayments = async () => {
    try {
      setPayments(await getAdminPayments())
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load payments.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
  }, [])

  const filteredPayments = useMemo(() => paymentType === 'All' ? payments : payments.filter((payment) => payment.type === paymentType), [paymentType, payments])

  const columns: DataColumn<AdminPayment>[] = [
    { key: 'student', label: 'Student' },
    { key: 'course', label: 'Item' },
    { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
  ]

  return (
    <>
      <PageHeading title="Payments" description="Review payment transactions and statuses." />
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading payments" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error">{loadError}</Typography></Paper> : <><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Payment type</InputLabel><Select label="Payment type" value={paymentType} onChange={(event) => setPaymentType(event.target.value as PaymentTypeFilter)}><MenuItem value="All">All payment types</MenuItem><MenuItem value="Course">Course</MenuItem><MenuItem value="Class">Class</MenuItem><MenuItem value="Book">Book</MenuItem></Select></FormControl></Stack><AdminDataTable key={paymentType} rows={filteredPayments} columns={columns} searchPlaceholder="Search payments" /></>}
    </>
  )
}

export default PaymentsPage
