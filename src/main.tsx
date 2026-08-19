import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

import { createTheme } from '@/config/theme'
import App from './App'

import 'slick-carousel/slick/slick.css'
import '@/styles/globals.css'
import '@/styles/react-slick.css'

const Root = () => {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <ThemeProvider theme={createTheme(darkMode)}>
      <CssBaseline />
      <App darkMode={darkMode} onToggleDarkMode={() => setDarkMode((current) => !current)} />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
