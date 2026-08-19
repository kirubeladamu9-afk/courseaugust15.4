'use client'

import type { FC } from 'react'
import ButtonBase, { type ButtonProps } from '@mui/material/Button'

type Props = Omit<ButtonProps, 'variant'> & {
  variant?: 'outline'
}

export const Button: FC<Props> = ({ variant, ...props }) => (
  <ButtonBase variant={variant === 'outline' ? 'outlined' : 'contained'} {...props} />
)
