import React, { FC, useState } from 'react'
import Box from '@mui/material/Box'
import { Link as ScrollLink } from 'react-scroll'
import { navigations } from './navigation.data'

const Navigation: FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  if (isAdmin) return null

  const destinations = navigations
  const [activeDestination, setActiveDestination] = useState('hero')

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      {destinations.map(({ path: destination, label }) => (
        <Box
          component={ScrollLink}
          key={destination}
          activeClass="current"
          onClick={() => setActiveDestination(destination)}
          onSetActive={(to) => setActiveDestination(to)}
          to={destination}
          href={`#${destination}`}
          spy={true}
          smooth={true}
          duration={350}
          sx={{
            position: 'relative',
            color: 'text.disabled',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 0, md: 3 },
            mb: { xs: 3, md: 0 },
            fontSize: { xs: '1.2rem', md: 'inherit' },
            ...(destination === 'hero' && {
              color: 'primary.main',
            }),
            ...(activeDestination === destination && {
              color: 'primary.main',
              '&>div': { display: 'block' },
            }),

            '& > div': { display: activeDestination === destination ? 'block' : 'none' },

            '&.current': {
              color: 'primary.main',
              '&>div': { display: 'block' },
            },

            '&:hover': {
              color: 'primary.main',
              '&>div': {
                display: 'block',
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              transform: 'rotate(3deg)',
              '& img': { width: 44, height: 'auto' },
            }}
          >
            {/* eslint-disable-next-line */}
            <img src="/images/headline-curve.svg" alt="Headline curve" />
          </Box>
          {label}
        </Box>
      ))}
    </Box>
  )
}

export default Navigation
