import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import * as THREE from 'three'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import InteractiveHotspotEditor from '@/components/admin/interactive-hotspot-editor'
import InteractiveDiagramViewer from '@/components/course/interactive-diagram-viewer'
import {
  constantForceMotion,
  evaluateExpression,
  graphPoints,
  labEquipmentFor,
  projectileMotion,
  runLabScenario,
  solveCircuit,
  solveLinearEquation,
  threeDModelPoints,
  type LabScenario,
} from './stem-engines'
import type {
  StemBiologySimulationConfig,
  StemCalculatorConfig,
  StemChemicalEquationConfig,
  StemChemistrySimulationConfig,
  StemCircuitConfig,
  StemClassificationConfig,
  StemDiagramConfig,
  StemEmbedConfig,
  StemFormulaConfig,
  StemGeometryConfig,
  StemGraphConfig,
  StemLabConfig,
  StemLabEnvironmentConfig,
  StemLinearEquationConfig,
  StemMoleculeConfig,
  StemPeriodicTableConfig,
  StemPhysicsSimulationConfig,
  StemPunnettConfig,
  StemThreeDConfig,
  StemToolBuilderProps,
  StemToolPlayerProps,
} from './stem-types'

export { solveLinearEquation } from './stem-engines'

const numberText = (value: number) => Number.isFinite(value)
  ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(value)
  : '—'

const baseFields = <T extends StemLabConfig>(config: T, onChange: (config: T) => void) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
    <TextField fullWidth size="small" label="Topic" value={config.topic} onChange={(event) => onChange({ ...config, topic: event.target.value })} />
    <TextField fullWidth size="small" label="Learner instructions" value={config.instructions} onChange={(event) => onChange({ ...config, instructions: event.target.value })} />
  </Stack>
)

const secureEmbedUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export const EmbedBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemEmbedConfig
  const validUrl = secureEmbedUrl(item.embedUrl)
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Tool provider" value={item.provider} onChange={(event) => onConfigChange({ ...item, provider: event.target.value })} /><TextField fullWidth required label="Secure embed URL" value={item.embedUrl} onChange={(event) => onConfigChange({ ...item, embedUrl: event.target.value })} helperText="Use an HTTPS URL that allows embedding." /><TextField fullWidth multiline minRows={2} label="Completion message" value={item.completionMessage} onChange={(event) => onConfigChange({ ...item, completionMessage: event.target.value })} /><Typography variant="caption" color={validUrl ? 'success.main' : 'warning.main'}>{validUrl ? 'The embedded tool URL is ready.' : 'Enter a valid HTTPS URL before publishing.'}</Typography></Stack>
}

export const EmbedPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemEmbedConfig
  if (!secureEmbedUrl(item.embedUrl)) return <Typography color="text.secondary">This embedded tool is not available until a valid HTTPS URL is configured.</Typography>
  return <Stack spacing={1.5}><Box component="iframe" src={item.embedUrl} title={`${item.provider} embedded tool`} loading="lazy" sx={{ width: '100%', minHeight: 420, border: 1, borderColor: 'divider', borderRadius: 1.5 }} /><Button variant="contained" onClick={() => onComplete({ provider: item.provider, embedUrl: item.embedUrl })}>Record activity</Button></Stack>
}

const CompletionNotice: FC<{ children: string }> = ({ children }) => (
  <Typography color="success.main" sx={{ fontWeight: 700 }}>{children}</Typography>
)

const StatusText: FC<{ status: 'correct' | 'incorrect' | null; correct: string; incorrect: string }> = ({ status, correct, incorrect }) => (
  status ? <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? correct : incorrect}</Typography> : null
)

export const GraphBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemGraphConfig
  const valid = graphPoints(item.expression, -2, 2, 20).length > 1
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth required label="Function of x" value={item.expression} onChange={(event) => onConfigChange({ ...item, expression: event.target.value })} helperText="Examples: x^2 - 4, sin(x), or 2*x + 1." /><TextField type="number" required label="Target x" value={item.targetX} onChange={(event) => onConfigChange({ ...item, targetX: Number(event.target.value) })} inputProps={{ step: 'any' }} sx={{ minWidth: { sm: 160 } }} /></Stack><Typography variant="caption" color={valid ? 'success.main' : 'warning.main'}>{valid ? 'The graph expression is ready.' : 'Enter a valid expression using x before publishing.'}</Typography></Stack>
}

export const GraphPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemGraphConfig
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  const minX = pan - 10 / zoom
  const maxX = pan + 10 / zoom
  const minY = -10 / zoom
  const maxY = 10 / zoom
  const points = useMemo(() => graphPoints(item.expression, minX, maxX), [item.expression, minX, maxX])
  const target = evaluateExpression(item.expression, { x: item.targetX })
  const mapX = (value: number) => ((value - minX) / (maxX - minX)) * 640
  const mapY = (value: number) => 360 - ((value - minY) / (maxY - minY)) * 360
  const segments = points.reduce<string[]>((all, point, index) => {
    const previous = points[index - 1]
    if (!previous || Math.abs(point.y - previous.y) > (maxY - minY) * 1.5) all.push('')
    all[all.length - 1] += `${mapX(point.x)},${mapY(point.y)} `
    return all
  }, [])
  const check = () => {
    const correct = Number.isFinite(target) && Math.abs(Number(answer) - target) < 1e-4
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ expression: item.expression, targetX: item.targetX, targetY: target, viewport: { minX, maxX } })
  }
  const reset = () => { setZoom(1); setPan(0); setAnswer(''); setStatus(null) }
  return <Stack spacing={1.5}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between"><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>y = {item.expression}</Typography><Stack direction="row" spacing={0.75}><Button size="small" variant="outlined" onClick={() => setZoom((value) => Math.min(5, value * 1.35))}>Zoom in</Button><Button size="small" variant="outlined" onClick={() => setZoom((value) => Math.max(0.4, value / 1.35))}>Zoom out</Button><Button size="small" variant="outlined" onClick={() => setPan((value) => value - 1)}>Pan left</Button><Button size="small" variant="outlined" onClick={() => setPan((value) => value + 1)}>Pan right</Button><Button size="small" onClick={reset} startIcon={<RestartAltIcon />}>Reset</Button></Stack></Stack><Box component="svg" viewBox="0 0 640 360" role="img" aria-label={`Graph of y equals ${item.expression}`} sx={{ width: '100%', border: 1, borderColor: 'divider', borderRadius: 1.5, backgroundColor: 'background.default' }}><line x1={mapX(0)} x2={mapX(0)} y1="0" y2="360" stroke="currentColor" opacity="0.5" /><line x1="0" x2="640" y1={mapY(0)} y2={mapY(0)} stroke="currentColor" opacity="0.5" />{Array.from({ length: 9 }, (_, index) => minX + ((maxX - minX) * index) / 8).map((value) => <line key={`x-${value}`} x1={mapX(value)} x2={mapX(value)} y1="0" y2="360" stroke="currentColor" opacity="0.08" />)}{Array.from({ length: 7 }, (_, index) => minY + ((maxY - minY) * index) / 6).map((value) => <line key={`y-${value}`} x1="0" x2="640" y1={mapY(value)} y2={mapY(value)} stroke="currentColor" opacity="0.08" />)}{segments.filter(Boolean).map((segment, index) => <polyline key={index} points={segment} fill="none" stroke="currentColor" strokeWidth="3" />)}{Number.isFinite(target) && target >= minY && target <= maxY && <circle cx={mapX(item.targetX)} cy={mapY(target)} r="5" fill="currentColor" />}</Box><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}><TextField type="number" label={`What is y when x = ${item.targetX}?`} value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ step: 'any' }} sx={{ flex: 1 }} /><Button variant="contained" disabled={!answer.trim() || !Number.isFinite(target)} onClick={check}>Check point</Button></Stack><StatusText status={status} correct="Correct. You read the graph accurately." incorrect="That point does not lie on the plotted function. Pan or zoom and try again." /></Stack>
}

export const LinearEquationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemLinearEquationConfig
  const result = solveLinearEquation(item.equation)
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Linear equation" value={item.equation} onChange={(event) => onConfigChange({ ...item, equation: event.target.value })} helperText="For example: 2x + 3 = 11. Solver v1 accepts a single linear x variable." /><Typography color={Number.isFinite(result) ? 'success.main' : 'warning.main'}>{Number.isFinite(result) ? `Solution preview: x = ${numberText(result)}` : 'Enter a solvable linear equation before publishing.'}</Typography></Stack>
}

