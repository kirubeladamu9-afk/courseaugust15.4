import React from 'react'
import { lazy, Suspense, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

const HomeHero = lazy(() => import('@/components/home/hero'))
const HomeFeature = lazy(() => import('@/components/home/feature'))
const HomePopularCourse = lazy(() => import('@/components/home/popular-courses'))
const HomeTestimonial = lazy(() => import('@/components/home/testimonial'))
const HomeOurMentors = lazy(() => import('@/components/home/mentors'))
const HomeNewsLetter = lazy(() => import('@/components/home/newsletter'))

interface PageLayoutProps {
  children: ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => (
  <Box component="main" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Header />
    <Box component="div" sx={{ flex: 1 }}>
      <Suspense fallback={<Box sx={{ minHeight: '40vh' }} />}>{children}</Suspense>
    </Box>
    <Footer />
  </Box>
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

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<PageLayout><HomePopularCourse /></PageLayout>} />
      <Route path="/testimonials" element={<PageLayout><HomeTestimonial /></PageLayout>} />
      <Route path="/mentors" element={<PageLayout><HomeOurMentors /></PageLayout>} />
      <Route path="/contact" element={<InfoPage title="Contact Us" description="We would love to hear from you." />} />
      <Route path="/privacy" element={<InfoPage title="Privacy & Policy" description="Your privacy matters to us." />} />
      <Route path="/terms" element={<InfoPage title="Terms & Conditions" description="Please review our platform terms." />} />
      <Route path="/faq" element={<InfoPage title="FAQ" description="Find answers to common questions about Coursespace." />} />
      <Route path="*" element={<InfoPage title="Page not found" description="The page you requested does not exist." />} />
    </Routes>
  </BrowserRouter>
)

export default App
