import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
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
import { type FC, useEffect, useMemo, useState } from 'react'
import InteractiveDiagramViewer from '@/components/course/interactive-diagram-viewer'
import { type AdminLesson, type StemSubject, type StemTool } from '@/components/admin/admin-data'

export type StemVariable = { id: number; name: string; label: string; min: number; max: number; step: number; initial: number }
export type StemItem = { id: number; label: string; detail: string }
export type StemQuestion = { id: number; prompt: string; options: string[]; correctAnswer: string }
export type StemConfig = {
  version: 1
  instructions: string
  topic: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  completionScore: number
  maxAttempts: number
  timeLimitSeconds: number
  formula: string
  outputLabel: string
  targetValue: number
  variables: StemVariable[]
  items: StemItem[]
  procedure: StemItem[]
  questions: StemQuestion[]
}

const tools: Array<{ type: StemTool; label: string }> = [
  { type: 'graph', label: 'Graphing' }, { type: 'simulation', label: 'Simulation' }, { type: 'virtual-lab', label: 'Virtual Lab' }, { type: 'diagram', label: 'Diagram' },
  { type: 'calculator', label: 'Calculator' }, { type: 'builder', label: 'Builder' }, { type: 'experiment', label: 'Experiment' }, { type: 'game', label: 'Game' },
]

const defaultConfig = (): StemConfig => ({ version: 1, instructions: 'Explore the activity and submit your result when you are ready.', topic: '', difficulty: 'Beginner', completionScore: 70, maxAttempts: 3, timeLimitSeconds: 0, formula: 'x * x', outputLabel: 'Result', targetValue: 0, variables: [{ id: 1, name: 'x', label: 'Input', min: -10, max: 10, step: 1, initial: 0 }], items: [{ id: 1, label: 'Item 1', detail: '' }], procedure: [{ id: 1, label: 'Step 1', detail: '' }], questions: [{ id: 1, prompt: 'What is the correct outcome?', options: [''], correctAnswer: '' }] })

export const getStemConfig = (lesson: Pick<AdminLesson, 'stemConfig'>): StemConfig => ({ ...defaultConfig(), ...(lesson.stemConfig ?? {}), variables: lesson.stemConfig?.variables ?? defaultConfig().variables, items: lesson.stemConfig?.items ?? defaultConfig().items, procedure: lesson.stemConfig?.procedure ?? defaultConfig().procedure, questions: lesson.stemConfig?.questions ?? defaultConfig().questions })

const updateConfig = (lesson: AdminLesson, update: Partial<StemConfig>, onChange: (lesson: AdminLesson) => void) => onChange({ ...lesson, stemConfig: { ...getStemConfig(lesson), ...update } })

const validToolsForSubject = (_subject: StemSubject) => tools