export const LinearEquationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemLinearEquationConfig
  const solution = solveLinearEquation(item.equation)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswer(''); setStatus(null) }, [item.equation])
  const check = () => {
    const correct = Number.isFinite(solution) && Math.abs(Number(answer) - solution) < 1e-6
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ equation: item.equation, solution })
  }
  return <Stack spacing={2}><Typography variant="h5">Solve: {item.equation}</Typography><TextField type="number" label="x =" value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ step: 'any' }} /><Button variant="contained" disabled={!answer.trim() || !Number.isFinite(solution)} onClick={check}>Check answer</Button><StatusText status={status} correct="Correct. Your solution has been recorded." incorrect="Not quite. Check each side and try again." /></Stack>
}

export const CalculatorBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemCalculatorConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Starting expression" value={item.initialExpression} onChange={(event) => onConfigChange({ ...item, initialExpression: event.target.value })} helperText="Supports +, −, ×, ÷, powers, parentheses, sin, cos, tan, sqrt, log, ln, and pi." /></Stack>
}

export const CalculatorPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemCalculatorConfig
  const [expression, setExpression] = useState(item.initialExpression)
  const [result, setResult] = useState<number | null>(null)
  const [recorded, setRecorded] = useState(false)
  useEffect(() => { setExpression(item.initialExpression); setResult(null); setRecorded(false) }, [item.initialExpression])
  const calculate = () => { setResult(evaluateExpression(expression)) }
  const append = (token: string) => setExpression((value) => `${value}${token}`)
  return <Stack spacing={1.5}><TextField fullWidth label="Expression" value={expression} onChange={(event) => { setExpression(event.target.value); setResult(null); setRecorded(false) }} /><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.75 }}>{['7', '8', '9', '/', 'sqrt(', '4', '5', '6', '*', '^', '1', '2', '3', '-', '(', '0', '.', 'pi', '+', ')'].map((token) => <Button key={token} variant="outlined" onClick={() => append(token)}>{token}</Button>)}</Box><Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Result</Typography><Typography variant="h4">{result === null ? '—' : numberText(result)}</Typography></Paper><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" onClick={calculate}>Calculate</Button><Button variant="outlined" disabled={result === null || !Number.isFinite(result) || recorded} onClick={() => { setRecorded(true); onComplete({ expression, result }) }}>{recorded ? 'Calculation recorded' : 'Record calculation'}</Button><Button variant="text" onClick={() => { setExpression(''); setResult(null); setRecorded(false) }}>Clear</Button></Stack>{result !== null && !Number.isFinite(result) && <Typography color="error">This expression cannot be evaluated. Check its syntax and values.</Typography>}</Stack>
}

const pointDistance = (first: { x: number; y: number }, second: { x: number; y: number }) => Math.hypot(first.x - second.x, first.y - second.y)
const interiorAngle = (previous: { x: number; y: number }, vertex: { x: number; y: number }, next: { x: number; y: number }) => {
  const first = { x: previous.x - vertex.x, y: previous.y - vertex.y }
  const second = { x: next.x - vertex.x, y: next.y - vertex.y }
  const divisor = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y)
  return divisor ? Math.acos(Math.max(-1, Math.min(1, (first.x * second.x + first.y * second.y) / divisor))) * 180 / Math.PI : Number.NaN
}

export const GeometryBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemGeometryConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>Required shape</InputLabel><Select label="Required shape" value={item.requiredVertices} onChange={(event) => onConfigChange({ ...item, requiredVertices: Number(event.target.value) as StemGeometryConfig['requiredVertices'] })}><MenuItem value={3}>Triangle</MenuItem><MenuItem value={4}>Quadrilateral</MenuItem></Select></FormControl><Typography variant="caption" color="text.secondary">Learners plot a snapped shape, inspect calculated side lengths and angles, then record the construction.</Typography></Stack>
}

export const GeometryPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemGeometryConfig
  const [vertices, setVertices] = useState<Array<{ x: number; y: number }>>([])
  const [recorded, setRecorded] = useState(false)
  useEffect(() => { setVertices([]); setRecorded(false) }, [item.requiredVertices])
  const addVertex = (event: React.MouseEvent<SVGSVGElement>) => {
    if (vertices.length >= item.requiredVertices) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const point = { x: Math.round(((event.clientX - bounds.left) / bounds.width) * 10), y: Math.round((1 - (event.clientY - bounds.top) / bounds.height) * 10) }
    setVertices((current) => [...current, point])
  }
  const screenPoint = (point: { x: number; y: number }) => `${point.x * 40},${400 - point.y * 40}`
  const sides = vertices.length > 1 ? vertices.map((point, index) => pointDistance(point, vertices[(index + 1) % vertices.length])) : []
  const angles = vertices.length > 2 ? vertices.map((point, index) => interiorAngle(vertices[(index - 1 + vertices.length) % vertices.length], point, vertices[(index + 1) % vertices.length])) : []
  return <Stack spacing={1.5}><Typography variant="body2" color="text.secondary">Click the grid to place {item.requiredVertices} snapped vertices. Coordinates use one grid unit.</Typography><Box component="svg" viewBox="0 0 400 400" role="img" aria-label="Geometry construction grid" onClick={addVertex} sx={{ width: 'min(100%, 470px)', alignSelf: 'center', border: 1, borderColor: 'divider', borderRadius: 1.5, backgroundColor: 'background.default', cursor: vertices.length < item.requiredVertices ? 'crosshair' : 'default' }}>{Array.from({ length: 11 }, (_, index) => <g key={index}><line x1={index * 40} x2={index * 40} y1="0" y2="400" stroke="currentColor" opacity="0.12" /><line x1="0" x2="400" y1={index * 40} y2={index * 40} stroke="currentColor" opacity="0.12" /></g>)}{vertices.length > 1 && <polygon points={vertices.map(screenPoint).join(' ')} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3" />}{vertices.map((point, index) => <g key={`${point.x}-${point.y}-${index}`}><circle cx={point.x * 40} cy={400 - point.y * 40} r="8" fill="currentColor" /><text x={point.x * 40 + 12} y={400 - point.y * 40 - 10} fontSize="15" fill="currentColor">{String.fromCharCode(65 + index)}</text></g>)}</Box>{vertices.length === item.requiredVertices && <Paper variant="outlined" sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography sx={{ fontWeight: 800 }}>Measurements</Typography><Typography variant="body2">Side lengths: {sides.map(numberText).join(', ')} units</Typography><Typography variant="body2">Interior angles: {angles.map((angle) => `${numberText(angle)}°`).join(', ')}</Typography></Stack></Paper>}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" disabled={vertices.length !== item.requiredVertices || recorded} onClick={() => { setRecorded(true); onComplete({ vertices, sideLengths: sides, angles }) }}>{recorded ? 'Construction recorded' : 'Record construction'}</Button><Button variant="outlined" onClick={() => { setVertices([]); setRecorded(false) }}>Clear grid</Button></Stack></Stack>
}

