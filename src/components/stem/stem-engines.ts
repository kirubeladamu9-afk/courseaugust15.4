export const normalizeExpression = (value: string) => value
  .replace(/\s+/g, '')
  .replace(/[×·]/g, '*')
  .replace(/÷/g, '/')
  .replace(/−/g, '-')
  .replace(/²/g, '^2')
  .replace(/³/g, '^3')
  .replace(/π/g, 'pi')
  .replace(/^y=/i, '')

const expressionTokens = (source: string) =>
  normalizeExpression(source).match(/\d*\.?\d+|[A-Za-z]+|[()+\-*/^,]/g) ?? []

export const evaluateExpression = (source: string, variables: Record<string, number> = {}) => {
  const normalized = normalizeExpression(source)
  if (!normalized || !/^[0-9A-Za-z+\-*/^().,]+$/.test(normalized)) return Number.NaN

  const tokens = expressionTokens(normalized)
  if (!tokens.length || tokens.join('') !== normalized) return Number.NaN

  let index = 0
  const expression = (): number => {
    let value = term()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++]
      const next = term()
      value = operator === '+' ? value + next : value - next
    }
    return value
  }
  const term = (): number => {
    let value = power()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++]
      const next = power()
      value = operator === '*' ? value * next : value / next
    }
    return value
  }
  const power = (): number => {
    const value = primary()
    return tokens[index] === '^' ? value ** (index += 1, power()) : value
  }
  const primary = (): number => {
    const token = tokens[index++]
    if (token === '-') return -primary()
    if (token === '+') return primary()
    if (token === '(') {
      const value = expression()
      return tokens[index++] === ')' ? value : Number.NaN
    }
    if (!token) return Number.NaN
    if (/^\d/.test(token)) return Number(token)
    if (!/^[A-Za-z]+$/.test(token)) return Number.NaN

    const name = token.toLowerCase()
    if (name === 'pi') return Math.PI
    if (tokens[index] === '(') {
      index += 1
      const value = expression()
      if (tokens[index++] !== ')') return Number.NaN
      if (name === 'sin') return Math.sin(value)
      if (name === 'cos') return Math.cos(value)
      if (name === 'tan') return Math.tan(value)
      if (name === 'sqrt') return Math.sqrt(value)
      if (name === 'abs') return Math.abs(value)
      if (name === 'ln') return Math.log(value)
      if (name === 'log') return Math.log10(value)
      return Number.NaN
    }
    const supplied = variables[token] ?? variables[name]
    return Number.isFinite(supplied) ? supplied : Number.NaN
  }

  const result = expression()
  return index === tokens.length && Number.isFinite(result) ? result : Number.NaN
}

export const graphPoints = (expression: string, minX: number, maxX: number, samples = 360) => {
  const points: Array<{ x: number; y: number }> = []
  for (let index = 0; index <= samples; index += 1) {
    const x = minX + ((maxX - minX) * index) / samples
    const y = evaluateExpression(expression, { x })
    if (Number.isFinite(y) && Math.abs(y) < 1e5) points.push({ x, y })
  }
  return points
}

export const solveLinearEquation = (equation: string) => {
  const parseSide = (value: string) => {
    const source = normalizeExpression(value)
    if (!source || !/^[0-9.x+\-]+$/.test(source)) return null
    return (source.match(/[+-]?[^+-]+/g) ?? []).reduce<{ coefficient: number; constant: number } | null>((total, term) => {
      if (!total) return null
      if (!term.includes('x')) {
        const constant = Number(term)
        return Number.isFinite(constant) ? { ...total, constant: total.constant + constant } : null
      }
      if (term.split('x').length !== 2) return null
      const raw = term.replace('x', '')
      const coefficient = raw === '' || raw === '+' ? 1 : raw === '-' ? -1 : Number(raw)
      return Number.isFinite(coefficient) ? { ...total, coefficient: total.coefficient + coefficient } : null
    }, { coefficient: 0, constant: 0 })
  }

  const [leftValue, rightValue, ...rest] = equation.split('=')
  if (!leftValue || !rightValue || rest.length) return Number.NaN
  const left = parseSide(leftValue)
  const right = parseSide(rightValue)
  if (!left || !right) return Number.NaN
  const coefficient = left.coefficient - right.coefficient
  return Math.abs(coefficient) > 1e-10 ? (right.constant - left.constant) / coefficient : Number.NaN
}

export const projectileMotion = (speed: number, angleDegrees: number, gravity = 9.81) => {
  const angle = (angleDegrees * Math.PI) / 180
  const horizontalVelocity = speed * Math.cos(angle)
  const verticalVelocity = speed * Math.sin(angle)
  const flightSeconds = Math.max(0, (2 * verticalVelocity) / gravity)
  return {
    flightSeconds,
    range: horizontalVelocity * flightSeconds,
    maxHeight: (verticalVelocity ** 2) / (2 * gravity),
    points: Array.from({ length: 81 }, (_, index) => {
      const time = (flightSeconds * index) / 80
      return { x: horizontalVelocity * time, y: Math.max(0, verticalVelocity * time - 0.5 * gravity * time ** 2) }
    }),
  }
}

