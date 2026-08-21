import React, { FC, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Logo } from '@/components/logo'
import { Navigation, AuthNavigation } from '@/components/navigation'
import { getAuthenticatedUser, signOut } from '@/services/api'
import { navigateTo } from '@/lib/navigation'
import { useTheme } from '@mui/material/styles'
import { Close, Menu } from '@mui/icons-material'

interface Props {
  onSignIn: () => void
}

const Header: FC<Props> = ({ onSignIn }) => {
  const [visibleMenu, setVisibleMenu] = useState<boolean>(false)
  const isAdmin = getAuthenticatedUser()?.role === 'admin'
  const { breakpoints } = useTheme()
  const matchMobileView = useMediaQuery(breakpoints.down('md'))

  return (
    <Box sx={{ backgroundColor: 'background.paper' }}>
      <Container sx={{ py: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <Box sx={{ ml: 'auto', display: { xs: 'inline-flex', md: 'none' } }}>
            <IconButton
              onClick={() => setVisibleMenu(!visibleMenu)}
              aria-label={visibleMenu ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={visibleMenu}
            >
              <Menu />
            </IconButton>
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },

              transition: (theme) => theme.transitions.create(['top']),
              ...(matchMobileView && {
                py: 6,
                backgroundColor: 'background.paper',
                zIndex: 'appBar',
                position: 'fixed',
                height: { xs: '100vh', md: 'auto' },
                top: visibleMenu ? 0 : '-120vh',
                left: 0,
              }),
            }}
          >
            <Box /> {/* Magic space */}
            <Navigation isAdmin={isAdmin} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AuthNavigation isAdmin={isAdmin} onSignIn={onSignIn} onAdminDashboard={() => navigateTo('/admin')} onSignOut={() => { void signOut().then(() => navigateTo('/', true)) }} />
            </Box>
            {visibleMenu && matchMobileView && (
              <IconButton
                sx={{
                  position: 'fixed',
                  top: 10,
                  right: 10,
                }}
                onClick={() => setVisibleMenu(!visibleMenu)}
                aria-label="Close navigation menu"
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Header