const formulaVariables = (formula: string, target: string) => [...new Set((formula.match(/[A-Za-z]+/g) ?? []).filter((name) => name !== target && !['Result', 'sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'pi'].includes(name)))]
const formulaResult = (formula: string, target: string, values: Record<string, number>) => {
  const [left, right] = formula.split('=').map((part) => part.trim())
  if (!left || !right) return Number.NaN
  if (target === 'Result' || target === left) return evaluateExpression(right, values)
  const residual = (candidate: number) => evaluateExpression(left, { ...values, [target]: candidate }) - evaluateExpression(right, { ...values, [target]: candidate })
  const zero = residual(0)
  const slope = residual(1) - zero
  return Number.isFinite(zero) && Number.isFinite(slope) && Math.abs(slope) > 1e-10 ? -zero / slope : Number.NaN
}

export const FormulaBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemFormulaConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Formula" value={item.formula} onChange={(event) => onConfigChange({ ...item, formula: event.target.value })} helperText="Use an equation such as F = m × a. Formula Solver supports one linear unknown." /><TextField fullWidth required size="small" label="Variable to solve" value={item.solveFor} onChange={(event) => onConfigChange({ ...item, solveFor: event.target.value.replace(/[^A-Za-z]/g, '') })} helperText="Use the variable from the formula, such as F, m, n, or C." /></Stack>
}

export const FormulaPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemFormulaConfig
  const target = item.solveFor.trim()
  const variables = formulaVariables(item.formula, target)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [recorded, setRecorded] = useState(false)
  useEffect(() => { setInputs(Object.fromEntries(variables.map((variable) => [variable, '']))); setRecorded(false) }, [item.formula, item.solveFor])
  const values = Object.fromEntries(variables.map((variable) => [variable, Number(inputs[variable])]))
  const ready = Boolean(target && variables.length > 0 && variables.every((variable) => inputs[variable]?.trim() && Number.isFinite(values[variable])))
  const result = ready ? formulaResult(item.formula, target, values) : Number.NaN
  return <Stack spacing={2}><Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Formula workspace</Typography><Typography variant="h5">{target || '?'} = {numberText(result)}</Typography></Paper><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>{variables.map((variable) => <TextField key={variable} type="number" label={variable} value={inputs[variable] ?? ''} onChange={(event) => setInputs({ ...inputs, [variable]: event.target.value })} inputProps={{ step: 'any' }} />)}</Box><Button variant="contained" disabled={!ready || !Number.isFinite(result) || recorded} onClick={() => { setRecorded(true); onComplete({ formula: item.formula, target, result, values }) }}>{recorded ? 'Calculation recorded' : 'Record calculation'}</Button>{ready && !Number.isFinite(result) && <Typography color="error">This formula cannot solve for {target} in Formula Solver v1.</Typography>}</Stack>
}

export const PhysicsSimulationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemPhysicsSimulationConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>Simulation concept</InputLabel><Select label="Simulation concept" value={item.scenario} onChange={(event) => onConfigChange({ ...item, scenario: event.target.value as StemPhysicsSimulationConfig['scenario'] })}><MenuItem value="projectile_motion">Projectile motion</MenuItem><MenuItem value="constant_force">Constant force</MenuItem></Select></FormControl><Typography variant="caption" color="text.secondary">Physics Simulation v1 intentionally supports these two named concepts only.</Typography></Stack>
}

type PhysicsInputValues = Record<'speed' | 'angle' | 'force' | 'mass' | 'seconds', string | undefined>

export const PhysicsSimulationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemPhysicsSimulationConfig
  const [values, setValues] = useState<PhysicsInputValues>(item.scenario === 'projectile_motion' ? { speed: '20', angle: '45', force: undefined, mass: undefined, seconds: undefined } : { speed: undefined, angle: undefined, force: '10', mass: '2', seconds: '4' })
  const [result, setResult] = useState<Record<string, number> | null>(null)
  useEffect(() => { setValues(item.scenario === 'projectile_motion' ? { speed: '20', angle: '45', force: undefined, mass: undefined, seconds: undefined } : { speed: undefined, angle: undefined, force: '10', mass: '2', seconds: '4' }); setResult(null) }, [item.scenario])
  const run = () => {
    if (item.scenario === 'projectile_motion') {
      const motion = projectileMotion(Number(values.speed), Number(values.angle))
      setResult({ range: motion.range, maxHeight: motion.maxHeight, flightSeconds: motion.flightSeconds })
      return
    }
    const motion = constantForceMotion(Number(values.force), Number(values.mass), Number(values.seconds))
    setResult(motion)
  }
  const ready = (item.scenario === 'projectile_motion' ? [values.speed, values.angle] : [values.force, values.mass, values.seconds]).every((value) => Boolean(value?.trim()) && Number.isFinite(Number(value))) && (item.scenario !== 'constant_force' || Number(values.mass) > 0)
  return <Stack spacing={2}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>{item.scenario === 'projectile_motion' ? <><TextField type="number" label="Launch speed (m/s)" value={values.speed ?? ''} onChange={(event) => setValues({ ...values, speed: event.target.value })} /><TextField type="number" label="Launch angle (°)" value={values.angle ?? ''} onChange={(event) => setValues({ ...values, angle: event.target.value })} /></> : <><TextField type="number" label="Force (N)" value={values.force ?? ''} onChange={(event) => setValues({ ...values, force: event.target.value })} /><TextField type="number" label="Mass (kg)" value={values.mass ?? ''} onChange={(event) => setValues({ ...values, mass: event.target.value })} /><TextField type="number" label="Time (s)" value={values.seconds ?? ''} onChange={(event) => setValues({ ...values, seconds: event.target.value })} /></>}</Box><Button variant="contained" disabled={!ready} onClick={run} startIcon={<PlayArrowIcon />}>Run simulation</Button>{result && <Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 800, mb: 0.5 }}>Calculated state</Typography>{Object.entries(result).map(([key, value]) => <Typography key={key} variant="body2">{key.replace(/([A-Z])/g, ' $1')}: {numberText(value)}</Typography>)}<Button sx={{ mt: 1 }} variant="outlined" onClick={() => onComplete({ scenario: item.scenario, input: values, output: result })}>Record simulation</Button></Paper>}</Stack>
}

export const ChemistrySimulationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemChemistrySimulationConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>Simulation concept</InputLabel><Select label="Simulation concept" value={item.scenario} onChange={(event) => onConfigChange({ ...item, scenario: event.target.value as StemChemistrySimulationConfig['scenario'] })}><MenuItem value="reaction_rate">Reaction rate</MenuItem><MenuItem value="acid_base">Acid-base neutralization</MenuItem></Select></FormControl><Typography variant="caption" color="text.secondary">Chemistry Simulation v1 models these named, rule-based concepts only.</Typography></Stack>
}

export const ChemistrySimulationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemChemistrySimulationConfig
  const [values, setValues] = useState(item.scenario === 'reaction_rate' ? { temperature: '20', concentration: '1' } : { acidMolarity: '0.1', acidVolume: '25', baseMolarity: '0.1', baseVolume: '25' })
  const [result, setResult] = useState<Record<string, string | number> | null>(null)
  useEffect(() => { setValues(item.scenario === 'reaction_rate' ? { temperature: '20', concentration: '1' } : { acidMolarity: '0.1', acidVolume: '25', baseMolarity: '0.1', baseVolume: '25' }); setResult(null) }, [item.scenario])
  const run = () => {
    if (item.scenario === 'reaction_rate') {
      const multiplier = Number(values.concentration) * 2 ** ((Number(values.temperature) - 20) / 10)
      setResult({ relativeRate: multiplier, note: 'Rate uses a Q10 = 2 model with concentration as a linear factor.' })
      return
    }
    const acid = Number(values.acidMolarity) * Number(values.acidVolume) / 1000
    const base = Number(values.baseMolarity) * Number(values.baseVolume) / 1000
    setResult({ excessMillimoles: Math.abs(acid - base) * 1000, outcome: Math.abs(acid - base) < 1e-9 ? 'Neutral endpoint' : acid > base ? 'Acid in excess' : 'Base in excess' })
  }
  const ready = Object.values(values).every((value) => value.trim() && Number.isFinite(Number(value)))
  return <Stack spacing={2}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{Object.entries(values).map(([key, value]) => <TextField key={key} type="number" label={key.replace(/([A-Z])/g, ' $1')} value={value} onChange={(event) => setValues({ ...values, [key]: event.target.value })} inputProps={{ step: 'any' }} />)}</Box><Button variant="contained" disabled={!ready} onClick={run} startIcon={<PlayArrowIcon />}>Run simulation</Button>{result && <Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>Calculated state</Typography>{Object.entries(result).map(([key, value]) => <Typography key={key} variant="body2">{key.replace(/([A-Z])/g, ' $1')}: {typeof value === 'number' ? numberText(value) : value}</Typography>)}<Button sx={{ mt: 1 }} variant="outlined" onClick={() => onComplete({ scenario: item.scenario, input: values, output: result })}>Record simulation</Button></Paper>}</Stack>
}

export const BiologySimulationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemBiologySimulationConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>Simulation concept</InputLabel><Select label="Simulation concept" value={item.scenario} onChange={(event) => onConfigChange({ ...item, scenario: event.target.value as StemBiologySimulationConfig['scenario'] })}><MenuItem value="population_growth">Population growth</MenuItem><MenuItem value="cell_division">Cell division stages</MenuItem></Select></FormControl><Typography variant="caption" color="text.secondary">Biology Simulation v1 intentionally models these named concepts only.</Typography></Stack>
}

