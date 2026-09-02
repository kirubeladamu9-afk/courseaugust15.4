import React, { FC } from 'react'
import Box from '@mui/material/Box'
import { StyledButton } from '@/components/styled-button'

interface Props {
  isAdmin?: boolean
  isTutor?: boolean
  darkMode?: boolean
  onSignIn: () => void
  onAdminDashboard: () => void
  onTutorDashboard: () => void
  onSignOut: () => void
}

const AuthNavigation: FC<Props> = ({ isAdmin = false, isTutor = false, darkMode = false, onSignIn, onAdminDashboard, onTutorDashboard, onSignOut }) => {
  return (
    <Box sx={{ '& button:first-of-type': { mr: 2 } }}>
      {isAdmin ? <><StyledButton disableHoverEffect={true} variant="outlined" onClick={onAdminDashboard}>Admin Dashboard</StyledButton><StyledButton disableHoverEffect={true} onClick={onSignOut}>Sign Out</StyledButton></> : isTutor ? <><StyledButton disableHoverEffect={true} variant="outlined" onClick={onTutorDashboard}>Tutor Portal</StyledButton><StyledButton disableHoverEffect={true} onClick={onSignOut}>Sign Out</StyledButton></> : <><StyledButton disableHoverEffect={true} variant="outlined" color={darkMode ? 'light' : 'primary'} onClick={onSignIn}>Sign In</StyledButton></>}
    </Box>
  )
}

export default AuthNavigation
