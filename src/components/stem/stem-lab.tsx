import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import InteractiveHotspotEditor from '@/components/admin/interactive-hotspot-editor'
import { type AdminLesson } from '@/components/admin/admin-data'
import InteractiveDiagramViewer from '@/components/course/interactive-diagram-viewer'
import { STEM_SUBJECTS, getStemTool, getStemToolsForSubject, type StemActivityResult, type StemConfig, type StemSubject, type StemTool, type StemVariable } from './stem-types'

const createVariable = (id: number, name: string, label: string, initial = 0): StemVariable => ({ id, name, label, min: -10, max: 10, step: 1, initial })

export const createStemConfig = (tool?: StemTool): StemConfig => {
  if (tool === 'calculator') return { version: 1, instructions: 'Enter a value for each variable to calculate the result.', topic: '', formula: 'F = m × a', outputLabel: 'Result', variables: [createVariable(1, 'm', 'Mass', 1), createVariable(2, 'a', 'Acceleration', 1)] }
  if (tool === 'graph') return { version: 1, instructions: 'Move the parameter sliders to explore how they change the graph.', topic: '', formula: 'y = ax² + bx + c', outputLabel: 'y', variables: [createVariable(1, 'a', 'a', 1), createVariable(2, 'b', 'b', 0), createVariable(3, 'c', 'c', 0)] }
  return { version: 1, instructions: 'Explore the diagram to learn more about each labeled part.', topic: '', formula: '', outputLabel: 'Result', variables: [] }
}

export const getStemConfig = (lesson: Pick<AdminLesson, 'stemConfig' | 'stemTool'>): StemConfig => {
  const defaults = createStemConfig(lesson.stemTool)
  const config = lesson.stemConfig
  return {
    ...defaults,
    ...config,
    variables: config?.variables ?? defaults.variables,
  }
}

const nextVariableId = (variables: StemVariable[]) => Math.max(0, ...variables.map((variable) => variable.id)) + 1
const safeVariableName = (name: string) => name.replace(/[^a-zA-Z]/g, '')
const hasValidVariables = (variables: StemVariable[], reserveX = false) => variables.length > 0 && variables.every((variable) => variable.name && (!reserveX || variable.name.toLowerCase() !== 'x') && Number.isFinite(variable.min) && Number.isFinite(variable.max) && variable.min <= variable.max && Number.isFinite(variable.step) && variable.step > 0) && new Set(variables.map((variable) => variable.name.toLowerCase())).size === variables.length

const VariablesEditor: FC<{ variables: StemVariable[]; reserveX?: boolean; onChange: (variables: StemVariable[]) => void }> = ({ variables, reserveX = false, onChange }) => {
  const updateVariable = (id: number, changes: Partial<StemVariable>) => onChange(variables.map((variable) => variable.id === id ? { ...variable, ...changes } : variable))
  return <Stack spacing={1.25}>
    <Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Variables</Typography><Typography variant="caption" color="text.secondary">Names must match the formula exactly.{reserveX ? ' The x-axis value is reserved.' : ''}</Typography></Box>
    {variables.map((variable, index) => <Paper key={variable.id} variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
        <TextField size="small" label="Name" value={variable.name} inputProps={{ maxLength: 20 }} onChange={(event) => updateVariable(variable.id, { name: safeVariableName(event.target.value) })} sx={{ minWidth: { md: 100 } }} />
        <TextField size="small" label="Learner label" value={variable.label} onChange={(event) => updateVariable(variable.id, { label: event.target.value })} sx={{ flex: 1, minWidth: { md: 150 } }} />
        {(['min', 'max', 'step', 'initial'] as const).map((key) => <TextField key={key} size="small" type="number" label={key} value={variable[key]} onChange={(event) => updateVariable(variable.id, { [key]: Number(event.target.value) })} sx={{ width: { md: 88 } }} />)}
        <IconButton color="error" aria-label={`Remove variable ${index + 1}`} onClick={() => onChange(variables.filter((item) => item.id !== variable.id))}><DeleteOutlineIcon /></IconButton>
      </Stack>
    </Paper>)}
    <Button size="small" variant="text" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => onChange([...variables, createVariable(nextVariableId(variables), `v${variables.length + 1}`, `Variable ${variables.length + 1}`)])}>Add variable</Button>
  </Stack>
}