export const BiologySimulationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemBiologySimulationConfig
  const [values, setValues] = useState(item.scenario === 'population_growth' ? { initial: '10', rate: '0.3', carryingCapacity: '100', time: '6' } : { cycles: '3' })
  const [result, setResult] = useState<Record<string, number | string> | null>(null)
  useEffect(() => { setValues(item.scenario === 'population_growth' ? { initial: '10', rate: '0.3', carryingCapacity: '100', time: '6' } : { cycles: '3' }); setResult(null) }, [item.scenario])
  const run = () => {
    if (item.scenario === 'population_growth') {
      const initial = Number(values.initial)
      const rate = Number(values.rate)
      const carryingCapacity = Number(values.carryingCapacity)
      const time = Number(values.time)
      const population = carryingCapacity / (1 + ((carryingCapacity - initial) / initial) * Math.exp(-rate * time))
      setResult({ population, model: 'Logistic growth' })
      return
    }
    const cycles = Number(values.cycles)
    setResult({ cells: 2 ** cycles, model: 'Each mitotic cycle doubles the cell count.' })
  }
  const ready = Object.values(values).every((value) => value.trim() && Number.isFinite(Number(value))) && (item.scenario !== 'population_growth' || Number(values.initial) > 0 && Number(values.carryingCapacity) > 0)
  return <Stack spacing={2}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{Object.entries(values).map(([key, value]) => <TextField key={key} type="number" label={key.replace(/([A-Z])/g, ' $1')} value={value} onChange={(event) => setValues({ ...values, [key]: event.target.value })} inputProps={{ step: 'any' }} />)}</Box><Button variant="contained" disabled={!ready} onClick={run} startIcon={<PlayArrowIcon />}>Run simulation</Button>{result && <Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>Calculated state</Typography>{Object.entries(result).map(([key, value]) => <Typography key={key} variant="body2">{key.replace(/([A-Z])/g, ' $1')}: {typeof value === 'number' ? numberText(value) : value}</Typography>)}<Button sx={{ mt: 1 }} variant="outlined" onClick={() => onComplete({ scenario: item.scenario, input: values, output: result })}>Record simulation</Button></Paper>}</Stack>
}

const labScenarioLabel: Record<LabScenario, string> = { pendulum: 'Pendulum period', neutralization: 'Acid-base neutralization', osmosis: 'Osmosis' }
const labInputs: Record<LabScenario, Array<{ key: string; label: string; defaultValue: string }>> = {
  pendulum: [{ key: 'length', label: 'String length (m)', defaultValue: '1' }],
  neutralization: [{ key: 'acidMolarity', label: 'Acid molarity (M)', defaultValue: '0.1' }, { key: 'acidVolume', label: 'Acid volume (mL)', defaultValue: '25' }, { key: 'baseMolarity', label: 'Base molarity (M)', defaultValue: '0.1' }, { key: 'baseVolume', label: 'Base volume (mL)', defaultValue: '25' }],
  osmosis: [{ key: 'insideConcentration', label: 'Inside concentration (M)', defaultValue: '0.1' }, { key: 'outsideConcentration', label: 'Outside concentration (M)', defaultValue: '0.3' }],
}

export const LabEnvironmentBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemLabEnvironmentConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>Lab scenario</InputLabel><Select label="Lab scenario" value={item.scenario} onChange={(event) => onConfigChange({ ...item, scenario: event.target.value as LabScenario })}>{(Object.keys(labScenarioLabel) as LabScenario[]).map((scenario) => <MenuItem key={scenario} value={scenario}>{labScenarioLabel[scenario]}</MenuItem>)}</Select></FormControl><TextField fullWidth multiline minRows={3} label="Procedure steps" value={item.steps.join('\n')} onChange={(event) => onConfigChange({ ...item, steps: event.target.value.split('\n').map((step) => step.trim()).filter(Boolean) })} helperText="One required procedural step per line." /></Stack>
}

export const LabEnvironmentPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemLabEnvironmentConfig
  const equipment = labEquipmentFor(item.scenario)
  const [placed, setPlaced] = useState<string[]>([])
  const [dragged, setDragged] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState<ReturnType<typeof runLabScenario> | null>(null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [observation, setObservation] = useState('')
  useEffect(() => { setPlaced([]); setDragged(null); setValues(Object.fromEntries(labInputs[item.scenario].map(({ key, defaultValue }) => [key, defaultValue]))); setOutcome(null); setCompletedSteps([]); setObservation('') }, [item.scenario, item.activity, item.steps])
  const ready = equipment.every((entry) => placed.includes(entry)) && Object.values(values).every((value) => value.trim() && Number.isFinite(Number(value)))
  const run = () => setOutcome(runLabScenario(item.scenario, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]))))
  const markStep = (index: number) => setCompletedSteps((current) => current.includes(index) ? current.filter((step) => step !== index) : [...current, index])
  const canRecord = Boolean(outcome && completedSteps.length === item.steps.length && observation.trim())
  return <Stack spacing={2}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{item.activity === 'experiment' ? 'Experiment workspace' : 'Virtual lab workspace'} · {labScenarioLabel[item.scenario]}</Typography><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">{equipment.filter((entry) => !placed.includes(entry)).map((entry) => <Chip key={entry} label={`Drag ${entry}`} draggable onDragStart={() => setDragged(entry)} sx={{ cursor: 'grab' }} />)}</Stack><Paper variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged && !placed.includes(dragged)) setPlaced((current) => [...current, dragged]); setDragged(null) }} sx={{ minHeight: 130, p: 2, borderStyle: 'dashed', backgroundColor: 'background.default' }}><Typography variant="body2" color="text.secondary">Drag every required item here to set up the lab.</Typography><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>{placed.map((entry) => <Chip key={entry} color="primary" label={entry} onDelete={() => setPlaced((current) => current.filter((value) => value !== entry))} />)}</Stack></Paper><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{labInputs[item.scenario].map(({ key, label }) => <TextField key={key} type="number" label={label} value={values[key] ?? ''} onChange={(event) => setValues({ ...values, [key]: event.target.value })} inputProps={{ step: 'any' }} />)}</Box><Button variant="contained" disabled={!ready} startIcon={<PlayArrowIcon />} onClick={run}>Run {item.activity === 'experiment' ? 'experiment' : 'lab'}</Button>{outcome && <Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>{outcome.metric}: {numberText(outcome.value)} {outcome.unit}</Typography><Typography variant="body2" color="text.secondary">{outcome.detail}</Typography></Paper>}<Stack spacing={0.5}>{item.steps.map((step, index) => <Box key={`${step}-${index}`} component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}><input type="checkbox" checked={completedSteps.includes(index)} disabled={!outcome} onChange={() => markStep(index)} /> <Typography variant="body2">{step}</Typography></Box>)}</Stack><TextField fullWidth multiline minRows={2} label="Observation" value={observation} onChange={(event) => setObservation(event.target.value)} disabled={!outcome} helperText="Record an observation based on the calculated lab outcome." /><Button variant="outlined" disabled={!canRecord} onClick={() => onComplete({ scenario: item.scenario, equipment: placed, input: values, outcome, observation, completedSteps })}>Record {item.activity === 'experiment' ? 'experiment' : 'lab'} result</Button></Stack>
}

export const CircuitBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemCircuitConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><FormControl fullWidth size="small"><InputLabel>Topology</InputLabel><Select label="Topology" value={item.topology} onChange={(event) => onConfigChange({ ...item, topology: event.target.value as StemCircuitConfig['topology'] })}><MenuItem value="series">Series</MenuItem><MenuItem value="parallel">Parallel</MenuItem></Select></FormControl><TextField fullWidth type="number" label="Supply voltage (V)" value={item.voltage} onChange={(event) => onConfigChange({ ...item, voltage: Number(event.target.value) })} inputProps={{ min: 0, step: 'any' }} /></Stack><TextField fullWidth label="Resistors (Ω)" value={item.resistors.join(', ')} onChange={(event) => onConfigChange({ ...item, resistors: event.target.value.split(',').map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value > 0) })} helperText="Comma-separated positive resistances, for example 10, 20, 30." /></Stack>
}

