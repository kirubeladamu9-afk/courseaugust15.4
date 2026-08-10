import { createTheme as createMuiTheme, Theme } from '@mui/material/styles'

import typography from './typography'
import paletteBase from './palette-base'
import paletteLight from './palette-light'
import paletteDark from './palette-dark'
import shadows from './shadows'

// default
const createAppTheme = (darkMode = false): Theme => {
  const palette = darkMode ? { ...paletteBase, ...paletteDark } : { ...paletteBase, ...paletteLight }
  return createMuiTheme({
    palette,
    typography,
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            transition: 'background-color 180ms ease, color 180ms ease',
          },
          body: {
            transition: 'background-color 180ms ease, color 180ms ease',
          },
          '*, *::before, *::after': {
            transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
          },
        },
      },
    },
  })
}

const theme = createAppTheme()

export { createAppTheme, paletteBase, paletteLight, paletteDark, typography, shadows }
export default theme
