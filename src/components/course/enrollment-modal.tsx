import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { type FC, type FormEvent, useEffect, useState } from 'react'
import { type AdminCourse } from '@/components/admin/admin-data'
import { completeTestPayment, createChapaCheckout, createClassChapaCheckout, getAuthenticatedUser, saveAuthenticatedUser, submitCredentials, verifyChapaPayment } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

type PaymentState = 'ready' | 'processing' | 'success' | 'failed'

interface EnrollmentModalProps {
  course: Pick<AdminCourse, 'id' | 'title' | 'price'>
  classId?: number | null
  open: boolean
  paymentReference?: string | null
  onClose: () => void
}

const steps = ['Account', 'Payment']

const EnrollmentModal: FC<EnrollmentModalProps> = ({ course, classId = null, open, paymentReference, onClose }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false)
  const [paymentState, setPaymentState] = useState<PaymentState>('ready')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [isCompletingTestPayment, setIsCompletingTestPayment] = useState(false)
  const [testCheckoutReference, setTestCheckoutReference] = useState<string | null>(null)
  const isAuthenticated = Boolean(getAuthenticatedUser())

  useEffect(() => {
    if (!open) return
    setAccountError(null)
    setPaymentError(null)
    setTestCheckoutReference(null)
    setPaymentState(paymentReference ? 'processing' : 'ready')
    setActiveStep(paymentReference || getAuthenticatedUser() ? 1 : 0)
  }, [classId, open, paymentReference])

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

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')

    if (password !== String(formData.get('confirmPassword') ?? '')) {
      setAccountError('The passwords do not match.')
      return
    }

    setAccountError(null)
    setIsSubmittingAccount(true)
    try {
      const { user } = await submitCredentials('sign-up', String(formData.get('email') ?? ''), password, {
        name: String(formData.get('fullName') ?? ''),
      })
      saveAuthenticatedUser(user)
      setActiveStep(1)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'We could not create your account.')
    } finally {
      setIsSubmittingAccount(false)
    }
  }

  const handleStartCheckout = async () => {
    setPaymentError(null)
    setIsStartingCheckout(true)
    try {
      const checkout = classId === null ? await createChapaCheckout(course.id) : await createClassChapaCheckout(classId)
      if (checkout.mode === 'test') {
        setTestCheckoutReference(checkout.paymentReference)
        return
      }
      window.location.assign(checkout.checkoutUrl)
    } catch (error) {
      setPaymentState('failed')
      setPaymentError(error instanceof Error ? error.message : 'We could not start secure checkout.')
    } finally {
      setIsStartingCheckout(false)
    }
  }

  const renderAccountStep = () => (
    <Box component="form" onSubmit={handleAccountSubmit}>
      <Stack spacing={2}>
        <TextField required fullWidth label="Full Name" name="fullName" autoComplete="name" />
        <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" />
        <TextField required fullWidth label="Password" name="password" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
        <TextField required fullWidth label="Confirm Password" name="confirmPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
        {accountError && <Alert severity="error">{accountError}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={isSubmittingAccount}>
          {isSubmittingAccount ? 'Creating account...' : 'Continue to payment'}
        </Button>
      </Stack>
    </Box>
  )

  const handleTestPayment = async (status: 'paid' | 'failed') => {
    if (!testCheckoutReference) return
    setPaymentError(null)
    setIsCompletingTestPayment(true)
    try {
      const payment = await completeTestPayment(testCheckoutReference, status)
      if (payment.status === 'paid') {
        setPaymentState('success')
      } else {
        setPaymentState('failed')
        setPaymentError('The test payment was declined. You can retry with another test result.')
      }
    } catch (error) {
      setPaymentState('failed')
      setPaymentError(error instanceof Error ? error.message : 'We could not complete the test payment.')
    } finally {
      setIsCompletingTestPayment(false)
    }
  }

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
        <Button variant="contained" size="large" onClick={() => { setPaymentState('ready'); setPaymentError(null); setTestCheckoutReference(null) }}>Retry Payment</Button>
      </Stack>
    }

    if (testCheckoutReference) {
      return <Stack spacing={3}>
        <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Test checkout</Typography>
          <Typography sx={{ mb: 1 }}>{course.title}</Typography>
          <Typography color="text.secondary">${course.price} · No money will be charged in test mode.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button fullWidth variant="contained" size="large" onClick={() => void handleTestPayment('paid')} disabled={isCompletingTestPayment}>
            {isCompletingTestPayment ? 'Processing...' : 'Approve test payment'}
          </Button>
          <Button fullWidth variant="outlined" color="error" size="large" onClick={() => void handleTestPayment('failed')} disabled={isCompletingTestPayment}>
            Decline test payment
          </Button>
        </Stack>
      </Stack>
    }

    return <Stack spacing={3}>
      <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Pay securely with Chapa</Typography>
        <Typography color="text.secondary">Test mode is enabled. Continue to the checkout simulator to approve or decline this payment without being charged.</Typography>
      </Box>
      {paymentError && <Alert severity="error">{paymentError}</Alert>}
      <Button variant="contained" size="large" onClick={() => void handleStartCheckout()} disabled={isStartingCheckout}>
        {isStartingCheckout ? 'Opening test checkout...' : 'Continue to test checkout'}
      </Button>
    </Stack>
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="enrollment-dialog-title">
    <DialogTitle id="enrollment-dialog-title" sx={{ pr: 7 }}>
      {classId === null ? 'Enroll in this course' : 'Enroll in this batch'}
      <IconButton aria-label="Close enrollment" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, index) => <Step key={label} completed={index === 0 && isAuthenticated}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      {activeStep === 0 ? renderAccountStep() : renderPaymentStep()}
    </DialogContent>
  </Dialog>
}

export default EnrollmentModal
