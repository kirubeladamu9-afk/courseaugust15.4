import React, { FC } from 'react'
import { Box, Typography } from '@mui/material'

interface Props {
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

const Logo: FC<Props> = ({ onClick, variant = 'primary' }) => {
  return (
    <Box
      component="a"
      href="/"
      aria-label="CourseSpace home"
      onClick={(event) => {
        if (!onClick) return
        event.preventDefault()
        onClick()
      }}
      sx={{ display: 'inline-block', color: 'text.primary', textDecoration: 'none' }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 700, '& span': { color: variant === 'primary' ? 'primary.main' : 'unset' } }}
      >
        Course<span>sharp</span>
      </Typography>
    </Box>
  )
}


export default Logo
