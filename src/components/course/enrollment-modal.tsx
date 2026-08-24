import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { type FC, type FormEvent, useEffect, useState } from 'react'
import { type AdminCourse } from '@/components/admin/admin-data'
import { createChapaCheckout, getAuthenticatedUser, getSavedStudents, saveAuthenticatedUser, submitCredentials, type EnrollmentStudent, type SavedStudent, verifyChapaPayment } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

type AccountMode = 'create' | 'login'
type PaymentState = 'ready' | 'processing' | 'success' | 'failed'

type Student = {
  fullName: string
  ageOrGrade: string
  relationship: 'Parent' | 'Guardian' | 'Self' | ''
  preferredLanguage: string
  emergencyPhone: string
  notes: string
}

interface EnrollmentModalProps {
  course: AdminCourse
  open: boolean
  paymentReference?: string | null
  onClose: () => void
}

const steps = ['Account', 'Student Info', 'Summary', 'Payment']

const emptyStudent = (): Student => ({
  fullName: '',
  ageOrGrade: '',
  relationship: '',
  preferredLanguage: '',
  emergencyPhone: '',
  notes: '',
})

const formatPrice = (price: number) => `$${price.toFixed(2)}`

const EnrollmentModal: FC<EnrollmentModalProps> = ({ course, open, paymentReference, onClose }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [accountMode, setAccountMode] = useState<AccountMode>('create')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false)
  const [students, setStudents] = useState<Student[]>([emptyStudent()])
  const [savedStudents, setSavedStudents] = useState<SavedStudent[]>([])
  const [selectedSavedStudentId, setSelectedSavedStudentId] = useState('')
  const [paymentState, setPaymentState] = useState<PaymentState>('ready')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)

  const currentUser = getAuthenticatedUser()
  const totalPrice = course.price * students.length

  useEffect(() => {
    if (!open) return
    setAccountError(null)
    setPaymentError(null)
    setSelectedSavedStudentId('')
    setPaymentState(paymentReference ? 'processing' : 'ready')
    setActiveStep(paymentReference ? 3 : getAuthenticatedUser() ? 1 : 0)
  }, [open, paymentReference])

  useEffect(() => {
    if (!open || activeStep !== 1 || !getAuthenticatedUser()) return
    void getSavedStudents().then(setSavedStudents).catch(() => setSavedStudents([]))
  }, [activeStep, open])

  useEffect(() => {
    if (!open || !paymentReference || paymentState !== 'processing') return

    let isCurrent = true
    const checkPayment = async () => {
      try {
        const payment = await verifyChapaPayment(paymentReference)
        if (!isCurrent) return
        if (payment.status === 'paid') {
          setPaymentState('success')
          return
        }
        if (payment.status === 'failed') {
          setPaymentState('failed')
          setPaymentError('Chapa was unable to complete this payment. Please try again.')
          return
        }
        window.setTimeout(checkPayment, 3000)
      } catch (error) {
        if (!isCurrent) return
        setPaymentState('failed')
        setPaymentError(error instanceof Error ? error.message : 'We could not confirm the payment status.')
      }
    }

    void checkPayment()
    return () => {
      isCurrent = false
    }
  }, [open, paymentReference, paymentState])

  const updateStudent = <Field extends keyof Student>(index: number, field: Field, value: Student[Field]) => {
    setStudents((currentStudents) => currentStudents.map((student, studentIndex) => studentIndex === index ? { ...student, [field]: value } : student))
  }

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    if (accountMode === 'create' && password !== String(formData.get('confirmPassword') ?? '')) {
      setAccountError('The passwords do not match.')
      return
    }

    setAccountError(null)
    setIsSubmittingAccount(true)
    try {
      const { user } = await submitCredentials(
        accountMode === 'create' ? 'sign-up' : 'sign-in',
        email,
        password,
        accountMode === 'create' ? {
          name: String(formData.get('fullName') ?? ''),
          phone: String(formData.get('phone') ?? ''),
        } : undefined,
      )
      saveAuthenticatedUser(user)
      setActiveStep(1)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'We could not complete your request.')
    } finally {
      setIsSubmittingAccount(false)
    }
  }

  const handleStudentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveStep(2)
  }

  const handleStartCheckout = async () => {
    setPaymentError(null)
    setIsStartingCheckout(true)
    try {
      const { checkoutUrl } = await createChapaCheckout(course.id, students as EnrollmentStudent[])
      window.location.assign(checkoutUrl)
    } catch (error) {
      setPaymentState('failed')
      setPaymentError(error instanceof Error ? error.message : 'We could not start secure checkout.')
    } finally {
      setIsStartingCheckout(false)
    }
  }

  const renderAccountStep = () => (
    <Box component="form" onSubmit={handleAccountSubmit}>
      <Tabs value={accountMode} onChange={(_event, value: AccountMode) => { setAccountMode(value); setAccountError(null) }} aria-label="Enrollment account options" sx={{ mb: 3 }}>
        <Tab label="Create account" value="create" />
        <Tab label="Log in" value="login" />
      </Tabs>
      <Stack spacing={2}>
        {accountMode === 'create' && <>
          <TextField required fullWidth label="Full Name" name="fullName" autoComplete="name" />
          <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" />
          <TextField required fullWidth label="Phone" name="phone" type="tel" autoComplete="tel" />
          <TextField required fullWidth label="Password" name="password" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
          <TextField required fullWidth label="Confirm Password" name="confirmPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
          <FormControlLabel required control={<Checkbox name="terms" required />} label="I agree to the Terms of Service and Privacy Policy" />
        </>}
        {accountMode === 'login' && <>
          <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" />
          <TextField required fullWidth label="Password" name="password" type="password" autoComplete="current-password" />
        </>}
        {accountError && <Alert severity="error">{accountError}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={isSubmittingAccount}>
          {isSubmittingAccount ? 'Continuing...' : accountMode === 'create' ? 'Create account and continue' : 'Log in and continue'}
        </Button>
      </Stack>
    </Box>
  )

  const renderStudentStep = () => (
    <Box component="form" onSubmit={handleStudentSubmit}>
      <Stack spacing={3}>
        {savedStudents.length > 0 && <TextField select fullWidth label="Use a saved student" value={selectedSavedStudentId} onChange={(event) => {
          setSelectedSavedStudentId(event.target.value)
          const savedStudent = savedStudents.find((student) => student.id === Number(event.target.value))
          setStudents(savedStudent ? [{
            fullName: savedStudent.fullName,
            ageOrGrade: savedStudent.ageOrGrade,
            relationship: savedStudent.relationship,
            preferredLanguage: savedStudent.preferredLanguage,
            emergencyPhone: savedStudent.emergencyPhone ?? '',
            notes: savedStudent.notes ?? '',
          }] : [emptyStudent()])
        }} helperText="Choose a saved student to fill in their details.">
          <MenuItem value="">Enter student details</MenuItem>
          {savedStudents.map((student) => <MenuItem key={student.id} value={student.id}>{student.fullName}</MenuItem>)}
        </TextField>}
        {students.map((student, index) => (
          <Stack key={index} spacing={2}>
            {students.length > 1 && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Student {index + 1}</Typography>}
            <TextField required fullWidth label="Student's Full Name" value={student.fullName} onChange={(event) => updateStudent(index, 'fullName', event.target.value)} autoComplete="name" />
            <TextField required fullWidth label="Age or Grade" value={student.ageOrGrade} onChange={(event) => updateStudent(index, 'ageOrGrade', event.target.value)} />
            <TextField required select fullWidth label="Relationship" value={student.relationship} onChange={(event) => updateStudent(index, 'relationship', event.target.value as Student['relationship'])}>
              <MenuItem value="Parent">Parent</MenuItem>
              <MenuItem value="Guardian">Guardian</MenuItem>
              <MenuItem value="Self">Self</MenuItem>
            </TextField>
            <TextField required fullWidth label="Preferred Language" value={student.preferredLanguage} onChange={(event) => updateStudent(index, 'preferredLanguage', event.target.value)} />
            <TextField fullWidth label="Emergency Phone (optional)" value={student.emergencyPhone} onChange={(event) => updateStudent(index, 'emergencyPhone', event.target.value)} type="tel" autoComplete="tel" />
            <TextField fullWidth label="Notes (optional)" value={student.notes} onChange={(event) => updateStudent(index, 'notes', event.target.value)} multiline minRows={3} />
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} variant="text" onClick={() => setStudents((currentStudents) => [...currentStudents, emptyStudent()])} sx={{ alignSelf: 'flex-start' }}>
          Add another student
        </Button>
        <Button type="submit" variant="contained" size="large">Continue to summary</Button>
      </Stack>
    </Box>
  )

  const renderSummaryStep = () => (
    <Stack spacing={3}>
      <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{course.title}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography color="text.secondary">{students.length} student{students.length === 1 ? '' : 's'}</Typography>
            <Typography>{formatPrice(course.price)} each</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography color="text.secondary">Discount</Typography>
            <Typography>$0.00</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatPrice(totalPrice)}</Typography>
          </Box>
        </Stack>
      </Box>
      <Button variant="contained" size="large" onClick={() => setActiveStep(3)}>Proceed to Payment</Button>
    </Stack>
  )

  const renderPaymentStep = () => {
    if (paymentState === 'processing') {
      return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 5, textAlign: 'center' }} aria-live="polite">
        <CircularProgress aria-label="Confirming payment" />
        <Box>
          <Typography variant="h5" sx={{ mb: 0.75 }}>Payment Processing...</Typography>
          <Typography color="text.secondary">We are securely confirming your payment with Chapa.</Typography>
        </Box>
      </Box>
    }

    if (paymentState === 'success') {
      return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 4, textAlign: 'center' }} aria-live="polite">
        <Typography variant="h4">Payment Successful</Typography>
        <Typography color="text.secondary">Your enrollment is ready. You can now begin learning.</Typography>
        <Button variant="contained" size="large" onClick={() => navigateTo('/dashboard')}>Go to Dashboard</Button>
      </Box>
    }

    if (paymentState === 'failed') {
      return <Stack spacing={2.5} sx={{ py: 2 }} aria-live="polite">
        <Alert severity="error">{paymentError ?? 'Payment Failed'}</Alert>
        <Button variant="contained" size="large" onClick={() => { setPaymentState('ready'); setPaymentError(null) }}>Retry Payment</Button>
      </Stack>
    }

    return <Stack spacing={3}>
      <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Pay securely with Chapa</Typography>
        <Typography color="text.secondary">You will choose Telebirr, CBE Birr, card, or another supported payment method on Chapa’s hosted checkout page.</Typography>
      </Box>
      {paymentError && <Alert severity="error">{paymentError}</Alert>}
      <Button variant="contained" size="large" onClick={() => void handleStartCheckout()} disabled={isStartingCheckout}>
        {isStartingCheckout ? 'Opening secure checkout...' : 'Continue to Chapa'}
      </Button>
    </Stack>
  }

  const content = activeStep === 0 ? renderAccountStep() : activeStep === 1 ? renderStudentStep() : activeStep === 2 ? renderSummaryStep() : renderPaymentStep()

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="enrollment-dialog-title">
    <DialogTitle id="enrollment-dialog-title" sx={{ pr: 7 }}>
      Enroll in this course
      <IconButton aria-label="Close enrollment" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, index) => <Step key={label} completed={index === 0 && Boolean(currentUser)}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      {content}
    </DialogContent>
  </Dialog>
}

export default EnrollmentModal
