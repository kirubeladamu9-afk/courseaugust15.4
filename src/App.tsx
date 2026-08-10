import React from 'react'
import { lazy, Suspense, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth, type UserRole } from '@/auth/auth-context'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

const HomeHero = lazy(() => import('@/components/home/hero'))
const HomeFeature = lazy(() => import('@/components/home/feature'))
const HomePopularCourse = lazy(() => import('@/components/home/popular-courses'))
const HomeTestimonial = lazy(() => import('@/components/home/testimonial'))
const HomeOurMentors = lazy(() => import('@/components/home/mentors'))
const HomeNewsLetter = lazy(() => import('@/components/home/newsletter'))
const AdminDashboard = lazy(() => import('@/components/admin/admin-dashboard'))
const LoginPage = lazy(() => import('@/components/auth/login-page'))

interface PageLayoutProps {
  children: ReactNode
}

const LoadingState: React.FC = () => (
  <Box
    role="status"
    aria-label="Loading content"
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: (theme) => theme.zIndex.modal,
      backgroundColor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress color="primary" />
    <Typography color="text.secondary">Loading content...</Typography>
  </Box>
)

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => (
  <Suspense fallback={<LoadingState />}>
    <Box component="main" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="div" sx={{ flex: 1 }}>{children}</Box>
      <Footer />
    </Box>
  </Suspense>
)

const HomePage: React.FC = () => (
  <PageLayout>
    <HomeHero />
    <HomePopularCourse />
    <HomeFeature />
    <HomeTestimonial />
    <HomeOurMentors />
    <HomeNewsLetter />
  </PageLayout>
)

interface InfoPageProps {
  title: string
  description: string
}

const InfoPage: React.FC<InfoPageProps> = ({ title, description }) => (
  <PageLayout>
    <Container sx={{ py: { xs: 10, md: 16 }, minHeight: '50vh' }}>
      <Typography variant="h1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" color="text.secondary">
        {description}
      </Typography>
    </Container>
  </PageLayout>
)

const roleDestinations: Record<UserRole, string> = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
}

interface RoleRouteProps {
  role: UserRole
  children: ReactNode
}

const RoleRoute: React.FC<RoleRouteProps> = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingState />
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={roleDestinations[user.role]} replace />
  return <>{children}</>
}

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
      <Route path="/login" element={<Suspense fallback={<LoadingState />}><LoginPage /></Suspense>} />
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<PageLayout><HomePopularCourse /></PageLayout>} />
      <Route path="/testimonials" element={<PageLayout><HomeTestimonial /></PageLayout>} />
      <Route path="/mentors" element={<PageLayout><HomeOurMentors /></PageLayout>} />
      <Route path="/admin" element={<RoleRoute role="admin"><Suspense fallback={<LoadingState />}><AdminDashboard /></Suspense></RoleRoute>} />
      <Route path="/teacher" element={<RoleRoute role="teacher"><InfoPage title="Teacher Dashboard" description="Your teacher dashboard is ready for your classes and lessons." /></RoleRoute>} />
      <Route path="/parent" element={<RoleRoute role="parent"><InfoPage title="Parent Dashboard" description="Your parent dashboard is ready to help you follow student progress." /></RoleRoute>} />
      <Route path="/student" element={<RoleRoute role="student"><InfoPage title="Student Dashboard" description="Your student dashboard is ready for your lessons and assessments." /></RoleRoute>} />
      <Route path="/contact" element={<InfoPage title="Contact Us" description="We would love to hear from you." />} />
      <Route path="/privacy" element={<InfoPage title="Privacy & Policy" description="Your privacy matters to us." />} />
      <Route path="/terms" element={<InfoPage title="Terms & Conditions" description="Please review our platform terms." />} />
      <Route path="/faq" element={<InfoPage title="FAQ" description="Find answers to common questions about Coursespace." />} />
      <Route path="*" element={<InfoPage title="Page not found" description="The page you requested does not exist." />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

export default App
