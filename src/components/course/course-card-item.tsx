import React, { FC } from 'react'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import IconButton, { iconButtonClasses } from '@mui/material/IconButton'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { Course } from '@/interfaces/course'
import { navigateTo } from '@/lib/navigation'

interface Props {
  item: Course
}

const CourseCardItem: FC<Props> = ({ item }) => {
  return (
    <Box
      sx={{
        width: '100%',
        px: 1,
        py: 4,
      }}
    >
      <Box
        sx={{
          p: 2,
          height: { xs: 430, md: 450 },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRadius: 4,
          border: 1,
          borderColor: 'divider',
          transition: (theme) => theme.transitions.create(['box-shadow', 'transform', 'border-color']),
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-4px)',
            borderColor: 'primary.main',
            [`& .${iconButtonClasses.root}`]: {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            lineHeight: 0,
            overflow: 'hidden',
            aspectRatio: '16 / 9',
            borderRadius: 3,
            mb: 2.5,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(10, 20, 30, 0.02) 35%, rgba(10, 20, 30, 0.48) 100%)',
              pointerEvents: 'none',
            },
            '& .course-cover-image': {
              display: 'block',
              height: '100%',
              objectFit: 'cover',
            },
          }}
        >
          <img className="course-cover-image" src={item.cover} width={760} height={760} alt={item.title} loading="lazy" />
          <Box sx={{ position: 'absolute', left: 12, bottom: 12, zIndex: 1, px: 1.25, py: 0.5, borderRadius: 1.5, backgroundColor: 'background.paper', color: 'primary.main', fontSize: 12, fontWeight: 700 }}>{item.category}</Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography component="h2" variant="h5" sx={{ mb: 1.5, height: 56, overflow: 'hidden', fontSize: '1.2rem', lineHeight: 1.35 }}>
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating name="rating-course" value={item.rating} max={5} sx={{ color: '#ffce31', mr: 1 }} readOnly />
            <Typography component="span" variant="body2" color="text.secondary">
              {item.rating.toFixed(1)} · {item.ratingCount} reviews
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" color="primary.main">
              {'$' + item.price}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>/ course</Typography>
          </Box>
          <IconButton
            color="primary"
            aria-label={`Open ${item.title} course`}
            onClick={() => navigateTo(`/courses/${item.id}`)}
            sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' } }}
          >
            <ArrowForward />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default CourseCardItem