const expressionAfterAssignment = (formula: string) => formula.includes('=') ? formula.slice(formula.indexOf('=') + 1) : formula
const formulaLabel = (formula: string, fallback: string) => formula.includes('=') ? formula.slice(0, formula.indexOf('=')).trim() || fallback : fallback
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeExpression = (formula: string, variableNames: string[]) => {
  let expression = expressionAfterAssignment(formula)
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\s+/g, '')
  for (const name of [...variableNames].sort((first, second) => second.length - first.length)) {
    expression = expression.replace(new RegExp(`(${escapeRegex(name)})x(?=\\^|$|[+\\-*/)])`, 'g'), '$1*x')
  }
  return expression
}

export const evaluateStemFormula = (formula: string, values: Record<string, number>, variableNames = Object.keys(values)) => {
  const expression = normalizeExpression(formula, variableNames)
  if (!expression || !/^[0-9A-Za-z+\-*/^().]+$/.test(expression)) return Number.NaN
  const tokens = expression.match(/\d*\.?\d+|[A-Za-z]+|[()+\-*/^]/g) ?? []
  if (!tokens.length || tokens.join('') !== expression) return Number.NaN
  let index = 0
  const readPrimary = (): number => {
    const token = tokens[index++]
    if (token === '-') return -readPrimary()
    if (token === '+') return readPrimary()
    if (token === '(') {
      const value = readExpression()
      return tokens[index++] === ')' ? value : Number.NaN
    }
    if (token === undefined) return Number.NaN
    if (/^[A-Za-z]+$/.test(token)) return Number.isFinite(values[token]) ? values[token] : Number.NaN
    return Number(token)
  }
  const readPower = (): number => {
    const value = readPrimary()
    return tokens[index] === '^' ? value ** readPowerAfterOperator() : value
  }
  const readPowerAfterOperator = (): number => {
    index += 1
    return readPower()
  }
  const readTerm = (): number => {
    let value = readPower()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++]
      const next = readPower()
      value = operator === '*' ? value * next : value / next
    }
    return value
  }
  const readExpression = (): number => {
    let value = readTerm()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++]
      const next = readTerm()
      value = operator === '+' ? value + next : value - next
    }
    return value
  }
  const result = readExpression()
  return index === tokens.length && Number.isFinite(result) ? result : Number.NaN
}

const formatValue = (value: number) => Number.isFinite(value) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(value) : '—'

const isConfigured = (lesson: AdminLesson, config: StemConfig) => {
  if (lesson.stemTool === 'diagram') return Boolean(lesson.baseImageUrl && lesson.interactiveHotspots?.length)
  if (lesson.stemTool === 'calculator') return Boolean(config.formula.trim() && hasValidVariables(config.variables))
  if (lesson.stemTool === 'graph') return Boolean(config.formula.trim() && hasValidVariables(config.variables, true))
  return false
}

type AuthoringStage = 'choose' | 'configure' | 'preview' | 'publish'

