import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useRef, useState } from 'react'
import InteractiveHotspotEditor from '@/components/admin/interactive-hotspot-editor'
import InteractiveDiagramViewer from '@/components/course/interactive-diagram-viewer'
import type { StemChemicalEquationConfig, StemClassificationConfig, StemDiagramConfig, StemEmbedConfig, StemFormulaConfig, StemLabConfig, StemLinearEquationConfig, StemPeriodicTableConfig, StemPunnettConfig, StemToolBuilderProps, StemToolPlayerProps } from './stem-types'

const baseFields = <T extends StemLabConfig>(config: T, onChange: (config: T) => void) => <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
  <TextField fullWidth size="small" label="Topic" value={config.topic} onChange={(event) => onChange({ ...config, topic: event.target.value })} />
  <TextField fullWidth size="small" label="Learner instructions" value={config.instructions} onChange={(event) => onChange({ ...config, instructions: event.target.value })} />
</Stack>

const secureUrl = (value: string) => { try { return new URL(value).protocol === 'https:' } catch { return false } }
const cleanFormula = (value: string) => value.replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\s+/g, '')
const formulaRightSide = (formula: string) => formula.includes('=') ? formula.slice(formula.indexOf('=') + 1) : formula
const numberText = (value: number) => Number.isFinite(value) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(value) : '—'
const namedVariables = (formula: string) => [...new Set((cleanFormula(formula).match(/[A-Za-z]+/g) ?? []))]

export const evaluateStemFormula = (formula: string, values: Record<string, number>) => {
  const expression = cleanFormula(formulaRightSide(formula))
  if (!expression || !/^[0-9A-Za-z+\-*/^().]+$/.test(expression)) return Number.NaN
  const tokens = expression.match(/\d*\.?\d+|[A-Za-z]+|[()+\-*/^]/g) ?? []
  if (!tokens.length || tokens.join('') !== expression) return Number.NaN
  let index = 0
  const primary = (): number => {
    const token = tokens[index++]
    if (token === '-') return -primary()
    if (token === '+') return primary()
    if (token === '(') { const value = expressionValue(); return tokens[index++] === ')' ? value : Number.NaN }
    if (!token) return Number.NaN
    if (/^[A-Za-z]+$/.test(token)) return Number.isFinite(values[token]) ? values[token] : Number.NaN
    return Number(token)
  }
  const power = (): number => { const value = primary(); return tokens[index] === '^' ? value ** afterPower() : value }
  const afterPower = (): number => { index += 1; return power() }
  const term = (): number => { let value = power(); while (tokens[index] === '*' || tokens[index] === '/') { const operator = tokens[index++]; const next = power(); value = operator === '*' ? value * next : value / next } return value }
  const expressionValue = (): number => { let value = term(); while (tokens[index] === '+' || tokens[index] === '-') { const operator = tokens[index++]; const next = term(); value = operator === '+' ? value + next : value - next } return value }
  const result = expressionValue()
  return index === tokens.length && Number.isFinite(result) ? result : Number.NaN
}

export const EmbedBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemEmbedConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth size="small" label="Provider" value={item.provider} onChange={(event) => onConfigChange({ ...item, provider: event.target.value })} /><FormControl fullWidth size="small"><InputLabel>Completion rule</InputLabel><Select label="Completion rule" value={item.completionMode} onChange={(event) => onConfigChange({ ...item, completionMode: event.target.value as StemEmbedConfig['completionMode'] })}><MenuItem value="launch_confirm">Learner confirms completed run</MenuItem><MenuItem value="postmessage">Provider sends completion signal</MenuItem></Select></FormControl></Stack><TextField fullWidth required label="HTTPS embed URL" value={item.embedUrl} onChange={(event) => onConfigChange({ ...item, embedUrl: event.target.value })} placeholder="https://provider.example/activity" helperText="Use a provider's direct HTTPS embed URL. The player is sandboxed." /><TextField fullWidth size="small" label="Completion prompt" value={item.completionMessage} onChange={(event) => onConfigChange({ ...item, completionMessage: event.target.value })} />{item.embedUrl && !secureUrl(item.embedUrl) && <Typography variant="caption" color="error">Enter a valid HTTPS URL before publishing.</Typography>}</Stack>
}

