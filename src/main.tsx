import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useMemo, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

import { createTheme } from '@/config/theme'
import { Toaster } from '@/components/toast'
import App from './App'

import 'slick-carousel/slick/slick.css'
import '@/styles/globals.css'
import '@/styles/react-slick.css'

const getInitialDarkMode = () => {
  const savedMode = window.localStorage.getItem('color-mode')
  if (savedMode) return savedMode === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const Root = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)
  const theme = useMemo(() => createTheme(darkMode), [darkMode])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    window.localStorage.setItem('color-mode', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App darkMode={darkMode} onToggleDarkMode={() => setDarkMode((current) => !current)} />
      <Toaster />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
