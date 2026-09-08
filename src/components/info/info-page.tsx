import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { navigateTo } from '@/lib/navigation'

interface InfoPageProps {
  kind: 'about' | 'contact'
  darkMode: boolean
  onToggleDarkMode: () => void
}

const ContactForm: React.FC = () => (
  <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 18px 50px rgba(34, 76, 120, .13)' }}>
    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Typography variant="h5" sx={{ mb: .5, fontWeight: 800 }}>Get in Touch</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>You can reach us anytime</Typography>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); window.location.href = 'mailto:support@coursespace.com' }} sx={{ display: 'grid', gap: 1.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField required fullWidth size="small" label="First name" /><TextField required fullWidth size="small" label="Last name" /></Stack>
        <TextField required fullWidth size="small" type="email" label="Email address" />
        <TextField fullWidth size="small" label="Phone number" />
        <TextField required fullWidth multiline minRows={4} label="How can we help?" />
        <Button type="submit" variant="contained" sx={{ mt: .5, borderRadius: 5, py: 1.1 }}>Submit</Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>By contacting us, you agree to our Terms of service and Privacy Policy.</Typography>
      </Box>
    </CardContent>
  </Card>
)

const InfoPage: React.FC<InfoPageProps> = ({ kind, darkMode, onToggleDarkMode }) => {
  const isAbout = kind === 'about'
  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} />
    {isAbout ? <Box component="main" sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
      <Box sx={{ maxWidth: 720, mb: 5 }}><Chip label="About CourseSpace" color="primary" variant="outlined" sx={{ mb: 2 }} /><Typography variant="h2" sx={{ fontSize: { xs: '2.4rem', md: '3.8rem' }, mb: 1.5 }}>Learning that meets you where you are.</Typography><Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>CourseSpace helps learners build practical skills through clear courses, supportive tutors, and relaxed practice.</Typography></Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><SchoolOutlinedIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Built for steady progress</Typography><Typography color="text.secondary">Learn at a pace that works for you with practical content, live support, and explanations that make difficult ideas easier to understand.</Typography></CardContent></Card><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><MailOutlineIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Learners come first</Typography><Typography color="text.secondary">Whether you are exploring a new subject or preparing for your next milestone, CourseSpace keeps learning welcoming and useful.</Typography></CardContent></Card></Stack>
    </Box> : <Box component="main" sx={{ backgroundColor: 'background.paper' }}>
      <Box sx={{ background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #10273d 0%, #183b64 100%)' : 'linear-gradient(135deg, #eef6ff 0%, #dceaff 100%)', py: { xs: 6, md: 9 } }}><Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2.5, md: 5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr .8fr' }, gap: { xs: 5, md: 10 }, alignItems: 'center' }}><Box><Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}>We are here to help</Typography><Typography variant="h1" sx={{ fontSize: { xs: '2.8rem', md: '4.2rem' }, lineHeight: 1.03, letterSpacing: '-.04em', mt: 1.5, mb: 2 }}>Contact Us</Typography><Typography sx={{ maxWidth: 470, color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>Have a question about a course, class, or practice exam? Our team is ready to help you find the right next step.</Typography><Stack spacing={1.25}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}><MailOutlineIcon fontSize="small" color="primary" /><Typography variant="body2">info@coursespace.com</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}><PhoneOutlinedIcon fontSize="small" color="primary" /><Typography variant="body2">+1 (321) 221-2321</Typography></Box></Stack></Box><ContactForm /></Box></Box>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2.5, md: 5 }, py: { xs: 6, md: 9 } }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} alignItems="center"><Box sx={{ width: '100%', maxWidth: 500, height: { xs: 250, md: 310 }, borderRadius: 3, overflow: 'hidden', position: 'relative', backgroundColor: '#e8e8e8', backgroundImage: 'linear-gradient(35deg, transparent 45%, rgba(255,255,255,.9) 46%, rgba(255,255,255,.9) 48%, transparent 49%), linear-gradient(145deg, transparent 45%, rgba(255,255,255,.9) 46%, rgba(255,255,255,.9) 48%, transparent 49%), linear-gradient(90deg, transparent 48%, #d2d2d2 49%, #d2d2d2 51%, transparent 52%)', backgroundSize: '120px 90px, 150px 110px, 100% 75px' }}><Box sx={{ position: 'absolute', top: '47%', left: '49%', transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50% 50% 50% 0', backgroundColor: 'primary.main', rotate: '-45deg', '&::after': { content: '""', position: 'absolute', width: 10, height: 10, borderRadius: '50%', backgroundColor: 'white', top: 9, left: 9 } }} /><Card elevation={2} sx={{ position: 'absolute', bottom: 16, left: 16, maxWidth: 220, borderRadius: 2 }}><CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}><Typography variant="caption" sx={{ fontWeight: 800 }}>CourseSpace HQ</Typography><Typography variant="caption" display="block" color="text.secondary">123 Education Avenue, San Francisco</Typography></CardContent></Card></Box><Box sx={{ flex: 1 }}><Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>Our Location</Typography><Typography variant="h4" sx={{ mt: 1, mb: 2, fontWeight: 800 }}>Connecting Near and Far</Typography><Stack spacing={1}><Typography variant="body2" sx={{ fontWeight: 700 }}>Headquarters</Typography><Typography variant="body2" color="text.secondary">CourseSpace Inc.<br />123 Education Avenue<br />San Francisco, CA 94105<br />United States</Typography><Button size="small" variant="text" sx={{ alignSelf: 'flex-start', px: 0 }}>Open map <LocationOnOutlinedIcon sx={{ fontSize: 16, ml: .5 }} /></Button></Stack></Box></Stack></Box>
      <Divider /><Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2.5, md: 5 }, py: { xs: 6, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '.7fr 1.3fr' }, gap: { xs: 4, md: 8 } }}><Box><Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>FAQ</Typography><Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 800 }}>Do you have any questions for us?</Typography><Typography color="text.secondary" variant="body2">If there are questions you want to ask, we will answer them.</Typography><Stack direction="row" spacing={1} sx={{ mt: 3 }}><TextField size="small" placeholder="Enter your email" type="email" /><Button variant="contained" size="small">Submit</Button></Stack></Box><Box>{['What makes CourseSpace different from other learning platforms?', 'How secure is my learning data?', 'Can I personalize my CourseSpace experience?', 'What group features does CourseSpace offer?'].map((question) => <Accordion key={question} disableGutters elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', '&::before': { display: 'none' } }}><AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="body2">{question}</Typography></AccordionSummary><AccordionDetails><Typography variant="body2" color="text.secondary">Our team is happy to help. Send us a message and we will get back to you with more details.</Typography></AccordionDetails></Accordion>)}</Box></Box>
      <Box sx={{ minHeight: 290, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3, background: 'linear-gradient(90deg, rgba(6, 24, 42, .82), rgba(6, 24, 42, .6)), linear-gradient(135deg, #55746d, #1e4262)' }}><Box><Typography variant="h3" sx={{ color: 'white', maxWidth: 700, fontSize: { xs: '2rem', md: '3rem' }, mb: 3 }}>Ready to experience a simpler way to learn?</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center"><Button variant="contained" onClick={() => navigateTo('/courses')}>Get Started</Button><Button variant="outlined" onClick={() => navigateTo('/about-us')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,.7)' }}>Learn more</Button></Stack></Box></Box>
    </Box>}
    <Footer />
  </Box>
}

export default InfoPage
