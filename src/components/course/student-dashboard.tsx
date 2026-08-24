import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useState } from 'react'
import { getMyEnrollments, type MyEnrollment } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

const StudentDashboard: FC = () => {
  const [enrollments, setEnrollments] = useState<MyEnrollment[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    getMyEnrollments()
      .then((nextEnrollments) => {
        if (isCurrent) setEnrollments(nextEnrollments)
      })
      .catch((error) => {
        if (!isCurrent) return
        setLoadError(error instanceof Error ? error.message : 'We could not load your enrollments.')
        setEnrollments([])
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return <Box sx={{ backgroundColor: 'background.default', minHeight: 'calc(100vh - 88px)', py: { xs: 5, md: 8 } }}>
    <Container maxWidth="lg">
      <Typography component="h1" variant="h2" sx={{ mb: 1 }}>Student Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Continue learning from your enrolled courses.</Typography>
      <Typography component="h2" variant="h4" sx={{ mb: 2.5 }}>My Enrollments</Typography>
      {loadError && <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert>}
      {enrollments === null && <Typography color="text.secondary">Loading your enrollments...</Typography>}
      {enrollments?.length === 0 && !loadError && <Card elevation={1} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>No enrollments yet</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Explore available courses to begin learning.</Typography>
        <Button variant="contained" onClick={() => navigateTo('/')}>Browse courses</Button>
      </Card>}
      {enrollments && enrollments.length > 0 && <Grid container spacing={3}>
        {enrollments.map((enrollment) => <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
          <Card elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia component="img" height="180" image={enrollment.courseCover} alt="" />
            <CardContent sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75 }}>Enrolled for {enrollment.studentName}</Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>{enrollment.courseTitle}</Typography>
              <Stack sx={{ mt: 'auto' }}>
                <Button variant="contained" onClick={() => navigateTo(`/courses/${enrollment.courseId}`)}>Start course</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>)}
      </Grid>}
    </Container>
  </Box>
}

export default StudentDashboard