export const EmbedPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemEmbedConfig
  const frame = useRef<HTMLIFrameElement>(null)
  const done = useRef(false)
  const finish = () => { if (done.current) return; done.current = true; onComplete({ provider: item.provider, completionMode: item.completionMode }) }
  useEffect(() => {
    if (item.completionMode !== 'postmessage') return
    const receive = (event: MessageEvent) => { if (event.source === frame.current?.contentWindow && event.data && typeof event.data === 'object' && (event.data as { type?: string }).type === 'stem-lab-complete') finish() }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [item.completionMode])
  if (!secureUrl(item.embedUrl)) return <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Your instructor has not added a secure embed URL yet.</Typography></Paper>
  return <Stack spacing={1.5}><Box sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 1.5 }}><Box component="iframe" ref={frame} src={item.embedUrl} title={`${item.provider || 'STEM'} activity`} sandbox="allow-scripts allow-forms allow-popups" referrerPolicy="strict-origin-when-cross-origin" sx={{ display: 'block', width: '100%', minHeight: { xs: 360, md: 520 }, border: 0 }} /></Box>{item.completionMode === 'postmessage' ? <Typography variant="caption" color="text.secondary">Completion is recorded when this embedded provider sends its verified completion signal.</Typography> : <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between"><Typography variant="body2">{item.completionMessage || 'Complete one meaningful run in the activity, then record it here.'}</Typography><Button variant="contained" onClick={finish} startIcon={<CheckCircleOutlineIcon />}>Record completed run</Button></Stack></Paper>}</Stack>
}

export const FormulaBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemFormulaConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Formula" value={item.formula} onChange={(event) => onConfigChange({ ...item, formula: event.target.value })} helperText="Use an equation such as F = m × a. Formula Solver supports linear rearrangement in v1." /><TextField fullWidth required size="small" label="Variable to solve" value={item.solveFor} onChange={(event) => onConfigChange({ ...item, solveFor: event.target.value.replace(/[^A-Za-z]/g, '') })} helperText="Use Result to calculate the formula's right side, or a variable such as m." /></Stack>
}

const formulaResult = (formula: string, target: string, values: Record<string, number>) => {
  const [left, right] = formula.split('=').map((part) => part.trim())
  if (!left || !right) return Number.NaN
  if (target === 'Result' || target === left) return evaluateStemFormula(right, values)
  const residual = (candidate: number) => evaluateStemFormula(left, { ...values, [target]: candidate }) - evaluateStemFormula(right, { ...values, [target]: candidate })
  const zero = residual(0)
  const slope = residual(1) - zero
  return Number.isFinite(zero) && Number.isFinite(slope) && Math.abs(slope) > 1e-10 ? -zero / slope : Number.NaN
}

export const FormulaPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemFormulaConfig
  const target = item.solveFor.trim() || 'Result'
  const variables = namedVariables(item.formula).filter((value) => value !== target && value !== item.formula.split('=')[0]?.trim())
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [recorded, setRecorded] = useState(false)
  useEffect(() => { setInputs(Object.fromEntries(variables.map((variable) => [variable, '']))); setRecorded(false) }, [item.formula, item.solveFor])
  const values = Object.fromEntries(variables.map((variable) => [variable, Number(inputs[variable])]))
  const ready = variables.length > 0 && variables.every((variable) => inputs[variable]?.trim() && Number.isFinite(values[variable]))
  const result = ready ? formulaResult(item.formula, target, values) : Number.NaN
  return <Stack spacing={2}><Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Formula workspace</Typography><Typography variant="h5">{target} = {numberText(result)}</Typography></Paper><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>{variables.map((variable) => <TextField key={variable} type="number" label={variable} value={inputs[variable] ?? ''} onChange={(event) => setInputs({ ...inputs, [variable]: event.target.value })} inputProps={{ step: 'any' }} />)}</Box><Button variant="contained" disabled={!ready || !Number.isFinite(result) || recorded} onClick={() => { setRecorded(true); onComplete({ target, result, values }) }}>{recorded ? 'Calculation recorded' : 'Record calculation'}</Button>{ready && !Number.isFinite(result) && <Typography color="error">This formula cannot solve for {target} in Formula Solver v1.</Typography>}</Stack>
}

