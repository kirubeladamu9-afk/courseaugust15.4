import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import { toast } from '@/components/toast'
import { type AdminLesson, type InteractiveHotspot } from './admin-data'

type Point = { x: number; y: number }

const clamp = (value: number) => Math.max(0, Math.min(100, value))

const createHotspot = (id: number, point: Point): InteractiveHotspot => ({ id, x: point.x, y: point.y, label: '', explanation: '' })

const readPoint = (event: React.PointerEvent<HTMLElement>, container: HTMLElement): Point => {
  const bounds = container.getBoundingClientRect()
  return {
    x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
    y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
  }
}

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])

const InteractiveHotspotEditor: FC<{ lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }> = ({ lesson, onChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const activeHotspotId = useRef<number | null>(null)
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(lesson.interactiveHotspots?.[0]?.id ?? null)
  const hotspots = lesson.interactiveHotspots ?? []
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null

  const updateHotspots = (nextHotspots: InteractiveHotspot[]) => onChange({ ...lesson, interactiveHotspots: nextHotspots })
  const updateHotspot = (id: number, values: Partial<InteractiveHotspot>) => updateHotspots(hotspots.map((hotspot) => hotspot.id === id ? { ...hotspot, ...values } : hotspot))

  const addHotspotAt = (point: Point) => {
    const hotspot = createHotspot(Math.max(0, ...hotspots.map((item) => item.id)) + 1, point)
    updateHotspots([...hotspots, hotspot])
    setSelectedHotspotId(hotspot.id)
  }

  const handleImage = (file: File) => {
    if (!imageTypes.has(file.type)) {
      toast.add({ title: 'Unsupported image', description: 'Choose a JPG, PNG, GIF, WebP, or AVIF image.', type: 'error' })
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.add({ title: 'Image is too large', description: 'Choose an image smaller than 6 MB.', type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange({ ...lesson, baseImageUrl: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const beginMove = (event: React.PointerEvent<HTMLButtonElement>, hotspotId: number) => {
    event.stopPropagation()
    activeHotspotId.current = hotspotId
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedHotspotId(hotspotId)
  }
  const moveHotspot = (event: React.PointerEvent<HTMLButtonElement>) => {
    const hotspotId = activeHotspotId.current
    if (hotspotId === null || !canvasRef.current) return
    event.preventDefault()
    updateHotspot(hotspotId, readPoint(event, canvasRef.current))
  }
  const endMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    activeHotspotId.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return <Stack spacing={2}>
    <Box component="label" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, minHeight: 112, p: 2, border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, color: 'text.secondary', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
      <UploadFileOutlinedIcon color="primary" />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{lesson.baseImageUrl ? 'Replace base image' : 'Upload a base image'}</Typography>
      <Typography variant="caption">JPG, PNG, GIF, WebP, or AVIF · 6 MB maximum</Typography>
      <input hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" onChange={(event: ChangeEvent<HTMLInputElement>) => { const [file] = Array.from(event.target.files ?? []); if (file) handleImage(file); event.target.value = '' }} aria-label="Upload interactive lesson image" />
    </Box>

    {lesson.baseImageUrl ? <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Click the image to add a hotspot. Drag a marker to reposition it.</Typography>
      <Box ref={canvasRef} onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) addHotspotAt(readPoint(event, event.currentTarget)) }} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1.5, border: 1, borderColor: 'divider', lineHeight: 0, touchAction: 'none', cursor: 'crosshair' }}>
        <Box component="img" src={lesson.baseImageUrl} alt="Interactive lesson base" sx={{ display: 'block', width: '100%', maxHeight: 440, objectFit: 'contain', backgroundColor: 'background.default', userSelect: 'none', pointerEvents: 'none' }} />
        {hotspots.map((hotspot, index) => <Box key={hotspot.id} component="button" type="button" aria-label={`Hotspot ${index + 1}${hotspot.label ? `: ${hotspot.label}` : ''}`} onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => beginMove(event, hotspot.id)} onPointerMove={moveHotspot} onPointerUp={endMove} onPointerCancel={endMove} sx={{ position: 'absolute', left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)', width: 34, height: 34, border: 3, borderColor: 'background.paper', borderRadius: '50%', backgroundColor: selectedHotspotId === hotspot.id ? 'secondary.main' : 'primary.main', color: 'primary.contrastText', fontWeight: 800, lineHeight: 1, cursor: 'grab', boxShadow: 2, '&:active': { cursor: 'grabbing' }, '&:focus-visible': { outline: 3, outlineColor: 'primary.light' } }}>{index + 1}</Box>)}
      </Box>
    </Box> : <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}><Typography color="text.secondary" variant="body2">Upload an image to place interactive hotspots.</Typography></Paper>}

    <Stack spacing={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Hotspots ({hotspots.length})</Typography>{lesson.baseImageUrl && <Button size="small" onClick={() => addHotspotAt({ x: 50, y: 50 })}>Add hotspot</Button>}</Box>
      {selectedHotspot ? <Paper variant="outlined" sx={{ p: 1.5 }}><Stack spacing={1.25}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Hotspot {hotspots.findIndex((hotspot) => hotspot.id === selectedHotspot.id) + 1}</Typography><IconButton size="small" color="error" aria-label="Remove selected hotspot" onClick={() => { const remaining = hotspots.filter((hotspot) => hotspot.id !== selectedHotspot.id); updateHotspots(remaining); setSelectedHotspotId(remaining[0]?.id ?? null) }}><DeleteOutlineIcon fontSize="small" /></IconButton></Box><TextField fullWidth size="small" label="Short label" value={selectedHotspot.label} onChange={(event) => updateHotspot(selectedHotspot.id, { label: event.target.value })} /><TextField fullWidth size="small" multiline minRows={3} label="Click explanation" value={selectedHotspot.explanation} onChange={(event) => updateHotspot(selectedHotspot.id, { explanation: event.target.value })} /></Stack></Paper> : <Typography color="text.secondary" variant="body2">Select or add a hotspot to define its label and explanation.</Typography>}
      {hotspots.length > 1 && <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>{hotspots.map((hotspot, index) => <Button key={hotspot.id} size="small" variant={selectedHotspotId === hotspot.id ? 'contained' : 'outlined'} onClick={() => setSelectedHotspotId(hotspot.id)}>Hotspot {index + 1}</Button>)}</Stack>}
    </Stack>
  </Stack>
}

export default InteractiveHotspotEditor
