import { useState, type FC, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { StyledButton } from '@/components/styled-button'
import { submitCredentials } from '@/services/api'

interface SignInPageProps {
  mode: 'sign-in' | 'sign-up'
}

const SignInPage: FC<SignInPageProps> = ({ mode }) => {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      await submitCredentials(mode, String(formData.get('email')), String(formData.get('password')))
      setToastMessage(isSignUp ? 'Account created successfully.' : 'Signed in successfully.')
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Unable to complete your request.')
    }

    setToastOpen(true)
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: 'calc(100vh - 88px)', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, md: 5 } }}>
          <Typography component="h1" variant="h2" sx={{ mb: 1 }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            {isSignUp ? 'Create your Coursespace account.' : 'Welcome back to Coursespace.'}
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" />
            <TextField required fullWidth label="Password" name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} inputProps={isSignUp ? { minLength: 8 } : undefined} />
            <Box sx={{ '& button': { width: '100%', justifyContent: 'center' } }}>
              <StyledButton type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</StyledButton>
            </Box>
          </Box>
        </Paper>
      </Container>
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: '80px !important', md: '104px !important' } }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          icon={false}
          sx={{ backgroundColor: '#fff', color: '#000', '& .MuiAlert-action': { color: '#000' } }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SignInPage