const linearSide = (value: string) => {
  const source = value.replace(/\s+/g, '').replace(/−/g, '-')
  if (!source || !/^[0-9.x+\-]+$/.test(source)) return null
  return (source.match(/[+-]?[^+-]+/g) ?? []).reduce<{ coefficient: number; constant: number } | null>((total, term) => {
    if (!total) return null
    if (!term.includes('x')) { const constant = Number(term); return Number.isFinite(constant) ? { ...total, constant: total.constant + constant } : null }
    if (term.split('x').length !== 2) return null
    const raw = term.replace('x', '')
    const coefficient = raw === '' || raw === '+' ? 1 : raw === '-' ? -1 : Number(raw)
    return Number.isFinite(coefficient) ? { ...total, coefficient: total.coefficient + coefficient } : null
  }, { coefficient: 0, constant: 0 })
}

export const solveLinearEquation = (equation: string) => {
  const [leftValue, rightValue, ...rest] = equation.split('=')
  if (!leftValue || !rightValue || rest.length) return Number.NaN
  const left = linearSide(leftValue)
  const right = linearSide(rightValue)
  if (!left || !right) return Number.NaN
  const coefficient = left.coefficient - right.coefficient
  return Math.abs(coefficient) > 1e-10 ? (right.constant - left.constant) / coefficient : Number.NaN
}

export const LinearEquationBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemLinearEquationConfig
  const result = solveLinearEquation(item.equation)
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Linear equation" value={item.equation} onChange={(event) => onConfigChange({ ...item, equation: event.target.value })} helperText="For example 2x + 3 = 11. Equation Solver v1 accepts a single linear x variable." /><Typography color={Number.isFinite(result) ? 'success.main' : 'warning.main'}>{Number.isFinite(result) ? `Solution preview: x = ${numberText(result)}` : 'Enter a solvable linear equation before publishing.'}</Typography></Stack>
}

export const LinearEquationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemLinearEquationConfig
  const solution = solveLinearEquation(item.equation)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswer(''); setStatus(null) }, [item.equation])
  const check = () => { const correct = Number.isFinite(solution) && Math.abs(Number(answer) - solution) < 1e-6; setStatus(correct ? 'correct' : 'incorrect'); if (correct) onComplete({ solution }) }
  return <Stack spacing={2}><Typography variant="h5">Solve: {item.equation}</Typography><TextField type="number" label="x =" value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ step: 'any' }} /><Button variant="contained" disabled={!answer.trim() || !Number.isFinite(solution)} onClick={check}>Check answer</Button>{status && <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? 'Correct. Your solution has been recorded.' : 'Not quite. Check each side and try again.'}</Typography>}</Stack>
}

type Compound = { formula: string; atoms: Record<string, number>; side: 'left' | 'right' }
const atomsFor = (formula: string) => {
  let cursor = 0
  const group = (): Record<string, number> | null => {
    const total: Record<string, number> = {}
    while (cursor < formula.length && formula[cursor] !== ')') {
      if (formula[cursor] === '(') { cursor += 1; const nested = group(); if (!nested || formula[cursor] !== ')') return null; cursor += 1; const countSource = formula.slice(cursor).match(/^\d+/)?.[0] ?? ''; cursor += countSource.length; Object.entries(nested).forEach(([atom, count]) => { total[atom] = (total[atom] ?? 0) + count * (countSource ? Number(countSource) : 1) }); continue }
      const atom = formula.slice(cursor).match(/^[A-Z][a-z]?/)?.[0]
      if (!atom) return null
      cursor += atom.length
      const countSource = formula.slice(cursor).match(/^\d+/)?.[0] ?? ''
      cursor += countSource.length
      total[atom] = (total[atom] ?? 0) + (countSource ? Number(countSource) : 1)
    }
    return total
  }
  const atoms = group()
  return atoms && cursor === formula.length ? atoms : null
}

