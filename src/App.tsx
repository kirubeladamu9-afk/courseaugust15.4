import React, { Suspense, lazy } from 'react'
import Box from '@mui/material/Box'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SpinnerCustom } from '@/components/spinner'

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

const App: React.FC = () => {
  return (
    <Box component="main">
      <Suspense
        fallback={
          <div className="page-loading-state">
            <SpinnerCustom />
          </div>
        }
      >
        <Header />
        <HomeHero />
        <HomePopularCourse />
        <HomeFeature />
        <HomeTestimonial />
        <HomeOurMentors />
        <HomeNewsLetter />
        <Footer />
      </Suspense>
    </Box>
  )
}

export default App