export const CircuitPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemCircuitConfig
  const solution = solveCircuit(item.topology, item.voltage, item.resistors)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswer(''); setStatus(null) }, [item.topology, item.voltage, item.resistors])
  const check = () => {
    const correct = Boolean(solution && Math.abs(Number(answer) - solution.totalCurrent) < 1e-4)
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct && solution) onComplete({ topology: item.topology, voltage: item.voltage, resistors: item.resistors, ...solution })
  }
  if (!solution) return <Typography color="text.secondary">This circuit needs at least one positive resistor and a finite voltage.</Typography>
  return <Stack spacing={2}><Paper variant="outlined" sx={{ p: 2 }}><Typography sx={{ fontWeight: 800 }}>{item.topology === 'series' ? 'Series' : 'Parallel'} circuit · {item.voltage} V supply</Typography><Box component="svg" viewBox="0 0 520 160" role="img" aria-label={`${item.topology} circuit diagram`} sx={{ width: '100%', maxHeight: 200 }}><line x1="30" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="3" />{item.topology === 'series' ? item.resistors.map((resistance, index) => <g key={`${resistance}-${index}`}><rect x={100 + index * (350 / item.resistors.length)} y="62" width={Math.max(46, 300 / item.resistors.length)} height="36" fill="none" stroke="currentColor" strokeWidth="3" rx="4" /><text x={125 + index * (350 / item.resistors.length)} y="85" fontSize="13" fill="currentColor">{resistance}Ω</text></g>) : item.resistors.map((resistance, index) => <g key={`${resistance}-${index}`}><line x1="100" y1="80" x2="160" y2={35 + index * (90 / Math.max(1, item.resistors.length - 1))} stroke="currentColor" strokeWidth="2" /><rect x="160" y={18 + index * (90 / Math.max(1, item.resistors.length - 1))} width="110" height="34" fill="none" stroke="currentColor" strokeWidth="2" rx="4" /><text x="180" y={40 + index * (90 / Math.max(1, item.resistors.length - 1))} fontSize="13" fill="currentColor">{resistance}Ω</text><line x1="270" y1={35 + index * (90 / Math.max(1, item.resistors.length - 1))} x2="420" y2="80" stroke="currentColor" strokeWidth="2" /></g>)}<line x1="420" y1="80" x2="490" y2="80" stroke="currentColor" strokeWidth="3" /><circle cx="30" cy="80" r="16" fill="none" stroke="currentColor" strokeWidth="3" /><text x="22" y="85" fontSize="14" fill="currentColor">V</text></Box></Paper><Paper variant="outlined" sx={{ p: 1.5, backgroundColor: 'background.default' }}><Typography variant="body2">Equivalent resistance: {numberText(solution.equivalentResistance)} Ω</Typography><Typography variant="body2">Branch currents: {solution.branchCurrents.map((value) => `${numberText(value)} A`).join(', ')}</Typography></Paper><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField type="number" label="Total current (A)" value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ step: 'any' }} sx={{ flex: 1 }} /><Button variant="contained" disabled={!answer.trim()} onClick={check}>Check circuit</Button></Stack><StatusText status={status} correct="Correct. Kirchhoff-consistent circuit solution recorded." incorrect="The total current does not match this circuit. Recheck equivalent resistance and Ohm’s law." /></Stack>
}

const moleculeAtoms = (formula: string) => {
  const normalized = formula.replace(/\s+/g, '')
  if (!normalized || !/^(?:[A-Z][a-z]?\d*)+$/.test(normalized)) return null
  const atoms: Record<string, number> = {}
  for (const match of normalized.matchAll(/([A-Z][a-z]?)(\d*)/g)) atoms[match[1]] = (atoms[match[1]] ?? 0) + Number(match[2] || 1)
  return atoms
}

export const MoleculeBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemMoleculeConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Target molecular formula" value={item.targetFormula} onChange={(event) => onConfigChange({ ...item, targetFormula: event.target.value })} helperText="Use a standard formula such as H2O, CO2, CH4, or NH3." /><Typography variant="caption" color={moleculeAtoms(item.targetFormula) ? 'success.main' : 'warning.main'}>{moleculeAtoms(item.targetFormula) ? 'Formula is ready for the 2D structure editor.' : 'Enter a valid molecular formula before publishing.'}</Typography></Stack>
}

export const MoleculePlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemMoleculeConfig
  const target = moleculeAtoms(item.targetFormula)
  const [selectedElement, setSelectedElement] = useState('H')
  const [atoms, setAtoms] = useState<string[]>([])
  const [bondStart, setBondStart] = useState<number | null>(null)
  const [bonds, setBonds] = useState<Array<[number, number]>>([])
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setSelectedElement('H'); setAtoms([]); setBondStart(null); setBonds([]); setStatus(null) }, [item.targetFormula])
  if (!target) return <Typography color="text.secondary">This molecule formula is not available yet.</Typography>
  const targetTotal = Object.values(target).reduce((total, count) => total + count, 0)
  const atomCount = atoms.reduce<Record<string, number>>((total, atom) => ({ ...total, [atom]: (total[atom] ?? 0) + 1 }), {})
  const clickAtom = (index: number) => {
    if (bondStart === null) { setBondStart(index); return }
    if (bondStart !== index && !bonds.some(([from, to]) => from === index && to === bondStart || from === bondStart && to === index)) setBonds((current) => [...current, [bondStart, index]])
    setBondStart(null)
  }
  const check = () => {
    const correctCounts = Object.keys(target).every((element) => atomCount[element] === target[element]) && Object.keys(atomCount).every((element) => target[element] === atomCount[element])
    const correct = correctCounts && atoms.length === targetTotal && bonds.length >= Math.max(0, targetTotal - 1)
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ targetFormula: item.targetFormula, atoms, bonds })
  }
  const position = (index: number) => { const angle = (Math.PI * 2 * index) / Math.max(atoms.length, 1) - Math.PI / 2; return { x: 180 + Math.cos(angle) * 105, y: 150 + Math.sin(angle) * 90 } }
  return <Stack spacing={1.5}><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">{['H', 'C', 'N', 'O', 'Cl', 'S', 'P'].map((element) => <Button key={element} size="small" variant={selectedElement === element ? 'contained' : 'outlined'} onClick={() => setSelectedElement(element)}>{element}</Button>)}<Button size="small" variant="contained" disabled={atoms.length >= targetTotal + 4} onClick={() => { setAtoms((current) => [...current, selectedElement]); setStatus(null) }}>Add atom</Button></Stack><Typography variant="caption" color="text.secondary">Select two atoms in the editor to create a bond. Target: {item.targetFormula}.</Typography><Box component="svg" viewBox="0 0 360 300" role="img" aria-label="2D molecule editor" sx={{ width: '100%', maxWidth: 420, alignSelf: 'center', border: 1, borderColor: 'divider', borderRadius: 1.5, backgroundColor: 'background.default' }}>{bonds.map(([from, to], index) => { const start = position(from); const end = position(to); return <line key={`${from}-${to}-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth="4" /> })}{atoms.map((atom, index) => { const point = position(index); return <g key={`${atom}-${index}`} onClick={() => clickAtom(index)} style={{ cursor: 'pointer' }}><circle cx={point.x} cy={point.y} r="25" fill="currentColor" opacity={bondStart === index ? 1 : 0.78} /><text x={point.x} y={point.y + 6} textAnchor="middle" fontWeight="700" fill="white">{atom}</text></g> })}</Box><Typography variant="body2">Built: {Object.entries(atomCount).map(([element, count]) => `${element}${count > 1 ? count : ''}`).join('') || 'No atoms'} · {bonds.length} bond{bonds.length === 1 ? '' : 's'}</Typography><Stack direction="row" spacing={1}><Button variant="contained" disabled={!atoms.length} onClick={check}>Check structure</Button><Button variant="outlined" onClick={() => { setAtoms([]); setBonds([]); setBondStart(null); setStatus(null) }}>Clear</Button></Stack><StatusText status={status} correct="Molecular formula and connected 2D structure are correct." incorrect="Match every target atom count and connect the structure with bonds before recording it." /></Stack>
}

const atomsFor = (formula: string) => {
  let cursor = 0
  const group = (): Record<string, number> | null => {
    const total: Record<string, number> = {}
    while (cursor < formula.length && formula[cursor] !== ')') {
      if (formula[cursor] === '(') {
        cursor += 1
        const nested = group()
        if (!nested || formula[cursor] !== ')') return null
        cursor += 1
        const countSource = formula.slice(cursor).match(/^\d+/)?.[0] ?? ''
        cursor += countSource.length
        Object.entries(nested).forEach(([atom, count]) => { total[atom] = (total[atom] ?? 0) + count * Number(countSource || 1) })
        continue
      }
      const atom = formula.slice(cursor).match(/^[A-Z][a-z]?/)?.[0]
      if (!atom) return null
      cursor += atom.length
      const countSource = formula.slice(cursor).match(/^\d+/)?.[0] ?? ''
      cursor += countSource.length
      total[atom] = (total[atom] ?? 0) + Number(countSource || 1)
    }
    return total
  }
  const atoms = group()
  return atoms && cursor === formula.length ? atoms : null
}

type Compound = { formula: string; atoms: Record<string, number>; side: 'left' | 'right' }
const equationCompounds = (equation: string): Compound[] | null => {
  const parts = equation.split(/(?:→|->|=)/).map((side) => side.trim())
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const parse = (value: string, side: Compound['side']) => value.split('+').map((formula) => formula.trim()).filter(Boolean).map((formula) => ({ formula, atoms: atomsFor(formula), side }))
  const parsed = [...parse(parts[0], 'left'), ...parse(parts[1], 'right')]
  return parsed.every((item) => item.atoms) ? parsed as Compound[] : null
}
const factorGcd = (first: number, second: number): number => second ? factorGcd(second, first % second) : Math.abs(first)
const factorLcm = (first: number, second: number) => Math.abs(first * second) / Math.max(1, factorGcd(first, second))
const fraction = (value: number) => { for (let denominator = 1; denominator <= 1000; denominator += 1) { const numerator = Math.round(value * denominator); if (Math.abs(value - numerator / denominator) < 1e-8) return { numerator, denominator } } return { numerator: Math.round(value * 1000), denominator: 1000 } }