const equationCompounds = (equation: string): Compound[] | null => {
  const [leftValue, rightValue] = equation.split(/(?:→|->|=)/).map((side) => side.trim())
  if (!leftValue || !rightValue) return null
  const parse = (value: string, side: Compound['side']) => value.split('+').map((formula) => formula.trim()).filter(Boolean).map((formula) => ({ formula, atoms: atomsFor(formula), side }))
  const parsed = [...parse(leftValue, 'left'), ...parse(rightValue, 'right')]
  return parsed.every((item) => item.atoms) ? parsed as Compound[] : null
}

const factorGcd = (first: number, second: number): number => second ? factorGcd(second, first % second) : Math.abs(first)
const factorLcm = (first: number, second: number) => Math.abs(first * second) / Math.max(1, factorGcd(first, second))
const fraction = (value: number) => { for (let denominator = 1; denominator <= 1000; denominator += 1) { const numerator = Math.round(value * denominator); if (Math.abs(value - numerator / denominator) < 1e-8) return { numerator, denominator } }; return { numerator: Math.round(value * 1000), denominator: 1000 } }

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
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Unbalanced equation" value={item.equation} onChange={(event) => onConfigChange({ ...item, equation: event.target.value })} helperText="For example Fe + O2 -> Fe2O3. Parenthesized compounds are supported." /><Typography color={balanceChemicalEquation(item.equation) ? 'success.main' : 'warning.main'}>{balanceChemicalEquation(item.equation) ? 'A valid balance exists.' : 'Enter a valid, balanceable chemical equation before publishing.'}</Typography></Stack>
}

export const ChemicalEquationPlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemChemicalEquationConfig
  const compounds = equationCompounds(item.equation) ?? []
  const solution = balanceChemicalEquation(item.equation)
  const [answers, setAnswers] = useState<string[]>([])
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setAnswers(compounds.map(() => '')); setStatus(null) }, [item.equation])
  if (!solution || !compounds.length) return <Typography color="text.secondary">This equation is not available yet.</Typography>
  const check = () => { const correct = solution.every((value, index) => Number(answers[index]) === value); setStatus(correct ? 'correct' : 'incorrect'); if (correct) onComplete({ coefficients: solution }) }
  return <Stack spacing={2}><Typography variant="h5">Balance: {item.equation}</Typography><Typography color="text.secondary">Enter each smallest whole-number coefficient in equation order.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>{compounds.map((compound, index) => <Stack key={`${compound.formula}-${index}`} direction="row" spacing={1} alignItems="center"><TextField size="small" type="number" label="Coefficient" value={answers[index] ?? ''} onChange={(event) => setAnswers(answers.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))} inputProps={{ min: 1 }} sx={{ width: 130 }} /><Typography>{compound.formula}</Typography></Stack>)}</Box><Button variant="contained" disabled={answers.some((value) => !value)} onClick={check}>Check balance</Button>{status && <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? 'Correct. Your equation has been recorded.' : 'Those coefficients do not balance every element. Try again.'}</Typography>}</Stack>
}

