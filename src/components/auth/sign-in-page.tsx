import { useState, type FC, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { StyledButton } from '@/components/styled-button'
import { navigateTo } from '@/lib/navigation'
import { toast } from '@/components/toast'
import { saveAuthenticatedUser, submitCredentials } from '@/services/api'

interface SignInPageProps {
  mode: 'sign-in' | 'sign-up'
}

const SignInPage: FC<SignInPageProps> = ({ mode }) => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const { user } = await submitCredentials(mode, String(formData.get('email')), String(formData.get('password')))
      if (!isSignUp) {
        saveAuthenticatedUser(user)
        setIsRedirecting(true)
        window.setTimeout(() => navigateTo(user.role === 'admin' ? '/admin' : user.role === 'tutor' ? '/tutor' : '/dashboard'), 400)
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

  return <Box sx={{ background: 'var(--app-auth-backdrop)', backgroundColor: 'background.default', minHeight: 'calc(100vh - 88px)', py: { xs: 4, md: 8 } }}>
    <Container maxWidth="lg">
      <Paper elevation={8} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }, maxWidth: 1080, minHeight: { md: 620 }, mx: 'auto', overflow: 'hidden', borderRadius: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: { xs: 3.5, md: 5 }, color: 'common.white', background: 'var(--app-auth-panel)', minHeight: { xs: 320, md: '100%' } }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'rgba(255,255,255,0.72)' }}>Coursespace learning platform</Typography>
            <Typography component="h2" sx={{ mt: { xs: 7, md: 13 }, fontSize: { xs: '2.7rem', md: '4rem' }, lineHeight: 0.98, letterSpacing: '-0.06em', fontWeight: 700 }}>
              Learn with
              <br />
              confidence.
            </Typography>
            <Typography sx={{ mt: 3, maxWidth: 330, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
              Build practical skills with focused courses, supportive tutors, and relaxed practice that keeps you moving forward.
            </Typography>
          </Box>
          <Box component="img" src="/images/home-hero.png" alt="Learner studying with Coursespace" sx={{ display: 'block', width: '100%', maxHeight: 260, mt: 4, objectFit: 'contain', objectPosition: 'bottom' }} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: { xs: 3.5, sm: 5, md: 7 }, backgroundColor: 'background.paper' }}>
          {isRedirecting ? (
            <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} aria-live="polite">
              <CircularProgress aria-label="Signing in" />
              <Typography>Signing you in...</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: { xs: 7, md: 12 } }}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, '& span': { color: 'primary.main' } }}>Course<span>space</span></Typography>
                <Typography variant="body2" color="text.secondary">{isSignUp ? 'Already learning with us?' : 'Secure account access'}</Typography>
              </Box>
              <Box sx={{ maxWidth: 430, width: '100%', mx: 'auto', flex: 1 }}>
                <Typography component="h1" variant="h2" sx={{ mb: 1, fontSize: { xs: '2.5rem', md: '3.25rem' }, letterSpacing: '-0.05em' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>{isSignUp ? 'Create your Coursespace account.' : 'Welcome back to Coursespace.'}</Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }} />
                  <TextField
                    required
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    inputProps={isSignUp ? { minLength: 8 } : undefined}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="button" onClick={() => setShowPassword((visible) => !visible)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {!isSignUp && <Typography variant="body2" sx={{ mt: -0.75, color: 'text.secondary' }}>
                    Forgot your password? <Link href="mailto:support@coursespace.com" underline="hover">Contact support@coursespace.com</Link> for help.
                  </Typography>}
                  <Box sx={{ mt: 1, '& button': { width: '100%', justifyContent: 'center', borderRadius: 999, py: 1.4 } }}>
                    <StyledButton type="submit" color="primary">{isSignUp ? 'Sign Up' : 'Sign In'}</StyledButton>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: { xs: 7, md: 10 } }}>
                <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} Coursespace</Typography>
                <Link href="/contact-us" underline="hover" variant="caption" color="text.secondary">Contact Us</Link>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  </Box>
}

export default SignInPage