export const balanceChemicalEquation = (equation: string): number[] | null => {
  const compounds = equationCompounds(equation)
  if (!compounds || compounds.length < 2) return null
  const elements = [...new Set(compounds.flatMap((compound) => Object.keys(compound.atoms)))]
  const matrix = elements.map((element) => compounds.map((compound) => (compound.atoms[element] ?? 0) * (compound.side === 'left' ? 1 : -1)))
  const pivots: number[] = []
  let row = 0
  for (let column = 0; column < compounds.length && row < matrix.length; column += 1) {
    const pivotRow = matrix.findIndex((values, index) => index >= row && Math.abs(values[column]) > 1e-10)
    if (pivotRow < 0) continue
    ;[matrix[row], matrix[pivotRow]] = [matrix[pivotRow], matrix[row]]
    const pivot = matrix[row][column]
    matrix[row] = matrix[row].map((value) => value / pivot)
    matrix.forEach((values, index) => { if (index !== row && Math.abs(values[column]) > 1e-10) { const scale = values[column]; matrix[index] = values.map((value, current) => value - scale * matrix[row][current]) } })
    pivots.push(column)
    row += 1
  }
  const free = Array.from({ length: compounds.length }, (_, index) => index).filter((column) => !pivots.includes(column))
  if (!free.length) return null
  const values = Array(compounds.length).fill(0)
  free.forEach((column) => { values[column] = 1 })
  pivots.slice().reverse().forEach((column, index) => { const pivotRow = pivots.length - index - 1; values[column] = -matrix[pivotRow].reduce((total, value, current) => current === column ? total : total + value * values[current], 0) })
  if (values.some((value) => !Number.isFinite(value) || Math.abs(value) < 1e-10)) return null
  if (values.some((value) => value < 0)) values.forEach((value, index) => { values[index] = -value })
  if (values.some((value) => value <= 0)) return null
  const fractions = values.map(fraction)
  const scale = fractions.reduce((total, item) => factorLcm(total, item.denominator), 1)
  const whole = fractions.map((item) => Math.round(item.numerator * scale / item.denominator))
  const divisor = whole.reduce((total, value) => factorGcd(total, value), whole[0])
  return whole.map((value) => value / Math.max(1, divisor))
}

export const ChemicalEquationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemChemicalEquationConfig
  const valid = balanceChemicalEquation(item.equation)
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Unbalanced equation" value={item.equation} onChange={(event) => onConfigChange({ ...item, equation: event.target.value })} helperText="For example: Fe + O2 -> Fe2O3. Parenthesized compounds are supported." /><Typography color={valid ? 'success.main' : 'warning.main'}>{valid ? 'A valid balance exists.' : 'Enter a valid, balanceable chemical equation before publishing.'}</Typography></Stack>
}

export const ChemicalEquationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemChemicalEquationConfig
  const compounds = equationCompounds(item.equation) ?? []
  const solution = balanceChemicalEquation(item.equation)
  const [answers, setAnswers] = useState<string[]>([])
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswers(compounds.map(() => '')); setStatus(null) }, [item.equation])
  if (!solution || !compounds.length) return <Typography color="text.secondary">This equation is not available yet.</Typography>
  const check = () => {
    const correct = solution.every((value, index) => Number(answers[index]) === value)
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ equation: item.equation, coefficients: solution })
  }
  return <Stack spacing={2}><Typography variant="h5">Balance: {item.equation}</Typography><Typography color="text.secondary">Enter each smallest whole-number coefficient in equation order.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{compounds.map((compound, index) => <Stack key={`${compound.formula}-${index}`} direction="row" spacing={1} alignItems="center"><TextField size="small" type="number" label="Coefficient" value={answers[index] ?? ''} onChange={(event) => setAnswers(answers.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))} inputProps={{ min: 1 }} sx={{ width: 130 }} /><Typography>{compound.formula}</Typography></Stack>)}</Box><Button variant="contained" disabled={answers.some((value) => !value)} onClick={check}>Check balance</Button><StatusText status={status} correct="Correct. Your balanced equation has been recorded." incorrect="Those coefficients do not balance every element. Try again." /></Stack>
}

const ELEMENTS = `H|Hydrogen|He|Helium|Li|Lithium|Be|Beryllium|B|Boron|C|Carbon|N|Nitrogen|O|Oxygen|F|Fluorine|Ne|Neon|Na|Sodium|Mg|Magnesium|Al|Aluminium|Si|Silicon|P|Phosphorus|S|Sulfur|Cl|Chlorine|Ar|Argon|K|Potassium|Ca|Calcium|Sc|Scandium|Ti|Titanium|V|Vanadium|Cr|Chromium|Mn|Manganese|Fe|Iron|Co|Cobalt|Ni|Nickel|Cu|Copper|Zn|Zinc|Ga|Gallium|Ge|Germanium|As|Arsenic|Se|Selenium|Br|Bromine|Kr|Krypton|Rb|Rubidium|Sr|Strontium|Y|Yttrium|Zr|Zirconium|Nb|Niobium|Mo|Molybdenum|Tc|Technetium|Ru|Ruthenium|Rh|Rhodium|Pd|Palladium|Ag|Silver|Cd|Cadmium|In|Indium|Sn|Tin|Sb|Antimony|Te|Tellurium|I|Iodine|Xe|Xenon|Cs|Caesium|Ba|Barium|La|Lanthanum|Ce|Cerium|Pr|Praseodymium|Nd|Neodymium|Pm|Promethium|Sm|Samarium|Eu|Europium|Gd|Gadolinium|Tb|Terbium|Dy|Dysprosium|Ho|Holmium|Er|Erbium|Tm|Thulium|Yb|Ytterbium|Lu|Lutetium|Hf|Hafnium|Ta|Tantalum|W|Tungsten|Re|Rhenium|Os|Osmium|Ir|Iridium|Pt|Platinum|Au|Gold|Hg|Mercury|Tl|Thallium|Pb|Lead|Bi|Bismuth|Po|Polonium|At|Astatine|Rn|Radon|Fr|Francium|Ra|Radium|Ac|Actinium|Th|Thorium|Pa|Protactinium|U|Uranium|Np|Neptunium|Pu|Plutonium|Am|Americium|Cm|Curium|Bk|Berkelium|Cf|Californium|Es|Einsteinium|Fm|Fermium|Md|Mendelevium|No|Nobelium|Lr|Lawrencium|Rf|Rutherfordium|Db|Dubnium|Sg|Seaborgium|Bh|Bohrium|Hs|Hassium|Mt|Meitnerium|Ds|Darmstadtium|Rg|Roentgenium|Cn|Copernicium|Nh|Nihonium|Fl|Flerovium|Mc|Moscovium|Lv|Livermorium|Ts|Tennessine|Og|Oganesson`.split('|').reduce<Array<{ number: number; symbol: string; name: string }>>((items, value, index, all) => index % 2 === 0 ? [...items, { number: index / 2 + 1, symbol: value, name: all[index + 1] }] : items, [])

export const PeriodicTableBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemPeriodicTableConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Target atomic numbers" value={item.targetAtomicNumbers.join(', ')} onChange={(event) => onConfigChange({ ...item, targetAtomicNumbers: [...new Set(event.target.value.split(',').map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 1 && value <= 118))] })} helperText="Comma-separated targets, for example: 1, 6, 8." /><Typography variant="caption" color="text.secondary">The learner must identify every configured element from the full 118-element table.</Typography></Stack>
}

export const PeriodicTablePlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemPeriodicTableConfig
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setSelected([]); setStatus(null) }, [item.targetAtomicNumbers.join(',')])
  const toggle = (number: number) => setSelected((current) => current.includes(number) ? current.filter((value) => value !== number) : [...current, number])
  const check = () => {
    const correct = selected.length === item.targetAtomicNumbers.length && selected.every((number) => item.targetAtomicNumbers.includes(number))
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ elements: selected })
  }
  return <Stack spacing={2}><Typography variant="h6">Select all target elements</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 0.5 }}>{ELEMENTS.map((element) => <Button key={element.number} variant={selected.includes(element.number) ? 'contained' : 'outlined'} onClick={() => toggle(element.number)} title={element.name} sx={{ minWidth: 0, height: 54, flexDirection: 'column', lineHeight: 1.05 }}><Typography component="span" sx={{ fontSize: 10 }}>{element.number}</Typography><Typography component="span" sx={{ fontWeight: 800 }}>{element.symbol}</Typography></Button>)}</Box><Button variant="contained" disabled={!selected.length} onClick={check}>Check selection</Button><StatusText status={status} correct="Correct. Your element selection has been recorded." incorrect="Review the element symbols and try again." /></Stack>
}

