import React, { FC, useState } from 'react'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Link as ScrollLink } from 'react-scroll'
import { navigateTo } from '@/lib/navigation'
import { navigations } from './navigation.data'

const programPaths = new Set(['popular-course', 'training-programs', '/practice-exams'])

const Navigation: FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [programsAnchor, setProgramsAnchor] = useState<HTMLElement | null>(null)
  const [activeDestination, setActiveDestination] = useState(() => window.location.pathname.startsWith('/practice-exams') ? '/practice-exams' : 'hero')

  if (isAdmin) return null

  const destinations = navigations
  const programDestinations = destinations.filter(({ path }) => programPaths.has(path))
  const primaryDestinations = destinations.filter(({ path }) => !programPaths.has(path))
  const programsOpen = Boolean(programsAnchor)
  const programsActive = programDestinations.some(({ path }) => path === activeDestination)

  const handleDestinationClick = (destination: string, event: React.MouseEvent<HTMLElement>) => {
    setActiveDestination(destination)
    if (destination.startsWith('/')) {
      event.preventDefault()
      navigateTo(destination)
    }
    setProgramsAnchor(null)
  }

  const headlineCurve = <Box sx={{ position: 'absolute', top: 12, transform: 'rotate(3deg)', '& img': { width: 44, height: 'auto' } }}><img src="/images/headline-curve.svg" alt="Headline curve" /></Box>
  const linkSx = {
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
    '& > div': { display: 'none' },
    '&.current': { color: 'primary.main', '&>div': { display: 'block' } },
    '&:hover': { color: 'primary.main', '&>div': { display: 'block' } },
  }

  const renderDestination = ({ path: destination, label }: typeof primaryDestinations[number]) => {
    const isRoute = destination.startsWith('/')
    return <Box
      component={isRoute ? 'a' : ScrollLink}
      key={destination}
      onClick={(event: React.MouseEvent<HTMLElement>) => handleDestinationClick(destination, event)}
      {...(isRoute
        ? { href: destination }
        : {
            activeClass: 'current',
            onSetActive: (to: string) => setActiveDestination(to),
            to: destination,
            href: `#${destination}`,
            spy: true,
            smooth: true,
            duration: 350,
          })}
      sx={{
        ...linkSx,
        ...(destination === 'hero' && { color: 'primary.main' }),
        ...(activeDestination === destination && { color: 'primary.main', '&>div': { display: 'block' } }),
      }}
    >
      {headlineCurve}
      {label}
    </Box>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' } }}>
      {primaryDestinations.filter(({ path }) => path === 'hero').map(renderDestination)}
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 0 }, px: { xs: 0, md: 3 } }}>
        <Box
          component="button"
          type="button"
          aria-haspopup="menu"
          aria-expanded={programsOpen ? 'true' : undefined}
          onClick={(event: React.MouseEvent<HTMLElement>) => setProgramsAnchor(event.currentTarget)}
          sx={{
            ...linkSx,
            border: 0,
            background: 'none',
            p: 0,
            mb: 0,
            color: programsActive || programsOpen ? 'primary.main' : 'text.disabled',
            '& > div': { display: programsActive || programsOpen ? 'block' : 'none' },
          }}
        >
          {headlineCurve}
          Programs
          <KeyboardArrowDownIcon sx={{ fontSize: '1.1rem', ml: 0.25, transition: 'transform 150ms', transform: programsOpen ? 'rotate(180deg)' : 'none' }} />
        </Box>
        <Menu
          anchorEl={programsAnchor}
          open={programsOpen}
          onClose={() => setProgramsAnchor(null)}
          MenuListProps={{ 'aria-label': 'Programs' }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {programDestinations.map(({ path: destination, label }) => {
            const isRoute = destination.startsWith('/')
            const displayLabel = destination === 'training-programs' ? 'Training Programs' : label
            if (isRoute) return <MenuItem key={destination} component="a" href={destination} onClick={(event) => handleDestinationClick(destination, event)}>{displayLabel}</MenuItem>
            return <MenuItem key={destination} component="a" href={`#${destination}`} onClick={(event) => { event.preventDefault(); setActiveDestination(destination); setProgramsAnchor(null); document.getElementById(destination)?.scrollIntoView({ behavior: 'smooth' }) }}>{displayLabel}</MenuItem>
          })}
        </Menu>
      </Box>
      {primaryDestinations.filter(({ path }) => path !== 'hero').map(renderDestination)}
    </Box>
  )
}

export default Navigation
