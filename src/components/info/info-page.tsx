import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { navigateTo } from '@/lib/navigation'

interface InfoPageProps {
  kind: 'about' | 'contact'
  darkMode: boolean
  onToggleDarkMode: () => void
}

const InfoPage: React.FC<InfoPageProps> = ({ kind, darkMode, onToggleDarkMode }) => {
  const isAbout = kind === 'about'
  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} />
    <Box component="main" sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
      <Box sx={{ maxWidth: 720, mb: 5 }}><Chip label={isAbout ? 'About CourseSpace' : 'We are here to help'} color="primary" variant="outlined" sx={{ mb: 2 }} /><Typography variant="h2" sx={{ fontSize: { xs: '2.4rem', md: '3.8rem' }, mb: 1.5 }}>{isAbout ? 'Learning that meets you where you are.' : 'Contact Us'}</Typography><Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>{isAbout ? 'CourseSpace helps learners build practical skills through clear courses, supportive tutors, and relaxed practice.' : 'Have a question about a course, class, or practice exam? Send us a message and our team will get back to you.'}</Typography></Box>
      {isAbout ? <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><SchoolOutlinedIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Built for steady progress</Typography><Typography color="text.secondary">Learn at a pace that works for you with practical content, live support, and explanations that make difficult ideas easier to understand.</Typography></CardContent></Card><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><MailOutlineIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Learners come first</Typography><Typography color="text.secondary">Whether you are exploring a new subject or preparing for your next milestone, CourseSpace keeps learning welcoming and useful.</Typography></CardContent></Card></Stack> : <Card elevation={0} sx={{ maxWidth: 700, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: { xs: 2.5, md: 4 } }}><Box component="form" onSubmit={(event) => { event.preventDefault(); window.location.href = 'mailto:support@coursespace.com' }} sx={{ display: 'grid', gap: 2 }}><TextField required label="Your name" /><TextField required type="email" label="Email address" /><TextField required multiline minRows={5} label="Message" /><Button type="submit" variant="contained" startIcon={<MailOutlineIcon />} sx={{ justifySelf: 'flex-start' }}>Send message</Button></Box></CardContent></Card>}
    </Box>
    <Footer />
  </Box>
}

export default InfoPage
