import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import type { Navigation } from '@/interfaces/navigation'
import FooterSectionTitle from './footer-section-title'

const companyMenu: Navigation[] = [
  { label: 'About Us', path: '/about-us' },
  { label: 'Coursespace', path: '/' },
  { label: 'Programs', path: '/#training-programs' },
  { label: 'Practice Exams', path: '/practice-exams' },
]

const supportMenu: Navigation[] = [
  { label: 'Contact Us', path: '/contact-us' },
  { label: 'Help Center', path: '/contact-us' },
  { label: 'FAQ', path: '/contact-us' },
  { label: 'Feedback', path: '/contact-us' },
]

const linkMenu: Navigation[] = [
  { label: 'Courses', path: '/#popular-course' },
  { label: 'Programs', path: '/#training-programs' },
  { label: 'Practice Exams', path: '/practice-exams' },
  { label: 'Become a Tutor', path: '/tutor' },
]

interface NavigationItemProps {
  label: string
  path: string
}

const NavigationItem: FC<NavigationItemProps> = ({ label, path }) => (
  <MuiLink href={path} underline="hover" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
    {label}
  </MuiLink>
)

const FooterNavigation: FC = () => (
  <Grid container spacing={{ xs: 3, sm: 2 }}>
    <Grid item xs={6} sm={3}>
      <FooterSectionTitle title="Company" />
      {companyMenu.map(({ label, path }) => <NavigationItem key={`${label}-${path}`} label={label} path={path} />)}
    </Grid>
    <Grid item xs={6} sm={3}>
      <FooterSectionTitle title="Support" />
      {supportMenu.map(({ label, path }) => <NavigationItem key={`${label}-${path}`} label={label} path={path} />)}
    </Grid>
    <Grid item xs={6} sm={3}>
      <FooterSectionTitle title="Links" />
      {linkMenu.map(({ label, path }) => <NavigationItem key={`${label}-${path}`} label={label} path={path} />)}
    </Grid>
    <Grid item xs={6} sm={3}>
      <FooterSectionTitle title="Contact Us" />
      <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
        Questions about a course or practice exam?
      </Typography>
      <MuiLink href="mailto:support@coursespace.com" underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        support@coursespace.com
      </MuiLink>
    </Grid>
  </Grid>
)

export default FooterNavigation