export const constantForceMotion = (force: number, mass: number, seconds: number) => {
  const acceleration = force / mass
  return {
    acceleration,
    finalVelocity: acceleration * seconds,
    displacement: 0.5 * acceleration * seconds ** 2,
  }
}

export type LabScenario = 'pendulum' | 'neutralization' | 'osmosis'

export const labEquipmentFor = (scenario: LabScenario) => {
  if (scenario === 'pendulum') return ['stand', 'string', 'mass', 'stopwatch']
  if (scenario === 'neutralization') return ['beaker', 'burette', 'indicator', 'stirrer']
  return ['beaker', 'membrane', 'solution', 'microscope']
}

export const runLabScenario = (scenario: LabScenario, values: Record<string, number>) => {
  if (scenario === 'pendulum') {
    const length = values.length ?? 1
    return { metric: 'Period', value: 2 * Math.PI * Math.sqrt(length / 9.81), unit: 's', detail: `A ${length} m pendulum has a period predicted by T = 2π√(L/g).` }
  }
  if (scenario === 'neutralization') {
    const acidMoles = (values.acidMolarity ?? 0.1) * (values.acidVolume ?? 25) / 1000
    const baseMoles = (values.baseMolarity ?? 0.1) * (values.baseVolume ?? 25) / 1000
    const excess = acidMoles - baseMoles
    return { metric: 'Outcome', value: Math.abs(excess) * 1000, unit: 'mmol excess', detail: Math.abs(excess) < 1e-9 ? 'Neutralization endpoint reached.' : excess > 0 ? 'Acid remains in excess.' : 'Base remains in excess.' }
  }
  const inside = values.insideConcentration ?? 0.1
  const outside = values.outsideConcentration ?? 0.3
  const difference = outside - inside
  return { metric: 'Concentration difference', value: Math.abs(difference), unit: 'M', detail: Math.abs(difference) < 1e-9 ? 'The solutions are isotonic.' : difference > 0 ? 'Water moves out of the cell toward the higher external solute concentration.' : 'Water moves into the cell toward the higher internal solute concentration.' }
}

export const solveCircuit = (topology: 'series' | 'parallel', voltage: number, resistors: number[]) => {
  const validResistors = resistors.filter((resistance) => Number.isFinite(resistance) && resistance > 0)
  if (!validResistors.length || !Number.isFinite(voltage)) return null
  const equivalentResistance = topology === 'series'
    ? validResistors.reduce((total, resistance) => total + resistance, 0)
    : 1 / validResistors.reduce((total, resistance) => total + 1 / resistance, 0)
  const totalCurrent = voltage / equivalentResistance
  return {
    equivalentResistance,
    totalCurrent,
    branchCurrents: topology === 'series'
      ? validResistors.map(() => totalCurrent)
      : validResistors.map((resistance) => voltage / resistance),
    voltageDrops: topology === 'series'
      ? validResistors.map((resistance) => totalCurrent * resistance)
      : validResistors.map(() => voltage),
  }
}

export type ThreeDModel = 'cell' | 'dna' | 'neuron'
type Point3D = { x: number; y: number; z: number; label?: string }

export const threeDModelPoints = (model: ThreeDModel): Point3D[] => {
  if (model === 'dna') return Array.from({ length: 22 }, (_, index) => {
    const angle = index * 0.7
    return { x: Math.cos(angle) * 0.9, y: (index - 10.5) / 7, z: Math.sin(angle) * 0.9, label: index % 5 === 0 ? 'Base pair' : undefined }
  })
  if (model === 'neuron') return [
    { x: 0, y: 0, z: 0, label: 'Cell body' }, { x: 1.4, y: 0.3, z: 0.2, label: 'Axon' }, { x: -0.8, y: 1.1, z: 0.5, label: 'Dendrite' }, { x: -1.1, y: -0.9, z: -0.4, label: 'Dendrite' }, { x: 0.1, y: -1.3, z: 0.7, label: 'Dendrite' },
  ]
  return [
    { x: 0, y: 0, z: 0, label: 'Nucleus' }, { x: 0.8, y: 0.4, z: 0.5, label: 'Mitochondrion' }, { x: -0.8, y: 0.6, z: -0.4, label: 'Vacuole' }, { x: 0.3, y: -0.9, z: 0.6, label: 'Cell membrane' }, { x: -0.4, y: -0.7, z: -0.8, label: 'Cytoplasm' },
  ]
}

export const project3DPoint = (point: Point3D, rotation: { x: number; y: number }) => {
  const cosY = Math.cos(rotation.y)
  const sinY = Math.sin(rotation.y)
  const cosX = Math.cos(rotation.x)
  const sinX = Math.sin(rotation.x)
  const x = point.x * cosY - point.z * sinY
  const z = point.x * sinY + point.z * cosY
  const y = point.y * cosX - z * sinX
  const depth = point.y * sinX + z * cosX
  const scale = 1 / (2.8 - depth * 0.35)
  return { x: x * scale, y: y * scale, depth, label: point.label }
}
