import React, { FC } from 'react'
import Box from '@mui/material/Box'
import { useNavigate } from 'react-router-dom'
import { StyledButton } from '@/components/styled-button'

const AuthNavigation: FC = () => {
  const navigate = useNavigate()

  return (
    <Box>
      <StyledButton disableHoverEffect={true} variant="outlined" onClick={() => navigate('/login')}>
        Sign In
      </StyledButton>
    </Box>
  )
}

export default AuthNavigation
