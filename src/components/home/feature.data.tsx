import React, { ReactNode } from 'react'
import ArtTrackIcon from '@mui/icons-material/ArtTrack'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'

interface Data {
  title: string
  description: string
  icon?: ReactNode
}

export const data: Data[] = [
  {
    title: 'Easy To Access',
    description: 'Join classes from any device, anywhere, with no complicated setup required',
    icon: <ArtTrackIcon />,
  },
  {
    title: 'Fair, Simple Pricing',
    description: 'Choose a learning plan that fits your family budget and goals with ease',
    icon: <AttachMoneyIcon />,
  },
  {
    title: 'Flexible Class Time',
    description: 'Pick class times that work for your family routine and your child’s pace',
    icon: <LocalLibraryIcon />,
  },
  {
    title: 'Direct Tutor Messaging',
    description: 'Ask questions directly and keep your child supported between every class',
    icon: <ContactSupportIcon />,
  },
]
