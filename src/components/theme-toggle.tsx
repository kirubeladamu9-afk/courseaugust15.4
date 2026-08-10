import { type FC } from 'react'
import IconButton from '@mui/material/IconButton'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import { useThemeMode } from '@/config/theme/theme-context'

const ThemeToggle: FC = () => {
  const { isDarkMode, toggleTheme } = useThemeMode()

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? <LightModeOutlined /> : <DarkModeOutlined />}
    </IconButton>
  )
}

export default ThemeToggle
