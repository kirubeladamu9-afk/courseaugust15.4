import React, { Suspense, lazy, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SpinnerCustom } from '@/components/spinner'
import SignInPage from '@/components/auth/sign-in-page'
import AdminDashboard from '@/components/admin/admin-dashboard'
import CourseDetailPage from '@/components/course/course-detail-page'
import StudentDashboard from '@/components/course/student-dashboard'
import TutorDashboard from '@/components/tutor/tutor-dashboard'
import PracticeExamCatalog from '@/components/practice/practice-exam-catalog'
import PracticeExamPlayer from '@/components/practice/practice-exam-player'
import InfoPage from '@/components/info/info-page'
import { BookstorePage } from '@/components/bookstore/bookstore-page'
import { navigateTo } from '@/lib/navigation'
import { type Course } from '@/interfaces/course'
import { getAuthenticatedUser, getCourses } from '@/services/api'

const loadSection = <Props extends object = {}>(load: () => Promise<{ default: React.ComponentType<Props> }>) => lazy(load)

const HomeHero = loadSection(() => import('@/components/home/hero'))
const HomeFeature = loadSection(() => import('@/components/home/feature'))
const HomePopularCourse = loadSection<{ courses: Course[] }>(() => import('@/components/home/popular-courses'))
const HomeTrainingPrograms = loadSection<{ courses: Course[] }>(() => import('@/components/home/training-programs'))
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
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  const [homeCourses, setHomeCourses] = useState<Course[] | null>(null)
  const isAdminPath = /^\/admin(?:\/|$)/.test(currentPath)
  const isDashboardPath = /^\/dashboard\/?$/.test(currentPath)
  const isTutorPath = /^\/tutor(?:\/|$)/.test(currentPath)
  const isPracticeCatalogPath = /^\/practice-exams\/?$/.test(currentPath)
  const practiceExamMatch = currentPath.match(/^\/practice-exams\/(\d+)\/?$/)
  const isAboutPath = /^\/about-us\/?$/.test(currentPath)
  const isBookstorePath = /^\/bookstore\/?$/.test(currentPath)
  const isContactPath = /^\/contact-us\/?$/.test(currentPath)
  const courseMatch = currentPath.match(/^\/courses\/([^/]+)\/?$/)
  const currentUser = getAuthenticatedUser()
  const isAuthenticated = currentUser !== null
  const canAccessAdmin = currentUser?.role === 'admin'
  const canAccessTutor = currentUser?.role === 'tutor'

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isAdminPath && !canAccessAdmin) navigateTo('/', true)
    if (isTutorPath && !canAccessTutor) navigateTo('/', true)
    if (isDashboardPath && (!isAuthenticated || currentUser?.role === 'admin' || currentUser?.role === 'tutor')) navigateTo(currentUser?.role === 'admin' ? '/admin' : currentUser?.role === 'tutor' ? '/tutor' : '/', true)
    if (!isAdminPath && !isDashboardPath && !isTutorPath) setAuthMode(null)
  }, [canAccessAdmin, canAccessTutor, currentUser?.role, isAdminPath, isAuthenticated, isDashboardPath, isTutorPath])

  useEffect(() => {
    if (isAdminPath || isDashboardPath || isTutorPath || isPracticeCatalogPath || practiceExamMatch || isAboutPath || isBookstorePath || isContactPath || courseMatch) {
      setHomeCourses(null)
      return
    }

    let isCurrent = true
    setHomeCourses(null)
    getCourses()
      .then((courses) => {
        if (isCurrent) setHomeCourses(courses)
      })
      .catch(() => {
        if (isCurrent) setHomeCourses([])
      })

    return () => {
      isCurrent = false
    }
  }, [currentPath, isAboutPath, isAdminPath, isBookstorePath, isContactPath, isDashboardPath, isPracticeCatalogPath, isTutorPath, practiceExamMatch])

  if ((isAdminPath && !canAccessAdmin) || (isTutorPath && !canAccessTutor) || (isDashboardPath && (!isAuthenticated || currentUser?.role === 'admin' || currentUser?.role === 'tutor'))) return <RouteLoadingState message="Returning to Coursespace..." />
  if (isAdminPath) return <AdminDashboard darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (isTutorPath) return <TutorDashboard darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (isDashboardPath) return <StudentDashboard darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (isPracticeCatalogPath) return <PracticeExamCatalog darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (practiceExamMatch) return <PracticeExamPlayer examId={Number(practiceExamMatch[1])} darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (isAboutPath) return <InfoPage kind="about" darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (isBookstorePath) return <BookstorePage />
  if (isContactPath) return <InfoPage kind="contact" darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
  if (!courseMatch && homeCourses === null) return <div className="page-loading-state"><SpinnerCustom /></div>

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
          onToggleDarkMode={onToggleDarkMode}
        />
        {authMode ? (
          <SignInPage mode={authMode} />
        ) : courseMatch ? (
          <CourseDetailPage courseId={decodeURIComponent(courseMatch[1])} />
        ) : (
          <>
            <HomeHero />
            <HomePopularCourse courses={homeCourses ?? []} />
            <HomeTrainingPrograms courses={homeCourses ?? []} />
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
