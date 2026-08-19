import React, { FC } from 'react'
import Box from '@mui/material/Box'
import Slider, { Settings } from 'react-slick'
import { useRef } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme, styled } from '@mui/material/styles'
import IconArrowBack from '@mui/icons-material/ArrowBack'
import IconArrowForward from '@mui/icons-material/ArrowForward'
import { MentorCardItem } from '@/components/mentor'
import { data } from './mentors.data'

const StyledDots = styled('ul')(({ theme }) => ({
  '&.slick-dots': {
    position: 'absolute',
    left: 0,
    bottom: -20,
    paddingLeft: theme.spacing(1),
    textAlign: 'left',
    '& li': {
      marginRight: theme.spacing(2),
      '&.slick-active>div': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
}))

const HomeOurMentors: FC = () => {
  const { breakpoints } = useTheme()
  const matchMobileView = useMediaQuery(breakpoints.down('md'))

  const sliderRef = useRef<Slider | null>(null)

  const sliderConfig: Settings = {
    infinite: true,
    // autoplay: true,
    speed: 300,
    slidesToShow: matchMobileView ? 1 : 3,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    appendDots: (dots) => <StyledDots>{dots}</StyledDots>,
    customPaging: () => (
      <Box sx={{ height: 8, width: 30, backgroundColor: 'divider', display: 'inline-block', borderRadius: 4 }} />
    ),
  }

  return (
    <Box
      id="mentors"
      sx={{
        pt: {
          xs: 6,
          md: 8,
        },
        pb: {
          xs: 8,
          md: 12,
        },
        backgroundColor: '#ecf3f3',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h1" sx={{ fontSize: 40 }}>
          Our Expert Mentors
        </Typography>

        <Slider ref={sliderRef} {...sliderConfig}>
          {data.map((item) => (
            <MentorCardItem key={String(item.id)} item={item} />
          ))}
        </Slider>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: { xs: 4, md: 2 } }}>
          <IconButton
            sx={{
              backgroundColor: 'background.paper',
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' },
              boxShadow: 1,
            }}
            disableRipple
            aria-label="Previous mentors"
            onClick={() => sliderRef.current?.slickPrev()}
          >
            <IconArrowBack sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton
            sx={{
              backgroundColor: 'background.paper',
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' },
              boxShadow: 1,
            }}
            disableRipple
            aria-label="Next mentors"
            onClick={() => sliderRef.current?.slickNext()}
          >
            <IconArrowForward sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </Container>
    </Box>
  )
}

export default HomeOurMentors
