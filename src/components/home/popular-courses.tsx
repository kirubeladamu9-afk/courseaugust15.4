import React, { FC } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Slider, { Settings } from 'react-slick'
import { useRef } from 'react'
import { type Course } from '@/interfaces/course'
import Container from '@mui/material/Container'
import { useTheme, styled } from '@mui/material/styles'
import { IconButton, useMediaQuery } from '@mui/material'
import Typography from '@mui/material/Typography'
import IconArrowBack from '@mui/icons-material/ArrowBack'
import IconArrowForward from '@mui/icons-material/ArrowForward'

import { CourseCardItem } from '@/components/course'
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

const HomePopularCourse: FC<{ courses: Course[] }> = ({ courses }) => {
  const { breakpoints } = useTheme()
  const matchMobileView = useMediaQuery(breakpoints.down('md'))

  const sliderRef = useRef<Slider | null>(null)

  const sliderConfig: Settings = {
    infinite: courses.length > (matchMobileView ? 1 : 3),
    autoplay: true,
    speed: 300,
    slidesToShow: matchMobileView ? 1 : Math.min(3, Math.max(1, courses.length)),
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
      id="popular-course"
      sx={{
        pt: {
          xs: 7,
          md: 10,
        },
        pb: 14,
        backgroundColor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ maxWidth: 360 }}>
              <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2, fontWeight: 700 }}>Learn with purpose</Typography>
              <Typography component="h2" variant="h3" sx={{ mt: 1, mb: 2, fontSize: { xs: '2.5rem', md: '3.25rem' }, lineHeight: 1.08 }}>Most Popular Courses</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>Explore the courses learners are loving right now and find your next opportunity to grow.</Typography>
              {courses.length > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 3 }}>
                <Box sx={{ width: 42, height: 4, borderRadius: 2, backgroundColor: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">{courses.length} courses available</Typography>
              </Box>}
            </Box>
          </Grid>
          <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
            {courses.length > 0 && <Box sx={{ width: '100%', minWidth: 0 }}>
              <Slider ref={sliderRef} {...sliderConfig}>
                {courses.map((item) => (
                  <CourseCardItem key={String(item.id)} item={item} />
                ))}
              </Slider>
            </Box>}
            {courses.length > 0 && <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, mt: { xs: 4, md: 2 } }}>
              <IconButton
                sx={{
                  backgroundColor: 'background.paper',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' },
                  boxShadow: 1,
                }}
                disableRipple
                aria-label="Previous courses"
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
                aria-label="Next courses"
                onClick={() => sliderRef.current?.slickNext()}
              >
                <IconArrowForward sx={{ fontSize: 22 }} />
              </IconButton>
            </Box>}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default HomePopularCourse
