import React, { FC } from 'react'
import Box from '@mui/material/Box'
import { StyledButton } from '@/components/styled-button'

interface Props {
  isAdmin?: boolean
  onSignIn: () => void
  onSignUp: () => void
  onAdminDashboard: () => void
  onSignOut: () => void
}

const AuthNavigation: FC<Props> = ({ isAdmin = false, onSignIn, onSignUp, onAdminDashboard, onSignOut }) => {
  return (
    <Box sx={{ '& button:first-of-type': { mr: 2 } }}>
      {isAdmin ? <><StyledButton disableHoverEffect={true} variant="outlined" onClick={onAdminDashboard}>Admin Dashboard</StyledButton><StyledButton disableHoverEffect={true} onClick={onSignOut}>Sign Out</StyledButton></> : <><StyledButton disableHoverEffect={true} variant="outlined" onClick={onSignIn}>Sign In</StyledButton><StyledButton disableHoverEffect={true} onClick={onSignUp}>Sign Up</StyledButton></>}
    </Box>
  )
}

export default AuthNavigation
