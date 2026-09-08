import { common, grey } from '@mui/material/colors'
import type { PaletteOptions } from '@mui/material/styles'

const palette: PaletteOptions = {
  mode: 'light',
  background: {
    default: '#f2f5f5',
    paper: common.white,
  },
  text: {
    primary: grey[900],
    secondary: '#717171',
    disabled: grey[500],
  },
  divider: '#d9e2df',
  action: {
    hover: '#edf5f2',
    selected: '#e1f1ec',
    focus: '#d5ebe4',
  },
}

export default palette