const ConfigItems: FC<{ title: string; items: StemItem[]; onChange: (items: StemItem[]) => void }> = ({ title, items, onChange }) => <Stack spacing={1}><Typography variant="subtitle2">{title}</Typography>{items.map((item, index) => <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center"><TextField size="small" fullWidth label={`${title} ${index + 1}`} value={item.label} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, label: event.target.value } : current))} /><TextField size="small" fullWidth label="Instruction or detail" value={item.detail} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, detail: event.target.value } : current))} /><IconButton aria-label={`Remove ${title} ${index + 1}`} color="error" onClick={() => onChange(items.filter((current) => current.id !== item.id))}><DeleteOutlineIcon /></IconButton></Stack>)}<Button size="small" variant="text" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => onChange([...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, label: '', detail: '' }])}>Add {title.slice(0, -1)}</Button></Stack>

const ConfigQuestions: FC<{ questions: StemQuestion[]; onChange: (questions: StemQuestion[]) => void }> = ({ questions, onChange }) => <Stack spacing={1}><Typography variant="subtitle2">Challenge questions</Typography>{questions.map((question, index) => <Paper key={question.id} variant="outlined" sx={{ p: 1.5 }}><Stack spacing={1}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" sx={{ fontWeight: 700 }}>Question {index + 1}</Typography><IconButton aria-label={`Remove question ${index + 1}`} color="error" onClick={() => onChange(questions.filter((current) => current.id !== question.id))}><DeleteOutlineIcon /></IconButton></Stack><TextField size="small" label="Prompt" value={question.prompt} onChange={(event) => onChange(questions.map((current) => current.id === question.id ? { ...current, prompt: event.target.value } : current))} /><TextField size="small" label="Choices (one per line)" multiline minRows={2} value={question.options.join('\n')} onChange={(event) => onChange(questions.map((current) => current.id === question.id ? { ...current, options: event.target.value.split('\n') } : current))} /><TextField size="small" label="Correct outcome" value={question.correctAnswer} onChange={(event) => onChange(questions.map((current) => current.id === question.id ? { ...current, correctAnswer: event.target.value } : current))} /></Stack></Paper>)}<Button size="small" variant="text" startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => onChange([...questions, { id: Math.max(0, ...questions.map((question) => question.id)) + 1, prompt: '', options: [''], correctAnswer: '' }])}>Add question</Button></Stack>

export const StemLabEditor: FC<{ lesson: AdminLesson; updateLessonDraft: (lesson: AdminLesson) => void }> = ({ lesson, updateLessonDraft }) => {
  const [preview, setPreview] = useState(false)
  const config = getStemConfig(lesson)
  const subject = lesson.stemSubject ?? 'Math'
  const tool = lesson.stemTool
  const selectTool = (stemTool: StemTool) => updateLessonDraft({ ...lesson, stemSubject: subject, stemTool, stemLabPublished: false, stemConfig: getStemConfig(lesson) })
  const update = (values: Partial<StemConfig>) => updateConfig(lesson, values, updateLessonDraft)
  const usesFormula = ['graph', 'simulation', 'calculator', 'experiment'].includes(tool ?? '')
  const usesItems = ['builder', 'diagram'].includes(tool ?? '')
  const usesProcedure = ['virtual-lab', 'experiment'].includes(tool ?? '')
  const usesQuestions = ['game', 'virtual-lab', 'experiment'].includes(tool ?? '')
  return <Stack spacing={2}><Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>STEM Lab</Typography><Typography variant="body2" color="text.secondary">Choose a subject and tool, then configure the reusable activity without code.</Typography></Box><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><FormControl fullWidth><InputLabel>Subject</InputLabel><Select label="Subject" value={subject} onChange={(event) => updateLessonDraft({ ...lesson, stemSubject: event.target.value as StemSubject, stemTool: undefined, stemLabPublished: false })}>{(['Math', 'Physics', 'Chemistry', 'Biology'] as StemSubject[]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel>Difficulty</InputLabel><Select label="Difficulty" value={config.difficulty} onChange={(event) => update({ difficulty: event.target.value as StemConfig['difficulty'] })}>{['Beginner', 'Intermediate', 'Advanced'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl></Stack><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{validToolsForSubject(subject).map((item) => <Button key={item.type} variant={tool === item.type ? 'contained' : 'outlined'} onClick={() => selectTool(item.type)} sx={{ justifyContent: 'space-between' }}>{item.label}<Chip size="small" label="Ready" color={tool === item.type ? 'default' : 'primary'} /></Button>)}</Box>{tool && <><Stack direction="row" spacing={1}><Button variant={preview ? 'outlined' : 'contained'} onClick={() => setPreview(false)}>Configure</Button><Button variant={preview ? 'contained' : 'outlined'} onClick={() => setPreview(true)}>Preview</Button></Stack>{preview ? <StemActivityPlayer lesson={{ ...lesson, stemConfig: config }} preview onResult={() => undefined} /> : <Stack spacing={2}><TextField fullWidth label="Learner instructions" multiline minRows={2} value={config.instructions} onChange={(event) => update({ instructions: event.target.value })} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth label="Topic for reporting" value={config.topic} onChange={(event) => update({ topic: event.target.value })} /><TextField fullWidth type="number" label="Completion score (%)" inputProps={{ min: 0, max: 100 }} value={config.completionScore} onChange={(event) => update({ completionScore: Math.max(0, Math.min(100, Number(event.target.value))) })} /><TextField fullWidth type="number" label="Attempt limit" inputProps={{ min: 1, max: 20 }} value={config.maxAttempts} onChange={(event) => update({ maxAttempts: Math.max(1, Math.min(20, Number(event.target.value))) })} /><TextField fullWidth type="number" label="Time limit (seconds, 0 = none)" inputProps={{ min: 0, max: 7200 }} value={config.timeLimitSeconds} onChange={(event) => update({ timeLimitSeconds: Math.max(0, Math.min(7200, Number(event.target.value))) })} /></Stack>{usesFormula && <Stack spacing={1}><Typography variant="subtitle2">Formula engine</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth label="Formula" helperText="Use numbers, + − × ÷, parentheses, and variable names." value={config.formula} onChange={(event) => update({ formula: event.target.value })} /><TextField fullWidth label="Output label" value={config.outputLabel} onChange={(event) => update({ outputLabel: event.target.value })} /><TextField fullWidth type="number" label="Target value (optional)" value={config.targetValue} onChange={(event) => update({ targetValue: Number(event.target.value) })} /></Stack><Typography variant="caption" color="text.secondary">For graphing, use x (for example x * x - 4). Simulations and experiments can use the variables below.</Typography><ConfigItems title="Variables" items={config.variables.map((variable) => ({ id: variable.id, label: variable.name, detail: variable.label }))} onChange={(items) => update({ variables: items.map((item, index) => ({ ...config.variables[index], id: item.id, name: item.label.replace(/[^a-zA-Z]/g, '').slice(0, 12) || `v${index + 1}`, label: item.detail || item.label, min: config.variables[index]?.min ?? 0, max: config.variables[index]?.max ?? 100, step: config.variables[index]?.step ?? 1, initial: config.variables[index]?.initial ?? 0 })) })} /></Stack>}{usesItems && <ConfigItems title={tool === 'diagram' ? 'Regions' : 'Objects'} items={config.items} onChange={(items) => update({ items })} />}{usesProcedure && <ConfigItems title="Procedure steps" items={config.procedure} onChange={(procedure) => update({ procedure })} />}{usesQuestions && <ConfigQuestions questions={config.questions} onChange={(questions) => update({ questions })} />}<Button variant={lesson.stemLabPublished ? 'outlined' : 'contained'} startIcon={<CheckCircleOutlineIcon />} onClick={() => updateLessonDraft({ ...lesson, stemConfig: config, stemLabPublished: !lesson.stemLabPublished })}>{lesson.stemLabPublished ? 'Published — click to unpublish' : 'Publish STEM Lab'}</Button></Stack>}</>}</Stack>
}

const tokenize = (formula: string, variables: Record<string, number>) => formula.replace(/\s+/g, '').replace(/[a-zA-Z]+/g, (name) => String(variables[name] ?? 'NaN')).match(/\d*\.?\d+|[()+\-*/]/g) ?? []
const evaluateFormula = (formula: string, variables: Record<string, number>) => {
  const tokens = tokenize(formula, variables)
  let index = 0
  const expression = (): number => { let value = term(); while (tokens[index] === '+' || tokens[index] === '-') { const operator = tokens[index++]; const next = term(); value = operator === '+' ? value + next : value - next } return value }
  const term = (): number => { let value = factor(); while (tokens[index] === '*' || tokens[index] === '/') { const operator = tokens[index++]; const next = factor(); value = operator === '*' ? value * next : value / next } return value }
  const factor = (): number => { const token = tokens[index++]; if (token === '-') return -factor(); if (token === '(') { const value = expression(); if (tokens[index++] !== ')') return NaN; return value } return token === undefined ? NaN : Number(token) }
  const result = expression()
  return index === tokens.length && Number.isFinite(result) ? result : NaN
}

const FormulaControls: FC<{ config: StemConfig; onValuesChange: (values: Record<string, number>) => void }> = ({ config, onValuesChange }) => {
  const [values, setValues] = useState(() => Object.fromEntries(config.variables.map((variable) => [variable.name, variable.initial])))
  useEffect(() => { const next = Object.fromEntries(config.variables.map((variable) => [variable.name, variable.initial])); setValues(next); onValuesChange(next) }, [config.variables])
  return <Stack spacing={2}>{config.variables.map((variable) => <Box key={variable.id}><Stack direction="row" justifyContent="space-between"><Typography variant="body2" sx={{ fontWeight: 700 }}>{variable.label}</Typography><Typography variant="body2">{values[variable.name]}</Typography></Stack><Slider value={values[variable.name] ?? variable.initial} min={variable.min} max={variable.max} step={variable.step} valueLabelDisplay="auto" onChange={(_, value) => { const next = { ...values, [variable.name]: Number(value) }; setValues(next); onValuesChange(next) }} /></Box>)}</Stack>
}

export const StemActivityPlayer: FC<{ lesson: Pick<AdminLesson, 'title' | 'stemSubject' | 'stemTool' | 'stemConfig' | 'baseImageUrl' | 'interactiveHotspots'>; preview?: boolean; onResult: (interaction: Record<string, unknown>) => void }> = ({ lesson, preview = false, onResult }) => {
  const config = getStemConfig(lesson)
  const [values, setValues] = useState<Record<string, number>>({})
  const [expression, setExpression] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [seconds, setSeconds] = useState(config.timeLimitSeconds)
  const result = useMemo(() => evaluateFormula(config.formula, values), [config.formula, values])
  useEffect(() => { setSeconds(config.timeLimitSeconds) }, [config.timeLimitSeconds, lesson.title])
  useEffect(() => { if (!config.timeLimitSeconds || seconds <= 0 || preview) return; const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000); return () => window.clearInterval(timer) }, [config.timeLimitSeconds, preview, seconds])
  const submit = () => onResult({ values, expression, selected, answers, displayedResult: result, timedOut: config.timeLimitSeconds > 0 && seconds <= 0 })
  const type = lesson.stemTool
  const isFormula = ['graph', 'simulation', 'calculator', 'experiment'].includes(type ?? '')
  const graphPoints = useMemo(() => Array.from({ length: 81 }, (_, index) => { const x = index / 4 - 10; const y = evaluateFormula(config.formula, { ...values, x }); return Number.isFinite(y) ? `${(x + 10) * 15},${150 - Math.max(-10, Math.min(10, y)) * 15}` : '' }).filter(Boolean).join(' '), [config.formula, values])
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.paper' }}><Stack spacing={2}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>{lesson.stemSubject} · {tools.find((tool) => tool.type === type)?.label}</Typography><Typography variant="h6">{lesson.title}</Typography></Box><Stack direction="row" spacing={1}>{preview && <Chip label="Preview" color="info" />}{config.timeLimitSeconds > 0 && <Chip color={seconds <= 15 ? 'error' : 'default'} label={`${Math.ceil(seconds / 60)} min remaining`} />}</Stack></Stack><Typography color="text.secondary">{config.instructions}</Typography>{type === 'diagram' && lesson.baseImageUrl ? <InteractiveDiagramViewer imageUrl={lesson.baseImageUrl} hotspots={lesson.interactiveHotspots ?? []} onViewed={() => undefined} /> : type === 'diagram' || type === 'builder' ? <Stack spacing={1}><Typography variant="subtitle2">{type === 'builder' ? 'Build the correct arrangement' : 'Explore each region'}</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{config.items.map((item) => <Button key={item.id} variant={selected.includes(item.label) ? 'contained' : 'outlined'} onClick={() => setSelected((current) => current.includes(item.label) ? current.filter((value) => value !== item.label) : [...current, item.label])}>{item.label}</Button>)}</Box>{selected.length > 0 && <Typography variant="body2" color="text.secondary">{config.items.filter((item) => selected.includes(item.label)).map((item) => item.detail).filter(Boolean).join(' · ')}</Typography>}</Stack> : type === 'virtual-lab' ? <Stack spacing={1.5}><Typography variant="subtitle2">Procedure</Typography>{config.procedure.map((step, index) => <Button key={step.id} variant={selected.includes(step.label) ? 'contained' : 'outlined'} onClick={() => setSelected((current) => current.includes(step.label) ? current : [...current, step.label])} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}>{index + 1}. {step.label}{step.detail ? ` — ${step.detail}` : ''}</Button>)}</Stack> : type === 'game' ? <Stack spacing={2}>{config.questions.map((question, index) => <Box key={question.id}><Typography sx={{ fontWeight: 700, mb: 1 }}>{index + 1}. {question.prompt}</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>{question.options.filter(Boolean).map((option) => <Button key={option} variant={answers[question.id] === option ? 'contained' : 'outlined'} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}>{option}</Button>)}</Stack></Box>)}</Stack> : <Stack spacing={2}>{isFormula && <><FormulaControls config={config} onValuesChange={setValues} />{type === 'graph' && <Box component="svg" viewBox="0 0 300 300" aria-label="Dynamic equation graph" sx={{ width: '100%', maxWidth: 520, alignSelf: 'center', border: 1, borderColor: 'divider', backgroundColor: 'background.default' }}><line x1="0" x2="300" y1="150" y2="150" stroke="currentColor" opacity=".35" /><line x1="150" x2="150" y1="0" y2="300" stroke="currentColor" opacity=".35" /><polyline points={graphPoints} fill="none" stroke="currentColor" strokeWidth="3" /></Box>}<Paper variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">{config.outputLabel}</Typography><Typography variant="h5">{Number.isFinite(result) ? Number(result.toFixed(4)) : 'Enter a valid formula'}</Typography></Paper></>}{type === 'calculator' && <TextField fullWidth label="Calculation" value={expression} onChange={(event) => setExpression(event.target.value)} helperText={expression ? `Result: ${evaluateFormula(expression, values)}` : 'Use numbers, operators, parentheses, and configured variables.'} />}</Stack>}<Button variant="contained" disabled={!preview && config.timeLimitSeconds > 0 && seconds <= 0} onClick={submit} startIcon={<CheckCircleOutlineIcon />}>{preview ? 'Preview submission' : 'Submit activity'}</Button></Stack></Paper>
}
