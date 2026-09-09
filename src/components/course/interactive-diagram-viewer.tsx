import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useState } from 'react'
import { type InteractiveHotspot } from '@/components/admin/admin-data'

type InteractiveDiagramViewerProps = {
  imageUrl?: string
  hotspots: InteractiveHotspot[]
  onViewed: () => void
}

const InteractiveDiagramViewer: FC<InteractiveDiagramViewerProps> = ({ imageUrl, hotspots, onViewed }) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(null)
  const [hasViewed, setHasViewed] = useState(false)
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null

  useEffect(() => {
    setSelectedHotspotId(null)
    setHasViewed(false)
  }, [imageUrl])

  const markViewed = () => {
    if (hasViewed) return
    setHasViewed(true)
    onViewed()
  }

  if (!imageUrl) return <Box sx={{ minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}><Typography color="text.secondary">This interactive lesson does not have an image yet.</Typography></Box>

  return <Stack direction={{ xs: 'column', xl: 'row' }} alignItems="stretch" sx={{ minHeight: { md: 380 } }}>
    <Box sx={{ position: 'relative', flex: 1, minWidth: 0, backgroundColor: 'background.default', lineHeight: 0 }}>
      <Box component="img" src={imageUrl} alt="Interactive lesson diagram" onLoad={markViewed} sx={{ display: 'block', width: '100%', maxHeight: { md: 620 }, objectFit: 'contain' }} />
      {hotspots.map((hotspot, index) => <Box key={hotspot.id} component="button" type="button" aria-pressed={selectedHotspotId === hotspot.id} aria-label={`Open hotspot ${index + 1}${hotspot.label ? `: ${hotspot.label}` : ''}`} onClick={() => setSelectedHotspotId(hotspot.id)} sx={{ position: 'absolute', left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)', display: 'grid', placeItems: 'center', width: 38, height: 38, p: 0, border: 3, borderColor: 'background.paper', borderRadius: '50%', backgroundColor: selectedHotspotId === hotspot.id ? 'secondary.main' : 'primary.main', color: 'primary.contrastText', fontWeight: 800, lineHeight: 1, cursor: 'pointer', boxShadow: 3, transition: 'transform 160ms ease, background-color 160ms ease', '&:hover': { transform: 'translate(-50%, -50%) scale(1.1)' }, '&:focus-visible': { outline: 3, outlineColor: 'primary.light' } }}>{index + 1}</Box>)}
    </Box>
    <Paper square elevation={0} sx={{ width: { xl: 300 }, flexShrink: 0, p: 2.5, borderTop: { xs: 1, xl: 0 }, borderLeft: { xl: 1 }, borderColor: 'divider', backgroundColor: 'background.paper', lineHeight: 'normal' }}>
      {selectedHotspot ? <Stack spacing={1}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Hotspot {hotspots.findIndex((hotspot) => hotspot.id === selectedHotspot.id) + 1}</Typography><Typography variant="h6">{selectedHotspot.label || 'Untitled hotspot'}</Typography><Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.7 }}>{selectedHotspot.explanation || 'No explanation has been added for this hotspot.'}</Typography></Stack> : <Stack spacing={1}><Typography variant="h6">Explore the diagram</Typography><Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.7 }}>{hotspots.length ? 'Select a numbered marker to learn more about that part of the image.' : 'No hotspots have been added to this diagram yet.'}</Typography></Stack>}
    </Paper>
  </Stack>
}

export default InteractiveDiagramViewer
