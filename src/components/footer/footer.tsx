import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import FooterNavigation from './footer-navigation'
import FooterSocialLinks from './footer-social-links'

const Footer: FC = () => {
  return (
    <Box component="footer" sx={{ backgroundColor: 'background.paper', color: 'text.primary', borderTop: 1, borderColor: 'divider' }}>
      <Container sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ maxWidth: 300 }}>
              <Typography component="h2" variant="h4" sx={{ mb: 1.5, fontWeight: 700 }}>Coursespace</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5, lineHeight: 1.7 }}>
                Coursespace is an online learning platform helping students build real skills through live tutor-led classes.
              </Typography>
              <FooterSocialLinks />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <FooterNavigation />
          </Grid>
        </Grid>
      </Container>
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Container sx={{ py: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Typography color="text.secondary" variant="caption">© {new Date().getFullYear()} EKD Tech Solutions. All rights reserved.</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 } }}>
              <MuiLink href="/about-us" underline="hover" color="text.secondary" variant="caption">Privacy Policy</MuiLink>
              <MuiLink href="/about-us" underline="hover" color="text.secondary" variant="caption">Terms of Use</MuiLink>
              <MuiLink href="/about-us" underline="hover" color="text.secondary" variant="caption">Legal</MuiLink>
              <MuiLink href="/practice-exams" underline="hover" color="text.secondary" variant="caption">Site Map</MuiLink>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Footer
