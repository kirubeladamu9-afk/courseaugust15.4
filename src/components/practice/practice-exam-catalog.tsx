import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { navigateTo } from '@/lib/navigation'
import { getPracticeExams } from '@/services/api'
import { type PracticeExam } from './practice-data'

interface PracticeExamCatalogProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const PracticeExamCatalog: React.FC<PracticeExamCatalogProps> = ({ darkMode, onToggleDarkMode }) => {
  const [exams, setExams] = useState<PracticeExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getPracticeExams().then((records) => { if (active) setExams(records) }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load practice exams.') }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} />
    <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 5, md: 8 } }}>
      <Box sx={{ maxWidth: 720, mb: 5 }}><Chip label="Practice at your pace" color="primary" variant="outlined" sx={{ mb: 2 }} /><Typography variant="h2" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, mb: 1.5 }}>Practice exams for confident learning</Typography><Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>Work through one question at a time, see the explanation right away, and build understanding without a timer or pressure.</Typography></Box>
      <Typography variant="h5" sx={{ mb: 2.5 }}>Published practice exams</Typography>
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading practice exams" /></Box> : error ? <Alert severity="error">{error}</Alert> : exams.length === 0 ? <Alert severity="info">There are no published practice exams available yet.</Alert> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
        {exams.map((exam) => <Card key={exam.id} elevation={0} sx={{ border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}><Box sx={{ minHeight: 132, p: 3, display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, rgba(16, 125, 111, 0.18), rgba(16, 125, 111, 0.04))' }}><SchoolOutlinedIcon color="primary" sx={{ fontSize: 44 }} /></Box><CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}><Stack direction="row" spacing={1} sx={{ mb: 1.5 }}><Chip label={exam.subject} size="small" color="primary" variant="outlined" /><Chip label={exam.grade} size="small" /></Stack><Typography variant="h6" sx={{ mb: 1 }}>{exam.title}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>Relaxed practice with instant feedback and clear answer explanations.</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}><Typography color="success.main" sx={{ fontWeight: 700 }}>Free access</Typography><Button variant="contained" onClick={() => navigateTo(`/practice-exams/${exam.id}`)}>Start practicing</Button></Stack></CardContent></Card>)}
      </Box>}
      <Box sx={{ mt: 5, p: 2.5, borderRadius: 2, backgroundColor: 'action.hover', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}><MenuBookOutlinedIcon color="primary" /><Box><Typography sx={{ fontWeight: 700 }}>Learn at your own pace</Typography><Typography color="text.secondary" variant="body2">These practice exams are currently free and open to everyone.</Typography></Box></Box>
    </Box>
    <Footer />
  </Box>
}

export default PracticeExamCatalog