export const StemLabEditor: FC<{ lesson: AdminLesson; updateLessonDraft: (lesson: AdminLesson) => void }> = ({ lesson, updateLessonDraft }) => {
  const [stage, setStage] = useState<AuthoringStage>('choose')
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const subject = lesson.stemSubject ?? 'Math'
  const tool = lesson.stemTool
  const config = getStemConfig(lesson)
  const ready = isConfigured(lesson, config)
  const selectedTool = getStemTool(subject, tool)

  useEffect(() => {
    setStage(tool ? 'configure' : 'choose')
    setHasPreviewed(false)
  }, [lesson.id])

  const updateConfiguration = (changes: Partial<StemConfig>) => {
    setHasPreviewed(false)
    setStage('configure')
    updateLessonDraft({ ...lesson, stemConfig: { ...config, ...changes }, stemLabPublished: false })
  }
  const chooseSubject = (nextSubject: StemSubject) => {
    setStage('choose')
    setHasPreviewed(false)
    updateLessonDraft({ ...lesson, stemSubject: nextSubject, stemTool: undefined, stemConfig: undefined, stemLabPublished: false })
  }
  const chooseTool = (nextTool: StemTool) => {
    setStage('configure')
    setHasPreviewed(false)
    updateLessonDraft({ ...lesson, stemSubject: subject, stemTool: nextTool, stemConfig: createStemConfig(nextTool), stemLabPublished: false })
  }

  return <Stack spacing={2.5}>
    <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>STEM Lab authoring</Typography><Typography variant="body2" color="text.secondary">Choose a subject tool, configure its learning interaction, preview it, then publish it to this lesson.</Typography></Box>
    <FormControl fullWidth><InputLabel>Lesson subject</InputLabel><Select label="Lesson subject" value={subject} onChange={(event) => chooseSubject(event.target.value as StemSubject)}>{STEM_SUBJECTS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" aria-label="STEM Lab authoring steps">
      <Button variant={stage === 'choose' ? 'contained' : 'outlined'} onClick={() => setStage('choose')}>1. Choose Tool</Button>
      <Button variant={stage === 'configure' ? 'contained' : 'outlined'} disabled={!tool} onClick={() => setStage('configure')}>2. Configure</Button>
      <Button variant={stage === 'preview' ? 'contained' : 'outlined'} disabled={!tool || !ready} onClick={() => { setHasPreviewed(true); setStage('preview') }}>3. Preview</Button>
      <Button variant={stage === 'publish' ? 'contained' : 'outlined'} disabled={!hasPreviewed} onClick={() => setStage('publish')}>4. Publish</Button>
    </Stack>

    {stage === 'choose' && <Stack spacing={1.25}>
      <Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tools for {subject}</Typography><Typography variant="caption" color="text.secondary">Only tools planned for this subject are shown. Coming Soon tools cannot be selected.</Typography></Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
        {getStemToolsForSubject(subject).map((item) => <Paper key={item.type} variant="outlined" component="button" type="button" disabled={!item.available} onClick={() => item.available && chooseTool(item.type)} sx={{ minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.25, borderColor: tool === item.type ? 'primary.main' : 'divider', backgroundColor: tool === item.type ? 'action.selected' : 'background.default', color: item.available ? 'text.primary' : 'text.disabled', cursor: item.available ? 'pointer' : 'not-allowed', font: 'inherit', textAlign: 'left', opacity: item.available ? 1 : 0.72, '&:hover': item.available ? { borderColor: 'primary.main' } : {} }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography><Chip size="small" label={item.available ? (tool === item.type ? 'Selected' : 'Available') : 'Coming Soon'} color={item.available ? 'primary' : 'default'} variant={tool === item.type ? 'filled' : 'outlined'} />
        </Paper>)}
      </Box>
    </Stack>}

    {stage === 'configure' && (tool && selectedTool?.available ? <Stack spacing={2}>
      <Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Configure {selectedTool.label}</Typography><Typography variant="caption" color="text.secondary">Changes return this lab to draft until it is previewed and published again.</Typography></Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth size="small" label="Topic" placeholder="e.g. Newton's second law" value={config.topic} onChange={(event) => updateConfiguration({ topic: event.target.value })} /><TextField fullWidth size="small" label="Learner instructions" value={config.instructions} onChange={(event) => updateConfiguration({ instructions: event.target.value })} /></Stack>
      {tool === 'diagram' && <InteractiveHotspotEditor lesson={lesson} onChange={(nextLesson) => { setHasPreviewed(false); updateLessonDraft({ ...nextLesson, stemConfig: config, stemLabPublished: false }) }} />}
      {tool === 'calculator' && <Stack spacing={2}><TextField fullWidth label="Formula" value={config.formula} onChange={(event) => updateConfiguration({ formula: event.target.value })} helperText="Use named variables and an optional result label, for example F = m × a. Supports +, −, ×, ÷, parentheses, and ^." /><TextField fullWidth size="small" label="Result label when no formula label is used" value={config.outputLabel} onChange={(event) => updateConfiguration({ outputLabel: event.target.value })} /><VariablesEditor variables={config.variables} onChange={(variables) => updateConfiguration({ variables })} /></Stack>}
      {tool === 'graph' && <Stack spacing={2}><TextField fullWidth label="Function" value={config.formula} onChange={(event) => updateConfiguration({ formula: event.target.value })} helperText="For example y = ax² + bx + c. The x-axis value is supplied by the graph. Supports +, −, ×, ÷, parentheses, and ^." /><VariablesEditor variables={config.variables} reserveX onChange={(variables) => updateConfiguration({ variables })} /></Stack>}
      {!ready && <Typography variant="caption" color="warning.main">Finish the required configuration before previewing: {tool === 'diagram' ? 'upload an image and add at least one hotspot.' : 'add a valid formula and uniquely named variables with valid ranges.'}</Typography>}
    </Stack> : <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">Choose an available tool before configuring this lab.</Typography></Paper>)}

    {stage === 'preview' && tool && ready && <Stack spacing={1.25}><Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Learner preview</Typography><Typography variant="caption" color="text.secondary">This preview does not record progress or award XP.</Typography></Box><StemActivityPlayer lesson={lesson} preview onResult={() => undefined} /></Stack>}

    {stage === 'publish' && <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1.25}><Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ready to publish</Typography><Typography variant="body2" color="text.secondary">Publishing makes this configured {selectedTool?.label ?? 'STEM'} activity available to learners when you save the lesson.</Typography></Box><Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={!hasPreviewed || lesson.stemLabPublished} onClick={() => updateLessonDraft({ ...lesson, stemLabPublished: true })}>{lesson.stemLabPublished ? 'STEM Lab published' : 'Publish STEM Lab'}</Button>{!hasPreviewed && <Typography variant="caption" color="warning.main">Preview the activity before publishing it.</Typography>}</Stack></Paper>}
  </Stack>
}

const CompletionNotice: FC<{ complete: boolean; preview: boolean }> = ({ complete, preview }) => complete && !preview ? <Paper variant="outlined" sx={{ p: 1.25, borderColor: 'success.main', backgroundColor: 'success.light' }}><Stack direction="row" spacing={1} alignItems="center"><CheckCircleOutlineIcon color="success" /><Typography variant="body2" sx={{ fontWeight: 700 }}>Activity complete. Your lesson progress and XP have been updated.</Typography></Stack></Paper> : null

const CalculatorPlayer: FC<{ config: StemConfig; onInteraction: (values: Record<string, number>) => void }> = ({ config, onInteraction }) => {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  useEffect(() => setInputs(Object.fromEntries(config.variables.map((variable) => [variable.name, '']))), [config.variables])
  const values = useMemo(() => Object.fromEntries(config.variables.map((variable) => [variable.name, Number(inputs[variable.name])])), [config.variables, inputs])
  const validValues = config.variables.every((variable) => inputs[variable.name]?.trim() !== '' && Number.isFinite(values[variable.name]))
  const result = validValues ? evaluateStemFormula(config.formula, values, config.variables.map((variable) => variable.name)) : Number.NaN
  const updateInput = (name: string, value: string) => {
    const nextInputs = { ...inputs, [name]: value }
    setInputs(nextInputs)
    onInteraction(Object.fromEntries(config.variables.map((variable) => [variable.name, Number(nextInputs[variable.name]) || 0])))
  }
  return <Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Live calculation</Typography><Typography variant="h5" sx={{ mt: 0.25 }}>{formulaLabel(config.formula, config.outputLabel)} = {formatValue(result)}</Typography></Paper>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>{config.variables.map((variable) => <TextField key={variable.id} fullWidth type="number" label={variable.label || variable.name} value={inputs[variable.name] ?? ''} onChange={(event) => updateInput(variable.name, event.target.value)} inputProps={{ step: 'any' }} helperText={variable.label === variable.name ? undefined : variable.name} />)}</Box>
    {!validValues && <Typography variant="caption" color="text.secondary">Enter a number for every variable to calculate the result.</Typography>}
    {validValues && !Number.isFinite(result) && <Typography variant="caption" color="error">This formula cannot be calculated with the entered values.</Typography>}
  </Stack>
}

const graphWidth = 640
const graphHeight = 360
const graphRange = 10
const graphX = (value: number) => ((value + graphRange) / (graphRange * 2)) * graphWidth
const graphY = (value: number) => graphHeight - ((value + graphRange) / (graphRange * 2)) * graphHeight

const GraphPlayer: FC<{ config: StemConfig; onInteraction: (values: Record<string, number>) => void }> = ({ config, onInteraction }) => {
  const [values, setValues] = useState<Record<string, number>>({})
  useEffect(() => setValues(Object.fromEntries(config.variables.map((variable) => [variable.name, variable.initial]))), [config.variables])
  const segments = useMemo(() => {
    const names = [...config.variables.map((variable) => variable.name), 'x']
    const paths: string[][] = [[]]
    for (let index = 0; index <= 240; index += 1) {
      const x = -graphRange + index / 12
      const y = evaluateStemFormula(config.formula, { ...values, x }, names)
      const visible = Number.isFinite(y) && Math.abs(y) <= graphRange * 3
      if (!visible) {
        if (paths[paths.length - 1]?.length) paths.push([])
        continue
      }
      paths[paths.length - 1]?.push(`${graphX(x).toFixed(2)},${graphY(y).toFixed(2)}`)
    }
    return paths.filter((path) => path.length > 1).map((path) => path.join(' '))
  }, [config.formula, config.variables, values])
  const updateValue = (name: string, value: number) => {
    const nextValues = { ...values, [name]: value }
    setValues(nextValues)
    onInteraction(nextValues)
  }
  return <Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, backgroundColor: 'background.default' }}><Box component="svg" viewBox={`0 0 ${graphWidth} ${graphHeight}`} role="img" aria-label="Live function graph" sx={{ display: 'block', width: '100%', minHeight: 260, backgroundColor: 'background.paper', borderRadius: 1 }}>
      {[-10, -5, 0, 5, 10].map((value) => <g key={value}><line x1={graphX(value)} x2={graphX(value)} y1={0} y2={graphHeight} stroke={value === 0 ? 'currentColor' : '#d9e1e5'} strokeWidth={value === 0 ? 2 : 1} /><line x1={0} x2={graphWidth} y1={graphY(value)} y2={graphY(value)} stroke={value === 0 ? 'currentColor' : '#d9e1e5'} strokeWidth={value === 0 ? 2 : 1} /><text x={graphX(value)} y={graphY(0) + 18} textAnchor="middle" fontSize="12" fill="currentColor">{value}</text>{value !== 0 && <text x={graphX(0) + 8} y={graphY(value) + 4} fontSize="12" fill="currentColor">{value}</text>}</g>)}
      {segments.map((points, index) => <polyline key={index} points={points} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />)}
    </Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>x and y range from −10 to 10 · {formulaLabel(config.formula, 'y')} = {expressionAfterAssignment(config.formula)}</Typography></Paper>
    <Stack spacing={2}>{config.variables.map((variable) => <Box key={variable.id}><Stack direction="row" justifyContent="space-between" spacing={1}><Typography variant="body2" sx={{ fontWeight: 700 }}>{variable.label || variable.name}</Typography><Typography variant="body2" color="primary.main">{formatValue(values[variable.name] ?? variable.initial)}</Typography></Stack><Slider aria-label={`${variable.label || variable.name} parameter`} value={values[variable.name] ?? variable.initial} min={variable.min} max={variable.max} step={variable.step} onChange={(_, value) => updateValue(variable.name, Array.isArray(value) ? value[0] : value)} valueLabelDisplay="auto" /></Box>)}</Stack>
    {!segments.length && <Typography variant="caption" color="warning.main">The function has no visible values in the current graph range.</Typography>}
  </Stack>
}

export const StemActivityPlayer: FC<{ lesson: Pick<AdminLesson, 'title' | 'stemSubject' | 'stemTool' | 'stemConfig' | 'baseImageUrl' | 'interactiveHotspots'>; preview?: boolean; onResult: (result: StemActivityResult) => void }> = ({ lesson, preview = false, onResult }) => {
  const config = getStemConfig(lesson)
  const [complete, setComplete] = useState(false)
  const completed = useRef(false)
  const finish = (values: Record<string, number> = {}) => {
    if (preview || completed.current || !lesson.stemTool) return
    completed.current = true
    setComplete(true)
    onResult({ tool: lesson.stemTool, values })
  }
  useEffect(() => { completed.current = false; setComplete(false) }, [lesson.title, lesson.stemTool])
  const tool = getStemTool(lesson.stemSubject, lesson.stemTool)
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.paper' }}><Stack spacing={2.25}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>{lesson.stemSubject} · {tool?.label ?? 'STEM Lab'}</Typography><Typography variant="h6">{lesson.title}</Typography>{config.topic && <Typography variant="body2" color="text.secondary">{config.topic}</Typography>}</Box>{preview && <Chip label="Preview" color="info" sx={{ alignSelf: 'flex-start' }} />}</Stack>
    <Typography color="text.secondary">{config.instructions}</Typography>
    {lesson.stemTool === 'diagram' ? lesson.baseImageUrl ? <InteractiveDiagramViewer imageUrl={lesson.baseImageUrl} hotspots={lesson.interactiveHotspots ?? []} onViewed={() => finish()} /> : <Typography color="text.secondary">This diagram is not ready yet.</Typography> : lesson.stemTool === 'calculator' ? <CalculatorPlayer config={config} onInteraction={finish} /> : lesson.stemTool === 'graph' ? <GraphPlayer config={config} onInteraction={finish} /> : <Typography color="text.secondary">This STEM tool is coming soon.</Typography>}
    <CompletionNotice complete={complete} preview={preview} />
  </Stack></Paper>
}
