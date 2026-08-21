import React, { FC } from 'react'
import Box from '@mui/material/Box'
import { StyledButton } from '@/components/styled-button'

interface Props {
  onSignIn: () => void
  onSignUp: () => void
}

const AuthNavigation: FC<Props> = ({ onSignIn, onSignUp }) => {
  return (
    <Box sx={{ '& button:first-child': { mr: 2 } }}>
      <StyledButton disableHoverEffect={true} variant="outlined" onClick={onSignIn}>
        Sign In
      </StyledButton>
      <StyledButton disableHoverEffect={true} onClick={onSignUp}>Sign Up</StyledButton>
    </Box>
  )
}

export default AuthNavigation