const ELEMENTS = `H|Hydrogen|He|Helium|Li|Lithium|Be|Beryllium|B|Boron|C|Carbon|N|Nitrogen|O|Oxygen|F|Fluorine|Ne|Neon|Na|Sodium|Mg|Magnesium|Al|Aluminium|Si|Silicon|P|Phosphorus|S|Sulfur|Cl|Chlorine|Ar|Argon|K|Potassium|Ca|Calcium|Sc|Scandium|Ti|Titanium|V|Vanadium|Cr|Chromium|Mn|Manganese|Fe|Iron|Co|Cobalt|Ni|Nickel|Cu|Copper|Zn|Zinc|Ga|Gallium|Ge|Germanium|As|Arsenic|Se|Selenium|Br|Bromine|Kr|Krypton|Rb|Rubidium|Sr|Strontium|Y|Yttrium|Zr|Zirconium|Nb|Niobium|Mo|Molybdenum|Tc|Technetium|Ru|Ruthenium|Rh|Rhodium|Pd|Palladium|Ag|Silver|Cd|Cadmium|In|Indium|Sn|Tin|Sb|Antimony|Te|Tellurium|I|Iodine|Xe|Xenon|Cs|Caesium|Ba|Barium|La|Lanthanum|Ce|Cerium|Pr|Praseodymium|Nd|Neodymium|Pm|Promethium|Sm|Samarium|Eu|Europium|Gd|Gadolinium|Tb|Terbium|Dy|Dysprosium|Ho|Holmium|Er|Erbium|Tm|Thulium|Yb|Ytterbium|Lu|Lutetium|Hf|Hafnium|Ta|Tantalum|W|Tungsten|Re|Rhenium|Os|Osmium|Ir|Iridium|Pt|Platinum|Au|Gold|Hg|Mercury|Tl|Thallium|Pb|Lead|Bi|Bismuth|Po|Polonium|At|Astatine|Rn|Radon|Fr|Francium|Ra|Radium|Ac|Actinium|Th|Thorium|Pa|Protactinium|U|Uranium|Np|Neptunium|Pu|Plutonium|Am|Americium|Cm|Curium|Bk|Berkelium|Cf|Californium|Es|Einsteinium|Fm|Fermium|Md|Mendelevium|No|Nobelium|Lr|Lawrencium|Rf|Rutherfordium|Db|Dubnium|Sg|Seaborgium|Bh|Bohrium|Hs|Hassium|Mt|Meitnerium|Ds|Darmstadtium|Rg|Roentgenium|Cn|Copernicium|Nh|Nihonium|Fl|Flerovium|Mc|Moscovium|Lv|Livermorium|Ts|Tennessine|Og|Oganesson`.split('|').reduce<Array<{ number: number; symbol: string; name: string }>>((items, value, index, all) => index % 2 ? items : [...items, { number: index / 2 + 1, symbol: value, name: all[index + 1] }], [])

export const PeriodicTableBuilder: FC<StemToolBuilderProps> = ({ config, onConfigChange }) => {
  const item = config as StemPeriodicTableConfig
  return <Stack spacing={2}>{baseFields(item, onConfigChange)}<TextField fullWidth required label="Target atomic numbers" value={item.targetAtomicNumbers.join(', ')} onChange={(event) => onConfigChange({ ...item, targetAtomicNumbers: [...new Set(event.target.value.split(',').map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 1 && value <= 118))] })} helperText="Comma-separated targets, for example 1, 6, 8." /><Typography variant="caption" color="text.secondary">The learner must identify every configured element from the full 118-element table.</Typography></Stack>
}

