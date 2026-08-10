import { createContext, useContext, useEffect, useMemo, useState, type FC, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from './index'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeModeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'coursespace-theme-mode'

const getInitialMode = (): ThemeMode => {
  const savedMode = localStorage.getItem(STORAGE_KEY)
  if (savedMode === 'light' || savedMode === 'dark') return savedMode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const AppThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)
  const theme = useMemo(() => createAppTheme(mode === 'dark'), [mode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.style.colorScheme = mode
    document.documentElement.dataset.theme = mode
  }, [mode])

  const value = useMemo(() => ({
    mode,
    isDarkMode: mode === 'dark',
    toggleTheme: () => setMode((currentMode) => currentMode === 'dark' ? 'light' : 'dark'),
  }), [mode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export const useThemeMode = (): ThemeContextValue => {
  const context = useContext(ThemeModeContext)
  if (!context) throw new Error('useThemeMode must be used within AppThemeProvider')
  return context
}
