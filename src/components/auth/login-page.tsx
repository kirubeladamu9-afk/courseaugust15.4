import { useState, type FC, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { StyledButton } from '@/components/styled-button'
import { useAuth } from '@/auth/auth-context'

const roleDestinations = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
}

const LoginPage: FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setFieldError('')
    if (!identifier.trim() || !password) {
      setFieldError('Enter your username/email and password to continue.')
      return
    }

    setLoading(true)
    const result = await login(identifier, password, remember)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Unable to sign in. Please try again.')
      return
    }

    const storedUser = JSON.parse(localStorage.getItem('coursespace-auth-user') || sessionStorage.getItem('coursespace-auth-user') || '{}') as { role?: keyof typeof roleDestinations }
    navigate(roleDestinations[storedUser.role || 'admin'], { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: 'background.default', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Logo />
            <Box sx={{ textAlign: 'center' }}>
              <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, sm: 30 }, mb: 1 }}>Welcome back</Typography>
              <Typography color="text.secondary">Sign in to access your Coursespace account.</Typography>
            </Box>
          </Stack>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4 }}>
            <Stack spacing={2.25}>
              {error && <Alert severity="error">{error}</Alert>}
              {fieldError && <Alert severity="warning">{fieldError}</Alert>}
              <TextField label="Email or Username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" fullWidth required />
              <TextField
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                }}
              />
              <FormControlLabel control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} color="primary" />} label="Remember Me" />
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', '& > button': { width: '100%', justifyContent: 'center' } }}>
                <StyledButton type="submit" size="large" disableHoverEffect={loading}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
                </StyledButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                Forgot your password? Please contact your system administrator to reset your password.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