export const DiagramBuilder: FC<StemToolBuilderProps> = ({ lesson, config, onConfigChange }) => {
  const item = config as StemDiagramConfig
  const diagramLesson = { ...lesson, baseImageUrl: item.imageUrl, interactiveHotspots: item.hotspots }
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<InteractiveHotspotEditor lesson={diagramLesson} onChange={(next) => onConfigChange({ ...item, imageUrl: next.baseImageUrl ?? '', hotspots: next.interactiveHotspots ?? [] })} /></Stack>
}

export const DiagramPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemDiagramConfig
  const [opened, setOpened] = useState<number[]>([])
  useEffect(() => setOpened([]), [item.imageUrl, item.hotspots])
  const openHotspot = (id: number) => setOpened((current) => { const next = current.includes(id) ? current : [...current, id]; if (next.length === item.hotspots.length && item.hotspots.length) onComplete({ hotspotsOpened: next.length }); return next })
  return <Stack spacing={1.5}><InteractiveDiagramViewer imageUrl={item.imageUrl} hotspots={item.hotspots} onViewed={() => undefined} onHotspotOpen={openHotspot} /><Typography variant="caption" color="text.secondary">Explore every labeled hotspot to complete this diagram ({opened.length}/{item.hotspots.length}).</Typography></Stack>
}

export const ThreeDExplorerBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemThreeDConfig
  const labels = threeDModelPoints(item.model).map((point) => point.label).filter((label): label is string => Boolean(label))
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<FormControl fullWidth size="small"><InputLabel>3D model</InputLabel><Select label="3D model" value={item.model} onChange={(event) => { const model = event.target.value as StemThreeDConfig['model']; onConfigChange({ ...item, model, requiredLabels: threeDModelPoints(model).map((point) => point.label).filter((label): label is string => Boolean(label)) }) }}><MenuItem value="cell">Cell</MenuItem><MenuItem value="dna">DNA</MenuItem><MenuItem value="neuron">Neuron</MenuItem></Select></FormControl><Typography variant="caption" color="text.secondary">Completion requires opening the model labels: {labels.join(', ')}.</Typography></Stack>
}

type ThreeDLabelObject = { object: THREE.Object3D; label: string }

type ThreeDScene = { group: THREE.Group; labels: ThreeDLabelObject[] }

const addThreeDLabel = (scene: ThreeDScene, label: string, position: THREE.Vector3) => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (!context) return
  context.font = '600 30px sans-serif'
  context.textBaseline = 'middle'
  context.fillStyle = '#15333a'
  context.fillText(label, 12, 48)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }))
  sprite.position.copy(position)
  sprite.scale.set(2.5, 0.47, 1)
  sprite.userData.label = label
  scene.group.add(sprite)
  scene.labels.push({ object: sprite, label })
}

const addTube = (group: THREE.Group, points: THREE.Vector3[], color: number, radius = 0.06) => {
  const curve = new THREE.CatmullRomCurve3(points)
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10, false), new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.08 })))
}

const createThreeDScene = (model: StemThreeDConfig['model']): ThreeDScene => {
  const scene: ThreeDScene = { group: new THREE.Group(), labels: [] }
  const addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, label?: string) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    scene.group.add(mesh)
    if (label) addThreeDLabel(scene, label, position.clone().add(new THREE.Vector3(0.2, 0.15, 0.15)))
    return mesh
  }

  if (model === 'dna') {
    const left: THREE.Vector3[] = []
    const right: THREE.Vector3[] = []
    for (let index = 0; index < 24; index += 1) {
      const angle = index * 0.58
      const y = (index - 12) * 0.18
      const leftPoint = new THREE.Vector3(Math.cos(angle) * 0.72, y, Math.sin(angle) * 0.72)
      const rightPoint = new THREE.Vector3(Math.cos(angle + Math.PI) * 0.72, y, Math.sin(angle + Math.PI) * 0.72)
      left.push(leftPoint)
      right.push(rightPoint)
      const pair = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xe8a12d }))
      pair.position.copy(leftPoint).add(rightPoint).multiplyScalar(0.5)
      pair.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rightPoint.clone().sub(leftPoint).normalize())
      scene.group.add(pair)
      if (index % 5 === 0) addThreeDLabel(scene, 'Base pair', leftPoint.clone().add(new THREE.Vector3(0.18, 0.08, 0.1)))
    }
    addTube(scene.group, left, 0x287d9d, 0.08)
    addTube(scene.group, right, 0x8b4c9f, 0.08)
    return scene
  }

  if (model === 'neuron') {
    addMesh(new THREE.SphereGeometry(0.65, 32, 20), new THREE.MeshStandardMaterial({ color: 0xd27b4d, roughness: 0.5 }), new THREE.Vector3(), 'Cell body')
    addTube(scene.group, [new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(1.1, 0.1, 0.1), new THREE.Vector3(2.1, 0.2, 0)], 0x2d7896, 0.12)
    addThreeDLabel(scene, 'Axon', new THREE.Vector3(1.45, 0.3, 0.1))
    ;[
      [new THREE.Vector3(-0.4, 0.3, 0), new THREE.Vector3(-1.25, 1.05, 0.2), new THREE.Vector3(-1.9, 1.2, 0.1)],
      [new THREE.Vector3(-0.5, -0.05, 0), new THREE.Vector3(-1.25, -0.9, -0.2), new THREE.Vector3(-1.7, -1.1, -0.1)],
      [new THREE.Vector3(-0.3, 0.45, 0), new THREE.Vector3(-0.8, 1.5, -0.3), new THREE.Vector3(-1.2, 1.85, -0.2)],
    ].forEach((points) => addTube(scene.group, points, 0x4f9b62, 0.07))
    addThreeDLabel(scene, 'Dendrite', new THREE.Vector3(-1.45, 1.35, 0.2))
    return scene
  }

  addMesh(new THREE.SphereGeometry(1.8, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x5aa5b8, transparent: true, opacity: 0.22, roughness: 0.35, transmission: 0.25, side: THREE.DoubleSide }), new THREE.Vector3())
  addMesh(new THREE.SphereGeometry(0.72, 32, 24), new THREE.MeshStandardMaterial({ color: 0x8c5ba8, roughness: 0.42 }), new THREE.Vector3(), 'Nucleus')
  addMesh(new THREE.TorusGeometry(0.8, 0.12, 12, 32), new THREE.MeshStandardMaterial({ color: 0xe6a43b, roughness: 0.4 }), new THREE.Vector3(0.65, 0.65, 0.5), 'Mitochondrion')
  addMesh(new THREE.SphereGeometry(0.32, 24, 16), new THREE.MeshStandardMaterial({ color: 0x4d9b7b, roughness: 0.45 }), new THREE.Vector3(-0.8, 0.55, -0.35), 'Vacuole')
  addThreeDLabel(scene, 'Cell membrane', new THREE.Vector3(0.25, -1.75, 0.2))
  addThreeDLabel(scene, 'Cytoplasm', new THREE.Vector3(-0.55, -0.6, 0.4))
  return scene
}

