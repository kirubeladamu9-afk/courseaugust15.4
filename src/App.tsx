import React, { Suspense, lazy, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SpinnerCustom } from '@/components/spinner'
import SignInPage from '@/components/auth/sign-in-page'
import AdminDashboard from '@/components/admin/admin-dashboard'
import { getAuthenticatedUser } from '@/services/api'

const loadSection = (load: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() =>
    Promise.all([
      load(),
      new Promise<void>((resolve) => setTimeout(resolve, 1200)),
    ]).then(([module]) => module)
  )

const HomeHero = loadSection(() => import('@/components/home/hero'))
const HomeFeature = loadSection(() => import('@/components/home/feature'))
const HomePopularCourse = loadSection(() => import('@/components/home/popular-courses'))
const HomeTestimonial = loadSection(() => import('@/components/home/testimonial'))
const HomeOurMentors = loadSection(() => import('@/components/home/mentors'))
const HomeNewsLetter = loadSection(() => import('@/components/home/newsletter'))

interface AppProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const RouteLoadingState: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: 'background.default',
    }}
    aria-live="polite"
  >
    <SpinnerCustom />
    <Typography color="text.secondary">{message}</Typography>
  </Box>
)

const App: React.FC<AppProps> = ({ darkMode, onToggleDarkMode }) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | null>(null)

  if (window.location.pathname.startsWith('/admin')) {
    if (getAuthenticatedUser()?.role !== 'admin') {
      window.location.replace('/')
      return <RouteLoadingState message="Returning to Coursespace..." />
    }

    return <AdminDashboard darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  }

  return (
    <Box component="main">
      <Suspense
        fallback={
          <div className="page-loading-state">
            <SpinnerCustom />
          </div>
        }
      >
        <Header
          darkMode={darkMode}
          onSignIn={() => setAuthMode('sign-in')}
          onSignUp={() => setAuthMode('sign-up')}
          onToggleDarkMode={onToggleDarkMode}
        />
        {authMode ? (
          <SignInPage mode={authMode} />
        ) : (
          <>
            <HomeHero />
            <HomePopularCourse />
            <HomeFeature />
            <HomeTestimonial />
            <HomeOurMentors />
            <HomeNewsLetter />
            <Footer />
          </>
        )}
      </Suspense>
    </Box>
  )
}

export default App