export const PeriodicTablePlayer: FC<StemToolPlayerProps> = ({ config, onComplete }) => {
  const item = config as StemPeriodicTableConfig
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null)
  useEffect(() => { setSelected([]); setStatus(null) }, [item.targetAtomicNumbers.join(',')])
  const toggle = (number: number) => setSelected((current) => current.includes(number) ? current.filter((value) => value !== number) : [...current, number])
  const check = () => { const correct = selected.length === item.targetAtomicNumbers.length && selected.every((number) => item.targetAtomicNumbers.includes(number)); setStatus(correct ? 'correct' : 'incorrect'); if (correct) onComplete({ elements: selected }) }
  return <Stack spacing={2}><Typography variant="h6">Select all target elements</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 0.5 }}>{ELEMENTS.map((element) => <Button key={element.number} variant={selected.includes(element.number) ? 'contained' : 'outlined'} onClick={() => toggle(element.number)} title={element.name} sx={{ minWidth: 0, height: 54, flexDirection: 'column', lineHeight: 1.05 }}><Typography component="span" sx={{ fontSize: 10 }}>{element.number}</Typography><Typography component="span" sx={{ fontWeight: 800 }}>{element.symbol}</Typography></Button>)}</Box><Button variant="contained" disabled={!selected.length} onClick={check}>Check selection</Button>{status && <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? 'Correct. Your element selection has been recorded.' : 'Review the element symbols and try again.'}</Typography>}</Stack>
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
  const check = () => { const correct = cells.length === 4 && Math.abs(Number(answer) - dominant) < 0.001; setStatus(correct ? 'correct' : 'incorrect'); if (correct) onComplete({ dominantPercent: dominant, genotypes: cells }) }
  return <Stack spacing={2}><Typography variant="h6">Cross {one || '?'} × {two || '?'}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(70px, 1fr))', maxWidth: 300, gap: 0.75 }}>{cells.map((cell, index) => <Paper key={`${cell}-${index}`} variant="outlined" sx={{ p: 1.5, textAlign: 'center', fontWeight: 800 }}>{cell}</Paper>)}</Box><Typography>What percent of offspring show the dominant trait ({item.dominantTrait || 'dominant phenotype'})?</Typography><TextField type="number" label="Percent" value={answer} onChange={(event) => setAnswer(event.target.value)} inputProps={{ min: 0, max: 100, step: 0.01 }} /><Button variant="contained" disabled={!answer.trim() || cells.length !== 4} onClick={check}>Check answer</Button>{status && <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? 'Correct. Your genetics result has been recorded.' : 'Not quite. Count the cells containing at least one dominant allele.'}</Typography>}</Stack>
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
  const check = () => { const correct = item.items.length > 0 && item.items.every((entry) => assignments[entry.id] === entry.category); setStatus(correct ? 'correct' : 'incorrect'); if (correct) onComplete({ assignments }) }
  const unassigned = item.items.filter((entry) => !assignments[entry.id])
  return <Stack spacing={2}><Typography variant="h6">Drag each item into its category</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{unassigned.map((entry) => <ChipLike key={entry.id} label={entry.label} draggable onDragStart={() => setDraggedId(entry.id)} />)}</Stack><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(3, Math.max(1, item.categories.length))}, 1fr)` }, gap: 1 }}>{item.categories.map((category) => <Paper key={category} variant="outlined" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId !== null) assign(draggedId, category); setDraggedId(null) }} sx={{ minHeight: 130, p: 1.25, backgroundColor: 'background.default' }}><Typography sx={{ fontWeight: 800, mb: 1 }}>{category}</Typography><Stack spacing={0.75}>{item.items.filter((entry) => assignments[entry.id] === category).map((entry) => <ChipLike key={entry.id} label={entry.label} draggable onDragStart={() => setDraggedId(entry.id)} />)}</Stack></Paper>)}</Box><Button variant="contained" disabled={Object.keys(assignments).length !== item.items.length} onClick={check}>Check classification</Button>{status && <Typography color={status === 'correct' ? 'success.main' : 'error'} sx={{ fontWeight: 700 }}>{status === 'correct' ? 'Correct. Your classification has been recorded.' : 'One or more items belong in a different category.'}</Typography>}</Stack>
}

const ChipLike: FC<{ label: string; draggable?: boolean; onDragStart?: () => void }> = ({ label, draggable, onDragStart }) => <Box draggable={draggable} onDragStart={onDragStart} sx={{ display: 'inline-flex', width: 'fit-content', px: 1.25, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.paper', cursor: draggable ? 'grab' : 'default' }}>{label || 'Untitled item'}</Box>

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
