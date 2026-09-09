import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useRef, useState } from 'react'
import type { AdminLesson } from '@/components/admin/admin-data'
import { defaultStemLabConfig, getStemToolBySubtype, getStemToolsForSubject, STEM_LAB_REGISTRY } from './stem-lab-registry'
import { STEM_SUBJECT_LABELS, STEM_SUBJECTS, type StemActivityResult, type StemLabConfig, type StemSubject, type StemTool } from './stem-types'

export const getStemConfig = (lesson: Pick<AdminLesson, 'subtype' | 'config'>): StemLabConfig => {
  const definition = getStemToolBySubtype(lesson.subtype)
  return structuredClone(lesson.config ?? definition?.defaultConfig ?? STEM_LAB_REGISTRY[0].defaultConfig)
}

type AuthoringStage = 'subject' | 'tool' | 'configure' | 'preview' | 'publish'

export const StemLabEditor: FC<{ lesson: AdminLesson; updateLessonDraft: (lesson: AdminLesson) => void }> = ({ lesson, updateLessonDraft }) => {
  const definition = getStemToolBySubtype(lesson.subtype)
  const [selectedSubject, setSelectedSubject] = useState<StemSubject | undefined>(definition?.subject)
  const subject = definition?.subject ?? selectedSubject
  const config = getStemConfig(lesson)
  const [stage, setStage] = useState<AuthoringStage>(definition ? 'configure' : 'subject')
  const [previewed, setPreviewed] = useState(false)
  const ready = definition ? definition.isConfigured(config) : false

  useEffect(() => { setSelectedSubject(definition?.subject); setStage(definition ? 'configure' : 'subject'); setPreviewed(false) }, [lesson.id])

  const chooseSubject = (nextSubject: StemSubject) => {
    setSelectedSubject(nextSubject)
    updateLessonDraft({ ...lesson, subtype: undefined, config: undefined, stemLabPublished: false })
    setPreviewed(false)
    setStage('tool')
  }
  const chooseTool = (nextSubject: StemSubject, nextTool: StemTool) => {
    const nextConfig = defaultStemLabConfig(nextSubject, nextTool)
    const nextDefinition = getStemToolBySubtype(`${nextSubject}.${nextTool}`)
    updateLessonDraft({ ...lesson, subtype: nextDefinition?.subtype, config: nextConfig, stemLabPublished: false })
    setPreviewed(false)
    setStage('configure')
  }
  const updateConfig = (nextConfig: StemLabConfig) => {
    updateLessonDraft({ ...lesson, config: nextConfig, stemLabPublished: false })
    setPreviewed(false)
    setStage('configure')
  }

  return <Stack spacing={2.5}>
    <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>STEM Lab authoring</Typography><Typography variant="body2" color="text.secondary">Choose a subject, select one learning tool, configure it, preview it, and publish it with this lesson.</Typography></Box>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" aria-label="STEM Lab authoring steps"><Button variant={stage === 'subject' ? 'contained' : 'outlined'} onClick={() => setStage('subject')}>1. Subject</Button><Button variant={stage === 'tool' ? 'contained' : 'outlined'} disabled={!subject} onClick={() => setStage('tool')}>2. Tool</Button><Button variant={stage === 'configure' ? 'contained' : 'outlined'} disabled={!definition} onClick={() => setStage('configure')}>3. Configure</Button><Button variant={stage === 'preview' ? 'contained' : 'outlined'} disabled={!ready} onClick={() => { setPreviewed(true); setStage('preview') }}>4. Preview</Button><Button variant={stage === 'publish' ? 'contained' : 'outlined'} disabled={!previewed} onClick={() => setStage('publish')}>5. Publish</Button></Stack>
    {stage === 'subject' && <Stack spacing={1.5}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Choose a subject</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{STEM_SUBJECTS.map((item) => <Paper key={item} component="button" type="button" variant="outlined" onClick={() => chooseSubject(item)} sx={{ minHeight: 92, p: 2, textAlign: 'left', color: 'text.primary', backgroundColor: 'background.default', cursor: 'pointer', borderColor: subject === item ? 'primary.main' : 'divider', '&:hover': { borderColor: 'primary.main' } }}><Typography sx={{ fontWeight: 800 }}>{STEM_SUBJECT_LABELS[item]}</Typography><Typography variant="body2" color="text.secondary">{getStemToolsForSubject(item).length} available tools</Typography></Paper>)}</Box></Stack>}
    {stage === 'tool' && <Stack spacing={1.5}><FormControl fullWidth size="small"><InputLabel>Subject</InputLabel><Select label="Subject" value={subject ?? ''} onChange={(event) => chooseSubject(event.target.value as StemSubject)}>{STEM_SUBJECTS.map((item) => <MenuItem key={item} value={item}>{STEM_SUBJECT_LABELS[item]}</MenuItem>)}</Select></FormControl>{subject ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{getStemToolsForSubject(subject).map((item) => <Paper key={item.subtype} component="button" type="button" variant="outlined" onClick={() => chooseTool(item.subject, item.tool)} sx={{ minHeight: 92, display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, textAlign: 'left', color: 'text.primary', backgroundColor: 'background.default', cursor: 'pointer', borderColor: definition?.subtype === item.subtype ? 'primary.main' : 'divider', '&:hover': { borderColor: 'primary.main' } }}><Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box><Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 800 }}>{item.label}</Typography><Chip size="small" label={item.mode === 'build' ? 'Interactive build' : 'Embedded tool'} variant="outlined" /></Box></Paper>)}</Box> : <Typography color="text.secondary">Choose a subject first.</Typography>}</Stack>}
    {stage === 'configure' && (definition ? <Stack spacing={2}><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Configure {definition.label}</Typography><Typography variant="caption" color="text.secondary">Changes return this lab to draft until you preview and publish it again.</Typography></Box><Chip label={definition.mode === 'build' ? 'Interactive build' : 'Embedded tool'} size="small" /></Stack><definition.Builder lesson={lesson} config={config} onConfigChange={updateConfig} />{!ready && <Typography variant="caption" color="warning.main">Complete the required configuration before previewing this lab.</Typography>}</Stack> : <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">Choose a subject and tool before configuring this lab.</Typography></Paper>)}
    {stage === 'preview' && definition && ready && <Stack spacing={1.25}><Box><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Learner preview</Typography><Typography variant="caption" color="text.secondary">This preview does not record completion or progress.</Typography></Box><StemActivityPlayer lesson={lesson} preview onResult={() => undefined} /></Stack>}
    {stage === 'publish' && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1.25}><Box><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Ready to publish</Typography><Typography variant="body2" color="text.secondary">Publishing makes this {definition?.label ?? 'STEM'} activity available to learners when the lesson is saved.</Typography></Box><Button variant="contained" disabled={!previewed || lesson.stemLabPublished} onClick={() => updateLessonDraft({ ...lesson, stemLabPublished: true })} sx={{ alignSelf: 'flex-start' }}>{lesson.stemLabPublished ? 'STEM Lab published' : 'Publish STEM Lab'}</Button></Stack></Paper>}
  </Stack>
}

