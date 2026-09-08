import { createTheme as createMuiTheme, Theme } from '@mui/material/styles'

import { alpha, createTheme as createMuiTheme, type Theme } from '@mui/material/styles'
import typography from './typography'
import paletteBase from './palette-base'
import paletteLight from './palette-light'
import paletteDark from './palette-dark'
import shadows from './shadows'

const createTheme = (darkMode = false): Theme => {
  const palette = darkMode ? { ...paletteBase, ...paletteDark } : { ...paletteBase, ...paletteLight }

  return createMuiTheme({
    palette,
    typography,
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          html: { colorScheme: theme.palette.mode },
          body: { backgroundColor: theme.palette.background.default, color: theme.palette.text.primary },
          '::selection': { backgroundColor: alpha(theme.palette.primary.main, 0.35) },
        }),
      },
      MuiPaper: { styleOverrides: { root: ({ theme }) => ({ backgroundImage: 'none', borderColor: theme.palette.divider }) } },
      MuiCard: { styleOverrides: { root: ({ theme }) => ({ backgroundImage: 'none', borderColor: theme.palette.divider }) } },
      MuiAppBar: { styleOverrides: { root: ({ theme }) => ({ backgroundImage: 'none', backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }) } },
      MuiDrawer: { styleOverrides: { paper: ({ theme }) => ({ backgroundImage: 'none', backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }) } },
      MuiDialog: { styleOverrides: { paper: ({ theme }) => ({ backgroundImage: 'none', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }) } },
      MuiMenu: { styleOverrides: { paper: ({ theme }) => ({ backgroundImage: 'none', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }) } },
      MuiMenuItem: { styleOverrides: { root: ({ theme }) => ({ '&:hover': { backgroundColor: theme.palette.action.hover }, '&.Mui-selected': { backgroundColor: theme.palette.action.selected }, '&.Mui-selected:hover': { backgroundColor: theme.palette.action.focus } }) } },
      MuiOutlinedInput: { styleOverrides: { root: ({ theme }) => ({ backgroundColor: theme.palette.background.default, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main, borderWidth: 2 }, '&.Mui-disabled': { backgroundColor: theme.palette.action.disabledBackground } }) } },
      MuiInputLabel: { styleOverrides: { root: ({ theme }) => ({ color: theme.palette.text.secondary, '&.Mui-focused': { color: theme.palette.primary.main }, '&.Mui-disabled': { color: theme.palette.text.disabled } }) } },
      MuiButton: { styleOverrides: { root: ({ theme }) => ({ '&.Mui-disabled': { color: theme.palette.text.disabled, borderColor: theme.palette.action.disabled }, '&:focus-visible': { outline: `2px solid ${theme.palette.primary.light}`, outlineOffset: 2 } }) } },
      MuiIconButton: { styleOverrides: { root: ({ theme }) => ({ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover, color: theme.palette.text.primary }, '&:focus-visible': { outline: `2px solid ${theme.palette.primary.light}`, outlineOffset: 2 } }) } },
      MuiChip: { styleOverrides: { outlined: ({ theme }) => ({ borderColor: theme.palette.divider }) } },
      MuiLinearProgress: { styleOverrides: { root: ({ theme }) => ({ backgroundColor: theme.palette.action.selected }) } },
      MuiTableCell: { styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider }), head: ({ theme }) => ({ backgroundColor: theme.palette.action.hover, color: theme.palette.text.primary, fontWeight: 700 }) } },
      MuiTableRow: { styleOverrides: { root: ({ theme }) => ({ '&:hover': { backgroundColor: theme.palette.action.hover }, '&.Mui-selected': { backgroundColor: theme.palette.action.selected } }) } },
      MuiTooltip: { styleOverrides: { tooltip: ({ theme }) => ({ backgroundColor: theme.palette.mode === 'dark' ? '#07100e' : theme.palette.grey[800], color: theme.palette.common.white }) } },
    },
  })
}

const theme = createTheme(false)

export { createTheme, paletteBase, paletteLight, paletteDark, typography, shadows }
export default theme
