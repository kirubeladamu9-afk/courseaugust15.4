import { useState, type FC, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { StyledButton } from '@/components/styled-button'
import { navigateTo } from '@/lib/navigation'
import { toast } from '@/components/toast'
import { saveAuthenticatedUser, submitCredentials } from '@/services/api'

interface SignInPageProps {
  mode: 'sign-in' | 'sign-up'
}

const SignInPage: FC<SignInPageProps> = ({ mode }) => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const { user } = await submitCredentials(mode, String(formData.get('email')), String(formData.get('password')))
      if (!isSignUp) {
        saveAuthenticatedUser(user)
        setIsRedirecting(true)
        window.setTimeout(() => navigateTo(user.role === 'admin' ? '/admin' : '/'), 400)
        return
      }
      toast.add({
        title: 'Account created',
        description: 'You can now sign in to Coursespace.',
        type: 'success',
      })
    } catch (error) {
      toast.add({
        title: 'Unable to complete your request',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
        priority: 'high',
      })
    }
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: 'calc(100vh - 88px)', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, md: 5 } }}>
          {isRedirecting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }} aria-live="polite">
              <CircularProgress aria-label="Signing in" />
              <Typography>Signing you in...</Typography>
            </Box>
          ) : (
            <>
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
                {!isSignUp && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Admin User</Typography>
                      <Typography variant="caption" color="text.secondary">admin@coursespace.com</Typography>
                    </Box>
                    <Typography variant="caption" color="primary.main">Administrator</Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default SignInPage
