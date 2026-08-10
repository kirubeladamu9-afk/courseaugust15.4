import { type FC } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { AdminPanelLayout } from '@/components/admin/admin-dashboard'

const AdminProfile: FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const initials = user?.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'AD'
  const lastLogin = user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'

  return (
    <AdminPanelLayout title="Profile">
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Admin</Typography>
          <Typography variant="subtitle2" color="primary.main">Profile</Typography>
        </Breadcrumbs>
        <ButtonBase onClick={() => navigate('/admin')} sx={{ mb: 3, color: 'text.secondary', borderRadius: 1, p: 0.5, '&:hover': { color: 'primary.main' } }}>
          <ArrowBackRounded sx={{ fontSize: 18, mr: 0.5 }} />
          <Typography variant="subtitle2">Back to dashboard</Typography>
        </ButtonBase>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={2.5}>
            <Avatar sx={{ width: 88, height: 88, backgroundColor: 'primary.main', fontSize: 30, fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
              <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, mb: 0.5 }}>{user?.name || 'Administrator'}</Typography>
              <Stack direction="row" justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" spacing={1} sx={{ mb: 1 }}>
                <Chip label="Administrator" size="small" color="primary" />
                <Chip label={user?.status === 'active' ? 'Active account' : user?.status || 'Unknown status'} size="small" sx={{ backgroundColor: 'rgba(50, 220, 136, 0.16)', color: '#32dc88' }} />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={0.75}>
                <EmailOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{user?.email || 'No email available'}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Stack direction="row" spacing={1.25} alignItems="center"><ScheduleOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Last login</Typography><Typography variant="subtitle2">{lastLogin}</Typography></Box></Stack></Grid>
            <Grid item xs={12} sm={6}><Stack direction="row" spacing={1.25} alignItems="center"><ShieldOutlined color="primary" /><Box><Typography variant="caption" color="text.secondary">Access level</Typography><Typography variant="subtitle2">Full administrator access</Typography></Box></Stack></Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <PersonOutlineOutlined color="primary" />
            <Typography variant="h4">Personal Information</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Full name</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.name || 'Not available'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Username</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.username || 'Not available'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Email address</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>{user?.email || 'Not available'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Role</Typography><Typography variant="body1" sx={{ mt: 0.5 }}>Administrator</Typography></Grid>
          </Grid>
        </Paper>
      </Container>
    </AdminPanelLayout>
  )
}

export default AdminProfile
