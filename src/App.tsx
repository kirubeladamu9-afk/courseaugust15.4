import React, { Suspense, lazy } from 'react'
import Box from '@mui/material/Box'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SpinnerCustom } from '@/components/spinner'

const HomeHero = lazy(() => import('@/components/home/hero'))
const HomeFeature = lazy(() => import('@/components/home/feature'))
const HomePopularCourse = lazy(() => import('@/components/home/popular-courses'))
const HomeTestimonial = lazy(() => import('@/components/home/testimonial'))
const HomeOurMentors = lazy(() => import('@/components/home/mentors'))
const HomeNewsLetter = lazy(() => import('@/components/home/newsletter'))

const App: React.FC = () => {
  return (
    <Box component="main">
      <Header />
      <Suspense
        fallback={
          <div className="site-load-fallback">
            <SpinnerCustom />
          </div>
        }
      >
        <HomeHero />
        <HomePopularCourse />
        <HomeFeature />
        <HomeTestimonial />
        <HomeOurMentors />
        <HomeNewsLetter />
      </Suspense>
      <Footer />
    </Box>
  )
}

export default App
