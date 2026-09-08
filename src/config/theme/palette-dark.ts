import { PaletteOptions } from '@mui/material'
import type { PaletteOptions } from '@mui/material/styles'

const paletteDark: PaletteOptions = {
  mode: 'dark',
  background: {
    default: '#101716',
    paper: '#192321',
  },
  text: {
    primary: '#f2f7f6',
    secondary: '#b3c0bd',
    disabled: '#71817e',
  },
  divider: '#31413e',
  action: {
    active: '#c5d1ce',
    hover: '#24332f',
    selected: '#2b413b',
    disabled: '#52615e',
    disabledBackground: '#26322f',
    focus: '#304842',
  },
  success: {
    light: '#75c99d',
    main: '#43a875',
    dark: '#2f8058',
    contrastText: '#071b10',
  },
  warning: {
    light: '#ffc266',
    main: '#f59e0b',
    dark: '#ffb547',
    contrastText: '#241400',
  },
  error: {
    light: '#fb8f8f',
    main: '#ef6b6b',
    dark: '#ff9898',
    contrastText: '#280808',
  },
  info: {
    light: '#7bc9f5',
    main: '#38a6df',
    dark: '#70c6f3',
    contrastText: '#061a25',
  },
}

export default paletteDark
