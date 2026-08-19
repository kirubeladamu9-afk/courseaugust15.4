import { useState, type FC, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { StyledButton } from '@/components/styled-button'
import { ToastTypes } from '@/components/ui/toast-types'

const SignInPage: FC = () => {
  const [toastOpen, setToastOpen] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setToastOpen(true)
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: 'calc(100vh - 88px)', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, md: 5 } }}>
          <Typography component="h1" variant="h2" sx={{ mb: 1 }}>
            Sign In
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Welcome back to Coursespace.
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField required fullWidth label="Email" type="email" autoComplete="email" />
            <TextField required fullWidth label="Password" type="password" autoComplete="current-password" />
            <Box sx={{ '& button': { width: '100%', justifyContent: 'center' } }}>
              <StyledButton type="submit">Sign In</StyledButton>
            </Box>
          </Box>
        </Paper>
        <ToastTypes />
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
          Signed in successfully.
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SignInPage