export const ThreeDExplorerPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemThreeDConfig
  const containerRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const openRef = useRef<(label: string) => void>(() => undefined)
  const [rotation, setRotation] = useState({ x: 0.2, y: -0.4 })
  const [opened, setOpened] = useState<string[]>([])
  const needed = [...new Set(item.requiredLabels.length ? item.requiredLabels : threeDModelPoints(item.model).map((point) => point.label).filter((label): label is string => Boolean(label)))]
  const open = (label: string) => setOpened((current) => { const next = current.includes(label) ? current : [...current, label]; if (needed.every((target) => next.includes(target))) onComplete({ model: item.model, labelsOpened: next }); return next })
  openRef.current = open

  useEffect(() => {
    setRotation({ x: 0.2, y: -0.4 })
    setOpened([])
  }, [item.model, item.requiredLabels])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const width = container.clientWidth || 520
    const height = 330
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0, 7)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-label', `Interactive 3D ${item.model} model`)
    renderer.domElement.setAttribute('role', 'img')
    container.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xe8f5f7, 0x21363e, 2.2))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)
    const modelScene = createThreeDScene(item.model)
    modelScene.group.rotation.set(rotation.x, rotation.y, 0)
    groupRef.current = modelScene.group
    scene.add(modelScene.group)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    const pointerDown = (event: PointerEvent) => { dragging = true; moved = false; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId) }
    const pointerMove = (event: PointerEvent) => { if (!dragging || !groupRef.current) return; moved = moved || Math.hypot(event.clientX - lastX, event.clientY - lastY) > 2; const next = { x: groupRef.current.rotation.x + (event.clientY - lastY) * 0.01, y: groupRef.current.rotation.y + (event.clientX - lastX) * 0.01 }; groupRef.current.rotation.set(next.x, next.y, 0); setRotation(next); lastX = event.clientX; lastY = event.clientY }
    const pointerUp = () => { dragging = false }
    const pointerClick = (event: MouseEvent) => {
      if (moved) { moved = false; return }
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(modelScene.labels.map(({ object }) => object), false)[0]
      if (hit?.object.userData.label) openRef.current(hit.object.userData.label)
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointerleave', pointerUp)
    renderer.domElement.addEventListener('click', pointerClick)
    let frame = 0
    const animate = () => { frame = window.requestAnimationFrame(animate); renderer.render(scene, camera) }
    animate()
    const resizeObserver = new ResizeObserver(() => { const nextWidth = container.clientWidth || 520; camera.aspect = nextWidth / height; camera.updateProjectionMatrix(); renderer.setSize(nextWidth, height) })
    resizeObserver.observe(container)
    return () => { window.cancelAnimationFrame(frame); resizeObserver.disconnect(); renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('pointerleave', pointerUp); renderer.domElement.removeEventListener('click', pointerClick); renderer.dispose(); modelScene.group.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => material.dispose()) } }); container.replaceChildren(); groupRef.current = null }
  }, [item.model])

  useEffect(() => { if (groupRef.current) groupRef.current.rotation.set(rotation.x, rotation.y, 0) }, [rotation])

  return <Stack spacing={1.25}><Typography variant="body2" color="text.secondary">Drag the model to rotate it, then click every label to complete the exploration.</Typography><Box ref={containerRef} role="application" aria-label={`${item.model} 3D explorer`} sx={{ width: '100%', maxWidth: 520, minHeight: 330, alignSelf: 'center', border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', background: 'radial-gradient(circle at 50% 38%, rgba(90, 165, 184, 0.2), transparent 62%), #f4fafb', cursor: 'grab', '&:active': { cursor: 'grabbing' } }} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField type="number" size="small" label="X rotation" value={rotation.x.toFixed(2)} onChange={(event) => setRotation({ ...rotation, x: Number(event.target.value) })} inputProps={{ step: 0.1 }} /><TextField type="number" size="small" label="Y rotation" value={rotation.y.toFixed(2)} onChange={(event) => setRotation({ ...rotation, y: Number(event.target.value) })} inputProps={{ step: 0.1 }} /></Stack><Typography variant="caption" color="text.secondary">Labels opened: {opened.length}/{needed.length}</Typography></Stack>
}

export const PunnettBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemPunnettConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth label="Parent 1 genotype" value={item.parentOne} onChange={(event) => onConfigChange({ ...item, parentOne: event.target.value.replace(/[^A-Za-z]/g, '').slice(0, 2) })} /><TextField fullWidth label="Parent 2 genotype" value={item.parentTwo} onChange={(event) => onConfigChange({ ...item, parentTwo: event.target.value.replace(/[^A-Za-z]/g, '').slice(0, 2) })} /></Stack><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth label="Dominant trait" value={item.dominantTrait} onChange={(event) => onConfigChange({ ...item, dominantTrait: event.target.value })} /><TextField fullWidth label="Recessive trait" value={item.recessiveTrait} onChange={(event) => onConfigChange({ ...item, recessiveTrait: event.target.value })} /></Stack><Typography variant="caption" color="text.secondary">Use two alleles for a single trait, for example Aa and Aa.</Typography></Stack>
}

export const PunnettPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemPunnettConfig
  const one = item.parentOne.slice(0, 2)
  const two = item.parentTwo.slice(0, 2)
  const cells = one.length === 2 && two.length === 2 ? one.split('').flatMap((first) => two.split('').map((second) => `${first}${second}`)) : []
  const dominant = cells.filter((cell) => /[A-Z]/.test(cell)).length / Math.max(1, cells.length) * 100
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswer(''); setStatus(null) }, [one, two])
  const check = () => {
    const correct = cells.length === 4 && Math.abs(Number(answer) - dominant) < 0.001
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ dominantPercent: dominant, genotypes: cells })
  }
  return <Stack spacing={2}><Typography variant="h6">Cross {one || '?'} × {two || '?'}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(70px, 1fr))', maxWidth: 300, gap: 0.75 }}>{cells.map((cell, index) => <Paper key={`${cell}-${index}`} variant="outlined" sx={{ p: 1.5, textAlign: 'center', fontWeight: 800 }}>{cell}</Paper>)}</Box><Typography>What percent of offspring show the dominant trait ({item.dominantTrait || 'dominant phenotype'})?</Typography><TextField type="number" label="Percent" value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ min: 0, max: 100, step: 0.01 }} /><Button variant="contained" disabled={!answer.trim() || cells.length !== 4} onClick={check}>Check answer</Button><StatusText status={status} correct="Correct. Your genetics result has been recorded." incorrect="Not quite. Count the cells containing at least one dominant allele." /></Stack>
}

export const ClassificationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemClassificationConfig
  const updateItem = (id: number, values: Partial<StemClassificationConfig['items'][number]>) => onConfigChange({ ...item, items: item.items.map((entry) => entry.id === id ? { ...entry, ...values } : entry) })
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth label="Categories" value={item.categories.join(', ')} onChange={(event) => onConfigChange({ ...item, categories: [...new Set(event.target.value.split(',').map((value) => value.trim()).filter(Boolean))] })} helperText="Use comma-separated categories." />{item.items.map((entry) => <Stack key={entry.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth size="small" label="Item" value={entry.label} onChange={(event) => updateItem(entry.id, { label: event.target.value })} /><FormControl fullWidth size="small"><InputLabel>Correct category</InputLabel><Select label="Correct category" value={entry.category} onChange={(event) => updateItem(entry.id, { category: event.target.value })}>{item.categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl></Stack>)}<Button size="small" onClick={() => onConfigChange({ ...item, items: [...item.items, { id: Math.max(0, ...item.items.map((entry) => entry.id)) + 1, label: '', category: item.categories[0] ?? '' }] })} sx={{ alignSelf: 'flex-start' }}>Add item</Button></Stack>
}

export const ClassificationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemClassificationConfig
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAssignments({}); setStatus(null) }, [item.items, item.categories])
  const assign = (id: number, category: string) => setAssignments({ ...assignments, [id]: category })
  const check = () => {
    const correct = item.items.length > 0 && item.items.every((entry) => assignments[entry.id] === entry.category)
    setStatus(correct ? 'correct' : 'incorrect')
    if (correct) onComplete({ assignments })
  }
  const unassigned = item.items.filter((entry) => !assignments[entry.id])
  return <Stack spacing={2}><Typography variant="h6">Drag each item into its category</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{unassigned.map((entry) => <Chip key={entry.id} label={entry.label} draggable onDragStart={() => setDraggedId(entry.id)} sx={{ cursor: 'grab' }} />)}</Stack><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(3, Math.max(1, item.categories.length))}, 1fr)` }, gap: 1 }}>{item.categories.map((category) => <Paper key={category} variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId !== null) assign(draggedId, category); setDraggedId(null) }} sx={{ minHeight: 130, p: 1.25, backgroundColor: 'background.default' }}><Typography sx={{ fontWeight: 800, mb: 1 }}>{category}</Typography><Stack spacing={0.75}>{item.items.filter((entry) => assignments[entry.id] === category).map((entry) => <Stack key={entry.id} direction="row" spacing={0.5}><Chip label={entry.label} draggable onDragStart={() => setDraggedId(entry.id)} sx={{ flex: 1, cursor: 'grab' }} /><FormControl size="small"><Select value={category} onChange={(event) => assign(entry.id, event.target.value)}>{item.categories.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</Select></FormControl></Stack>)}</Stack></Paper>)}</Box><Button variant="contained" disabled={Object.keys(assignments).length !== item.items.length} onClick={check}>Check classification</Button><StatusText status={status} correct="Correct. Your classification has been recorded." incorrect="One or more items belong in a different category." /></Stack>
}
