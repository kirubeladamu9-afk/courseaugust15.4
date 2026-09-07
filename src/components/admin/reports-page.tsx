import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { type FC, type ReactNode, useEffect, useMemo, useState } from 'react'
import { getAdminClassesWorkspace, getAdminCourses, getAdminDashboardOverview, getAdminPayments, getAdminPracticeExams, getAdminQuizViolations, getAdminTutors, getAdminUsers, type AdminDashboardOverview, type AdminPayment } from '@/services/api'

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => <Box sx={{ mb: 4 }}><Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography><Typography color="text.secondary">{description}</Typography></Box>
const StatCard: FC<{ label: string; value: string; detail: string; icon: ReactNode }> = ({ label, value, detail, icon }) => <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1, minWidth: 200 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="text.secondary" variant="body2">{label}</Typography><Box sx={{ color: 'primary.main' }}>{icon}</Box></Box><Typography variant="h4" sx={{ mb: 0.5 }}>{value}</Typography><Typography color="text.secondary" variant="body2">{detail}</Typography></Paper>

const ReportsPage: FC = () => {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [activity, setActivity] = useState({ courses: 0, classes: 0, classEnrollments: 0, tutors: 0, users: 0, quizzes: 0, violations: 0, disqualified: 0, practiceExams: 0, publishedPracticeExams: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAdminDashboardOverview(), getAdminPayments(), getAdminCourses(), getAdminClassesWorkspace(), getAdminTutors(), getAdminUsers(), getAdminQuizViolations(), getAdminPracticeExams()]).then(([dashboard, paymentRecords, courses, classes, tutors, users, violations, practiceExams]) => { setOverview(dashboard); setPayments(paymentRecords); setActivity({ courses: courses.length, classes: classes.classes.length, classEnrollments: classes.enrollments.length, tutors: tutors.length, users: users.length, quizzes: violations.length, violations: violations.reduce((total, item) => total + item.violations.length, 0), disqualified: violations.filter((item) => item.disqualified).length, practiceExams: practiceExams.length, publishedPracticeExams: practiceExams.filter((exam) => exam.published).length }) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load reports.')).finally(() => setIsLoading(false))
  }, [])

  const metrics = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'Paid')
    const pending = payments.filter((payment) => payment.status === 'Pending')
    const failed = payments.filter((payment) => payment.status === 'Failed')
    const paidRevenue = paid.reduce((total, payment) => total + payment.amount, 0)
    const pendingRevenue = pending.reduce((total, payment) => total + payment.amount, 0)
    const averagePayment = paid.length ? paidRevenue / paid.length : 0
    return { paidRevenue, pendingRevenue, pendingCount: pending.length, failedCount: failed.length, averagePayment, successRate: payments.length ? (paid.length / payments.length) * 100 : 0 }
  }, [payments])

  if (isLoading) return <><PageHeading title="Reports" description="Review platform revenue and payment performance." /><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading reports" /></Box></>
  if (error || !overview) return <><PageHeading title="Reports" description="Review platform revenue and payment performance." /><Alert severity="error">{error ?? 'Report data is unavailable.'}</Alert></>

  const currency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const maxRevenue = Math.max(1, ...overview.revenueByMonth.map((month) => month.value))

  return <><PageHeading title="Reports" description="Review revenue, learning activity, operations, and platform performance." /><Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}><StatCard label="Collected revenue" value={currency(metrics.paidRevenue)} detail={`${payments.filter((payment) => payment.status === 'Paid').length} successful payments`} icon={<PaymentsOutlinedIcon />} /><StatCard label="Pending value" value={currency(metrics.pendingRevenue)} detail={`${metrics.pendingCount} payments awaiting completion`} icon={<AssessmentOutlinedIcon />} /><StatCard label="Average payment" value={currency(metrics.averagePayment)} detail={`${metrics.successRate.toFixed(1)}% payment success rate`} icon={<AssessmentOutlinedIcon />} /><StatCard label="Active students" value={overview.activeStudents.toLocaleString()} detail={`${overview.publishedCourses} published courses`} icon={<GroupsOutlinedIcon />} /></Stack><Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', mb: 3 }}><Typography variant="h6" sx={{ mb: 0.5 }}>Platform activity</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>Coverage across learning content, people, classes, and assessment activity.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>{[['Courses', activity.courses], ['Classes', activity.classes], ['Class enrollments', activity.classEnrollments], ['Tutors', activity.tutors], ['Users', activity.users], ['Quiz records', activity.quizzes], ['Violations', activity.violations], ['Disqualified', activity.disqualified], ['Practice exams', activity.practiceExams], ['Published practice', activity.publishedPracticeExams]].map(([label, value]) => <Box key={String(label)} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'action.hover' }}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography></Box>)}</Box></Paper><Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 3 }}><Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography variant="h6" sx={{ mb: 0.5 }}>Revenue by month</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Collected payment volume from the platform overview.</Typography><Stack spacing={1.5}>{overview.revenueByMonth.map((month) => <Box key={month.label} sx={{ display: 'grid', gridTemplateColumns: '72px minmax(80px, 1fr) auto', alignItems: 'center', gap: 1.5 }}><Typography variant="body2" color="text.secondary">{month.label}</Typography><Box sx={{ height: 10, borderRadius: 5, backgroundColor: 'action.hover', overflow: 'hidden' }}><Box sx={{ height: '100%', width: `${(month.value / maxRevenue) * 100}%`, backgroundColor: 'primary.main', borderRadius: 5 }} /></Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{currency(month.value)}</Typography></Box>)}</Stack></Paper><Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', flex: 1 }}><Typography variant="h6" sx={{ mb: 0.5 }}>Platform snapshot</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Current operational totals from the database.</Typography><Stack spacing={2}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><SchoolOutlinedIcon color="primary" /><Box><Typography variant="body2" color="text.secondary">Published courses</Typography><Typography variant="h6">{overview.publishedCourses}</Typography></Box></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><GroupsOutlinedIcon color="primary" /><Box><Typography variant="body2" color="text.secondary">Active students</Typography><Typography variant="h6">{overview.activeStudents}</Typography></Box></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><AssessmentOutlinedIcon color="primary" /><Box><Typography variant="body2" color="text.secondary">Failed payments</Typography><Typography variant="h6">{metrics.failedCount}</Typography></Box></Box></Stack></Paper></Stack><Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}><Box><Typography variant="h6">Recent payments</Typography><Typography color="text.secondary" variant="body2">Latest payment activity across courses and classes.</Typography></Box><Chip label={`${payments.length} total`} variant="outlined" /></Box><Table size="small"><TableHead><TableRow><TableCell>Student</TableCell><TableCell>Item</TableCell><TableCell>Date</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{payments.slice(0, 8).map((payment) => <TableRow key={payment.id}><TableCell>{payment.student}</TableCell><TableCell>{payment.course}</TableCell><TableCell>{payment.date}</TableCell><TableCell align="right">{currency(payment.amount)}</TableCell><TableCell><Chip label={payment.status} size="small" color={payment.status === 'Paid' ? 'success' : payment.status === 'Failed' ? 'error' : 'warning'} /></TableCell></TableRow>)}{payments.length === 0 && <TableRow><TableCell colSpan={5}><Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No payment activity yet.</Typography></TableCell></TableRow>}</TableBody></Table></Paper></>
}

export default ReportsPage
