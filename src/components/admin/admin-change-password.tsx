import { useState, type FC, type FormEvent } from 'react'
import axios from 'axios'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { AdminPanelLayout } from '@/components/admin/admin-dashboard'
import api from '@/lib/api'

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const AdminChangePassword: FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!passwordRule.test(newPassword)) {
      setError('Your new password must be at least 8 characters and include uppercase, lowercase, and a number.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      await api.post('/api/admin/change-password', { currentPassword, newPassword }, { withCredentials: true })
      await logout()
      navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in with your new password.' } })
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data.message || 'Unable to update your password.' : 'Unable to update your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPanelLayout title="Change Password">
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Admin</Typography>
          <Typography variant="subtitle2" color="primary.main">Change Password</Typography>
        </Breadcrumbs>
        <ButtonBase onClick={() => navigate('/admin')} sx={{ mb: 3, color: 'text.secondary', borderRadius: 1, p: 0.5, '&:hover': { color: 'primary.main' } }}>
          <ArrowBackRounded sx={{ fontSize: 18, mr: 0.5 }} />
          <Typography variant="subtitle2">Back to dashboard</Typography>
        </ButtonBase>
        <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Typography component="h1" variant="h4">Change Password</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Choose a strong, unique password for your administrator account.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField fullWidth required disabled={saving} label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
            <TextField fullWidth required disabled={saving} label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText="At least 8 characters, with uppercase, lowercase, and a number" autoComplete="new-password" />
            <TextField fullWidth required disabled={saving} label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            <Box><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Updating password...' : 'Update Password'}</Button></Box>
          </Stack>
        </Paper>
      </Container>
    </AdminPanelLayout>
  )
}

export default AdminChangePassword