export const StemActivityPlayer: FC<{ lesson: Pick<AdminLesson, 'title' | 'subtype' | 'config'>; preview?: boolean; onResult: (result: StemActivityResult) => void }> = ({ lesson, preview = false, onResult }) => {
  const definition = getStemToolBySubtype(lesson.subtype)
  const config = getStemConfig(lesson)
  const completed = useRef(false)
  const [isComplete, setIsComplete] = useState(false)
  useEffect(() => { completed.current = false; setIsComplete(false) }, [lesson.subtype, lesson.title])
  const finish = (values: Record<string, unknown> = {}) => {
    if (preview || completed.current || !definition) return
    completed.current = true
    setIsComplete(true)
    onResult({ subtype: definition.subtype, values })
  }
  if (!definition) return <Paper variant="outlined" sx={{ p: 3 }}><Typography color="text.secondary">This STEM Lab tool is not recognized.</Typography></Paper>
  const Player = definition.Player
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2.25}><Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }} justifyContent="space-between" spacing={1}><Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>{STEM_SUBJECT_LABELS[definition.subject]} · {definition.label}</Typography><Typography variant="h6">{lesson.title}</Typography>{config.topic && <Typography variant="body2" color="text.secondary">{config.topic}</Typography>}</Box>{preview && <Chip label="Preview" color="info" />}</Stack><Typography color="text.secondary">{config.instructions}</Typography><Player config={config} onComplete={finish} />{isComplete && <Paper variant="outlined" sx={{ p: 1.25, borderColor: 'success.main', backgroundColor: 'success.light' }}><Stack direction="row" spacing={1} alignItems="center"><CheckCircleOutlineIcon color="success" /><Typography variant="body2" sx={{ fontWeight: 700 }}>Activity complete. Your lesson progress and XP have been updated.</Typography></Stack></Paper>}</Stack></Paper>
}
